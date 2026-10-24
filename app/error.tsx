'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('AXIOM-7 Runtime Error Boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#04060b] text-slate-100 flex items-center justify-center p-6 font-mono">
      <div className="max-w-md w-full rounded-xl border border-amber-500/40 bg-slate-950/90 p-6 shadow-2xl">
        <div className="flex items-center gap-3 text-amber-400 mb-3">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <h2 className="text-base font-bold tracking-wider uppercase">
            AXIOM-7 Sector Fault Detected
          </h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mb-5">
          {error?.message || 'An unexpected runtime exception occurred in the sector viewport.'}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reinitialize Sector
        </button>
      </div>
    </div>
  );
}
