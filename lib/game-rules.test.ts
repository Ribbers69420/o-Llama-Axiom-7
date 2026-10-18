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

test('o-Llama Design Book and Production Bible v1.0 specs contain all 9 sprite rows, 8 expression studies, 8 nominal colors, and 1854-coda mirror', () => {
  assert.equal(OLLAMA_ANIMATIONS.length, 9);
  assert.equal(OLLAMA_EXPRESSION_STUDIES.length, 8);
  assert.equal(NOMINAL_COLORS.length, 8);
  assert.equal(PRODUCTION_BIBLE_SCENES.length, 8);
  const coda = PRODUCTION_BIBLE_SCENES.find((s) => s.sceneId === '1854-coda');
  assert.ok(coda);
  assert.equal(coda.episodeNum, 7);
  assert.equal(coda.chassis, 'A-Coda');
});

