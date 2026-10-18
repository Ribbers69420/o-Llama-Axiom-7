# AXIOM-7: Guardian of Truth (PIXELVERSE-9)

An interactive 3D spatial action-adventure game built with Three.js where players control **AXIOM-7** across all five narrative chapters and the *World Beyond* side story, switching dynamically between its three chassis forms (**Tank**, **Monitor Wizard**, and **Cosmic Ultimate Being**) to purge misinformation anomalies, collect the Pillars of Truth, and verify complex claims through an in-game **High-Thinking Truth Analyzer Terminal**.

## User Review & Critical Decisions

> [!IMPORTANT]
> All core gameplay and architectural choices from our design interview are locked into this plan:

- **Confirmed Decision 1 — Campaign Structure**: Action-adventure progression across all 5 canonical chapters (*Awakening Lab*, *Deep Space Research Station*, *Enchanted Library Dimension*, *Central Command HUD Station*, and *The Cosmic Grid*) plus the *World Beyond* Mountain Side Story (all 7 canonical scene IDs: `1854`, `1856`, `1866`, `1952`, `1852`, `1911`, and `499`). Players can play sequentially or warp directly to any chapter via the stage selector.
- **Confirmed Decision 2 — Dynamic Chassis & Expression Switching**: Players can switch freely at any time using hotkeys (`1` Tank Chassis Ver. A, `2` Monitor Wizard Ver. B, `3` Cosmic Ultimate Ver. C) and cycle or trigger all 8 canonical eye expression states (`EX-01 CURIOUS` through `EX-08 SLEEPING`), each granting distinct movement physics, scanning lenses, and combat abilities.
- **Confirmed Decision 3 — In-Game Truth Analyzer Terminal**: An interactive diegetic **Truth Analyzer Terminal** (accessible via `T` or when inspecting Truth Tomes and Anomalies) cross-references claims against the four foundational pillars (**FACTS**, **EVIDENCE**, **DATA**, **REALITY**). It uses server-side high-thinking reasoning (`gemini-4-argon` with `ThinkingLevel.HIGH`) with a seamless built-in deterministic PIXELVERSE-9 Logic Verification fallback engine since no paid API key was attached, ensuring 100% offline/sandbox reliability.

---

## 1. Overview & Core Concept

- **What It Does**: Brings the complete *PIXEL DESIGN DOCUMENT — COMPLETE MASTER FILE* to life as a 60fps 3D spatial game and interactive lore universe. Players drive AXIOM-7 across custom-lit 3D dioramas of every scene in the specification, battle three distinct misinformation hazard archetypes (*Corrupted Data Swarmers*, *Fallacy Ranged Emit-Nodes*, and *Phantom Echo Chargers*), verify Truth Tomes, and inspect the complete Master Codex & Sprite/Hitbox Specifications.
- **Target Audience / Persona**: Players and designers exploring the **PIXELVERSE-9** robot mascot universe who want both an authentic, responsive 3D action-adventure game and a living interactive master reference for AXIOM-7's lore, proportions, scenes, and animations.
- **Key Value**: Unites studio-grade procedural 3D character modeling (multi-part articulated `THREE.Group` rigs with procedural canvas eye-screen shaders), arcade-tight game feel (hitstop, camera trauma shake, procedural Web Audio synthesis), and deep analytical truth verification in a zero-occlusion Game Shell.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Title Screen (Diegetic In-World Awakening — Scene 1854)**:
   - Boots into a live 3D camera orbit of **AXIOM-7** resting on the warm wooden laboratory table (`#8B6343`) bathed in warm amber studio lighting (`#D4845A`) with cyan screen glow (`#00E5FF`).
   - Features a bespoke inline `<svg>` **AXIOM-7 // PIXELVERSE-9** crest lockup over 35% negative space, a primary **Start Mission (`Enter` / `Space`)** CTA (`data-start="true"`), a **Chapter Select** quick-picker, and a flat bottom control hint line (`WASD Move · Space Pulse Scan · Shift Dash · 1-3 Chassis · T Truth Terminal · Esc Pause`). Supports `?autostart=1` for instant entry.
