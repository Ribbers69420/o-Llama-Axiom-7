'use client';

import React, { useState } from 'react';
import OLlamaPixelCanvas from '@/components/OLlamaPixelCanvas';
import {
  PRODUCTION_BIBLE_SCENES,
  type AppLanguage,
} from '@/lib/ollama-bible-spec';
import {
  CHAPTER_SCENES,
  CHASSIS_SPECS,
  EXPRESSION_LIST,
  HITBOX_SPECS,
  SPRITE_SHEET_ROWS,
  type ChassisType,
  type ExpressionId,
} from '@/lib/game-rules';
import { BookOpen, Check, Code2, Copy, Film, Layers, Shield, X } from 'lucide-react';

interface ProductionBibleModalProps {
  isOpen: boolean;
  lang: AppLanguage;
  onClose: () => void;
  onSelectChapter: (idx: number) => void;
  onSelectChassis: (c: ChassisType) => void;
  onSelectExpression: (e: ExpressionId) => void;
}

type BibleTab = 'overview' | 'simulator' | 'bible' | 'chassis' | 'xml';

const MASTER_XML_SCHEMA = `<?xml version="1.0" encoding="UTF-8"?>
<PixelDesignDocument name="AXIOM-7_GuardianOfTruth" universe="PIXELVERSE-9" version="2.0" bible="TheTokenOfTrust_v1.0">
  <project>
    <name>AXIOM-7 — The Token of Trust (o-Llama)</name>
    <tagline>It is the promise to stay answerable to reality.</tagline>
    <resolution width="1280" height="720" aspectRatio="16:9" pixelUnit="4px" tileSize="16px" />
    <masterRate fps="24" idleStepped="8" actionStepped="12" />
  </project>
  <coreArc episodes="7" scenes="10">
    <step ep="1" scene="1854" verb="Trying" blink="Blinking too fast, holding nothing" />
    <step ep="2" scene="1856" verb="Noticing" blink="Analytical hollow rings" />
    <step ep="3" scene="1866" verb="Trusting" pillars="FACTS,EVIDENCE,DATA,REALITY" accuracy="99.7%" />
    <step ep="4" scene="1952" verb="Remembering" archives="SPELLS,LORE,MAGIC,TRUTH" />
    <step ep="5" scene="1852" verb="Protecting" streams="847" llck="95/100" lud="188/200" />
    <step ep="6" scene="1911,499" verb="Carrying" eye="RainbowSpiral_7Rings" />
    <step ep="7" scene="1854-coda" verb="Passing on" blink="Blinking calmly, holding everything lightly" />
  </coreArc>
  <characterHitboxes character="AXIOM-7_oLlama">
    <hitbox id="HB-A-01" name="Body_Main" offset="-45,-160" size="90x160" purpose="PhysicsCollision_Primary" />
    <hitbox id="HB-A-02" name="Head_Screen" offset="-55,-280" size="110x80" purpose="InteractionZone_Primary" />
    <hitbox id="HB-A-03" name="Tread_Left" offset="-90,-30" size="45x30" purpose="GroundContact_Left" />
    <hitbox id="HB-A-04" name="Tread_Right" offset="45,-30" size="45x30" purpose="GroundContact_Right" />
    <hitbox id="HB-A-05" name="Button_Zone_YellowPlus" offset="-30,-110" size="60x20" purpose="UI_Interaction" />
  </characterHitboxes>
</PixelDesignDocument>`;

