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

type EyePattern =
  | 'filled'
  | 'ring'
  | 'blocks'
  | 'happy'
  | 'red-ring'
  | 'blink'
  | 'quiet-bars';

type LeftArmPose = 'side' | 'chest' | 'tucked' | 'rest' | 'chin' | 'up' | 'laptop';
type RightArmPose =
  | 'side'
  | 'open-invite'
  | 'tucked'
  | 'rest'
  | 'wave'
  | 'wave-high'
  | 'up'
  | 'laptop';

/**
 * Draws the authentic 64x64 3/4-perspective metallic pixel-art representation of o-Llama Axiom-7
 * matching the 14 canonical o-Llama-Axiom poses and the 9x8 pet spritesheet.
 */
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
  const u = cellSize / 64; // 64x64 high-detail pixel grid
  const px = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.round(ox + x * u),
      Math.round(oy + y * u),
      Math.max(1, Math.round(w * u)),
      Math.max(1, Math.round(h * u))
    );
  };

  // Helper to draw a black-outlined pixel box with interior fill
  const outlinedBox = (
    x: number,
    y: number,
    w: number,
    h: number,
    fill: string,
    outline = '#05070B'
  ) => {
    px(x, y, w, h, outline);
    if (w > 2 && h > 2) {
      px(x + 1, y + 1, w - 2, h - 2, fill);
    }
  };

  const { row, col, studyOverride } = params;

  let headTiltY = 0;
  let headShiftX = 0;
  let eyeOffsetX = 0;
  let eyeOffsetY = 0;
  let bodyBounceY = 0;
  let eyeMode: EyePattern = 'filled';
  let leftArm: LeftArmPose = 'side';
  let rightArm: RightArmPose = 'side';
  let showLaptop = false;
  let flipPerspectiveLeft = false;
  const treadPhase = col % 2;

  if (studyOverride) {
    switch (studyOverride) {
      case 'nysgerrig': // 01: o-Llama-Axiom-01-Nysgerrig.png
        eyeMode = 'filled';
        headTiltY = 1;
        leftArm = 'chest';
        rightArm = 'side';
        break;
      case 'afventer-dig': // 02: o-Llama-Axiom-02-Afventer-input.png
        eyeMode = 'ring';
        headTiltY = 0;
        leftArm = 'side';
        rightArm = 'open-invite';
        break;
      case 'gennemgaar': // 03: o-Llama-Axiom-03-Gennemgaar.png
        eyeMode = 'ring';
        headTiltY = 1;
        eyeOffsetY = 1;
        leftArm = 'tucked';
        rightArm = 'tucked';
        break;
      case 'arbejder': // 04: o-Llama-Axiom-04-Arbejder.png
        eyeMode = 'blocks';
        leftArm = 'rest';
        rightArm = 'rest';
        break;
      case 'lille-glaede': // 05: o-Llama-Axiom-05-Lille-glaede.png
        eyeMode = 'happy';
        leftArm = 'side';
        rightArm = 'wave';
        break;
      case 'blokeret': // 06: o-Llama-Axiom-06-Blokeret.png
        eyeMode = 'red-ring';
        leftArm = 'side';
        rightArm = 'side';
        break;
      case 'blik-venstre': // 07: o-Llama-Axiom-07-Blik-venstre.png
        eyeMode = 'filled';
        headShiftX = -2;
        eyeOffsetX = -3;
        flipPerspectiveLeft = true;
        leftArm = 'side';
        rightArm = 'side';
        break;
      case 'blik-hoejre': // 08: o-Llama-Axiom-08-Blik-hoejre.png
        eyeMode = 'filled';
        headShiftX = 1;
        eyeOffsetX = 2;
        leftArm = 'side';
        rightArm = 'side';
        break;
      case 'blik-opad': // 09: o-Llama-Axiom-09-Blik-opad.png
        eyeMode = 'filled';
        headTiltY = -1;
        eyeOffsetY = -2;
        leftArm = 'side';
        rightArm = 'side';
        break;
      case 'blink': // 10: o-Llama-Axiom-10-Blink.png
        eyeMode = 'blink';
        leftArm = 'side';
        rightArm = 'side';
        break;
      case 'stille': // 11: o-Llama-Axiom-11-Stille-vaagen.png
        eyeMode = 'quiet-bars';
        leftArm = 'rest';
        rightArm = 'rest';
        break;
      case 'hilsen': // 12: o-Llama-Axiom-12-Hilsen.png
        eyeMode = 'filled';
        headTiltY = 0;
        leftArm = 'side';
        rightArm = 'wave-high';
        break;
      case 'undersoeger': // 13: o-Llama-Axiom-13-Undersoeger.png
        eyeMode = 'ring';
        headTiltY = 1;
        leftArm = 'chin';
        rightArm = 'rest';
        break;
      case 'afdaempet-glaede': // 14: o-Llama-Axiom-14-Afdaempet-glaede.png
        eyeMode = 'happy';
        leftArm = 'rest';
        rightArm = 'rest';
        break;
    }
  } else {
    // Canonical 9-row x 8-column o-Llama spritesheet (pet_6a9caa81a898819184d4992db7e8b566-spritesheet.png)
    if (row === 0) {
      // Row 1: Hvile (Idle with blinks on col 1, 3, 6)
      eyeMode = col === 1 || col === 3 || col === 6 ? 'blink' : 'filled';
      headShiftX = col === 2 ? -1 : col === 5 ? 1 : 0;
      headTiltY = col % 2 === 0 ? 0 : 1;
    } else if (row === 1) {
      // Row 2: Mod højre
      eyeMode = 'filled';
      headShiftX = -1;
      eyeOffsetX = -2;
      flipPerspectiveLeft = true;
      bodyBounceY = col % 2 === 0 ? 0 : -1;
      leftArm = 'open-invite' as unknown as LeftArmPose;
      rightArm = 'side';
    } else if (row === 2) {
      // Row 3: Mod venstre
      eyeMode = 'filled';
      headShiftX = 1;
      eyeOffsetX = 2;
      bodyBounceY = col % 2 === 0 ? 0 : -1;
      leftArm = 'side';
      rightArm = 'open-invite';
    } else if (row === 3) {
      // Row 4: Hilsen
      eyeMode = 'filled';
      rightArm = col % 2 === 0 ? 'wave-high' : 'wave';
      headTiltY = col % 2 === 0 ? 0 : 1;
    } else if (row === 4) {
      // Row 5: Hop (Happy ^^ + raised arms)
      eyeMode = 'happy';
      bodyBounceY = col >= 1 && col <= 5 ? -3 : 0;
      leftArm = col >= 1 && col <= 6 ? 'up' : 'side';
      rightArm = col >= 1 && col <= 6 ? 'up' : 'side';
    } else if (row === 5) {
      // Row 6: Fejl (Red target rings cols 0..5, recovers to cyan cols 6..7)
      eyeMode = col <= 5 ? 'red-ring' : 'filled';
      headShiftX = col <= 5 ? (col % 2 === 0 ? -1 : 1) : 0;
      headTiltY = col <= 5 && col % 2 === 1 ? 1 : 0;
    } else if (row === 6) {
      // Row 7: Afventer (Hollow rings + hand to chin)
      eyeMode = 'ring';
      leftArm = col < 5 ? 'chin' : 'side';
      rightArm = col >= 3 && col < 6 ? 'tucked' : 'side';
      headTiltY = col % 2 === 0 ? 0 : 1;
    } else if (row === 7) {
      // Row 8: Arbejder (3x3 pixel blocks + open dark laptop)
      eyeMode = 'blocks';
      leftArm = 'laptop';
      rightArm = 'laptop';
      showLaptop = true;
    } else if (row === 8) {
      // Row 9: Gennemgår / Celebration (Happy ^^ + waving arms)
      eyeMode = 'happy';
      bodyBounceY = col >= 2 && col <= 5 ? -2 : 0;
      leftArm = col % 2 === 0 ? 'up' : 'tucked';
      rightArm = 'wave-high';
    }
  }

  const by = bodyBounceY;
  const hx = headShiftX;
  const hy = by + headTiltY;

  // ==========================================================================
  // 1. CATERPILLAR TANK TREADS (Larvebånd med 2 synlige sidehjul og stålplader)
  // ==========================================================================
  // Left Tread (x=13..31, y=44..58)
  px(13, 45 + by, 18, 13, '#05070B');
  px(14, 44 + by, 16, 15, '#05070B');
  // Left Tread Side Wall (2 Road Wheels (O)(O) inside track loop)
  px(14, 46 + by, 9, 11, '#263238');
  // Wheel 1 (rear-left)
  px(15, 48 + by, 4, 7, '#05070B');
  px(16, 49 + by, 2, 5, '#546E7A');
  px(16, 51 + by, 1, 2, '#10161C');
  // Wheel 2 (front-left)
  px(19, 48 + by, 4, 7, '#05070B');
  px(20, 49 + by, 2, 5, '#78909C');
  px(20, 51 + by, 1, 2, '#10161C');

  // Left Tread Front Metallic Plates (x=23..29, y=45..57)
  px(23, 45 + by, 7, 13, '#455A64');
  for (let ty = 46; ty <= 56; ty += 2) {
    const isLight = ((ty + treadPhase * 2) / 2) % 2 === 0;
    px(23, ty + by, 6, 1, isLight ? '#78909C' : '#37474F');
    px(27, ty + by, 2, 1, isLight ? '#ECEFF1' : '#90A4AE');
  }

  // Central Undercarriage Block between treads (x=30..36, y=45..54)
  outlinedBox(30, 45 + by, 6, 9, '#263238');
  px(31, 46 + by, 4, 4, '#37474F');

  // Right Tread (x=35..51, y=44..58)
  px(35, 45 + by, 16, 13, '#05070B');
  px(36, 44 + by, 14, 15, '#05070B');
  // Inner wheel shadow on right tread
  px(36, 46 + by, 5, 11, '#263238');
  px(37, 48 + by, 3, 7, '#05070B');
  px(38, 49 + by, 2, 5, '#546E7A');
  // Right Tread Front Metallic Plates (x=41..49, y=45..57)
  px(41, 45 + by, 8, 13, '#455A64');
  for (let ty = 46; ty <= 56; ty += 2) {
    const isLight = ((ty + treadPhase * 2) / 2) % 2 === 0;
    px(41, ty + by, 7, 1, isLight ? '#78909C' : '#37474F');
    px(46, ty + by, 2, 1, isLight ? '#ECEFF1' : '#90A4AE');
  }

  // ==========================================================================
  // 2. TORSO / CHEST BOX (3/4 Metallic Chassis + Yellow Plus + 3 Stacked LEDs)
  // ==========================================================================
  // Outer black torso box
  px(21, 30 + by, 23, 16, '#05070B');
  // Left 3/4 depth side panel (x=22..25)
  px(22, 31 + by, 4, 14, '#37474F');
  px(22, 31 + by, 4, 2, '#90A4AE');
  // Front torso panel (x=25..42)
  px(25, 31 + by, 18, 14, '#455A64');
  // Top metallic specular edge on chest
  px(25, 31 + by, 18, 2, '#CFD8DC');
  px(25, 32 + by, 18, 1, '#78909C');

  // Signature Yellow Cross (+) Button on Left Chest (x=26..33, y=33..40)
  // Black outline of cross
  px(28, 33 + by, 4, 8, '#05070B');
  px(26, 35 + by, 8, 4, '#05070B');
  // Yellow fill (#FFD600) with top highlight (#FFF59D) and bottom bevel (#F57F17)
  px(29, 34 + by, 2, 6, '#FFD600');
  px(27, 36 + by, 6, 2, '#FFD600');
  px(29, 34 + by, 2, 1, '#FFF59D');
  px(27, 36 + by, 2, 1, '#FFF59D');
  px(29, 39 + by, 2, 1, '#F57F17');

  // Horizontal Recessed Dark Slot directly under Yellow Cross (x=28..33, y=42..44)
  px(28, 42 + by, 5, 2, '#05070B');
  px(29, 42 + by, 3, 1, '#1C262B');
  px(28, 44 + by, 5, 1, '#78909C');

  // Right Chest Recessed Vertical Control Panel (x=35..42, y=33..44)
  px(35, 33 + by, 7, 11, '#1C262B');
  px(36, 34 + by, 5, 9, '#263238');
  px(41, 34 + by, 1, 10, '#90A4AE'); // Right metallic bevel

  // Top LED: Large Glowing Green LED (#00E676 / #00C853)
  px(37, 34 + by, 4, 4, '#05070B');
  px(37, 34 + by, 3, 3, '#00C853');
  px(38, 35 + by, 2, 2, '#00E676');
  px(38, 35 + by, 1, 1, '#FFFFFF'); // Specular dot

  // Middle LED: Medium Yellow LED (#FFD600)
  px(37, 38 + by, 3, 3, '#05070B');
  px(37, 38 + by, 2, 2, '#FFD600');
  px(37, 38 + by, 1, 1, '#FFF9C4');

  // Bottom LED: Red Indicator Button (#FF1744)
  px(37, 41 + by, 4, 3, '#05070B');
  px(37, 41 + by, 3, 2, '#FF1744');
  px(38, 41 + by, 1, 1, '#FFCDD2');

  // ==========================================================================
  // 3. SEGMENTED METALLIC NECK JOINT (x=29..37, y=26..31)
  // ==========================================================================
  px(29, 26 + by, 8, 5, '#05070B');
  px(30, 27 + by, 6, 3, '#455A64');
  px(32, 27 + by, 2, 3, '#78909C');
  px(34, 27 + by, 1, 3, '#ECEFF1'); // Cylindrical metallic highlight
  px(30, 28 + by, 6, 1, '#1C262B'); // Neck segment groove

  // ==========================================================================
  // 4. ARTICULATED BALL-SHOULDER ARMS & C-SHAPED PINCER CLAWS
  // ==========================================================================
  // Left Shoulder Ball Joint (x=17..22, y=31..36)
  outlinedBox(17, 31 + by, 5, 5, '#546E7A');
  px(18, 32 + by, 2, 2, '#CFD8DC');

  // Right Shoulder Ball Joint (x=42..47, y=31..36)
  outlinedBox(42, 31 + by, 5, 5, '#546E7A');
  px(44, 32 + by, 2, 2, '#CFD8DC');

  // Helper to draw a curved 2-prong C-claw + segmented arm
  // Viewer's Left Arm
  if (leftArm === 'chest') {
    // 01 Nysgerrig: Left arm bent inward toward the yellow cross (+)
    outlinedBox(16, 35 + by, 5, 6, '#607D8B');
    px(17, 36 + by, 2, 2, '#ECEFF1');
    outlinedBox(19, 33 + by, 6, 5, '#78909C');
    // C-Claw near chest
    outlinedBox(22, 31 + by, 5, 3, '#CFD8DC');
    outlinedBox(22, 35 + by, 5, 3, '#90A4AE');
  } else if (leftArm === 'chin') {
    // 13 Undersøger: Left arm raised thoughtfully to the lower bezel / chin
    outlinedBox(16, 31 + by, 5, 7, '#607D8B');
    outlinedBox(18, 26 + by, 5, 6, '#78909C');
    px(19, 27 + by, 2, 3, '#ECEFF1');
    // C-Claw at chin (y=22..27)
    outlinedBox(21, 22 + by, 6, 5, '#90A4AE');
    px(23, 23 + by, 2, 3, '#05070B'); // Claw opening
    px(22, 23 + by, 1, 2, '#FFFFFF');
  } else if (leftArm === 'tucked') {
    // 03 Gennemgår: Left arm bent inward in front of lower torso
    outlinedBox(16, 35 + by, 5, 6, '#607D8B');
    outlinedBox(19, 38 + by, 6, 5, '#78909C');
    px(20, 39 + by, 2, 2, '#ECEFF1');
    // C-Claw facing right in front of body
    outlinedBox(24, 38 + by, 6, 6, '#CFD8DC');
    px(27, 40 + by, 3, 2, '#1C262B');
  } else if (leftArm === 'rest' || leftArm === 'laptop') {
    // 04 Arbejder / 11 Stille / 14 Afdæmpet glæde: Resting calmly atop left tread
    outlinedBox(16, 35 + by, 5, 6, '#607D8B');
    outlinedBox(18, 39 + by, 6, 5, '#78909C');
    px(19, 40 + by, 2, 2, '#ECEFF1');
    outlinedBox(21, 41 + by, 6, 6, '#90A4AE');
    px(23, 43 + by, 2, 3, '#10161C');
  } else if (leftArm === 'up') {
    // Hop / Celebration: Left arm raised up
    outlinedBox(14, 28 + by, 5, 6, '#78909C');
    outlinedBox(12, 24 + by, 6, 5, '#CFD8DC');
    px(13, 24 + by, 2, 2, '#05070B');
  } else {
    // 'side': Relaxed angled out at left side with downward C-claw
    outlinedBox(15, 35 + by, 5, 6, '#607D8B');
    px(16, 36 + by, 2, 3, '#ECEFF1');
    outlinedBox(13, 39 + by, 6, 6, '#78909C');
    // Downward C-claw (x=12..18, y=42..47)
    outlinedBox(12, 42 + by, 6, 6, '#90A4AE');
    px(14, 44 + by, 2, 4, '#05070B');
  }

  // Viewer's Right Arm
  if (rightArm === 'open-invite') {
    // 02 Afventer input: Right arm extended outward to the right with open C-claw
    outlinedBox(45, 35 + by, 6, 5, '#607D8B');
    px(46, 36 + by, 3, 2, '#ECEFF1');
    // Large open C-claw inviting input (x=49..56, y=32..41)
    outlinedBox(49, 32 + by, 7, 3, '#CFD8DC'); // Upper prong
    outlinedBox(49, 38 + by, 7, 3, '#90A4AE'); // Lower prong
    outlinedBox(48, 34 + by, 3, 5, '#78909C'); // Palm joint
  } else if (rightArm === 'tucked') {
    // 03 Gennemgår: Right arm tucked in front of torso facing left claw
    outlinedBox(44, 35 + by, 5, 6, '#607D8B');
    outlinedBox(40, 38 + by, 6, 5, '#78909C');
    px(42, 39 + by, 2, 2, '#ECEFF1');
    outlinedBox(34, 38 + by, 7, 6, '#CFD8DC');
    px(34, 40 + by, 3, 2, '#1C262B');
  } else if (rightArm === 'rest' || rightArm === 'laptop') {
    // 04 Arbejder / 11 Stille / 13 Undersøger / 14 Afdæmpet glæde: Resting on right tread
    outlinedBox(44, 35 + by, 5, 6, '#607D8B');
    outlinedBox(42, 39 + by, 6, 5, '#78909C');
    px(44, 40 + by, 2, 2, '#ECEFF1');
    outlinedBox(39, 41 + by, 6, 6, '#90A4AE');
    px(40, 43 + by, 2, 3, '#10161C');
  } else if (rightArm === 'wave' || rightArm === 'wave-high' || rightArm === 'up') {
    // 05 Lille glæde / 12 Hilsen: Right arm raised waving with open C-claw
    const highOffset = rightArm === 'wave-high' ? -2 : 0;
    outlinedBox(45, 31 + by + highOffset, 6, 6, '#607D8B');
    px(47, 32 + by + highOffset, 2, 3, '#ECEFF1');
    // Raised C-claw (x=47..55, y=24..32)
    outlinedBox(47, 25 + by + highOffset, 4, 7, '#CFD8DC');
    outlinedBox(51, 26 + by + highOffset, 4, 6, '#90A4AE');
    px(49, 26 + by + highOffset, 3, 3, '#05070B'); // Open C-gap
  } else {
    // 'side': Relaxed angled out at right side with downward C-claw
    outlinedBox(45, 35 + by, 5, 6, '#607D8B');
    px(47, 36 + by, 2, 3, '#ECEFF1');
    outlinedBox(47, 39 + by, 6, 6, '#78909C');
    outlinedBox(48, 42 + by, 6, 6, '#90A4AE');
    px(50, 44 + by, 2, 4, '#05070B');
  }

  // Deployable Open Mini-Laptop in Spritesheet Row 8 ('arbejder' animation)
  if (showLaptop) {
    outlinedBox(23, 38 + by, 20, 10, '#263238');
    px(24, 39 + by, 18, 8, '#37474F');
    px(24, 39 + by, 18, 1, '#90A4AE'); // Laptop screen top edge
    px(32, 42 + by, 2, 2, '#ECEFF1'); // Tiny white laptop lid emblem
  }

  // ==========================================================================
  // 5. 3/4 ROUNDED MONITOR HEAD + EAR HUBS + TOP RED SENSOR DOME
  // ==========================================================================
  // Left Circular Ear-Joint Hub (x=11..16, y=15..22)
  outlinedBox(11 + hx, 15 + hy, 5, 7, '#546E7A');
  px(12 + hx, 16 + hy, 3, 5, '#263238');
  px(14 + hx, 15 + hy, 2, 2, '#ECEFF1');

  // Right Circular Ear-Joint Hub (x=50..54, y=14..21)
  outlinedBox(50 + hx, 14 + hy, 4, 7, '#78909C');
  px(51 + hx, 15 + hy, 2, 2, '#ECEFF1');

  // Top Red Sensor Dome (x=26..38, y=5..9)
  outlinedBox(26 + hx, 5 + hy, 12, 4, '#D50000');
  px(28 + hx, 6 + hy, 8, 2, '#FF1744');
  px(29 + hx, 6 + hy, 3, 1, '#FFCDD2'); // Pink-white specular highlight on red dome

  // Main Head Housing (x=14..51, y=8..27) with rounded pixel corners
  px(15 + hx, 8 + hy, 35, 19, '#05070B');
  px(14 + hx, 9 + hy, 37, 17, '#05070B');

  // 3/4 Extruded Side Depth of Head (Left side x=15..20 unless flipped)
  if (!flipPerspectiveLeft) {
    px(15 + hx, 9 + hy, 5, 17, '#455A64');
    px(16 + hx, 9 + hy, 4, 3, '#ECEFF1'); // Bright silver top-left bevel
    px(16 + hx, 12 + hy, 4, 10, '#607D8B');
    px(16 + hx, 22 + hy, 4, 4, '#37474F');
    px(18 + hx, 24 + hy, 1, 1, '#10161C'); // Side rivet dot
    // Front Metallic Bezel (x=20..49, y=9..26)
    px(20 + hx, 9 + hy, 30, 17, '#607D8B');
    px(20 + hx, 9 + hy, 30, 2, '#CFD8DC'); // Top metallic highlight
    px(20 + hx, 9 + hy, 2, 17, '#CFD8DC'); // Left front bezel highlight
    px(20 + hx, 25 + hy, 30, 1, '#37474F'); // Bottom bezel shadow
  } else {
    // 07 Blik venstre: 3/4 depth on the right side
    px(45 + hx, 9 + hy, 5, 17, '#455A64');
    px(45 + hx, 9 + hy, 4, 3, '#ECEFF1');
    px(15 + hx, 9 + hy, 30, 17, '#607D8B');
    px(15 + hx, 9 + hy, 30, 2, '#CFD8DC');
  }

  // Deep Pitch-Black Rounded CRT Screen
  const scrX = (flipPerspectiveLeft ? 18 : 22) + hx;
  const scrY = 11 + hy;
  px(scrX, scrY, 26, 13, '#040609');
  // Rounded inner bezel corners
  px(scrX, scrY, 1, 1, '#37474F');
  px(scrX + 25, scrY, 1, 1, '#37474F');
  px(scrX, scrY + 12, 1, 1, '#37474F');
  px(scrX + 25, scrY + 12, 1, 1, '#37474F');

  // ==========================================================================
  // 6. RASTERIZED PIXEL EYE EXPRESSIONS ON SCREEN
  // ==========================================================================
  const leftEyeX = scrX + 3 + eyeOffsetX;
  const rightEyeX = scrX + 15 + eyeOffsetX;
  const eyeY = scrY + 3 + eyeOffsetY;

  if (eyeMode === 'filled') {
    // Crisp rasterized 8x7 cyan pixel circles ●● (#00F0FF)
    [leftEyeX, rightEyeX].forEach((ex) => {
      px(ex + 2, eyeY, 4, 1, '#00F0FF');
      px(ex + 1, eyeY + 1, 6, 1, '#00F0FF');
      px(ex, eyeY + 2, 8, 3, '#00F0FF');
      px(ex + 1, eyeY + 5, 6, 1, '#00F0FF');
      px(ex + 2, eyeY + 6, 4, 1, '#00F0FF');
    });
  } else if (eyeMode === 'ring') {
    // Crisp rasterized hollow cyan pixel rings ○○ (#00F0FF)
    [leftEyeX, rightEyeX].forEach((ex) => {
      px(ex + 2, eyeY, 4, 1, '#00F0FF');
      px(ex + 1, eyeY + 1, 6, 1, '#00F0FF');
      px(ex, eyeY + 2, 8, 3, '#00F0FF');
      px(ex + 1, eyeY + 5, 6, 1, '#00F0FF');
      px(ex + 2, eyeY + 6, 4, 1, '#00F0FF');
      // Hollow black core
      px(ex + 2, eyeY + 2, 4, 3, '#040609');
      px(ex + 3, eyeY + 1, 2, 5, '#040609');
    });
  } else if (eyeMode === 'blocks') {
    // 04 Arbejder: Two 3x3 cyan pixel block matrices (### ###)
    [leftEyeX, rightEyeX].forEach((ex) => {
      for (let rIdx = 0; rIdx < 3; rIdx++) {
        for (let cIdx = 0; cIdx < 3; cIdx++) {
          px(ex + cIdx * 3, eyeY + rIdx * 2.5, 2, 2, '#00F0FF');
        }
      }
    });
  } else if (eyeMode === 'happy') {
    // 05 Lille glæde / 14 Afdæmpet glæde / Hop: Happy cyan pixel arches ^^
    [leftEyeX, rightEyeX].forEach((ex) => {
      px(ex + 2, eyeY + 1, 4, 2, '#00F0FF');
      px(ex + 1, eyeY + 2, 2, 2, '#00F0FF');
      px(ex + 5, eyeY + 2, 2, 2, '#00F0FF');
      px(ex, eyeY + 3, 2, 3, '#00F0FF');
      px(ex + 6, eyeY + 3, 2, 3, '#00F0FF');
    });
  } else if (eyeMode === 'red-ring') {
    // 06 Blokeret / Fejl: Red pixel target rings with 2x2 center square ◉◉ (#FF1744)
    [leftEyeX, rightEyeX].forEach((ex) => {
      px(ex + 2, eyeY, 4, 1, '#FF1744');
      px(ex + 1, eyeY + 1, 6, 1, '#FF1744');
      px(ex, eyeY + 2, 8, 3, '#FF1744');
      px(ex + 1, eyeY + 5, 6, 1, '#FF1744');
      px(ex + 2, eyeY + 6, 4, 1, '#FF1744');
      // Black ring space
      px(ex + 1, eyeY + 2, 6, 3, '#040609');
      px(ex + 2, eyeY + 1, 4, 5, '#040609');
      // Solid 2x2 Red Target Center Dot
      px(ex + 3, eyeY + 2.5, 2, 2, '#FF1744');
    });
  } else if (eyeMode === 'blink') {
    // 10 Blink: Thin 1.5px horizontal cyan lines — —
    [leftEyeX, rightEyeX].forEach((ex) => {
      px(ex, eyeY + 3, 8, 1.5, '#00F0FF');
    });
  } else if (eyeMode === 'quiet-bars') {
    // 11 Stille · vågen: Thicker 3.5px rounded horizontal cyan bars ▬ ▬
    [leftEyeX, rightEyeX].forEach((ex) => {
      px(ex + 1, eyeY + 2, 7, 3, '#00F0FF');
      px(ex, eyeY + 2.5, 9, 2, '#00F0FF');
    });
  }
}

const MOOD_BACKGROUNDS: Record<
  EnvironmentMoodId,
  { top: string; bottom: string; border: string; isLight?: boolean }
> = {
  studio: { top: '#FFFFFF', bottom: '#F1F5F9', border: '#94A3B8', isLight: true },
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
      // Render all 9 rows x 8 columns on a crisp alpha checkerboard (matching Image 2: 07b3815d-d178-41f7-865b-fcd551afde4b.png)
      const cellPx = 64;
      const w = cellPx * 8;
      const h = cellPx * 9;
      canvas.width = w;
      canvas.height = h;

      for (let y = 0; y < h; y += 8) {
        for (let x = 0; x < w; x += 8) {
          ctx.fillStyle = (x / 8 + y / 8) % 2 === 0 ? '#EAECEF' : '#CFD6DF';
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

      if (!bg.isLight) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.fillRect(0, Math.round(scaleSize * 0.82), scaleSize, Math.round(scaleSize * 0.18));
      }

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
      }, 125); // 8fps canonical stepped rate
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
          const col = Math.min(
            7,
            Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * 8))
          );
          const row = Math.min(
            8,
            Math.max(0, Math.floor(((e.clientY - rect.top) / rect.height) * 9))
          );
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
