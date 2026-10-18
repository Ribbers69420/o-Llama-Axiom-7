'use client';

import React, { useEffect, useRef } from 'react';
import type {
  EnvironmentMoodId,
  OLlamaAnimationId,
  OLlamaStudyId,
  SpriteScaleSize,
} from '@/lib/ollama-bible-spec';

interface OLlamaPixelCanvasProps {
  mode: 'animated-row' | 'static-study' | 'full-sheet';
  animationId?: OLlamaAnimationId;
  studyId?: OLlamaStudyId;
  scaleSize?: SpriteScaleSize;
  mood?: EnvironmentMoodId;
  animateMotion?: boolean;
  onSelectCell?: (row: number, col: number) => void;
}

// Draws a single 48x48 pixel-grid cell of o-Llama / AXIOM-7 onto a 2D canvas context
export function drawOLlamaPixelCell(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  cellSize: number,
  params: {
    row: number; // 0..8
    col: number; // 0..7
    studyOverride?: OLlamaStudyId;
  }
) {
  const u = cellSize / 48; // 1 pixel unit
  const px = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.round(ox + x * u),
      Math.round(oy + y * u),
      Math.max(1, Math.round(w * u)),
      Math.max(1, Math.round(h * u))
    );
  };

  const { row, col, studyOverride } = params;

  // Determine posture & expression from either studyOverride or (row, col)
  let headTiltY = 0;
  let headShiftX = 0;
  let bodyBounceY = 0;
  let eyeMode: 'filled' | 'blink' | 'ring' | 'happy' | 'red-ring' | 'blocks' | 'wise' = 'filled';
  let leftArm: 'neutral' | 'wave' | 'invite' | 'tucked' | 'up' | 'laptop' = 'neutral';
  let rightArm: 'neutral' | 'wave' | 'invite' | 'tucked' | 'chin' | 'up' | 'laptop' = 'neutral';
  let treadPhase = col % 2;

  if (studyOverride) {
    if (studyOverride === 'nysgerrig') {
      eyeMode = 'filled';
      headTiltY = 1;
    } else if (studyOverride === 'undersoeger') {
      eyeMode = 'ring';
      rightArm = 'chin';
    } else if (studyOverride === 'arbejder') {
      eyeMode = 'blocks';
      leftArm = 'laptop';
      rightArm = 'laptop';
    } else if (studyOverride === 'afventer-dig') {
      eyeMode = 'ring';
      headTiltY = -1;
      leftArm = 'invite';
    } else if (studyOverride === 'gennemgaar') {
      eyeMode = 'ring';
      headTiltY = 2;
      leftArm = 'tucked';
      rightArm = 'tucked';
    } else if (studyOverride === 'lille-glaede') {
      eyeMode = 'happy';
      leftArm = 'wave';
      rightArm = 'invite';
    } else if (studyOverride === 'blokeret') {
      eyeMode = 'red-ring';
      leftArm = 'tucked';
      rightArm = 'tucked';
    } else if (studyOverride === 'stille') {
      eyeMode = 'blink';
    }
  } else {
    // Canonical 9-row x 8-column o-Llama spritesheet mapping
    if (row === 0) {
      // Row 0: Hvile (Idle with blinks on col 1, 3, 6)
      eyeMode = col === 1 || col === 3 || col === 6 ? 'blink' : 'filled';
      headShiftX = col === 2 ? -1 : col === 5 ? 1 : 0;
    } else if (row === 1) {
      // Row 1: Mod højre
      eyeMode = 'filled';
      headShiftX = 2;
      bodyBounceY = col % 2 === 0 ? 0 : -1;
      leftArm = 'invite';
    } else if (row === 2) {
      // Row 2: Mod venstre
      eyeMode = 'filled';
      headShiftX = -2;
      bodyBounceY = col % 2 === 0 ? 0 : -1;
      rightArm = 'invite';
    } else if (row === 3) {
      // Row 3: Hilsen (Waving)
      eyeMode = 'filled';
      rightArm = col % 2 === 0 ? 'wave' : 'up';
      headTiltY = col % 2 === 0 ? -1 : 0;
    } else if (row === 4) {
      // Row 4: Hop / Lille glæde (^^)
      eyeMode = 'happy';
      bodyBounceY = col >= 2 && col <= 5 ? -2 : 0;
      leftArm = col >= 1 && col <= 6 ? 'up' : 'neutral';
      rightArm = col >= 1 && col <= 6 ? 'up' : 'neutral';
    } else if (row === 5) {
      // Row 5: Fejl / Blokeret (Red target rings cols 0..5, recovers to cyan on cols 6..7)
      eyeMode = col <= 5 ? 'red-ring' : 'filled';
      headShiftX = col <= 5 ? (col % 2 === 0 ? -1 : 1) : 0;
    } else if (row === 6) {
      // Row 6: Afventer / Undersøger (Hollow rings + hand to chin / open gripper)
      eyeMode = 'ring';
      rightArm = col < 6 ? 'chin' : 'invite';
      leftArm = col >= 4 ? 'invite' : 'neutral';
    } else if (row === 7) {
      // Row 7: Arbejder (Pixel blocks ░░ + Laptop)
      eyeMode = 'blocks';
      leftArm = 'laptop';
      rightArm = 'laptop';
    } else if (row === 8) {
      // Row 8: Gennemgår / Fejring
      eyeMode = col < 2 ? 'ring' : 'happy';
      bodyBounceY = col >= 3 && col <= 6 ? -2 : 0;
      leftArm = col < 2 ? 'tucked' : 'up';
      rightArm = col < 2 ? 'tucked' : 'up';
    }
  }

  const by = bodyBounceY;
  const hx = headShiftX;
  const hy = by + headTiltY;

  // Soft ground shadow
  px(10, 42, 28, 3, 'rgba(0, 0, 0, 0.35)');

  // 1. Tank Treads (Left: x=9..18, Right: x=30..39, y=34..42)
  // Outer dark border #1A1A1A, tread blocks #2D2D2D & #3D3D3D
  px(8, 34 + by, 11, 8, '#1A1A1A');
  px(29, 34 + by, 11, 8, '#1A1A1A');
  px(9, 35 + by, 9, 6, '#2D2D2D');
  px(30, 35 + by, 9, 6, '#2D2D2D');
  for (let t = 0; t < 3; t++) {
    const offset = treadPhase === 0 ? 0 : 1;
    px(10 + t * 3, 36 + by + offset, 2, 4, '#4D4D4D');
    px(31 + t * 3, 36 + by + offset, 2, 4, '#4D4D4D');
  }

  // 2. Main Body Chassis (x=14..34, y=23..35)
  px(13, 23 + by, 22, 13, '#1A1A1A');
  px(14, 24 + by, 20, 11, '#2D2D2D');
  // Secondary panel bevel #3D3D3D
  px(15, 25 + by, 18, 9, '#3D3D3D');
  px(16, 26 + by, 16, 7, '#262626');

  // 3. Signature Yellow Plus (+) Button on Left Chest (#FFD600)
  // Horizontal + Vertical cross bars
  px(18, 27 + by, 2, 5, '#FFD600');
  px(17, 28 + by, 4, 3, '#FFD600');

  // 4. Control Lights on Right Chest (Green LED #00C853, Yellow/Orange #FFB300, Red #FF1744)
  px(24, 27 + by, 2, 2, '#00E5FF');
  px(28, 27 + by, 2, 2, '#00C853'); // Signature Green Operating LED
  px(24, 30 + by, 2, 2, '#FFD600');
  px(28, 30 + by, 2, 2, '#FF1744'); // Red Button / Indicator

  // 5. Visible Neck Joint + Red/Yellow Wires (y=20..23)
  px(20, 20 + by, 8, 3, '#1A1A1A');
  px(21, 21 + by, 6, 2, '#3D3D3D');
  px(18, 21 + by, 1, 2, '#FF1744');
  px(29, 21 + by, 1, 2, '#FFD600');

  // 6. Articulated Claw Grippers (Left & Right Arms)
  const drawGripper = (side: 'left' | 'right', pose: string) => {
    const baseX = side === 'left' ? 9 : 35;
    if (pose === 'tucked') {
      px(side === 'left' ? 11 : 34, 27 + by, 3, 5, '#3D3D3D');
      px(side === 'left' ? 11 : 34, 31 + by, 3, 2, '#1A1A1A');
    } else if (pose === 'up' || pose === 'wave') {
      const lift = pose === 'wave' && col % 2 === 0 ? -4 : -2;
      px(baseX, 21 + by + lift, 4, 6, '#3D3D3D');
      // Open C-claw
      px(baseX - 1, 18 + by + lift, 5, 3, '#4D4D4D');
      px(baseX, 18 + by + lift, 3, 2, '#0A0A0A');
    } else if (pose === 'chin') {
      px(33, 21 + by, 4, 6, '#3D3D3D');
      px(31, 19 + by, 4, 3, '#4D4D4D');
    } else if (pose === 'invite') {
      px(baseX - 1, 25 + by, 5, 4, '#3D3D3D');
      // Open inviting gripper facing user
      px(baseX - 2, 26 + by, 4, 4, '#4D4D4D');
      px(baseX - 1, 27 + by, 2, 2, '#0A0A0A');
    } else if (pose === 'laptop') {
      px(side === 'left' ? 11 : 33, 26 + by, 4, 5, '#3D3D3D');
    } else {
      // neutral
      px(baseX, 26 + by, 4, 6, '#3D3D3D');
      px(baseX, 31 + by, 4, 3, '#1A1A1A');
    }
  };

  drawGripper('left', leftArm);
  drawGripper('right', rightArm);

  // Deployable Mini-Laptop in 'arbejder' pose
  if (leftArm === 'laptop' || rightArm === 'laptop') {
    px(15, 29 + by, 18, 8, '#1A1A1A');
    px(16, 30 + by, 16, 6, '#3D3D3D');
    // Glowing tiny emblem on laptop lid
    px(23, 32 + by, 2, 2, '#00E5FF');
  }

  // 7. Landscape Head Screen (x=9..39, y=5..21)
  px(9 + hx, 5 + hy, 30, 16, '#1A1A1A');
  px(10 + hx, 6 + hy, 28, 14, '#3D3D3D');
  // Top Red Sensor Cap
  px(21 + hx, 4 + hy, 6, 2, '#FF1744');
  // Inner Black Screen #0A0A0A
  px(12 + hx, 8 + hy, 24, 10, '#0A0A0A');

  // 8. Pixel Eye Expressions on Screen
  const leftEyeX = 15 + hx;
  const rightEyeX = 26 + hx;
  const eyeY = 10 + hy;

  if (eyeMode === 'filled') {
    // Two filled cyan pixel circles ●● (#00E5FF + #00BCD4 glow)
    [leftEyeX, rightEyeX].forEach((ex) => {
      px(ex - 1, eyeY, 8, 6, '#00BCD4');
      px(ex, eyeY - 1, 6, 8, '#00BCD4');
      px(ex, eyeY, 6, 6, '#00E5FF');
      px(ex + 1, eyeY + 1, 2, 2, '#FFFFFF');
    });
  } else if (eyeMode === 'blink') {
    // Awake calm cyan lines --
    [leftEyeX, rightEyeX].forEach((ex) => {
      px(ex, eyeY + 2, 7, 2, '#00E5FF');
    });
  } else if (eyeMode === 'ring') {
    // Hollow cyan rings ○○ (Undersøger / Afventer / Gennemgår)
    [leftEyeX, rightEyeX].forEach((ex) => {
      px(ex, eyeY - 1, 6, 8, '#00E5FF');
      px(ex - 1, eyeY, 8, 6, '#00E5FF');
      px(ex + 1, eyeY + 1, 4, 4, '#0A0A0A');
    });
  } else if (eyeMode === 'happy') {
    // Happy cyan arcs ^^ (Lille glæde / Hop)
    [leftEyeX, rightEyeX].forEach((ex) => {
      px(ex, eyeY + 2, 2, 3, '#00E5FF');
      px(ex + 1, eyeY, 5, 2, '#00E5FF');
      px(ex + 5, eyeY + 2, 2, 3, '#00E5FF');
    });
  } else if (eyeMode === 'red-ring') {
    // Blocked / Error red target rings ◉◉ (#FF1744)
    [leftEyeX, rightEyeX].forEach((ex) => {
      px(ex, eyeY - 1, 6, 8, '#FF1744');
      px(ex - 1, eyeY, 8, 6, '#FF1744');
      px(ex + 1, eyeY + 1, 4, 4, '#0A0A0A');
      px(ex + 2, eyeY + 2, 2, 2, '#FF1744');
    });
  } else if (eyeMode === 'blocks') {
    // Working cyan pixel block clusters ░░ (#00BCD4 & #00E5FF)
    [leftEyeX, rightEyeX].forEach((ex) => {
      for (let byOff = 0; byOff < 6; byOff += 2) {
        for (let bxOff = 0; bxOff < 7; bxOff += 2) {
          const active = (bxOff + byOff + col) % 4 !== 0;
          px(ex + bxOff, eyeY + byOff, 1.4, 1.4, active ? '#00E5FF' : '#00BCD4');
        }
      }
    });
  }
}

