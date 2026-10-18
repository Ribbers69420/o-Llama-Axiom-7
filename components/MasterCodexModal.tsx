'use client';

import React, { useState } from 'react';
import {
  CHAPTER_SCENES,
  CHASSIS_SPECS,
  EXPRESSION_LIST,
  HITBOX_SPECS,
  SPRITE_SHEET_ROWS,
  type ChassisType,
  type ExpressionId,
} from '@/lib/game-rules';
import { BookOpen, Grid, Layers, Palette, X } from 'lucide-react';

interface MasterCodexModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChapter: (idx: number) => void;
  onSelectChassis: (c: ChassisType) => void;
  onSelectExpression: (e: ExpressionId) => void;
}

export default function MasterCodexModal({
  isOpen,
  onClose,
  onSelectChapter,
  onSelectChassis,
  onSelectExpression,
}: MasterCodexModalProps) {
  const [activeTab, setActiveTab] = useState<'lore' | 'style' | 'sprites'>('lore');

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="PIXELVERSE-9 Master Design Document Codex"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[rgba(5,5,16,0.82)] pointer-events-auto"
    >
      <div className="w-full max-w-4xl bg-[#0D1326] border-2 border-[#FFD600] rounded-lg shadow-2xl overflow-hidden text-white flex flex-col max-h-[86vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#151E3A] border-b border-slate-700">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-[#FFD600]" />
            <div>
              <h2 className="text-base font-bold tracking-wider uppercase font-[family-name:var(--font-display)] text-[#FFD600]">
                PIXEL DESIGN DOCUMENT — MASTER ARCHIVE (PIXELVERSE-9)
              </h2>
              <p className="text-xs text-slate-300">
                Complete Interactive Lore, Proportions, Scene Specs (1854–499), Sprite Sheet & Hitboxes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Master Codex"
            className="p-1.5 rounded bg-[#1F2C52] hover:bg-[#2B3D70] text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-[#090E1E] border-b border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('lore')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'lore'
                ? 'bg-[#FFD600] text-[#050510]'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Part 1 & 4 & 6: Chapters & Scenes (1854–499)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('style')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'style'
                ? 'bg-[#FFD600] text-[#050510]'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Part 2 & 3: Palette, Proportions & Expressions</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sprites')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'sprites'
                ? 'bg-[#FFD600] text-[#050510]'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Part 5: 512×512 Sprite Sheet & Hitboxes</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {activeTab === 'lore' && (
            <div className="space-y-4">
              <div className="p-4 rounded bg-[#080C1A] border border-slate-800">
                <h3 className="text-sm font-bold text-[#00E5FF] mb-1">
                  Origin — &ldquo;From Circuit to Cosmos&rdquo; (Year 2087)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Born inside a forgotten server room beneath a pixel-lit city, AXIOM-7 is the
                  seventh machine built to distinguish truth from fiction. Unlike its predecessors,
                  it feels the weight of truth through its cyan screen-face and cross-references
                  every claim against the Four Pillars: FACTS, EVIDENCE, DATA, and REALITY.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CHAPTER_SCENES.map((ch) => (
                  <div
                    key={ch.index}
                    className="p-3.5 rounded bg-[#101830] border border-slate-700/80 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono text-[#FFD600] mb-1">
                        <span>{ch.chapterLabel}</span>
                        <span>Scene ID: {ch.sceneIds.join(' / ')}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{ch.title}</h4>
                      <p className="text-xs text-slate-300 mt-0.5">{ch.location}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Mood: {ch.mood} · Default State: {ch.defaultExpression}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectChapter(ch.index);
                        onClose();
                      }}
                      className="self-start px-3 py-1.5 rounded text-xs font-bold bg-[#00E5FF] hover:bg-[#00B8D4] text-[#050510] transition-colors cursor-pointer"
                    >
                      Warp to {ch.chapterLabel}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'style' && (
            <div className="space-y-5">
              {/* Chassis Proportions */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#00E5FF] mb-2.5">
                  Part 2.3 — Character Chassis Proportions (Click to Equip)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.values(CHASSIS_SPECS).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelectChassis(c.id);
                        onClose();
                      }}
                      className="text-left p-3.5 rounded bg-[#101830] border border-slate-700 hover:border-[#00E5FF] transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-mono text-[#FFD600]">{c.versionLabel}</div>
                      <div className="text-sm font-bold text-white mt-0.5">{c.name}</div>
                      <div className="text-xs text-slate-300 mt-1">{c.roleDescription}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-2 tabular-nums">
                        Height: {c.heightUnits}u · Pulse Radius: {c.pulseRadius}m
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Expression State Library */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#00E5FF] mb-2.5">
                  Part 3.1 — Expression State Library (EX-01 to EX-08 · Click to Activate)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {EXPRESSION_LIST.map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => {
                        onSelectExpression(ex.id);
                        onClose();
                      }}
                      className="text-left p-3 rounded bg-[#0A1022] border border-slate-700 hover:border-[#00E5FF] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-slate-400">{ex.id}</span>
                        <span className="text-base font-mono font-bold" style={{ color: ex.color }}>
                          {ex.shape}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white mt-1">{ex.name}</div>
                      <div className="text-[11px] text-[#00E5FF] mt-0.5">{ex.gameplayBonus}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sprites' && (
            <div className="space-y-5">
              {/* Hitbox Definitions Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#00E5FF] mb-2">
                  Part 5.2 — Hitbox Definitions (AXIOM-7 Version A)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {HITBOX_SPECS.map((hb) => (
                    <div
                      key={hb.id}
                      className="p-3 rounded bg-[#101830] border border-slate-700 font-mono text-xs"
                    >
                      <div className="text-[#FFD600] font-bold">
                        {hb.id} · {hb.name}
                      </div>
                      <div className="text-slate-300 mt-1 tabular-nums">
                        Offset: ({hb.offsetX}, {hb.offsetY})
                      </div>
                      <div className="text-slate-300 tabular-nums">
                        Size: {hb.width} × {hb.height} px
                      </div>
                      <div className="text-[#00E5FF] mt-1">{hb.purpose}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Master Sprite Sheet Layout */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#00E5FF] mb-2">
                  Part 5.1 — Master Sprite Sheet Layout (512×512 px · 32×32 Cells)
                </h3>
                <div className="space-y-2">
                  {SPRITE_SHEET_ROWS.map((r) => (
                    <div
                      key={r.row}
                      className="p-2.5 rounded bg-[#0A1022] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="font-mono">
                        <span className="text-[#FFD600] font-bold">{r.row}</span>
                        <span className="text-slate-400"> · Y:{r.yRange} · </span>
                        <span className="text-white font-semibold">{r.category}</span>
                      </div>
                      <div className="text-slate-300 font-mono text-[11px]">
                        {r.frames.join(' · ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
