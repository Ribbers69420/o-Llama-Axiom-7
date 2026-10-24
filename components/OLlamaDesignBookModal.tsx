'use client';

import React, { useState } from 'react';
import OLlamaPixelCanvas from '@/components/OLlamaPixelCanvas';
import {
  NOMINAL_COLORS,
  OLLAMA_ANIMATIONS,
  OLLAMA_EXPRESSION_STUDIES,
  type AppLanguage,
  type EnvironmentMoodId,
  type OLlamaAnimationId,
  type OLlamaStudyId,
  type SpriteScaleSize,
} from '@/lib/ollama-bible-spec';
import type { ExpressionId } from '@/lib/game-rules';
import { Check, Eye, Layers, Sparkles, X } from 'lucide-react';

interface OLlamaDesignBookModalProps {
  isOpen: boolean;
  lang: AppLanguage;
  onClose: () => void;
  onApplyExpressionTo3D: (expr: ExpressionId, postureStudy?: OLlamaStudyId) => void;
}

const SCALES: { size: SpriteScaleSize; labelDa: string; labelEn: string }[] = [
  { size: 64, labelDa: 'Meget lille · 64 px', labelEn: 'Tiny · 64 px' },
  { size: 120, labelDa: 'Lille · 120 px', labelEn: 'Small · 120 px' },
  { size: 192, labelDa: 'Normal · 192 px', labelEn: 'Normal · 192 px' },
  { size: 240, labelDa: 'Stor · 240 px', labelEn: 'Large · 240 px' },
];

const MOODS: {
  id: EnvironmentMoodId;
  labelDa: string;
  labelEn: string;
  descDa: string;
  descEn: string;
}[] = [
  {
    id: 'studio',
    labelDa: 'Studio (Original)',
    labelEn: 'Studio (Original)',
    descDa: 'Ren hvid studiebaggrund som i de 14 originale o-Llama-Axiom-01..14 karakterark.',
    descEn: 'Clean white studio backdrop matching the 14 original o-Llama-Axiom-01..14 character sheets.',
  },
  {
    id: 'vaerksted',
    labelDa: 'Værksted',
    labelEn: 'Workshop',
    descDa: 'Varmt rav, trætoner og et roligt arbejdsbord. O-Llama er tæt på brugeren og på det håndbyggede.',
    descEn: 'Warm amber, wood tones, and a calm workbench. o-Llama is close to the user and the handcrafted.',
  },
  {
    id: 'arkiv',
    labelDa: 'Arkiv',
    labelEn: 'Archive',
    descDa: 'Dæmpet oliven, blomme, marineblå og umbra fra kildens FACTS, EVIDENCE, DATA og REALITY. Cyan binder det hele sammen.',
    descEn: 'Muted olive, plum, navy, and umber from FACTS, EVIDENCE, DATA, and REALITY. Cyan binds it all together.',
  },
  {
    id: 'kosmos',
    labelDa: 'Kosmos',
    labelEn: 'Cosmos',
    descDa: 'Dyb blå og teal. Et sjældent fortællingsrum for ansvar og perspektiv, med nysgerrighed som den tilbagevendende grundtone.',
    descEn: 'Deep blue and teal. A rare narrative space for responsibility and perspective, with curiosity as the returning baseline.',
  },
];

