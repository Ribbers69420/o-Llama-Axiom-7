import React from 'react';
import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#04060b] text-slate-100 flex items-center justify-center p-6 font-mono">
      <div className="max-w-md w-full rounded-xl border border-cyan-500/30 bg-slate-950/90 p-6 shadow-2xl text-center">
        <Compass className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
        <h2 className="text-base font-bold tracking-wider uppercase text-cyan-300 mb-2">
          404 · Sector Coordinates Not Found
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed mb-5">
          The requested coordinate vector does not exist in the AXIOM-7 archive.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold uppercase tracking-wider transition-colors"
        >
          Return to Command Deck
        </Link>
      </div>
    </div>
  );
}
