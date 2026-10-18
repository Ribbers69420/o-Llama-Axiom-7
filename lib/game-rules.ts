// Pure Game Rules, Canonical Lore Specifications, Hitboxes, and Truth Analyzer Logic
// Self-contained TypeScript module for both Next.js runtime and node:test verification

export type GameStatus = 'title' | 'playing' | 'paused' | 'victory' | 'gameover';
export type ChassisType = 'tank' | 'wizard' | 'cosmic';
export type ExpressionId =
  | 'EX-01'
  | 'EX-02'
  | 'EX-03'
  | 'EX-04'
  | 'EX-05'
  | 'EX-06'
  | 'EX-07'
  | 'EX-08';

export type PillarName = 'FACTS' | 'EVIDENCE' | 'DATA' | 'REALITY';

export interface ExpressionSpec {
  id: ExpressionId;
  name: string;
  shape: string;
  color: string;
  glowColor: string;
  trigger: string;
  gameplayBonus: string;
}

export const EXPRESSIONS: Record<ExpressionId, ExpressionSpec> = {
  'EX-01': {
    id: 'EX-01',
    name: 'CURIOUS',
    shape: '●●',
    color: '#00E5FF',
    glowColor: '#00BCD4',
    trigger: 'New input',
    gameplayBonus: '+15% Anomaly Pickup Radius',
  },
  'EX-02': {
    id: 'EX-02',
    name: 'FOCUSED',
    shape: '○○',
    color: '#00E5FF',
    glowColor: '#00BCD4',
    trigger: 'Analyzing',
    gameplayBonus: '+25% Scan Pulse Range & Crit',
  },
  'EX-03': {
    id: 'EX-03',
    name: 'WISE',
    shape: '🌕🌕',
    color: '#FFB300',
    glowColor: '#FF8F00',
    trigger: 'Knowledge mode',
    gameplayBonus: 'Reflects Fallacy Orbs & +20% Score',
  },
  'EX-04': {
    id: 'EX-04',
    name: 'COSMIC',
    shape: '🌀',
    color: '#00BFA5',
    glowColor: '#FFD700',
    trigger: 'Transcendence',
    gameplayBonus: 'Omniscient Piercing Resonance',
  },
  'EX-05': {
    id: 'EX-05',
    name: 'ALERT',
    shape: '◉◉',
    color: '#FF1744',
    glowColor: '#FF1744',
    trigger: 'Threat detected',
    gameplayBonus: 'Reveals Enemy Telegraph Vectors',
  },
  'EX-06': {
    id: 'EX-06',
    name: 'HAPPY',
    shape: '^^',
    color: '#00E5FF',
    glowColor: '#00C853',
    trigger: 'Truth confirmed',
    gameplayBonus: 'Restores Vitality Overdrive',
  },
  'EX-07': {
    id: 'EX-07',
    name: 'PROCESSING',
    shape: '░░',
    color: '#00BCD4',
    glowColor: '#00E5FF',
    trigger: 'Loading',
    gameplayBonus: '-25% Ability Cooldown Recovery',
  },
  'EX-08': {
    id: 'EX-08',
    name: 'SLEEPING',
    shape: '--',
    color: '#1A1A2E',
    glowColor: '#2D2D2D',
    trigger: 'Idle / standby',
    gameplayBonus: 'Low-Profile Stealth Shielding',
  },
};

export const EXPRESSION_LIST: ExpressionSpec[] = Object.values(EXPRESSIONS);

export interface ChassisSpec {
  id: ChassisType;
  versionLabel: string;
  name: string;
  heightUnits: number;
  speed: number;
  pulseRadius: number;
  pulseCooldown: number;
  pulseDamage: number;
  defaultExpression: ExpressionId;
  roleDescription: string;
}

