'use client';

import React, { useState } from 'react';
import type { PillarName, EnemyArchetype } from '@/lib/game-rules';
import { Compass, Minimize2, Maximize2, Zap } from 'lucide-react';

interface RadarTome {
  id: string;
  x: number;
  z: number;
  collected: boolean;
  pillar: PillarName;
}

interface RadarEnemy {
  id: string;
  x: number;
  z: number;
  hp: number;
  archetype: EnemyArchetype;
}

interface AxiomTacticalRadarProps {
  playerX?: number;
  playerZ?: number;
  playerAngle?: number;
  isDashing?: boolean;
  dashCooldownTimer?: number;
  tomes?: RadarTome[];
  enemies?: RadarEnemy[];
  lang?: 'da' | 'en';
}

const PILLAR_COLORS: Record<PillarName, string> = {
  FACTS: '#00E676',
  EVIDENCE: '#BA68C8',
  DATA: '#00E5FF',
  REALITY: '#FFD600',
};

export default function AxiomTacticalRadar({
  playerX = 0,
  playerZ = 0,
  playerAngle = 0,
  isDashing = false,
  dashCooldownTimer = 0,
  tomes = [],
  enemies = [],
  lang = 'da',
}: AxiomTacticalRadarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [radarRange, setRadarRange] = useState<number>(20); // 20 units radius

  const isDa = lang === 'da';
  const size = 160;
  const center = size / 2;
  const scale = (center - 12) / radarRange; // pixels per world unit

  // Dash status
  const dashReady = dashCooldownTimer <= 0;

  return (
    <div
      aria-label="Tactical 2D Sector Radar"
      className="bg-[rgba(8,12,24,0.92)] border border-[#00E5FF]/60 rounded-lg p-2 shadow-2xl backdrop-blur-md flex flex-col items-center pointer-events-auto select-none font-mono"
    >
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between gap-2 border-b border-slate-800 pb-1 mb-1 text-[10px]">
        <div className="flex items-center gap-1.5 text-[#00E5FF] font-bold">
          <Compass className="w-3.5 h-3.5" />
          <span>{isDa ? 'PIXELVERSE-9 RADAR' : 'TACTICAL RADAR'}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setRadarRange((r) => (r === 20 ? 30 : 20))}
            className="px-1.5 py-0.5 rounded bg-[#131D38] hover:bg-[#1E2E58] text-[9px] text-[#FFD600] border border-slate-700 cursor-pointer"
            title="Toggle Radar Zoom"
          >
            {radarRange}m
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
            aria-label={collapsed ? 'Expand Radar' : 'Collapse Radar'}
          >
            {collapsed ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Circular Radar Screen */}
          <div className="relative w-[160px] h-[160px] rounded-full overflow-hidden border border-[#00E5FF]/40 bg-[#040812] shadow-inner">
            {/* Animated Radar Sweep Cone */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none opacity-40 animate-spin"
              style={{
                animationDuration: '3.5s',
                background:
                  'conic-gradient(from 0deg, transparent 0deg, transparent 300deg, rgba(0, 229, 255, 0.45) 360deg)',
              }}
            />

            {/* SVG Elements: Rings, Crosshairs, Blips */}
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
              {/* Range Rings */}
              <circle
                cx={center}
                cy={center}
                r={center * 0.33}
                fill="none"
                stroke="rgba(0, 229, 255, 0.2)"
                strokeDasharray="2 2"
              />
              <circle
                cx={center}
                cy={center}
                r={center * 0.66}
                fill="none"
                stroke="rgba(0, 229, 255, 0.25)"
                strokeDasharray="2 2"
              />
              <circle
                cx={center}
                cy={center}
                r={center - 3}
                fill="none"
                stroke="rgba(0, 229, 255, 0.35)"
              />

              {/* Crosshairs */}
              <line
                x1={center}
                y1={4}
                x2={center}
                y2={size - 4}
                stroke="rgba(0, 229, 255, 0.2)"
                strokeWidth="1"
              />
              <line
                x1={4}
                y1={center}
                x2={size - 4}
                y2={center}
                stroke="rgba(0, 229, 255, 0.2)"
                strokeWidth="1"
              />

              {/* Cardinal Directions */}
              <text x={center} y={11} fill="#00E5FF" fontSize="8" textAnchor="middle" opacity="0.7">
                N
              </text>
              <text x={center} y={size - 4} fill="#00E5FF" fontSize="8" textAnchor="middle" opacity="0.7">
                S
              </text>
              <text x={size - 8} y={center + 3} fill="#00E5FF" fontSize="8" textAnchor="middle" opacity="0.7">
                E
              </text>
              <text x={9} y={center + 3} fill="#00E5FF" fontSize="8" textAnchor="middle" opacity="0.7">
                W
              </text>

              {/* Tome Beacons */}
              {tomes.map((t) => {
                const dx = (t.x - playerX) * scale;
                const dz = (t.z - playerZ) * scale;
                const dist = Math.hypot(dx, dz);
                if (dist > center - 6) return null; // Outside radar boundary
                const bx = center + dx;
                const bz = center + dz;
                const color = PILLAR_COLORS[t.pillar] || '#00E676';

                return (
                  <g key={t.id} opacity={t.collected ? 0.3 : 1}>
                    {/* Pulsing beacon diamond */}
                    <rect
                      x={bx - 3.5}
                      y={bz - 3.5}
                      width={7}
                      height={7}
                      fill={color}
                      stroke="#05070B"
                      strokeWidth="1"
                      transform={`rotate(45 ${bx} ${bz})`}
                    />
                    {!t.collected && (
                      <circle
                        cx={bx}
                        cy={bz}
                        r={6}
                        fill="none"
                        stroke={color}
                        strokeWidth="0.8"
                        opacity="0.8"
                      />
                    )}
                  </g>
                );
              })}

              {/* Enemy Markers */}
              {enemies.map((e) => {
                if (e.hp <= 0) return null;
                const dx = (e.x - playerX) * scale;
                const dz = (e.z - playerZ) * scale;
                const dist = Math.hypot(dx, dz);
                if (dist > center - 6) return null;
                const ex = center + dx;
                const ez = center + dz;

                const enemyCol =
                  e.archetype === 'swarmer'
                    ? '#FF1744'
                    : e.archetype === 'emitter'
                    ? '#D500F9'
                    : '#FF9100';

                return (
                  <circle
                    key={e.id}
                    cx={ex}
                    cy={ez}
                    r={3.5}
                    fill={enemyCol}
                    stroke="#05070B"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Player Chevron (Center, Rotated by playerAngle) */}
              <g transform={`translate(${center}, ${center}) rotate(${(playerAngle * 180) / Math.PI})`}>
                <polygon
                  points="0,-7 5,6 0,3 -5,6"
                  fill="#00E5FF"
                  stroke="#FFFFFF"
                  strokeWidth="1"
                />
                {isDashing && (
                  <circle cx={0} cy={0} r={8} fill="none" stroke="#FFD600" strokeWidth="1.5" />
                )}
              </g>
            </svg>
          </div>

          {/* Coordinates & Dash Readout Bar */}
          <div className="w-full mt-1.5 flex items-center justify-between text-[10px] tabular-nums">
            <span className="text-slate-400">
              POS: <strong className="text-white">{playerX.toFixed(1)}, {playerZ.toFixed(1)}</strong>
            </span>

            {/* [Shift] Dash Indicator */}
            <div
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                dashReady
                  ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40'
                  : 'bg-[#FF9100]/20 text-[#FF9100] border border-[#FF9100]/40'
              }`}
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>
                {dashReady
                  ? isDa
                    ? 'DASH KLAR [Shift]'
                    : 'DASH READY [Shift]'
                  : `${dashCooldownTimer.toFixed(1)}s`}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
