import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAPTER_SCENES,
  CHASSIS_SPECS,
  EXPRESSIONS,
  HITBOX_SPECS,
  SPRITE_SHEET_ROWS,
  calculatePulseDamage,
  checkChapterVictory,
  checkCircleCollision,
  clampDeltaTime,
  evaluateTruthClaimDeterministic,
  stepEnemyAI,
  type EnemyEntity,
} from './game-rules.ts';

test('clampDeltaTime caps large delta steps at 0.05s and handles negative/NaN', () => {
  assert.equal(clampDeltaTime(0.016), 0.016);
  assert.equal(clampDeltaTime(0.25), 0.05);
  assert.equal(clampDeltaTime(-1), 0);
  assert.equal(clampDeltaTime(Number.NaN), 0);
});

test('canonical PIXELVERSE-9 specs include all 8 expressions, 3 chassis, 6 chapters (7 scenes), and 4 hitboxes', () => {
  assert.equal(Object.keys(EXPRESSIONS).length, 8);
  assert.equal(Object.keys(CHASSIS_SPECS).length, 3);
  assert.equal(CHAPTER_SCENES.length, 6);
  const allSceneIds = CHAPTER_SCENES.flatMap((c) => c.sceneIds);
  assert.deepEqual(allSceneIds, ['1854', '1856', '1866', '1952', '1852', '1911', '499']);
  assert.equal(HITBOX_SPECS.length, 4);
  assert.equal(SPRITE_SHEET_ROWS.length, 9);
});

test('calculatePulseDamage respects chassis radius and EX-02 FOCUSED range boost', () => {
  const normalMiss = calculatePulseDamage('tank', 'EX-01', 6.8);
  assert.equal(normalMiss.hit, false);

  const focusedHit = calculatePulseDamage('tank', 'EX-02', 6.8);
  assert.equal(focusedHit.hit, true);
  assert.equal(focusedHit.isCrit, true);
  assert.ok(focusedHit.damage > 0);
});

test('checkCircleCollision detects overlapping actors accurately', () => {
  assert.equal(checkCircleCollision(0, 0, 1.5, 2.0, 0, 1.0), true);
  assert.equal(checkCircleCollision(0, 0, 1.0, 5.0, 0, 1.0), false);
});

test('stepEnemyAI transitions swarmer into windup telegraph when near player', () => {
  const swarmer: EnemyEntity = {
    id: 'e1',
    archetype: 'swarmer',
    x: 2.0,
    z: 0,
    vx: 0,
    vz: 0,
    hp: 60,
    maxHp: 60,
    radius: 0.9,
    state: 'patrol',
    timer: 0,
    targetX: 0,
    targetZ: 0,
    hitFlash: 0,
    koProgress: 0,
    zigzagPhase: 0,
  };

  const result = stepEnemyAI(swarmer, 0, 0, 0.03, true);
  assert.equal(result.enemy.state, 'windup');
  assert.ok(result.enemy.timer > 0.35);
});

test('checkChapterVictory triggers only when both tome and purge targets are met', () => {
  assert.equal(
    checkChapterVictory({ tomesCollected: 3, targetTomes: 3, purgesCount: 4, targetPurges: 4 }),
    true
  );
  assert.equal(
    checkChapterVictory({ tomesCollected: 2, targetTomes: 3, purgesCount: 4, targetPurges: 4 }),
    false
  );
});

test('evaluateTruthClaimDeterministic verifies canonical truths and rejects fallacies', () => {
  const trueClaim = CHAPTER_SCENES[0].claims[0].statement;
  const resTrue = evaluateTruthClaimDeterministic(trueClaim, 0);
  assert.equal(resTrue.verdict, 'TRUE');
  assert.equal(resTrue.recommendedExpression, 'EX-06');
  assert.equal(resTrue.thinkingSteps.length, 5);

  const falseClaim = CHAPTER_SCENES[0].claims[1].statement;
  const resFalse = evaluateTruthClaimDeterministic(falseClaim, 0);
  assert.equal(resFalse.verdict, 'FALSE');
  assert.equal(resFalse.recommendedExpression, 'EX-05');
});