export default function OLlamaDesignBookModal({
  isOpen,
  lang,
  onClose,
  onApplyExpressionTo3D,
}: OLlamaDesignBookModalProps) {
  const [mood, setMood] = useState<EnvironmentMoodId>('studio');
  const [scaleSize, setScaleSize] = useState<SpriteScaleSize>(192);
  const [animateOriginal, setAnimateOriginal] = useState<boolean>(true);
  const [selectedAnimId, setSelectedAnimId] = useState<OLlamaAnimationId>('hvile');
  const [selectedStudyId, setSelectedStudyId] = useState<OLlamaStudyId>('nysgerrig');
  const [showFullSheet, setShowFullSheet] = useState<boolean>(false);

  if (!isOpen) return null;

  const isDa = lang === 'da';
  const currentAnim =
    OLLAMA_ANIMATIONS.find((a) => a.id === selectedAnimId) || OLLAMA_ANIMATIONS[0];
  const currentStudy =
    OLLAMA_EXPRESSION_STUDIES.find((s) => s.id === selectedStudyId) ||
    OLLAMA_EXPRESSION_STUDIES[0];

  const handleStudyKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = OLLAMA_EXPRESSION_STUDIES[(idx + 1) % OLLAMA_EXPRESSION_STUDIES.length];
      setSelectedStudyId(next.id);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev =
        OLLAMA_EXPRESSION_STUDIES[
          (idx - 1 + OLLAMA_EXPRESSION_STUDIES.length) % OLLAMA_EXPRESSION_STUDIES.length
        ];
      setSelectedStudyId(prev.id);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        isDa
          ? 'o-Llama - Axiom · Finpudsning · pixelstil'
          : 'o-Llama - Axiom · Pixel Refinement Design Book'
      }
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-[rgba(5,5,16,0.86)] pointer-events-auto"
    >
      <div className="w-full max-w-6xl bg-[#0B1020] border-2 border-[#00E5FF] rounded-lg shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#121B36] border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#FFD600]" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-wider uppercase font-[family-name:var(--font-display)] text-white">
                  o-Llama - Axiom
                </h2>
                <span className="text-xs font-mono text-[#00E5FF]">
                  · {isDa ? 'Finpudsning · pixelstil (01–14 + 8×9 Ark)' : 'Pixel Style (01–14 + 8×9 Sheet)'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {isDa
                  ? 'The Token of Trust — Lille robot. Større udtryk. Nysgerrig · tålmodig · åben for rettelser'
                  : 'The Token of Trust — Small robot. Bigger expression. Curious · patient · open to correction'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFullSheet((prev) => !prev)}
              className="px-3 py-1.5 rounded text-xs font-semibold bg-[#1B2950] hover:bg-[#24376B] text-[#FFD600] border border-[#FFD600]/40 transition-colors cursor-pointer"
            >
              {showFullSheet
                ? isDa
                  ? 'Vis Komparator'
                  : 'Show Comparator'
                : isDa
                ? 'Se 8×9 Spritesheet'
                : 'View 8×9 Spritesheet'}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={isDa ? 'Luk Designbog' : 'Close Design Book'}
              className="p-1.5 rounded bg-[#1B2950] hover:bg-[#273B70] text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Editorial Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-8">
          {/* Hero Banner */}
          <div className="p-5 rounded-lg bg-[#10182E] border border-slate-700/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="text-xs font-mono uppercase tracking-widest text-[#FFD600]">
                THE TOKEN OF TRUST · 14 KANONISKE POSITURER + 8×9 SPRITESHEET
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-display)] text-white">
                {isDa
                  ? 'Lille robot. Større udtryk.'
                  : 'Small robot. Bigger expression.'}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {isDa
                  ? 'Opdateret visuel repræsentation med 3/4 metallisk børstet stål, runde øreled, rød top-sensor, gul krydsknap (+) med rille under, 3 lodrette kontrollys (grøn/gul/rød), C-gribekløer og larvebånd med 2 synlige sidehjul.'
                  : 'Updated visual representation featuring 3/4 brushed steel bevels, circular side ear-hubs, red top sensor dome, yellow cross (+) with bottom slot, 3 stacked LEDs (green/yellow/red), C-claw pincers, and 2-wheel tank treads.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onApplyExpressionTo3D(currentStudy.expressionCode, currentStudy.id);
                onClose();
              }}
              className="px-4 py-2.5 rounded font-bold text-xs uppercase tracking-wider bg-[#00E5FF] hover:bg-[#00B8D4] text-[#050510] transition-colors cursor-pointer shrink-0"
            >
              {isDa
                ? `Anvend "${currentStudy.labelDa}" i 3D-Scenen`
                : `Apply "${currentStudy.labelEn}" to 3D Scene`}
            </button>
          </div>

          {showFullSheet && (
            <div className="p-5 rounded-lg bg-[#080D1A] border-2 border-[#FFD600]/60 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-[#FFD600]">
                    {isDa
                      ? 'Komplet 8×9 o-Llama Spritesheet (pet_6a9caa81a898819184d4992db7e8b566-spritesheet.png)'
                      : 'Complete 8×9 o-Llama Spritesheet (pet_6a9caa81a898819184d4992db7e8b566-spritesheet.png)'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {isDa
                      ? 'Række 1: Hvile · Række 2: Mod højre · Række 3: Mod venstre · Række 4: Hilsen · Række 5: Hop · Række 6: Fejl · Række 7: Afventer · Række 8: Arbejder (Laptop) · Række 9: Gennemgår'
                      : 'Row 1: Idle · Row 2: Right · Row 3: Left · Row 4: Greeting · Row 5: Jump · Row 6: Error · Row 7: Awaiting · Row 8: Working (Laptop) · Row 9: Reviewing'}
                  </p>
                </div>
              </div>
              <div className="max-w-xl mx-auto">
                <OLlamaPixelCanvas
                  mode="full-sheet"
                  onSelectCell={(row) => {
                    const anim = OLLAMA_ANIMATIONS[row];
                    if (anim) {
                      setSelectedAnimId(anim.id);
                      setShowFullSheet(false);
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* SECTION 01: Oplev forslaget (Interactive Comparator) */}
          <section className="space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <div className="text-xs font-mono text-[#00E5FF]">
                {isDa ? '01 · Oplev forslaget' : '01 · Experience the Proposal'}
              </div>
              <h3 className="text-xl font-bold text-white mt-0.5">
                {isDa ? 'Samme identitet. Mere personlighed.' : 'Same identity. More personality.'}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {isDa
                  ? 'Til venstre ser du animationer fra det 9-rækkers spritesheet. Til højre kan du vælge mellem samtlige 14 o-Llama-Axiom positurer (01–14).'
                  : 'On the left are the 9 animated rows from the companion spritesheet. On the right you can inspect all 14 o-Llama-Axiom character studies (01–14).'}
              </p>
            </div>

            {/* Toolbar: Mood, Scale & Motion Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded bg-[#0E1529] border border-slate-800">
              {/* Moods: Studio / Værksted / Arkiv / Kosmos */}
              <div className="flex flex-wrap items-center gap-1.5">
                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMood(m.id)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      mood === m.id
                        ? 'bg-[#00E5FF] text-[#050510]'
                        : 'bg-[#162242] text-slate-300 hover:text-white'
                    }`}
                  >
                    {isDa ? m.labelDa : m.labelEn}
                  </button>
                ))}
              </div>

              {/* Scale: 64 / 120 / 192 / 240 px */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-mono text-slate-400 mr-1">
                  {isDa ? 'Størrelse:' : 'Scale:'}
                </span>
                {SCALES.map((s) => (
                  <button
                    key={s.size}
                    type="button"
                    onClick={() => setScaleSize(s.size)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                      scaleSize === s.size
                        ? 'bg-[#FFD600] text-[#050510] font-bold'
                        : 'bg-[#162242] text-slate-300 hover:text-white'
                    }`}
                  >
                    {isDa ? s.labelDa : s.labelEn}
                  </button>
                ))}
              </div>

              {/* Motion toggle */}
              <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={animateOriginal}
                  onChange={(e) => setAnimateOriginal(e.target.checked)}
                  className="rounded border-slate-600 accent-[#00E5FF]"
                />
                <span>{isDa ? 'Bevægelse i originalen' : 'Animate original'}</span>
              </label>
            </div>

            {/* 2-Column Side-by-Side Comparator */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
              {/* Left Column: Nuværende o-Llama (Animated 9 Rows) */}
              <div className="p-5 rounded-lg bg-[#0E162B] border border-slate-700/80 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                    <span>{isDa ? 'Nuværende o-Llama (9×8 Ark)' : 'Animated Spritesheet (9×8)'}</span>
                    <span className="text-[#00E5FF]">pet_6a9caa81...spritesheet.png</span>
                  </div>

                  <div className="py-4 flex items-center justify-center min-h-[250px] bg-[#080C18] rounded border border-slate-800">
                    <OLlamaPixelCanvas
                      mode="animated-row"
                      animationId={selectedAnimId}
                      scaleSize={scaleSize}
                      mood={mood}
                      animateMotion={animateOriginal}
                    />
                  </div>

                  <div className="mt-3">
                    <div className="text-sm font-bold text-white">
                      {isDa ? currentAnim.labelDa : currentAnim.labelEn}{' '}
                      <span className="text-xs font-mono text-[#00E5FF]">
                        · {currentAnim.fps} fps
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      {isDa ? currentAnim.descDa : currentAnim.descEn}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                    {isDa ? 'Animation (9 rækker)' : 'Animation (9 rows)'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {OLLAMA_ANIMATIONS.map((anim) => (
                      <button
                        key={anim.id}
                        type="button"
                        onClick={() => setSelectedAnimId(anim.id)}
                        className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                          selectedAnimId === anim.id
                            ? 'bg-[#00E5FF] text-[#050510] font-bold'
                            : 'bg-[#15203D] text-slate-300 hover:bg-[#1E2E56]'
                        }`}
                      >
                        {isDa ? anim.labelDa : anim.labelEn}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Alle 14 o-Llama-Axiom Positurer (01..14) */}
              <div className="p-5 rounded-lg bg-[#0E162B] border border-slate-700/80 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                    <span>
                      {isDa ? 'o-Llama-Axiom Udtryksstudier (01–14)' : 'o-Llama-Axiom Poses (01–14)'}
                    </span>
                    <span className="text-[#FFD600]">{currentStudy.fileName}</span>
                  </div>

                  <div className="py-4 flex items-center justify-center min-h-[250px] bg-[#080C18] rounded border border-slate-800">
                    <OLlamaPixelCanvas
                      mode="static-study"
                      studyId={selectedStudyId}
                      scaleSize={scaleSize}
                      mood={mood}
                    />
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">
                        {isDa ? currentStudy.labelDa : currentStudy.labelEn}
                      </span>
                      <span className="text-xs font-mono text-[#FFD600]">
                        {isDa ? currentStudy.subLabelDa : currentStudy.subLabelEn}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      {isDa ? currentStudy.descDa : currentStudy.descEn}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                    {isDa
                      ? 'Vælg blandt alle 14 o-Llama-Axiom billeder (01–14)'
                      : 'Select from all 14 o-Llama-Axiom character studies (01–14)'}
                  </div>
                  <div
                    role="radiogroup"
                    aria-label={isDa ? 'Udtryksstudier' : 'Expression studies'}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-44 overflow-y-auto pr-1"
                  >
                    {OLLAMA_EXPRESSION_STUDIES.map((st, idx) => (
                      <button
                        key={st.id}
                        type="button"
                        role="radio"
                        aria-checked={selectedStudyId === st.id}
                        onKeyDown={(e) => handleStudyKeyDown(e, idx)}
                        onClick={() => {
                          setSelectedStudyId(st.id);
                          onApplyExpressionTo3D(st.expressionCode, st.id);
                        }}
                        className={`text-left px-2 py-1.5 rounded border text-xs transition-colors cursor-pointer ${
                          selectedStudyId === st.id
                            ? 'bg-[#192D5A] border-[#00E5FF] text-white font-bold'
                            : 'bg-[#121B34] border-slate-700/80 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <div className="truncate">{isDa ? st.labelDa : st.labelEn}</div>
                        <div className="text-[10px] font-mono text-[#00E5FF] truncate">
                          {st.expressionCode}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Komplet Galleri: Alle 14 o-Llama-Axiom Karakterbilleder (01–14) */}
            <div className="p-5 rounded-lg bg-[#101830] border border-[#00E5FF]/40 space-y-4">
              <div>
                <div className="text-xs font-mono text-[#FFD600]">
                  {isDa
                    ? 'KOMPLET VISUELT ARKIV · O-LLAMA-AXIOM-01 TIL 14'
                    : 'COMPLETE VISUAL ARCHIVE · O-LLAMA-AXIOM-01 TO 14'}
                </div>
                <h4 className="text-lg font-bold text-white">
                  {isDa
                    ? 'Alle 14 udtryk og kropssprog samlet'
                    : 'All 14 Expressions and Body-Language Studies'}
                </h4>
                <p className="text-xs text-slate-300">
                  {isDa
                    ? 'Klik på et kort for at inspicere det i stor størrelse og anvende udtrykket direkte på 3D-modellen.'
                    : 'Click any card to inspect at full scale and apply its expression directly to the 3D robot.'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {OLLAMA_EXPRESSION_STUDIES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setSelectedStudyId(st.id);
                      onApplyExpressionTo3D(st.expressionCode, st.id);
                    }}
                    className={`p-2.5 rounded border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                      selectedStudyId === st.id
                        ? 'bg-[#172852] border-[#00E5FF] shadow-lg'
                        : 'bg-[#0A1020] border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <OLlamaPixelCanvas
                      mode="static-study"
                      studyId={st.id}
                      scaleSize={120}
                      mood={mood}
                    />
                    <div>
                      <div className="text-xs font-bold text-white truncate">
                        {isDa ? st.labelDa : st.labelEn}
                      </div>
                      <div className="text-[10px] font-mono text-[#FFD600] truncate">
                        {isDa ? st.subLabelDa : st.subLabelEn}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 02: De faste kendetegn & Grundfarver */}
          <section className="space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <div className="text-xs font-mono text-[#00E5FF]">
                {isDa ? '02 · De faste kendetegn' : '02 · The Defining Traits'}
              </div>
              <h3 className="text-xl font-bold text-white mt-0.5">
                {isDa ? 'Det, der gør o-Llama til o-Llama.' : 'What makes o-Llama o-Llama.'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded bg-[#0E162B] border border-slate-800">
                <div className="text-xs font-mono text-[#00E5FF] mb-1">
                  {isDa ? '01 / SKÆRMEN & ØRELED' : '01 / SCREEN & EAR HUBS'}
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {isDa ? 'Et ansigt af pixels med rød top-sensor' : 'A Face of Pixels with Red Sensor Dome'}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isDa
                    ? 'Liggende 3/4 skærm i børstet stål med runde øreled på siderne, rød top-sensor og to klare cyan pixeløjne.'
                    : 'Landscape 3/4 brushed-steel monitor with circular side ear-hubs, red top sensor dome, and two crisp cyan pixel eyes.'}
                </p>
              </div>

              <div className="p-4 rounded bg-[#0E162B] border border-slate-800">
                <div className="text-xs font-mono text-[#00E5FF] mb-1">
                  {isDa ? '02 / GRIBEARME & LARVEBÅND' : '02 / C-CLAW ARMS & TREADS'}
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {isDa ? 'Kugleled, C-gribere og 2-hjuls bånd' : 'Ball Joints, C-Claws & 2-Wheel Treads'}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isDa
                    ? 'Segmenterede arme med skulderkugleled og C-formede gribekløer over metalliske larvebånd med to synlige sidehjul.'
                    : 'Segmented arms with spherical shoulder joints and C-shaped pincer claws atop metallic caterpillar treads with two visible road wheels.'}
                </p>
              </div>

              <div className="p-4 rounded bg-[#0E162B] border border-slate-800">
                <div className="text-xs font-mono text-[#FFD600] mb-1">
                  {isDa ? '03 / DET GULE PLUS & 3 LED-LYS' : '03 / YELLOW PLUS & 3 LED STACK'}
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {isDa ? 'Krydsknap (+) og Grøn/Gul/Rød panel' : 'Cross Button (+) & Green/Yellow/Red Stack'}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isDa
                    ? 'Den store gule krydsknap med vandret rille under til venstre, og det forsænkede panel med grøn, gul og rød LED til højre.'
                    : 'The prominent yellow cross button with horizontal slot below on the left, paired with the recessed green, yellow, and red LED stack on the right.'}
                </p>
              </div>
            </div>

            {/* 8 Nominal Colors */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              {NOMINAL_COLORS.map((c) => (
                <div
                  key={c.hex}
                  className="p-2.5 rounded bg-[#090F1E] border border-slate-800 flex flex-col justify-between"
                >
                  <div
                    className="w-full h-8 rounded border border-white/15 mb-2"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className="text-xs font-bold text-white">
                    {isDa ? c.nameDa : c.nameEn}
                  </div>
                  <div className="text-[11px] font-mono text-[#00E5FF]">{c.hex}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                    {isDa ? c.roleDa : c.roleEn}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 03, 04 & 05: Personlighed, Et større univers & Fra koncept til kæledyr */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 03 · Personlighed */}
            <div className="p-5 rounded-lg bg-[#0E162B] border border-slate-800 space-y-3">
              <div className="text-xs font-mono text-[#00E5FF]">
                {isDa ? '03 · Personlighed' : '03 · Personality'}
              </div>
              <h4 className="text-base font-bold text-white">
                {isDa
                  ? 'Tillid bliver synlig i små handlinger.'
                  : 'Trust becomes visible in small actions.'}
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                <li>
                  <strong className="text-white">
                    {isDa ? 'Nysgerrig (01, 07–09):' : 'Curious (01, 07–09):'}
                  </strong>{' '}
                  {isDa
                    ? 'Et nyt input mødes med et lille blik til venstre, højre eller opad og en let hovedhældning.'
                    : 'New input is met with a glance left, right, or upward and a gentle head tilt.'}
                </li>
                <li>
                  <strong className="text-white">
                    {isDa ? 'Tålmodig (02–04, 11):' : 'Patient (02–04, 11):'}
                  </strong>{' '}
                  {isDa
                    ? 'Afventer input med åben C-griber, gennemgår med samlede gribere og arbejder med 3×3 cyanblokke.'
                    : 'Awaits input with an open C-claw, reviews with gathered grippers, and processes with 3×3 cyan blocks.'}
                </li>
                <li>
                  <strong className="text-white">
                    {isDa ? 'Åben for rettelser (06, 13):' : 'Open to Correction (06, 13):'}
                  </strong>{' '}
                  {isDa
                    ? 'Røde målringe (06 Blokeret) viser en blokering, mens det grønne driftslys bliver ved med at lyse.'
                    : 'Red target rings (06 Blocked) show a blockage while the green operating LED remains lit.'}
                </li>
              </ul>
            </div>

            {/* 04 · Et større univers */}
            <div className="p-5 rounded-lg bg-[#0E162B] border border-slate-800 space-y-3">
              <div className="text-xs font-mono text-[#00E5FF]">
                {isDa ? '04 · Et større univers' : '04 · A Larger Universe'}
              </div>
              <h4 className="text-base font-bold text-white">
                {isDa ? 'Stemninger til senere.' : 'Moods for the wider arc.'}
              </h4>
              <div className="space-y-2.5 text-xs text-slate-300">
                {MOODS.filter((m) => m.id !== 'studio').map((m) => (
                  <div key={m.id}>
                    <div className="font-bold text-[#FFD600]">
                      {isDa ? m.labelDa : m.labelEn}
                    </div>
                    <p className="leading-relaxed">
                      {isDa ? m.descDa : m.descEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 05 · Fra koncept til kæledyr */}
            <div className="p-5 rounded-lg bg-[#0E162B] border border-slate-800 space-y-3">
              <div className="text-xs font-mono text-[#00E5FF]">
                {isDa ? '05 · Fra koncept til kæledyr' : '05 · From Concept to Companion'}
              </div>
              <h4 className="text-base font-bold text-white">
                {isDa
                  ? 'Et klart grundlag for næste udgave.'
                  : 'A clear foundation for the next release.'}
              </h4>
              <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                <p>
                  <Check className="w-3.5 h-3.5 text-[#00E676] inline mr-1" />
                  <strong>{isDa ? 'Færdigt:' : 'Completed:'}</strong>{' '}
                  {isDa
                    ? '14 o-Llama-Axiom karakterark (01–14), 9×8 transparent spritesheet, 3D WebGL-model og Production Bible v1.0.'
                    : '14 o-Llama-Axiom character sheets (01–14), 9×8 transparent spritesheet, 3D WebGL model, and Production Bible v1.0.'}
                </p>
                <p>
                  <Layers className="w-3.5 h-3.5 text-[#00E5FF] inline mr-1" />
                  <strong>{isDa ? 'Kilder:' : 'Sources:'}</strong>{' '}
                  {isDa
                    ? 'o-Llama-Axiom-01..14.png, pet_6a9caa81-spritesheet.png & The Token of Trust v1.0.'
                    : 'o-Llama-Axiom-01..14.png, pet_6a9caa81-spritesheet.png & The Token of Trust v1.0.'}
                </p>
                <p>
                  <Eye className="w-3.5 h-3.5 text-[#FFD600] inline mr-1" />
                  {isDa
                    ? 'Projektnavn: o-Llama - Axiom · Udarbejdet 2.–3. oktober 2026.'
                    : 'Project Name: o-Llama - Axiom · Authored Oct 2–3, 2026.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
