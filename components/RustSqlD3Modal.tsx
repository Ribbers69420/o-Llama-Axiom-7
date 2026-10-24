'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  benchmarkRustWasmKernel,
  getRustWasmKernel,
  RUST_KERNEL_SOURCE,
  type WasmBenchmarkResult,
} from '@/lib/rust-wasm-kernel';
import {
  executeOfflineSqlQuery,
  getChapterTruthScoreTrends,
  getOfflineSqlDatabase,
  insertTelemetryLogRow,
  PRESET_SQL_QUERIES,
  SQL_SCHEMA_DDL,
  type ChapterTruthScoreTrendPoint,
  type SqlQueryResult,
} from '@/lib/sql-truth-engine';
import {
  computeCrc32,
  decodeHamming74Nibble,
  deleteEccSaveSlot,
  formatByteSize,
  formatCrc32Hex,
  getEccBackupVaultSlots,
  getStorageVaultSummary,
  injectCorruptionIntoSlot,
  restoreSqlDatabaseFromSlot,
  runCheckpointErrorCorrectionSession,
  runEccScanAndRepair,
  SAMPLE_DATASET_PRESETS,
  saveDataToEccSlot,
  type CheckpointDebugSessionResult,
  type EccSaveSlot,
  type SaveSlotCategory,
} from '@/lib/ecc-storage-vault';
import {
  AXIOM_RELEASE_VERSION,
  getSystemProgramsRegistry,
  installAndVerifyLatestStableSystems,
  type AxiomSystemProgramSpec,
  type SystemUpdateReport,
} from '@/lib/system-package-manager';
import type { AppLanguage } from '@/lib/ollama-bible-spec';
import type { ChassisType, ExpressionId } from '@/lib/game-rules';
import {
  Activity,
  BarChart3,
  Bug,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  Download,
  HardDrive,
  Play,
  Plus,
  RotateCcw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Wrench,
  X,
  Zap,
} from 'lucide-react';

interface RustSqlD3ModalProps {
  isOpen: boolean;
  lang: AppLanguage;
  activeChassis: ChassisType;
  activeExpression: ExpressionId;
  onClose: () => void;
}

type StudioTab =
  | 'd3-studio'
  | 'sql-console'
  | 'rust-wasm'
  | 'ecc-vault'
  | 'telemetry-dashboard'
  | 'system-updates';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  group: 'core' | 'pillar' | 'episode' | 'pose';
  color: string;
  radius: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