import {
  NOMINAL_COLORS,
  OLLAMA_ANIMATIONS,
  OLLAMA_EXPRESSION_STUDIES,
  PRODUCTION_BIBLE_SCENES,
} from './ollama-bible-spec.ts';

test('o-Llama Design Book and Production Bible v1.0 specs contain all 9 sprite rows, 14 o-Llama-Axiom poses, 8 nominal colors, and 1854-coda mirror', () => {
  assert.equal(OLLAMA_ANIMATIONS.length, 9);
  assert.equal(OLLAMA_EXPRESSION_STUDIES.length, 14);
  assert.equal(NOMINAL_COLORS.length, 8);
  assert.equal(PRODUCTION_BIBLE_SCENES.length, 8);
  const coda = PRODUCTION_BIBLE_SCENES.find((s) => s.sceneId === '1854-coda');
  assert.ok(coda);
  assert.equal(coda.episodeNum, 7);
  assert.equal(coda.chassis, 'A-Coda');
});

import {
  benchmarkRustWasmKernel,
  computeWasmPulseDamage,
  getRustWasmKernel,
  verifyClaimOfflineWithRustWasm,
} from './rust-wasm-kernel.ts';
import {
  executeOfflineSqlQuery,
  insertTelemetryLogRow,
  PRESET_SQL_QUERIES,
} from './sql-truth-engine.ts';

test('Rust/WASM kernel binary instantiates and executes all 4 #[no_mangle] FFI exports deterministically', () => {
  const kernel = getRustWasmKernel();
  // Tank (0), EX-01 (1), 200cm -> within 520cm radius -> 38 + (320 / 25) = 50
  assert.equal(kernel.compute_pulse_damage(0, 1, 200), 50);
  // Out of range (600cm > 520cm for EX-01) -> 0
  assert.equal(kernel.compute_pulse_damage(0, 1, 600), 0);
  // In range with EX-02 FOCUSED (+25% radius -> 650cm) -> 38 + (50 / 25) = 40
  assert.equal(kernel.compute_pulse_damage(0, 2, 600), 40);

  // 4-Pillar weighted confidence: (100*28 + 100*27 + 100*25 + 100*20)/100 = 100
  assert.equal(kernel.verify_claim_confidence(100, 100, 100, 100), 100);
  assert.equal(kernel.verify_claim_confidence(90, 80, 70, 60), 76);

  // 24fps stepped quantization: 125ms -> frame 3 -> 125ms; 100ms -> frame 2 -> 83ms
  assert.equal(kernel.quantize_stepped_24fps_ms(125), 125);
  assert.equal(kernel.quantize_stepped_24fps_ms(100), 83);

  // Circle collision in cm
  assert.equal(kernel.check_circle_collision_cm(0, 0, 30, 40, 50), 1);
  assert.equal(kernel.check_circle_collision_cm(0, 0, 30, 40, 49), 0);

  const highLevel = computeWasmPulseDamage('cosmic', 'EX-02', 3.0);
  assert.equal(highLevel.hit, true);
  assert.ok(highLevel.damage > 65);

  const offlineClaim = verifyClaimOfflineWithRustWasm(
    'o-Llama AXIOM-7 verifies truth across FACTS, EVIDENCE, DATA, and REALITY at 24fps.'
  );
  assert.equal(offlineClaim.verdict, 'TRUE');
  assert.ok(offlineClaim.confidence >= 90);

  const bench = benchmarkRustWasmKernel(1000);
  assert.ok(bench.wasmByteLength > 100);
});

