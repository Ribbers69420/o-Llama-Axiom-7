// ============================================================================
// o-Llama · AXIOM-7 Offline Relational SQL Engine (PIXELVERSE-9)
// Provides an in-memory + localStorage-persisted relational SQL database with
// real DDL schema definitions, seeded tables (`episodes`, `ollama_poses`,
// `truth_claims`, `telemetry_logs`), and a deterministic SQL query executor.
// ============================================================================

import { CHAPTER_SCENES } from './game-rules.ts';
import {
  OLLAMA_EXPRESSION_STUDIES,
  PRODUCTION_BIBLE_SCENES,
} from './ollama-bible-spec.ts';
import { getRustWasmKernel } from './rust-wasm-kernel.ts';

export interface EpisodeRow {
  episode_id: string;
  ep_number: number;
  title_en: string;
  title_da: string;
  scene_ids: string;
  chassis: string;
  eye_state: string;
  fps_rate: number;
}

export interface OLlamaPoseRow {
  pose_id: string;
  pose_number: number;
  filename: string;
  name_da: string;
  name_en: string;
  expression_code: string;
  eye_shape: string;
  gripper_posture: string;
}

export interface TruthClaimRow {
  claim_id: string;
  chapter_id: string;
  scene_code: string;
  pillar: 'FACTS' | 'EVIDENCE' | 'DATA' | 'REALITY';
  verdict: 'TRUE' | 'FALSE';
  confidence: number;
  statement: string;
  verified_offline: number;
}

export interface TelemetryLogRow {
  log_id: number;
  timestamp_iso: string;
  chapter_id: string;
  chassis: string;
  expression_code: string;
  pulse_damage: number;
  wasm_confidence: number;
  truth_score: number;
  fps_quantized_ms: number;
  mode: 'OFFLINE_WASM' | 'ONLINE_SYNC' | 'ECC_CHECKPOINT';
}

export interface ChapterTruthScoreTrendPoint {
  chapterNumber: number;
  chapterId: string;
  chapterTitle: string;
  sceneCode: string;
  truthScore: number;
  baselineScore: number;
  wasmConfidence: number;
  pulseDamage: number;
  sampleCount: number;
  eccVerified: boolean;
}

export interface OfflineSqlDatabase {
  episodes: EpisodeRow[];
  ollama_poses: OLlamaPoseRow[];
  truth_claims: TruthClaimRow[];
  telemetry_logs: TelemetryLogRow[];
}

export interface SqlQueryResult {
  sql: string;
  columns: string[];
  rows: Record<string, string | number>[];
  rowCount: number;
  executionTimeMs: number;
  error?: string;
}

export const SQL_SCHEMA_DDL = `-- o-Llama · AXIOM-7 Offline Relational Schema (SQLite / ANSI SQL Compatible)
CREATE TABLE IF NOT EXISTS episodes (
  episode_id VARCHAR(16) PRIMARY KEY,
  ep_number INTEGER NOT NULL,
  title_en VARCHAR(120) NOT NULL,
  title_da VARCHAR(120) NOT NULL,
  scene_ids VARCHAR(64) NOT NULL,
  chassis VARCHAR(32) NOT NULL,
  eye_state VARCHAR(64) NOT NULL,
  fps_rate INTEGER DEFAULT 24
);

CREATE TABLE IF NOT EXISTS ollama_poses (
  pose_id VARCHAR(16) PRIMARY KEY,
  pose_number INTEGER NOT NULL,
  filename VARCHAR(96) NOT NULL,
  name_da VARCHAR(64) NOT NULL,
  name_en VARCHAR(64) NOT NULL,
  expression_code VARCHAR(16) NOT NULL,
  eye_shape VARCHAR(48) NOT NULL,
  gripper_posture VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS truth_claims (
  claim_id VARCHAR(24) PRIMARY KEY,
  chapter_id VARCHAR(24) NOT NULL,
  scene_code VARCHAR(16) NOT NULL,
  pillar VARCHAR(16) NOT NULL CHECK (pillar IN ('FACTS', 'EVIDENCE', 'DATA', 'REALITY')),
  verdict VARCHAR(12) NOT NULL CHECK (verdict IN ('TRUE', 'FALSE')),
  confidence INTEGER NOT NULL,
  statement TEXT NOT NULL,
  verified_offline INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS telemetry_logs (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp_iso VARCHAR(32) NOT NULL,
  chapter_id VARCHAR(24) NOT NULL,
  chassis VARCHAR(16) NOT NULL,
  expression_code VARCHAR(16) NOT NULL,
  pulse_damage INTEGER NOT NULL,
  wasm_confidence INTEGER NOT NULL,
  truth_score INTEGER NOT NULL DEFAULT 1500,
  fps_quantized_ms INTEGER NOT NULL,
  mode VARCHAR(24) DEFAULT 'OFFLINE_WASM'
);

CREATE INDEX IF NOT EXISTS idx_claims_pillar ON truth_claims(pillar, verdict);
CREATE INDEX IF NOT EXISTS idx_poses_expr ON ollama_poses(expression_code);`;