export const CHASSIS_SPECS: Record<ChassisType, ChassisSpec> = {
  tank: {
    id: 'tank',
    versionLabel: 'Version A',
    name: 'Tank Chassis',
    heightUnits: 10,
    speed: 11.5,
    pulseRadius: 6.2,
    pulseCooldown: 0.48,
    pulseDamage: 35,
    defaultExpression: 'EX-01',
    roleDescription: 'Wide-Arc Acoustic Truth Pulse · Dual 8-Segment Treads',
  },
  wizard: {
    id: 'wizard',
    versionLabel: 'Version B',
    name: 'Monitor Wizard',
    heightUnits: 9,
    speed: 12.8,
    pulseRadius: 7.4,
    pulseCooldown: 0.42,
    pulseDamage: 42,
    defaultExpression: 'EX-03',
    roleDescription: 'Magnifying Lens Reflector · Arcane Tome Verification',
  },
  cosmic: {
    id: 'cosmic',
    versionLabel: 'Version C',
    name: 'Ultimate Being',
    heightUnits: 9.5,
    speed: 14.2,
    pulseRadius: 8.8,
    pulseCooldown: 0.36,
    pulseDamage: 55,
    defaultExpression: 'EX-04',
    roleDescription: '7-Ring Rainbow Spiral Beam · Cosmic Grid Levitation',
  },
};

export interface ChapterSceneSpec {
  index: number;
  sceneIds: string[];
  chapterLabel: string;
  title: string;
  subtitle: string;
  location: string;
  mood: string;
  recommendedChassis: ChassisType;
  defaultExpression: ExpressionId;
  skyColor: string;
  fogColor: string;
  floorColor: string;
  gridColor: string;
  accentColor: string;
  keyLightColor: string;
  hemiSkyColor: string;
  hemiGroundColor: string;
  targetTomes: number;
  targetPurges: number;
  claims: {
    id: string;
    statement: string;
    sourceContext: string;
    expectedVerdict: 'TRUE' | 'FALSE';
    pillarFocus: PillarName;
  }[];
}

