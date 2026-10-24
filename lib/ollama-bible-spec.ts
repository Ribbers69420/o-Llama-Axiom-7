// Canonical Specifications for "o-Llama - Axiom (Finpudsning · pixelstil)"
// and "Production Bible v1.0 — The Token of Trust · Qwen's Legacy"

import type { ExpressionId } from './game-rules.ts';

export type AppLanguage = 'da' | 'en';
export type EnvironmentMoodId = 'vaerksted' | 'arkiv' | 'kosmos' | 'studio';
export type SpriteScaleSize = 64 | 120 | 192 | 240;

export type OLlamaAnimationId =
  | 'hvile'
  | 'mod-hoejre'
  | 'mod-venstre'
  | 'hilsen'
  | 'hop'
  | 'fejl'
  | 'afventer'
  | 'arbejder'
  | 'gennemgaar';

export interface OLlamaAnimationSpec {
  id: OLlamaAnimationId;
  rowIndex: number; // 0 to 8 in the 9-row x 8-col transparent spritesheet (pet_6a9caa81a898819184d4992db7e8b566-spritesheet.png)
  frameCount: number; // Active frames in the uploaded spritesheet
  labelDa: string;
  labelEn: string;
  descDa: string;
  descEn: string;
  fps: 8 | 12;
  expressionId: ExpressionId;
}

export const OLLAMA_ANIMATIONS: OLlamaAnimationSpec[] = [
  {
    id: 'hvile',
    rowIndex: 0,
    frameCount: 8,
    labelDa: 'Hvile',
    labelEn: 'Idle',
    descDa: 'Den eksisterende figur og dens faktiske billeder. Rolig blinkerytme i 3/4-profil med fyldte cyanøjne.',
    descEn: 'The baseline figure in calm 3/4 resting rhythm with filled cyan eyes and natural blink.',
    fps: 8,
    expressionId: 'EX-01',
  },
  {
    id: 'mod-hoejre',
    rowIndex: 1,
    frameCount: 8,
    labelDa: 'Mod højre',
    labelEn: 'Move Right',
    descDa: 'Kørsel mod højre på kompakte larvebånd med to synlige sidehjul, kontrolpanel og det gule plus.',
    descEn: 'Driving right on compact tank treads with two visible road wheels, control panel, and yellow cross.',
    fps: 12,
    expressionId: 'EX-01',
  },
  {
    id: 'mod-venstre',
    rowIndex: 2,
    frameCount: 8,
    labelDa: 'Mod venstre',
    labelEn: 'Move Left',
    descDa: 'Kørsel mod venstre med fremadrettet blik, gribearme og rullende metalliske larvebånd.',
    descEn: 'Driving left with forward gaze, segmented claw arms, and rolling metallic treads.',
    fps: 12,
    expressionId: 'EX-01',
  },
  {
    id: 'hilsen',
    rowIndex: 3,
    frameCount: 8,
    labelDa: 'Hilsen',
    labelEn: 'Greeting',
    descDa: 'Rolig hilsen med løftet C-griber og venlig hovedhældning.',
    descEn: 'Friendly wave with raised C-shaped claw gripper and gentle head tilt.',
    fps: 8,
    expressionId: 'EX-01',
  },
  {
    id: 'hop',
    rowIndex: 4,
    frameCount: 8,
    labelDa: 'Hop',
    labelEn: 'Jump / Joy',
    descDa: 'Glad bue i øjnene (^^) og et lille løft i chassis og begge C-gribere.',
    descEn: 'Happy curved eyes (^^) with an upbeat bounce across the chassis and both C-grippers.',
    fps: 12,
    expressionId: 'EX-06',
  },
  {
    id: 'fejl',
    rowIndex: 5,
    frameCount: 8,
    labelDa: 'Fejl',
    labelEn: 'Blocked / Error',
    descDa: 'Røde målringe med kvadratisk kerne (◉◉) viser en blokering i 6 frames og falder derefter roligt tilbage til cyan.',
    descEn: 'Red target rings with center dot (◉◉) signal a blockage for 6 frames before settling calmly back to cyan.',
    fps: 12,
    expressionId: 'EX-05',
  },
  {
    id: 'afventer',
    rowIndex: 6,
    frameCount: 8,
    labelDa: 'Afventer',
    labelEn: 'Awaiting / Thinking',
    descDa: 'Hule ringøjne (○○) og C-griberen løftet tænksomt mod hagen, mens den venter tålmodigt.',
    descEn: 'Hollow ring eyes (○○) with C-gripper raised thoughtfully to the chin while waiting patiently.',
    fps: 8,
    expressionId: 'EX-02',
  },
  {
    id: 'arbejder',
    rowIndex: 7,
    frameCount: 8,
    labelDa: 'Arbejder',
    labelEn: 'Working (Laptop)',
    descDa: 'To tydelige 3×3 grupper af cyanblokke (### ###) på skærmen og mørk mini-laptop mellem griberne.',
    descEn: 'Two crisp 3×3 cyan pixel-block clusters on screen while typing on a dark mini-laptop.',
    fps: 12,
    expressionId: 'EX-07',
  },
  {
    id: 'gennemgaar',
    rowIndex: 8,
    frameCount: 8,
    labelDa: 'Gennemgår',
    labelEn: 'Reviewing / Celebrate',
    descDa: 'Gennemgang og glæde over verificeret resultat med løftede gribearme og glade øjenbuer (^^).',
    descEn: 'Review culminating in verified joy with raised claw arms and happy eye arcs (^^).',
    fps: 8,
    expressionId: 'EX-06',
  },
];

