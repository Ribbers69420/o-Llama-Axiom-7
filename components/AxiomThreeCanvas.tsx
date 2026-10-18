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
    onUpdateSnapshot,
    onExpressionAutoChange,
    onChapterComplete,
    onGameOver,
    onInspectTomeClaim,
  ]);

  const externalCommandRef = useRef({
    lastPulseCount: pulseTriggerCount,
    lastCelebrationCount: verifiedCelebrationCount,
    lastChapterIndex: -1,
  });

  useEffect(() => {
    externalCommandRef.current.lastPulseCount = pulseTriggerCount;
  }, [pulseTriggerCount]);

  useEffect(() => {
    externalCommandRef.current.lastCelebrationCount = verifiedCelebrationCount;
  }, [verifiedCelebrationCount]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    const width = container.clientWidth || window.innerWidth || 1280;
    const height = container.clientHeight || window.innerHeight || 720;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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
    keyLight.castShadow = !isHeadless;
    if (!isHeadless) {
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 2;
      keyLight.shadow.camera.far = 65;
      const d = 22;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#00E5FF', 1.15);
    rimLight.position.set(-14, 12, -14);
    scene.add(rimLight);

    // Procedural Textures (Zero external 404s)
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    // 1. Checkerboard Chassis Texture (#2D2D2D / #222222)
    const checkerCanvas = document.createElement('canvas');
    checkerCanvas.width = 128;
    checkerCanvas.height = 128;
    const cCtx = checkerCanvas.getContext('2d')!;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        cCtx.fillStyle = (x + y) % 2 === 0 ? '#2D2D2D' : '#222222';
        cCtx.fillRect(x * 16, y * 16, 16, 16);
      }
    }
    const checkerTex = new THREE.CanvasTexture(checkerCanvas);
    checkerTex.colorSpace = THREE.SRGBColorSpace;
    checkerTex.wrapS = THREE.RepeatWrapping;
    checkerTex.wrapT = THREE.RepeatWrapping;
    checkerTex.magFilter = THREE.NearestFilter;
    checkerTex.anisotropy = maxAnisotropy;

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

    // 3. Dynamic AXIOM-7 Face Screen CanvasTexture (Part 3.1 & 3.2 Expressions & Animations)
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 256;
    faceCanvas.height = 192;
    const faceCtx = faceCanvas.getContext('2d')!;
    const faceTex = new THREE.CanvasTexture(faceCanvas);
    faceTex.colorSpace = THREE.SRGBColorSpace;
    faceTex.anisotropy = maxAnisotropy;

    function drawAxiomScreen(
      exprId: ExpressionId,
      chassisMode: ChassisType,
      elapsed: number,
      celebrationTimer: number
    ) {
      // Screen Black #0A0A0A
      faceCtx.fillStyle = '#0A0A0A';
      faceCtx.fillRect(0, 0, 256, 192);

      // Subtle scanlines
      faceCtx.fillStyle = 'rgba(0, 229, 255, 0.03)';
      for (let y = 0; y < 192; y += 6) {
        faceCtx.fillRect(0, y, 256, 2);
      }

      // Top-right screen glare
      faceCtx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      faceCtx.beginPath();
      faceCtx.moveTo(190, 12);
      faceCtx.lineTo(240, 12);
      faceCtx.lineTo(240, 48);
      faceCtx.closePath();
      faceCtx.fill();

      // Truth Confirmed green screen edge flash (Part 3.2)
      if (celebrationTimer > 0) {
        faceCtx.strokeStyle = '#00C853';
        faceCtx.lineWidth = 10;
        faceCtx.strokeRect(5, 5, 246, 182);
      }

      const activeExpr: ExpressionId =
        celebrationTimer > 0.6
          ? 'EX-06'
          : chassisMode === 'cosmic' && exprId === 'EX-01'
          ? 'EX-04'
          : exprId;

      const spec = EXPRESSIONS[activeExpr] || EXPRESSIONS['EX-01'];

      // Blinking cycle every 3.5s (Part 3.2 IDLE 8fps)
      const blinkCycle = elapsed % 3.5;
      const isBlinking = blinkCycle > 3.32 && activeExpr !== 'EX-04' && activeExpr !== 'EX-08';

      const leftX = 86;
      const rightX = 170;
      const centerY = 96;

      if (activeExpr === 'EX-04') {
        // Cosmic Spiral Eye (Part 4.4: 7 concentric rotating rainbow rings)
        const ringColors = [
          '#8B00FF', // 1. Outer Violet
          '#0000FF', // 2. Blue
          '#00FF00', // 3. Green
          '#FFFF00', // 4. Yellow
          '#FF8C00', // 5. Orange
          '#FF0000', // 6. Inner Red
          '#FFD700', // 7. Core Gold
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
        // Core Gold CrosshairDot
        faceCtx.fillStyle = '#FFD700';
        faceCtx.beginPath();
        faceCtx.arc(0, 0, 7, 0, Math.PI * 2);
        faceCtx.fill();
        faceCtx.restore();
      } else if (isBlinking || activeExpr === 'EX-08') {
        // Closed / Sleeping --
        faceCtx.strokeStyle = activeExpr === 'EX-08' ? '#3B4268' : spec.color;
        faceCtx.lineWidth = 10;
        faceCtx.lineCap = 'round';
        [leftX, rightX].forEach((cx) => {
          faceCtx.beginPath();
          faceCtx.moveTo(cx - 24, centerY);
          faceCtx.lineTo(cx + 24, centerY);
          faceCtx.stroke();
        });
      } else if (activeExpr === 'EX-01') {
        // CURIOUS: Filled Circles ●● (#00E5FF with #00BCD4 glow)
        [leftX, rightX].forEach((cx) => {
          faceCtx.fillStyle = 'rgba(0, 188, 212, 0.35)';
          faceCtx.beginPath();
          faceCtx.arc(cx, centerY, 34, 0, Math.PI * 2);
          faceCtx.fill();

          faceCtx.fillStyle = '#00E5FF';
          faceCtx.beginPath();
          faceCtx.arc(cx, centerY, 26, 0, Math.PI * 2);
          faceCtx.fill();
        });
      } else if (activeExpr === 'EX-02') {
        // FOCUSED: Hollow Rings ○○ (outer 52px, inner 28px)
        const pulse = 1 + Math.sin(elapsed * 5) * 0.05;
        [leftX, rightX].forEach((cx) => {
          faceCtx.strokeStyle = '#00E5FF';
          faceCtx.lineWidth = 11 * pulse;
          faceCtx.beginPath();
          faceCtx.arc(cx, centerY, 24, 0, Math.PI * 2);
          faceCtx.stroke();
        });
      } else if (activeExpr === 'EX-03') {
        // WISE: Glowing Gold Orbs 🌕🌕 (#FFB300 + smile)
        [leftX, rightX].forEach((cx) => {
          faceCtx.fillStyle = 'rgba(255, 143, 0, 0.4)';
          faceCtx.beginPath();
          faceCtx.arc(cx, centerY - 6, 33, 0, Math.PI * 2);
          faceCtx.fill();

          faceCtx.fillStyle = '#FFB300';
          faceCtx.beginPath();
          faceCtx.arc(cx, centerY - 6, 24, 0, Math.PI * 2);
          faceCtx.fill();
        });
        // Wise curved smile (Part 4.3: 40x12 #FFB300)
        faceCtx.strokeStyle = '#FFB300';
        faceCtx.lineWidth = 6;
        faceCtx.beginPath();
        faceCtx.arc(128, centerY + 24, 22, 0.15 * Math.PI, 0.85 * Math.PI);
        faceCtx.stroke();
      } else if (activeExpr === 'EX-05') {
        // ALERT: Target Rings ◉◉ (#FF1744)
        [leftX, rightX].forEach((cx) => {
          faceCtx.strokeStyle = '#FF1744';
          faceCtx.lineWidth = 8;
          faceCtx.beginPath();
          faceCtx.arc(cx, centerY, 26, 0, Math.PI * 2);
          faceCtx.stroke();

          faceCtx.fillStyle = '#FF1744';
          faceCtx.beginPath();
          faceCtx.arc(cx, centerY, 10, 0, Math.PI * 2);
          faceCtx.fill();
        });
      } else if (activeExpr === 'EX-06') {
        // HAPPY: ^^ Truth Confirmed
        faceCtx.strokeStyle = '#00E5FF';
        faceCtx.lineWidth = 10;
        faceCtx.lineCap = 'round';
        faceCtx.lineJoin = 'round';
        [leftX, rightX].forEach((cx) => {
          faceCtx.beginPath();
          faceCtx.moveTo(cx - 22, centerY + 10);
          faceCtx.lineTo(cx, centerY - 16);
          faceCtx.lineTo(cx + 22, centerY + 10);
          faceCtx.stroke();
        });
      } else if (activeExpr === 'EX-07') {
        // PROCESSING: ░░ Pixel grid + dot trail
        faceCtx.fillStyle = '#00BCD4';
        [leftX, rightX].forEach((cx) => {
          for (let py = -18; py <= 18; py += 12) {
            for (let px = -18; px <= 18; px += 12) {
              const on = Math.sin(elapsed * 8 + px + py) > -0.2;
              if (on) {
                faceCtx.fillRect(cx + px - 4, centerY + py - 4, 8, 8);
              }
            }
          }
        });
      }

      faceTex.needsUpdate = true;
    }

    // ============================================================================
    // BUILD AXIOM-7 COMPOSITE 12-PART PROCEDURAL 3D RIG (Part 2.3 & Part 4)
    // ============================================================================
    const axiomRoot = new THREE.Group();
    scene.add(axiomRoot);

    // Contact shadow disc beneath AXIOM-7 (y = 0.02)
    const contactShadowGeo = new THREE.CircleGeometry(1.45, 32);
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

    // Materials with varied roughness/metalness (>= 0.25 difference across adjacent parts)
    const chassisDarkMat = new THREE.MeshStandardMaterial({
      map: checkerTex,
      color: 0xffffff,
      roughness: 0.72,
      metalness: 0.25,
    });
    const bezelMat = new THREE.MeshStandardMaterial({
      color: '#2D2D2D',
      roughness: 0.35,
      metalness: 0.65,
    });
    const frameDarkMat = new THREE.MeshStandardMaterial({
      color: '#1A1A1A',
      roughness: 0.45,
      metalness: 0.4,
    });
    const screenFaceMat = new THREE.MeshStandardMaterial({
      map: faceTex,
      emissive: '#ffffff',
      emissiveMap: faceTex,
      emissiveIntensity: 0.92,
      roughness: 0.12,
      metalness: 0.1,
    });
    const yellowBtnMat = new THREE.MeshStandardMaterial({
      color: '#FFD600',
      emissive: '#FFD600',
      emissiveIntensity: 0.35,
      roughness: 0.25,
      metalness: 0.2,
    });
    const redBtnMat = new THREE.MeshStandardMaterial({
      color: '#FF1744',
      emissive: '#FF1744',
      emissiveIntensity: 0.35,
      roughness: 0.25,
      metalness: 0.2,
    });
    const greenLedMat = new THREE.MeshStandardMaterial({
      color: '#00C853',
      emissive: '#00C853',
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.1,
    });

    // Part 1: Main Body Chassis (3 units tall x 5 units wide -> 1.5 x 0.95 x 1.1)
    const mainChassisGeo = new THREE.BoxGeometry(1.5, 0.95, 1.1);
    const mainChassisMesh = new THREE.Mesh(mainChassisGeo, chassisDarkMat);
    mainChassisMesh.position.set(0, 0.82, 0);
    mainChassisMesh.castShadow = !isHeadless;
    mainChassisMesh.receiveShadow = !isHeadless;
    axiomBodyPivot.add(mainChassisMesh);

    // Part 2, 3, 4: Control Panel Buttons (Yellow #FFD600, Red #FF1744, Green LED #00C853)
    const btnGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.08, 16);
    btnGeo.rotateX(Math.PI / 2);
    const yellowBtn = new THREE.Mesh(btnGeo, yellowBtnMat);
    yellowBtn.position.set(-0.35, 0.86, 0.56);
    axiomBodyPivot.add(yellowBtn);

    const redBtn = new THREE.Mesh(btnGeo, redBtnMat);
    redBtn.position.set(0.0, 0.86, 0.56);
    axiomBodyPivot.add(redBtn);

    const ledGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const greenLed = new THREE.Mesh(ledGeo, greenLedMat);
    greenLed.position.set(0.35, 0.72, 0.55);
    axiomBodyPivot.add(greenLed);

    // Part 5: Neck Pivot (Cylindrical joint 1 unit)
    const neckGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.32, 20);
    const neckMesh = new THREE.Mesh(neckGeo, bezelMat);
    neckMesh.position.set(0, 1.4, 0);
    axiomBodyPivot.add(neckMesh);

    // Part 6 & 7: Head Assembly (Morphs proportions between Landscape Ver. A and Square Monitor Ver. B/C)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.12, 0);
    axiomBodyPivot.add(headGroup);

    const headHousingGeo = new THREE.BoxGeometry(1.85, 1.25, 1.05);
    const headHousingMesh = new THREE.Mesh(headHousingGeo, bezelMat);
    headHousingMesh.castShadow = !isHeadless;
    headGroup.add(headHousingMesh);

    const headBezelGeo = new THREE.BoxGeometry(1.68, 1.08, 0.08);
    const headBezelMesh = new THREE.Mesh(headBezelGeo, frameDarkMat);
    headBezelMesh.position.set(0, 0, 0.51);
    headGroup.add(headBezelMesh);

    const screenGeo = new THREE.PlaneGeometry(1.56, 0.96);
    const screenMesh = new THREE.Mesh(screenGeo, screenFaceMat);
    screenMesh.position.set(0, 0, 0.56);
    headGroup.add(screenMesh);

    // Part 8: Monitor Side Tuner Knob (Right side knob for Version B/C)
    const sideKnobGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.22, 16);
    sideKnobGeo.rotateZ(Math.PI / 2);
    const sideKnobMesh = new THREE.Mesh(sideKnobGeo, yellowBtnMat);
    sideKnobMesh.position.set(1.02, 0, 0.1);
    headGroup.add(sideKnobMesh);

    // Part 9 & 10: Dual Tank Treads (Left & Right 8-segment treads)
    const treadsGroup = new THREE.Group();
    axiomBodyPivot.add(treadsGroup);

    const treadBodyGeo = new THREE.BoxGeometry(0.46, 0.52, 1.55);
    const leftTread = new THREE.Mesh(treadBodyGeo, frameDarkMat);
    leftTread.position.set(-0.92, 0.32, 0);
    leftTread.castShadow = !isHeadless;
    treadsGroup.add(leftTread);

    const rightTread = new THREE.Mesh(treadBodyGeo, frameDarkMat);
    rightTread.position.set(0.92, 0.32, 0);
    rightTread.castShadow = !isHeadless;
    treadsGroup.add(rightTread);

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
      playerZ: 3.5, // Spawn on open path facing clear vista
      playerRotY: Math.PI,
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
    };

    // Unified Input Hub (Held vs JustPressed + Window Blur Reset)
    const keysHeld = new Set<string>();
    const keysJustPressed = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if typing inside an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

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
    function triggerPlayerPulse() {
      if (simState.pulseCooldownTimer > 0) return;
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
        const dmgRes = calculatePulseDamage(
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

    let animFrameId = 0;
    let lastTime = performance.now();
    let hudSyncAccumulator = 0;

    const animate = (now: number) => {
      animFrameId = requestAnimationFrame(animate);

      const rawDt = (now - lastTime) / 1000;
      // Throttle headless software rendering to ~15fps so screenshots never stall
      if (isHeadless && rawDt < 0.06) {
        return;
      }
      lastTime = now;
      const dt = clampDeltaTime(rawDt);
      const elapsed = now / 1000;

      const currentProps = propsRef.current;

      // Detect chapter switch
      if (externalCommandRef.current.lastChapterIndex !== currentProps.chapterIndex) {
        externalCommandRef.current.lastChapterIndex = currentProps.chapterIndex;
        simState.playerX = 0;
        simState.playerZ = 3.5;
        simState.playerRotY = Math.PI;
        simState.hp = 5;
        simState.tomesCollected = 0;
        simState.purgesCount = 0;
        simState.pillarsUnlocked = [];
        loadChapterScene(currentProps.chapterIndex);
      }

      // Detect UI button pulse trigger
      if (pulseTriggerCount !== externalCommandRef.current.lastPulseCount) {
        externalCommandRef.current.lastPulseCount = pulseTriggerCount;
        triggerPlayerPulse();
      }

      // Detect Truth Analyzer verification celebration
      if (verifiedCelebrationCount !== externalCommandRef.current.lastCelebrationCount) {
        externalCommandRef.current.lastCelebrationCount = verifiedCelebrationCount;
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
        // Diegetic In-World Awakening Showcase (Scene 1854)
        axiomRoot.position.set(0, 0, 0);
        axiomRoot.rotation.y = Math.sin(elapsed * 0.55) * 0.38;
        axiomBodyPivot.position.y = isCosmic ? 0.35 + Math.sin(elapsed * 3) * 0.12 : 0;

        const camAngle = elapsed * 0.22;
        _camTargetPos.set(Math.sin(camAngle) * 7.2, 3.6, Math.cos(camAngle) * 7.2);
        _camLookAt.set(-1.1, 1.55, 0);
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

          // Edge-triggered Pulse Scan (Space)
          if (keysJustPressed.has('Space')) {
            triggerPlayerPulse();
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

          // Check Chapter Victory Condition
          if (
            checkChapterVictory({
              tomesCollected: simState.tomesCollected,
              targetTomes: cScene.targetTomes,
              purgesCount: simState.purgesCount,
              targetPurges: cScene.targetPurges,
            })
          ) {
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
    };

    animFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearInputs);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="axiom-webgl-canvas"
      className="fixed inset-0 w-screen h-screen overflow-hidden z-0"
    />
  );
}
