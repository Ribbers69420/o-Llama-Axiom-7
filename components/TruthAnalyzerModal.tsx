'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CHAPTER_SCENES,
  type ExpressionId,
  type PillarName,
  type TruthVerificationResult,
} from '@/lib/game-rules';
import { verifyClaimOfflineWithRustWasm } from '@/lib/rust-wasm-kernel';
import { insertTelemetryLogRow } from '@/lib/sql-truth-engine';
import { soundSynth } from '@/lib/audio-synth';
import {
  classifyEpistemicRegister,
  computeBrierScore,
  buildUafExportPackage,
  type CollaborationMode,
  type BrierScoreSample,
} from '@/lib/uqcf-research-codex';
import {
  CheckCircle2,
  AlertTriangle,
  Search,
  Sparkles,
  X,
  ShieldCheck,
  Cpu,
  Download,
  Copy,
  Users,
  Tag,
  Gauge,
} from 'lucide-react';

interface TruthAnalyzerModalProps {
  isOpen: boolean;
  chapterIndex: number;
  initialClaimIndex?: number | null;
  onClose: () => void;
  onVerifiedSuccess: (result: TruthVerificationResult) => void;
  onSetExpression: (expr: ExpressionId) => void;
}

const PILLAR_META: { key: PillarName; label: string; color: string; desc: string }[] = [
  { key: 'FACTS', label: 'FACTS', color: '#2E7D32', desc: 'Observable reality' },
  { key: 'EVIDENCE', label: 'EVIDENCE', color: '#6A1B9A', desc: 'Documented proof' },
  { key: 'DATA', label: 'DATA', color: '#1565C0', desc: 'Quantified truth' },
  { key: 'REALITY', label: 'REALITY', color: '#8B6343', desc: 'Ground-level existence' },
];

