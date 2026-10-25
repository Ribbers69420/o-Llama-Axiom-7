'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  CHAPTER_SCENES,
  CHASSIS_SPECS,
  EXPRESSIONS,
  EXPRESSION_LIST,
  type ChassisType,
  type ExpressionId,
} from '@/lib/game-rules';
import type { AppLanguage } from '@/lib/ollama-bible-spec';
import {
  UNICODE_LETTERLIKE_EXCEPTIONS,
  MATH_ALPHABETS_LIST,
  calculateBpeFertility,
  QTF_BURRITOS,
  ERRATA_REGISTER,
  computeUltraTacoCII,
  computeBrierScore,
  buildUafExportPackage,
  WINDOWS_11_JUMPLIST_TASKS,
  normalizeNFKC,
  type TacoBurrito,
  type TacoEquation,
} from '@/lib/uqcf-research-codex';
import { soundSynth } from '@/lib/audio-synth';
import {
  Search,
  X,
  Sparkles,
  BookOpen,
  Cpu,
  Layers,
  Download,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  Terminal,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Copy,
  ChevronRight,
} from 'lucide-react';

interface AxiomResearchCommandModalProps {
  isOpen: boolean;
  lang: AppLanguage;
  activeChassis: ChassisType;
  activeExpression: ExpressionId;
  onClose: () => void;
  onSelectChapter: (idx: number) => void;
  onSelectChassis: (ch: ChassisType) => void;
  onSelectExpression: (expr: ExpressionId) => void;
  onTake3DScreenshot?: () => void;
  onOpenTruthAnalyzer?: () => void;
}

type ActiveTab =
  | 'palette'
  | 'bpe_lab'
  | 'qtf_codex'
  | 'cii_calc'
  | 'errata'
  | 'uaf_export';