test('Offline Relational SQL Engine executes SELECT, WHERE, GROUP BY, SHOW TABLES, and INSERT INTO', () => {
  const showTables = executeOfflineSqlQuery('SHOW TABLES');
  assert.equal(showTables.rowCount, 4);

  const posesRes = executeOfflineSqlQuery(PRESET_SQL_QUERIES[0].sql);
  assert.equal(posesRes.rowCount, 14);
  assert.equal(posesRes.rows[0].filename, 'o-Llama-Axiom-01-Nysgerrig.png');

  const groupRes = executeOfflineSqlQuery(PRESET_SQL_QUERIES[1].sql);
  assert.equal(groupRes.rowCount, 4);

  const whereRes = executeOfflineSqlQuery(PRESET_SQL_QUERIES[2].sql);
  assert.ok(whereRes.rowCount >= 6);
  assert.ok(whereRes.rows.every((r) => r.verdict === 'TRUE'));

  const beforeLogs = executeOfflineSqlQuery('SELECT * FROM telemetry_logs').rowCount;
  insertTelemetryLogRow({
    chapter_id: 'Chapter 1',
    chassis: 'tank',
    expression_code: 'EX-01',
    pulse_damage: 50,
    wasm_confidence: 97,
    fps_quantized_ms: 125,
    mode: 'OFFLINE_WASM',
  });
  const afterLogs = executeOfflineSqlQuery('SELECT * FROM telemetry_logs').rowCount;
  assert.equal(afterLogs, beforeLogs + 1);
});

import {
  computeCrc32,
  decodeHamming74Nibble,
  encodeHamming74Nibble,
  encodePayloadWithEcc,
  formatCrc32Hex,
  getEccBackupVaultSlots,
  injectCorruptionIntoSlot,
  restoreSqlDatabaseFromSlot,
  runEccScanAndRepair,
  SAMPLE_DATASET_PRESETS,
  saveDataToEccSlot,
  verifyAndCorrectEccFrame,
} from './ecc-storage-vault.ts';

test('ECC Storage & Backup Vault: CRC-32, Hamming(7,4) SEC-DED, fault injection, self-healing, and small/medium dataset saves', () => {
  // 1. Hamming(7,4) round-trip and single-bit error correction across all 16 nibbles (0..15)
  for (let nibble = 0; nibble < 16; nibble++) {
    const encoded = encodeHamming74Nibble(nibble);
    const clean = decodeHamming74Nibble(encoded);
    assert.equal(clean.nibble, nibble);
    assert.equal(clean.corrected, false);

    // Flip each of the 7 codeword bits (bit 0..6) and verify automatic correction
    for (let bit = 0; bit < 7; bit++) {
      const flipped = encoded ^ (1 << bit);
      const recovered = decodeHamming74Nibble(flipped);
      assert.equal(recovered.nibble, nibble);
      assert.equal(recovered.corrected, true);
      assert.ok(recovered.syndrome >= 1 && recovered.syndrome <= 7);
    }
  }

  // 2. Encode payload with ECC, corrupt multiple bytes, and verify deterministic self-healing
  const originalJson = JSON.stringify({
    unit: 'o-Llama AXIOM-7',
    pillars: ['FACTS', 'EVIDENCE', 'DATA', 'REALITY'],
    integrity: 99.8,
    notes: 'Testing 64-byte sector CRC-32 and parity mirror reconstruction across blocks.',
  });
  const frame = encodePayloadWithEcc(originalJson);
  assert.equal(frame.crc32Hex, formatCrc32Hex(computeCrc32(originalJson)));
  assert.ok(frame.blocks.length >= 2);

  // Healthy verification
  const healthyReport = verifyAndCorrectEccFrame(frame, 'TEST-SLOT', 'Test');
  assert.equal(healthyReport.status, 'HEALTHY');
  assert.equal(healthyReport.corruptedBlockIndices.length, 0);

  // Corrupt primaryPayload in block 0 and block 1
  const corruptedFrame = {
    ...frame,
    primaryPayload:
      'CORRUPTED_HEAD!!' + frame.primaryPayload.slice(16),
  };
  const repairedReport = verifyAndCorrectEccFrame(corruptedFrame, 'TEST-SLOT', 'Test');
  assert.equal(repairedReport.status, 'REPAIRED');
  assert.ok(repairedReport.corruptedBlockIndices.includes(0));
  assert.ok(repairedReport.repairedBytesCount >= 5);
  assert.equal(repairedReport.restoredPayload, originalJson);

  // 3. Save Small (~2 KB) and Medium (~48 KB) datasets into the Backup Vault, inject fault, and heal
  const initialSlots = getEccBackupVaultSlots();
  assert.ok(initialSlots.length >= 2);

  const mediumPayload = SAMPLE_DATASET_PRESETS[2].generatePayload();
  assert.ok(mediumPayload.length > 30000); // > 30 KB medium dataset
  const savedMediumSlot = saveDataToEccSlot({
    label: 'Medium 350-Row Telemetry Archive',
    category: 'CUSTOM_DATASET',
    payload: mediumPayload,
  });
  assert.equal(savedMediumSlot.lastScanStatus, 'HEALTHY');
  assert.ok(savedMediumSlot.blockCount > 450);

  // Inject bit-flip corruption into the newly saved medium slot
  const faultRes = injectCorruptionIntoSlot(savedMediumSlot.slotId);
  assert.ok(faultRes.corruptedBlockIndices.length >= 1);
  assert.notEqual(faultRes.corruptedCrc32Hex, savedMediumSlot.crc32Hex);

  // Run ECC Scan & Auto-Repair on the corrupted slot
  const healReports = runEccScanAndRepair(savedMediumSlot.slotId);
  assert.equal(healReports.length, 1);
  assert.equal(healReports[0].status, 'REPAIRED');
  assert.equal(healReports[0].restoredPayload, mediumPayload);

  // Restore SQL Database from SLOT-01
  const restoreRes = restoreSqlDatabaseFromSlot('SLOT-01');
  assert.equal(restoreRes.restored, true);
});