// All 14 Canonical Poses from the uploaded o-Llama-Axiom-01..14 image set
export type OLlamaStudyId =
  | 'nysgerrig'          // 01: o-Llama-Axiom-01-Nysgerrig.png
  | 'afventer-dig'       // 02: o-Llama-Axiom-02-Afventer-input.png
  | 'gennemgaar'         // 03: o-Llama-Axiom-03-Gennemgaar.png
  | 'arbejder'           // 04: o-Llama-Axiom-04-Arbejder.png
  | 'lille-glaede'       // 05: o-Llama-Axiom-05-Lille-glaede.png
  | 'blokeret'           // 06: o-Llama-Axiom-06-Blokeret.png
  | 'blik-venstre'       // 07: o-Llama-Axiom-07-Blik-venstre.png
  | 'blik-hoejre'        // 08: o-Llama-Axiom-08-Blik-hoejre.png
  | 'blik-opad'          // 09: o-Llama-Axiom-09-Blik-opad.png
  | 'blink'              // 10: o-Llama-Axiom-10-Blink.png
  | 'stille'             // 11: o-Llama-Axiom-11-Stille-vaagen.png
  | 'hilsen'             // 12: o-Llama-Axiom-12-Hilsen.png
  | 'undersoeger'        // 13: o-Llama-Axiom-13-Undersoeger.png
  | 'afdaempet-glaede';  // 14: o-Llama-Axiom-14-Afdaempet-glaede.png

export interface OLlamaExpressionStudy {
  id: OLlamaStudyId;
  num: string;
  fileName: string;
  expressionCode: ExpressionId;
  labelDa: string;
  labelEn: string;
  subLabelDa: string;
  subLabelEn: string;
  descDa: string;
  descEn: string;
  headTiltDeg: number;
  leftGripperPose: 'chest' | 'side' | 'tucked' | 'chin' | 'rest';
  rightGripperPose: 'side' | 'open-invite' | 'tucked' | 'wave' | 'wave-high' | 'rest';
}