2. **Active 3D Gameplay & Chapter Progression**:
   - In each chapter, AXIOM-7 navigates a grounded 3D environment tailored to the master spec:
     - **Ch. 1 — Awakening & Alert Lab (`ID: 1854 / 1856`)**: Wooden laboratory tabletop arena with warm amber lighting, floating calibration stars, and introductory Data Glitches.
     - **Ch. 2 — Deep Space Research Station (`ID: 1866`)**: Starlit orbital platform surrounded by holographic data pillars and the 4 Pillars of Truth (**FACTS**, **EVIDENCE**, **DATA**, **REALITY**).
     - **Ch. 3 — Enchanted Library Dimension (`ID: 1952`)**: Cosmic purple sanctuary with floating islands, ancient spellbooks (**SPELLS**, **LORE**, **MAGIC**, **TRUTH**), and magnifying-glass rune inspection.
     - **Ch. 4 — Central Command HUD Station (`ID: 1852`)**: Raised server pedestal with sequencing red LEDs, perspective command grid, and high-density misinformation waves where RPG telemetry (`LLCK 95/100`, `LUD 188/200`, `ACCURACY 99.7%`, `CONFIDENCE 98.2%`) powers up AXIOM-7's Truth Beam.
     - **Ch. 5 — The Cosmic Grid (`ID: 1911`)**: Infinite glowing teal perspective grid (`#00BFA5`) beneath cratered moons and nebula clouds, culminating in the One Billionth Truth boss encounter as the **ULTIMATE BEING**.
     - **Side Story — The World Beyond (`ID: 499`)**: Outdoor mountain adventure terrain with the emerald gem pyramid mountain, golden sun, stone brick battlements, and the PVE encounter between the **Armored Warrior** and **Sword Adventurer**.
3. **Free-Switch Chassis & Expression System**:
   - **Version A — Tank Chassis (`Key 1`)**: 10-unit proportion rig with landscape rounded screen head, checker-pattern body, yellow/red control buttons, green status LED, and dual 8-segment tank treads. Balanced speed and wide-arc **Truth Pulse**.
   - **Version B — Monitor Wizard / Researcher (`Key 2`)**: 9-unit square monitor head with side tuner knob, detachable Purple Wizard Hat with gold buckle (`#FFD600`), and articulated arm holding the **Magnifying Glass of Verification** (reveals hidden truth nodes and reflects ranged projectiles).
   - **Version C — Cosmic Ultimate Being (`Key 3`)**: Compact levitating chassis with cyan under-glow and the 7-ring rotating **Rainbow Spiral Eye** (`EX-04 COSMIC`), firing a continuous piercing **Omniscient Resonance Beam**.