import { getChapterTruthScoreTrends } from './sql-truth-engine.ts';
import { runCheckpointErrorCorrectionSession } from './ecc-storage-vault.ts';

test('Telemetry Dashboard & Checkpoint Error Correction / Debugging Session across internal ECC bus', () => {
  const trendsBefore = getChapterTruthScoreTrends();
  assert.equal(trendsBefore.length, 6);
  assert.equal(trendsBefore[0].chapterId, 'Chapter 1');
  assert.equal(trendsBefore[5].chapterNumber, 6);
  assert.equal(trendsBefore[5].chapterId, 'Side Story');
  for (const pt of trendsBefore) {
    assert.ok(pt.truthScore >= 1000);
    assert.ok(pt.baselineScore >= 1000);
  }

  const debugSession = runCheckpointErrorCorrectionSession({
    chapterNumber: 4,
    chassis: 'tank',
    expressionCode: 'EX-01',
  });
  assert.equal(debugSession.stages.length, 5);
  assert.equal(debugSession.initialCrc32Hex, debugSession.restoredCrc32Hex);
  assert.notEqual(debugSession.initialCrc32Hex, debugSession.corruptedCrc32Hex);
  assert.ok(debugSession.corruptedSectors.length >= 1);
  assert.ok(debugSession.repairedBytesCount >= 1);
  assert.ok(debugSession.hammingSyndromeCode >= 1 && debugSession.hammingSyndromeCode <= 7);
});

import {
  AXIOM_KERNEL_EXPECTED_ABI,
  AXIOM_RELEASE_VERSION,
  getSystemProgramsRegistry,
  installAndVerifyLatestStableSystems,
} from './system-package-manager.ts';

test('System & Program Package Manager v2.4.0-stable verifies all 8 subsystems and Rust/WASM ABI 20400', () => {
  const registry = getSystemProgramsRegistry();
  assert.equal(registry.length, 8);
  assert.equal(registry[0].id, 'SYS-01');
  assert.equal(registry[7].id, 'SYS-08');

  const report = installAndVerifyLatestStableSystems();
  assert.equal(report.releaseTag, AXIOM_RELEASE_VERSION);
  assert.equal(report.totalProgramsUpdated, 8);
  assert.equal(report.kernelAbiVerified, AXIOM_KERNEL_EXPECTED_ABI);
  assert.equal(report.sqlTablesVerified, 4);
  assert.equal(report.allCrc32Intact, true);
  assert.ok(report.programs.every((p) => p.status === 'UPDATED_AND_LOCKED'));
});