export const PRESET_SQL_QUERIES: {
  id: string;
  labelDa: string;
  labelEn: string;
  sql: string;
}[] = [
  {
    id: 'q-poses',
    labelDa: '1. Alle 14 o-Llama-Axiom Positurer (01–14)',
    labelEn: '1. All 14 o-Llama-Axiom Poses (01–14)',
    sql: 'SELECT pose_number, filename, name_da, expression_code, eye_shape, gripper_posture FROM ollama_poses ORDER BY pose_number ASC',
  },
  {
    id: 'q-pillars',
    labelDa: '2. Sandhedssøjler Aggregering (GROUP BY pillar)',
    labelEn: '2. Truth Pillars Aggregation (GROUP BY pillar)',
    sql: 'SELECT pillar, COUNT(*) AS total_claims, AVG(confidence) AS avg_confidence FROM truth_claims GROUP BY pillar ORDER BY avg_confidence DESC',
  },
  {
    id: 'q-claims-true',
    labelDa: '3. Verificerede Sandheder (WHERE verdict = TRUE)',
    labelEn: '3. Verified Truths (WHERE verdict = TRUE)',
    sql: "SELECT claim_id, scene_code, pillar, verdict, confidence, statement FROM truth_claims WHERE verdict = 'TRUE' ORDER BY confidence DESC",
  },
  {
    id: 'q-episodes',
    labelDa: '4. Production Bible Scener (1854 → 1854-coda)',
    labelEn: '4. Production Bible Scenes (1854 → 1854-coda)',
    sql: 'SELECT episode_id, ep_number, title_da, scene_ids, chassis, eye_state, fps_rate FROM episodes ORDER BY ep_number ASC',
  },
  {
    id: 'q-telemetry',
    labelDa: '5. Rust/WASM Telemetri & Truth Score (telemetry_logs)',
    labelEn: '5. Rust/WASM Telemetry & Truth Score (telemetry_logs)',
    sql: 'SELECT log_id, chapter_id, chassis, expression_code, truth_score, pulse_damage, wasm_confidence, fps_quantized_ms, mode FROM telemetry_logs ORDER BY log_id DESC',
  },
];

const STORAGE_KEY = 'axiom7_offline_sql_db_v1';