export default function RustSqlD3Modal({
  isOpen,
  lang,
  activeChassis,
  activeExpression,
  onClose,
}: RustSqlD3ModalProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>('d3-studio');
  const [sqlInput, setSqlInput] = useState<string>(PRESET_SQL_QUERIES[0].sql);
  const [sqlResult, setSqlResult] = useState<SqlQueryResult>(() =>
    executeOfflineSqlQuery(PRESET_SQL_QUERIES[0].sql)
  );
  const [showDdl, setShowDdl] = useState<boolean>(false);

  // Rust/WASM Interactive Sandbox State
  const [testDistanceCm, setTestDistanceCm] = useState<number>(240);
  const [testFacts, setTestFacts] = useState<number>(98);
  const [testEvidence, setTestEvidence] = useState<number>(96);
  const [testData, setTestData] = useState<number>(99);
  const [testReality, setTestReality] = useState<number>(95);
  const [benchResult, setBenchResult] = useState<WasmBenchmarkResult>(() =>
    benchmarkRustWasmKernel(50000)
  );
  const [selectedNodeInfo, setSelectedNodeInfo] = useState<string>(
    'AXIOM-7 Core · Click any node in the D3 graph to inspect its SQL relation'
  );
  const [telemetryCount, setTelemetryCount] = useState<number>(6);

  // ECC LocalStorage & Backup/Save Vault State
  const [vaultSlots, setVaultSlots] = useState<EccSaveSlot[]>(() =>
    getEccBackupVaultSlots()
  );
  const [vaultSummary, setVaultSummary] = useState(() =>
    getStorageVaultSummary()
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string>('SLOT-01');
  const [newSlotLabel, setNewSlotLabel] = useState<string>(
    'AXIOM-7 Custom Telemetry Snapshot'
  );
  const [newSlotCategory, setNewSlotCategory] =
    useState<SaveSlotCategory>('CUSTOM_DATASET');
  const [newSlotPayload, setNewSlotPayload] = useState<string>(() =>
    SAMPLE_DATASET_PRESETS[1].generatePayload()
  );
  const [eccBannerMessage, setEccBannerMessage] = useState<string>(
    'ECC Internal Bus Active · IEEE 802.3 CRC-32 + O(1) Hamming(7,4) SEC-DED LUT + 64B Sector Parity Mirror'
  );

  // Telemetry Dashboard & Checkpoint Error Correction / Debugging Session State
  const [chapterTrends, setChapterTrends] = useState<
    ChapterTruthScoreTrendPoint[]
  >(() => getChapterTruthScoreTrends());
  const [selectedChapterTrend, setSelectedChapterTrend] =
    useState<ChapterTruthScoreTrendPoint | null>(null);
  const [debugChapterNum, setDebugChapterNum] = useState<number>(4);
  const [checkpointDebugResult, setCheckpointDebugResult] =
    useState<CheckpointDebugSessionResult | null>(null);

  // System & Program Package Manager (v2.4.0 Stable LTS) State
  const [systemPrograms, setSystemPrograms] = useState<
    AxiomSystemProgramSpec[]
  >(() => getSystemProgramsRegistry());
  const [systemUpdateReport, setSystemUpdateReport] =
    useState<SystemUpdateReport | null>(null);

  const forceSvgRef = useRef<SVGSVGElement | null>(null);
  const pillarSvgRef = useRef<SVGSVGElement | null>(null);
  const stepCurveSvgRef = useRef<SVGSVGElement | null>(null);
  const eccSectorSvgRef = useRef<SVGSVGElement | null>(null);
  const truthScoreLineSvgRef = useRef<SVGSVGElement | null>(null);

  const refreshVaultState = () => {
    const slots = [...getEccBackupVaultSlots()];
    setVaultSlots(slots);
    setVaultSummary(getStorageVaultSummary());
    const trends = getChapterTruthScoreTrends();
    setChapterTrends(trends);
    setSelectedSlotId((prev) =>
      slots.length > 0 && !slots.some((s) => s.slotId === prev) ? slots[0].slotId : prev
    );
  };

  // Run initial SQL query & refresh ECC vault when modal opens
  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      const db = getOfflineSqlDatabase();
      setTelemetryCount(db.telemetry_logs.length);
      setSqlResult(executeOfflineSqlQuery(sqlInput));
      refreshVaultState();
    });
  }, [isOpen, sqlInput]);

  // Render D3.js Visualizations when in D3 Studio tab
  useEffect(() => {
    if (!isOpen || activeTab !== 'd3-studio') return;

    const db = getOfflineSqlDatabase();
    const kernel = getRustWasmKernel();

    // ========================================================================
    // 1. D3 Force-Directed Truth Network Graph
    // ========================================================================
    if (forceSvgRef.current) {
      const svg = d3.select(forceSvgRef.current);
      svg.selectAll('*').remove();

      const width = 540;
      const height = 270;

      const epIds = db.episodes.map((ep) => ep.episode_id);

      const nodes: GraphNode[] = [
        { id: 'AXIOM-7', label: 'o-Llama AXIOM-7', group: 'core', color: '#00F0FF', radius: 18 },
        { id: 'FACTS', label: 'FACTS (Green)', group: 'pillar', color: '#00E676', radius: 13 },
        { id: 'EVIDENCE', label: 'EVIDENCE (Purple)', group: 'pillar', color: '#AB47BC', radius: 13 },
        { id: 'DATA', label: 'DATA (Blue)', group: 'pillar', color: '#29B6F6', radius: 13 },
        { id: 'REALITY', label: 'REALITY (Amber)', group: 'pillar', color: '#FFA726', radius: 13 },
        ...db.episodes.map((ep) => ({
          id: ep.episode_id,
          label: `#${ep.scene_ids}`,
          group: 'episode' as const,
          color: '#FFD600',
          radius: 9,
        })),
        { id: 'POSE-01', label: '01 Nysgerrig', group: 'pose', color: '#80DEEA', radius: 8 },
        { id: 'POSE-02', label: '02 Afventer', group: 'pose', color: '#80DEEA', radius: 8 },
        { id: 'POSE-04', label: '04 Arbejder', group: 'pose', color: '#80DEEA', radius: 8 },
        { id: 'POSE-06', label: '06 Blokeret', group: 'pose', color: '#FF1744', radius: 8 },
      ];

      const pillarKeys = ['FACTS', 'EVIDENCE', 'DATA', 'REALITY'];
      const epLinks: GraphLink[] = epIds.map((id, idx) => ({
        source: pillarKeys[idx % pillarKeys.length],
        target: id,
      }));
      if (epIds.length >= 2) {
        epLinks.push({ source: epIds[0], target: epIds[epIds.length - 1] });
      }

      const links: GraphLink[] = [
        { source: 'AXIOM-7', target: 'FACTS' },
        { source: 'AXIOM-7', target: 'EVIDENCE' },
        { source: 'AXIOM-7', target: 'DATA' },
        { source: 'AXIOM-7', target: 'REALITY' },
        ...epLinks,
        { source: 'AXIOM-7', target: 'POSE-01' },
        { source: 'AXIOM-7', target: 'POSE-02' },
        { source: 'DATA', target: 'POSE-04' },
        { source: 'EVIDENCE', target: 'POSE-06' },
      ];

      const simulation = d3
        .forceSimulation<GraphNode>(nodes)
        .force(
          'link',
          d3
            .forceLink<GraphNode, GraphLink>(links)
            .id((d) => d.id)
            .distance(48)
        )
        .force('charge', d3.forceManyBody().strength(-95))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('x', d3.forceX(width / 2).strength(0.14))
        .force('y', d3.forceY(height / 2).strength(0.22))
        .force('collide', d3.forceCollide<GraphNode>().radius((d) => d.radius + 10));

      for (let i = 0; i < 100; i++) simulation.tick();
      simulation.stop();

      nodes.forEach((n) => {
        n.x = Math.max(48, Math.min(width - 48, n.x ?? width / 2));
        n.y = Math.max(24, Math.min(height - 28, n.y ?? height / 2));
      });

      const linkGroup = svg
        .append('g')
        .attr('stroke', '#1E3A5F')
        .attr('stroke-width', 1.5);

      linkGroup
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
        .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
        .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
        .attr('y2', (d) => (d.target as GraphNode).y ?? 0);

      const nodeGroup = svg
        .append('g')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
        .style('cursor', 'pointer')
        .on('click', (_event, d) => {
          setSelectedNodeInfo(
            `Node [${d.id}] · ${d.label} · Category: ${d.group.toUpperCase()} (Synced with Offline SQL DB)`
          );
        });

      nodeGroup
        .append('circle')
        .attr('r', (d) => d.radius)
        .attr('fill', (d) => d.color)
        .attr('stroke', '#050510')
        .attr('stroke-width', 2);

      nodeGroup
        .append('text')
        .text((d) => d.label)
        .attr('x', 0)
        .attr('y', (d) => d.radius + 11)
        .attr('text-anchor', 'middle')
        .attr('fill', '#E2E8F0')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace');
    }

    // ========================================================================
    // 2. D3 SQL Pillar Confidence & Claim Breakdown Bar Chart
    // ========================================================================
    if (pillarSvgRef.current) {
      const svg = d3.select(pillarSvgRef.current);
      svg.selectAll('*').remove();

      const width = 460;
      const height = 195;
      const margin = { top: 20, right: 20, bottom: 32, left: 42 };

      const pillars: ('FACTS' | 'EVIDENCE' | 'DATA' | 'REALITY')[] = [
        'FACTS',
        'EVIDENCE',
        'DATA',
        'REALITY',
      ];
      const colorMap: Record<string, string> = {
        FACTS: '#00E676',
        EVIDENCE: '#AB47BC',
        DATA: '#00F0FF',
        REALITY: '#FFD600',
      };

      const data = pillars.map((p) => {
        const matching = db.truth_claims.filter((c) => c.pillar === p);
        const avgConf =
          matching.reduce((acc, c) => acc + c.confidence, 0) / Math.max(1, matching.length);
        return {
          pillar: p,
          avgConfidence: Number(avgConf.toFixed(1)),
          count: matching.length,
          color: colorMap[p],
        };
      });

      const x = d3
        .scaleBand()
        .domain(data.map((d) => d.pillar))
        .range([margin.left, width - margin.right])
        .padding(0.32);

      const y = d3
        .scaleLinear()
        .domain([0, 100])
        .range([height - margin.bottom, margin.top]);

      svg
        .append('g')
        .selectAll('line')
        .data([25, 50, 75, 100])
        .join('line')
        .attr('x1', margin.left)
        .attr('x2', width - margin.right)
        .attr('y1', (d) => y(d))
        .attr('y2', (d) => y(d))
        .attr('stroke', '#1E293B')
        .attr('stroke-dasharray', '3,3');

      svg
        .append('g')
        .selectAll('rect')
        .data(data)
        .join('rect')
        .attr('x', (d) => x(d.pillar) ?? 0)
        .attr('y', (d) => y(d.avgConfidence))
        .attr('width', x.bandwidth())
        .attr('height', (d) => height - margin.bottom - y(d.avgConfidence))
        .attr('fill', (d) => d.color)
        .attr('rx', 3);

      svg
        .append('g')
        .selectAll('text')
        .data(data)
        .join('text')
        .text((d) => `${d.avgConfidence}% (${d.count})`)
        .attr('x', (d) => (x(d.pillar) ?? 0) + x.bandwidth() / 2)
        .attr('y', (d) => y(d.avgConfidence) - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#F8FAFC')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace');

      svg
        .append('g')
        .selectAll('text')
        .data(data)
        .join('text')
        .text((d) => d.pillar)
        .attr('x', (d) => (x(d.pillar) ?? 0) + x.bandwidth() / 2)
        .attr('y', height - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#94A3B8')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace');
    }

    // ========================================================================
    // 3. D3 24fps Stepped vs 60fps Continuous Rust/WASM Quantizer Curve
    // ========================================================================
    if (stepCurveSvgRef.current) {
      const svg = d3.select(stepCurveSvgRef.current);
      svg.selectAll('*').remove();

      const width = 460;
      const height = 165;
      const margin = { top: 16, right: 18, bottom: 26, left: 42 };

      const samples: { t: number; continuous: number; stepped24: number }[] = [];
      for (let ms = 0; ms <= 250; ms += 5) {
        samples.push({
          t: ms,
          continuous: ms,
          stepped24: kernel.quantize_stepped_24fps_ms(ms),
        });
      }

      const x = d3
        .scaleLinear()
        .domain([0, 250])
        .range([margin.left, width - margin.right]);

      const y = d3
        .scaleLinear()
        .domain([0, 250])
        .range([height - margin.bottom, margin.top]);

      const areaStepped = d3
        .area<{ t: number; stepped24: number }>()
        .x((d) => x(d.t))
        .y0(height - margin.bottom)
        .y1((d) => y(d.stepped24))
        .curve(d3.curveStepAfter);

      const lineStepped = d3
        .line<{ t: number; stepped24: number }>()
        .x((d) => x(d.t))
        .y((d) => y(d.stepped24))
        .curve(d3.curveStepAfter);

      const lineCont = d3
        .line<{ t: number; continuous: number }>()
        .x((d) => x(d.t))
        .y((d) => y(d.continuous));

      svg
        .append('path')
        .datum(samples)
        .attr('fill', 'rgba(0, 240, 255, 0.14)')
        .attr('d', areaStepped);

      svg
        .append('path')
        .datum(samples)
        .attr('fill', 'none')
        .attr('stroke', '#64748B')
        .attr('stroke-width', 1.2)
        .attr('stroke-dasharray', '4,4')
        .attr('d', lineCont);

      svg
        .append('path')
        .datum(samples)
        .attr('fill', 'none')
        .attr('stroke', '#00F0FF')
        .attr('stroke-width', 2.2)
        .attr('d', lineStepped);

      svg
        .append('text')
        .attr('x', margin.left + 8)
        .attr('y', margin.top + 12)
        .attr('fill', '#00F0FF')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .text('Rust/WASM quantize_stepped_24fps_ms(t) [41.67ms steps]');
    }
  }, [isOpen, activeTab, telemetryCount]);

  // Render D3.js 64-Byte ECC Sector Block Map when in ECC Vault tab
  useEffect(() => {
    if (!isOpen || activeTab !== 'ecc-vault' || !eccSectorSvgRef.current) return;

    const activeSlot =
      vaultSlots.find((s) => s.slotId === selectedSlotId) || vaultSlots[0];
    if (!activeSlot) return;

    const svg = d3.select(eccSectorSvgRef.current);
    svg.selectAll('*').remove();

    const width = 460;
    const height = 140;
    const cols = 16;
    const maxDisplayedBlocks = 64;
    const totalBlocks = activeSlot.frame.blocks.length;

    const evaluatedBlocks = activeSlot.frame.blocks.map((blk) => {
      const liveSlice = activeSlot.frame.primaryPayload.slice(
        blk.offset,
        blk.offset + blk.length
      );
      const liveCrc = computeCrc32(liveSlice);
      const hammingDecoded = decodeHamming74Nibble(blk.hammingParityByte);
      return {
        blockIndex: blk.blockIndex,
        intact: liveCrc === blk.crc32 && liveSlice.length === blk.length,
        crcHex: formatCrc32Hex(blk.crc32),
        parityByteHex:
          '0x' + blk.hammingParityByte.toString(16).toUpperCase().padStart(2, '0'),
        syndrome: hammingDecoded.syndrome,
      };
    });

    const sampledBlocks = evaluatedBlocks.slice(0, maxDisplayedBlocks);

    const cellW = (width - 24) / cols;
    const cellH = 22;

    const cells = svg
      .append('g')
      .attr('transform', 'translate(12, 24)')
      .selectAll('g')
      .data(sampledBlocks)
      .join('g')
      .attr('transform', (_d, idx) => {
        const c = idx % cols;
        const r = Math.floor(idx / cols);
        return `translate(${c * cellW}, ${r * (cellH + 4)})`;
      });

    cells
      .append('rect')
      .attr('width', cellW - 4)
      .attr('height', cellH)
      .attr('rx', 3)
      .attr('fill', (d) =>
        d.intact ? 'rgba(0, 230, 118, 0.18)' : 'rgba(255, 23, 68, 0.35)'
      )
      .attr('stroke', (d) => (d.intact ? '#00E676' : '#FF1744'))
      .attr('stroke-width', 1.2);

    cells
      .append('text')
      .attr('x', (cellW - 4) / 2)
      .attr('y', 14)
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => (d.intact ? '#E2E8F0' : '#FF8A80'))
      .attr('font-size', '8px')
      .attr('font-family', 'monospace')
      .text((d) => `B${d.blockIndex}`);

    svg
      .append('text')
      .attr('x', 12)
      .attr('y', 15)
      .attr('fill', '#00F0FF')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .text(
        `D3 ECC Sector Map · ${activeSlot.slotId} (${totalBlocks} × 64B blocks · Expected CRC ${activeSlot.crc32Hex})`
      );
  }, [isOpen, activeTab, vaultSlots, selectedSlotId]);

  // Render D3.js 'Truth Score' Performance Trends Line Graph across Chapters when in Telemetry Dashboard tab
  useEffect(() => {
    if (
      !isOpen ||
      activeTab !== 'telemetry-dashboard' ||
      !truthScoreLineSvgRef.current
    )
      return;

    const svg = d3.select(truthScoreLineSvgRef.current);
    svg.selectAll('*').remove();

    const width = 620;
    const height = 255;
    const margin = { top: 28, right: 32, bottom: 42, left: 54 };

    const data = chapterTrends;
    if (data.length === 0) return;

    const maxScore = Math.max(
      10500,
      d3.max(data, (d) => Math.max(d.truthScore, d.baselineScore)) ?? 10000
    );

    const x = d3
      .scalePoint<string>()
      .domain(data.map((d) => d.chapterId))
      .range([margin.left, width - margin.right])
      .padding(0.25);

    const y = d3
      .scaleLinear()
      .domain([0, maxScore])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Defs for neon cyan area gradient
    const defs = svg.append('defs');
    const grad = defs
      .append('linearGradient')
      .attr('id', 'truthScoreAreaGrad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    grad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#00F0FF')
      .attr('stop-opacity', 0.36);
    grad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#00E676')
      .attr('stop-opacity', 0.02);

    // Horizontal reference grid lines
    const yTicks = [2000, 4000, 6000, 8000, 10000];
    svg
      .append('g')
      .selectAll('line')
      .data(yTicks)
      .join('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .attr('stroke', '#1E293B')
      .attr('stroke-dasharray', '3,3');

    // Y-axis labels
    svg
      .append('g')
      .selectAll('text')
      .data(yTicks)
      .join('text')
      .attr('x', margin.left - 8)
      .attr('y', (d) => y(d) + 3)
      .attr('text-anchor', 'end')
      .attr('fill', '#64748B')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .text((d) => `${d}`);

    // Area under the live Truth Score curve
    const areaGen = d3
      .area<ChapterTruthScoreTrendPoint>()
      .x((d) => x(d.chapterId) ?? margin.left)
      .y0(height - margin.bottom)
      .y1((d) => y(d.truthScore))
      .curve(d3.curveMonotoneX);

    svg
      .append('path')
      .datum(data)
      .attr('fill', 'url(#truthScoreAreaGrad)')
      .attr('d', areaGen);

    // Baseline Target Trajectory Line (dashed gold)
    const baselineLineGen = d3
      .line<ChapterTruthScoreTrendPoint>()
      .x((d) => x(d.chapterId) ?? margin.left)
      .y((d) => y(d.baselineScore))
      .curve(d3.curveMonotoneX);

    svg
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#FFD600')
      .attr('stroke-width', 1.6)
      .attr('stroke-dasharray', '5,4')
      .attr('d', baselineLineGen);

    // Primary Verified 'Truth Score' Line Graph (neon cyan)
    const truthLineGen = d3
      .line<ChapterTruthScoreTrendPoint>()
      .x((d) => x(d.chapterId) ?? margin.left)
      .y((d) => y(d.truthScore))
      .curve(d3.curveMonotoneX);

    svg
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#00F0FF')
      .attr('stroke-width', 2.8)
      .attr('d', truthLineGen);

    // X-axis chapter labels & scene codes
    const xGroup = svg
      .append('g')
      .selectAll('g')
      .data(data)
      .join('g')
      .attr(
        'transform',
        (d) => `translate(${x(d.chapterId) ?? margin.left}, ${height - margin.bottom})`
      );

    xGroup
      .append('text')
      .attr('y', 16)
      .attr('text-anchor', 'middle')
      .attr('fill', '#E2E8F0')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text((d) => d.chapterId);

    xGroup
      .append('text')
      .attr('y', 29)
      .attr('text-anchor', 'middle')
      .attr('fill', '#00F0FF')
      .attr('font-size', '8.5px')
      .attr('font-family', 'monospace')
      .text((d) => d.sceneCode);

    // Interactive Data Points & Score Callouts
    const pointsGroup = svg
      .append('g')
      .selectAll('g')
      .data(data)
      .join('g')
      .attr(
        'transform',
        (d) => `translate(${x(d.chapterId) ?? margin.left}, ${y(d.truthScore)})`
      )
      .style('cursor', 'pointer')
      .on('click', (_e, d) => {
        setSelectedChapterTrend(d);
      });

    pointsGroup
      .append('circle')
      .attr('r', 6)
      .attr('fill', '#050811')
      .attr('stroke', '#00E676')
      .attr('stroke-width', 2.5);

    pointsGroup
      .append('circle')
      .attr('r', 2.5)
      .attr('fill', '#00F0FF');

    pointsGroup
      .append('text')
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#FFFFFF')
      .attr('font-size', '9.5px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text((d) => `${d.truthScore}`);

    // Legend Header inside SVG
    svg
      .append('text')
      .attr('x', margin.left)
      .attr('y', 16)
      .attr('fill', '#00F0FF')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .text(
        '● Live ECC-Verified Truth Score Trajectory (Ch 1 → Ch 6)   --- Gold: Campaign Baseline Target'
      );
  }, [isOpen, activeTab, chapterTrends]);

  if (!isOpen) return null;

  const kernel = getRustWasmKernel();
  const chassisCode = activeChassis === 'cosmic' ? 2 : activeChassis === 'wizard' ? 1 : 0;
  const exprCode = parseInt(activeExpression.replace('EX-0', ''), 10) || 1;
  const livePulseDamage = kernel.compute_pulse_damage(chassisCode, exprCode, testDistanceCm);
  const liveConfidence = kernel.verify_claim_confidence(
    testFacts,
    testEvidence,
    testData,
    testReality
  );

  const selectedSlot =
    vaultSlots.find((s) => s.slotId === selectedSlotId) || vaultSlots[0];
  const inspectedTrend =
    selectedChapterTrend ||
    chapterTrends[chapterTrends.length - 1] ||
    chapterTrends[0];

  const handleRunSql = (queryToRun?: string) => {
    const targetSql = queryToRun ?? sqlInput;
    if (queryToRun) setSqlInput(queryToRun);
    const res = executeOfflineSqlQuery(targetSql);
    setSqlResult(res);
  };

  const handleLogWasmTelemetryToSql = () => {
    const targetChNum = ((telemetryCount % 6) + 1);
    const computedScore = 1420 * targetChNum + liveConfidence * 6 + livePulseDamage * 4;
    insertTelemetryLogRow({
      chapter_id: `Chapter ${targetChNum}`,
      chassis: activeChassis,
      expression_code: activeExpression,
      pulse_damage: livePulseDamage,
      wasm_confidence: liveConfidence,
      truth_score: computedScore,
      fps_quantized_ms: kernel.quantize_stepped_24fps_ms(166),
      mode: 'OFFLINE_WASM',
    });
    const db = getOfflineSqlDatabase();
    setTelemetryCount(db.telemetry_logs.length);
    const telemetryQuery = PRESET_SQL_QUERIES[4].sql;
    setSqlInput(telemetryQuery);
    setSqlResult(executeOfflineSqlQuery(telemetryQuery));
    refreshVaultState();
  };

  const handleSaveNewBackupSlot = () => {
    const saved = saveDataToEccSlot({
      label: newSlotLabel,
      category: newSlotCategory,
      payload: newSlotPayload,
    });
    setSelectedSlotId(saved.slotId);
    refreshVaultState();
    setEccBannerMessage(
      `Saved [${saved.slotId}] "${saved.label}" (${formatByteSize(saved.byteSize)}, ${saved.blockCount} ECC blocks, CRC-32 ${saved.crc32Hex}).`
    );
  };

  const handleQuickBackupSqlDb = () => {
    const sqlPayload = JSON.stringify(getOfflineSqlDatabase(), null, 2);
    const saved = saveDataToEccSlot({
      slotId: 'SLOT-01',
      label: 'Primary Offline SQL DB Backup (Auto-Synced)',
      category: 'SQL_DB_SNAPSHOT',
      payload: sqlPayload,
    });
    setSelectedSlotId(saved.slotId);
    refreshVaultState();
    setEccBannerMessage(
      `Synced Offline SQL Database to [SLOT-01] (${formatByteSize(saved.byteSize)}, CRC-32 ${saved.crc32Hex}).`
    );
  };

  const handleInjectFault = (slotId: string) => {
    const res = injectCorruptionIntoSlot(slotId);
    setSelectedSlotId(slotId);
    refreshVaultState();
    if (res.slot) {
      setEccBannerMessage(
        `FAULT INJECTED in [${slotId}]: Corrupted block(s) [${res.corruptedBlockIndices.join(', ')}] — Live CRC drifted to ${res.corruptedCrc32Hex} (Expected ${res.slot.crc32Hex}).`
      );
    }
  };

  const handleRunEccScanAndHeal = (slotId?: string) => {
    const reports = runEccScanAndRepair(slotId);
    refreshVaultState();
    if (reports.length > 0) {
      const rep = reports[0];
      setEccBannerMessage(rep.message);
    }
  };

  const handleRunCheckpointDebugSession = () => {
    const session = runCheckpointErrorCorrectionSession({
      chapterNumber: debugChapterNum,
      chassis: activeChassis,
      expressionCode: activeExpression,
    });
    setCheckpointDebugResult(session);
    setSelectedSlotId('SLOT-02');
    const db = getOfflineSqlDatabase();
    setTelemetryCount(db.telemetry_logs.length);
    refreshVaultState();
    setEccBannerMessage(session.summaryMessage);
  };

  const handleInstallAndVerifyAllSystems = () => {
    const report = installAndVerifyLatestStableSystems();
    setSystemUpdateReport(report);
    setSystemPrograms(report.programs);
    const db = getOfflineSqlDatabase();
    setTelemetryCount(db.telemetry_logs.length);
    refreshVaultState();
    setEccBannerMessage(
      lang === 'da' ? report.summaryDa : report.summaryEn
    );
  };

  const handleRestoreFromSlot = (slotId: string) => {
    const res = restoreSqlDatabaseFromSlot(slotId);
    const db = getOfflineSqlDatabase();
    setTelemetryCount(db.telemetry_logs.length);
    setSqlResult(executeOfflineSqlQuery(sqlInput));
    const slot = getEccBackupVaultSlots().find((s) => s.slotId === slotId);
    if (slot) {
      setNewSlotLabel(slot.label);
      setNewSlotCategory(slot.category);
      setNewSlotPayload(slot.frame.primaryPayload);
    }
    refreshVaultState();
    setEccBannerMessage(
      `Restored [${slotId}]: ${res.rowCountSummary} (${res.report?.status ?? 'HEALTHY'}).`
    );
  };

  const handleExportSlotJson = (slot: EccSaveSlot) => {
    const blob = new Blob([JSON.stringify(slot, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slot.slotId.toLowerCase()}-ecc-backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Rust, SQL, D3.js, ECC Storage & Telemetry Dashboard Studio"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[rgba(5,5,16,0.86)] pointer-events-auto"
    >
      <div className="w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#080D1A] border-2 border-[#00F0FF] rounded-xl shadow-2xl overflow-hidden text-white gpu-accelerated">
        {/* Top Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#0D1528] border-b border-[#00F0FF]/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF] flex items-center justify-center text-[#00F0FF]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-wider uppercase font-[family-name:var(--font-display)] text-white">
                  {lang === 'da'
                    ? 'Offline Motor · Rust/WASM + SQL + D3.js + ECC Bus & Telemetry'
                    : 'Offline Engine · Rust/WASM + SQL + D3.js + ECC Bus & Telemetry'}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/50">
                  CRC-32 + HAMMING(7,4) LUT
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {lang === 'da'
                  ? 'Optimeret intern databus mellem IEEE 802.3 CRC-32, Hamming(7,4) SEC-DED, Backup Vault, D3 Sektor-Matrix og Truth Score Telemetri.'
                  : 'Optimized internal data bus between IEEE 802.3 CRC-32, Hamming(7,4) SEC-DED, Backup Vault, D3 Sector Matrix, and Truth Score Telemetry.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogWasmTelemetryToSql}
              data-testid="btn-insert-telemetry"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold bg-[#13261C] hover:bg-[#1B3829] text-[#00E676] border border-[#00E676]/60 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {lang === 'da'
                ? `Log WASM Telemetri i SQL (${telemetryCount})`
                : `Log WASM Telemetry to SQL (${telemetryCount})`}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Rust SQL D3 Studio"
              data-testid="close-rust-sql-d3-btn"
              className="p-1.5 rounded-lg bg-[#16223D] hover:bg-[#1F3054] text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 bg-[#0A1020] border-b border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'd3-studio'}
              onClick={() => setActiveTab('d3-studio')}
              data-testid="tab-d3-studio"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'd3-studio'
                  ? 'bg-[#00F0FF] text-[#050510]'
                  : 'bg-[#111B33] text-slate-300 hover:text-white border border-slate-700/70'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              {lang === 'da' ? '01 · D3.js Grafer' : '01 · D3.js Charts'}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'sql-console'}
              onClick={() => setActiveTab('sql-console')}
              data-testid="tab-sql-console"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'sql-console'
                  ? 'bg-[#FFD600] text-[#050510]'
                  : 'bg-[#111B33] text-slate-300 hover:text-white border border-slate-700/70'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              {lang === 'da' ? '02 · Offline SQL' : '02 · Offline SQL'}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'rust-wasm'}
              onClick={() => setActiveTab('rust-wasm')}
              data-testid="tab-rust-wasm"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'rust-wasm'
                  ? 'bg-[#00E676] text-[#050510]'
                  : 'bg-[#111B33] text-slate-300 hover:text-white border border-slate-700/70'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              {lang === 'da' ? '03 · Rust / WASM' : '03 · Rust / WASM'}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'ecc-vault'}
              onClick={() => setActiveTab('ecc-vault')}
              data-testid="tab-ecc-vault"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'ecc-vault'
                  ? 'bg-[#AB47BC] text-white shadow-[0_0_12px_rgba(171,71,188,0.5)]'
                  : 'bg-[#111B33] text-slate-300 hover:text-white border border-slate-700/70'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              {lang === 'da'
                ? `04 · ECC LocalStorage & Backup (${vaultSummary.totalSlots})`
                : `04 · ECC LocalStorage & Backup (${vaultSummary.totalSlots})`}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'telemetry-dashboard'}
              onClick={() => setActiveTab('telemetry-dashboard')}
              data-testid="tab-telemetry-dashboard"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'telemetry-dashboard'
                  ? 'bg-[#00F0FF] text-[#050510] shadow-[0_0_12px_rgba(0,240,255,0.45)]'
                  : 'bg-[#111B33] text-[#00F0FF] hover:text-white border border-[#00F0FF]/40'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              {lang === 'da'
                ? '05 · Telemetry Dashboard'
                : '05 · Telemetry Dashboard'}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'system-updates'}
              onClick={() => setActiveTab('system-updates')}
              data-testid="tab-system-updates"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'system-updates'
                  ? 'bg-[#00E676] text-[#050510] shadow-[0_0_12px_rgba(0,230,118,0.45)]'
                  : 'bg-[#111B33] text-[#00E676] hover:text-white border border-[#00E676]/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {lang === 'da'
                ? `06 · System Opdatering (${AXIOM_RELEASE_VERSION})`
                : `06 · System Updates (${AXIOM_RELEASE_VERSION})`}
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            ABI: <span className="text-[#00E676]">v2.4.0 ({benchResult.kernelAbiVersion})</span> · WASM:{' '}
            <span className="text-[#00F0FF]">{benchResult.wasmByteLength}B</span> · ECC Vault:{' '}
            <span className="text-[#FFD600]">
              {formatByteSize(vaultSummary.totalPayloadBytes)}
            </span>
          </div>
        </div>

        {/* Main Scrollable Content Area */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* ================================================================
              TAB 1: D3.js Interactive Data Visualizations
              ================================================================ */}
          {activeTab === 'd3-studio' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left: D3 Force-Directed Truth Network Graph */}
                <div className="lg:col-span-7 p-4 rounded-xl bg-[#0B1224] border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#00F0FF]">
                        D3.FORCE SIMULATION · PIXELVERSE-9 TOPOLOGY
                      </span>
                      <h3 className="text-sm font-bold text-white">
                        {lang === 'da'
                          ? 'Sandhedssøjler, 7 Episoder (1854 ↔ 1854-coda) & o-Llama Positurer'
                          : 'Truth Pillars, 7 Episodes (1854 ↔ 1854-coda) & o-Llama Poses'}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#131F3A] text-[10px] font-mono text-slate-300">
                      d3.forceSimulation
                    </span>
                  </div>

                  <div className="w-full bg-[#060A14] rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center">
                    <svg
                      ref={forceSvgRef}
                      viewBox="0 0 540 270"
                      className="w-full h-[260px]"
                      data-testid="d3-force-graph-svg"
                    />
                  </div>

                  <div className="mt-2.5 px-3 py-1.5 rounded bg-[#070B16] border border-slate-800 text-xs font-mono text-[#00F0FF]">
                    {selectedNodeInfo}
                  </div>
                </div>

                {/* Right: D3 Bar Chart + D3 24fps Stepped Quantizer Curve */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#FFD600]">
                          D3.SCALEBAND + SQL AGGREGATION
                        </span>
                        <h3 className="text-xs font-bold text-white">
                          {lang === 'da'
                            ? 'Gennemsnitlig Tillidsscore pr. Sandhedssøjle (SQL)'
                            : 'Mean Confidence by Truth Pillar (Live SQL)'}
                        </h3>
                      </div>
                    </div>
                    <div className="w-full bg-[#060A14] rounded-lg border border-slate-800/80 overflow-hidden">
                      <svg
                        ref={pillarSvgRef}
                        viewBox="0 0 460 195"
                        className="w-full h-[165px]"
                        data-testid="d3-pillar-chart-svg"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#00E676]">
                          D3.CURVESTEPAFTER + RUST WASM
                        </span>
                        <h3 className="text-xs font-bold text-white">
                          {lang === 'da'
                            ? '24fps Stepped Kvantisering vs. 60fps Kontinuerlig Tid'
                            : '24fps Stepped Quantization vs. 60fps Continuous Time'}
                        </h3>
                      </div>
                    </div>
                    <div className="w-full bg-[#060A14] rounded-lg border border-slate-800/80 overflow-hidden">
                      <svg
                        ref={stepCurveSvgRef}
                        viewBox="0 0 460 165"
                        className="w-full h-[140px]"
                        data-testid="d3-stepped-curve-svg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 2: Offline Relational SQL Database Console
              ================================================================ */}
          {activeTab === 'sql-console' && (
            <div className="space-y-4">
              {/* Preset SQL Queries Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {PRESET_SQL_QUERIES.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleRunSql(q.sql)}
                      className={`px-2.5 py-1.5 rounded text-xs font-mono transition-colors cursor-pointer ${
                        sqlInput === q.sql
                          ? 'bg-[#FFD600] text-[#050510] font-bold'
                          : 'bg-[#111A30] text-slate-300 hover:bg-[#182544] border border-slate-700/70'
                      }`}
                    >
                      {lang === 'da' ? q.labelDa : q.labelEn}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowDdl((v) => !v)}
                  className="px-2.5 py-1.5 rounded text-xs font-mono bg-[#111A30] hover:bg-[#182544] text-[#00F0FF] border border-[#00F0FF]/40 cursor-pointer"
                >
                  {showDdl ? 'Hide SQL Schema (DDL)' : 'View SQL Schema (DDL)'}
                </button>
              </div>

              {showDdl && (
                <pre className="p-3.5 rounded-lg bg-[#050811] border border-slate-800 text-[11px] font-mono text-[#80DEEA] overflow-x-auto leading-relaxed">
                  {SQL_SCHEMA_DDL}
                </pre>
              )}

              {/* SQL Query Editor Form */}
              <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="offline-sql-editor"
                    className="text-xs font-bold uppercase tracking-wider text-[#FFD600] font-mono"
                  >
                    ANSI SQL Query Console (Offline LocalStorage + Memory Relational Engine)
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    Tables: episodes · ollama_poses · truth_claims · telemetry_logs
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <textarea
                    id="offline-sql-editor"
                    rows={2}
                    value={sqlInput}
                    onChange={(e) => setSqlInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded bg-[#050811] border border-slate-700 focus:border-[#FFD600] focus:outline-none text-xs font-mono text-[#00F0FF]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRunSql()}
                    data-testid="btn-execute-sql"
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-[#FFD600] hover:bg-[#FFC400] text-[#050510] font-bold text-xs uppercase tracking-wider cursor-pointer shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {lang === 'da' ? 'Kør SQL' : 'Run SQL'}
                  </button>
                </div>

                {/* SQL Results Table */}
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                  <span>
                    Rows returned:{' '}
                    <strong className="text-white" data-testid="sql-row-count">
                      {sqlResult.rowCount}
                    </strong>
                  </span>
                  <span>
                    Execution time:{' '}
                    <strong className="text-[#00E676]">{sqlResult.executionTimeMs} ms</strong> (0
                    Network I/O)
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[290px] rounded-lg border border-slate-800 bg-[#050811]">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="bg-[#10192E] text-[#00F0FF] border-b border-slate-800">
                        {sqlResult.columns.map((col) => (
                          <th key={col} className="py-2 px-3 font-semibold uppercase">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {sqlResult.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-[#0D1528]">
                          {sqlResult.columns.map((col) => (
                            <td key={col} className="py-2 px-3 text-slate-200 whitespace-nowrap">
                              {String(row[col] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 3: Rust / WebAssembly Kernel Inspector & Live Benchmark
              ================================================================ */}
          {activeTab === 'rust-wasm' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left: Interactive Rust/WASM FFI Function Tester + Benchmark */}
              <div className="lg:col-span-6 space-y-4">
                <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#00E676]">
                        LIVE WEBASSEMBLY FFI SANDBOX
                      </span>
                      <h3 className="text-sm font-bold text-white">
                        {lang === 'da'
                          ? 'Test Rust #[no_mangle] Eksport-Funktioner i Realtid'
                          : 'Test Rust #[no_mangle] Exported Functions in Real Time'}
                      </h3>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-[#00E676]" />
                  </div>

                  <div className="space-y-3 text-xs font-mono">
                    <div className="p-3 rounded bg-[#060A14] border border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[#00F0FF]">
                          compute_pulse_damage(chassis={chassisCode}, expr={exprCode}, dist_cm=
                          {testDistanceCm})
                        </span>
                        <span
                          className="text-sm font-bold text-[#FFD600]"
                          data-testid="wasm-pulse-output"
                        >
                          = {livePulseDamage} DMG
                        </span>
                      </div>
                      <label className="flex items-center gap-3 text-slate-400">
                        <span>Distance (cm):</span>
                        <input
                          type="range"
                          min={50}
                          max={750}
                          value={testDistanceCm}
                          onChange={(e) => setTestDistanceCm(Number(e.target.value))}
                          className="flex-1 accent-[#00F0FF]"
                        />
                        <span className="w-14 text-right text-white">{testDistanceCm} cm</span>
                      </label>
                    </div>

                    <div className="p-3 rounded bg-[#060A14] border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[#00E676]">
                          verify_claim_confidence({testFacts}, {testEvidence}, {testData},{' '}
                          {testReality})
                        </span>
                        <span
                          className="text-sm font-bold text-[#00E676]"
                          data-testid="wasm-confidence-output"
                        >
                          = {liveConfidence}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                        <label className="flex items-center justify-between bg-[#0B1224] px-2 py-1 rounded">
                          <span>FACTS: {testFacts}</span>
                          <input
                            type="range"
                            min={50}
                            max={100}
                            value={testFacts}
                            onChange={(e) => setTestFacts(Number(e.target.value))}
                            className="w-20 accent-[#00E676]"
                          />
                        </label>
                        <label className="flex items-center justify-between bg-[#0B1224] px-2 py-1 rounded">
                          <span>EVIDENCE: {testEvidence}</span>
                          <input
                            type="range"
                            min={50}
                            max={100}
                            value={testEvidence}
                            onChange={(e) => setTestEvidence(Number(e.target.value))}
                            className="w-20 accent-[#AB47BC]"
                          />
                        </label>
                        <label className="flex items-center justify-between bg-[#0B1224] px-2 py-1 rounded">
                          <span>DATA: {testData}</span>
                          <input
                            type="range"
                            min={50}
                            max={100}
                            value={testData}
                            onChange={(e) => setTestData(Number(e.target.value))}
                            className="w-20 accent-[#00F0FF]"
                          />
                        </label>
                        <label className="flex items-center justify-between bg-[#0B1224] px-2 py-1 rounded">
                          <span>REALITY: {testReality}</span>
                          <input
                            type="range"
                            min={50}
                            max={100}
                            value={testReality}
                            onChange={(e) => setTestReality(Number(e.target.value))}
                            className="w-20 accent-[#FFD600]"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* WASM Benchmark Card */}
                <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#FFD600]">
                        RUST WASM32 PERFORMANCE BENCHMARK
                      </span>
                      <h3 className="text-sm font-bold text-white">
                        50,000 Kernel Invocations (Zero Heap Allocation)
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBenchResult(benchmarkRustWasmKernel(50000))}
                      data-testid="btn-run-wasm-benchmark"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#00E676] hover:bg-[#00C853] text-[#050510] font-bold text-xs uppercase tracking-wider cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {lang === 'da' ? 'Kør Benchmark' : 'Run Benchmark'}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
                    <div className="p-2.5 rounded bg-[#060A14] border border-slate-800">
                      <div className="text-[10px] text-slate-400">WASM TIME</div>
                      <div className="text-sm font-bold text-[#00E676]">
                        {benchResult.wasmDurationMs} ms
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-[#060A14] border border-slate-800">
                      <div className="text-[10px] text-slate-400">BINARY SIZE</div>
                      <div className="text-sm font-bold text-[#00F0FF]">
                        {benchResult.wasmByteLength} B
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-[#060A14] border border-slate-800">
                      <div className="text-[10px] text-slate-400">24FPS STEP (125ms)</div>
                      <div className="text-sm font-bold text-[#FFD600]">
                        {benchResult.sampleQuantizedMs} ms
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Rust Crate Source Code Viewer (`rust/axiom_kernel/src/lib.rs`) */}
              <div className="lg:col-span-6 p-4 rounded-xl bg-[#0B1224] border border-slate-800 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-[#00F0FF]">
                    rust/axiom_kernel/src/lib.rs (#![no_std])
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    target: wasm32-unknown-unknown
                  </span>
                </div>
                <pre className="flex-1 p-3.5 rounded-lg bg-[#050811] border border-slate-800 text-[11px] font-mono text-slate-200 overflow-x-auto max-h-[360px] leading-relaxed">
                  {RUST_KERNEL_SOURCE}
                </pre>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 4: ECC LocalStorage Error Detection/Correction & Backup Vault
              ================================================================ */}
          {activeTab === 'ecc-vault' && (
            <div className="space-y-4">
              {/* Top ECC Diagnostics Banner & Storage Quota Meter */}
              <div className="p-3.5 rounded-xl bg-[#0B1224] border border-[#AB47BC]/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#AB47BC]/20 border border-[#AB47BC] flex items-center justify-center text-[#EA80FC] shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#EA80FC]">
                      LOCALSTORAGE ECC ENGINE · CRC-32 + HAMMING(7,4) SEC-DED + PARITY MIRROR
                    </div>
                    <div
                      className="text-xs font-mono text-white"
                      data-testid="ecc-status-banner"
                    >
                      {eccBannerMessage}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRunCheckpointDebugSession}
                    data-testid="btn-ecc-checkpoint-session"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold bg-[#1F1435] hover:bg-[#2D1D4C] text-[#EA80FC] border border-[#AB47BC] cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    {lang === 'da'
                      ? 'Kør Checkpoint Debug Session'
                      : 'Checkpoint Debug Session'}
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickBackupSqlDb}
                    data-testid="btn-quick-backup-sql"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold bg-[#112233] hover:bg-[#173047] text-[#00F0FF] border border-[#00F0FF]/50 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {lang === 'da' ? 'Gem SQL Snapshot Nu' : 'Sync SQL Snapshot'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRunEccScanAndHeal()}
                    data-testid="btn-ecc-scan-all"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold bg-[#00E676] hover:bg-[#00C853] text-[#050510] cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    {lang === 'da' ? 'Scan & Helbred Alle Slots' : 'Scan & Auto-Repair All'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Column: Save Slots List + D3 64-Byte Sector Integrity Map */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#00F0FF]">
                          PERSISTENT BACKUP & SAVE SLOTS (SMALL / MEDIUM DATA)
                        </span>
                        <h3 className="text-sm font-bold text-white">
                          {lang === 'da'
                            ? `Aktive Gemte Slots (${vaultSlots.length}) · LocalStorage Forbrug: ${formatByteSize(vaultSummary.totalStorageFootprintBytes)} / 5.00 MB (${vaultSummary.quotaUsedPercent}%)`
                            : `Active Save Slots (${vaultSlots.length}) · LocalStorage Footprint: ${formatByteSize(vaultSummary.totalStorageFootprintBytes)} / 5.00 MB (${vaultSummary.quotaUsedPercent}%)`}
                        </h3>
                      </div>
                    </div>

                    {/* Quota Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-[#050811] border border-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00F0FF] via-[#AB47BC] to-[#00E676]"
                        style={{
                          width: `${Math.max(3, Math.min(100, vaultSummary.quotaUsedPercent))}%`,
                        }}
                      />
                    </div>

                    {/* Slots List */}
                    <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                      {vaultSlots.map((slot) => {
                        const liveCrc = computeCrc32(slot.frame.primaryPayload);
                        const isCorruptedLive =
                          liveCrc !== slot.frame.crc32 ||
                          slot.lastScanStatus === 'CORRUPTED_UNRECOVERABLE';
                        const isSelected = slot.slotId === selectedSlot?.slotId;

                        return (
                          <div
                            key={slot.slotId}
                            onClick={() => setSelectedSlotId(slot.slotId)}
                            data-testid={`ecc-slot-card-${slot.slotId}`}
                            className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#101C38] border-[#00F0FF]'
                                : 'bg-[#060A14] border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-[#1A2747] text-[10px] font-mono font-bold text-[#00F0FF]">
                                  {slot.slotId}
                                </span>
                                <span className="text-xs font-bold text-white">
                                  {slot.label}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                                  {slot.category}
                                </span>
                              </div>

                              {/* ECC Status Badge */}
                              {isCorruptedLive ? (
                                <span
                                  data-testid={`ecc-slot-status-${slot.slotId}`}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF1744]/20 text-[#FF5252] border border-[#FF1744]/60"
                                >
                                  <ShieldAlert className="w-3 h-3" />
                                  CRC MISMATCH · CORRUPTED
                                </span>
                              ) : slot.lastScanStatus === 'REPAIRED' ? (
                                <span
                                  data-testid={`ecc-slot-status-${slot.slotId}`}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/60"
                                >
                                  <Wrench className="w-3 h-3" />
                                  ECC REPAIRED ({slot.lastRepairCount}B FIXED)
                                </span>
                              ) : (
                                <span
                                  data-testid={`ecc-slot-status-${slot.slotId}`}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/60"
                                >
                                  <ShieldCheck className="w-3 h-3" />
                                  ECC HEALTHY
                                </span>
                              )}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                              <div>
                                Size: <strong className="text-white">{formatByteSize(slot.byteSize)}</strong> ·
                                Blocks: <strong className="text-[#FFD600]">{slot.blockCount}×64B</strong> ·
                                CRC-32: <strong className="text-[#00E676]">{slot.crc32Hex}</strong>
                              </div>

                              <div
                                className="flex items-center gap-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleInjectFault(slot.slotId)}
                                  data-testid={`btn-corrupt-${slot.slotId}`}
                                  title="Simulate Bit-Flip Storage Corruption"
                                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#2B1219] hover:bg-[#3F1924] text-[#FF5252] border border-[#FF1744]/50 text-[10px] font-mono cursor-pointer"
                                >
                                  <Bug className="w-3 h-3" />
                                  {lang === 'da' ? 'Inficer Bit-Fejl' : 'Inject Bit-Flip'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRunEccScanAndHeal(slot.slotId)}
                                  data-testid={`btn-repair-${slot.slotId}`}
                                  title="Verify CRC-32 & Auto-Repair from Hamming/Parity Mirror"
                                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#102A20] hover:bg-[#173F30] text-[#00E676] border border-[#00E676]/50 text-[10px] font-mono cursor-pointer"
                                >
                                  <Wrench className="w-3 h-3" />
                                  {lang === 'da' ? 'ECC Helbred' : 'ECC Repair'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRestoreFromSlot(slot.slotId)}
                                  data-testid={`btn-restore-${slot.slotId}`}
                                  title="Restore Snapshot / Load into Editor"
                                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#13223E] hover:bg-[#1B3159] text-[#00F0FF] border border-[#00F0FF]/50 text-[10px] font-mono cursor-pointer"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  {lang === 'da' ? 'Gendan' : 'Restore'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleExportSlotJson(slot)}
                                  title="Export ECC Frame JSON"
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                                {vaultSlots.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      deleteEccSaveSlot(slot.slotId);
                                      refreshVaultState();
                                    }}
                                    title="Delete Save Slot"
                                    className="p-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* D3.js 64-Byte Sector Block Health Visualization */}
                  <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#00E676]">
                        D3.JS 64-BYTE ECC SECTOR INTEGRITY MATRIX
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Green = Intact CRC · Red = Bit-Flip Detected
                      </span>
                    </div>
                    <div className="w-full bg-[#060A14] rounded-lg border border-slate-800 overflow-hidden">
                      <svg
                        ref={eccSectorSvgRef}
                        viewBox="0 0 460 140"
                        className="w-full h-[135px]"
                        data-testid="d3-ecc-sector-svg"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Small/Medium Dataset Save Creator + ECC Audit Log */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800 space-y-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#FFD600]">
                        BACKUP & SAVE CREATOR (SMALL / MEDIUM PAYLOADS)
                      </span>
                      <h3 className="text-sm font-bold text-white">
                        {lang === 'da'
                          ? 'Gem Nyt Datasæt med Automatisk CRC-32 & Paritets-Spejl'
                          : 'Store New Dataset with Automatic CRC-32 & Parity Mirror'}
                      </h3>
                    </div>

                    {/* Preset Dataset Generators */}
                    <div className="flex flex-wrap gap-1.5">
                      {SAMPLE_DATASET_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          data-testid={`btn-${preset.id}`}
                          onClick={() => {
                            setNewSlotLabel(
                              lang === 'da' ? preset.labelDa : preset.labelEn
                            );
                            setNewSlotCategory(preset.category);
                            setNewSlotPayload(preset.generatePayload());
                          }}
                          className="px-2 py-1 rounded bg-[#141E36] hover:bg-[#1C2A4B] text-[10px] font-mono text-[#00F0FF] border border-[#00F0FF]/40 cursor-pointer"
                        >
                          {preset.sizeCategory}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div>
                        <label
                          htmlFor="ecc-slot-label-input"
                          className="block text-[10px] uppercase text-slate-400 mb-1"
                        >
                          Slot Label:
                        </label>
                        <input
                          id="ecc-slot-label-input"
                          type="text"
                          value={newSlotLabel}
                          onChange={(e) => setNewSlotLabel(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded bg-[#050811] border border-slate-700 text-white text-xs font-mono"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[10px] uppercase text-slate-400 mb-1">
                          <label htmlFor="ecc-slot-payload-input">
                            Dataset Payload (JSON / Structured Text):
                          </label>
                          <span className="text-[#FFD600]">
                            {formatByteSize(newSlotPayload.length)} ·{' '}
                            {Math.ceil(newSlotPayload.length / 64)} ECC Blocks
                          </span>
                        </div>
                        <textarea
                          id="ecc-slot-payload-input"
                          rows={5}
                          value={newSlotPayload}
                          onChange={(e) => setNewSlotPayload(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded bg-[#050811] border border-slate-700 text-[#80DEEA] text-[11px] font-mono leading-relaxed"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveNewBackupSlot}
                        data-testid="btn-save-ecc-slot"
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded bg-[#FFD600] hover:bg-[#FFC400] text-[#050510] font-bold text-xs uppercase tracking-wider cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {lang === 'da'
                          ? `Gem i ECC LocalStorage Vault (${formatByteSize(newSlotPayload.length)})`
                          : `Save to ECC LocalStorage Vault (${formatByteSize(newSlotPayload.length)})`}
                      </button>
                    </div>
                  </div>

                  {/* ECC Audit Log */}
                  <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#EA80FC]">
                        ECC SYNDROME & SELF-HEALING AUDIT LOG
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {vaultSummary.auditLog.length} events
                      </span>
                    </div>
                    <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
                      {vaultSummary.auditLog.slice(0, 8).map((entry, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded bg-[#060A14] border border-slate-800/90 text-slate-300"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-[#00F0FF]">
                              [{entry.slotId}] {entry.status}
                            </span>
                            <span className="text-slate-400">
                              CRC: {entry.actualCrc32Hex}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-300 mt-0.5">
                            {entry.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 5: Telemetry Dashboard (D3.js 'Truth Score' Line Graph +
              Internal ECC Data Bus + Checkpoint Error Correction Session)
              ================================================================ */}
          {activeTab === 'telemetry-dashboard' && (
            <div className="space-y-4">
              {/* Top Telemetry & Checkpoint Error Correction Control Header */}
              <div className="p-4 rounded-xl bg-[#0B1224] border border-[#00F0FF]/50 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#00F0FF]">
                    D3.JS TELEMETRY DASHBOARD · INTERNAL ECC DATA COMMUNICATION BUS
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    {lang === 'da'
                      ? 'Truth Score Performance Trends på tværs af Kapitler (Ch 1 → Ch 6) & Checkpoint Fejlretning'
                      : 'Truth Score Performance Trends Across Chapters (Ch 1 → Ch 6) & Checkpoint Error Correction'}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Select Checkpoint Chapter"
                    value={debugChapterNum}
                    onChange={(e) => setDebugChapterNum(Number(e.target.value))}
                    className="px-2.5 py-1.5 rounded bg-[#050811] border border-slate-700 text-xs font-mono text-[#FFD600]"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        Chapter {n} Checkpoint
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleRunCheckpointDebugSession}
                    data-testid="btn-run-checkpoint-debug"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#00E676] hover:bg-[#00C853] text-[#050510] font-bold text-xs font-mono uppercase tracking-wider cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    {lang === 'da'
                      ? 'Kør Checkpoint Fejlretning / Debug Session'
                      : 'Run Checkpoint Error Correction / Debug'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Column: D3.js Truth Score Line Graph + Chapter Inspector */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#00E676]">
                          D3.LINE + D3.CURVEMONOTONEX · SQL TELEMETRY_LOGS
                        </span>
                        <h4 className="text-xs font-bold text-white">
                          {lang === 'da'
                            ? 'Verificeret Truth Score Udvikling pr. Kapitel (1854 → 1854-coda)'
                            : 'Verified Truth Score Trajectory by Chapter (1854 → 1854-coda)'}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#131F3A] text-[10px] font-mono text-[#00F0FF]">
                        6 Chapters · ECC Verified
                      </span>
                    </div>

                    <div className="w-full bg-[#060A14] rounded-lg border border-slate-800 overflow-hidden">
                      <svg
                        ref={truthScoreLineSvgRef}
                        viewBox="0 0 620 255"
                        className="w-full h-[245px]"
                        data-testid="d3-truth-score-line-svg"
                      />
                    </div>

                    {/* Selected Chapter Telemetry KPI Strip */}
                    {inspectedTrend && (
                      <div
                        data-testid="telemetry-chapter-inspector"
                        className="p-3 rounded-lg bg-[#060A14] border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs"
                      >
                        <div>
                          <div className="text-[10px] text-slate-400">CHAPTER / SCENE</div>
                          <div className="font-bold text-white">
                            {inspectedTrend.chapterId} ({inspectedTrend.sceneCode})
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">TRUTH SCORE</div>
                          <div className="font-bold text-[#00F0FF]">
                            {inspectedTrend.truthScore} pts
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">WASM CONFIDENCE</div>
                          <div className="font-bold text-[#00E676]">
                            {inspectedTrend.wasmConfidence}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">DELTA VS TARGET</div>
                          <div className="font-bold text-[#FFD600]">
                            +{inspectedTrend.truthScore - inspectedTrend.baselineScore} pts
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Internal Data Communication Bus Packet Monitor */}
                  <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#FFD600]">
                        OPTIMIZED INTERNAL DATA BUS (CRC-32 ↔ HAMMING(7,4) ↔ VAULT ↔ D3 MATRIX)
                      </span>
                      <span className="text-[10px] font-mono text-[#00E676]">
                        O(1) LUT Codec · Zero-Copy Slice CRC
                      </span>
                    </div>

                    <div className="max-h-[145px] overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
                      {vaultSummary.busPackets.slice(0, 6).map((pkt) => (
                        <div
                          key={pkt.packetId}
                          className="p-2 rounded bg-[#060A14] border border-slate-800/90 flex flex-wrap items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-[#14223D] text-[#00F0FF] text-[10px] font-bold">
                              {pkt.packetId}
                            </span>
                            <span className="text-white font-semibold text-[10px]">
                              {pkt.channel}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {pkt.sourceModule} → {pkt.destinationModule}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-[#FFD600]">
                              CRC:{pkt.crc32Hex}
                            </span>
                            <span className="text-[#EA80FC]">
                              HAM:{pkt.hammingCodewordHex}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold ${
                                pkt.status === 'SELF_HEALED'
                                  ? 'bg-[#00F0FF]/20 text-[#00F0FF]'
                                  : pkt.status === 'FAULT_DETECTED'
                                  ? 'bg-[#FF1744]/20 text-[#FF5252]'
                                  : 'bg-[#00E676]/20 text-[#00E676]'
                              }`}
                            >
                              {pkt.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: 5-Stage Checkpoint Error Correction & Debugging Session Output */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-4 rounded-xl bg-[#0B1224] border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#EA80FC]">
                          CHECKPOINT ERROR CORRECTION / DEBUGGING SESSION
                        </span>
                        <h4 className="text-xs font-bold text-white">
                          {lang === 'da'
                            ? '5-Trins Intern Databus Diagnostik & Selvreparations-Rapport'
                            : '5-Stage Internal Data Bus Diagnostic & Self-Healing Trace'}
                        </h4>
                      </div>
                      {checkpointDebugResult && (
                        <span
                          data-testid="checkpoint-debug-badge"
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/50"
                        >
                          {checkpointDebugResult.sessionId} · PASSED
                        </span>
                      )}
                    </div>

                    {checkpointDebugResult ? (
                      <div
                        data-testid="checkpoint-debug-report"
                        className="space-y-2.5 font-mono text-xs"
                      >
                        <div className="p-2.5 rounded bg-[#060A14] border border-[#00E676]/50 text-[11px] text-[#00E676]">
                          {checkpointDebugResult.summaryMessage}
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                          <div className="p-2 rounded bg-[#060A14] border border-slate-800">
                            <div className="text-slate-400">CRC RESTORED</div>
                            <div className="font-bold text-[#00F0FF] mt-0.5">
                              {checkpointDebugResult.restoredCrc32Hex}
                            </div>
                          </div>
                          <div className="p-2 rounded bg-[#060A14] border border-slate-800">
                            <div className="text-slate-400">HEALED SECTORS</div>
                            <div className="font-bold text-[#FFD600] mt-0.5">
                              {checkpointDebugResult.corruptedSectors
                                .map((s) => `B${s}`)
                                .join(', ')}{' '}
                              ({checkpointDebugResult.repairedBytesCount}B)
                            </div>
                          </div>
                          <div className="p-2 rounded bg-[#060A14] border border-slate-800">
                            <div className="text-slate-400">BUS THROUGHPUT</div>
                            <div className="font-bold text-[#00E676] mt-0.5">
                              {checkpointDebugResult.busThroughputMBps} MB/s
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                          {checkpointDebugResult.stages.map((st) => (
                            <div
                              key={st.stageNumber}
                              className="p-2.5 rounded bg-[#060A14] border border-slate-800 space-y-1"
                            >
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-[#00F0FF]">
                                  {st.stageCode}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded font-bold ${
                                    st.status === 'FAULT_INJECTED'
                                      ? 'bg-[#FF1744]/20 text-[#FF5252]'
                                      : st.status === 'HEALED'
                                      ? 'bg-[#00F0FF]/20 text-[#00F0FF]'
                                      : 'bg-[#00E676]/20 text-[#00E676]'
                                  }`}
                                >
                                  {st.status}
                                </span>
                              </div>
                              <div className="text-[11px] font-semibold text-white">
                                {lang === 'da' ? st.titleDa : st.titleEn}
                              </div>
                              <div className="text-[10px] text-slate-300 leading-relaxed">
                                {st.detail}
                              </div>
                              <div className="flex items-center justify-between text-[9.5px] text-slate-400 pt-0.5">
                                <span>CRC: {st.crc32Hex}</span>
                                <span>Hamming: {st.hammingSyndromeHex}</span>
                                <span>{st.durationMicros} µs</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-[#060A14] border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
                        <p>
                          {lang === 'da'
                            ? 'Klik på "Kør Checkpoint Fejlretning / Debug Session" for at afvikle en 5-trins fejlretnings- og stresstest mellem IEEE 802.3 CRC-32, Hamming(7,4) SEC-DED, Backup Vault [SLOT-02] og SQL Telemetri.'
                            : 'Click "Run Checkpoint Error Correction / Debug" to execute a 5-stage fault-injection and self-healing diagnostic across IEEE 802.3 CRC-32, Hamming(7,4) SEC-DED, Backup Vault [SLOT-02], and SQL Telemetry.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 6: o-Llama · AXIOM-7 System & Program Package Manager (v2.4.0)
              ================================================================ */}
          {activeTab === 'system-updates' && (
            <div className="space-y-4">
              {/* Top System Update Banner */}
              <div className="p-4 rounded-xl bg-[#0B1224] border border-[#00E676]/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#00E676]/20 border border-[#00E676] flex items-center justify-center text-[#00E676] shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#00E676]">
                      o-LLAMA · AXIOM-7 SYSTEM & PROGRAM PACKAGE MANAGER · {AXIOM_RELEASE_VERSION}
                    </div>
                    <h3 className="text-sm font-bold text-white" data-testid="system-update-headline">
                      {systemUpdateReport
                        ? lang === 'da'
                          ? systemUpdateReport.summaryDa
                          : systemUpdateReport.summaryEn
                        : lang === 'da'
                        ? 'Alle 8 interne systemer og programmer kører på seneste stabile LTS-udgave (v2.4.0-stable).'
                        : 'All 8 internal systems and programs are running the latest stable LTS release (v2.4.0-stable).'}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleInstallAndVerifyAllSystems}
                  data-testid="btn-update-all-systems"
                  className="flex items-center gap-2 px-4 py-2 rounded bg-[#00E676] hover:bg-[#00C853] text-[#050510] font-bold text-xs font-mono uppercase tracking-wider cursor-pointer shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {lang === 'da'
                    ? 'Opdater & Verificer Alle 8 Systemer (v2.4.0)'
                    : 'Update & Verify All 8 Systems (v2.4.0)'}
                </button>
              </div>

              {/* System KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-[#0B1224] border border-slate-800">
                  <div className="text-[10px] text-slate-400">RELEASE CHANNEL</div>
                  <div className="text-sm font-bold text-[#00E676] mt-0.5">
                    {AXIOM_RELEASE_VERSION} (LTS)
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0B1224] border border-slate-800">
                  <div className="text-[10px] text-slate-400">RUST/WASM ABI HANDSHAKE</div>
                  <div className="text-sm font-bold text-[#00F0FF] mt-0.5" data-testid="system-abi-readout">
                    ABI {benchResult.kernelAbiVersion} (rustc 1.85.0)
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0B1224] border border-slate-800">
                  <div className="text-[10px] text-slate-400">INSTALLED SUBSYSTEMS</div>
                  <div className="text-sm font-bold text-[#FFD600] mt-0.5">
                    {systemPrograms.length} / {systemPrograms.length} VERIFIED
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#0B1224] border border-slate-800">
                  <div className="text-[10px] text-slate-400">OFFLINE SW CACHE</div>
                  <div className="text-sm font-bold text-[#EA80FC] mt-0.5">
                    axiom7-offline-v2.4.0-stable
                  </div>
                </div>
              </div>

              {/* 8 Internal Systems & Programs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {systemPrograms.map((prog) => (
                  <div
                    key={prog.id}
                    data-testid={`system-program-card-${prog.id}`}
                    className="p-3.5 rounded-xl bg-[#0B1224] border border-slate-800 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-[#152342] text-[10px] font-mono font-bold text-[#00F0FF]">
                            {prog.id}
                          </span>
                          <span className="text-xs font-mono font-bold text-[#FFD600]">
                            {prog.programName}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/50">
                          {prog.status}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white mt-1.5">
                        {lang === 'da' ? prog.subsystemTitleDa : prog.subsystemTitleEn}
                      </h4>
                      <div className="text-[11px] font-mono text-[#80DEEA] mt-0.5">
                        {prog.installedVersion} · {prog.runtimeStack}
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                        {lang === 'da' ? prog.changelogDa : prog.changelogEn}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>
                        Footprint: <strong className="text-white">{formatByteSize(prog.binarySizeBytes)}</strong>
                      </span>
                      <span>
                        IEEE CRC-32: <strong className="text-[#00E676]">{prog.crc32Hex}</strong>
                      </span>
                      <span className="text-[#00F0FF]">{prog.channel}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