const MOOD_BACKGROUNDS: Record<EnvironmentMoodId, { top: string; bottom: string; border: string }> = {
  vaerksted: { top: '#D4845A', bottom: '#8B6343', border: '#FFB070' },
  arkiv: { top: '#1E293B', bottom: '#0F172A', border: '#00E5FF' },
  kosmos: { top: '#0A0A2E', bottom: '#050510', border: '#00BFA5' },
};

export default function OLlamaPixelCanvas({
  mode,
  animationId = 'hvile',
  studyId = 'nysgerrig',
  scaleSize = 192,
  mood = 'vaerksted',
  animateMotion = true,
  onSelectCell,
}: OLlamaPixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    if (mode === 'full-sheet') {
      // Render all 9 rows x 8 columns on a transparent checkerboard
      const cellPx = 56;
      const w = cellPx * 8;
      const h = cellPx * 9;
      canvas.width = w;
      canvas.height = h;

      // Subtle alpha checkerboard
      for (let y = 0; y < h; y += 8) {
        for (let x = 0; x < w; x += 8) {
          ctx.fillStyle = (x / 8 + y / 8) % 2 === 0 ? '#182032' : '#121826';
          ctx.fillRect(x, y, 8, 8);
        }
      }

      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 8; c++) {
          drawOLlamaPixelCell(ctx, c * cellPx, r * cellPx, cellPx, { row: r, col: c });
        }
      }
      return;
    }

    canvas.width = scaleSize;
    canvas.height = scaleSize;

    const rowMap: Record<OLlamaAnimationId, number> = {
      hvile: 0,
      'mod-hoejre': 1,
      'mod-venstre': 2,
      hilsen: 3,
      hop: 4,
      fejl: 5,
      afventer: 6,
      arbejder: 7,
      gennemgaar: 8,
    };

    const rowIdx = rowMap[animationId] ?? 0;
    let frameCol = 0;
    let timerId: ReturnType<typeof setInterval> | null = null;

    const renderSingle = (col: number) => {
      const bg = MOOD_BACKGROUNDS[mood] || MOOD_BACKGROUNDS.vaerksted;
      const grad = ctx.createLinearGradient(0, 0, 0, scaleSize);
      grad.addColorStop(0, bg.top);
      grad.addColorStop(1, bg.bottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, scaleSize, scaleSize);

      // Subtle floor table line
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.fillRect(0, Math.round(scaleSize * 0.78), scaleSize, Math.round(scaleSize * 0.22));

      drawOLlamaPixelCell(ctx, 0, 0, scaleSize, {
        row: rowIdx,
        col,
        studyOverride: mode === 'static-study' ? studyId : undefined,
      });
    };

    renderSingle(0);

    if (mode === 'animated-row' && animateMotion) {
      timerId = setInterval(() => {
        frameCol = (frameCol + 1) % 8;
        renderSingle(frameCol);
      }, 125); // 8fps canonical idle rate
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [mode, animationId, studyId, scaleSize, mood, animateMotion]);

  return (
    <canvas
      ref={canvasRef}
      onClick={(e) => {
        if (mode === 'full-sheet' && onSelectCell && canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          const col = Math.min(7, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * 8)));
          const row = Math.min(8, Math.max(0, Math.floor(((e.clientY - rect.top) / rect.height) * 9)));
          onSelectCell(row, col);
        }
      }}
      style={{
        width: mode === 'full-sheet' ? '100%' : `${scaleSize}px`,
        height: mode === 'full-sheet' ? 'auto' : `${scaleSize}px`,
        imageRendering: 'pixelated',
      }}
      className="rounded border border-slate-700/80 shadow-inner block mx-auto"
    />
  );
}