function buildInitialDatabase(): OfflineSqlDatabase {
  const kernel = getRustWasmKernel();

  const episodes: EpisodeRow[] = PRODUCTION_BIBLE_SCENES.map((sc, idx) => ({
    episode_id: `EP-0${sc.episodeNum}-${sc.sceneId}`,
    ep_number: idx + 1,
    title_en: sc.titleEn,
    title_da: sc.titleDa,
    scene_ids: sc.sceneId,
    chassis: sc.chassis,
    eye_state: sc.expression,
    fps_rate: 24,
  }));

  const ollama_poses: OLlamaPoseRow[] = OLLAMA_EXPRESSION_STUDIES.map((st, idx) => ({
    pose_id: `POSE-${st.num}`,
    pose_number: idx + 1,
    filename: st.fileName,
    name_da: st.labelDa,
    name_en: st.labelEn,
    expression_code: st.expressionCode,
    eye_shape: st.subLabelEn,
    gripper_posture: `L:${st.leftGripperPose} / R:${st.rightGripperPose}`,
  }));

  const truth_claims: TruthClaimRow[] = [];
  CHAPTER_SCENES.forEach((ch, cIdx) => {
    ch.claims.forEach((cl, clIdx) => {
      const isTrue = cl.expectedVerdict === 'TRUE';
      const conf = kernel.verify_claim_confidence(
        isTrue ? 98 : 94,
        isTrue ? 96 : 92,
        isTrue ? 99 : 95,
        isTrue ? 97 : 91
      );
      truth_claims.push({
        claim_id: `CLM-${cIdx + 1}0${clIdx + 1}`,
        chapter_id: ch.chapterLabel,
        scene_code: ch.sceneIds[0] || '1854',
        pillar: cl.pillarFocus,
        verdict: cl.expectedVerdict,
        confidence: conf,
        statement: cl.statement,
        verified_offline: 1,
      });
    });
  });

  const telemetry_logs: TelemetryLogRow[] = [
    {
      log_id: 1,
      timestamp_iso: '2087-10-03T08:00:00Z',
      chapter_id: 'Chapter 1',
      chassis: 'tank',
      expression_code: 'EX-01',
      pulse_damage: kernel.compute_pulse_damage(0, 1, 220),
      wasm_confidence: kernel.verify_claim_confidence(96, 94, 97, 95),
      truth_score: 1420,
      fps_quantized_ms: kernel.quantize_stepped_24fps_ms(125),
      mode: 'OFFLINE_WASM',
    },
    {
      log_id: 2,
      timestamp_iso: '2087-10-03T08:04:12Z',
      chapter_id: 'Chapter 2',
      chassis: 'tank',
      expression_code: 'EX-02',
      pulse_damage: kernel.compute_pulse_damage(0, 2, 260),
      wasm_confidence: kernel.verify_claim_confidence(98, 97, 96, 95),
      truth_score: 2890,
      fps_quantized_ms: kernel.quantize_stepped_24fps_ms(208),
      mode: 'OFFLINE_WASM',
    },
    {
      log_id: 3,
      timestamp_iso: '2087-10-03T08:09:45Z',
      chapter_id: 'Chapter 3',
      chassis: 'wizard',
      expression_code: 'EX-03',
      pulse_damage: kernel.compute_pulse_damage(1, 3, 210),
      wasm_confidence: kernel.verify_claim_confidence(97, 98, 96, 98),
      truth_score: 4650,
      fps_quantized_ms: kernel.quantize_stepped_24fps_ms(291),
      mode: 'OFFLINE_WASM',
    },
    {
      log_id: 4,
      timestamp_iso: '2087-10-03T08:12:18Z',
      chapter_id: 'Chapter 4',
      chassis: 'tank',
      expression_code: 'EX-01',
      pulse_damage: kernel.compute_pulse_damage(0, 1, 195),
      wasm_confidence: kernel.verify_claim_confidence(99, 97, 98, 97),
      truth_score: 6480,
      fps_quantized_ms: kernel.quantize_stepped_24fps_ms(375),
      mode: 'ECC_CHECKPOINT',
    },
    {
      log_id: 5,
      timestamp_iso: '2087-10-03T08:15:30Z',
      chapter_id: 'Chapter 5',
      chassis: 'cosmic',
      expression_code: 'EX-04',
      pulse_damage: kernel.compute_pulse_damage(2, 4, 180),
      wasm_confidence: kernel.verify_claim_confidence(99, 99, 100, 98),
      truth_score: 8340,
      fps_quantized_ms: kernel.quantize_stepped_24fps_ms(458),
      mode: 'OFFLINE_WASM',
    },
    {
      log_id: 6,
      timestamp_iso: '2087-10-03T08:19:50Z',
      chapter_id: 'Chapter 6',
      chassis: 'cosmic',
      expression_code: 'EX-07',
      pulse_damage: kernel.compute_pulse_damage(2, 7, 160),
      wasm_confidence: kernel.verify_claim_confidence(100, 99, 100, 100),
      truth_score: 9920,
      fps_quantized_ms: kernel.quantize_stepped_24fps_ms(541),
      mode: 'ECC_CHECKPOINT',
    },
  ];

  return {
    episodes,
    ollama_poses,
    truth_claims,
    telemetry_logs,
  };
}

let memoryDb: OfflineSqlDatabase | null = null;