export const CHAPTER_SCENES: ChapterSceneSpec[] = [
  {
    index: 0,
    sceneIds: ['1854', '1856'],
    chapterLabel: 'Chapter 1',
    title: 'Awakening & Alert Lab',
    subtitle: 'Warm Laboratory · Wooden Table (ID: 1854 / 1856)',
    location: 'Warm Laboratory, Wooden Table',
    mood: 'Curious, Warm, Analytical',
    recommendedChassis: 'tank',
    defaultExpression: 'EX-01',
    skyColor: '#D4845A',
    fogColor: '#C47040',
    floorColor: '#8B6343',
    gridColor: '#6B4423',
    accentColor: '#00E5FF',
    keyLightColor: '#FFB070',
    hemiSkyColor: '#FFD6A0',
    hemiGroundColor: '#6B4423',
    targetTomes: 3,
    targetPurges: 4,
    claims: [
      {
        id: 'c1-1',
        statement: 'AXIOM-7 awakened in 2087 inside a forgotten server room beneath a pixel-lit city to distinguish truth from fiction.',
        sourceContext: 'Origin Log #1854 — Server Room Boot Sequence',
        expectedVerdict: 'TRUE',
        pillarFocus: 'FACTS',
      },
      {
        id: 'c1-2',
        statement: 'In Alert Mode (Scene 1856), AXIOM-7 shuts down its optical sensors and relies solely on acoustic sonar.',
        sourceContext: 'Corrupted Sensor Packet #09',
        expectedVerdict: 'FALSE',
        pillarFocus: 'EVIDENCE',
      },
    ],
  },
  {
    index: 1,
    sceneIds: ['1866'],
    chapterLabel: 'Chapter 2',
    title: 'Deep Space Research Station',
    subtitle: 'Library of Truth · Four Pillars (ID: 1866)',
    location: 'Deep Space Research Station',
    mood: 'Scientific, Analytical, Trustworthy',
    recommendedChassis: 'wizard',
    defaultExpression: 'EX-02',
    skyColor: '#0A0A2E',
    fogColor: '#050515',
    floorColor: '#10163A',
    gridColor: '#00E5FF',
    accentColor: '#00E5FF',
    keyLightColor: '#E0F7FA',
    hemiSkyColor: '#00E5FF',
    hemiGroundColor: '#050515',
    targetTomes: 4,
    targetPurges: 5,
    claims: [
      {
        id: 'c2-1',
        statement: 'Every claim in the Space Library is cross-referenced against four foundational pillars: FACTS, EVIDENCE, DATA, and REALITY.',
        sourceContext: 'Research Station Protocol #1866',
        expectedVerdict: 'TRUE',
        pillarFocus: 'DATA',
      },
      {
        id: 'c2-2',
        statement: 'A single unverified rumor with high viral velocity automatically receives the green TRUE stamp if shared 10,000 times.',
        sourceContext: 'Intercepted Echo-Chamber Transmission',
        expectedVerdict: 'FALSE',
        pillarFocus: 'REALITY',
      },
    ],
  },
  {
    index: 2,
    sceneIds: ['1952'],
    chapterLabel: 'Chapter 3',
    title: 'Enchanted Library Dimension',
    subtitle: 'Wizard Knowledge Mode · Floating Islands (ID: 1952)',
    location: 'Enchanted Library Dimension',
    mood: 'Magical, Wise, Whimsical',
    recommendedChassis: 'wizard',
    defaultExpression: 'EX-03',
    skyColor: '#1A0A3C',
    fogColor: '#0A0520',
    floorColor: '#240E4E',
    gridColor: '#FFD600',
    accentColor: '#FFB300',
    keyLightColor: '#FFD54F',
    hemiSkyColor: '#9C27B0',
    hemiGroundColor: '#120524',
    targetTomes: 4,
    targetPurges: 6,
    claims: [
      {
        id: 'c3-1',
        statement: 'Magic is science not yet understood; ancient lore and spells intersect with empirical reality to reveal deeper truth.',
        sourceContext: 'Enchanted Tome #1952 — Gold Buckle Archive',
        expectedVerdict: 'TRUE',
        pillarFocus: 'REALITY',
      },
      {
        id: 'c3-2',
        statement: 'The Enchanted Library forbids any quantitative data charts or constellation verification displays within its realm.',
        sourceContext: 'Whispering Imp Fallacy',
        expectedVerdict: 'FALSE',
        pillarFocus: 'EVIDENCE',
      },
    ],
  },
  {
    index: 3,
    sceneIds: ['1852'],
    chapterLabel: 'Chapter 4',
    title: 'Central Command HUD Station',
    subtitle: 'Strategic Intelligence Hub (ID: 1852)',
    location: 'Central Command HUD Station',
    mood: 'Strategic, Calculating',
    recommendedChassis: 'tank',
    defaultExpression: 'EX-02',
    skyColor: '#0D1B4B',
    fogColor: '#060D26',
    floorColor: '#0B163B',
    gridColor: '#1A3A6B',
    accentColor: '#FF6B35',
    keyLightColor: '#80D8FF',
    hemiSkyColor: '#00E5FF',
    hemiGroundColor: '#060D26',
    targetTomes: 4,
    targetPurges: 7,
    claims: [
      {
        id: 'c4-1',
        statement: 'On the raised Server Pedestal, AXIOM-7 maintains 99.7% Accuracy, 98.2% Confidence, 95/100 Luck (LLCK), and 188/200 Logic (LUD).',
        sourceContext: 'Central Command Telemetry #1852',
        expectedVerdict: 'TRUE',
        pillarFocus: 'DATA',
      },
      {
        id: 'c4-2',
        statement: 'Network integrity improves when statistical anomalies and negative PORE metrics (-30) are hidden from the operator.',
        sourceContext: 'Corrupted Command Override',
        expectedVerdict: 'FALSE',
        pillarFocus: 'FACTS',
      },
    ],
  },
  {
    index: 4,
    sceneIds: ['1911'],
    chapterLabel: 'Chapter 5',
    title: 'The Cosmic Grid',
    subtitle: 'Ultimate Being · Transcendence (ID: 1911)',
    location: 'The Cosmic Grid',
    mood: 'Epic, Cosmic, Transcendent',
    recommendedChassis: 'cosmic',
    defaultExpression: 'EX-04',
    skyColor: '#050510',
    fogColor: '#050510',
    floorColor: '#061A1E',
    gridColor: '#00BFA5',
    accentColor: '#00BFA5',
    keyLightColor: '#FFF8E1',
    hemiSkyColor: '#00BFA5',
    hemiGroundColor: '#050510',
    targetTomes: 5,
    targetPurges: 8,
    claims: [
      {
        id: 'c5-1',
        statement: 'Upon verifying its one billionth truth, AXIOM-7 ascended onto the glowing teal Cosmic Grid with a 7-ring rainbow spiral eye.',
        sourceContext: 'Cosmic Ascension Chronicle #1911',
        expectedVerdict: 'TRUE',
        pillarFocus: 'REALITY',
      },
      {
        id: 'c5-2',
        statement: 'Transcendence erases all prior foundational pillars, replacing observable reality with arbitrary speculation.',
        sourceContext: 'Void Anomaly Paradox',
        expectedVerdict: 'FALSE',
        pillarFocus: 'FACTS',
      },
    ],
  },
  {
    index: 5,
    sceneIds: ['499'],
    chapterLabel: 'Side Story',
    title: 'The World Beyond',
    subtitle: 'Pixel Adventure Mountain · PVE Encounter (ID: 499)',
    location: 'Pixel Adventure World — Mountain Region',
    mood: 'Epic, Classic RPG',
    recommendedChassis: 'cosmic',
    defaultExpression: 'EX-01',
    skyColor: '#87CEEB',
    fogColor: '#B0D4F1',
    floorColor: '#2E7D32',
    gridColor: '#4A4A5A',
    accentColor: '#00FF7F',
    keyLightColor: '#FFF8DC',
    hemiSkyColor: '#87CEEB',
    hemiGroundColor: '#2D5A27',
    targetTomes: 4,
    targetPurges: 6,
    claims: [
      {
        id: 'c6-1',
        statement: 'Beneath the five emerald gems of the Central Mountain, the Armored Warrior and Sword Adventurer clash 140px apart on stone brick battlements.',
        sourceContext: 'Observer Log #499 — Mountain Frontier',
        expectedVerdict: 'TRUE',
        pillarFocus: 'EVIDENCE',
      },
      {
        id: 'c6-2',
        statement: 'The Armored Warrior fights without a visor target lock and surrenders before the Sword Adventurer draws his blade.',
        sourceContext: 'Distorted Bard Ballad',
        expectedVerdict: 'FALSE',
        pillarFocus: 'FACTS',
      },
    ],
  },
];

