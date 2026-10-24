'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  CHAPTER_SCENES,
  CHASSIS_SPECS,
  EXPRESSIONS,
  calculatePulseDamage,
  checkChapterVictory,
  clampDeltaTime,
  dampValue,
  stepEnemyAI,
  type ChassisType,
  type EnemyArchetype,
  type EnemyEntity,
  type ExpressionId,
  type GameStatus,
  type PillarName,
} from '@/lib/game-rules';
import { computeWasmPulseDamage } from '@/lib/rust-wasm-kernel';
import { soundSynth } from '@/lib/audio-synth';

export interface ActiveGameplaySnapshot {
  hp: number;
  maxHp: number;
  score: number;
  tomesCollected: number;
  targetTomes: number;
  purgesCount: number;
  targetPurges: number;
  pillarsUnlocked: PillarName[];
  nearbyTomeClaimIndex: number | null;
}

interface AxiomThreeCanvasProps {
  status: GameStatus;
  chapterIndex: number;
  chassis: ChassisType;
  expression: ExpressionId;
  terminalOpen: boolean;
  codexOpen: boolean;
  pulseTriggerCount: number;
  verifiedCelebrationCount: number;
  sessionResetCount?: number;
  sweepTriggerCount?: number;
  onUpdateSnapshot: (snap: ActiveGameplaySnapshot) => void;
  onExpressionAutoChange: (expr: ExpressionId) => void;
  onChapterComplete: () => void;
  onGameOver: () => void;
  onInspectTomeClaim: (claimIndex: number) => void;
}

interface TomeNode {
  id: string;
  pillar: PillarName;
  color: string;
  x: number;
  z: number;
  collected: boolean;
  claimIndex: number;
  mesh: THREE.Group;
}

interface ProjectileOrb {
  active: boolean;
  x: number;
  z: number;
  vx: number;
  vz: number;
  reflected: boolean;
  mesh: THREE.Mesh;
}

const PILLAR_COLORS: Record<PillarName, string> = {
  FACTS: '#2E7D32',
  EVIDENCE: '#6A1B9A',
  DATA: '#1565C0',
  REALITY: '#8B6343',
};

const PILLAR_ORDER: PillarName[] = ['FACTS', 'EVIDENCE', 'DATA', 'REALITY'];

// Pre-allocated math helpers at module scope (zero GC inside animation loop)
const _camTargetPos = new THREE.Vector3();
const _camLookAt = new THREE.Vector3();
const _dummyObj = new THREE.Object3D();
const _tempColor = new THREE.Color();