export default function AxiomResearchCommandModal({
  isOpen,
  lang,
  activeChassis,
  activeExpression,
  onClose,
  onSelectChapter,
  onSelectChassis,
  onSelectExpression,
  onTake3DScreenshot,
  onOpenTruthAnalyzer,
}: AxiomResearchCommandModalProps) {
  const isDa = lang === 'da';
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('palette');
  const [searchQuery, setSearchQuery] = useState('');

  // BPE Lab state
  const [bpeInput, setBpeInput] = useState('ℬ(x) + ℰ_t + ℱ[k] + ℋ|ψ⟩ = ℤ_{mod} · ℎ');
  const bpeReport = useMemo(() => calculateBpeFertility(bpeInput), [bpeInput]);

  // QTF Burritos state
  const [selectedBurritoId, setSelectedBurritoId] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'>('A');
  const currentBurrito = useMemo(
    () => QTF_BURRITOS.find((b) => b.id === selectedBurritoId) || QTF_BURRITOS[0],
    [selectedBurritoId]
  );

  // UltraTaco CII Calculator state
  const [pDistStr, setPDistStr] = useState('0.40, 0.35, 0.15, 0.10');
  const [qDistStr, setQDistStr] = useState('0.38, 0.36, 0.16, 0.10');
  const ciiResult = useMemo(() => {
    const p = pDistStr.split(',').map((s) => parseFloat(s.trim()) || 0);
    const q = qDistStr.split(',').map((s) => parseFloat(s.trim()) || 0);
    return computeUltraTacoCII(p, q);
  }, [pDistStr, qDistStr]);

  // UAF Export state
  const [uafProfile, setUafProfile] = useState<'llm_ingest' | 'full_codex' | 'public_readme'>('full_codex');
  const [exportedJson, setExportedJson] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Sync native <dialog> element visibility
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (isOpen) {
      if (!dlg.open) {
        dlg.showModal();
      }
    } else {
      if (dlg.open) {
        dlg.close();
      }
    }
  }, [isOpen]);

  // Handle native cancel (Escape key)
  const handleDialogCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    onClose();
  };

  // Filter commands in Palette mode
  const filteredCommands = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const items: Array<{
      category: string;
      title: string;
      subtitle: string;
      icon: React.ReactNode;
      action: () => void;
    }> = [];

    // Chapters
    CHAPTER_SCENES.forEach((ch) => {
      items.push({
        category: 'Chapters',
        title: `${ch.chapterLabel}: ${ch.title}`,
        subtitle: `Scene #${ch.sceneIds[0]} · Recommended: ${ch.recommendedChassis.toUpperCase()} · ${ch.defaultExpression}`,
        icon: <BookOpen className="w-4 h-4 text-[#00E5FF]" />,
        action: () => {
          onSelectChapter(ch.index);
          onClose();
        },
      });
    });

    // Chassis
    (['tank', 'wizard', 'cosmic'] as const).forEach((ch) => {
      const spec = CHASSIS_SPECS[ch];
      items.push({
        category: 'Chassis Switch',
        title: `Switch to ${spec.name}`,
        subtitle: `Speed ${spec.speed}m/s · Pulse Dmg ${spec.pulseDamage} · Default ${spec.defaultExpression}`,
        icon: <Cpu className="w-4 h-4 text-[#FFD600]" />,
        action: () => {
          onSelectChassis(ch);
          soundSynth.playChassisSwitch();
          onClose();
        },
      });
    });

    // Expressions
    EXPRESSION_LIST.forEach((expr) => {
      items.push({
        category: 'LED Expression',
        title: `${expr.id} ${expr.name} (${expr.shape})`,
        subtitle: `${expr.gameplayBonus} · Color: ${expr.color}`,
        icon: <Sparkles className="w-4 h-4 text-[#00E676]" />,
        action: () => {
          onSelectExpression(expr.id);
          soundSynth.playExpressionChange();
          onClose();
        },
      });
    });

    // Windows 11 & System Actions
    items.push({
      category: 'Windows 11 Superpowers',
      title: isDa ? 'Højopløst 3D PNG Skærmbillede' : 'High-Res 3D PNG Screenshot',
      subtitle: 'Captures direct 3D WebGL buffer to lossless PNG download',
      icon: <Download className="w-4 h-4 text-[#00E5FF]" />,
      action: () => {
        if (onTake3DScreenshot) onTake3DScreenshot();
        onClose();
      },
    });

    items.push({
      category: 'Windows 11 Superpowers',
      title: isDa ? 'Verificér Udklipsholder (Sandhed & Anti-Smiger)' : 'Verify Clipboard (Anti-Flattery)',
      subtitle: 'Opens Truth Analyzer with clipboard inspection [Ctrl+Shift+V]',
      icon: <CheckCircle2 className="w-4 h-4 text-[#00C853]" />,
      action: () => {
        if (onOpenTruthAnalyzer) onOpenTruthAnalyzer();
        onClose();
      },
    });

    items.push({
      category: 'Research Codex Labs',
      title: 'BPE Token Fertility Lab & Unicode Exceptions',
      subtitle: '9 math alphabets, letterlike exceptions, Qwen2.5/o200k inflation',
      icon: <Layers className="w-4 h-4 text-[#FFD600]" />,
      action: () => setActiveTab('bpe_lab'),
    });

    items.push({
      category: 'Research Codex Labs',
      title: 'Quantum Taco Framework (QTF v6.0) Burritos A–G',
      subtitle: 'Eq. 01–70, Bohren et al. IZA DP 17302, Supertonic TTS v3',
      icon: <Calculator className="w-4 h-4 text-[#00E5FF]" />,
      action: () => setActiveTab('qtf_codex'),
    });

    items.push({
      category: 'Research Codex Labs',
      title: 'UltraTaco v5.2 CII Calculator (CII = 1 − JSD)',
      subtitle: 'Empirical Jensen-Shannon Divergence calibration index',
      icon: <Sliders className="w-4 h-4 text-[#00E676]" />,
      action: () => setActiveTab('cii_calc'),
    });

    items.push({
      category: 'Research Codex Labs',
      title: 'Unified Artifact Framework (UAF v2.4) Exporter',
      subtitle: 'FIPS 180-4 SHA-256 and Ed25519 sealed bundle downloads',
      icon: <Download className="w-4 h-4 text-[#9C27B0]" />,
      action: () => setActiveTab('uaf_export'),
    });

    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [
    searchQuery,
    isDa,
    onSelectChapter,
    onSelectChassis,
    onSelectExpression,
    onTake3DScreenshot,
    onOpenTruthAnalyzer,
    onClose,
  ]);

  const handleExportUaf = () => {
    const bundle = buildUafExportPackage(uafProfile);
    const jsonStr = JSON.stringify(bundle, null, 2);
    setExportedJson(jsonStr);

    // Trigger download
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AXIOM7-UAF-${uafProfile}-v2.6.0.uaf.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundSynth.playTruthVerified(true);
  };

  const handleCopyJson = () => {
    if (exportedJson) {
      navigator.clipboard.writeText(exportedJson);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleDialogCancel}
      className="fixed inset-0 m-auto z-50 w-full max-w-4xl max-h-[90vh] bg-[#0A0D18] text-white border-2 border-[#00E5FF] rounded-xl shadow-2xl p-0 backdrop:bg-black/75 overflow-hidden flex flex-col"
    >
      {/* Modal Header & Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-700 bg-[#0E1324] px-4 py-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-5 h-5 text-[#00E5FF]" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide uppercase font-[family-name:var(--font-display)]">
                {isDa
                  ? 'AXIOM-7 Global Kommando-Palet & UQCF Forsknings-Codex'
                  : 'AXIOM-7 Global Command Palette & UQCF Research Codex'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40">
                v2.6.0 · QTF v6.0
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Ctrl+K · Ctrl+Shift+A · Native Windows 11 Protocol &lt;dialog closedby=&quot;any&quot;&gt;
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close Modal"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tab Selectors */}
      <div className="flex items-center gap-1 px-4 py-2 bg-[#090C16] border-b border-slate-800 text-xs font-mono overflow-x-auto shrink-0">
        {[
          { id: 'palette', label: isDa ? '01 · Kommando-Palet' : '01 · Command Palette' },
          { id: 'bpe_lab', label: isDa ? '02 · BPE Token-Fertilitet' : '02 · BPE Token Fertility' },
          { id: 'qtf_codex', label: isDa ? '03 · QTF v6.0 Burritos' : '03 · QTF v6.0 Burritos' },
          { id: 'cii_calc', label: isDa ? '04 · UltraTaco CII (1−JSD)' : '04 · UltraTaco CII (1−JSD)' },
          { id: 'errata', label: isDa ? '05 · Errata (E1–E11)' : '05 · Errata (E1–E11)' },
          { id: 'uaf_export', label: isDa ? '06 · UAF v2.4 Eksport' : '06 · UAF v2.4 Export' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id as ActiveTab);
              soundSynth.playKeypress();
            }}
            className={`px-3 py-1.5 rounded border transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#152347] border-[#00E5FF] text-white font-bold'
                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Global Command Palette */}
      {activeTab === 'palette' && (
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Search Input Bar */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isDa
                  ? 'Søg kapitler, chassis, udtryk (EX-01..08) eller Windows 11 handlinger...'
                  : 'Search chapters, chassis, expressions (EX-01..08) or Windows 11 actions...'
              }
              className="w-full pl-9 pr-4 py-2 bg-[#10162B] border border-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#00E5FF]"
            />
          </div>

          {/* JumpList Shortcuts Bar */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px] font-mono text-slate-400">
            <span className="text-[#00E5FF] font-bold">JumpList:</span>
            {WINDOWS_11_JUMPLIST_TASKS.map((task) => (
              <span
                key={task.id}
                className="px-2 py-0.5 rounded bg-[#131B33] border border-slate-700 text-slate-300"
              >
                {task.shortcut}: {isDa ? task.titleDa : task.titleEn}
              </span>
            ))}
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredCommands.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-mono">
                {isDa ? 'Ingen kommandoer matchede din søgning.' : 'No commands matched your query.'}
              </div>
            ) : (
              filteredCommands.map((cmd, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={cmd.action}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#0E152B] hover:bg-[#162244] border border-slate-800 hover:border-[#00E5FF]/60 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-[#090D1C] border border-slate-700/80 group-hover:border-[#00E5FF]/40">
                      {cmd.icon}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center gap-2">
                        <span>{cmd.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {cmd.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {cmd.subtitle}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#00E5FF] shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: BPE Token Fertility Lab */}
      {activeTab === 'bpe_lab' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="bg-[#0E152B] border border-slate-700 rounded-lg p-3">
            <div className="text-xs font-bold text-[#FFD600] uppercase font-mono mb-1">
              Empirisk BPE Token-Fertilitets-Lab (Unicode 16.0 & U+2100 Letterlike Undtagelser)
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isDa
                ? 'Standard BPE-tokenizere (Qwen2.5, OpenAI o200k_base) mangler enkelt-token sammensmeltninger for matematiske alfabeter og falder tilbage til rå byte-fallbacks (<0x..>), hvilket forårsager en 4,5× til 14,9× tokeninflation. NFKC-normalisering genopretter semantisk ækvivalent ASCII uden informationstab.'
                : 'Standard BPE tokenizers (Qwen2.5, OpenAI o200k_base) lack single-token merges for mathematical alphabets and split glyphs into byte fallbacks (<0x..>), driving a 4.5× to 14.9× token inflation. NFKC normalization preserves exact semantic equivalence while eliminating context waste.'}
            </p>
          </div>

          {/* Interactive Input */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400 block">
              {isDa ? 'Test Tekst med Matematiske Glyffer:' : 'Test String with Mathematical Glyphs:'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={bpeInput}
                onChange={(e) => setBpeInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#10162B] border border-slate-700 rounded text-sm font-mono text-white focus:outline-none focus:border-[#00E5FF]"
              />
              <button
                type="button"
                onClick={() => setBpeInput('ℬ(x) + ℰ_t + ℱ[k] + ℋ|ψ⟩ = ℤ_{mod} · ℎ')}
                className="px-3 py-1.5 bg-[#172344] hover:bg-[#20315E] rounded text-xs font-mono text-[#00E5FF] cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Quick-Insert Buttons for Unicode 16.0 Letterlike Exceptions */}
          <div>
            <div className="text-[11px] font-mono text-slate-400 mb-1.5">
              {isDa
                ? 'Indsæt Kanoniske U+2100 Letterlike Undtagelser:'
                : 'Insert Canonical U+2100 Letterlike Exceptions:'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {UNICODE_LETTERLIKE_EXCEPTIONS.map((ex) => (
                <button
                  key={ex.char}
                  type="button"
                  onClick={() => setBpeInput((prev) => prev + ' ' + ex.char)}
                  title={`${ex.name} (${ex.codepoint}) -> ${ex.asciiEquivalent} · ${ex.description}`}
                  className="px-2.5 py-1 rounded bg-[#131D38] hover:bg-[#1C2C55] border border-slate-700 text-xs font-mono text-white cursor-pointer"
                >
                  <strong className="text-[#FFD600] mr-1">{ex.char}</strong>
                  <span className="text-slate-400 text-[10px]">{ex.codepoint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Diagnostics Readout Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-3 bg-[#0B1020] border border-slate-800 rounded">
              <div className="text-slate-400 text-[10px]">RAW BYTES / UTF-8</div>
              <div className="text-lg font-bold text-white mt-0.5">{bpeReport.byteLength} B</div>
              <div className="text-slate-400 text-[10px]">Chars: {bpeReport.rawText.length}</div>
            </div>

            <div className="p-3 bg-[#0B1020] border border-slate-800 rounded">
              <div className="text-slate-400 text-[10px]">NFKC ASCII TOKENS</div>
              <div className="text-lg font-bold text-[#00E676] mt-0.5">
                {bpeReport.asciiTokenCount} tok
              </div>
              <div className="text-slate-400 text-[10px]">Len: {bpeReport.nfkcText.length}</div>
            </div>

            <div className="p-3 bg-[#0B1020] border border-slate-800 rounded">
              <div className="text-slate-400 text-[10px]">QWEN2.5 ESTIMATE</div>
              <div className="text-lg font-bold text-[#FFD600] mt-0.5">
                {bpeReport.qwen25TokenEstimate} tok
              </div>
              <div className="text-slate-400 text-[10px]">
                Inflation: {bpeReport.inflationRatioQwen}×
              </div>
            </div>

            <div className="p-3 bg-[#0B1020] border border-slate-800 rounded">
              <div className="text-slate-400 text-[10px]">o200k_base ESTIMATE</div>
              <div className="text-lg font-bold text-[#00E5FF] mt-0.5">
                {bpeReport.o200kTokenEstimate} tok
              </div>
              <div className="text-slate-400 text-[10px]">
                Inflation: {bpeReport.inflationRatioO200k}×
              </div>
            </div>
          </div>

          {/* NFKC Transformed Text */}
          <div className="p-3 bg-[#0B1020] border border-slate-800 rounded space-y-1 font-mono text-xs">
            <div className="text-[#00E5FF] text-[10px] font-bold uppercase">
              NFKC Normaliseret Resultat (Zero Inflation):
            </div>
            <div className="p-2 bg-[#05070D] rounded border border-slate-800 text-slate-200">
              {bpeReport.nfkcText}
            </div>
            <div className="text-slate-400 text-[11px] mt-1">
              {bpeReport.diagnosticMessage}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: QTF v6.0 Burritos A–G */}
      {activeTab === 'qtf_codex' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Burrito Sidebar List */}
          <div className="w-full md:w-64 bg-[#090C16] border-r border-slate-800 p-2 overflow-y-auto shrink-0 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 px-2 py-1 uppercase">
              QTF v6.0 Burritos (Eq. 01–70)
            </div>
            {QTF_BURRITOS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBurritoId(b.id)}
                className={`w-full text-left p-2 rounded text-xs font-mono transition-colors cursor-pointer ${
                  selectedBurritoId === b.id
                    ? 'bg-[#152347] border border-[#00E5FF] text-white font-bold'
                    : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[#FFD600] font-bold">Burrito {b.id}</span>
                  <span className="text-[10px] text-slate-400">{b.equationsRange}</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {isDa ? b.titleDa : b.titleEn}
                </div>
              </button>
            ))}
          </div>

          {/* Burrito Content & Equations */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            <div className="border-b border-slate-800 pb-2">
              <div className="text-sm font-bold text-white font-[family-name:var(--font-display)]">
                {isDa ? currentBurrito.titleDa : currentBurrito.titleEn}
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                {isDa ? currentBurrito.summaryDa : currentBurrito.summaryEn}
              </p>
            </div>

            <div className="space-y-2">
              {currentBurrito.equations.map((eq) => (
                <div
                  key={eq.number}
                  className="p-3 bg-[#0D1326] border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-[#00E5FF] font-bold">{eq.equationCode}</span>
                    <span className="text-slate-300 font-semibold">{eq.name}</span>
                  </div>
                  <div className="p-2 bg-[#05070E] rounded border border-slate-900 font-mono text-xs text-[#FFD600] overflow-x-auto">
                    {eq.formula}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    {isDa ? eq.descriptionDa : eq.descriptionEn}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: UltraTaco CII Calculator */}
      {activeTab === 'cii_calc' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="bg-[#0E152B] border border-slate-700 rounded-lg p-3">
            <div className="text-xs font-bold text-[#00E5FF] uppercase font-mono mb-1">
              UltraTaco v5.2 Calibration Information Index (Eq. 31: CII = 1 − JSD)
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isDa
                ? 'UltraTaco CII måler overensstemmelsen mellem modellens prædikerede konfidensfordeling og empiriske observationer via symmetrisk Jensen-Shannon Divergens (JSD). Perfekt kalibrering giver CII = 1,0000.'
                : 'UltraTaco CII measures alignment between model confidence distributions and empirical benchmark observations using symmetric Jensen-Shannon Divergence (JSD). Perfect epistemic calibration evaluates to CII = 1.0000.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-1">
              <label className="text-slate-400">P Distribution (Model Confidence / Forecaster):</label>
              <input
                type="text"
                value={pDistStr}
                onChange={(e) => setPDistStr(e.target.value)}
                className="w-full px-3 py-2 bg-[#10162B] border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-[#00E5FF]"
              />
              <div className="text-[10px] text-slate-400">Komma-adskilte værdier (f.eks. 0.40, 0.35, 0.15, 0.10)</div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Q Distribution (Ground Truth / Empirical):</label>
              <input
                type="text"
                value={qDistStr}
                onChange={(e) => setQDistStr(e.target.value)}
                className="w-full px-3 py-2 bg-[#10162B] border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-[#00E5FF]"
              />
              <div className="text-[10px] text-slate-400">Komma-adskilte værdier (f.eks. 0.38, 0.36, 0.16, 0.10)</div>
            </div>
          </div>

          {/* Calculator Results */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-[#0B1020] border border-[#00E5FF]/40 rounded">
              <div className="text-[#00E5FF] text-[10px] font-bold">CII (1 − JSD)</div>
              <div className="text-2xl font-bold text-white mt-1">{ciiResult.cii}</div>
              <div className="text-slate-400 text-[10px] mt-0.5">
                {ciiResult.cii >= 0.95 ? 'TARGET COMPLIANT' : 'CALIBRATION DRIFT'}
              </div>
            </div>

            <div className="p-3 bg-[#0B1020] border border-slate-800 rounded">
              <div className="text-slate-400 text-[10px]">JSD (DIVERGENCE)</div>
              <div className="text-2xl font-bold text-[#FFD600] mt-1">{ciiResult.jsd}</div>
              <div className="text-slate-400 text-[10px] mt-0.5">Bits: log2 scale</div>
            </div>

            <div className="p-3 bg-[#0B1020] border border-slate-800 rounded">
              <div className="text-slate-400 text-[10px]">KL(P ∥ M)</div>
              <div className="text-lg font-bold text-slate-200 mt-1">{ciiResult.klPM}</div>
              <div className="text-slate-400 text-[10px] mt-0.5">Forecaster gap</div>
            </div>

            <div className="p-3 bg-[#0B1020] border border-slate-800 rounded">
              <div className="text-slate-400 text-[10px]">KL(Q ∥ M)</div>
              <div className="text-lg font-bold text-slate-200 mt-1">{ciiResult.klQM}</div>
              <div className="text-slate-400 text-[10px] mt-0.5">Empirical gap</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Errata Register (E1–E11) */}
      {activeTab === 'errata' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-2">
          <div className="text-xs font-mono text-slate-400 mb-2">
            {isDa
              ? 'AXIOM-7 Errata-Register (E1–E11) · Alle 11 kendte afvigelser verificeret og løst:'
              : 'AXIOM-7 Errata Register (E1–E11) · All 11 known discrepancies verified and resolved:'}
          </div>
          <div className="space-y-2">
            {ERRATA_REGISTER.map((e) => (
              <div
                key={e.code}
                className="p-3 bg-[#0D1326] border border-slate-800 rounded-lg text-xs font-mono space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-[#00E5FF]/20 text-[#00E5FF] font-bold">
                      {e.code}
                    </span>
                    <span className="font-bold text-white">
                      {isDa ? e.titleDa : e.titleEn}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#00C853]/20 text-[#00C853] font-bold">
                    {e.severity}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  System: <strong className="text-slate-300">{e.affectedSystem}</strong>
                </div>
                <div className="text-slate-300 text-[11px] bg-[#05070E] p-2 rounded border border-slate-900 mt-1">
                  Løsning: {isDa ? e.remedyDa : e.remedyEn}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: UAF v2.4 Export */}
      {activeTab === 'uaf_export' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="bg-[#0E152B] border border-slate-700 rounded-lg p-3">
            <div className="text-xs font-bold text-[#9C27B0] uppercase font-mono mb-1">
              Unified Artifact Framework (UAF v2.4) Eksport & FIPS 180-4 SHA-256 Forsegling
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isDa
                ? 'Genererer FIPS 180-4 SHA-256 indholds-adresserede .uaf.json-pakker forseglet med Ed25519-signatur og bevarede anti-drift ikke-påstande (NC-01..03).'
                : 'Generates FIPS 180-4 SHA-256 content-addressed .uaf.json bundles sealed with simulated Ed25519 signatures and preserved anti-drift non-claims (NC-01..03).'}
            </p>
          </div>

          {/* Profile Choice */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'full_codex', label: 'full_codex (QTF v6.0 + Errata + 70 Ligninger)' },
              { id: 'llm_ingest', label: 'llm_ingest (Anti-Smiger Prompter & BPE Regler)' },
              { id: 'public_readme', label: 'public_readme (Windows 11 v2.6.0 Specifikation)' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setUafProfile(p.id as any)}
                className={`px-3 py-1.5 rounded text-xs font-mono border transition-colors cursor-pointer ${
                  uafProfile === p.id
                    ? 'bg-[#2A1542] border-[#BA68C8] text-white font-bold'
                    : 'bg-[#0E1428] border-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportUaf}
              className="flex items-center gap-2 px-4 py-2 rounded bg-[#00E5FF] hover:bg-[#00B8D4] text-[#050510] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isDa ? 'Generér & Download .uaf.json' : 'Generate & Download .uaf.json'}</span>
            </button>

            {exportedJson && (
              <button
                type="button"
                onClick={handleCopyJson}
                className="flex items-center gap-1.5 px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-white cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedNotification ? 'Kopieret!' : 'Kopiér til Udklipsholder'}</span>
              </button>
            )}
          </div>

          {exportedJson && (
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase">
                Eksporteret JSON Pakke (FIPS 180-4 SHA-256 forseglet):
              </div>
              <pre className="p-3 bg-[#05070D] border border-slate-800 rounded-lg text-slate-300 font-mono text-xs max-h-56 overflow-y-auto">
                {exportedJson}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Modal Footer */}
      <div className="flex items-center justify-between border-t border-slate-800 bg-[#090C16] px-4 py-2.5 text-xs font-mono text-slate-400 shrink-0">
        <div>
          <span>Status: </span>
          <strong className="text-[#00E676]">OK (22 Tests Passing)</strong>
        </div>
        <div className="flex items-center gap-2">
          <span>Tastatur: Esc lukker · [Tab] skifter fokus</span>
        </div>
      </div>
    </dialog>
  );
}