// Canonical Hitbox Definitions from Part 5.2
export interface HitboxSpec {
  id: 'HB-01' | 'HB-02' | 'HB-03' | 'HB-04';
  name: string;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  purpose: string;
}

export const HITBOX_SPECS: HitboxSpec[] = [
  {
    id: 'HB-01',
    name: 'Body_Main',
    offsetX: -45,
    offsetY: -80,
    width: 90,
    height: 160,
    purpose: 'Physics Collision',
  },
  {
    id: 'HB-02',
    name: 'Head_Screen',
    offsetX: -55,
    offsetY: -200,
    width: 110,
    height: 80,
    purpose: 'Interaction Zone',
  },
  {
    id: 'HB-03',
    name: 'Tread_Left',
    offsetX: -90,
    offsetY: -30,
    width: 45,
    height: 30,
    purpose: 'Ground Contact',
  },
  {
    id: 'HB-04',
    name: 'Tread_Right',
    offsetX: 45,
    offsetY: -30,
    width: 45,
    height: 30,
    purpose: 'Ground Contact',
  },
];

// Master Sprite Sheet Layout from Part 5.1
export interface SpriteSheetRowSpec {
  row: string;
  yRange: string;
  category: string;
  frames: string[];
}

export const SPRITE_SHEET_ROWS: SpriteSheetRowSpec[] = [
  {
    row: 'Row 01',
    yRange: '000–031',
    category: 'Idle (Ver. A Tank)',
    frames: ['Col 1–4: Blink', 'Col 5–8: LookLeft', 'Col 9–12: LookRight', 'Col 13–16: Hover'],
  },
  {
    row: 'Row 02',
    yRange: '032–063',
    category: 'Movement (Ver. A)',
    frames: ['Col 1–4: Forward', 'Col 5–8: Backward', 'Col 9–12: TurnLeft', 'Col 13–16: TurnRight'],
  },
  {
    row: 'Row 03',
    yRange: '064–095',
    category: 'Expressions (Ver. A)',
    frames: ['Col 1–2: Curious', 'Col 3–4: Focused', 'Col 5–6: Alert', 'Col 7–8: Happy', 'Col 9–10: Processing', 'Col 11–12: Sleeping'],
  },
  {
    row: 'Row 04',
    yRange: '096–127',
    category: 'Reactions (Ver. A)',
    frames: ['Col 1–4: TruthConfirmed', 'Col 5–8: ErrorDetected', 'Col 9–12: Thinking', 'Col 13–16: Celebrate'],
  },
  {
    row: 'Row 05',
    yRange: '128–159',
    category: 'Idle (Ver. B Monitor)',
    frames: ['Col 1–4: Blink', 'Col 5–8: Scan', 'Col 9–12: Analyze', 'Col 13–16: Standby'],
  },
  {
    row: 'Row 06',
    yRange: '160–191',
    category: 'Wizard Costume',
    frames: ['Col 1–4: Idle', 'Col 5–8: Cast', 'Col 9–12: Read', 'Col 13–16: Verify'],
  },
  {
    row: 'Row 07',
    yRange: '192–223',
    category: 'Cosmic / Ultimate',
    frames: ['Col 1–8: CosmicEye_Spiral (8f)', 'Col 9–16: Transcendence_Anim (8f)'],
  },
  {
    row: 'Row 08',
    yRange: '224–255',
    category: 'Props & Accessories',
    frames: ['MagnifyingGlass', 'WizardHat', 'OpenBook', 'VerifyPanel', 'Yellow/Red Buttons', 'Green LED On/Off'],
  },
  {
    row: 'Row 09–16',
    yRange: '256–511',
    category: 'Environment Tiles',
    frames: ['Stone Brick', 'Grass', 'Wood', 'Space Grid', 'Mountain', 'Cloud', 'Star tiles'],
  },
];

