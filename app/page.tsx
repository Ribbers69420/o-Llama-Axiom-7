'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AxiomThreeCanvas, { type ActiveGameplaySnapshot } from '@/components/AxiomThreeCanvas';
import TruthAnalyzerModal from '@/components/TruthAnalyzerModal';
import MasterCodexModal from '@/components/MasterCodexModal';
import OLlamaDesignBookModal from '@/components/OLlamaDesignBookModal';
import {
  CHAPTER_SCENES,
  CHASSIS_SPECS,
  EXPRESSIONS,
  EXPRESSION_LIST,
  type ChassisType,
  type ExpressionId,
  type GameStatus,
  type PillarName,
} from '@/lib/game-rules';
import type { AppLanguage } from '@/lib/ollama-bible-spec';
import { soundSynth } from '@/lib/audio-synth';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Globe,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';

const ALL_PILLARS: PillarName[] = ['FACTS', 'EVIDENCE', 'DATA', 'REALITY'];

export default function AxiomGameShellPage() {
  const [lang, setLang] = useState<AppLanguage>('da');
  const [status, setStatus] = useState<GameStatus>('title');
  const [chapterIndex, setChapterIndex] = useState<number>(0);
  const [chassis, setChassis] = useState<ChassisType>('tank');
  const [expression, setExpression] = useState<ExpressionId>('EX-01');
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [terminalOpen, setTerminalOpen] = useState<boolean>(false);
  const [codexOpen, setCodexOpen] = useState<boolean>(false);
  const [designBookOpen, setDesignBookOpen] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);

  const [pulseTriggerCount, setPulseTriggerCount] = useState<number>(0);
  const [verifiedCelebrationCount, setVerifiedCelebrationCount] = useState<number>(0);
  const [verifiedClaimsTotal, setVerifiedClaimsTotal] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(0);

  const [snapshot, setSnapshot] = useState<ActiveGameplaySnapshot>({
    hp: 5,
    maxHp: 5,
    score: 0,
    tomesCollected: 0,
    targetTomes: CHAPTER_SCENES[0].targetTomes,
    purgesCount: 0,
    targetPurges: CHAPTER_SCENES[0].targetPurges,
    pillarsUnlocked: [],
    nearbyTomeClaimIndex: null,
  });

  const isDa = lang === 'da';

  // Sync game state to document.body.dataset.state for automated verification
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.dataset.state =
        status === 'victory' ? 'gameover' : status;
    }
  }, [status]);

  // Support ?autostart=1 query param to skip straight to 'playing'
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        setStatus('playing');
      }
    }
  }, []);

  const handleStartGame = useCallback((targetChapterIdx?: number) => {
    if (typeof targetChapterIdx === 'number') {
      setChapterIndex(targetChapterIdx);
      const cSpec = CHAPTER_SCENES[targetChapterIdx] || CHAPTER_SCENES[0];
      setChassis(cSpec.recommendedChassis);
      setExpression(cSpec.defaultExpression);
    }
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setStatus('playing');
    soundSynth.playChassisSwitch();
  }, []);

  const handleSelectChassis = useCallback((newChassis: ChassisType) => {
    setChassis(newChassis);
    setExpression(CHASSIS_SPECS[newChassis].defaultExpression);
    soundSynth.playChassisSwitch();
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundSynth.muted = next;
      return next;
    });
  }, []);

  // Global keyboard shortcuts for Title Start, Chassis (1-3), Terminal (T), Design Book (B), Codex (C), Dock (H), Pause (Esc/P)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (status === 'title' && !terminalOpen && !codexOpen && !designBookOpen) {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleStartGame();
          return;
        }
      }

      if (e.code === 'Digit1') handleSelectChassis('tank');
      else if (e.code === 'Digit2') handleSelectChassis('wizard');
      else if (e.code === 'Digit3') handleSelectChassis('cosmic');
      else if (e.code === 'KeyT') {
        e.preventDefault();
        setTerminalOpen((prev) => !prev);
      } else if (e.code === 'KeyB') {
        e.preventDefault();
        setDesignBookOpen((prev) => !prev);
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        setCodexOpen((prev) => !prev);
      } else if (e.code === 'KeyH') {
        e.preventDefault();
        setDockCollapsed((prev) => !prev);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        if (terminalOpen) {
          setTerminalOpen(false);
          return;
        }
        if (designBookOpen) {
          setDesignBookOpen(false);
          return;
        }
        if (codexOpen) {
          setCodexOpen(false);
          return;
        }
        setStatus((prev) =>
          prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev
        );
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    status,
    terminalOpen,
    codexOpen,
    designBookOpen,
    handleStartGame,
    handleSelectChassis,
    handleToggleMute,
  ]);

  const currentChapter = CHAPTER_SCENES[chapterIndex] || CHAPTER_SCENES[0];
  const currentExprSpec = EXPRESSIONS[expression] || EXPRESSIONS['EX-01'];

  const handleUpdateSnapshot = useCallback((snap: ActiveGameplaySnapshot) => {
    setSnapshot(snap);
    setBestScore((prev) => Math.max(prev, snap.score));
  }, []);

  const handleChapterComplete = useCallback(() => {
    setStatus('victory');
  }, []);

  const handleGameOver = useCallback(() => {
    setStatus('gameover');
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none font-[family-name:var(--font-sans)]">
      {/* 1. Isolated Full-Viewport 3D WebGL Scene */}
      <AxiomThreeCanvas
        status={status}
        chapterIndex={chapterIndex}
        chassis={chassis}
        expression={expression}
        terminalOpen={terminalOpen || designBookOpen}
        codexOpen={codexOpen}
        pulseTriggerCount={pulseTriggerCount}
        verifiedCelebrationCount={verifiedCelebrationCount}
        onUpdateSnapshot={handleUpdateSnapshot}
        onExpressionAutoChange={setExpression}
        onChapterComplete={handleChapterComplete}
        onGameOver={handleGameOver}
        onInspectTomeClaim={() => setTerminalOpen(true)}
      />

      {/* 2. TITLE SCREEN OVERLAY (Diegetic In-World Awakening — Scene 1854 + o-Llama Design Book & Production Bible Entry) */}
      {status === 'title' && (
        <section
          aria-label="Title Screen"
          className="fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-8 pointer-events-none overflow-y-auto"
        >
          <div className="flex items-start justify-between gap-4">
            {/* Asymmetric Left Negative-Space Lockup */}
            <div className="max-w-lg bg-[rgba(10,10,18,0.88)] border-2 border-[#00E5FF] rounded-lg p-4 sm:p-7 shadow-2xl pointer-events-auto">
              {/* Bespoke Inline SVG Title Emblem Lockup with Yellow Plus (+) Signature */}
              <svg
                viewBox="0 0 510 92"
                className="w-full max-w-[430px] h-auto mb-2.5"
                role="img"
                aria-label="o-Llama · AXIOM-7: The Token of Trust"
              >
                <rect
                  x="2"
                  y="6"
                  width="76"
                  height="56"
                  rx="8"
                  fill="#0A0A0A"
                  stroke="#00E5FF"
                  strokeWidth="3"
                />
                <circle cx="26" cy="34" r="10" fill="#00E5FF" />
                <circle cx="54" cy="34" r="10" fill="#00E5FF" />
                {/* Yellow Cross (+) Signature + Green LED + Red Indicator */}
                <rect x="20" y="68" width="5" height="15" fill="#FFD600" />
                <rect x="15" y="73" width="15" height="5" fill="#FFD600" />
                <circle cx="44" cy="75" r="4.5" fill="#00C853" />
                <circle cx="58" cy="75" r="4.5" fill="#FF1744" />
                <text
                  x="94"
                  y="45"
                  fill="#FFFFFF"
                  fontFamily="var(--font-display), sans-serif"
                  fontWeight="700"
                  fontSize="40"
                  letterSpacing="1.5"
                >
                  o-Llama · AXIOM-7
                </text>
                <text
                  x="96"
                  y="72"
                  fill="#00E5FF"
                  fontFamily="var(--font-mono), monospace"
                  fontWeight="600"
                  fontSize="13"
                  letterSpacing="2.5"
                >
                  THE TOKEN OF TRUST · PIXELVERSE-9
                </text>
              </svg>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4">
                {isDa
                  ? 'Lille robot. Større udtryk. Udforsk alle 6 kanoniske PIXELVERSE-9 kapitler i 3D, åbn den interaktive o-Llama Designbog (med 8×9 pixel-spritesheet og kropssprog fra 3. okt.) eller dyk ned i Production Bible v1.0.'
                  : 'Small robot. Bigger expression. Explore all 6 canonical PIXELVERSE-9 chapters in 3D, open the interactive o-Llama Design Book (8×9 pixel spritesheet & Oct 3 postures), or inspect Production Bible v1.0.'}
              </p>

              {/* Primary Start CTA & Interactive Documentation Suites */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <button
                  type="button"
                  data-start="true"
                  onClick={() => handleStartGame(chapterIndex)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded font-bold uppercase tracking-wider text-xs sm:text-sm bg-[#00E5FF] hover:bg-[#00B8D4] text-[#050510] shadow-lg transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{isDa ? 'Start 3D Mission' : 'Start 3D Mission'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDesignBookOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded font-semibold text-xs uppercase tracking-wider bg-[#15203E] hover:bg-[#1E2E58] text-[#FFD600] border border-[#FFD600]/60 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isDa ? 'o-Llama Designbog [B]' : 'o-Llama Design Book [B]'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCodexOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded font-semibold text-xs uppercase tracking-wider bg-[#15203E] hover:bg-[#1E2E58] text-[#00E5FF] border border-[#00E5FF]/50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{isDa ? 'Production Bible [C]' : 'Production Bible [C]'}</span>
                </button>
              </div>

              {/* Chapter Quick-Selector */}
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  {isDa
                    ? 'Vælg Kapitel / Scene (1854 – 499)'
                    : 'Select Campaign Chapter (Scenes 1854 – 499)'}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                  {CHAPTER_SCENES.map((ch) => (
                    <button
                      key={ch.index}
                      type="button"
                      onClick={() => {
                        setChapterIndex(ch.index);
                        setChassis(ch.recommendedChassis);
                        setExpression(ch.defaultExpression);
                      }}
                      className={`text-left px-2.5 py-1.5 rounded border text-xs transition-colors cursor-pointer ${
                        chapterIndex === ch.index
                          ? 'bg-[#182952] border-[#00E5FF] text-white'
                          : 'bg-[#090F20] border-slate-700/80 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="font-mono text-[10px] text-[#FFD600]">
                        {ch.chapterLabel} · #{ch.sceneIds[0]}
                      </div>
                      <div className="font-semibold truncate">{ch.title}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Top-Right Language Switcher (DA | EN) on Title Screen */}
            <div className="pointer-events-auto flex items-center gap-2 bg-[rgba(10,10,18,0.88)] border border-slate-700 rounded-lg px-3 py-2">
              <Globe className="w-4 h-4 text-[#00E5FF]" />
              <button
                type="button"
                onClick={() => setLang('da')}
                aria-label="Skift sprog til Dansk"
                className={`px-2 py-1 rounded text-xs font-mono font-bold cursor-pointer ${
                  lang === 'da'
                    ? 'bg-[#00E5FF] text-[#050510]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                DA
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                aria-label="Switch language to English"
                className={`px-2 py-1 rounded text-xs font-mono font-bold cursor-pointer ${
                  lang === 'en'
                    ? 'bg-[#00E5FF] text-[#050510]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {/* Flat Bottom Control-Hint Line */}
          <div className="self-center mt-2 px-4 py-1.5 rounded bg-[rgba(10,10,18,0.88)] border border-slate-700/80 text-[11px] sm:text-xs font-mono text-slate-200 tracking-wide text-center">
            {isDa
              ? 'WASD Flyt · Space Impuls · Shift Dash · 1-3 Chassis · B Designbog · C Bible · T Sandhedsterminal'
              : 'WASD Move · Space Pulse Scan · Shift Dash · 1-3 Chassis · B Design Book · C Bible · T Truth Terminal'}
          </div>
        </section>
      )}

      {/* 3. PLAYING HUD (World-Matched, >=85% Unobstructed Viewport, Zero Backdrop-Blur) */}
      {status !== 'title' && (
        <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-5">
          {/* Top Row: Top-Left Vitality/Score Cluster & Top-Right Utility/Chapter Cluster */}
          <div className="flex items-start justify-between gap-4">
            {/* Top-Left Cluster: Vitality Pips, Expression State, Score & Accuracy */}
            <div className="bg-[rgba(10,12,24,0.88)] border-2 border-[#00E5FF] rounded-lg px-4 py-3 shadow-lg pointer-events-auto flex flex-wrap items-center gap-5">
              {/* Discrete 5 Vitality Sockets */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  {isDa ? 'INTEGRITET (HP)' : 'CORE INTEGRITY (HP)'}
                </div>
                <div
                  className="flex items-center gap-1.5"
                  aria-label={`Health ${snapshot.hp} of ${snapshot.maxHp}`}
                >
                  {Array.from({ length: snapshot.maxHp }).map((_, i) => {
                    const isFull = i < snapshot.hp;
                    return (
                      <svg
                        key={i}
                        viewBox="0 0 24 24"
                        className="w-5 h-5"
                        aria-hidden="true"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="4"
                          fill={isFull ? '#00E5FF' : '#12182B'}
                          stroke={isFull ? '#FFFFFF' : '#3B486B'}
                          strokeWidth="2"
                        />
                        {isFull && (
                          <rect x="7" y="6" width="6" height="3" rx="1" fill="#FFFFFF" />
                        )}
                      </svg>
                    );
                  })}
                </div>
              </div>

              {/* Active Expression State Readout */}
              <div className="border-l border-slate-700 pl-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  {isDa ? 'UDTRYK' : 'EYE STATE'} · {currentExprSpec.id}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="font-mono font-bold text-base"
                    style={{ color: currentExprSpec.color }}
                  >
                    {currentExprSpec.shape}
                  </span>
                  <span className="text-sm font-bold tracking-wide font-[family-name:var(--font-display)] text-white">
                    {currentExprSpec.name}
                  </span>
                </div>
              </div>

              {/* Tabular-Nums Score & Accuracy */}
              <div className="border-l border-slate-700 pl-4 font-mono tabular-nums">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  {isDa ? 'SANDHEDSSCORE · 99.7%' : 'TRUTH SCORE · ACC 99.7%'}
                </div>
                <div
                  data-testid="hud-score"
                  className="text-xl font-bold text-[#FFD600] leading-tight"
                >
                  {Math.round(snapshot.score)}
                </div>
              </div>
            </div>

            {/* Top-Right Cluster: Chapter Objective & Utility Buttons */}
            <div className="flex flex-col items-end gap-2 pointer-events-auto">
              <div className="flex flex-wrap items-center gap-2 bg-[rgba(10,12,24,0.88)] border border-slate-700 rounded-lg px-3 py-2 shadow-lg">
                {/* Chapter Selector */}
                <label htmlFor="hud-chapter-select" className="sr-only">
                  Select Chapter
                </label>
                <select
                  id="hud-chapter-select"
                  value={chapterIndex}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    setChapterIndex(idx);
                    const cSpec = CHAPTER_SCENES[idx] || CHAPTER_SCENES[0];
                    setChassis(cSpec.recommendedChassis);
                    setExpression(cSpec.defaultExpression);
                    e.currentTarget.blur();
                  }}
                  className="bg-[#131D38] text-xs font-semibold text-white px-2.5 py-1.5 rounded border border-slate-600 focus:border-[#00E5FF] focus:outline-none cursor-pointer"
                >
                  {CHAPTER_SCENES.map((ch) => (
                    <option key={ch.index} value={ch.index}>
                      {ch.chapterLabel}: {ch.title} (#{ch.sceneIds[0]})
                    </option>
                  ))}
                </select>

                {/* Pulse Action Button */}
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setPulseTriggerCount((c) => c + 1);
                  }}
                  aria-label="Emit Truth Pulse [Space]"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#00E5FF] hover:bg-[#00B8D4] text-[#050510] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline">Pulse [Space]</span>
                </button>

                {/* o-Llama Design Book [B] */}
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setDesignBookOpen(true);
                  }}
                  aria-label="Open o-Llama Design Book [B]"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#162447] hover:bg-[#203364] text-[#FFD600] border border-[#FFD600]/50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">
                    {isDa ? 'o-Llama [B]' : 'Design Book [B]'}
                  </span>
                </button>

                {/* Truth Analyzer Terminal [T] */}
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setTerminalOpen(true);
                  }}
                  aria-label="Open Truth Analyzer Terminal [T]"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#162447] hover:bg-[#203364] text-[#00E5FF] border border-[#00E5FF]/50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Verify [T]</span>
                </button>

                {/* Production Bible / Master Codex [C] */}
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setCodexOpen(true);
                  }}
                  aria-label="Open Production Bible [C]"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#162447] hover:bg-[#203364] text-white border border-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span className="hidden lg:inline">Bible [C]</span>
                </button>

                {/* Bilingual Toggle DA | EN */}
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setLang((l) => (l === 'da' ? 'en' : 'da'));
                  }}
                  aria-label="Toggle Language DA/EN"
                  className="px-2 py-1.5 rounded bg-[#162447] hover:bg-[#203364] text-xs font-mono font-bold text-[#00E5FF] border border-slate-700 cursor-pointer"
                >
                  {lang.toUpperCase()}
                </button>

                {/* Mute Toggle [M] */}
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    handleToggleMute();
                  }}
                  aria-label={muted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
                  className="p-1.5 rounded bg-[#162447] hover:bg-[#203364] text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                >
                  {muted ? (
                    <VolumeX className="w-4 h-4 text-[#FF1744]" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-[#00E5FF]" />
                  )}
                </button>

                {/* Pause Toggle [P] */}
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setStatus((s) => (s === 'playing' ? 'paused' : 'playing'));
                  }}
                  aria-label="Pause Game [P]"
                  className="p-1.5 rounded bg-[#162447] hover:bg-[#203364] text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                </button>
              </div>

              {/* Compact Chapter Objectives Bar */}
              <div className="bg-[rgba(10,12,24,0.86)] border border-slate-700/90 rounded px-3.5 py-1.5 text-xs font-mono tabular-nums flex items-center gap-4">
                <span>
                  TOMES:{' '}
                  <strong className="text-[#00C853]">
                    {snapshot.tomesCollected}/{snapshot.targetTomes}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  {isDa ? 'ANOMALIER:' : 'ANOMALIES PURGED:'}{' '}
                  <strong className="text-[#00E5FF]">
                    {snapshot.purgesCount}/{snapshot.targetPurges}
                  </strong>
                </span>
                <span>·</span>
                <span className="hidden sm:inline text-slate-300">
                  PILLARS:{' '}
                  {ALL_PILLARS.map((p) => (
                    <span
                      key={p}
                      className={`ml-1 px-1 rounded text-[10px] ${
                        snapshot.pillarsUnlocked.includes(p)
                          ? 'bg-[#00C853]/25 text-[#00C853] font-bold'
                          : 'text-slate-500'
                      }`}
                    >
                      {p}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          </div>

          {/* Collapsible Bottom Control Dock (Pinned to bottom center, <= 15% footprint) */}
          <div className="self-center w-full max-w-[920px] flex flex-col items-center pointer-events-auto">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                setDockCollapsed((prev) => !prev);
              }}
              aria-label={dockCollapsed ? 'Show Controls Dock [H]' : 'Hide Controls Dock [H]'}
              className="flex items-center gap-1.5 px-3.5 py-1 rounded-t-md bg-[rgba(10,12,24,0.9)] border-t border-x border-slate-700 text-[11px] font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {dockCollapsed ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>
                    {isDa
                      ? 'Vis Chassis & Udtryks-Dock [H]'
                      : 'Show Chassis & Expression Dock [H]'}
                  </span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>{isDa ? 'Skjul Kontroller [H]' : 'Hide Controls [H]'}</span>
                </>
              )}
            </button>

            {!dockCollapsed && (
              <div className="w-full bg-[rgba(10,12,24,0.92)] border-2 border-slate-700 rounded-lg p-3 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3">
                {/* Chassis Switcher (1: Tank, 2: Wizard, 3: Cosmic) */}
                <div className="flex items-center gap-2 flex-wrap">
                  {(
                    [
                      { id: 'tank', key: '1', label: 'o-Llama Tank', sub: 'Gul + & Gribere' },
                      { id: 'wizard', key: '2', label: 'Monitor Wizard', sub: 'Forstørrelsesglas' },
                      { id: 'cosmic', key: '3', label: 'Cosmic Being', sub: '7-Rings Spiral' },
                    ] as const
                  ).map((item) => {
                    const active = chassis === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        tabIndex={-1}
                        onClick={(e) => {
                          e.currentTarget.blur();
                          handleSelectChassis(item.id);
                        }}
                        className={`px-3 py-1.5 rounded border text-left transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-[#162952] border-[#00E5FF] text-white'
                            : 'bg-[#090F20] border-slate-700/80 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[#00E5FF] font-mono text-[10px]">
                            [{item.key}]
                          </span>
                          <span>{item.label}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{item.sub}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Expression State Switcher (EX-01 to EX-08) */}
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  {EXPRESSION_LIST.map((ex) => {
                    const active = expression === ex.id;
                    return (
                      <button
                        key={ex.id}
                        type="button"
                        tabIndex={-1}
                        onClick={(e) => {
                          e.currentTarget.blur();
                          setExpression(ex.id);
                        }}
                        title={`${ex.id} ${ex.name}: ${ex.gameplayBonus}`}
                        className={`px-2.5 py-1.5 rounded border text-xs font-mono transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-[#192D5A] border-[#FFD600] text-white font-bold'
                            : 'bg-[#090F20] border-slate-800 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <span style={{ color: ex.color }} className="mr-1">
                          {ex.shape}
                        </span>
                        <span className="text-[11px]">{ex.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. PAUSE / VICTORY / GAME OVER SINGLE FOCUSED STATUS MODAL CARD */}
      {(status === 'paused' || status === 'victory' || status === 'gameover') && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={
            status === 'paused'
              ? 'Game Paused'
              : status === 'victory'
              ? 'Chapter Verified Complete'
              : 'System Integrity Depleted'
          }
          className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[rgba(5,5,16,0.8)] pointer-events-auto"
        >
          <div className="w-full max-w-md bg-[#0D1326] border-2 border-[#00E5FF] rounded-lg p-6 shadow-2xl text-white text-center space-y-5">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-[#00E5FF]">
                {currentChapter.chapterLabel} · {currentChapter.title}
              </div>
              <h2 className="text-2xl font-bold uppercase tracking-wider font-[family-name:var(--font-display)] mt-1">
                {status === 'paused'
                  ? isDa
                    ? 'Simulation Sat På Pause'
                    : 'Simulation Paused'
                  : status === 'victory'
                  ? '✅ Chapter Truth Verified'
                  : '⚠️ Integrity Depleted'}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                {status === 'paused'
                  ? isDa
                    ? 'o-Llama / AXIOM-7 afventer dit næste skridt.'
                    : 'o-Llama / AXIOM-7 is holding position on the PIXELVERSE-9 grid.'
                  : status === 'victory'
                  ? 'All Truth Tomes cross-referenced and misinformation anomalies purged!'
                  : 'Misinformation overload detected. Reboot chassis to restore truth verification.'}
              </p>
            </div>

            {/* 3 Tabular-Nums Stat Tiles */}
            <div className="grid grid-cols-3 gap-2.5 font-mono tabular-nums">
              <div className="p-3 rounded bg-[#080C1A] border border-slate-800">
                <div className="text-[10px] text-slate-400">SCORE / BEST</div>
                <div className="text-base font-bold text-[#FFD600] mt-0.5">
                  {Math.round(snapshot.score)} / {Math.round(bestScore)}
                </div>
              </div>
              <div className="p-3 rounded bg-[#080C1A] border border-slate-800">
                <div className="text-[10px] text-slate-400">TOMES</div>
                <div className="text-base font-bold text-[#00C853] mt-0.5">
                  {snapshot.tomesCollected}/{snapshot.targetTomes}
                </div>
              </div>
              <div className="p-3 rounded bg-[#080C1A] border border-slate-800">
                <div className="text-[10px] text-slate-400">CLAIMS STAMPED</div>
                <div className="text-base font-bold text-[#00E5FF] mt-0.5">
                  {verifiedClaimsTotal}
                </div>
              </div>
            </div>

            {/* Primary Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {status === 'paused' && (
                <button
                  type="button"
                  onClick={() => setStatus('playing')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded font-bold text-xs uppercase tracking-wider bg-[#00E5FF] hover:bg-[#00B8D4] text-[#050510] cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{isDa ? 'Fortsæt' : 'Resume'}</span>
                </button>
              )}

              {status === 'victory' && (
                <button
                  type="button"
                  data-start="true"
                  onClick={() =>
                    handleStartGame((chapterIndex + 1) % CHAPTER_SCENES.length)
                  }
                  className="flex items-center gap-2 px-5 py-2.5 rounded font-bold text-xs uppercase tracking-wider bg-[#00C853] hover:bg-[#00E676] text-[#050510] cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Next Chapter</span>
                </button>
              )}

              <button
                type="button"
                data-start="true"
                onClick={() => {
                  setVerifiedCelebrationCount((c) => c + 1);
                  handleStartGame(chapterIndex);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded font-semibold text-xs uppercase tracking-wider bg-[#172342] hover:bg-[#223462] text-white border border-slate-600 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{status === 'gameover' ? 'Try Again' : 'Restart Chapter'}</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('title')}
                className="px-4 py-2.5 rounded font-semibold text-xs uppercase tracking-wider bg-[#101830] hover:bg-[#19254A] text-slate-300 border border-slate-700 cursor-pointer"
              >
                Title Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. In-Game High-Thinking Truth Analyzer Terminal Modal */}
      <TruthAnalyzerModal
        isOpen={terminalOpen}
        chapterIndex={chapterIndex}
        initialClaimIndex={snapshot.nearbyTomeClaimIndex}
        onClose={() => setTerminalOpen(false)}
        onVerifiedSuccess={() => {
          setVerifiedCelebrationCount((c) => c + 1);
          setVerifiedClaimsTotal((t) => t + 1);
        }}
        onSetExpression={setExpression}
      />

      {/* 6. o-Llama - Axiom Interactive Design Book Modal */}
      <OLlamaDesignBookModal
        isOpen={designBookOpen}
        lang={lang}
        onClose={() => setDesignBookOpen(false)}
        onApplyExpressionTo3D={(expr) => {
          setExpression(expr);
        }}
      />

      {/* 7. Production Bible v1.0 & Master Codex Modal */}
      <MasterCodexModal
        isOpen={codexOpen}
        lang={lang}
        onClose={() => setCodexOpen(false)}
        onSelectChapter={(idx) => handleStartGame(idx)}
        onSelectChassis={handleSelectChassis}
        onSelectExpression={setExpression}
      />
    </main>
  );
}