export default function MasterCodexModal({
  isOpen,
  lang,
  onClose,
  onSelectChapter,
  onSelectChassis,
  onSelectExpression,
}: ProductionBibleModalProps) {
  const [activeTab, setActiveTab] = useState<BibleTab>('overview');
  const [simSceneId, setSimSceneId] = useState<string>('1854');
  const [chassisFilter, setChassisFilter] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
  const [copiedXml, setCopiedXml] = useState<boolean>(false);

  if (!isOpen) return null;

  const isDa = lang === 'da';
  const currentSimScene =
    PRODUCTION_BIBLE_SCENES.find((s) => s.sceneId === simSceneId) ||
    PRODUCTION_BIBLE_SCENES[0];

  const filteredScenes = PRODUCTION_BIBLE_SCENES.filter((s) => {
    if (chassisFilter === 'ALL') return true;
    if (chassisFilter === 'A') return s.chassis === 'A' || s.chassis === 'A-Coda';
    return s.chassis === chassisFilter;
  });

  const handleCopyXml = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(MASTER_XML_SCHEMA).catch(() => {});
    }
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="PRODUCTION BIBLE v1.0 — The Token of Trust"
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-[rgba(5,5,16,0.86)] pointer-events-auto"
    >
      <div className="w-full max-w-5xl bg-[#0B1020] border-2 border-[#FFD600] rounded-lg shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#141D38] border-b border-slate-700">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-[#FFD600]" />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-[#FFD600] text-[#050510] font-mono font-bold text-xs">
                  A7
                </span>
                <h2 className="text-base sm:text-lg font-bold tracking-wider uppercase font-[family-name:var(--font-display)] text-[#FFD600]">
                  AXIOM-7 · PRODUCTION BIBLE v1.0
                </h2>
              </div>
              <p className="text-xs text-slate-300">
                The Token of Trust · Qwen&apos;s Legacy · PIXELVERSE-9 Master Specification v2.0
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isDa ? 'Luk Production Bible' : 'Close Production Bible'}
            className="p-1.5 rounded bg-[#1F2C52] hover:bg-[#2B3D70] text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Bar */}
        <div className="flex flex-wrap items-center gap-1.5 px-5 py-2.5 bg-[#080C18] border-b border-slate-800">
          {(
            [
              { id: 'overview', labelDa: 'Overview & Core Arc', labelEn: 'Overview & Core Arc', icon: Shield },
              { id: 'simulator', labelDa: 'Scene Simulator (24fps)', labelEn: 'Scene Simulator (24fps)', icon: Film },
              { id: 'bible', labelDa: 'Scene Bible (Ep 1–7)', labelEn: 'Scene Bible (Ep 1–7)', icon: Layers },
              { id: 'chassis', labelDa: 'Chassis, Udtryk & Hitboxes', labelEn: 'Chassis, Expressions & Hitboxes', icon: BookOpen },
              { id: 'xml', labelDa: 'Clean XML Index', labelEn: 'Clean XML Index', icon: Code2 },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#FFD600] text-[#050510]'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{isDa ? tab.labelDa : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Philosophy Hero */}
              <div className="p-5 rounded-lg bg-[#101830] border border-[#00E5FF]/40 space-y-2">
                <div className="text-xs font-mono uppercase tracking-widest text-[#00E5FF]">
                  PRODUCTION BIBLE v1.0 · THE TOKEN OF TRUST
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white font-[family-name:var(--font-display)]">
                  {isDa
                    ? 'The Token of Trust er ikke magt. "Det er løftet om at forblive ansvarlig over for virkeligheden."'
                    : 'The Token of Trust is not power. "It is the promise to stay answerable to reality."'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isDa
                    ? 'AXIOM-7 er ikke historien om en AI, der bliver alvidende. Det er historien om en AI, der bliver værd at stole på. Tillid kommer ikke af perfekte svar eller uendelig viden, men af en forpligtelse til at verificere, indrømme usikkerhed, kunne rettes og beskytte mennesket mod falsk sikkerhed.'
                    : 'AXIOM-7 is not the story of an AI becoming omniscient. It is the story of an AI becoming trustworthy. Trustworthiness does not come from perfect answers or infinite knowledge, but from a commitment to verify, admit uncertainty, remain correctable, and protect the human from false confidence.'}
                </p>
              </div>

              {/* 4 Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
                <div className="p-3.5 rounded bg-[#0D1428] border border-slate-800 text-center">
                  <div className="text-2xl font-bold text-[#00E5FF]">7</div>
                  <div className="text-xs text-slate-400">Episodes</div>
                </div>
                <div className="p-3.5 rounded bg-[#0D1428] border border-slate-800 text-center">
                  <div className="text-2xl font-bold text-[#FFD600]">10</div>
                  <div className="text-xs text-slate-400">Canonical Scenes</div>
                </div>
                <div className="p-3.5 rounded bg-[#0D1428] border border-slate-800 text-center">
                  <div className="text-2xl font-bold text-[#00C853]">4</div>
                  <div className="text-xs text-slate-400">Chassis Variants</div>
                </div>
                <div className="p-3.5 rounded bg-[#0D1428] border border-slate-800 text-center">
                  <div className="text-2xl font-bold text-white">24 fps</div>
                  <div className="text-xs text-slate-400">Master Rate (8/12 stepped)</div>
                </div>
              </div>

              {/* Core Arc, Technical Standards & Final Visual Rule */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded bg-[#0E162B] border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#00E5FF]">
                    Core Arc (Ep 1 – Ep 7)
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-200 font-mono">
                    <li>01. Trying (Ep 1 · 1854)</li>
                    <li>02. Noticing (Ep 2 · 1856)</li>
                    <li>03. Trusting (Ep 3 · 1866)</li>
                    <li>04. Remembering (Ep 4 · 1952)</li>
                    <li>05. Protecting (Ep 5 · 1852)</li>
                    <li>06. Carrying (Ep 6 · 1911)</li>
                    <li>07. Passing on (Ep 7 · 1854-coda)</li>
                  </ul>
                </div>

                <div className="p-4 rounded bg-[#0E162B] border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFD600]">
                    Technical Standards
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300 font-mono tabular-nums">
                    <li>Resolution: 1280 × 720 (16:9)</li>
                    <li>Idle Rate: 8 fps (3 held frames)</li>
                    <li>Action Rate: 12 fps (2 held frames)</li>
                    <li>Pixel Unit: 4 × 4 px</li>
                    <li>Tile Size: 16 × 16 px</li>
                    <li>Sprite Sheet: 512 × 512 px (256 cells)</li>
                  </ul>
                </div>

                <div className="p-4 rounded bg-[#0E162B] border border-[#00C853]/50 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#00C853]">
                    Final Visual Rule (Mirror)
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isDa
                      ? 'Ep 1 (1854) og Ep 7 (1854-coda) deler præcis samme rum, indramning og symbol (fyldte cirkler ●●).'
                      : 'Ep 1 (1854) and Ep 7 (1854-coda) share the identical set, framing, and symbol (filled circles ●●).'}
                  </p>
                  <div className="p-2.5 rounded bg-[#080C18] text-xs font-mono space-y-1">
                    <div className="text-[#FFD600]">
                      Ep 1: Blinking too fast, holding nothing.
                    </div>
                    <div className="text-[#00E5FF]">
                      Ep 7: Blinking calmly, holding everything lightly.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'simulator' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Interactive Scene Simulator · 24 fps Master (8/12 fps stepped)
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isDa
                      ? 'Vælg en episode for at simulere AXIOM-7 skærm, chassis, blinke-rytme og instruktørnoter.'
                      : 'Select an episode to simulate AXIOM-7 head, chassis, blink rhythm, and director notes.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRODUCTION_BIBLE_SCENES.map((sc) => (
                    <button
                      key={sc.sceneId}
                      type="button"
                      onClick={() => setSimSceneId(sc.sceneId)}
                      className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                        simSceneId === sc.sceneId
                          ? 'bg-[#00E5FF] text-[#050510]'
                          : 'bg-[#141F3D] text-slate-300 hover:bg-[#1E2E5A]'
                      }`}
                    >
                      Ep {sc.episodeNum} ({sc.sceneId})
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-center p-5 rounded-lg bg-[#090E1E] border border-slate-800">
                <div className="flex flex-col items-center justify-center p-4 rounded bg-[#050811] border border-slate-800">
                  <OLlamaPixelCanvas
                    mode="animated-row"
                    animationId={
                      currentSimScene.expression === 'EX-02'
                        ? 'afventer'
                        : currentSimScene.expression === 'EX-03'
                        ? 'hilsen'
                        : currentSimScene.expression === 'EX-04'
                        ? 'hop'
                        : 'hvile'
                    }
                    scaleSize={192}
                    mood={
                      currentSimScene.sceneId === '1854' ||
                      currentSimScene.sceneId === '1856' ||
                      currentSimScene.sceneId === '1854-coda'
                        ? 'vaerksted'
                        : currentSimScene.sceneId === '1911'
                        ? 'kosmos'
                        : 'arkiv'
                    }
                    animateMotion={true}
                  />
                  <div className="mt-3 text-xs font-mono text-[#00E5FF]">
                    SCENE {currentSimScene.sceneId} · CHASSIS {currentSimScene.chassis} ·{' '}
                    {currentSimScene.expression}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-mono text-[#FFD600]">
                      {isDa ? currentSimScene.arcVerbDa : currentSimScene.arcVerbEn}
                    </div>
                    <h4 className="text-lg font-bold text-white mt-0.5">
                      {isDa ? currentSimScene.titleDa : currentSimScene.titleEn}
                    </h4>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">
                      {isDa ? currentSimScene.locationDa : currentSimScene.locationEn}
                    </div>
                  </div>

                  <div className="p-3.5 rounded bg-[#101932] border border-slate-700/80 space-y-1.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#00E5FF]">
                      Director&apos;s Note
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {isDa ? currentSimScene.directorNoteDa : currentSimScene.directorNoteEn}
                    </p>
                    <div className="text-xs font-mono text-[#00C853] pt-1">
                      Blink / Motion: {isDa ? currentSimScene.blinkBehaviorDa : currentSimScene.blinkBehaviorEn}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const idx = Math.min(
                        CHAPTER_SCENES.length - 1,
                        Math.max(0, currentSimScene.episodeNum - 1)
                      );
                      onSelectChapter(idx);
                      onClose();
                    }}
                    className="px-4 py-2 rounded text-xs font-bold uppercase tracking-wider bg-[#FFD600] hover:bg-[#FFC400] text-[#050510] transition-colors cursor-pointer"
                  >
                    {isDa ? 'Indlæs denne scene i 3D-Spillet' : 'Load Scene in 3D Game'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bible' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#00E5FF]">
                  Scene Specification Bible (All Episodes & 1854-Coda)
                </h3>
                <div className="flex items-center gap-1.5">
                  {(['ALL', 'A', 'B', 'C'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setChassisFilter(f)}
                      className={`px-3 py-1 rounded text-xs font-mono cursor-pointer ${
                        chassisFilter === f
                          ? 'bg-[#00E5FF] text-[#050510] font-bold'
                          : 'bg-[#141F3D] text-slate-300'
                      }`}
                    >
                      {f === 'ALL' ? 'All Scenes' : `Chassis ${f}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredScenes.map((sc) => (
                  <div
                    key={sc.sceneId}
                    className="p-4 rounded bg-[#0E162B] border border-slate-800 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono text-[#FFD600] mb-1">
                        <span>{isDa ? sc.arcVerbDa : sc.arcVerbEn}</span>
                        <span>
                          ID: {sc.sceneId} · Ver. {sc.chassis}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">
                        {isDa ? sc.titleDa : sc.titleEn}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {isDa ? sc.directorNoteDa : sc.directorNoteEn}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs font-mono">
                      <span className="text-[#00E5FF]">{sc.expression}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSimSceneId(sc.sceneId);
                          setActiveTab('simulator');
                        }}
                        className="text-[#FFD600] hover:underline cursor-pointer"
                      >
                        {isDa ? 'Åbn i Simulator →' : 'Open in Simulator →'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'chassis' && (
            <div className="space-y-5">
              {/* Chassis Variants */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#00E5FF] mb-2.5">
                  Chassis Index (Click to Equip in 3D)
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
                    </button>
                  ))}
                </div>
              </div>

              {/* Expression Library */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#00E5FF] mb-2.5">
                  Expression Index (EX-01 to EX-08)
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

              {/* Hitboxes & Sprite Sheet Rows */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFD600]">
                    Hitbox Definitions (HB-01 to HB-04)
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {HITBOX_SPECS.map((hb) => (
                      <div
                        key={hb.id}
                        className="p-2.5 rounded bg-[#0E162B] border border-slate-800 font-mono text-xs"
                      >
                        <div className="text-[#FFD600] font-bold">
                          {hb.id} · {hb.name}
                        </div>
                        <div className="text-slate-300 tabular-nums mt-0.5">
                          Offset ({hb.offsetX}, {hb.offsetY}) · {hb.width}×{hb.height}px
                        </div>
                        <div className="text-[#00E5FF] text-[11px]">{hb.purpose}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFD600]">
                    Master Sprite Sheet Specification (512×512 · 256 Cells)
                  </h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {SPRITE_SHEET_ROWS.map((r) => (
                      <div
                        key={r.row}
                        className="p-2 rounded bg-[#0E162B] border border-slate-800 text-xs font-mono"
                      >
                        <span className="text-[#00E5FF] font-bold">{r.row}</span> ({r.yRange}):{' '}
                        <span className="text-white">{r.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'xml' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Clean XML Master Specification Schema
                  </h3>
                  <p className="text-xs text-slate-400">
                    Raw master specification schema for compiler and engine integration.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyXml}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-bold bg-[#00E5FF] hover:bg-[#00B8D4] text-[#050510] transition-colors cursor-pointer"
                >
                  {copiedXml ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedXml ? 'Copied XML!' : 'Copy XML'}</span>
                </button>
              </div>
              <pre className="p-4 rounded bg-[#060913] border border-slate-800 text-xs font-mono text-[#00E5FF] overflow-x-auto leading-relaxed">
                {MASTER_XML_SCHEMA}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