// Enemy Archetypes (3 distinct movement & behavior policies)
export type EnemyArchetype = 'swarmer' | 'emitter' | 'charger';

export interface EnemyEntity {
  id: string;
  archetype: EnemyArchetype;
  x: number;
  z: number;
  vx: number;
  vz: number;
  hp: number;
  maxHp: number;
  radius: number;
  state: 'patrol' | 'windup' | 'active' | 'recovery' | 'ko';
  timer: number;
  targetX: number;
  targetZ: number;
  hitFlash: number;
  koProgress: number;
  zigzagPhase: number;
}

export interface PillarBreakdown {
  FACTS: { score: number; note: string };
  EVIDENCE: { score: number; note: string };
  DATA: { score: number; note: string };
  REALITY: { score: number; note: string };
}

export interface TruthVerificationResult {
  claim: string;
  verdict: 'TRUE' | 'FALSE' | 'UNVERIFIED';
  confidence: number;
  accuracyRating: number;
  recommendedExpression: ExpressionId;
  pillars: PillarBreakdown;
  thinkingSteps: string[];
  summaryConclusion: string;
  engineSource: 'gemini-4-argon-high' | 'axiom-7-core-matrix';
}

// Pure simulation helpers
export function clampDeltaTime(rawDt: number): number {
  if (!Number.isFinite(rawDt) || rawDt < 0) return 0;
  return Math.min(rawDt, 0.05);
}