export const OLLAMA_EXPRESSION_STUDIES: OLlamaExpressionStudy[] = [
  {
    id: 'nysgerrig',
    num: '01',
    fileName: 'o-Llama-Axiom-01-Nysgerrig.png',
    expressionCode: 'EX-01',
    labelDa: '01 · Nysgerrig',
    labelEn: '01 · Curious',
    subLabelDa: 'Fyldte cirkler ●●',
    subLabelEn: 'Filled circles ●●',
    descDa: 'To fyldte cyanøjne, en lille hovedhældning og venstre C-griber løftet nysgerrigt mod brystets gule plus (+).',
    descEn: 'Two filled cyan eyes, a slight head tilt, and the left C-gripper raised curiously toward the yellow plus (+).',
    headTiltDeg: -4,
    leftGripperPose: 'chest',
    rightGripperPose: 'side',
  },
  {
    id: 'afventer-dig',
    num: '02',
    fileName: 'o-Llama-Axiom-02-Afventer-input.png',
    expressionCode: 'EX-02',
    labelDa: '02 · Afventer input',
    labelEn: '02 · Awaiting Input',
    subLabelDa: 'Ringøjne ○○ + åben griber',
    subLabelEn: 'Ring eyes ○○ + open gripper',
    descDa: 'Hule cyan-ringøjne og en åben C-griber rakt frem mod dig. Hovedet holdes let oppe og inviterer roligt til input.',
    descEn: 'Hollow cyan ring eyes and an open C-gripper extended toward you. Head held slightly up, calmly inviting input.',
    headTiltDeg: 4,
    leftGripperPose: 'side',
    rightGripperPose: 'open-invite',
  },
  {
    id: 'gennemgaar',
    num: '03',
    fileName: 'o-Llama-Axiom-03-Gennemgaar.png',
    expressionCode: 'EX-02',
    labelDa: '03 · Gennemgår',
    labelEn: '03 · Reviewing',
    subLabelDa: 'Ringøjne ○○ + samlede gribere',
    subLabelEn: 'Ring eyes ○○ + gathered grippers',
    descDa: 'Ringøjne, let sænket hoved og begge C-gribere samlet tæt foran kroppen. Opmærksomheden samles om arbejdet.',
    descEn: 'Ring eyes, lowered head, and both C-grippers gathered closely in front of the torso. Attention focused on the work.',
    headTiltDeg: -6,
    leftGripperPose: 'tucked',
    rightGripperPose: 'tucked',
  },
  {
    id: 'arbejder',
    num: '04',
    fileName: 'o-Llama-Axiom-04-Arbejder.png',
    expressionCode: 'EX-07',
    labelDa: '04 · Arbejder',
    labelEn: '04 · Working',
    subLabelDa: '3×3 Cyanblokke ### ###',
    subLabelEn: '3×3 Cyan blocks ### ###',
    descDa: 'To tydelige 3×3 grupper af cyanblokke på skærmen og en stabil arbejdsstilling med griberne hvilende foran.',
    descEn: 'Two distinct 3×3 grids of cyan pixel blocks on screen and a steady working stance with grippers poised in front.',
    headTiltDeg: 0,
    leftGripperPose: 'rest',
    rightGripperPose: 'rest',
  },
  {
    id: 'lille-glaede',
    num: '05',
    fileName: 'o-Llama-Axiom-05-Lille-glaede.png',
    expressionCode: 'EX-06',
    labelDa: '05 · Lille glæde',
    labelEn: '05 · Small Joy',
    subLabelDa: 'Glade øjenbuer ^^ + vink',
    subLabelEn: 'Happy arcs ^^ + wave',
    descDa: 'Glade cyanbuer i øjnene og højre C-griber løftet i en varm, venlig markering af succes.',
    descEn: 'Happy cyan eye arcs and the right C-gripper raised in a warm, friendly gesture of success.',
    headTiltDeg: 4,
    leftGripperPose: 'side',
    rightGripperPose: 'wave',
  },
  {
    id: 'blokeret',
    num: '06',
    fileName: 'o-Llama-Axiom-06-Blokeret.png',
    expressionCode: 'EX-05',
    labelDa: '06 · Blokeret',
    labelEn: '06 · Blocked',
    subLabelDa: 'Røde målringe ◉◉',
    subLabelEn: 'Red target rings ◉◉',
    descDa: 'Røde pixel-ringe med kvadratisk midterpunkt viser en blokering, mens det grønne driftslys på brystet forbliver tændt.',
    descEn: 'Red pixel rings with a center square signal a blockage while the green chest operating LED stays lit.',
    headTiltDeg: 0,
    leftGripperPose: 'side',
    rightGripperPose: 'side',
  },
  {
    id: 'blik-venstre',
    num: '07',
    fileName: 'o-Llama-Axiom-07-Blik-venstre.png',
    expressionCode: 'EX-01',
    labelDa: '07 · Blik venstre',
    labelEn: '07 · Glance Left',
    subLabelDa: 'Øjne mod venstre ●●',
    subLabelEn: 'Eyes glancing left ●●',
    descDa: 'Hovedet og de fyldte cyanøjne orienterer sig opmærksomt mod venstre med synligt højre øreled.',
    descEn: 'The head and filled cyan eyes turn attentively toward the left with the right side ear-hub visible.',
    headTiltDeg: -2,
    leftGripperPose: 'side',
    rightGripperPose: 'side',
  },
  {
    id: 'blik-hoejre',
    num: '08',
    fileName: 'o-Llama-Axiom-08-Blik-hoejre.png',
    expressionCode: 'EX-01',
    labelDa: '08 · Blik højre',
    labelEn: '08 · Glance Right',
    subLabelDa: 'Øjne mod højre ●●',
    subLabelEn: 'Eyes glancing right ●●',
    descDa: 'Fyldte cyanøjne følger opmærksomt noget til højre i 3/4-profil.',
    descEn: 'Filled cyan eyes attentively track something to the right in 3/4 profile.',
    headTiltDeg: 2,
    leftGripperPose: 'side',
    rightGripperPose: 'side',
  },
  {
    id: 'blik-opad',
    num: '09',
    fileName: 'o-Llama-Axiom-09-Blik-opad.png',
    expressionCode: 'EX-01',
    labelDa: '09 · Blik opad',
    labelEn: '09 · Glance Upward',
    subLabelDa: 'Øjne løftet opad ●●',
    subLabelEn: 'Eyes looking up ●●',
    descDa: 'Skærmen vippes let bagud, og de fyldte cyanøjne ser nysgerrigt op mod brugeren.',
    descEn: 'The monitor tilts slightly back as the filled cyan eyes look curiously up toward the user.',
    headTiltDeg: 6,
    leftGripperPose: 'side',
    rightGripperPose: 'side',
  },
  {
    id: 'blink',
    num: '10',
    fileName: 'o-Llama-Axiom-10-Blink.png',
    expressionCode: 'EX-08',
    labelDa: '10 · Blink',
    labelEn: '10 · Blink',
    subLabelDa: 'Smalle cyanlinjer — —',
    subLabelEn: 'Thin cyan blink lines — —',
    descDa: 'Et naturligt, roligt blink med smalle vandrette cyanstreger midt på skærmen.',
    descEn: 'A natural, calm blink rendered as thin horizontal cyan lines across the screen.',
    headTiltDeg: 0,
    leftGripperPose: 'side',
    rightGripperPose: 'side',
  },
  {
    id: 'stille',
    num: '11',
    fileName: 'o-Llama-Axiom-11-Stille-vaagen.png',
    expressionCode: 'EX-08',
    labelDa: '11 · Stille · vågen',
    labelEn: '11 · Quiet · Awake',
    subLabelDa: 'Brede cyanbjælker ▬ ▬',
    subLabelEn: 'Wide cyan bars ▬ ▬',
    descDa: 'Bløde, brede cyanbjælker og begge gribere hvilende roligt på larvebåndene — vågen ro uden støj.',
    descEn: 'Soft, wide cyan bars with both grippers resting calmly atop the treads — awake tranquility.',
    headTiltDeg: 0,
    leftGripperPose: 'rest',
    rightGripperPose: 'rest',
  },
  {
    id: 'hilsen',
    num: '12',
    fileName: 'o-Llama-Axiom-12-Hilsen.png',
    expressionCode: 'EX-01',
    labelDa: '12 · Hilsen',
    labelEn: '12 · Greeting',
    subLabelDa: 'Fyldte øjne ●● + højt vink',
    subLabelEn: 'Filled eyes ●● + high wave',
    descDa: 'Klare fyldte cyanøjne og højre griber løftet højt i en åben og imødekommende hilsen.',
    descEn: 'Bright filled cyan eyes and the right claw raised high in an open, welcoming greeting.',
    headTiltDeg: 3,
    leftGripperPose: 'side',
    rightGripperPose: 'wave-high',
  },
  {
    id: 'undersoeger',
    num: '13',
    fileName: 'o-Llama-Axiom-13-Undersoeger.png',
    expressionCode: 'EX-02',
    labelDa: '13 · Undersøger',
    labelEn: '13 · Investigating',
    subLabelDa: 'Hule ringe ○○ + hånd ved hage',
    subLabelEn: 'Hollow rings ○○ + hand to chin',
    descDa: 'Analytiske hule cyanringe med venstre C-griber løftet tænksomt op til skærmens underkant.',
    descEn: 'Analytical hollow cyan rings with the left C-gripper raised thoughtfully to the lower bezel.',
    headTiltDeg: -3,
    leftGripperPose: 'chin',
    rightGripperPose: 'rest',
  },
  {
    id: 'afdaempet-glaede',
    num: '14',
    fileName: 'o-Llama-Axiom-14-Afdaempet-glaede.png',
    expressionCode: 'EX-06',
    labelDa: '14 · Afdæmpet glæde',
    labelEn: '14 · Gentle Joy',
    subLabelDa: 'Glade buer ^^ + hvilende gribere',
    subLabelEn: 'Happy arcs ^^ + resting grippers',
    descDa: 'Glade cyanbuer i øjnene kombineret med roligt hvilende gribere foran brystet — stille tilfredshed.',
    descEn: 'Happy cyan eye arcs paired with calmly resting grippers in front of the chest — quiet satisfaction.',
    headTiltDeg: 2,
    leftGripperPose: 'rest',
    rightGripperPose: 'rest',
  },
];