export default function AxiomThreeCanvas({
  status,
  chapterIndex,
  chassis,
  expression,
  terminalOpen,
  codexOpen,
  pulseTriggerCount,
  verifiedCelebrationCount,
  sessionResetCount = 0,
  sweepTriggerCount = 0,
  onUpdateSnapshot,
  onExpressionAutoChange,
  onChapterComplete,
  onGameOver,
  onInspectTomeClaim,
}: AxiomThreeCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Store latest props in refs so React UI updates never re-create the WebGLRenderer
  const propsRef = useRef({
    status,
    chapterIndex,
    chassis,
    expression,
    terminalOpen,
    codexOpen,
    pulseTriggerCount,
    verifiedCelebrationCount,
    sessionResetCount,
    sweepTriggerCount,
    onUpdateSnapshot,
    onExpressionAutoChange,
    onChapterComplete,
    onGameOver,
    onInspectTomeClaim,
  });

  useEffect(() => {
    propsRef.current = {
      status,
      chapterIndex,
      chassis,
      expression,
      terminalOpen,
      codexOpen,
      pulseTriggerCount,
      verifiedCelebrationCount,
      sessionResetCount,
      sweepTriggerCount,
      onUpdateSnapshot,
      onExpressionAutoChange,
      onChapterComplete,
      onGameOver,
      onInspectTomeClaim,
    };
  }, [
    status,
    chapterIndex,
    chassis,
    expression,
    terminalOpen,
    codexOpen,
    pulseTriggerCount,
    verifiedCelebrationCount,
    sessionResetCount,
    sweepTriggerCount,
    onUpdateSnapshot,
    onExpressionAutoChange,
    onChapterComplete,
    onGameOver,
    onInspectTomeClaim,
  ]);

  const externalCommandRef = useRef({
    lastPulseCount: pulseTriggerCount,
    lastCelebrationCount: verifiedCelebrationCount,
    lastResetCount: sessionResetCount,
    lastSweepCount: sweepTriggerCount,
    lastChapterIndex: -1,
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    const width = container.clientWidth || window.innerWidth || 1280;
    const height = container.clientHeight || window.innerHeight || 720;

    // Pre-validate WebGL context on a dedicated canvas BEFORE calling THREE.WebGLRenderer
    // so Three.js never throws "Error creating WebGL context" if the browser blocked WebGL.
    const glCanvas = document.createElement('canvas');
    let glContext: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    let isSoftwareGl = isHeadless;
    try {
      const attrs: WebGLContextAttributes = {
        antialias: !isHeadless,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      };
      glContext =
        (glCanvas.getContext('webgl2', attrs) as WebGL2RenderingContext | null) ||
        (glCanvas.getContext('webgl', attrs) as WebGLRenderingContext | null) ||
        (glCanvas.getContext('webgl2') as WebGL2RenderingContext | null) ||
        (glCanvas.getContext('webgl') as WebGLRenderingContext | null);

      if (glContext) {
        const dbgExt = glContext.getExtension('WEBGL_debug_renderer_info');
        const rendererParam = dbgExt ? dbgExt.UNMASKED_RENDERER_WEBGL : glContext.RENDERER;
        const gpuName = String(glContext.getParameter(rendererParam) || '');
        if (/SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpuName)) {
          isSoftwareGl = true;
        }

        // Sanitize ANGLE / Direct3D HLSL compiler warning X4122 (double-precision constant folding
        // emitted when unrolling PMREMGenerator SphericalGaussianBlur & cubeUV reflection shaders)
        const rawGetProgramInfoLog = glContext.getProgramInfoLog.bind(glContext);
        glContext.getProgramInfoLog = (program: WebGLProgram): string | null => {
          const info = rawGetProgramInfoLog(program);
          if (!info || !info.includes('X4122')) return info;
          return info
            .split('\n')
            .filter((line) => !line.includes('warning X4122'))
            .join('\n')
            .trim();
        };
      }
    } catch {
      glContext = null;
    }

    let renderer: THREE.WebGLRenderer | null = null;
    if (glContext) {
      try {
        renderer = new THREE.WebGLRenderer({
          canvas: glCanvas,
          context: glContext,
          antialias: !isSoftwareGl,
          powerPreference: 'high-performance',
        });
        // Disable synchronous shader info-log checks in production/runtime to avoid
        // GPU pipeline stalls and benign ANGLE HLSL warning X4122 console output.
        renderer.debug.checkShaderErrors = false;
      } catch {
        renderer = null;
      }
    }

    // =========================================================================
    // INTERACTIVE 2D CANVAS SPATIAL FALLBACK ENGINE (when WebGL is blocked)
    // =========================================================================
    if (!renderer) {
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = width;
      fallbackCanvas.height = height;
      fallbackCanvas.className = 'w-full h-full block pixel-crisp';
      container.innerHTML = '';
      container.appendChild(fallbackCanvas);
      const ctx2d = fallbackCanvas.getContext('2d');

      const fbState = {
        playerX: 0,
        playerZ: 3.5,
        playerRotY: -0.22,
        hp: 5,
        maxHp: 5,
        score: 0,
        tomesCollected: 0,
        purgesCount: 0,
        pillarsUnlocked: [] as PillarName[],
        pulseWaveProgress: 0,
        pulseCooldown: 0,
        chapterCompleteFired: false,
        lastChapterIdx: -1,
        lastResetCount: externalCommandRef.current.lastResetCount,
        lastPulseCount: externalCommandRef.current.lastPulseCount,
        lastCelebCount: externalCommandRef.current.lastCelebrationCount,
        lastSweepCount: externalCommandRef.current.lastSweepCount,
        tomes: [] as { x: number; z: number; pillar: PillarName; color: string; collected: boolean }[],
        enemies: [] as { x: number; z: number; hp: number; maxHp: number; alive: boolean }[],
      };

      const resetFallbackChapter = (idx: number) => {
        const spec = CHAPTER_SCENES[idx] || CHAPTER_SCENES[0];
        fbState.playerX = 0;
        fbState.playerZ = 3.5;
        fbState.hp = 5;
        fbState.tomesCollected = 0;
        fbState.purgesCount = 0;
        fbState.pillarsUnlocked = [];
        fbState.chapterCompleteFired = false;
        fbState.tomes = Array.from({ length: spec.targetTomes }, (_, i) => {
          const pillar = PILLAR_ORDER[i % 4];
          const ang = (i / spec.targetTomes) * Math.PI * 2 + 0.4;
          const rad = 5.5 + (i % 2) * 2.5;
          return {
            x: Math.cos(ang) * rad,
            z: Math.sin(ang) * rad,
            pillar,
            color: PILLAR_COLORS[pillar],
            collected: false,
          };
        });
        fbState.enemies = Array.from({ length: spec.targetPurges }, (_, i) => {
          const ang = (i / spec.targetPurges) * Math.PI * 2 + 0.9;
          const rad = 6.0 + (i % 2) * 3.0;
          return {
            x: Math.cos(ang) * rad,
            z: Math.sin(ang) * rad,
            hp: 55,
            maxHp: 55,
            alive: true,
          };
        });
        propsRef.current.onUpdateSnapshot({
          hp: fbState.hp,
          maxHp: fbState.maxHp,
          score: fbState.score,
          tomesCollected: 0,
          targetTomes: spec.targetTomes,
          purgesCount: 0,
          targetPurges: spec.targetPurges,
          pillarsUnlocked: [],
          nearbyTomeClaimIndex: 0,
        });
      };

      const executeFallbackPulse = () => {
        fbState.pulseWaveProgress = 0.01;
        fbState.pulseCooldown = 0.25;
        soundSynth.playPulseScan(propsRef.current.chassis);
        fbState.enemies.forEach((en) => {
          if (!en.alive) return;
          const d = Math.hypot(en.x - fbState.playerX, en.z - fbState.playerZ);
          const dmg = computeWasmPulseDamage(
            propsRef.current.chassis,
            propsRef.current.expression,
            d
          );
          if (dmg.hit) {
            en.hp -= dmg.damage;
            if (en.hp <= 0) {
              en.alive = false;
              fbState.purgesCount += 1;
              fbState.score += 150;
            }
          }
        });
      };

      const executeFallbackSweep = () => {
        const nextTome = fbState.tomes.find((t) => !t.collected);
        const nextEnemy = fbState.enemies.find((en) => en.alive);
        if (nextTome) {
          fbState.playerX = nextTome.x;
          fbState.playerZ = nextTome.z;
          nextTome.collected = true;
          fbState.tomesCollected += 1;
          fbState.score += 200;
          if (!fbState.pillarsUnlocked.includes(nextTome.pillar)) {
            fbState.pillarsUnlocked = [...fbState.pillarsUnlocked, nextTome.pillar];
          }
          soundSynth.playTomePickup();
        } else if (nextEnemy) {
          fbState.playerX = nextEnemy.x;
          fbState.playerZ = nextEnemy.z;
        }
        executeFallbackPulse();
      };

      const keys = new Set<string>();
      const onFbKeyDown = (e: KeyboardEvent) => {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        keys.add(e.code);
        if (e.code === 'Space' && fbState.pulseCooldown <= 0) {
          executeFallbackPulse();
        } else if (e.code === 'KeyQ') {
          executeFallbackSweep();
        }
      };
      const onFbKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
      const onFbResize = () => {
        fallbackCanvas.width = container.clientWidth || window.innerWidth || 1280;
        fallbackCanvas.height = container.clientHeight || window.innerHeight || 720;
      };

      window.addEventListener('keydown', onFbKeyDown);
      window.addEventListener('keyup', onFbKeyUp);
      window.addEventListener('resize', onFbResize);

      let fbAnimId = 0;
      let fbLast = performance.now();
      let fbSyncAcc = 0;

      const renderFallback = (now: number) => {
        fbAnimId = requestAnimationFrame(renderFallback);
        const dt = clampDeltaTime((now - fbLast) / 1000);
        fbLast = now;
        const p = propsRef.current;
        const chSpec = CHAPTER_SCENES[p.chapterIndex] || CHAPTER_SCENES[0];

        if (
          fbState.lastChapterIdx !== p.chapterIndex ||
          fbState.lastResetCount !== p.sessionResetCount
        ) {
          fbState.lastChapterIdx = p.chapterIndex;
          fbState.lastResetCount = p.sessionResetCount;
          resetFallbackChapter(p.chapterIndex);
        }

        if (p.pulseTriggerCount !== fbState.lastPulseCount) {
          fbState.lastPulseCount = p.pulseTriggerCount;
          executeFallbackPulse();
        }

        if (p.sweepTriggerCount !== fbState.lastSweepCount) {
          fbState.lastSweepCount = p.sweepTriggerCount;
          executeFallbackSweep();
        }

        if (p.verifiedCelebrationCount !== fbState.lastCelebCount) {
          fbState.lastCelebCount = p.verifiedCelebrationCount;
          fbState.score += 250;
          fbState.hp = Math.min(fbState.maxHp, fbState.hp + 1);
        }

        if (p.status === 'playing' && !p.terminalOpen && !p.codexOpen) {
          let mx = 0;
          let mz = 0;
          if (keys.has('KeyW') || keys.has('ArrowUp')) mz -= 1;
          if (keys.has('KeyS') || keys.has('ArrowDown')) mz += 1;
          if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
          if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
          const len = Math.hypot(mx, mz);
          if (len > 0) {
            fbState.playerX = Math.max(-14, Math.min(14, fbState.playerX + (mx / len) * 9 * dt));
            fbState.playerZ = Math.max(-12, Math.min(10, fbState.playerZ + (mz / len) * 9 * dt));
          }
          if (fbState.pulseCooldown > 0) fbState.pulseCooldown = Math.max(0, fbState.pulseCooldown - dt);

          fbState.tomes.forEach((t) => {
            if (!t.collected && Math.hypot(t.x - fbState.playerX, t.z - fbState.playerZ) < 2.2) {
              t.collected = true;
              fbState.tomesCollected += 1;
              fbState.score += 200;
              if (!fbState.pillarsUnlocked.includes(t.pillar)) {
                fbState.pillarsUnlocked = [...fbState.pillarsUnlocked, t.pillar];
              }
            }
          });

          if (
            !fbState.chapterCompleteFired &&
            checkChapterVictory({
              tomesCollected: fbState.tomesCollected,
              targetTomes: chSpec.targetTomes,
              purgesCount: fbState.purgesCount,
              targetPurges: chSpec.targetPurges,
            })
          ) {
            fbState.chapterCompleteFired = true;
            p.onUpdateSnapshot({
              hp: fbState.hp,
              maxHp: fbState.maxHp,
              score: fbState.score,
              tomesCollected: fbState.tomesCollected,
              targetTomes: chSpec.targetTomes,
              purgesCount: fbState.purgesCount,
              targetPurges: chSpec.targetPurges,
              pillarsUnlocked: fbState.pillarsUnlocked,
              nearbyTomeClaimIndex: 0,
            });
            soundSynth.playTruthVerified(true);
            p.onChapterComplete();
          }

          fbSyncAcc += dt;
          if (fbSyncAcc >= 0.1) {
            fbSyncAcc = 0;
            p.onUpdateSnapshot({
              hp: fbState.hp,
              maxHp: fbState.maxHp,
              score: fbState.score,
              tomesCollected: fbState.tomesCollected,
              targetTomes: chSpec.targetTomes,
              purgesCount: fbState.purgesCount,
              targetPurges: chSpec.targetPurges,
              pillarsUnlocked: fbState.pillarsUnlocked,
              nearbyTomeClaimIndex: 0,
            });
          }
        }

        if (!ctx2d) return;
        const cw = fallbackCanvas.width;
        const ch = fallbackCanvas.height;

        // Sky & Horizon Gradient
        const grad = ctx2d.createLinearGradient(0, 0, 0, ch);
        grad.addColorStop(0, chSpec.skyColor);
        grad.addColorStop(0.45, chSpec.fogColor);
        grad.addColorStop(0.46, chSpec.floorColor);
        grad.addColorStop(1, '#1A1412');
        ctx2d.fillStyle = grad;
        ctx2d.fillRect(0, 0, cw, ch);

        // Perspective Grid Lines on Floor
        const horizonY = ch * 0.45;
        ctx2d.strokeStyle = 'rgba(0, 240, 255, 0.22)';
        ctx2d.lineWidth = 1;
        for (let i = -12; i <= 12; i++) {
          ctx2d.beginPath();
          ctx2d.moveTo(cw / 2 + i * 35, horizonY);
          ctx2d.lineTo(cw / 2 + i * 160, ch);
          ctx2d.stroke();
        }
        for (let r = 1; r <= 8; r++) {
          const ry = horizonY + Math.pow(r / 8, 1.5) * (ch - horizonY);
          ctx2d.beginPath();
          ctx2d.moveTo(0, ry);
          ctx2d.lineTo(cw, ry);
          ctx2d.stroke();
        }

        // Project world (x, z) to 2D canvas screen coordinates
        const project = (wx: number, wz: number) => {
          const relX = wx - (p.status === 'title' ? -2.2 : fbState.playerX * 0.5);
          const relZ = wz - (p.status === 'title' ? 0 : fbState.playerZ * 0.3);
          const depth = Math.max(0.25, (relZ + 14) / 22);
          return {
            sx: cw / 2 + relX * 48 * depth,
            sy: horizonY + depth * (ch - horizonY) * 0.82,
            scale: Math.max(0.45, depth * 1.35),
          };
        };

        // Draw Tomes & Enemies in Playing mode
        if (p.status !== 'title') {
          fbState.tomes.forEach((t) => {
            if (t.collected) return;
            const pt = project(t.x, t.z);
            ctx2d.fillStyle = t.color;
            ctx2d.strokeStyle = '#00F0FF';
            ctx2d.lineWidth = 2;
            ctx2d.fillRect(pt.sx - 18 * pt.scale, pt.sy - 12 * pt.scale, 36 * pt.scale, 24 * pt.scale);
            ctx2d.strokeRect(pt.sx - 18 * pt.scale, pt.sy - 12 * pt.scale, 36 * pt.scale, 24 * pt.scale);
          });

          fbState.enemies.forEach((en) => {
            if (!en.alive) return;
            const pe = project(en.x, en.z);
            ctx2d.fillStyle = '#1E1024';
            ctx2d.strokeStyle = '#FF1744';
            ctx2d.lineWidth = 2;
            ctx2d.beginPath();
            ctx2d.arc(pe.sx, pe.sy - 14 * pe.scale, 18 * pe.scale, 0, Math.PI * 2);
            ctx2d.fill();
            ctx2d.stroke();
          });
        }

        // Draw Pulse Wave Ring if active
        const heroPos =
          p.status === 'title'
            ? { sx: cw * 0.68, sy: ch * 0.64, scale: 2.35 }
            : project(fbState.playerX, fbState.playerZ);

        if (fbState.pulseWaveProgress > 0) {
          fbState.pulseWaveProgress += dt * 3.2;
          if (fbState.pulseWaveProgress >= 1) {
            fbState.pulseWaveProgress = 0;
          } else {
            ctx2d.strokeStyle = `rgba(0, 240, 255, ${(1 - fbState.pulseWaveProgress).toFixed(2)})`;
            ctx2d.lineWidth = 4;
            ctx2d.beginPath();
            ctx2d.ellipse(
              heroPos.sx,
              heroPos.sy + 20,
              fbState.pulseWaveProgress * 220,
              fbState.pulseWaveProgress * 95,
              0,
              0,
              Math.PI * 2
            );
            ctx2d.stroke();
          }
        }

        // Draw o-Llama AXIOM-7 Character Rig in 3/4 Metallic Pixel Style
        const s = heroPos.scale;
        const hx = heroPos.sx;
        const hy = heroPos.sy + Math.sin(now * 0.004) * 4;

        ctx2d.save();
        ctx2d.translate(hx, hy);
        ctx2d.scale(s, s);

        // Ground shadow
        ctx2d.fillStyle = 'rgba(0,0,0,0.35)';
        ctx2d.beginPath();
        ctx2d.ellipse(0, 42, 46, 16, 0, 0, Math.PI * 2);
        ctx2d.fill();

        // Top Red Sensor Dome
        ctx2d.fillStyle = '#FF1744';
        ctx2d.strokeStyle = '#08080C';
        ctx2d.lineWidth = 2.5;
        ctx2d.fillRect(-16, -64, 32, 8);
        ctx2d.strokeRect(-16, -64, 32, 8);

        // Left & Right Circular Ear Hubs
        ctx2d.fillStyle = '#78909C';
        ctx2d.fillRect(-48, -42, 8, 22);
        ctx2d.strokeRect(-48, -42, 8, 22);
        ctx2d.fillRect(40, -42, 8, 22);
        ctx2d.strokeRect(40, -42, 8, 22);

        // Head Brushed Steel Bezel + Black Screen
        ctx2d.fillStyle = '#607D8B';
        ctx2d.fillRect(-40, -56, 80, 48);
        ctx2d.strokeRect(-40, -56, 80, 48);
        ctx2d.fillStyle = '#05070A';
        ctx2d.fillRect(-33, -49, 66, 34);

        // Cyan Eyes based on active expression
        ctx2d.fillStyle = p.expression === 'EX-05' ? '#FF1744' : '#00F0FF';
        ctx2d.fillRect(-22, -39, 16, 14);
        ctx2d.fillRect(6, -39, 16, 14);
        if (p.expression === 'EX-02' || p.expression === 'EX-05') {
          ctx2d.fillStyle = '#05070A';
          ctx2d.fillRect(-18, -35, 8, 6);
          ctx2d.fillRect(10, -35, 8, 6);
        }

        // Torso + Yellow Cross (+) + 3 Vertical LEDs (Green, Yellow, Red)
        ctx2d.fillStyle = '#455A64';
        ctx2d.fillRect(-28, -6, 56, 32);
        ctx2d.strokeRect(-28, -6, 56, 32);

        // Yellow Cross (+)
        ctx2d.fillStyle = '#FFD600';
        ctx2d.fillRect(-15, -1, 6, 16);
        ctx2d.fillRect(-20, 4, 16, 6);
        // Dark slot below yellow cross
        ctx2d.fillStyle = '#08080C';
        ctx2d.fillRect(-19, 18, 14, 3);

        // 3 Stacked LEDs (Green, Yellow, Red)
        ctx2d.fillStyle = '#1C262B';
        ctx2d.fillRect(6, -2, 14, 24);
        ctx2d.fillStyle = '#00E676';
        ctx2d.fillRect(10, 0, 6, 5);
        ctx2d.fillStyle = '#FFD600';
        ctx2d.fillRect(10, 8, 6, 5);
        ctx2d.fillStyle = '#FF1744';
        ctx2d.fillRect(10, 16, 6, 5);

        // Left & Right C-Claw Grippers
        ctx2d.fillStyle = '#90A4AE';
        ctx2d.fillRect(-40, -2, 10, 22);
        ctx2d.strokeRect(-40, -2, 10, 22);
        ctx2d.fillRect(30, -2, 10, 22);
        ctx2d.strokeRect(30, -2, 10, 22);

        // Ribbed Tank Treads
        ctx2d.fillStyle = '#546E7A';
        ctx2d.fillRect(-34, 24, 24, 18);
        ctx2d.strokeRect(-34, 24, 24, 18);
        ctx2d.fillRect(10, 24, 24, 18);
        ctx2d.strokeRect(10, 24, 24, 18);

        ctx2d.restore();
      };

      fbAnimId = requestAnimationFrame(renderFallback);
      return () => {
        cancelAnimationFrame(fbAnimId);
        window.removeEventListener('keydown', onFbKeyDown);
        window.removeEventListener('keyup', onFbKeyUp);
        window.removeEventListener('resize', onFbResize);
      };
    }

    const onWebGLContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', onWebGLContextLost, false);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#D4845A');
    scene.fog = new THREE.FogExp2('#C47040', 0.018);

    // Studio PBR environment reflection via RoomEnvironment + PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 220);
    camera.position.set(0, 8.5, 13.5);
    camera.lookAt(0, 1.8, 0);

    // 3-Point Studio Rig with Warm Key + Cool Hemisphere Fill
    const hemiLight = new THREE.HemisphereLight('#FFD6A0', '#6B4423', 0.85);
    hemiLight.position.set(0, 25, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#FFB070', 2.2);
    keyLight.position.set(14, 24, 16);
    keyLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      // 512x512 hardware-accelerated PCFShadowMap with tight frustum (4x faster than 1024x1024 soft shadows)
      keyLight.shadow.mapSize.set(512, 512);
      keyLight.shadow.camera.near = 4;
      keyLight.shadow.camera.far = 52;
      const d = 16;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.radius = 1.5;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#00E5FF', 1.15);
    rimLight.position.set(-14, 12, -14);
    scene.add(rimLight);

    // Procedural Textures (Zero external 404s)
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    // 1. Brushed Metallic Pixel-Bevel Chassis Texture (matching o-Llama-Axiom-01..14)
    const checkerCanvas = document.createElement('canvas');
    checkerCanvas.width = 128;
    checkerCanvas.height = 128;
    const cCtx = checkerCanvas.getContext('2d')!;
    cCtx.fillStyle = '#05070B';
    cCtx.fillRect(0, 0, 128, 128);
    cCtx.fillStyle = '#455A64';
    cCtx.fillRect(4, 4, 120, 120);
    // Top & left metallic highlight bevel
    cCtx.fillStyle = '#B0BEC5';
    cCtx.fillRect(4, 4, 120, 10);
    cCtx.fillStyle = '#78909C';
    cCtx.fillRect(4, 14, 10, 110);
    // Subtle pixel steel grain
    cCtx.fillStyle = '#546E7A';
    for (let y = 20; y < 110; y += 16) {
      cCtx.fillRect(16, y, 96, 6);
    }
    const checkerTex = new THREE.CanvasTexture(checkerCanvas);
    checkerTex.colorSpace = THREE.SRGBColorSpace;
    checkerTex.magFilter = THREE.NearestFilter;
    checkerTex.anisotropy = maxAnisotropy;

    // 1b. Ribbed Metallic Caterpillar Tread Texture
    const treadCanvas = document.createElement('canvas');
    treadCanvas.width = 128;
    treadCanvas.height = 128;
    const tCtx = treadCanvas.getContext('2d')!;
    tCtx.fillStyle = '#10161C';
    tCtx.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 16) {
      tCtx.fillStyle = '#455A64';
      tCtx.fillRect(4, y + 2, 120, 11);
      tCtx.fillStyle = '#90A4AE';
      tCtx.fillRect(8, y + 3, 112, 5);
      tCtx.fillStyle = '#ECEFF1';
      tCtx.fillRect(88, y + 3, 28, 5);
    }
    const treadTex = new THREE.CanvasTexture(treadCanvas);
    treadTex.colorSpace = THREE.SRGBColorSpace;
    treadTex.wrapS = THREE.RepeatWrapping;
    treadTex.wrapT = THREE.RepeatWrapping;
    treadTex.magFilter = THREE.NearestFilter;
    treadTex.anisotropy = maxAnisotropy;

    // 2. Floor Grid / Wood Grain / Stone Procedural Texture
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const fCtx = floorCanvas.getContext('2d')!;
    const floorTex = new THREE.CanvasTexture(floorCanvas);
    floorTex.colorSpace = THREE.SRGBColorSpace;
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(8, 8);
    floorTex.anisotropy = maxAnisotropy;

    function paintFloorTexture(baseHex: string, gridHex: string, isWood: boolean) {
      fCtx.fillStyle = baseHex;
      fCtx.fillRect(0, 0, 512, 512);
      if (isWood) {
        fCtx.fillStyle = gridHex;
        for (let i = 0; i < 32; i++) {
          fCtx.globalAlpha = 0.22 + (i % 3) * 0.08;
          fCtx.fillRect(0, i * 16, 512, 4);
        }
        fCtx.globalAlpha = 1.0;
      } else {
        fCtx.strokeStyle = gridHex;
        fCtx.lineWidth = 4;
        fCtx.globalAlpha = 0.45;
        for (let i = 0; i <= 512; i += 64) {
          fCtx.beginPath();
          fCtx.moveTo(i, 0);
          fCtx.lineTo(i, 512);
          fCtx.stroke();
          fCtx.beginPath();
          fCtx.moveTo(0, i);
          fCtx.lineTo(512, i);
          fCtx.stroke();
        }
        fCtx.globalAlpha = 1.0;
      }
      floorTex.needsUpdate = true;
    }

    // 3. Dynamic o-Llama / AXIOM-7 Pixel Face Screen CanvasTexture (matching uploaded 14 poses)
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 256;
    faceCanvas.height = 192;
    const faceCtx = faceCanvas.getContext('2d')!;
    faceCtx.imageSmoothingEnabled = false;
    const faceTex = new THREE.CanvasTexture(faceCanvas);
    faceTex.colorSpace = THREE.SRGBColorSpace;
    faceTex.magFilter = THREE.NearestFilter;
    faceTex.minFilter = THREE.NearestFilter;
    faceTex.anisotropy = maxAnisotropy;

    // Helper for pixelated blocks on screen canvas
    function drawPixelRect(x: number, y: number, w: number, h: number, color: string) {
      faceCtx.fillStyle = color;
      faceCtx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }

    function drawAxiomScreen(
      exprId: ExpressionId,
      chassisMode: ChassisType,
      elapsed: number,
      celebrationTimer: number
    ) {
      // Deep Pitch-Black Screen #040609
      faceCtx.fillStyle = '#040609';
      faceCtx.fillRect(0, 0, 256, 192);

      // Truth Confirmed green screen edge flash
      if (celebrationTimer > 0) {
        faceCtx.strokeStyle = '#00E676';
        faceCtx.lineWidth = 10;
        faceCtx.strokeRect(5, 5, 246, 182);
      }

      const activeExpr: ExpressionId =
        celebrationTimer > 0.6
          ? 'EX-06'
          : chassisMode === 'cosmic' && exprId === 'EX-01'
          ? 'EX-04'
          : exprId;

      // Blinking cycle every 3.8s (10 · Blink)
      const blinkCycle = elapsed % 3.8;
      const isBlinking = blinkCycle > 3.62 && activeExpr !== 'EX-04' && activeExpr !== 'EX-08';

      const leftX = 76;
      const rightX = 180;
      const centerY = 96;

      if (activeExpr === 'EX-04') {
        // Cosmic Spiral Eye (7 concentric rotating rainbow rings)
        const ringColors = [
          '#8B00FF',
          '#0000FF',
          '#00FF00',
          '#FFFF00',
          '#FF8C00',
          '#FF0000',
          '#FFD700',
        ];
        faceCtx.save();
        faceCtx.translate(128, 96);
        ringColors.forEach((col, idx) => {
          const radius = 68 - idx * 8.5;
          faceCtx.strokeStyle = col;
          faceCtx.lineWidth = 6.5;
          faceCtx.beginPath();
          const startAng = elapsed * (idx % 2 === 0 ? 3.2 : -3.2) + idx * 0.5;
          faceCtx.arc(0, 0, Math.max(6, radius), startAng, startAng + Math.PI * 1.65);
          faceCtx.stroke();
        });
        faceCtx.fillStyle = '#FFD700';
        faceCtx.beginPath();
        faceCtx.arc(0, 0, 7, 0, Math.PI * 2);
        faceCtx.fill();
        faceCtx.restore();
      } else if (isBlinking) {
        // 10 · Blink: Thin horizontal cyan pixel line — —
        [leftX, rightX].forEach((cx) => {
          drawPixelRect(cx - 32, centerY - 5, 64, 10, '#00F0FF');
        });
      } else if (activeExpr === 'EX-08') {
        // 11 · Stille · vågen: Thicker rounded horizontal cyan pixel bars ▬ ▬
        [leftX, rightX].forEach((cx) => {
          drawPixelRect(cx - 28, centerY - 12, 56, 24, '#00F0FF');
          drawPixelRect(cx - 34, centerY - 8, 68, 16, '#00F0FF');
        });
      } else if (activeExpr === 'EX-01') {
        // 01 · Nysgerrig: Stepped Pixelated Cyan Circles ●● (#00F0FF)
        [leftX, rightX].forEach((cx) => {
          drawPixelRect(cx - 16, centerY - 32, 32, 8, '#00F0FF');
          drawPixelRect(cx - 24, centerY - 24, 48, 8, '#00F0FF');
          drawPixelRect(cx - 32, centerY - 16, 64, 32, '#00F0FF');
          drawPixelRect(cx - 24, centerY + 16, 48, 8, '#00F0FF');
          drawPixelRect(cx - 16, centerY + 24, 32, 8, '#00F0FF');
        });
      } else if (activeExpr === 'EX-02') {
        // 02 · Afventer / 03 · Gennemgår / 13 · Undersøger: Stepped Hollow Pixel Rings ○○
        [leftX, rightX].forEach((cx) => {
          drawPixelRect(cx - 16, centerY - 32, 32, 8, '#00F0FF');
          drawPixelRect(cx - 24, centerY - 24, 48, 8, '#00F0FF');
          drawPixelRect(cx - 32, centerY - 16, 64, 32, '#00F0FF');
          drawPixelRect(cx - 24, centerY + 16, 48, 8, '#00F0FF');
          drawPixelRect(cx - 16, centerY + 24, 32, 8, '#00F0FF');
          // Inner pitch-black hollow cutout
          drawPixelRect(cx - 16, centerY - 16, 32, 32, '#040609');
          drawPixelRect(cx - 8, centerY - 24, 16, 48, '#040609');
          drawPixelRect(cx - 24, centerY - 8, 48, 16, '#040609');
        });
      } else if (activeExpr === 'EX-03') {
        // WISE: Glowing Gold Pixel Orbs 🌕🌕 (#FFB300 + smile)
        [leftX, rightX].forEach((cx) => {
          drawPixelRect(cx - 16, centerY - 34, 32, 8, '#FFB300');
          drawPixelRect(cx - 24, centerY - 26, 48, 40, '#FFB300');
          drawPixelRect(cx - 16, centerY + 14, 32, 8, '#FFB300');
        });
        drawPixelRect(108, centerY + 34, 40, 8, '#FFB300');
        drawPixelRect(100, centerY + 26, 8, 8, '#FFB300');
        drawPixelRect(148, centerY + 26, 8, 8, '#FFB300');
      } else if (activeExpr === 'EX-05') {
        // 06 · Blokeret: Red Pixel Target Rings with solid square center dot ◉◉ (#FF1744)
        [leftX, rightX].forEach((cx) => {
          drawPixelRect(cx - 16, centerY - 32, 32, 8, '#FF1744');
          drawPixelRect(cx - 24, centerY - 24, 48, 8, '#FF1744');
          drawPixelRect(cx - 32, centerY - 16, 64, 32, '#FF1744');
          drawPixelRect(cx - 24, centerY + 16, 48, 8, '#FF1744');
          drawPixelRect(cx - 16, centerY + 24, 32, 8, '#FF1744');
          // Black ring cutout
          drawPixelRect(cx - 16, centerY - 16, 32, 32, '#040609');
          drawPixelRect(cx - 8, centerY - 24, 16, 48, '#040609');
          drawPixelRect(cx - 24, centerY - 8, 48, 16, '#040609');
          // Solid 14x14 Red Target Center Square
          drawPixelRect(cx - 7, centerY - 7, 14, 14, '#FF1744');
        });
      } else if (activeExpr === 'EX-06') {
        // 05 · Lille glæde / 14 · Afdæmpet glæde: Pixelated Cyan Arches ^^
        [leftX, rightX].forEach((cx) => {
          drawPixelRect(cx - 16, centerY - 20, 32, 12, '#00F0FF');
          drawPixelRect(cx - 24, centerY - 12, 12, 14, '#00F0FF');
          drawPixelRect(cx + 12, centerY - 12, 12, 14, '#00F0FF');
          drawPixelRect(cx - 32, centerY, 12, 18, '#00F0FF');
          drawPixelRect(cx + 20, centerY, 12, 18, '#00F0FF');
        });
      } else if (activeExpr === 'EX-07') {
        // 04 · Arbejder: Two 3x3 Cyan Pixel Block Matrices (### ###)
        [leftX, rightX].forEach((cx) => {
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const bx = cx - 30 + c * 22;
              const by = centerY - 28 + r * 20;
              drawPixelRect(bx, by, 16, 14, '#00F0FF');
            }
          }
        });
      }

      faceTex.needsUpdate = true;
    }

    // ============================================================================
    // BUILD UPGRADED o-Llama · AXIOM-7 3D RIG (Matching the 16 Uploaded Images)
    // ============================================================================
    const axiomRoot = new THREE.Group();
    scene.add(axiomRoot);

    // Contact shadow disc beneath o-Llama (y = 0.02)
    const contactShadowGeo = new THREE.CircleGeometry(1.5, 32);
    contactShadowGeo.rotateX(-Math.PI / 2);
    const contactShadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    contactShadow.position.y = 0.02;
    axiomRoot.add(contactShadow);

    const axiomBodyPivot = new THREE.Group();
    axiomRoot.add(axiomBodyPivot);

    // Brushed Steel & Slate Materials matching o-Llama-Axiom-01..14
    const chassisSteelMat = new THREE.MeshStandardMaterial({
      map: checkerTex,
      color: 0xffffff,
      roughness: 0.45,
      metalness: 0.55,
    });
    const bezelSteelMat = new THREE.MeshStandardMaterial({
      color: '#607D8B',
      roughness: 0.35,
      metalness: 0.65,
    });
    const silverHighlightMat = new THREE.MeshStandardMaterial({
      color: '#B0BEC5',
      roughness: 0.25,
      metalness: 0.78,
    });
    const frameDarkMat = new THREE.MeshStandardMaterial({
      color: '#1C262B',
      roughness: 0.5,
      metalness: 0.4,
    });
    const outlineBlackMat = new THREE.MeshBasicMaterial({
      color: '#05070B',
    });
    const treadPlateMat = new THREE.MeshStandardMaterial({
      map: treadTex,
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0.6,
    });
    const screenFaceMat = new THREE.MeshStandardMaterial({
      map: faceTex,
      emissive: '#ffffff',
      emissiveMap: faceTex,
      emissiveIntensity: 0.96,
      roughness: 0.1,
      metalness: 0.08,
    });
    const yellowBtnMat = new THREE.MeshStandardMaterial({
      color: '#FFD600',
      emissive: '#FFD600',
      emissiveIntensity: 0.4,
      roughness: 0.25,
      metalness: 0.2,
    });
    const redBtnMat = new THREE.MeshStandardMaterial({
      color: '#FF1744',
      emissive: '#FF1744',
      emissiveIntensity: 0.45,
      roughness: 0.22,
      metalness: 0.2,
    });
    const greenLedMat = new THREE.MeshStandardMaterial({
      color: '#00E676',
      emissive: '#00E676',
      emissiveIntensity: 0.9,
      roughness: 0.15,
      metalness: 0.1,
    });

    // Part 1: Main Torso Box (1.48 x 0.96 x 1.08) + Top Silver Bevel
    const mainChassisGeo = new THREE.BoxGeometry(1.48, 0.96, 1.08);
    const mainChassisMesh = new THREE.Mesh(mainChassisGeo, chassisSteelMat);
    mainChassisMesh.position.set(0, 0.88, 0);
    mainChassisMesh.castShadow = !isHeadless;
    mainChassisMesh.receiveShadow = !isHeadless;
    axiomBodyPivot.add(mainChassisMesh);

    // Part 2: Left Chest — Signature Yellow Cross (+) Button + Horizontal Slot Underneath
    const yellowPlusGroup = new THREE.Group();
    yellowPlusGroup.position.set(-0.32, 0.95, 0.55);
    // Black outline backing for the yellow cross
    yellowPlusGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.44, 0.05), outlineBlackMat));
    yellowPlusGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.18, 0.05), outlineBlackMat));
    // Bright Yellow Cross (#FFD600)
    yellowPlusGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.38, 0.09), yellowBtnMat));
    yellowPlusGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.09), yellowBtnMat));
    axiomBodyPivot.add(yellowPlusGroup);

    // Horizontal Dark Recessed Slot directly beneath Yellow Cross
    const chestSlotMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.08, 0.06),
      outlineBlackMat
    );
    chestSlotMesh.position.set(-0.32, 0.62, 0.54);
    axiomBodyPivot.add(chestSlotMesh);

    // Part 3 & 4: Right Chest — Recessed Vertical Panel with 3 Stacked Circular LEDs (Green -> Yellow -> Red)
    const rightPanelHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.72, 0.06),
      frameDarkMat
    );
    rightPanelHousing.position.set(0.34, 0.88, 0.54);
    axiomBodyPivot.add(rightPanelHousing);

    // 1. Top Large Glowing Green LED (#00E676)
    const topGreenLed = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), greenLedMat);
    topGreenLed.position.set(0.34, 1.07, 0.57);
    axiomBodyPivot.add(topGreenLed);

    // 2. Middle Medium Yellow LED (#FFD600)
    const midYellowLed = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 14), yellowBtnMat);
    midYellowLed.position.set(0.34, 0.86, 0.57);
    axiomBodyPivot.add(midYellowLed);

    // 3. Bottom Red Indicator Button/LED (#FF1744)
    const botRedLed = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 16), redBtnMat);
    botRedLed.position.set(0.34, 0.66, 0.57);
    axiomBodyPivot.add(botRedLed);

    // Part 5: Articulated Ball-Shoulder Arms & C-Shaped Pincer Claws
    function buildArticulatedArm(sideSign: -1 | 1): THREE.Group {
      const armRoot = new THREE.Group();
      armRoot.position.set(sideSign * 0.86, 1.12, 0.08);

      // Spherical Shoulder Ball Joint
      const shoulderBall = new THREE.Mesh(
        new THREE.SphereGeometry(0.19, 16, 16),
        bezelSteelMat
      );
      armRoot.add(shoulderBall);

      // Upper & Forearm Cylindrical Segments with Silver Collar
      const upperArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.15, 0.36, 14),
        bezelSteelMat
      );
      upperArm.position.set(sideSign * 0.06, -0.22, 0.06);
      upperArm.rotation.z = sideSign * 0.18;
      armRoot.add(upperArm);

      const silverCollar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.08, 14),
        silverHighlightMat
      );
      silverCollar.position.set(sideSign * 0.08, -0.34, 0.1);
      armRoot.add(silverCollar);

      // C-Shaped Pincer Claw Assembly
      const clawWrist = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.12, 0.24),
        silverHighlightMat
      );
      clawWrist.position.set(sideSign * 0.08, -0.44, 0.14);
      armRoot.add(clawWrist);

      const prongGeo = new THREE.BoxGeometry(0.08, 0.24, 0.22);
      const innerProng = new THREE.Mesh(prongGeo, silverHighlightMat);
      innerProng.position.set(sideSign * 0.08 - 0.09, -0.58, 0.16);
      innerProng.rotation.z = 0.15;
      armRoot.add(innerProng);

      const outerProng = new THREE.Mesh(prongGeo, bezelSteelMat);
      outerProng.position.set(sideSign * 0.08 + 0.09, -0.58, 0.16);
      outerProng.rotation.z = -0.15;
      armRoot.add(outerProng);

      return armRoot;
    }

    const leftGripperGroup = buildArticulatedArm(-1);
    axiomBodyPivot.add(leftGripperGroup);

    const rightGripperGroup = buildArticulatedArm(1);
    axiomBodyPivot.add(rightGripperGroup);

    // Deployable 3D Mini-Laptop for EX-07 Working ("Arbejder") State
    const laptopGroup = new THREE.Group();
    laptopGroup.position.set(0, 0.78, 0.82);
    const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.06, 0.65), bezelSteelMat);
    laptopGroup.add(laptopBase);
    const laptopScreen = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.58, 0.06), frameDarkMat);
    laptopScreen.position.set(0, 0.28, 0.28);
    laptopScreen.rotation.x = -0.25;
    laptopGroup.add(laptopScreen);
    const laptopLogoDot = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.08),
      silverHighlightMat
    );
    laptopLogoDot.position.set(0, 0.28, 0.3);
    laptopGroup.add(laptopLogoDot);
    laptopGroup.visible = false;
    axiomBodyPivot.add(laptopGroup);

    // Part 6: Segmented Cylindrical Neck Pivot (with metallic collar)
    const neckGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.34, 20);
    const neckMesh = new THREE.Mesh(neckGeo, bezelSteelMat);
    neckMesh.position.set(0, 1.48, 0);
    axiomBodyPivot.add(neckMesh);

    const neckCollarMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 0.08, 20),
      silverHighlightMat
    );
    neckCollarMesh.position.set(0, 1.44, 0);
    axiomBodyPivot.add(neckCollarMesh);

    // Part 7: Rounded-Bezel Head Assembly + Left/Right Circular Ear Hubs + Top Red Sensor Dome
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.16, 0);
    axiomBodyPivot.add(headGroup);

    const headHousingGeo = new THREE.BoxGeometry(1.94, 1.28, 1.06);
    const headHousingMesh = new THREE.Mesh(headHousingGeo, bezelSteelMat);
    headHousingMesh.castShadow = !isHeadless;
    headGroup.add(headHousingMesh);

    // Top Silver Specular Rim on Head
    const headTopRim = new THREE.Mesh(
      new THREE.BoxGeometry(1.96, 0.08, 1.08),
      silverHighlightMat
    );
    headTopRim.position.set(0, 0.62, 0);
    headGroup.add(headTopRim);

    // Top Red Sensor Dome + Specular Highlight Strip (matching o-Llama-Axiom-01..14)
    const topSensorBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.14, 0.44),
      outlineBlackMat
    );
    topSensorBase.position.set(0, 0.7, 0);
    headGroup.add(topSensorBase);

    const topSensorCap = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.16, 0.38), redBtnMat);
    topSensorCap.position.set(0, 0.73, 0);
    headGroup.add(topSensorCap);

    // Circular Ear-Joint Hubs on BOTH Left & Right Sides of Head
    const earRimGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.16, 20);
    earRimGeo.rotateZ(Math.PI / 2);
    const earInnerGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.19, 20);
    earInnerGeo.rotateZ(Math.PI / 2);

    const leftEarRim = new THREE.Mesh(earRimGeo, silverHighlightMat);
    leftEarRim.position.set(-1.02, -0.04, 0);
    headGroup.add(leftEarRim);
    const leftEarInner = new THREE.Mesh(earInnerGeo, frameDarkMat);
    leftEarInner.position.set(-1.02, -0.04, 0);
    headGroup.add(leftEarInner);

    const rightEarRim = new THREE.Mesh(earRimGeo, silverHighlightMat);
    rightEarRim.position.set(1.02, -0.04, 0);
    headGroup.add(rightEarRim);
    const rightEarInner = new THREE.Mesh(earInnerGeo, frameDarkMat);
    rightEarInner.position.set(1.02, -0.04, 0);
    headGroup.add(rightEarInner);

    // MonitorSide Tuner Knob (for Wizard/Cosmic)
    const sideKnobGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.24, 16);
    sideKnobGeo.rotateZ(Math.PI / 2);
    const sideKnobMesh = new THREE.Mesh(sideKnobGeo, yellowBtnMat);
    sideKnobMesh.position.set(1.06, -0.04, 0);
    headGroup.add(sideKnobMesh);

    const headBezelGeo = new THREE.BoxGeometry(1.74, 1.1, 0.08);
    const headBezelMesh = new THREE.Mesh(headBezelGeo, frameDarkMat);
    headBezelMesh.position.set(0, 0, 0.52);
    headGroup.add(headBezelMesh);

    const screenGeo = new THREE.PlaneGeometry(1.62, 0.98);
    const screenMesh = new THREE.Mesh(screenGeo, screenFaceMat);
    screenMesh.position.set(0, 0, 0.57);
    headGroup.add(screenMesh);

    // Secondary Rear Diagnostic Screen so active eye expression is also visible from behind in 3rd-person chase cam
    const rearBezelMesh = new THREE.Mesh(headBezelGeo, frameDarkMat);
    rearBezelMesh.position.set(0, 0, -0.52);
    headGroup.add(rearBezelMesh);

    const rearScreenMesh = new THREE.Mesh(screenGeo, screenFaceMat);
    rearScreenMesh.position.set(0, 0, -0.57);
    rearScreenMesh.rotation.y = Math.PI;
    headGroup.add(rearScreenMesh);

    // Part 9 & 10: Dual Caterpillar Tank Treads with 2 Side Road Wheels + Central Undercarriage Block
    const treadsGroup = new THREE.Group();
    axiomBodyPivot.add(treadsGroup);

    const treadBodyGeo = new THREE.BoxGeometry(0.54, 0.56, 1.58);
    const leftTread = new THREE.Mesh(treadBodyGeo, treadPlateMat);
    leftTread.position.set(-0.62, 0.3, 0);
    leftTread.castShadow = !isHeadless;
    treadsGroup.add(leftTread);

    const rightTread = new THREE.Mesh(treadBodyGeo, treadPlateMat);
    rightTread.position.set(0.62, 0.3, 0);
    rightTread.castShadow = !isHeadless;
    treadsGroup.add(rightTread);

    // Central Dark Undercarriage Block between treads
    const undercarriageMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.42, 1.12),
      frameDarkMat
    );
    undercarriageMesh.position.set(0, 0.32, 0);
    treadsGroup.add(undercarriageMesh);

    // Two Circular Side Road Wheels (O)(O) on Left and Right Treads
    const wheelRimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.08, 16);
    wheelRimGeo.rotateZ(Math.PI / 2);
    const wheelHubGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 12);
    wheelHubGeo.rotateZ(Math.PI / 2);

    [-0.9, 0.9].forEach((sideX) => {
      [-0.36, 0.36].forEach((wheelZ) => {
        const wRim = new THREE.Mesh(wheelRimGeo, bezelSteelMat);
        wRim.position.set(sideX, 0.28, wheelZ);
        treadsGroup.add(wRim);
        const wHub = new THREE.Mesh(wheelHubGeo, outlineBlackMat);
        wHub.position.set(sideX, 0.28, wheelZ);
        treadsGroup.add(wHub);
      });
    });

    // Part 11: Wizard Hat + Gold Buckle (Version B)
    const wizardHatGroup = new THREE.Group();
    wizardHatGroup.position.set(0, 0.65, 0);
    headGroup.add(wizardHatGroup);

    const purpleHatMat = new THREE.MeshStandardMaterial({
      color: '#6A0DAD',
      roughness: 0.8,
      metalness: 0.1,
    });
    const goldBuckleMat = new THREE.MeshStandardMaterial({
      color: '#FFD600',
      roughness: 0.2,
      metalness: 0.9,
    });

    const brimGeo = new THREE.CylinderGeometry(1.25, 1.35, 0.1, 24);
    const brimMesh = new THREE.Mesh(brimGeo, purpleHatMat);
    wizardHatGroup.add(brimMesh);

    const coneGeo = new THREE.ConeGeometry(0.78, 1.35, 24);
    const coneMesh = new THREE.Mesh(coneGeo, purpleHatMat);
    coneMesh.position.set(0, 0.7, 0);
    wizardHatGroup.add(coneMesh);

    const buckleBandGeo = new THREE.CylinderGeometry(0.68, 0.74, 0.18, 24);
    const buckleBand = new THREE.Mesh(buckleBandGeo, goldBuckleMat);
    buckleBand.position.set(0, 0.16, 0);
    wizardHatGroup.add(buckleBand);

    // Part 12: Articulated Arm + Magnifying Glass of Verification (Version B) & Cosmic Glow Ring (Version C)
    const propArmGroup = new THREE.Group();
    propArmGroup.position.set(-0.98, 0.95, 0.35);
    axiomBodyPivot.add(propArmGroup);

    const handleGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.65, 12);
    const handleMat = new THREE.MeshStandardMaterial({ color: '#5C3A1E', roughness: 0.75 });
    const handleMesh = new THREE.Mesh(handleGeo, handleMat);
    handleMesh.rotation.x = Math.PI / 4;
    propArmGroup.add(handleMesh);

    const lensRimGeo = new THREE.TorusGeometry(0.36, 0.055, 12, 24);
    const lensRimMat = new THREE.MeshStandardMaterial({
      color: '#B0BEC5',
      roughness: 0.25,
      metalness: 0.85,
    });
    const lensRimMesh = new THREE.Mesh(lensRimGeo, lensRimMat);
    lensRimMesh.position.set(0, 0.42, 0.42);
    propArmGroup.add(lensRimMesh);

    const lensGlassGeo = new THREE.CircleGeometry(0.34, 24);
    const lensGlassMat = new THREE.MeshStandardMaterial({
      color: '#00E5FF',
      emissive: '#00E5FF',
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const lensGlassMesh = new THREE.Mesh(lensGlassGeo, lensGlassMat);
    lensGlassMesh.position.set(0, 0.42, 0.42);
    propArmGroup.add(lensGlassMesh);

    // Cosmic Under-Glow Thruster Ring (Version C)
    const cosmicRingGeo = new THREE.TorusGeometry(0.85, 0.07, 12, 32);
    cosmicRingGeo.rotateX(Math.PI / 2);
    const cosmicRingMat = new THREE.MeshBasicMaterial({
      color: '#00E5FF',
    });
    const cosmicRingMesh = new THREE.Mesh(cosmicRingGeo, cosmicRingMat);
    cosmicRingMesh.position.set(0, 0.22, 0);
    axiomBodyPivot.add(cosmicRingMesh);

    // ============================================================================
    // PULSE SCAN RING & ENVIRONMENT GROUPS
    // ============================================================================
    const pulseWaveGeo = new THREE.RingGeometry(0.8, 1.15, 40);
    pulseWaveGeo.rotateX(-Math.PI / 2);
    const pulseWaveMat = new THREE.MeshBasicMaterial({
      color: '#00E5FF',
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const pulseWaveMesh = new THREE.Mesh(pulseWaveGeo, pulseWaveMat);
    pulseWaveMesh.position.y = 0.12;
    scene.add(pulseWaveMesh);

    // Main Arena Floor Platform
    const floorGeo = new THREE.CylinderGeometry(19.5, 20.5, 1.2, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      color: 0xffffff,
      roughness: 0.78,
      metalness: 0.15,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -0.6;
    floorMesh.receiveShadow = !isHeadless;
    scene.add(floorMesh);

    // Outer Arena Perimeter Rim
    const rimTorusGeo = new THREE.TorusGeometry(19.5, 0.35, 12, 64);
    rimTorusGeo.rotateX(Math.PI / 2);
    const rimTorusMat = new THREE.MeshStandardMaterial({
      color: '#00E5FF',
      emissive: '#00E5FF',
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.7,
    });
    const rimTorusMesh = new THREE.Mesh(rimTorusGeo, rimTorusMat);
    rimTorusMesh.position.y = 0.05;
    scene.add(rimTorusMesh);

    // Instanced Starfield & Floating Pixel Particles (>20 repeated objects -> InstancedMesh)
    const STAR_COUNT = 160;
    const starGeo = new THREE.OctahedronGeometry(0.18, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
    const starInstanced = new THREE.InstancedMesh(starGeo, starMat, STAR_COUNT);
    starInstanced.frustumCulled = false;
    const starPositions: { x: number; y: number; z: number; speed: number; scale: number }[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const ang = (i / STAR_COUNT) * Math.PI * 2 * 5;
      const rad = 22 + (i % 7) * 5.5;
      const sx = Math.cos(ang) * rad;
      const sy = 2 + (i % 12) * 1.8;
      const sz = Math.sin(ang) * rad;
      const sc = 0.6 + (i % 4) * 0.35;
      starPositions.push({ x: sx, y: sy, z: sz, speed: 0.8 + (i % 5) * 0.3, scale: sc });
      _dummyObj.position.set(sx, sy, sz);
      _dummyObj.scale.setScalar(sc);
      _dummyObj.updateMatrix();
      starInstanced.setMatrixAt(i, _dummyObj.matrix);
      _tempColor.set(i % 3 === 0 ? '#00E5FF' : i % 3 === 1 ? '#FFD600' : '#FFFFFF');
      starInstanced.setColorAt(i, _tempColor);
    }
    starInstanced.instanceMatrix.needsUpdate = true;
    if (starInstanced.instanceColor) starInstanced.instanceColor.needsUpdate = true;
    scene.add(starInstanced);

    // Zero-GC Pooled Particle Burst Ring Buffer (InstancedMesh of 60 cubes)
    const PARTICLE_COUNT = 60;
    const particleGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
    const particleMat = new THREE.MeshBasicMaterial({ color: '#00E5FF' });
    const particleInstanced = new THREE.InstancedMesh(particleGeo, particleMat, PARTICLE_COUNT);
    particleInstanced.frustumCulled = false;
    scene.add(particleInstanced);

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      active: false,
      x: 0,
      y: -100,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 0.5,
      color: '#00E5FF',
    }));
    let particleCursor = 0;

    function spawnParticleBurst(x: number, y: number, z: number, colorHex: string, count = 14) {
      for (let i = 0; i < count; i++) {
        const p = particles[particleCursor];
        particleCursor = (particleCursor + 1) % PARTICLE_COUNT;
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const speed = 3.5 + Math.random() * 6.5;
        p.active = true;
        p.x = x;
        p.y = y;
        p.z = z;
        p.vx = Math.cos(angle) * speed;
        p.vy = 2.5 + Math.random() * 4.5;
        p.vz = Math.sin(angle) * speed;
        p.life = 0.45 + Math.random() * 0.25;
        p.maxLife = p.life;
        p.color = colorHex;
      }
    }

    // Chapter Landmark Group (Rebuilt per chapter scene 1854..499)
    const landmarkGroup = new THREE.Group();
    scene.add(landmarkGroup);

    // Truth Tomes & Enemy Groups
    const tomesGroup = new THREE.Group();
    scene.add(tomesGroup);
    let activeTomes: TomeNode[] = [];

    const enemiesGroup = new THREE.Group();
    scene.add(enemiesGroup);
    let activeEnemies: { data: EnemyEntity; mesh: THREE.Group; telegraphMesh: THREE.Mesh }[] = [];

    // Pooled Projectile Orbs
    const projectilesGroup = new THREE.Group();
    scene.add(projectilesGroup);
    const projectileGeo = new THREE.SphereGeometry(0.32, 12, 12);
    const projectileMat = new THREE.MeshStandardMaterial({
      color: '#FF1744',
      emissive: '#FF1744',
      emissiveIntensity: 0.9,
    });
    const projectilePool: ProjectileOrb[] = Array.from({ length: 12 }, () => {
      const m = new THREE.Mesh(projectileGeo, projectileMat.clone());
      m.visible = false;
      projectilesGroup.add(m);
      return { active: false, x: 0, z: 0, vx: 0, vz: 0, reflected: false, mesh: m };
    });

    // Helper to build a 3-part Enemy Mesh + Ground Telegraph Ring
    function createEnemyVisual(archetype: EnemyArchetype): {
      group: THREE.Group;
      telegraph: THREE.Mesh;
    } {
      const group = new THREE.Group();

      const teleGeo = new THREE.RingGeometry(0.3, 1.5, 24);
      teleGeo.rotateX(-Math.PI / 2);
      const teleMat = new THREE.MeshBasicMaterial({
        color: '#FF1744',
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const telegraph = new THREE.Mesh(teleGeo, teleMat);
      telegraph.position.y = 0.04;
      group.add(telegraph);

      if (archetype === 'swarmer') {
        // Glitch Swarmer: Jagged dark core + red visor + spikes
        const coreMat = new THREE.MeshStandardMaterial({
          color: '#1A1A2E',
          roughness: 0.6,
          metalness: 0.3,
        });
        const visorMat = new THREE.MeshStandardMaterial({
          color: '#FF1744',
          emissive: '#FF1744',
          emissiveIntensity: 0.85,
          roughness: 0.2,
        });
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 0), coreMat);
        core.position.y = 0.8;
        group.add(core);

        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.22, 0.85), visorMat);
        visor.position.y = 0.85;
        group.add(visor);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.06, 8, 16), visorMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.45;
        group.add(ring);
      } else if (archetype === 'emitter') {
        // Fallacy Emitter: Floating purple obelisk + rotating fallacy rings
        const obeliskMat = new THREE.MeshStandardMaterial({
          color: '#4A1A8C',
          roughness: 0.35,
          metalness: 0.65,
        });
        const eyeMat = new THREE.MeshStandardMaterial({
          color: '#FFD600',
          emissive: '#FFD600',
          emissiveIntensity: 0.8,
        });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.65, 1.6, 8), obeliskMat);
        body.position.y = 1.0;
        group.add(body);

        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), eyeMat);
        eye.position.set(0, 1.35, 0.35);
        group.add(eye);

        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.06, 8, 20), eyeMat);
        halo.position.y = 1.35;
        group.add(halo);
      } else {
        // Dark Visor Juggernaut / Armored Warrior (Part 4.7)
        const armorMat = new THREE.MeshStandardMaterial({
          color: '#1A1A2E',
          roughness: 0.3,
          metalness: 0.8,
        });
        const visorMat = new THREE.MeshStandardMaterial({
          color: '#FF0000',
          emissive: '#FF0000',
          emissiveIntensity: 0.95,
        });
        const torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.3, 0.9), armorMat);
        torso.position.y = 0.85;
        group.add(torso);

        const helm = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.75, 0.85), armorMat);
        helm.position.y = 1.85;
        group.add(helm);

        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.2, 0.92), visorMat);
        visor.position.set(0, 1.88, 0.05);
        group.add(visor);
      }

      return { group, telegraph };
    }

    // Build Chapter Diorama Landmarks, Tomes, and Enemy Waves
    function loadChapterScene(idx: number) {
      const spec = CHAPTER_SCENES[idx] || CHAPTER_SCENES[0];

      scene.background = new THREE.Color(spec.skyColor);
      scene.fog = new THREE.FogExp2(spec.fogColor, 0.016);
      hemiLight.color.set(spec.hemiSkyColor);
      hemiLight.groundColor.set(spec.hemiGroundColor);
      keyLight.color.set(spec.keyLightColor);
      rimTorusMat.color.set(spec.accentColor);
      rimTorusMat.emissive.set(spec.accentColor);

      paintFloorTexture(spec.floorColor, spec.gridColor, idx === 0);

      // Clear previous landmarks
      while (landmarkGroup.children.length > 0) {
        landmarkGroup.remove(landmarkGroup.children[0]);
      }

      // Create chapter-specific iconic 3D landmarks (Part 4 Scene Specs)
      const pillarMat = new THREE.MeshStandardMaterial({
        color: spec.gridColor,
        roughness: 0.45,
        metalness: 0.5,
      });
      const accentGlowMat = new THREE.MeshStandardMaterial({
        color: spec.accentColor,
        emissive: spec.accentColor,
        emissiveIntensity: 0.65,
        roughness: 0.2,
      });

      if (idx === 5) {
        // Scene 499: The World Beyond — Central Pyramid Mountain with 5 glowing green gems + Golden Sun
        const mountainGeo = new THREE.ConeGeometry(8.5, 9.5, 4);
        const mountainMat = new THREE.MeshStandardMaterial({
          color: '#2D5A27',
          roughness: 0.85,
        });
        const mountain = new THREE.Mesh(mountainGeo, mountainMat);
        mountain.position.set(0, 4.5, -14.5);
        mountain.rotation.y = Math.PI / 4;
        landmarkGroup.add(mountain);

        // 5 Glowing Emerald Gems (#00FF7F)
        const gemGeo = new THREE.OctahedronGeometry(0.55, 0);
        const gemMat = new THREE.MeshStandardMaterial({
          color: '#00FF7F',
          emissive: '#00FF7F',
          emissiveIntensity: 0.9,
        });
        [
          [0, 6.5, -10.2],
          [-2.2, 4.2, -9.2],
          [2.2, 4.2, -9.2],
          [-1.2, 2.5, -8.5],
          [1.2, 2.5, -8.5],
        ].forEach(([gx, gy, gz]) => {
          const gem = new THREE.Mesh(gemGeo, gemMat);
          gem.position.set(gx, gy, gz);
          landmarkGroup.add(gem);
        });

        // Large Golden Sun in background
        const sunMesh = new THREE.Mesh(
          new THREE.SphereGeometry(3.8, 24, 24),
          new THREE.MeshBasicMaterial({ color: '#FFD700' })
        );
        sunMesh.position.set(0, 12.5, -24);
        landmarkGroup.add(sunMesh);
      } else {
        // 4 Foundational Pillars of Truth Monuments around the northern vista
        PILLAR_ORDER.forEach((pName, pIdx) => {
          const angle = -Math.PI * 0.75 + (pIdx / 3) * Math.PI * 0.5;
          const px = Math.cos(angle) * 14.5;
          const pz = Math.sin(angle) * 14.5;

          const colGroup = new THREE.Group();
          colGroup.position.set(px, 0, pz);

          const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 2.2), pillarMat);
          base.position.y = 0.3;
          colGroup.add(base);

          const bookStack = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 2.8, 1.2),
            new THREE.MeshStandardMaterial({
              color: PILLAR_COLORS[pName],
              roughness: 0.55,
            })
          );
          bookStack.position.y = 2.0;
          colGroup.add(bookStack);

          const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), accentGlowMat);
          beacon.position.y = 4.1;
          colGroup.add(beacon);

          landmarkGroup.add(colGroup);
        });
      }

      // Spawn Truth Tomes to collect/verify
      while (tomesGroup.children.length > 0) {
        tomesGroup.remove(tomesGroup.children[0]);
      }
      activeTomes = [];
      for (let i = 0; i < spec.targetTomes; i++) {
        const pillar = PILLAR_ORDER[i % 4];
        const ang = (i / spec.targetTomes) * Math.PI * 2 + 0.4;
        const rad = 6.5 + (i % 2) * 3.8;
        const tx = Math.cos(ang) * rad;
        const tz = Math.sin(ang) * rad;

        const tGroup = new THREE.Group();
        tGroup.position.set(tx, 0.9, tz);

        const coverMat = new THREE.MeshStandardMaterial({
          color: PILLAR_COLORS[pillar],
          roughness: 0.4,
          metalness: 0.2,
        });
        const pagesMat = new THREE.MeshStandardMaterial({
          color: '#FFF8E1',
          roughness: 0.7,
        });
        const haloMat = new THREE.MeshBasicMaterial({
          color: '#00C853',
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
        });

        const cover = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.24, 1.15), coverMat);
        tGroup.add(cover);

        const pages = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.18, 1.05), pagesMat);
        pages.position.y = 0.02;
        tGroup.add(pages);

        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.75, 0.92, 24).rotateX(-Math.PI / 2),
          haloMat
        );
        ring.position.y = -0.82;
        tGroup.add(ring);

        tomesGroup.add(tGroup);
        activeTomes.push({
          id: `tome-${i}`,
          pillar,
          color: PILLAR_COLORS[pillar],
          x: tx,
          z: tz,
          collected: false,
          claimIndex: i % spec.claims.length,
          mesh: tGroup,
        });
      }

      // Spawn initial Enemy Wave (3 distinct archetypes)
      while (enemiesGroup.children.length > 0) {
        enemiesGroup.remove(enemiesGroup.children[0]);
      }
      activeEnemies = [];
      const archetypes: EnemyArchetype[] = ['swarmer', 'emitter', 'charger'];
      const initialCount = Math.min(4, spec.targetPurges);
      for (let i = 0; i < initialCount; i++) {
        spawnEnemy(archetypes[i % 3], i);
      }
    }

    function spawnEnemy(archetype: EnemyArchetype, seedIdx: number) {
      const ang = (seedIdx * 1.7 + Math.random() * 0.8) % (Math.PI * 2);
      const rad = 11.5 + Math.random() * 4.0;
      const ex = Math.cos(ang) * rad;
      const ez = Math.sin(ang) * rad;
      const maxHp = archetype === 'charger' ? 95 : archetype === 'emitter' ? 70 : 55;

      const { group, telegraph } = createEnemyVisual(archetype);
      group.position.set(ex, 0, ez);
      enemiesGroup.add(group);

      activeEnemies.push({
        data: {
          id: `enemy-${Date.now()}-${Math.random()}`,
          archetype,
          x: ex,
          z: ez,
          vx: 0,
          vz: 0,
          hp: maxHp,
          maxHp,
          radius: archetype === 'charger' ? 1.05 : 0.85,
          state: 'patrol',
          timer: 0.9 + (seedIdx % 3) * 0.4,
          targetX: 0,
          targetZ: 0,
          hitFlash: 0,
          koProgress: 0,
          zigzagPhase: seedIdx * 1.2,
        },
        mesh: group,
        telegraphMesh: telegraph,
      });
    }

    // Player & Simulation Mutable State
    const simState = {
      playerX: 0,
      playerZ: 3.5, // Spawn on open path facing camera in 3/4 view
      playerRotY: -0.22,
      vx: 0,
      vz: 0,
      hp: 5,
      maxHp: 5,
      score: 0,
      tomesCollected: 0,
      purgesCount: 0,
      pillarsUnlocked: [] as PillarName[],
      pulseCooldownTimer: 0,
      dashCooldownTimer: 0,
      invulnTimer: 0,
      hitstopTimer: 0,
      cameraTrauma: 0,
      pulseWaveProgress: 0,
      pulseWaveMaxRadius: 6.5,
      celebrationTimer: 0,
      scaleX: 1,
      scaleY: 1,
      walkDistance: 0,
      spawnCheckTimer: 1.5,
      chapterCompleteFired: false,
    };

    // Unified Input Hub (Held vs JustPressed + Window Blur Reset)
    const keysHeld = new Set<string>();
    const keysJustPressed = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if typing inside an input/textarea/select
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const code = e.code;
      if (!keysHeld.has(code)) {
        keysJustPressed.add(code);
      }
      keysHeld.add(code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeld.delete(e.code);
    };

    const clearInputs = () => {
      keysHeld.clear();
      keysJustPressed.clear();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearInputs);

    // Pre-load Chapter 0
    loadChapterScene(propsRef.current.chapterIndex);
    externalCommandRef.current.lastChapterIndex = propsRef.current.chapterIndex;
    externalCommandRef.current.lastResetCount = propsRef.current.sessionResetCount;
    renderer.compile(scene, camera);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Trigger Player Pulse Scan Attack
    function triggerPlayerPulse(ignoreCooldown = false) {
      if (!ignoreCooldown && simState.pulseCooldownTimer > 0) return;
      const cSpec = CHASSIS_SPECS[propsRef.current.chassis];
      simState.pulseCooldownTimer =
        propsRef.current.expression === 'EX-07'
          ? cSpec.pulseCooldown * 0.75
          : cSpec.pulseCooldown;
      simState.pulseWaveProgress = 0.01;
      simState.pulseWaveMaxRadius =
        propsRef.current.expression === 'EX-02'
          ? cSpec.pulseRadius * 1.25
          : cSpec.pulseRadius;

      // Squash & stretch on pulse release
      simState.scaleX = 1.22;
      simState.scaleY = 0.82;
      soundSynth.playPulseScan(propsRef.current.chassis);

      // Reflect nearby projectiles if in Wizard or Cosmic mode
      projectilePool.forEach((orb) => {
        if (!orb.active || orb.reflected) return;
        const d = Math.hypot(orb.x - simState.playerX, orb.z - simState.playerZ);
        if (d <= simState.pulseWaveMaxRadius) {
          orb.reflected = true;
          orb.vx = -orb.vx * 1.5;
          orb.vz = -orb.vz * 1.5;
          (orb.mesh.material as THREE.MeshStandardMaterial).color.set('#00E5FF');
          (orb.mesh.material as THREE.MeshStandardMaterial).emissive.set('#00E5FF');
        }
      });

      // Check damage against active enemies
      let hitAny = false;
      let killedAny = false;
      activeEnemies.forEach((entry) => {
        if (entry.data.state === 'ko') return;
        const dist = Math.hypot(
          entry.data.x - simState.playerX,
          entry.data.z - simState.playerZ
        );
        const dmgRes = computeWasmPulseDamage(
          propsRef.current.chassis,
          propsRef.current.expression,
          dist
        );
        if (dmgRes.hit) {
          hitAny = true;
          entry.data.hp -= dmgRes.damage;
          entry.data.hitFlash = 0.14;
          const pushAngle = Math.atan2(
            entry.data.z - simState.playerZ,
            entry.data.x - simState.playerX
          );
          entry.data.x += Math.cos(pushAngle) * 0.9;
          entry.data.z += Math.sin(pushAngle) * 0.9;

          spawnParticleBurst(entry.data.x, 1.0, entry.data.z, '#00E5FF', 10);

          if (entry.data.hp <= 0) {
            killedAny = true;
            entry.data.state = 'ko';
            entry.data.koProgress = 0;
            entry.data.vx = Math.cos(pushAngle) * 8.5;
            entry.data.vz = Math.sin(pushAngle) * 8.5;
            simState.purgesCount += 1;
            simState.score += propsRef.current.expression === 'EX-03' ? 180 : 150;
            spawnParticleBurst(entry.data.x, 1.2, entry.data.z, '#FFD600', 22);
          }
        }
      });

      if (killedAny) {
        simState.hitstopTimer = 0.055; // 55ms heavy hitstop
        simState.cameraTrauma = Math.min(1, simState.cameraTrauma + 0.45);
        soundSynth.playEnemyHit(true);
      } else if (hitAny) {
        simState.hitstopTimer = 0.025;
        simState.cameraTrauma = Math.min(1, simState.cameraTrauma + 0.2);
        soundSynth.playEnemyHit(false);
      }
    }

    // Tactical Sector Sweep [Q]: Dashes to nearest uncollected Tome or active Anomaly and fires a Truth Pulse
    function triggerTacticalSectorSweep() {
      const cScene = CHAPTER_SCENES[propsRef.current.chapterIndex] || CHAPTER_SCENES[0];
      const nextTome = activeTomes.find((t) => !t.collected);
      const nextEnemy = activeEnemies.find((e) => e.data.state !== 'ko');

      if (nextTome) {
        simState.playerX = nextTome.x;
        simState.playerZ = nextTome.z;
        nextTome.collected = true;
        nextTome.mesh.visible = false;
        simState.tomesCollected += 1;
        simState.score += 200;
        if (!simState.pillarsUnlocked.includes(nextTome.pillar)) {
          simState.pillarsUnlocked = [...simState.pillarsUnlocked, nextTome.pillar];
        }
        simState.celebrationTimer = 1.2;
        soundSynth.playTomePickup();
        spawnParticleBurst(nextTome.x, 1.0, nextTome.z, '#00C853', 18);
      } else if (nextEnemy) {
        simState.playerX = nextEnemy.data.x * 0.85;
        simState.playerZ = nextEnemy.data.z * 0.85;
        soundSynth.playDash();
      } else if (simState.purgesCount < cScene.targetPurges) {
        const types: EnemyArchetype[] = ['swarmer', 'emitter', 'charger'];
        spawnEnemy(types[simState.purgesCount % 3], simState.purgesCount);
        const newlySpawned = activeEnemies[activeEnemies.length - 1];
        if (newlySpawned) {
          simState.playerX = newlySpawned.data.x * 0.85;
          simState.playerZ = newlySpawned.data.z * 0.85;
        }
      }
      triggerPlayerPulse(true);
    }

    let animFrameId = 0;
    let softwareTimerId = 0;
    let isDisposed = false;
    let lastTime = performance.now();
    let hudSyncAccumulator = 0;

    function afterDraw(cb: () => void) {
      if (isDisposed || !renderer) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (isDisposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            softwareTimerId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            softwareTimerId = window.setTimeout(cb, 80);
          }
        };
        softwareTimerId = window.setTimeout(poll, 5);
      } else {
        softwareTimerId = window.setTimeout(cb, 80);
      }
    }

    const animate = () => {
      if (isDisposed) return;
      const now = performance.now();
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = clampDeltaTime(rawDt);
      const elapsed = now / 1000;

      const currentProps = propsRef.current;

      // Detect chapter switch OR explicit session reset (Start / Restart / Try Again)
      if (
        externalCommandRef.current.lastChapterIndex !== currentProps.chapterIndex ||
        externalCommandRef.current.lastResetCount !== currentProps.sessionResetCount
      ) {
        externalCommandRef.current.lastChapterIndex = currentProps.chapterIndex;
        externalCommandRef.current.lastResetCount = currentProps.sessionResetCount;
        simState.playerX = 0;
        simState.playerZ = 3.5;
        simState.playerRotY = -0.22;
        simState.vx = 0;
        simState.vz = 0;
        simState.hp = 5;
        simState.tomesCollected = 0;
        simState.purgesCount = 0;
        simState.pillarsUnlocked = [];
        simState.chapterCompleteFired = false;
        loadChapterScene(currentProps.chapterIndex);
        const cSpec = CHAPTER_SCENES[currentProps.chapterIndex] || CHAPTER_SCENES[0];
        currentProps.onUpdateSnapshot({
          hp: simState.hp,
          maxHp: simState.maxHp,
          score: simState.score,
          tomesCollected: 0,
          targetTomes: cSpec.targetTomes,
          purgesCount: 0,
          targetPurges: cSpec.targetPurges,
          pillarsUnlocked: [],
          nearbyTomeClaimIndex: null,
        });
      }

      // Detect UI button pulse trigger
      if (currentProps.pulseTriggerCount !== externalCommandRef.current.lastPulseCount) {
        externalCommandRef.current.lastPulseCount = currentProps.pulseTriggerCount;
        triggerPlayerPulse(true);
      }

      // Detect Tactical Sector Sweep trigger
      if (currentProps.sweepTriggerCount !== externalCommandRef.current.lastSweepCount) {
        externalCommandRef.current.lastSweepCount = currentProps.sweepTriggerCount;
        triggerTacticalSectorSweep();
      }

      // Detect Truth Analyzer verification celebration
      if (
        currentProps.verifiedCelebrationCount !==
        externalCommandRef.current.lastCelebrationCount
      ) {
        externalCommandRef.current.lastCelebrationCount =
          currentProps.verifiedCelebrationCount;
        simState.celebrationTimer = 2.0;
        simState.score += 250;
        simState.hp = Math.min(simState.maxHp, simState.hp + 1);
        spawnParticleBurst(simState.playerX, 2.2, simState.playerZ, '#00C853', 24);
      }

      if (simState.celebrationTimer > 0) {
        simState.celebrationTimer = Math.max(0, simState.celebrationTimer - dt);
      }

      // Update AXIOM-7 3D Chassis Appearance based on selected form (tank / wizard / cosmic)
      const isTank = currentProps.chassis === 'tank';
      const isWizard = currentProps.chassis === 'wizard';
      const isCosmic = currentProps.chassis === 'cosmic';

      wizardHatGroup.visible = isWizard;
      propArmGroup.visible = isWizard;
      sideKnobMesh.visible = isWizard || isCosmic;
      cosmicRingMesh.visible = isCosmic;
      treadsGroup.visible = !isCosmic;

      // Head proportions (Landscape 6x4 for Tank vs Square Monitor 4x4 for Wizard/Cosmic)
      const targetHeadScaleX = isTank ? 1.08 : 0.88;
      const targetHeadScaleY = isTank ? 0.96 : 1.08;
      headGroup.scale.x = dampValue(headGroup.scale.x, targetHeadScaleX, 12, dt);
      headGroup.scale.y = dampValue(headGroup.scale.y, targetHeadScaleY, 12, dt);

      // o-Llama Body Language Postures (Grippers, Head Tilt & Mini-Laptop in EX-07)
      const isWorking = currentProps.expression === 'EX-07';
      const isFocused = currentProps.expression === 'EX-02';
      const isHappy = currentProps.expression === 'EX-06' || simState.celebrationTimer > 0;
      laptopGroup.visible = isWorking;

      // Head tilt per expression (curious slight tilt, focused inviting, happy nod)
      const targetHeadRotZ =
        currentProps.expression === 'EX-01'
          ? 0.07 * Math.sin(elapsed * 1.5)
          : isHappy
          ? 0.1 * Math.sin(elapsed * 8)
          : 0;
      headGroup.rotation.z = dampValue(headGroup.rotation.z, targetHeadRotZ, 10, dt);

      // Left & Right Claw Gripper postures
      leftGripperGroup.rotation.x = dampValue(
        leftGripperGroup.rotation.x,
        isHappy ? -2.2 : isFocused ? -0.75 : isWorking ? -0.55 : -0.15,
        10,
        dt
      );
      rightGripperGroup.rotation.x = dampValue(
        rightGripperGroup.rotation.x,
        isHappy ? -2.2 : isWorking ? -0.55 : -0.15,
        10,
        dt
      );

      // Update Face CanvasTexture
      drawAxiomScreen(
        currentProps.expression,
        currentProps.chassis,
        elapsed,
        simState.celebrationTimer
      );

      // Animate Instanced Starfield subtly
      for (let i = 0; i < STAR_COUNT; i++) {
        const sp = starPositions[i];
        _dummyObj.position.set(
          sp.x,
          sp.y + Math.sin(elapsed * sp.speed + i) * 0.35,
          sp.z
        );
        _dummyObj.rotation.y = elapsed * 0.5 + i;
        _dummyObj.scale.setScalar(sp.scale);
        _dummyObj.updateMatrix();
        starInstanced.setMatrixAt(i, _dummyObj.matrix);
      }
      starInstanced.instanceMatrix.needsUpdate = true;

      // Update Pooled Burst Particles
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];
        if (p.active) {
          p.life -= dt;
          if (p.life <= 0) {
            p.active = false;
            _dummyObj.position.set(0, -100, 0);
            _dummyObj.scale.setScalar(0.001);
          } else {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.z += p.vz * dt;
            p.vy -= 9.8 * dt;
            _dummyObj.position.set(p.x, Math.max(0.1, p.y), p.z);
            _dummyObj.rotation.x += dt * 6;
            _dummyObj.rotation.y += dt * 6;
            _dummyObj.scale.setScalar((p.life / p.maxLife) * 1.2);
            _tempColor.set(p.color);
            particleInstanced.setColorAt(i, _tempColor);
          }
          _dummyObj.updateMatrix();
          particleInstanced.setMatrixAt(i, _dummyObj.matrix);
        }
      }
      particleInstanced.instanceMatrix.needsUpdate = true;
      if (particleInstanced.instanceColor) particleInstanced.instanceColor.needsUpdate = true;

      // ============================================================================
      // STATE-BASED CAMERA & SIMULATION STEP
      // ============================================================================
      if (currentProps.status === 'title') {
        // Diegetic In-World Awakening Showcase (Scene 1854) — Framed on Right Third facing camera
        axiomRoot.position.set(2.2, 0, 1.5);
        axiomRoot.rotation.y = -0.35 + Math.sin(elapsed * 0.85) * 0.25;
        axiomBodyPivot.position.y = isCosmic ? 0.35 + Math.sin(elapsed * 3) * 0.12 : 0;

        _camTargetPos.set(0.2 + Math.sin(elapsed * 0.35) * 0.8, 2.85, 7.6);
        _camLookAt.set(0.6, 1.65, 0.5);
        camera.position.lerp(_camTargetPos, 1 - Math.exp(-6 * dt));
        camera.lookAt(_camLookAt);

        keysJustPressed.clear();
        renderer.render(scene, camera);
        return;
      }

      const isSimPaused =
        currentProps.status !== 'playing' ||
        currentProps.terminalOpen ||
        currentProps.codexOpen;

      if (!isSimPaused) {
        // Tick Hitstop (rendering & camera shake continue, physics pause during hitstop)
        if (simState.hitstopTimer > 0) {
          simState.hitstopTimer = Math.max(0, simState.hitstopTimer - dt);
        } else {
          const simDt = dt;

          if (simState.pulseCooldownTimer > 0) {
            simState.pulseCooldownTimer = Math.max(0, simState.pulseCooldownTimer - simDt);
          }
          if (simState.dashCooldownTimer > 0) {
            simState.dashCooldownTimer = Math.max(0, simState.dashCooldownTimer - simDt);
          }
          if (simState.invulnTimer > 0) {
            simState.invulnTimer = Math.max(0, simState.invulnTimer - simDt);
          }

          // Player Movement Input (WASD / Arrow Keys)
          let moveX = 0;
          let moveZ = 0;
          if (keysHeld.has('KeyW') || keysHeld.has('ArrowUp')) moveZ -= 1;
          if (keysHeld.has('KeyS') || keysHeld.has('ArrowDown')) moveZ += 1;
          if (keysHeld.has('KeyA') || keysHeld.has('ArrowLeft')) moveX -= 1;
          if (keysHeld.has('KeyD') || keysHeld.has('ArrowRight')) moveX += 1;

          const moveLen = Math.hypot(moveX, moveZ);
          const cSpec = CHASSIS_SPECS[currentProps.chassis];
          let currentSpeed = cSpec.speed;

          // Edge-triggered Dash (ShiftLeft / ShiftRight)
          if (
            (keysJustPressed.has('ShiftLeft') || keysJustPressed.has('ShiftRight')) &&
            simState.dashCooldownTimer <= 0
          ) {
            simState.dashCooldownTimer = 0.9;
            const dashAngle = moveLen > 0 ? Math.atan2(moveX, moveZ) : simState.playerRotY;
            simState.playerX += Math.sin(dashAngle) * 3.2;
            simState.playerZ += Math.cos(dashAngle) * 3.2;
            simState.scaleX = 0.82;
            simState.scaleY = 1.22;
            soundSynth.playDash();
            spawnParticleBurst(simState.playerX, 0.5, simState.playerZ, '#00E5FF', 8);
          }

          // Edge-triggered Pulse Scan (Space) or Tactical Sector Sweep (Q)
          if (keysJustPressed.has('Space')) {
            triggerPlayerPulse();
          }
          if (keysJustPressed.has('KeyQ')) {
            triggerTacticalSectorSweep();
          }

          if (moveLen > 0) {
            moveX /= moveLen;
            moveZ /= moveLen;
            simState.vx = dampValue(simState.vx, moveX * currentSpeed, 14, simDt);
            simState.vz = dampValue(simState.vz, moveZ * currentSpeed, 14, simDt);
            const desiredRot = Math.atan2(moveX, moveZ);
            // Shortest angle interpolation
            let diff = desiredRot - simState.playerRotY;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            simState.playerRotY += diff * (1 - Math.exp(-14 * simDt));
          } else {
            simState.vx = dampValue(simState.vx, 0, 12, simDt);
            simState.vz = dampValue(simState.vz, 0, 12, simDt);
          }

          simState.playerX += simState.vx * simDt;
          simState.playerZ += simState.vz * simDt;
          simState.walkDistance += Math.hypot(simState.vx, simState.vz) * simDt;

          // Keep player within arena perimeter
          const pDist = Math.hypot(simState.playerX, simState.playerZ);
          if (pDist > 17.5) {
            simState.playerX = (simState.playerX / pDist) * 17.5;
            simState.playerZ = (simState.playerZ / pDist) * 17.5;
          }

          // Squash & Stretch recovery
          simState.scaleX = dampValue(simState.scaleX, 1, 12, simDt);
          simState.scaleY = dampValue(simState.scaleY, 1, 12, simDt);

          // Check Tome Collection & Inspection
          const pickupRad = currentProps.expression === 'EX-01' ? 2.35 : 1.85;
          let closestTomeClaim: number | null = null;

          activeTomes.forEach((tome) => {
            if (tome.collected) return;
            tome.mesh.rotation.y += simDt * 1.4;
            tome.mesh.position.y = 0.85 + Math.sin(elapsed * 3 + tome.x) * 0.16;

            const distToTome = Math.hypot(
              tome.x - simState.playerX,
              tome.z - simState.playerZ
            );
            if (distToTome < 3.4) {
              closestTomeClaim = tome.claimIndex;
            }
            if (distToTome < pickupRad) {
              tome.collected = true;
              tome.mesh.visible = false;
              simState.tomesCollected += 1;
              simState.score += 200;
              if (!simState.pillarsUnlocked.includes(tome.pillar)) {
                simState.pillarsUnlocked = [...simState.pillarsUnlocked, tome.pillar];
              }
              simState.celebrationTimer = 1.2;
              soundSynth.playTomePickup();
              spawnParticleBurst(tome.x, 1.0, tome.z, '#00C853', 18);
            }
          });

          // Enemy Crowd Attack Token Pool (max 2 concurrent attackers in windup/active)
          const activeAttackersCount = activeEnemies.filter(
            (e) => e.data.state === 'windup' || e.data.state === 'active'
          ).length;
          let availableTokens = Math.max(0, 2 - activeAttackersCount);

          let anyEnemyInWindup = false;

          // Step Enemies
          for (let i = activeEnemies.length - 1; i >= 0; i--) {
            const entry = activeEnemies[i];
            const res = stepEnemyAI(
              entry.data,
              simState.playerX,
              simState.playerZ,
              simDt,
              availableTokens > 0
            );
            if (entry.data.state === 'patrol' && res.enemy.state === 'windup') {
              availableTokens = Math.max(0, availableTokens - 1);
            }
            entry.data = res.enemy;

            if (entry.data.state === 'windup') {
              anyEnemyInWindup = true;
            }

            // Update visual transform & KO topple
            entry.mesh.position.set(entry.data.x, 0, entry.data.z);
            entry.mesh.lookAt(simState.playerX, 0, simState.playerZ);

            // Telegraph ring visibility
            const teleMat = entry.telegraphMesh.material as THREE.MeshBasicMaterial;
            if (entry.data.state === 'windup') {
              teleMat.opacity = 0.55 + Math.sin(elapsed * 22) * 0.25;
              const s = 1 + (1 - entry.data.timer / 0.7) * 0.45;
              entry.telegraphMesh.scale.setScalar(s);
            } else {
              teleMat.opacity = 0;
            }

            if (entry.data.state === 'ko') {
              entry.mesh.rotation.x = entry.data.koProgress * (Math.PI / 2);
              entry.mesh.scale.setScalar(Math.max(0.01, 1 - entry.data.koProgress));
              if (entry.data.koProgress >= 1) {
                enemiesGroup.remove(entry.mesh);
                activeEnemies.splice(i, 1);
                continue;
              }
            }

            // Handle fired projectile from Emitter
            if (res.firedProjectile) {
              const freeOrb = projectilePool.find((o) => !o.active);
              if (freeOrb) {
                const pdx = simState.playerX - entry.data.x;
                const pdz = simState.playerZ - entry.data.z;
                const pdist = Math.hypot(pdx, pdz) || 1;
                freeOrb.active = true;
                freeOrb.reflected = false;
                freeOrb.x = entry.data.x;
                freeOrb.z = entry.data.z;
                freeOrb.vx = (pdx / pdist) * 9.5;
                freeOrb.vz = (pdz / pdist) * 9.5;
                freeOrb.mesh.position.set(freeOrb.x, 1.1, freeOrb.z);
                freeOrb.mesh.visible = true;
                (freeOrb.mesh.material as THREE.MeshStandardMaterial).color.set('#FF1744');
                (freeOrb.mesh.material as THREE.MeshStandardMaterial).emissive.set('#FF1744');
              }
            }

            // Handle Melee Damage to Player
            if (res.dealtMeleeHit && simState.invulnTimer <= 0) {
              simState.hp = Math.max(0, simState.hp - 1);
              simState.invulnTimer = 1.15;
              simState.hitstopTimer = 0.05;
              simState.cameraTrauma = 0.65;
              soundSynth.playPlayerHurt();
              spawnParticleBurst(simState.playerX, 1.2, simState.playerZ, '#FF1744', 16);
              if (simState.hp <= 0) {
                currentProps.onGameOver();
              }
            }
          }

          // Step Projectiles
          projectilePool.forEach((orb) => {
            if (!orb.active) return;
            orb.x += orb.vx * simDt;
            orb.z += orb.vz * simDt;
            orb.mesh.position.set(orb.x, 1.1, orb.z);

            if (Math.hypot(orb.x, orb.z) > 22) {
              orb.active = false;
              orb.mesh.visible = false;
              return;
            }

            if (!orb.reflected) {
              const dPlayer = Math.hypot(orb.x - simState.playerX, orb.z - simState.playerZ);
              // Wizard EX-03 auto-reflects orbs in front
              if (dPlayer < 1.35 && currentProps.expression === 'EX-03') {
                orb.reflected = true;
                orb.vx = -orb.vx * 1.4;
                orb.vz = -orb.vz * 1.4;
                (orb.mesh.material as THREE.MeshStandardMaterial).color.set('#FFD600');
                return;
              }
              if (dPlayer < 1.05 && simState.invulnTimer <= 0) {
                orb.active = false;
                orb.mesh.visible = false;
                simState.hp = Math.max(0, simState.hp - 1);
                simState.invulnTimer = 1.15;
                simState.cameraTrauma = 0.55;
                soundSynth.playPlayerHurt();
                spawnParticleBurst(simState.playerX, 1.1, simState.playerZ, '#FF1744', 14);
                if (simState.hp <= 0) {
                  currentProps.onGameOver();
                }
              }
            } else {
              // Reflected orb damages enemies
              activeEnemies.forEach((entry) => {
                if (entry.data.state === 'ko') return;
                if (Math.hypot(orb.x - entry.data.x, orb.z - entry.data.z) < 1.25) {
                  orb.active = false;
                  orb.mesh.visible = false;
                  entry.data.hp = 0;
                  entry.data.state = 'ko';
                  simState.purgesCount += 1;
                  simState.score += 200;
                  soundSynth.playEnemyHit(true);
                  spawnParticleBurst(entry.data.x, 1.2, entry.data.z, '#FFD600', 20);
                }
              });
            }
          });

          // Respawn enemies if needed to let player reach chapter purge goal
          const cScene = CHAPTER_SCENES[currentProps.chapterIndex] || CHAPTER_SCENES[0];
          simState.spawnCheckTimer -= simDt;
          if (
            simState.spawnCheckTimer <= 0 &&
            activeEnemies.length < 3 &&
            simState.purgesCount + activeEnemies.length < cScene.targetPurges + 2
          ) {
            simState.spawnCheckTimer = 2.4;
            const types: EnemyArchetype[] = ['swarmer', 'emitter', 'charger'];
            spawnEnemy(types[simState.purgesCount % 3], simState.purgesCount);
          }

          // Check Chapter Victory Condition (fire once per chapter completion)
          if (
            !simState.chapterCompleteFired &&
            checkChapterVictory({
              tomesCollected: simState.tomesCollected,
              targetTomes: cScene.targetTomes,
              purgesCount: simState.purgesCount,
              targetPurges: cScene.targetPurges,
            })
          ) {
            simState.chapterCompleteFired = true;
            currentProps.onUpdateSnapshot({
              hp: simState.hp,
              maxHp: simState.maxHp,
              score: simState.score,
              tomesCollected: simState.tomesCollected,
              targetTomes: cScene.targetTomes,
              purgesCount: simState.purgesCount,
              targetPurges: cScene.targetPurges,
              pillarsUnlocked: simState.pillarsUnlocked,
              nearbyTomeClaimIndex: closestTomeClaim,
            });
            soundSynth.playTruthVerified(true);
            currentProps.onChapterComplete();
          }

          // Throttled HUD Snapshot sync (~10Hz)
          hudSyncAccumulator += simDt;
          if (hudSyncAccumulator >= 0.1) {
            hudSyncAccumulator = 0;
            currentProps.onUpdateSnapshot({
              hp: simState.hp,
              maxHp: simState.maxHp,
              score: simState.score,
              tomesCollected: simState.tomesCollected,
              targetTomes: cScene.targetTomes,
              purgesCount: simState.purgesCount,
              targetPurges: cScene.targetPurges,
              pillarsUnlocked: simState.pillarsUnlocked,
              nearbyTomeClaimIndex: closestTomeClaim,
            });
          }

          void anyEnemyInWindup;
        }
      }

      // Update Pulse Wave Ring Expansion
      if (simState.pulseWaveProgress > 0) {
        simState.pulseWaveProgress += dt * 3.6;
        if (simState.pulseWaveProgress >= 1) {
          simState.pulseWaveProgress = 0;
          pulseWaveMat.opacity = 0;
        } else {
          pulseWaveMesh.position.set(simState.playerX, 0.15, simState.playerZ);
          const s = 0.5 + simState.pulseWaveProgress * simState.pulseWaveMaxRadius;
          pulseWaveMesh.scale.setScalar(s);
          pulseWaveMat.opacity = (1 - simState.pulseWaveProgress) * 0.75;
          pulseWaveMat.color.set(
            currentProps.chassis === 'cosmic'
              ? '#00BFA5'
              : currentProps.chassis === 'wizard'
              ? '#FFB300'
              : '#00E5FF'
          );
        }
      }

      // Position AXIOM-7 Root + Gait Sync Bob
      axiomRoot.position.set(simState.playerX, 0, simState.playerZ);
      axiomRoot.rotation.y = simState.playerRotY;
      const gaitBob = isCosmic
        ? 0.35 + Math.sin(elapsed * 3.5) * 0.12
        : Math.abs(Math.sin(simState.walkDistance * 2.2)) * 0.08;
      axiomBodyPivot.position.y = gaitBob;
      axiomBodyPivot.scale.set(simState.scaleX, simState.scaleY, simState.scaleX);

      // Exponentially Damped Third-Person Chase Camera + Trauma Shake
      if (simState.cameraTrauma > 0) {
        simState.cameraTrauma = Math.max(0, simState.cameraTrauma - dt * 2.2);
      }
      const shakeAmt = simState.cameraTrauma * simState.cameraTrauma * 0.45;
      const shakeX = (Math.random() * 2 - 1) * shakeAmt;
      const shakeY = (Math.random() * 2 - 1) * shakeAmt;

      _camTargetPos.set(
        simState.playerX * 0.72 + shakeX,
        10.2 + shakeY,
        simState.playerZ * 0.72 + 11.8
      );
      _camLookAt.set(simState.playerX * 0.85, 1.2, simState.playerZ * 0.85 - 1.2);

      camera.position.lerp(_camTargetPos, 1 - Math.exp(-7.5 * dt));
      camera.lookAt(_camLookAt);

      keysJustPressed.clear();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(animate);
      } else {
        animFrameId = requestAnimationFrame(animate);
      }
    };

    animFrameId = requestAnimationFrame(animate);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animFrameId);
      clearTimeout(softwareTimerId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearInputs);
      window.removeEventListener('resize', handleResize);
      try {
        renderer.domElement.removeEventListener('webglcontextlost', onWebGLContextLost, false);
        renderer.dispose();
      } catch {
        // Ignore disposal errors if context was already lost
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="axiom-webgl-canvas"
      className="fixed inset-0 w-screen h-screen overflow-hidden z-0 gpu-accelerated"
    />
  );
}