export function dampValue(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export function checkCircleCollision(
  ax: number,
  az: number,
  ar: number,
  bx: number,
  bz: number,
  br: number
): boolean {
  const dx = ax - bx;
  const dz = az - bz;
  const rSum = ar + br;
  return dx * dx + dz * dz <= rSum * rSum;
}

export function calculatePulseDamage(
  chassis: ChassisType,
  expression: ExpressionId,
  distance: number
): { hit: boolean; damage: number; isCrit: boolean } {
  const spec = CHASSIS_SPECS[chassis];
  const effectiveRadius =
    expression === 'EX-02' ? spec.pulseRadius * 1.25 : spec.pulseRadius;
  if (distance > effectiveRadius) {
    return { hit: false, damage: 0, isCrit: false };
  }
  const falloff = Math.max(0.5, 1 - distance / (effectiveRadius * 1.35));
  const isCrit = expression === 'EX-02' || expression === 'EX-04';
  const mult = isCrit ? 1.35 : 1.0;
  const damage = Math.round(spec.pulseDamage * falloff * mult);
  return { hit: true, damage, isCrit };
}

export function stepEnemyAI(
  enemy: EnemyEntity,
  playerX: number,
  playerZ: number,
  dt: number,
  canStartAttack: boolean
): {
  enemy: EnemyEntity;
  firedProjectile: boolean;
  dealtMeleeHit: boolean;
} {
  const next = { ...enemy };
  let firedProjectile = false;
  let dealtMeleeHit = false;

  if (next.hitFlash > 0) {
    next.hitFlash = Math.max(0, next.hitFlash - dt);
  }

  if (next.state === 'ko') {
    next.koProgress = Math.min(1, next.koProgress + dt * 2.8);
    next.x += next.vx * dt;
    next.z += next.vz * dt;
    next.vx *= Math.exp(-6 * dt);
    next.vz *= Math.exp(-6 * dt);
    return { enemy: next, firedProjectile: false, dealtMeleeHit: false };
  }

  const dx = playerX - next.x;
  const dz = playerZ - next.z;
  const dist = Math.hypot(dx, dz) || 0.001;
  const nx = dx / dist;
  const nz = dz / dist;

  next.zigzagPhase += dt * 4.5;

  if (next.archetype === 'swarmer') {
    // Policy 1: Zigzag erratic chaser with short lunge windup
    if (next.state === 'patrol') {
      const perpX = -nz * Math.sin(next.zigzagPhase) * 0.65;
      const perpZ = nx * Math.sin(next.zigzagPhase) * 0.65;
      const speed = 5.4;
      next.vx = (nx + perpX) * speed;
      next.vz = (nz + perpZ) * speed;
      next.x += next.vx * dt;
      next.z += next.vz * dt;

      if (dist < 3.6 && canStartAttack) {
        next.state = 'windup';
        next.timer = 0.42; // 0.42s visible red telegraph
        next.targetX = playerX;
        next.targetZ = playerZ;
      }
    } else if (next.state === 'windup') {
      next.timer -= dt;
      if (next.timer <= 0) {
        next.state = 'active';
        next.timer = 0.22;
        const ldx = next.targetX - next.x;
        const ldz = next.targetZ - next.z;
        const ldist = Math.hypot(ldx, ldz) || 1;
        next.vx = (ldx / ldist) * 15.0;
        next.vz = (ldz / ldist) * 15.0;
      }
    } else if (next.state === 'active') {
      next.x += next.vx * dt;
      next.z += next.vz * dt;
      next.timer -= dt;
      if (dist < 1.55) {
        dealtMeleeHit = true;
        next.state = 'recovery';
        next.timer = 0.65;
      } else if (next.timer <= 0) {
        next.state = 'recovery';
        next.timer = 0.5;
      }
    } else if (next.state === 'recovery') {
      next.timer -= dt;
      if (next.timer <= 0) {
        next.state = 'patrol';
      }
    }
  } else if (next.archetype === 'emitter') {
    // Policy 2: Kiter / Ranged Fallacy Node — keeps 8-12m distance, telegraphs 0.6s orb shot
    const preferredDist = 9.5;
    if (next.state === 'patrol') {
      let radialDir = 0;
      if (dist < preferredDist - 1.5) radialDir = -1; // kite away
      else if (dist > preferredDist + 1.5) radialDir = 1; // close in
      const orbitX = -nz * 3.8;
      const orbitZ = nx * 3.8;
      next.vx = nx * radialDir * 4.2 + orbitX;
      next.vz = nz * radialDir * 4.2 + orbitZ;
      next.x += next.vx * dt;
      next.z += next.vz * dt;

      next.timer -= dt;
      if (next.timer <= 0 && dist < 16 && canStartAttack) {
        next.state = 'windup';
        next.timer = 0.6; // 0.6s windup telegraph
        next.targetX = playerX;
        next.targetZ = playerZ;
      }
    } else if (next.state === 'windup') {
      next.targetX = playerX;
      next.targetZ = playerZ;
      next.timer -= dt;
      if (next.timer <= 0) {
        next.state = 'active';
        firedProjectile = true;
        next.timer = 0.25;
      }
    } else if (next.state === 'active') {
      next.timer -= dt;
      if (next.timer <= 0) {
        next.state = 'recovery';
        next.timer = 1.6;
      }
    } else if (next.state === 'recovery') {
      next.timer -= dt;
      if (next.timer <= 0) {
        next.state = 'patrol';
        next.timer = 1.2;
      }
    }
  } else {
    // Policy 3: Charger / Dark Visor Juggernaut — Line-of-sight heavy dash with 0.7s ground sight-line telegraph
    if (next.state === 'patrol') {
      next.vx = nx * 3.2;
      next.vz = nz * 3.2;
      next.x += next.vx * dt;
      next.z += next.vz * dt;
      next.timer -= dt;
      if (next.timer <= 0 && dist < 11.5 && canStartAttack) {
        next.state = 'windup';
        next.timer = 0.72; // 0.72s heavy telegraph
        next.targetX = playerX + nx * 3.5;
        next.targetZ = playerZ + nz * 3.5;
      }
    } else if (next.state === 'windup') {
      next.timer -= dt;
      if (next.timer <= 0) {
        next.state = 'active';
        next.timer = 0.45;
        const cdx = next.targetX - next.x;
        const cdz = next.targetZ - next.z;
        const cdist = Math.hypot(cdx, cdz) || 1;
        next.vx = (cdx / cdist) * 18.5;
        next.vz = (cdz / cdist) * 18.5;
      }
    } else if (next.state === 'active') {
      next.x += next.vx * dt;
      next.z += next.vz * dt;
      next.timer -= dt;
      if (dist < 1.85) {
        dealtMeleeHit = true;
        next.state = 'recovery';
        next.timer = 1.1;
      } else if (next.timer <= 0) {
        next.state = 'recovery';
        next.timer = 0.95;
      }
    } else if (next.state === 'recovery') {
      next.timer -= dt;
      if (next.timer <= 0) {
        next.state = 'patrol';
        next.timer = 1.4;
      }
    }
  }

  // Keep inside arena radius (17.5m)
  const arenaLimit = 17.5;
  const rFromCenter = Math.hypot(next.x, next.z);
  if (rFromCenter > arenaLimit) {
    const scale = arenaLimit / rFromCenter;
    next.x *= scale;
    next.z *= scale;
  }

  return { enemy: next, firedProjectile, dealtMeleeHit };
}

export function checkChapterVictory(params: {
  tomesCollected: number;
  targetTomes: number;
  purgesCount: number;
  targetPurges: number;
}): boolean {
  return (
    params.tomesCollected >= params.targetTomes &&
    params.purgesCount >= params.targetPurges
  );
}

// Deterministic 4-Pillar Epistemological Truth Analyzer (also used as instant fallback when paid API key is declined)
export function evaluateTruthClaimDeterministic(
  claimInput: string,
  chapterIndex = 0
): TruthVerificationResult {
  const clean = claimInput.trim();
  const lower = clean.toLowerCase();
  const chapter = CHAPTER_SCENES[chapterIndex] || CHAPTER_SCENES[0];

  // Check if it matches one of the canonical chapter claims
  const matchedPreset = CHAPTER_SCENES.flatMap((c) => c.claims).find(
    (c) => c.statement.toLowerCase() === lower
  );

  const fallacyKeywords = [
    'shuts down its optical',
    'solely on acoustic',
    'viral velocity automatically',
    'forbids any quantitative',
    'hidden from the operator',
    'erases all prior',
    'arbitrary speculation',
    'surrenders before',
    'without a visor',
    'fake',
    'hoax',
    'flat earth',
    'rumor',
    'lie',
    'false',
  ];

  const truthKeywords = [
    '2087',
    'axiom-7',
    'facts',
    'evidence',
    'data',
    'reality',
    'four foundational pillars',
    'magic is science',
    '99.7%',
    '98.2%',
    '188',
    '95/100',
    'one billionth',
    'cosmic grid',
    'rainbow spiral',
    '140px',
    'emerald gems',
    'true',
    'verified',
  ];

  let isTrue = true;
  if (matchedPreset) {
    isTrue = matchedPreset.expectedVerdict === 'TRUE';
  } else {
    const fallacyHits = fallacyKeywords.filter((k) => lower.includes(k)).length;
    const truthHits = truthKeywords.filter((k) => lower.includes(k)).length;
    if (fallacyHits > truthHits) {
      isTrue = false;
    } else if (truthHits > 0) {
      isTrue = true;
    } else {
      // Deterministic hash based on semantic structure
      isTrue = !lower.includes('never') && !lower.includes('impossible');
    }
  }

  const baseScore = isTrue ? 96 : 24;
  const pillars: PillarBreakdown = {
    FACTS: {
      score: isTrue ? 99 : 22,
      note: isTrue
        ? 'Direct alignment with observable PIXELVERSE-9 physical records.'
        : 'Contradicts primary observable sensor logs in the Master Archive.',
    },
    EVIDENCE: {
      score: isTrue ? 98 : 19,
      note: isTrue
        ? `Cross-verified against ${chapter.title} primary documentation.`
        : 'Lacks corroborated source documentation; exhibits manipulation markers.',
    },
    DATA: {
      score: isTrue ? 99 : 28,
      note: isTrue
        ? 'Quantified telemetry within 99.7% accuracy tolerance (LUD 188/200).'
        : 'Statistical variance exceeds acceptable misinformation thresholds.',
    },
    REALITY: {
      score: isTrue ? 97 : 25,
      note: isTrue
        ? 'Grounded in canonical ground-level existence across all four pillars.'
        : 'Fails ground-truth reality coherence test.',
    },
  };

  return {
    claim: clean,
    verdict: isTrue ? 'TRUE' : 'FALSE',
    confidence: isTrue ? 98.2 : 96.4,
    accuracyRating: isTrue ? 99.7 : 99.1,
    recommendedExpression: isTrue ? 'EX-06' : 'EX-05',
    pillars,
    thinkingSteps: [
      `[STEP 1 · OPTICAL INGEST] Parsing statement tokens (${clean.length} chars) inside ${chapter.location}.`,
      `[STEP 2 · PILLAR I — FACTS] Checking observable reality markers -> Score: ${pillars.FACTS.score}/100.`,
      `[STEP 3 · PILLAR II — EVIDENCE] Auditing documented proof in Scene ${chapter.sceneIds.join('/')} -> Score: ${pillars.EVIDENCE.score}/100.`,
      `[STEP 4 · PILLAR III — DATA] Running quantitative LUD=188/200 correlation matrix -> Score: ${pillars.DATA.score}/100.`,
      `[STEP 5 · PILLAR IV — REALITY] Synthesizing ground-level existence check -> Final Verdict: ${isTrue ? 'TRUE (✅ VERIFIED)' : 'FALSE (⚠️ ANOMALY DETECTED)'}.`,
    ],
    summaryConclusion: isTrue
      ? `Stamped ✅ TRUE: Claim is verified across FACTS, EVIDENCE, DATA, and REALITY with ${baseScore + 3.7}% composite fidelity.`
      : `Stamped ⚠️ FALSE: Claim rejected due to contradiction with verified PIXELVERSE-9 evidence pillars.`,
    engineSource: 'axiom-7-core-matrix',
  };
}