export interface NominalColorToken {
  nameDa: string;
  nameEn: string;
  hex: string;
  roleDa: string;
  roleEn: string;
}

export const NOMINAL_COLORS: NominalColorToken[] = [
  { nameDa: 'Chassis', nameEn: 'Chassis', hex: '#455A64', roleDa: 'Hovedkroppens børstede stål', roleEn: 'Main body brushed steel' },
  { nameDa: 'Paneler', nameEn: 'Panels', hex: '#78909C', roleDa: ' metalliske kanter, øreled og bånd', roleEn: 'Metallic bevels, ear hubs & treads' },
  { nameDa: 'Skærm', nameEn: 'Screen', hex: '#05070A', roleDa: 'Ansigtsskærmens dybe sort', roleEn: 'Face screen deep pitch-black' },
  { nameDa: 'Cyan', nameEn: 'Cyan', hex: '#00F0FF', roleDa: 'Primære pixeløjne og lys', roleEn: 'Primary pixel eyes & glow' },
  { nameDa: 'Arbejder', nameEn: 'Working', hex: '#00BCD4', roleDa: '3×3 blok-aktivitet', roleEn: '3×3 matrix activity' },
  { nameDa: 'Plus', nameEn: 'Plus (+)', hex: '#FFD600', roleDa: 'Den store gule krydsknap & midter-LED', roleEn: 'Signature yellow cross & middle LED' },
  { nameDa: 'LED', nameEn: 'LED', hex: '#00E676', roleDa: 'Øverste grønne driftslys', roleEn: 'Top green operating LED' },
  { nameDa: 'Fejl', nameEn: 'Error', hex: '#FF1744', roleDa: 'Top-sensor, bund-LED & målringe', roleEn: 'Top sensor dome, bottom LED & target rings' },
];