test('End-to-End 6-Chapter Campaign Simulation: Title -> Chapter 1..6 -> Victory -> SQL Telemetry -> ECC Vault Checkpoint', () => {
  const clearedChapters: number[] = [];
  let totalScore = 0;

  for (let chIdx = 0; chIdx < CHAPTER_SCENES.length; chIdx++) {
    const ch = CHAPTER_SCENES[chIdx];
    const chassis = ch.recommendedChassis;
    const expression = ch.defaultExpression;

    // 1. Collect all Chapter Truth Tomes
    let tomesCollected = 0;
    for (let t = 0; t < ch.targetTomes; t++) {
      tomesCollected += 1;
      totalScore += 200;
    }

    // 2. Verify all Chapter Claims via deterministic 4-Pillar Truth Matrix & Rust/WASM FFI
    for (const claim of ch.claims) {
      const detRes = evaluateTruthClaimDeterministic(claim.statement, chIdx);
      assert.equal(detRes.verdict, claim.expectedVerdict);
      const wasmRes = verifyClaimOfflineWithRustWasm(claim.statement);
      assert.ok(wasmRes.confidence >= 0 && wasmRes.confidence <= 100);
      totalScore += 250;
    }

    // 3. Spawn & Purge all Chapter Misinformation Anomalies using stepEnemyAI + computeWasmPulseDamage
    let purgesCount = 0;
    for (let eIdx = 0; eIdx < ch.targetPurges; eIdx++) {
      let enemy: EnemyEntity = {
        id: `sim-enemy-${chIdx}-${eIdx}`,
        archetype: eIdx % 3 === 0 ? 'swarmer' : eIdx % 3 === 1 ? 'emitter' : 'charger',
        x: 2.5,
        z: 1.5,
        vx: 0,
        vz: 0,
        hp: 80,
        maxHp: 80,
        radius: 0.9,
        state: 'patrol',
        timer: 0.5,
        targetX: 0,
        targetZ: 0,
        hitFlash: 0,
        koProgress: 0,
        zigzagPhase: 0,
      };

      // Step AI once
      const aiStep = stepEnemyAI(enemy, 0, 0, 0.033, true);
      enemy = aiStep.enemy;

      // Apply Rust/WASM Pulse Scan until enemy is purged
      let pulses = 0;
      while (enemy.hp > 0 && pulses < 10) {
        pulses += 1;
        const dist = Math.hypot(enemy.x, enemy.z);
        const dmg = computeWasmPulseDamage(chassis, expression, Math.min(dist, 2.0));
        assert.equal(dmg.hit, true);
        enemy.hp -= dmg.damage;
      }
      assert.ok(enemy.hp <= 0);
      purgesCount += 1;
      totalScore += 150;
    }

    // 4. Verify Chapter Victory Condition
    const isVictory = checkChapterVictory({
      tomesCollected,
      targetTomes: ch.targetTomes,
      purgesCount,
      targetPurges: ch.targetPurges,
    });
    assert.equal(isVictory, true);
    clearedChapters.push(chIdx);

    // 5. Log Chapter Telemetry to Offline SQL & Auto-Save ECC Checkpoint
    const logRow = insertTelemetryLogRow({
      chapter_id: ch.chapterLabel,
      chassis,
      expression_code: expression,
      pulse_damage: CHASSIS_SPECS[chassis].pulseDamage,
      wasm_confidence: 99,
      fps_quantized_ms: 42,
      mode: 'OFFLINE_WASM',
    });
    assert.equal(logRow.chapter_id, ch.chapterLabel);

    const slot = saveDataToEccSlot({
      slotId: 'SLOT-02',
      label: `Auto-Save · ${ch.chapterLabel} (${clearedChapters.length}/6 Cleared)`,
      category: 'GAME_CHECKPOINT',
      payload: JSON.stringify({
        chapterCleared: ch.chapterLabel,
        clearedCount: clearedChapters.length,
        totalScore,
      }),
    });
    assert.equal(slot.lastScanStatus, 'HEALTHY');
  }

  // Verify all 6 chapters cleared and reflected in D3 Telemetry Trends
  assert.equal(clearedChapters.length, 6);
  assert.ok(totalScore >= 8000);
  const updatedTrends = getChapterTruthScoreTrends();
  assert.equal(updatedTrends.length, 6);
  assert.ok(updatedTrends.every((t) => t.truthScore >= t.baselineScore));
});