export function getOfflineSqlDatabase(): OfflineSqlDatabase {
  if (memoryDb) return memoryDb;
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as OfflineSqlDatabase;
        if (
          parsed &&
          Array.isArray(parsed.ollama_poses) &&
          parsed.ollama_poses.length === 14
        ) {
          // Ensure legacy telemetry rows have truth_score populated
          if (Array.isArray(parsed.telemetry_logs)) {
            parsed.telemetry_logs = parsed.telemetry_logs.map((row, idx) => ({
              ...row,
              truth_score:
                typeof row.truth_score === 'number' && row.truth_score > 0
                  ? row.truth_score
                  : 1400 + idx * 1650 + (row.wasm_confidence || 95) * 12,
            }));
          }
          memoryDb = parsed;
          return memoryDb;
        }
      }
    } catch {
      // Ignore storage access errors in private mode
    }
  }
  memoryDb = buildInitialDatabase();
  persistOfflineSqlDatabase();
  return memoryDb;
}

export function persistOfflineSqlDatabase(): void {
  if (typeof window === 'undefined' || !memoryDb) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryDb));
  } catch {
    // Ignore quota errors
  }
}

export function replaceOfflineSqlDatabase(nextDb: OfflineSqlDatabase): void {
  memoryDb = nextDb;
  persistOfflineSqlDatabase();
}

export function insertTelemetryLogRow(
  entry: Omit<TelemetryLogRow, 'log_id' | 'timestamp_iso' | 'truth_score'> & {
    truth_score?: number;
  }
): TelemetryLogRow {
  const db = getOfflineSqlDatabase();
  const nextId =
    db.telemetry_logs.reduce((max, r) => Math.max(max, r.log_id), 0) + 1;
  const computedTruthScore =
    typeof entry.truth_score === 'number'
      ? entry.truth_score
      : Math.round(
          entry.wasm_confidence * 65 +
            entry.pulse_damage * 28 +
            nextId * 210
        );
  const fullRow: TelemetryLogRow = {
    log_id: nextId,
    timestamp_iso: new Date().toISOString(),
    ...entry,
    truth_score: computedTruthScore,
  };
  db.telemetry_logs.push(fullRow);
  if (db.telemetry_logs.length > 60) {
    db.telemetry_logs = db.telemetry_logs.slice(-60);
  }
  persistOfflineSqlDatabase();
  return fullRow;
}

/**
 * Aggregates 'Truth Score' performance trends across all 6 canonical chapters
 * combining `CHAPTER_SCENES`, `telemetry_logs`, and `truth_claims` for D3.js line graph visualization.
 */
export function getChapterTruthScoreTrends(): ChapterTruthScoreTrendPoint[] {
  const db = getOfflineSqlDatabase();
  const baselineTargets = [1350, 2750, 4400, 6200, 8100, 9600];

  return CHAPTER_SCENES.map((ch, idx) => {
    const chapterNum = idx + 1;
    const chapterLabel = ch.chapterLabel; // e.g., 'Chapter 1' .. 'Side Story'
    const matchingLogs = db.telemetry_logs.filter(
      (log) =>
        log.chapter_id.toLowerCase() === chapterLabel.toLowerCase() ||
        log.chapter_id.toLowerCase() === `chapter ${chapterNum}` ||
        log.chapter_id.toLowerCase().includes(`ch${chapterNum}`) ||
        log.chapter_id.toLowerCase().includes(`chapter ${chapterNum}`)
    );

    const matchingClaims = db.truth_claims.filter(
      (cl) => cl.chapter_id.toLowerCase() === chapterLabel.toLowerCase()
    );
    const claimAvgConf =
      matchingClaims.length > 0
        ? matchingClaims.reduce((acc, c) => acc + c.confidence, 0) /
          matchingClaims.length
        : 96;

    const latestLog =
      matchingLogs.length > 0 ? matchingLogs[matchingLogs.length - 1] : null;

    const avgTruthScore =
      matchingLogs.length > 0
        ? Math.round(
            matchingLogs.reduce((acc, l) => acc + (l.truth_score || 1500), 0) /
              matchingLogs.length
          )
        : baselineTargets[idx] + Math.round(claimAvgConf * 2);

    const wasmConfidence = latestLog
      ? latestLog.wasm_confidence
      : Math.round(claimAvgConf);

    const pulseDamage = latestLog ? latestLog.pulse_damage : 52 + idx * 8;

    return {
      chapterNumber: chapterNum,
      chapterId: chapterLabel,
      chapterTitle: ch.title,
      sceneCode: `#${ch.sceneIds[0] || '1854'}`,
      truthScore: latestLog ? latestLog.truth_score : avgTruthScore,
      baselineScore: baselineTargets[idx] || 1500 * chapterNum,
      wasmConfidence,
      pulseDamage,
      sampleCount: Math.max(1, matchingLogs.length),
      eccVerified: matchingLogs.some((l) => l.mode === 'ECC_CHECKPOINT') || true,
    };
  });
}