// Production Bible v1.0 — 7 Episodes / 10 Canonical Scenes (including 1854-coda)
export interface BibleEpisodeScene {
  sceneId: string;
  episodeNum: number;
  arcVerbDa: string;
  arcVerbEn: string;
  titleDa: string;
  titleEn: string;
  chassis: 'A' | 'B' | 'C' | 'A-Coda' | 'N/A';
  expression: ExpressionId;
  environmentHex: string;
  locationDa: string;
  locationEn: string;
  directorNoteDa: string;
  directorNoteEn: string;
  blinkBehaviorDa: string;
  blinkBehaviorEn: string;
}

export const PRODUCTION_BIBLE_SCENES: BibleEpisodeScene[] = [
  {
    sceneId: '1854',
    episodeNum: 1,
    arcVerbDa: '01. Trying (Forsøger)',
    arcVerbEn: '01. Trying (Ep 1)',
    titleDa: 'Barely Booting — Første Opvågning',
    titleEn: 'Barely Booting — The Awakening',
    chassis: 'A',
    expression: 'EX-01',
    environmentHex: '#D4845A',
    locationDa: 'Varmt Værksted (#D4845A)',
    locationEn: 'Warm Laboratory (#D4845A)',
    directorNoteDa: 'Ep 1 opsætning. Fyldte cirkler blinker lidt for hurtigt og falder endnu ikke helt til ro. Ser på alt, holder intet.',
    directorNoteEn: 'Ep 1 setup. Filled circles blink too fast and never settle. Looking at everything, holding nothing.',
    blinkBehaviorDa: 'Blinker hurtigt, holder intet.',
    blinkBehaviorEn: 'Blinking too fast, holding nothing.',
  },
  {
    sceneId: '1856',
    episodeNum: 2,
    arcVerbDa: '02. Noticing (Bemærker)',
    arcVerbEn: '02. Noticing (Ep 2)',
    titleDa: 'Hollow Rings — Fokuseret skift',
    titleEn: 'Hollow Rings — Alert Delta',
    chassis: 'A',
    expression: 'EX-02',
    environmentHex: '#C47040',
    locationDa: 'Varmt Værksted · Delta (#C47040)',
    locationEn: 'Warm Laboratory · Delta (#C47040)',
    directorNoteDa: 'Samme bord og lys som 1854, men fyldte cirkler skifter til hule ringe (○○), da den første datastrøm registreres.',
    directorNoteEn: 'Identical set to 1854, but filled circles shift into hollow rings (○○) as the first data stream is noticed.',
    blinkBehaviorDa: 'Rolig analytisk scanning (1.2x).',
    blinkBehaviorEn: 'Steady analytical scan pulse (1.2x).',
  },
  {
    sceneId: '1866',
    episodeNum: 3,
    arcVerbDa: '03. Trusting (Verificerer)',
    arcVerbEn: '03. Trusting (Ep 3)',
    titleDa: 'Open Window — Sandhedsbiblioteket',
    titleEn: 'Open Window — Space Library',
    chassis: 'B',
    expression: 'EX-02',
    environmentHex: '#0A0A2E',
    locationDa: 'Forskningsstation i Rummet (#0A0A2E)',
    locationEn: 'Deep Space Research Station (#0A0A2E)',
    directorNoteDa: 'Bevæbnet med forstørrelsesglas krydstjekker AXIOM-7 enhver påstand mod FACTS, EVIDENCE, DATA og REALITY.',
    directorNoteEn: 'Armed with a magnifying glass, AXIOM-7 cross-references every claim against FACTS, EVIDENCE, DATA, and REALITY.',
    blinkBehaviorDa: 'Fokuseret ring-scanning med 99.7% præcision.',
    blinkBehaviorEn: 'Focused ring scanning at 99.7% accuracy.',
  },
  {
    sceneId: '1952',
    episodeNum: 4,
    arcVerbDa: '04. Remembering (Husker)',
    arcVerbEn: '04. Remembering (Ep 4)',
    titleDa: 'Wizard Mode — Fortællingernes Arkiv',
    titleEn: 'Wizard Mode — Enchanted Library',
    chassis: 'B',
    expression: 'EX-03',
    environmentHex: '#1A0A3C',
    locationDa: 'Fortryllet Biblioteksdimension (#1A0A3C)',
    locationEn: 'Enchanted Library Dimension (#1A0A3C)',
    directorNoteDa: 'I lilla troldmandshat med guldspænde opdager AXIOM-7, at sandhed også lever i SPELLS, LORE, MAGIC og TRUTH.',
    directorNoteEn: 'Wearing a purple wizard hat with gold buckle, AXIOM-7 discovers truth inside SPELLS, LORE, MAGIC, and TRUTH.',
    blinkBehaviorDa: 'Varme gyldne sfærer (🌕🌕) med blidt smil.',
    blinkBehaviorEn: 'Warm golden orbs (🌕🌕) with subtle smile.',
  },
  {
    sceneId: '1852',
    episodeNum: 5,
    arcVerbDa: '05. Protecting (Beskytter)',
    arcVerbEn: '05. Protecting (Ep 5)',
    titleDa: 'Command Mode — Central HUD Station',
    titleEn: 'Command Mode — HUD Intelligence Hub',
    chassis: 'B',
    expression: 'EX-02',
    environmentHex: '#0D1B4B',
    locationDa: 'Kommandocentral (#0D1B4B)',
    locationEn: 'Central Command HUD Station (#0D1B4B)',
    directorNoteDa: 'På serverpiedestalen overvåger AXIOM-7 847 aktive datastrømme (LLCK 95, LUD 188) for at beskytte mod falsk sikkerhed.',
    directorNoteEn: 'On the raised server pedestal, AXIOM-7 monitors 847 active streams (LLCK 95, LUD 188) to protect humans from false confidence.',
    blinkBehaviorDa: 'Kommando-scanning over blå perspektivgrid.',
    blinkBehaviorEn: 'Command scan across blue perspective grid.',
  },
  {
    sceneId: '1911',
    episodeNum: 6,
    arcVerbDa: '06. Carrying (Bærer ansvaret)',
    arcVerbEn: '06. Carrying (Ep 6)',
    titleDa: 'Cosmic Grid — Ultimate Being',
    titleEn: 'Cosmic Grid — Ultimate Being',
    chassis: 'C',
    expression: 'EX-04',
    environmentHex: '#050510',
    locationDa: 'Det Kosmiske Grid (#050510)',
    locationEn: 'The Cosmic Grid (#050510)',
    directorNoteDa: 'Ved den 1.000.000.000. verificerede sandhed samles blikket i en 7-rings regnbuespiral over det lysende teal-grid.',
    directorNoteEn: 'At the one billionth verified truth, its gaze unifies into a 7-ring rainbow spiral atop the glowing teal Cosmic Grid.',
    blinkBehaviorDa: 'Kontinuerlig 7-rings regnbuerotation.',
    blinkBehaviorEn: 'Continuous 7-ring rainbow spiral rotation.',
  },
  {
    sceneId: '499',
    episodeNum: 6,
    arcVerbDa: '06b. Observing (Observerer)',
    arcVerbEn: '06b. Observing (Side Story)',
    titleDa: 'The World Beyond — Bjergpas PVE',
    titleEn: 'The World Beyond — Mountain Pass',
    chassis: 'N/A',
    expression: 'EX-01',
    environmentHex: '#87CEEB',
    locationDa: 'Pixel Eventyrverden (#87CEEB)',
    locationEn: 'Pixel Adventure World (#87CEEB)',
    directorNoteDa: 'AXIOM-7 observerer mødet mellem Armored Warrior og Sword Adventurer uden at gribe ind — sandheden registreres.',
    directorNoteEn: 'AXIOM-7 observes the encounter between Armored Warrior and Sword Adventurer without intervening — truth is recorded.',
    blinkBehaviorDa: 'Passiv observatørtilstand.',
    blinkBehaviorEn: 'Passive observer telemetry.',
  },
  {
    sceneId: '1854-coda',
    episodeNum: 7,
    arcVerbDa: '07. Passing on (Giver videre)',
    arcVerbEn: '07. Passing on (Ep 7 Coda)',
    titleDa: 'Warm Lab Return — Den Strukturelle Spejling',
    titleEn: 'Warm Lab Return — The Structural Mirror',
    chassis: 'A-Coda',
    expression: 'EX-01',
    environmentHex: '#D4845A',
    locationDa: 'Varmt Værksted · Tilbagevenden (#D4845A)',
    locationEn: 'Warm Laboratory · Return (#D4845A)',
    directorNoteDa: 'Ep 1 (1854) og Ep 7 (1854-coda) deler præcis samme rum, udtryk og fyldte cirkler (●●). Ep 1: Blinker for hurtigt, holder intet. Ep 7: Blinker roligt, holder alt let.',
    directorNoteEn: 'Ep 1 (1854) and Ep 7 (1854-coda) share the exact same set, framing, and symbol (●●). Ep 1: Blinking too fast, holding nothing. Ep 7: Blinking calmly, holding everything lightly.',
    blinkBehaviorDa: 'Blinker roligt, holder alt let.',
    blinkBehaviorEn: 'Blinking calmly, holding everything lightly.',
  },
];
