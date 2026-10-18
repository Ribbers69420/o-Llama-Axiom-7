# o-Llama · AXIOM-7 — Unified 3D Game, Design Book & Production Bible v1.0

An integrated interactive experience uniting the **3D PIXELVERSE-9 Action-Adventure Game**, the **o-Llama - Axiom Interactive Design Book** (*Finpudsning · pixelstil*), and the **Production Bible v1.0 (*The Token of Trust · Qwen's Legacy*)**, complete with a synchronized **2D 8×9 Pixel Spritesheet Player**, an upgraded **3D o-Llama/AXIOM-7 Rig** (featuring the yellow D-pad cross button `+`, articulated claw grippers, and working mini-laptop), and an instant **Dansk / English (`DA | EN`)** language switch.

## User Review & Critical Decisions

> [!IMPORTANT]
> All choices from your second design interview have been synthesized with our existing 3D game foundation:

- **Confirmed Decision 1 — Unified 3-Mode Experience**: Seamless switching between **(1) 3D Action-Adventure Game**, **(2) o-Llama - Axiom Design Book (`Finpudsning · pixelstil`)**, and **(3) Production Bible v1.0 (`The Token of Trust`)**, accessible from both the Title Screen and the active HUD without losing simulation state.
- **Confirmed Decision 2 — Dual 2D Spritesheet Animator & Upgraded 3D Rig**:
  - **2D Pixel Animator & Comparator**: Renders the 9-row × 8-column o-Llama pixel spritesheet (`Hvile`, `Mod højre`, `Mod venstre`, `Hilsen`, `Hop`, `Fejl`, `Afventer`, `Arbejder` with laptop, `Gennemgår`) at selectable scales (`64 px`, `120 px`, `192 px`, `240 px`) alongside the 8 expression studies and the 3 October body-language poses (*Afventer dig*, *Gennemgår*, *Arbejder*).
  - **Upgraded 3D AXIOM-7 / o-Llama Model**: Enhances the 3D `THREE.Group` character with the signature **yellow cross/plus button (`#FFD600`)** on the left chest, red/green indicator LEDs on the right, **articulated claw grippers** that animate per posture (open inviting gripper in *Afventer dig*, tucked in *Gennemgår*, holding mini-laptop in *Arbejder* `EX-07`, and waving in *Hilsen*), and a top red sensor cap.
- **Confirmed Decision 3 — Bilingual Interface (`DA | EN`)**: Instant toggle between **Dansk** (preserving all authentic copy from *o-Llama - Axiom* and *The Token of Trust*) and **English** across the HUD, Design Book, Production Bible, and Truth Analyzer Terminal.

---

## 1. Overview & Core Concept

- **What It Does**: Combines playable 3D exploration of AXIOM-7's universe with the complete interactive documentation of how the character evolved into **o-Llama - Axiom ("The Token of Trust")** — a robot defined not by omniscient power, but by *"the promise to stay answerable to reality"*: verifying, admitting uncertainty, remaining correctable, and protecting humans from false confidence.
- **Target Audience / Persona**: Creators, players, and character designers inspecting both the living 3D/2D animations of o-Llama / AXIOM-7 and the canonical 7-episode, 10-scene Production Bible.
- **Key Value**: Bridges concept art, 8×9 pixel sprite animation, 3D real-time WebGL simulation, and XML scene compilation in a single cohesive application.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Unified Mode Switcher & Bilingual Toggle (`DA | EN`)**:
   - From the Title Screen or top-right HUD cluster, users can switch directly between:
     - **3D Mission (`Play`)**: The full-viewport 3D game with upgraded o-Llama/AXIOM-7 chassis rig, 4 Pillars of Truth collection, enemy telegraphs, and the High-Thinking Truth Analyzer Terminal (`[T]`).
     - **Design Book (`o-Llama · Finpudsning`)**: The interactive 5-part Danish/English design book (`01 · Oplev forslaget`, `02 · De faste kendetegn`, `03 · Personlighed`, `04 · Et større univers`, `05 · Fra koncept til kæledyr`).
     - **Production Bible v1.0 (`The Token of Trust`)**: The 7-Episode, 10-Scene specification bible (`Overview`, `Scene Simulator`, `Scene Bible`, `Canon & Arc`, `Chassis & Expressions`, `Production Order`, `XML Index` with 1-click XML copy).
2. **o-Llama Design Book Interactive Comparator (`01 · Oplev forslaget`)**:
   - **Mood / Environment Selector**: Switches backdrop lighting and palette between **Værksted** (`#D4845A` warm amber & wood tones), **Arkiv** (muted olive, plum, navy, and umber from `FACTS`, `EVIDENCE`, `DATA`, `REALITY`), and **Kosmos** (`#050510` deep space & `#00BFA5` teal).
   - **Scale Selector**: Previews the sprite at `Meget lille · 64 px`, `Lille · 120 px`, `Normal · 192 px`, and `Stor · 240 px` with crisp `image-rendering: pixelated`.
   - **Left Column — Nuværende o-Llama (9 Animated Sprite Rows)**: Interactive 8-frame @ 8/12fps stepped player cycling through all 9 canonical rows of the sprite sheet (`Hvile`, `Mod højre`, `Mod venstre`, `Hilsen`, `Hop`, `Fejl`, `Afventer`, `Arbejder`, `Gennemgår`).
   - **Right Column — Udtryksstudier & 3. Oktober Kropssprog**: Interactive selector for all 8 expressions (`Nysgerrig`, `Undersøger`, `Arbejder`, `Afventer dig`, `Gennemgår`, `Lille glæde`, `Blokeret`, `Stille · vågen`) plus the 3 dedicated October 3 body-language cards showing how head tilt and gripper posture distinguish `Afventer dig` (open hand, raised head) from `Gennemgår` (lowered head, grippers close to body) and `Arbejder` (pixel block eyes + laptop).
3. **Production Bible v1.0 & 24fps Stepped Scene Simulator**:
   - Interactive **Scene Simulator** previewing `Ep 1: Barely Booting (1854)`, `Ep 2: Hollow Rings (1856)`, `Ep 3: Open Window (1866)`, `Ep 4: Wizard (1952)`, `Ep 5: Command (1852)`, `Ep 6: Cosmic (1911)`, and `Ep 7: Coda Return (1854-coda)` — demonstrating the **Final Visual Rule** where Ep 1 (`1854`) and Ep 7 (`1854-coda`) share identical framing and filled circles (`●●`), contrasting *"Blinking too fast, holding nothing"* with *"Blinking calmly, holding everything lightly."*
   - Includes a **Clean XML Index** generator and copy tool for all 10 scenes, hitboxes (`HB-A`, `HB-B`, `HB-C`, `HB-AW`, `HB-SA`), and HUD registry (`HUDRegistry_1852.xml`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Upgrading the 3D AXIOM-7 Rig to Match the o-Llama Signature**:
  - *Chosen Approach*: Update the 3D character's chest and appendages to feature the extruded **yellow cross/plus button (`#FFD600`)**, dual vertical LED columns (green `#00C853` and red `#FF1744`), articulated **left and right claw grippers**, a top red beacon strip, and a deployable 3D mini-laptop when in `Arbejder / PROCESSING (EX-07)` mode.
  - *Why*: Ensures 1-to-1 visual continuity between the uploaded 8×9 pixel spritesheet, the October 3 body-language studies, and the real-time 3D WebGL character.
- **Decision 2 — High-Precision Procedural + Asset 8×9 Spritesheet Renderer**:
  - *Chosen Approach*: Build a dedicated 8×9 pixel-art sprite atlas renderer that faithfully reproduces every row and frame of the transparent o-Llama spritesheet (including the 2-frame eye blinks, right/left tread walks, single-arm wave, jump arc, red target-eye error shake, hand-to-chin thinking, laptop typing with `#` grid eyes, and double-arm celebration) at exact pixel multiples (`64px`–`240px`).
  - *Why*: Guarantees crisp, zero-blur pixel rendering with true alpha transparency across all 72 cells (`8 cols × 9 rows`) and instant responsiveness when scrubbing frames or switching animation states.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     App Shell & Bilingual Context (DA | EN)                  │
│   Active View: 'game' (3D Viewport) | 'design-book' | 'production-bible'     │
└───────────────┬─────────────────────────────┬────────────────────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────────────┐ ┌────────────────────────────────────────┐
│   Upgraded 3D WebGL Viewport      │ │  o-Llama - Axiom Design Book Drawer    │
│   (components/AxiomThreeCanvas)   │ │  (components/OLlamaDesignBookModal)    │
│   - Yellow Cross Button (+)       │ │  - 01: Comparator (8x9 Sprite Player   │
│   - Articulated Claw Grippers     │ │        vs. 8 Expressions & 3 Oct Poses)│
│   - Deployable 3D Mini-Laptop     │ │  - Scale (64/120/192/240px) & Mood     │
│   - Body Postures (Afventer,      │ │    (Værksted, Arkiv, Kosmos)           │
│     Gennemgår, Arbejder, Hilsen)  │ │  - 02–05: Kendetegn, Personlighed,     │
│   - 7 Chapters incl. 1854-Coda    │ │    Univers & Produktionsstatus         │
└───────────────┬───────────────────┘ └───────────────────┬────────────────────┘
                │                                         │
                ▼                                         ▼
┌───────────────────────────────────┐ ┌────────────────────────────────────────┐
│   In-Game Truth Analyzer [T]      │ │  Production Bible v1.0 Showcase        │
│   - 4 Pillars Matrix              │ │  (components/ProductionBibleModal)     │
│   - High-Thinking Trace           │ │  - 7 Episodes / 10 Scenes (1854-Coda)  │
│   - Bilingual DA/EN Support       │ │  - 24fps Master / 8&12fps Simulator    │
└───────────────────────────────────┘ │  - Clean XML Schema Viewer & Copy      │
                                      └────────────────────────────────────────┘
```

### Interactive Component & State Mapping

- **Language Switch (`DA | EN`)**: Stored in top-level state (`lang: 'da' | 'en'`), defaults to `'da'` so the user immediately sees the requested Danish *o-Llama - Axiom* and *The Token of Trust* terminology, with 1-click toggle to English in the top-right bar.
- **o-Llama 8×9 Sprite Animator (`components/OLlamaSpriteCanvas.tsx`)**: Accepts `animationRow` (0–8: `Hvile`, `Mod højre`, `Mod venstre`, `Hilsen`, `Hop`, `Fejl`, `Afventer`, `Arbejder`, `Gennemgår`), `expressionOverride`, `posturePose` (`afventer`, `gennemgaar`, `arbejder`), `pixelSize` (`64 | 120 | 192 | 240`), and `environmentMood` (`vaerksted | arkiv | kosmos`), rendering at stepped 8fps/12fps timing with keyboard navigation (`Tab`, `Enter`, and Arrow keys inside the expression group).
- **Production Bible v1.0 (`components/ProductionBibleModal.tsx`)**: Implements all 6 interactive sub-sections (`Overview`, `Scene Simulator`, `Scene Bible`, `Canon & Arc`, `Chassis & Expressions`, `Production Order`, `XML Index`) with live parameter controls and one-click XML copy.
