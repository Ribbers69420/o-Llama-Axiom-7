'use client';

import React, { useState, useEffect } from 'react';
import {
  CHAPTER_SCENES,
  type ExpressionId,
  type PillarName,
  type TruthVerificationResult,
} from '@/lib/game-rules';
import { soundSynth } from '@/lib/audio-synth';
import { CheckCircle2, AlertTriangle, Search, Sparkles, X, ShieldCheck } from 'lucide-react';

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

  useEffect(() => {
    if (!isOpen) return;
    const defaultClaim =
      typeof initialClaimIndex === 'number' && chapter.claims[initialClaimIndex]
        ? chapter.claims[initialClaimIndex].statement
        : chapter.claims[0]?.statement || '';
    setClaimText(defaultClaim);
    setErrorMsg(null);
    setResult(null);
  }, [isOpen, chapterIndex, initialClaimIndex, chapter]);

  if (!isOpen) return null;

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

    try {
      const res = await fetch('/api/truth-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: trimmed, chapterIndex }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Verification engine failed.');
        setLoading(false);
        return;
      }

      const verified = data as TruthVerificationResult;
      setResult(verified);
      soundSynth.playTruthVerified(verified.verdict === 'TRUE');
      onSetExpression(verified.recommendedExpression);
      onVerifiedSuccess(verified);
    } catch {
      setErrorMsg('Network anomaly while querying Truth Matrix.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AXIOM-7 High-Thinking Truth Analyzer Terminal"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[rgba(5,5,16,0.78)] pointer-events-auto"
    >
      <div className="w-full max-w-3xl bg-[#0D1326] border-2 border-[#00E5FF] rounded-lg shadow-2xl overflow-hidden text-white">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#131C38] border-b border-[#00E5FF]/30">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#00E5FF]" />
            <div>
              <h2 className="text-base font-bold tracking-wider uppercase font-[family-name:var(--font-display)] text-[#00E5FF]">
                Truth Analyzer Terminal · Four Pillars Matrix
              </h2>
              <p className="text-xs text-slate-300">
                {chapter.chapterLabel}: {chapter.title} · High-Thinking Epistemological Engine
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Truth Analyzer"
            className="p-1.5 rounded bg-[#1A264A] hover:bg-[#243464] text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
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

          {/* Custom Claim Form */}
          <form onSubmit={handleAnalyze} className="space-y-3">
            <div>
              <label
                htmlFor="truth-claim-input"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Statement / Claim Under Investigation
              </label>
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
                LUD LOGIC: 188/200 · TARGET ACCURACY: 99.7%
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
                        · Expression {result.recommendedExpression}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{result.summaryConclusion}</p>
                  </div>
                </div>

                <div className="text-right font-mono tabular-nums">
                  <div className="text-xs text-slate-400">CONFIDENCE</div>
                  <div className="text-base font-bold text-[#00E5FF]">
                    {result.confidence.toFixed(1)}%
                  </div>
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