export default function TruthAnalyzerModal({
  isOpen,
  chapterIndex,
  initialClaimIndex,
  onClose,
  onVerifiedSuccess,
  onSetExpression,
}: TruthAnalyzerModalProps) {
  const chapter = CHAPTER_SCENES[chapterIndex] || CHAPTER_SCENES[0];
  const [claimText, setClaimText] = useState<string>(chapter.claims[0]?.statement || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<TruthVerificationResult | null>(null);
  const [offlineKernelMode, setOfflineKernelMode] = useState<boolean>(false);

  // v2.6.0 Superpowers: Collaboration Mode & Calibration
  const [collabMode, setCollabMode] = useState<CollaborationMode>('Auditor');
  const [brierHistory, setBrierHistory] = useState<BrierScoreSample[]>([
    { forecast: 0.98, outcome: 1 },
    { forecast: 0.95, outcome: 1 },
    { forecast: 0.15, outcome: 0 },
    { forecast: 0.92, outcome: 1 },
    { forecast: 0.08, outcome: 0 },
  ]);
  const [uafDownloaded, setUafDownloaded] = useState(false);

  // Live Epistemic Register Classification
  const epistemicTag = useMemo(() => classifyEpistemicRegister(claimText), [claimText]);

  // Live Brier Score
  const brierMetrics = useMemo(() => computeBrierScore(brierHistory), [brierHistory]);

  useEffect(() => {
    if (!isOpen) return;
    const defaultClaim =
      typeof initialClaimIndex === 'number' && chapter.claims[initialClaimIndex]
        ? chapter.claims[initialClaimIndex].statement
        : chapter.claims[0]?.statement || '';
    queueMicrotask(() => {
      setClaimText(defaultClaim);
      setErrorMsg(null);
      setResult(null);
      setUafDownloaded(false);
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setOfflineKernelMode(true);
      }
    });
  }, [isOpen, chapterIndex, initialClaimIndex, chapter]);

  if (!isOpen) return null;

  const runOfflineRustWasmVerification = (trimmed: string): TruthVerificationResult => {
    const wasmRes = verifyClaimOfflineWithRustWasm(trimmed);
    const isTrue = wasmRes.verdict === 'TRUE';
    const recExpr: ExpressionId = isTrue ? 'EX-06' : 'EX-05';

    insertTelemetryLogRow({
      chapter_id: chapter.chapterLabel,
      chassis: 'tank',
      expression_code: recExpr,
      pulse_damage: 48,
      wasm_confidence: wasmRes.confidence,
      fps_quantized_ms: 41,
      mode: 'OFFLINE_WASM',
    });

    // Update Brier history
    const forecastVal = wasmRes.confidence / 100;
    const outcomeVal = isTrue ? 1 : 0;
    setBrierHistory((prev) => [...prev, { forecast: forecastVal, outcome: outcomeVal }]);

    return {
      claim: trimmed,
      verdict: isTrue ? 'TRUE' : 'FALSE',
      confidence: wasmRes.confidence,
      accuracyRating: isTrue ? 99.7 : 99.1,
      recommendedExpression: recExpr,
      summaryConclusion: wasmRes.reasoning,
      engineSource: 'axiom-7-core-matrix',
      pillars: {
        FACTS: {
          score: wasmRes.pillarBreakdown.FACTS,
          note: isTrue
            ? 'Verified against observable PIXELVERSE-9 empirical state.'
            : 'Contradicts observable physical and system records.',
        },
        EVIDENCE: {
          score: wasmRes.pillarBreakdown.EVIDENCE,
          note: isTrue
            ? 'Corroborated by Production Bible v1.0 & SQL truth_claims.'
            : 'Lacks documented proof in archival logs.',
        },
        DATA: {
          score: wasmRes.pillarBreakdown.DATA,
          note: `Rust/WASM weighted score: ${wasmRes.confidence}% across 4 pillars.`,
        },
        REALITY: {
          score: wasmRes.pillarBreakdown.REALITY,
          note: wasmRes.correction,
        },
      },
      thinkingSteps: [
        `[MODE: ${collabMode.toUpperCase()}] Anti-sycophancy filter active. Classified as ${epistemicTag.tag}.`,
        `[RUST/WASM KERNEL] Executed verify_claim_confidence(${wasmRes.pillarBreakdown.FACTS}, ${wasmRes.pillarBreakdown.EVIDENCE}, ${wasmRes.pillarBreakdown.DATA}, ${wasmRes.pillarBreakdown.REALITY}) -> ${wasmRes.confidence}%`,
        `[SQL ENGINE] Cross-referenced claim against offline table truth_claims (chapter=${chapter.chapterLabel}).`,
        `[CALIBRATION] Brier Score (Eq. 67) updated -> ${brierMetrics.brierScore.toFixed(4)} (${brierMetrics.calibrationTier}).`,
        `[VERDICT] Stamped ${isTrue ? 'TRUE (EX-06 Happy)' : 'FALSE / ANOMALY (EX-05 Blocked)'} and logged to telemetry_logs.`,
      ],
    };
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = claimText.trim();
    if (!trimmed) {
      setErrorMsg('Required: Enter or select a claim statement for AXIOM-7 to cross-reference.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    onSetExpression('EX-07'); // PROCESSING ░░

    const isBrowserOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    if (offlineKernelMode || isBrowserOffline) {
      const verified = runOfflineRustWasmVerification(trimmed);
      setResult(verified);
      soundSynth.playTruthVerified(verified.verdict === 'TRUE');
      onSetExpression(verified.recommendedExpression);
      onVerifiedSuccess(verified);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/truth-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: trimmed, chapterIndex, collabMode }),
      });
      if (!res.ok) {
        // Seamless offline fallback to Rust/WASM + SQL Truth Engine
        const verified = runOfflineRustWasmVerification(trimmed);
        setResult(verified);
        soundSynth.playTruthVerified(verified.verdict === 'TRUE');
        onSetExpression(verified.recommendedExpression);
        onVerifiedSuccess(verified);
        setLoading(false);
        return;
      }

      const data = await res.json();
      const verified = data as TruthVerificationResult;
      insertTelemetryLogRow({
        chapter_id: chapter.chapterLabel,
        chassis: 'tank',
        expression_code: verified.recommendedExpression,
        pulse_damage: 52,
        wasm_confidence: Math.round(verified.confidence),
        fps_quantized_ms: 41,
        mode: 'ONLINE_SYNC',
      });

      const forecastVal = (verified.confidence || 95) / 100;
      const outcomeVal = verified.verdict === 'TRUE' ? 1 : 0;
      setBrierHistory((prev) => [...prev, { forecast: forecastVal, outcome: outcomeVal }]);

      setResult(verified);
      soundSynth.playTruthVerified(verified.verdict === 'TRUE');
      onSetExpression(verified.recommendedExpression);
      onVerifiedSuccess(verified);
    } catch {
      // Automatic offline fallback if network request fails
      const verified = runOfflineRustWasmVerification(trimmed);
      setResult(verified);
      soundSynth.playTruthVerified(verified.verdict === 'TRUE');
      onSetExpression(verified.recommendedExpression);
      onVerifiedSuccess(verified);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSignedUaf = () => {
    if (!result) return;
    const bundle = buildUafExportPackage('llm_ingest', {
      claim: result.claim,
      verdict: result.verdict,
      confidence: result.confidence,
      epistemicTag: epistemicTag.tag,
      collaborationMode: collabMode,
      brierScore: brierMetrics.brierScore,
      pillars: result.pillars,
      summaryConclusion: result.summaryConclusion,
    });

    const jsonStr = JSON.stringify(bundle, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AXIOM7-VERIFIED-CLAIM-${result.verdict}-${Date.now()}.uaf.json`;
    a.click();
    URL.revokeObjectURL(url);

    setUafDownloaded(true);
    soundSynth.playTruthVerified(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AXIOM-7 High-Thinking Truth Analyzer Terminal"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[rgba(5,5,16,0.85)] pointer-events-auto"
    >
      <div className="w-full max-w-4xl bg-[#0D1326] border-2 border-[#00E5FF] rounded-lg shadow-2xl overflow-hidden text-white flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#131C38] border-b border-[#00E5FF]/30 shrink-0">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#00E5FF]" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold tracking-wider uppercase font-[family-name:var(--font-display)] text-[#00E5FF]">
                  Sandheds-Analysator · v2.6.0 Anti-Smiger & Kalibrering
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/40">
                  Eq. 67 Brier Score
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {chapter.chapterLabel}: {chapter.title} · Hybrid Cloud + Offline Rust/WASM ANSI SQL
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOfflineKernelMode((v) => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                offlineKernelMode
                  ? 'bg-[#00E676]/20 border-[#00E676] text-[#00E676]'
                  : 'bg-[#1A264A] border-slate-600 text-slate-300 hover:border-[#00E5FF]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              {offlineKernelMode ? 'RUST/WASM OFFLINE: ON' : 'HYBRID AUTO-OFFLINE'}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Truth Analyzer"
              className="p-1.5 rounded bg-[#1A264A] hover:bg-[#243464] text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Top Bar: Collaboration Mode & Epistemic Calibration Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#090E1F] border border-slate-800 rounded-lg">
            {/* Collaboration Mode Selector */}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FFD600]" />
              <span className="text-xs font-mono font-bold text-slate-300">Samarbejdstilstand:</span>
              {(['Auditor', 'Co-Pilot', 'Builder'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCollabMode(m)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                    collabMode === m
                      ? 'bg-[#172B56] border border-[#00E5FF] text-white font-bold'
                      : 'bg-[#0F162B] text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {m === 'Auditor' ? '🛡️ Auditor' : m === 'Co-Pilot' ? '🤝 Co-Pilot' : '⚡ Builder'}
                </button>
              ))}
            </div>

            {/* Brier Score Readout */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <Gauge className="w-4 h-4 text-[#00E5FF]" />
              <span className="text-slate-400">Brier Score (Eq. 67):</span>
              <strong className="text-[#00E676]">{brierMetrics.brierScore.toFixed(4)}</strong>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {brierMetrics.calibrationTier} ({brierMetrics.sampleCount} eval)
              </span>
            </div>
          </div>

          {/* Intercepted Chapter Claims Quick Select */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Intercepted Chapter Transmissions (Click to Load)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {chapter.claims.map((c, idx) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setClaimText(c.statement);
                    setErrorMsg(null);
                  }}
                  className={`text-left p-3 rounded border transition-colors cursor-pointer ${
                    claimText === c.statement
                      ? 'bg-[#17284E] border-[#00E5FF] text-white'
                      : 'bg-[#090E1E] border-slate-700/80 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="text-[11px] font-mono text-[#00E5FF] mb-1">
                    Packet #{idx + 1} · {c.sourceContext}
                  </div>
                  <div className="text-xs line-clamp-2 leading-relaxed">{c.statement}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Claim Form & Live Epistemic Tag */}
          <form onSubmit={handleAnalyze} className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="truth-claim-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Statement / Claim Under Investigation
                </label>
                {/* Epistemic Register Tag Badge */}
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <Tag className="w-3.5 h-3.5 text-[#FFD600]" />
                  <span className="text-slate-400">Epistemisk Register:</span>
                  <span className="px-2 py-0.5 rounded bg-[#FFD600]/20 text-[#FFD600] font-bold border border-[#FFD600]/40">
                    {epistemicTag.tag}
                  </span>
                </div>
              </div>
              <textarea
                id="truth-claim-input"
                rows={2}
                value={claimText}
                onChange={(e) => {
                  setClaimText(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Enter any claim, hypothesis, or intercepted transmission to verify against the 4 Pillars..."
                className="w-full px-3.5 py-2.5 rounded bg-[#070B18] border border-slate-600 focus:border-[#00E5FF] focus:outline-none text-sm text-white font-mono"
              />
              {errorMsg && (
                <p role="alert" className="mt-1.5 text-xs text-[#FF1744] font-medium">
                  {errorMsg}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="text-xs text-slate-400 font-mono tabular-nums">
                TILSTAND: {collabMode.toUpperCase()} · ACC 99.7% · ANTI-SMIGER AKTIV
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setClaimText('');
                    setResult(null);
                    setErrorMsg(null);
                  }}
                  className="px-3.5 py-2 rounded text-xs font-semibold bg-[#18223E] hover:bg-[#223056] text-slate-300 transition-colors cursor-pointer"
                >
                  Clear Input
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 rounded text-xs font-bold uppercase tracking-wider bg-[#00E5FF] hover:bg-[#00B8D4] text-[#050510] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  {loading ? 'Cross-Referencing Pillars...' : 'Verify Claim'}
                </button>
              </div>
            </div>
          </form>

          {/* Verification Output */}
          {result && (
            <div
              data-testid="truth-verification-result"
              className="p-4 rounded-lg bg-[#080D1C] border border-slate-700 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  {result.verdict === 'TRUE' ? (
                    <CheckCircle2 className="w-6 h-6 text-[#00C853]" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-[#FF1744]" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg font-bold tracking-wider font-[family-name:var(--font-display)] ${
                          result.verdict === 'TRUE' ? 'text-[#00C853]' : 'text-[#FF1744]'
                        }`}
                      >
                        STAMP: {result.verdict === 'TRUE' ? '✅ TRUE' : '⚠️ FALSE / ANOMALY'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        · Expression {result.recommendedExpression} · Register {epistemicTag.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{result.summaryConclusion}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right font-mono tabular-nums">
                    <div className="text-xs text-slate-400">CONFIDENCE</div>
                    <div className="text-base font-bold text-[#00E5FF]">
                      {result.confidence.toFixed(1)}%
                    </div>
                  </div>

                  {/* 1-Click Signed .uaf.json Export Button */}
                  <button
                    type="button"
                    onClick={handleDownloadSignedUaf}
                    className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#25153A] hover:bg-[#341E52] border border-[#BA68C8] text-[#E1BEE7] text-xs font-mono font-semibold transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{uafDownloaded ? 'UAF Gemt!' : 'Eksportér .uaf.json'}</span>
                  </button>
                </div>
              </div>

              {/* 4 Foundational Pillars Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {PILLAR_META.map((p) => {
                  const pData = result.pillars[p.key];
                  return (
                    <div
                      key={p.key}
                      className="p-3 rounded bg-[#0E162B] border border-slate-800 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span style={{ color: '#00E5FF' }}>{p.label}</span>
                          <span className="font-mono tabular-nums text-white">
                            {pData?.score ?? 95}/100
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mb-1.5">{p.desc}</div>
                        <p className="text-xs text-slate-200 leading-snug">{pData?.note}</p>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded overflow-hidden mt-2.5">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${pData?.score ?? 95}%`,
                            backgroundColor:
                              result.verdict === 'TRUE' ? '#00C853' : '#FF1744',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* High-Thinking Step-by-Step Trace */}
              <div className="bg-[#050811] p-3.5 rounded border border-slate-800/90">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#FFD600] mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>High-Thinking Epistemological Trace (+250 Score · +1 Vitality)</span>
                </div>
                <ul className="space-y-1.5 text-xs font-mono text-slate-300">
                  {result.thinkingSteps.map((step, i) => (
                    <li key={i} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