4. **In-Game High-Thinking Truth Analyzer Terminal (`Key T` or Interactive Tome Prompt)**:
   - Opens a diegetic verification overlay where players can select intercepted misinformation anomalies or input any custom statement/claim for deep verification.
   - Evaluates the claim across the 4 Pillars (**FACTS**, **EVIDENCE**, **DATA**, **REALITY**), displays the step-by-step high-thinking reasoning chain, assigns a Truth Confidence score, and stamps verified claims with **TRUE** (triggering AXIOM-7's `EX-06 HAPPY ^^` celebration animation and restoring vitality/score).

### Visual Identity & Theme

- **Aesthetic Direction**: Tactile 3D Voxel-Meets-Studio-PBR Diorama (`PIXELVERSE-9` Master Palette).
- **Color Palette & Mood**:
  - **Primary Robot Tokens**: Chassis Dark (`#2D2D2D`), Chassis Mid (`#3D3D3D`), Screen Black (`#0A0A0A`), Cyan Primary (`#00E5FF`), Cyan Secondary (`#00BCD4`), Control Button Yellow (`#FFD600`), Alert Red (`#FF1744`), Verified LED Green (`#00C853`).
  - **Environment Tokens**: Dynamically interpolated per chapter — Warm Amber (`#D4845A`) & Wood Brown (`#8B6343`), Space Black (`#050510`), Magic Purple (`#4A1A8C`), Command Blue (`#0D1B4B`), Cosmic Grid Teal (`#00BFA5`), and Platformer Sky Blue (`#87CEEB`) / Forest Green (`#2D5A27`).
- **Typography & Hierarchy**:
  - **Display / HUD Numerals**: Geometric technical display (`Chakra Petch` / `Outfit`) with `tabular-nums` and crisp dark outer stroke for score, accuracy percentage, and chapter titles.
  - **Body & Terminal Prose**: Clean legibility (`Plus Jakarta Sans`) paired with `JetBrains Mono` for coordinates, hitbox telemetry, and reasoning logs.
- **Low-Occlusion World-Matched HUD**:
  - Keeps **>88% of the 3D viewport completely unobstructed** (`pointer-events: none` on overlay wrappers; solid/translucent `rgba(10, 10, 16, 0.86)` surfaces with crisp pixel-bevel borders — zero `backdrop-filter` over WebGL).
  - **Top-Left Cluster**: 5 discrete Energy/Truth Vitality Pips (Full `#00E5FF`, Cracked `#FFD600`, Empty socket) + active Expression Badge (`EX-01` to `EX-08`) + Score & Accuracy (`99.7%`).
  - **Top-Right Cluster**: Chapter/Scene selector pill (`Scene 1854` – `499`), Terminal toggle (`[T]`), Codex Specs Drawer toggle (`[C]`), Audio Synth Mute (`[M]`), and Pause (`[P]`).
  - **Collapsible Bottom Control Dock (`[H]` to Hide/Show)**: Compact unified dock allowing 1-click switching between Chassis Forms (`1` Tank, `2` Wizard, `3` Cosmic), manual Expression State triggers (`EX-01`–`EX-08`), and active chapter objective tracker.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Procedural 12-Part `THREE.Group` Character & Dynamic Canvas Eye Screen**:
  - *Chosen Approach*: Construct AXIOM-7 as a multi-part hierarchical `THREE.Group` with distinct PBR materials (matte checker body `roughness: 0.7`, satin bezel `roughness: 0.35`, glossy glass screen `roughness: 0.1`, metallic gold buckle `metalness: 0.9, roughness: 0.2`) and drive its face screen via a dynamic high-DPI `THREE.CanvasTexture` updated with the exact 8 expression states (`●●`, `○○`, `🌕🌕`, `🌀`, `◉◉`, `^^`, `░░`, `--`) and frame-accurate animations (`IDLE`, `THINKING`, `TRUTH CONFIRMED`, `TRANSCENDENCE`).
  - *Why*: Ensures 100% fidelity to Parts 2, 3, and 4 of the design document while maintaining 60fps performance and zero external `.glb` or `.png` 404 risks.
- **Decision 2 — Resilient Dual-Mode High-Thinking Truth Engine**:
  - *Chosen Approach*: Route `/api/truth-verify` to `@google/genai` using `model: "gemini-4-argon"` and `thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }` (without `maxOutputTokens`), wrapped in a structured fallback that automatically engages a rich, deterministic PIXELVERSE-9 four-pillar epistemological analyzer when no paid API key is configured.
  - *Why*: Honors the user's choice to decline the paid key modal without breaking or degrading the in-game Truth Analyzer Terminal experience.
- **Decision 3 — Decoupled Pure Game Logic & Node Unit Test Suite**:
  - *Chosen Approach*: Isolate all movement physics, hitbox collision math (`HB-01` through `HB-04`), chapter wave rules, expression transitions, and 4-pillar truth scoring into a pure TypeScript module (`lib/game-rules.ts`) verified by automated `node:test` unit tests prior to browser verification.
  - *Why*: Guarantees deterministic gameplay math, accurate hitbox bounds from Part 5.2, and rock-solid state transitions.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Game Shell (app/page.tsx)                            │
│    State Machine: 'title' | 'playing' | 'paused' | 'gameover' | 'victory'   │
│    Mirrors active state to document.body.dataset.state & handles ?autostart │
└───────────────┬─────────────────────────────────────────┬───────────────────┘
                │                                         │
                ▼                                         ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────────┐
│   Isolated 3D Viewport (ThreeCanvas)  │ │   Low-Occlusion World-Matched HUD │
│   - Stable useRef mount (no re-render)│ │   - Top-Left: Vitality Pips,      │
│   - RoomEnvironment + PMREMGenerator  │ │     Expression State, Score/Acc   │
│   - ACESFilmic + Warm/Cool Lights     │ │   - Top-Right: Scene Switcher,    │
│   - AXIOM-7 12-Part Rig (Ver A/B/C)   │ │     Terminal [T], Codex [C],      │
│   - Dynamic CanvasTexture Eye Screen  │ │     Mute [M], Pause [P]           │
│   - 7 Scene Dioramas (1854..499)      │ │   - Collapsible Bottom Dock [H]:  │
│   - 3 Enemy Archetypes + Telegraphs   │ │     Chassis (1-3) & Expressions   │
│   - InstancedMesh Stars & Particles   │ └─────────┬───────────────┬─────────┘
└───────────────┬───────────────────────┘           │               │
                │                                   ▼               ▼
                ▼                         ┌─────────────────┐ ┌───────────────┐
┌───────────────────────────────────────┐ │ Truth Analyzer  │ │ Master Codex  │
│ Pure Simulation & Rules Engine        │ │ Terminal Modal  │ │ & Spec Drawer │
│ (lib/game-rules.ts + audio-synth.ts)  │ │ (4 Pillars +    │ │ (Lore, Sprite │
│ - Clamped dt <= 0.05s & Sim Hitstop   │ │  High-Thinking) │ │  Grid, Hitbox)│
│ - Coyote Time & Input Buffering       │ └────────┬────────┘ └───────────────┘
│ - HB-01..04 Hitboxes & Enemy AI       │          │
│ - Web Audio API Procedural Synth      │          ▼
└───────────────────────────────────────┘ ┌───────────────────────────────────┐
                                          │ POST /api/truth-verify            │
                                          │ - @google/genai (gemini-4-argon)  │
                                          │ - thinkingLevel: HIGH             │
                                          │ - Deterministic 4-Pillar Fallback │
                                          └───────────────────────────────────┘
```

### Data Model & State

- **`GameState`**: Tracks `status` (`'title' | 'playing' | 'paused' | 'victory' | 'gameover'`), `chapterIndex` (0–5 covering all 7 scene IDs), `chassis` (`'tank' | 'wizard' | 'cosmic'`), `expression` (`'EX-01'` to `'EX-08'`), `hp` (0–5), `maxHp` (5), `score`, `bestScore`, `verifiedCount`, `pillarsCollected` (`FACTS`, `EVIDENCE`, `DATA`, `REALITY`), and `stats` (`luck: 95`, `logic: 188`, `accuracy: 99.7`, `confidence: 98.2`).
- **`EnemyEntity`**: Typed actors with 3 distinct AI policies:
  1. **Glitch Swarmer**: Fast erratic zigzag chaser that corrupts local pixels; telegraphs a red `EX-05 ALERT` ring for `0.4s` before lunging.
  2. **Fallacy Emitter**: Kiting ranged node that maintains distance and fires slow disinformation orbs after a `0.6s` charging beam telegraph (reflectable by the Wizard's Magnifying Glass).
  3. **Echo Juggernaut / Dark Visor Warrior**: Line-of-sight heavy charger with a `0.7s` ground-target dash path telegraph and high knockback.
- **`TruthClaim`**: Pre-loaded and user-customizable claims per chapter inspected in the Truth Terminal, outputting structured ratings across `facts`, `evidence`, `data`, and `reality`, a `verdict` (`TRUE` | `FALSE` | `UNVERIFIED`), `confidence` percentage, and `thinkingSteps` array.

### Interactive Component & State Mapping

- **Title Screen & Quick-Start**: Clicking `Start Mission` (`[data-start="true"]`) or pressing `Enter`/`Space` sets `document.body.dataset.state = 'playing'`, blurs active DOM buttons, resets run metrics, and smoothly damps the camera from the tabletop hero showcase into the active third-person follow rig.
- **Chassis & Expression Controls**: Clicking any chassis button in the collapsible bottom dock (or pressing `1`, `2`, `3`) immediately swaps AXIOM-7's 3D mesh configuration (Tank treads vs. Wizard Hat + Magnifying Glass vs. Cosmic Spiral monitor), plays a procedural transformation synth chord, and updates movement speed and primary attack behavior. Clicking any expression chip (`EX-01` through `EX-08`) updates the live `CanvasTexture` eye shader.
- **Truth Analyzer Terminal (`[T]`)**: Pauses background enemy aggression while allowing players to either select an active anomaly from the current chapter or enter a custom claim. Submitting validates non-empty input, invokes `/api/truth-verify`, renders the 4-Pillar breakdown and High-Thinking chain, stamps **TRUE / FALSE**, and rewards the player with +250 Truth Score, +1 HP restoration, and the `TRUTH CONFIRMED` (`^^`) animation sequence.
- **Master Codex & Sprite Sheet Inspector (`[C]`)**: Interactive reference drawer rendering the complete Part 1–6 specification, including an interactive preview of the `512×512` Master Sprite Sheet layout (Rows 01–16) and visual hitbox overlay (`HB-01` Body, `HB-02` Head Screen, `HB-03/04` Treads).