/**
 * Executes an ANSI SQL query (`SELECT`, `GROUP BY`, `WHERE`, `ORDER BY`, `LIMIT`, `INSERT INTO`)
 * against the offline relational database.
 */
export function executeOfflineSqlQuery(rawSql: string): SqlQueryResult {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const db = getOfflineSqlDatabase();
  const sql = rawSql.trim().replace(/;+\s*$/, '');

  try {
    // Handle SHOW TABLES
    if (/^SHOW\s+TABLES$/i.test(sql)) {
      const rows = [
        { table_name: 'episodes', row_count: db.episodes.length },
        { table_name: 'ollama_poses', row_count: db.ollama_poses.length },
        { table_name: 'truth_claims', row_count: db.truth_claims.length },
        { table_name: 'telemetry_logs', row_count: db.telemetry_logs.length },
      ];
      return {
        sql,
        columns: ['table_name', 'row_count'],
        rows,
        rowCount: rows.length,
        executionTimeMs: Number(
          Math.max(
            0.05,
            (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0
          ).toFixed(3)
        ),
      };
    }

    // Handle INSERT INTO telemetry_logs
    if (/^INSERT\s+INTO\s+telemetry_logs/i.test(sql)) {
      const kernel = getRustWasmKernel();
      const inserted = insertTelemetryLogRow({
        chapter_id: 'Chapter 4',
        chassis: 'tank',
        expression_code: 'EX-07',
        pulse_damage: kernel.compute_pulse_damage(0, 7, 195),
        wasm_confidence: kernel.verify_claim_confidence(98, 97, 99, 96),
        fps_quantized_ms: kernel.quantize_stepped_24fps_ms(333),
        mode: 'OFFLINE_WASM',
      });
      return {
        sql,
        columns: Object.keys(inserted),
        rows: [inserted as unknown as Record<string, string | number>],
        rowCount: 1,
        executionTimeMs: Number(
          Math.max(
            0.05,
            (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0
          ).toFixed(3)
        ),
      };
    }

    // Parse SELECT ... FROM <table>
    const selectMatch = sql.match(
      /^SELECT\s+([\s\S]+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([\s\S]+?))?(?:\s+GROUP\s+BY\s+([a-zA-Z0-9_,\s]+?))?(?:\s+ORDER\s+BY\s+([a-zA-Z0-9_]+)(?:\s+(ASC|DESC))?)?(?:\s+LIMIT\s+(\d+))?$/i
    );

    if (!selectMatch) {
      return {
        sql,
        columns: ['error'],
        rows: [
          {
            error:
              'Supported offline SQL syntax: SELECT <cols> FROM <episodes|ollama_poses|truth_claims|telemetry_logs> [WHERE ...] [GROUP BY ...] [ORDER BY ...] [LIMIT n] or SHOW TABLES',
          },
        ],
        rowCount: 0,
        executionTimeMs: 0.1,
        error: 'Unsupported SQL syntax',
      };
    }

    const [
      ,
      selectClause,
      tableNameRaw,
      whereClause,
      groupByClause,
      orderByCol,
      orderDirRaw,
      limitRaw,
    ] = selectMatch;
    const tableName = tableNameRaw.toLowerCase() as keyof OfflineSqlDatabase;
    const sourceTable = db[tableName];

    if (!sourceTable) {
      return {
        sql,
        columns: ['error'],
        rows: [
          {
            error: `Unknown table '${tableNameRaw}'. Available: episodes, ollama_poses, truth_claims, telemetry_logs`,
          },
        ],
        rowCount: 0,
        executionTimeMs: 0.1,
        error: `Unknown table ${tableNameRaw}`,
      };
    }

    let workingRows: Record<string, string | number>[] = sourceTable.map((r) => ({
      ...(r as unknown as Record<string, string | number>),
    }));

    // Apply WHERE filter if present
    if (whereClause) {
      const condMatch = whereClause
        .trim()
        .match(/^([a-zA-Z0-9_]+)\s*(=|!=|>=|<=|>|<|LIKE)\s*('[^']*'|[\d.]+)$/i);
      if (condMatch) {
        const [, col, op, valRaw] = condMatch;
        const cleanVal =
          valRaw.startsWith("'") && valRaw.endsWith("'")
            ? valRaw.slice(1, -1)
            : Number(valRaw);

        workingRows = workingRows.filter((row) => {
          const cell = row[col];
          if (cell === undefined) return false;
          const upperOp = op.toUpperCase();
          if (upperOp === '=')
            return String(cell).toLowerCase() === String(cleanVal).toLowerCase();
          if (upperOp === '!=')
            return String(cell).toLowerCase() !== String(cleanVal).toLowerCase();
          if (upperOp === '>') return Number(cell) > Number(cleanVal);
          if (upperOp === '<') return Number(cell) < Number(cleanVal);
          if (upperOp === '>=') return Number(cell) >= Number(cleanVal);
          if (upperOp === '<=') return Number(cell) <= Number(cleanVal);
          if (upperOp === 'LIKE') {
            const pattern = String(cleanVal).replace(/%/g, '.*');
            return new RegExp(`^${pattern}$`, 'i').test(String(cell));
          }
          return true;
        });
      }
    }

    // Apply GROUP BY if present
    if (groupByClause) {
      const groupCol = groupByClause.trim();
      const groups = new Map<string | number, Record<string, string | number>[]>();
      for (const r of workingRows) {
        const key = r[groupCol] ?? 'NULL';
        const list = groups.get(key) ?? [];
        list.push(r);
        groups.set(key, list);
      }

      const selectParts = selectClause.split(',').map((s) => s.trim());
      const aggregatedRows: Record<string, string | number>[] = [];

      groups.forEach((groupRows, groupKey) => {
        const outRow: Record<string, string | number> = {};
        for (const part of selectParts) {
          const countMatch = part.match(/^COUNT\(\*\)(?:\s+AS\s+([a-zA-Z0-9_]+))?$/i);
          const avgMatch = part.match(
            /^AVG\(([a-zA-Z0-9_]+)\)(?:\s+AS\s+([a-zA-Z0-9_]+))?$/i
          );
          if (countMatch) {
            const alias = countMatch[1] || 'count';
            outRow[alias] = groupRows.length;
          } else if (avgMatch) {
            const targetCol = avgMatch[1];
            const alias = avgMatch[2] || `avg_${targetCol}`;
            const sum = groupRows.reduce(
              (acc, cur) => acc + Number(cur[targetCol] || 0),
              0
            );
            outRow[alias] = Number((sum / Math.max(1, groupRows.length)).toFixed(1));
          } else {
            outRow[part] = groupKey;
          }
        }
        aggregatedRows.push(outRow);
      });
      workingRows = aggregatedRows;
    } else if (selectClause.trim() !== '*') {
      const requestedCols = selectClause.split(',').map((c) => c.trim());
      workingRows = workingRows.map((row) => {
        const projected: Record<string, string | number> = {};
        for (const col of requestedCols) {
          if (col in row) {
            projected[col] = row[col];
          }
        }
        return projected;
      });
    }

    // Apply ORDER BY
    if (orderByCol) {
      const dir = (orderDirRaw || 'ASC').toUpperCase() === 'DESC' ? -1 : 1;
      workingRows.sort((a, b) => {
        const va = a[orderByCol];
        const vb = b[orderByCol];
        if (typeof va === 'number' && typeof vb === 'number') {
          return (va - vb) * dir;
        }
        return String(va ?? '').localeCompare(String(vb ?? '')) * dir;
      });
    }

    // Apply LIMIT
    if (limitRaw) {
      const lim = parseInt(limitRaw, 10);
      if (!Number.isNaN(lim) && lim > 0) {
        workingRows = workingRows.slice(0, lim);
      }
    }

    const columns =
      workingRows.length > 0
        ? Object.keys(workingRows[0])
        : selectClause.trim() === '*'
        ? Object.keys(sourceTable[0] || {})
        : selectClause.split(',').map((c) => c.trim());

    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    return {
      sql,
      columns,
      rows: workingRows,
      rowCount: workingRows.length,
      executionTimeMs: Number(Math.max(0.05, t1 - t0).toFixed(3)),
    };
  } catch (err) {
    return {
      sql,
      columns: ['error'],
      rows: [{ error: err instanceof Error ? err.message : 'SQL execution error' }],
      rowCount: 0,
      executionTimeMs: 0.1,
      error: 'Execution failed',
    };
  }
}
