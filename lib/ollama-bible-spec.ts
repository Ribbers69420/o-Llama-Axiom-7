// Canonical Specifications for "o-Llama - Axiom (Finpudsning · pixelstil)"
// and "Production Bible v1.0 — The Token of Trust · Qwen's Legacy"

import type { ExpressionId } from './game-rules.ts';

export type AppLanguage = 'da' | 'en';
export type EnvironmentMoodId = 'vaerksted' | 'arkiv' | 'kosmos';
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
  rowIndex: number; // 0 to 8 in the 9-row x 8-col transparent spritesheet
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
    labelDa: 'Hvile',
    labelEn: 'Idle',
    descDa: 'Den eksisterende figur og dens faktiske billeder. Rolig blinkerytme med fyldte cyanøjne.',
    descEn: 'The baseline figure in calm resting rhythm with filled cyan eyes and natural blink.',
    fps: 8,
    expressionId: 'EX-01',
  },
  {
    id: 'mod-hoejre',
    rowIndex: 1,
    labelDa: 'Mod højre',
    labelEn: 'Move Right',
    descDa: 'Kørsel mod højre på kompakte larvebånd med bevaret kontrolpanel og det gule plus.',
    descEn: 'Driving right on compact tank treads while keeping the front control panel and yellow cross visible.',
    fps: 12,
    expressionId: 'EX-01',
  },
  {
    id: 'mod-venstre',
    rowIndex: 2,
    labelDa: 'Mod venstre',
    labelEn: 'Move Left',
    descDa: 'Kørsel mod venstre med let fremadrettet blik og rullende larvebånd.',
    descEn: 'Driving left with forward gaze and rolling 8-segment treads.',
    fps: 12,
    expressionId: 'EX-01',
  },
  {
    id: 'hilsen',
    rowIndex: 3,
    labelDa: 'Hilsen',
    labelEn: 'Greeting',
    descDa: 'Rolig hilsen med løftet venstre griber og venlig hovedhældning.',
    descEn: 'Friendly wave with raised left claw gripper and gentle head tilt.',
    fps: 8,
    expressionId: 'EX-01',
  },
  {
    id: 'hop',
    rowIndex: 4,
    labelDa: 'Hop',
    labelEn: 'Jump / Joy',
    descDa: 'Glad bue i øjnene (^^) og et lille løft i chassis og begge gribere.',
    descEn: 'Happy curved eyes (^^) with an upbeat bounce across the chassis and both grippers.',
    fps: 12,
    expressionId: 'EX-06',
  },
  {
    id: 'fejl',
    rowIndex: 5,
    labelDa: 'Fejl',
    labelEn: 'Blocked / Error',
    descDa: 'Røde ringøjne viser en blokering og falder derefter roligt tilbage til cyan.',
    descEn: 'Red target rings signal a blockage before settling calmly back to cyan.',
    fps: 12,
    expressionId: 'EX-05',
  },
  {
    id: 'afventer',
    rowIndex: 6,
    labelDa: 'Afventer',
    labelEn: 'Awaiting Input',
    descDa: 'Hule ringøjne, let løftet hoved og en inviterende griber, der venter tålmodigt.',
    descEn: 'Hollow ring eyes, slightly raised head, and an inviting gripper waiting patiently.',
    fps: 8,
    expressionId: 'EX-02',
  },
  {
    id: 'arbejder',
    rowIndex: 7,
    labelDa: 'Arbejder',
    labelEn: 'Working',
    descDa: 'To tydelige grupper af cyanblokke på skærmen og mini-laptop mellem griberne.',
    descEn: 'Two crisp cyan pixel-block clusters on screen while typing on a mini-laptop.',
    fps: 12,
    expressionId: 'EX-07',
  },
  {
    id: 'gennemgaar',
    rowIndex: 8,
    labelDa: 'Gennemgår',
    labelEn: 'Reviewing',
    descDa: 'Undersøgende gennemgang og glæde over verificeret resultat.',
    descEn: 'Focused review culminating in verified completion.',
    fps: 8,
    expressionId: 'EX-02',
  },
];

export type OLlamaStudyId =
  | 'nysgerrig'
  | 'undersoeger'
  | 'arbejder'
  | 'afventer-dig'
  | 'gennemgaar'
  | 'lille-glaede'
  | 'blokeret'
  | 'stille';

export interface OLlamaExpressionStudy {
  id: OLlamaStudyId;
  expressionCode: ExpressionId;
  labelDa: string;
  labelEn: string;
  subLabelDa: string;
  subLabelEn: string;
  descDa: string;
  descEn: string;
  headTiltDeg: number;
  leftGripperPose: 'neutral' | 'open-invite' | 'tucked' | 'wave' | 'laptop';
  rightGripperPose: 'neutral' | 'open-invite' | 'tucked' | 'chin' | 'laptop';
}

export const OLLAMA_EXPRESSION_STUDIES: OLlamaExpressionStudy[] = [
  {
    id: 'nysgerrig',
    expressionCode: 'EX-01',
    labelDa: 'Nysgerrig',
    labelEn: 'Curious',
    subLabelDa: 'Fyldte cirkler ●●',
    subLabelEn: 'Filled circles ●●',
    descDa: 'To fyldte cyanøjne og en lille hovedhældning. Klar til at møde noget nyt.',
    descEn: 'Two filled cyan eyes and a slight head tilt. Ready to meet something new.',
    headTiltDeg: -5,
    leftGripperPose: 'neutral',
    rightGripperPose: 'neutral',
  },
  {
    id: 'undersoeger',
    expressionCode: 'EX-02',
    labelDa: 'Undersøger',
    labelEn: 'Investigating',
    subLabelDa: 'Hule ringe ○○',
    subLabelEn: 'Hollow rings ○○',
    descDa: 'Hule cyanringe fokuserer roligt på opgaven og krydstjekker kilder.',
    descEn: 'Hollow cyan rings focus calmly on the task and cross-check sources.',
    headTiltDeg: 0,
    leftGripperPose: 'neutral',
    rightGripperPose: 'chin',
  },
  {
    id: 'arbejder',
    expressionCode: 'EX-07',
    labelDa: 'Arbejder',
    labelEn: 'Working',
    subLabelDa: 'Cyanblokke ░░',
    subLabelEn: 'Cyan blocks ░░',
    descDa: 'To tydelige grupper af cyanblokke og en stabil grundstilling. Aktiviteten bæres af skærmen.',
    descEn: 'Two distinct groups of cyan pixel blocks and a stable stance. Activity is carried by the screen.',
    headTiltDeg: 0,
    leftGripperPose: 'laptop',
    rightGripperPose: 'laptop',
  },
  {
    id: 'afventer-dig',
    expressionCode: 'EX-02',
    labelDa: 'Afventer dig',
    labelEn: 'Awaiting You',
    subLabelDa: 'Ringøjne + åben griber',
    subLabelEn: 'Ring eyes + open gripper',
    descDa: 'Ringøjne og en åben griber mod dig. Hovedet holdes let oppe; posituren inviterer roligt til input.',
    descEn: 'Ring eyes and an open gripper toward you. Head held slightly up; posture calmly invites input.',
    headTiltDeg: 6,
    leftGripperPose: 'open-invite',
    rightGripperPose: 'neutral',
  },
  {
    id: 'gennemgaar',
    expressionCode: 'EX-02',
    labelDa: 'Gennemgår',
    labelEn: 'Reviewing',
    subLabelDa: 'Ringøjne + sænket hoved',
    subLabelEn: 'Ring eyes + lowered head',
    descDa: 'Ringøjne, sænket hoved og begge gribere tæt ved kroppen. Opmærksomheden samles om arbejdet.',
    descEn: 'Ring eyes, lowered head, and both grippers tucked close to the body. Attention gathered on the work.',
    headTiltDeg: -8,
    leftGripperPose: 'tucked',
    rightGripperPose: 'tucked',
  },
  {
    id: 'lille-glaede',
    expressionCode: 'EX-06',
    labelDa: 'Lille glæde',
    labelEn: 'Small Joy',
    subLabelDa: 'Glad bue ^^',
    subLabelEn: 'Happy arc ^^',
    descDa: 'En glad bue viser et lille øjeblik af succes og verificeret sandhed.',
    descEn: 'A happy arc shows a quiet moment of success and verified truth.',
    headTiltDeg: 4,
    leftGripperPose: 'wave',
    rightGripperPose: 'open-invite',
  },
  {
    id: 'blokeret',
    expressionCode: 'EX-05',
    labelDa: 'Blokeret',
    labelEn: 'Blocked',
    subLabelDa: 'Røde målringe ◉◉',
    subLabelEn: 'Red target rings ◉◉',
    descDa: 'Røde øjne viser en blokering; de grønne kontrollys lover ikke fejlfrihed, men åbenhed for rettelse.',
    descEn: 'Red eyes signal a blockage; the green LED does not promise infallibility, but openness to correction.',
    headTiltDeg: -4,
    leftGripperPose: 'tucked',
    rightGripperPose: 'tucked',
  },
  {
    id: 'stille',
    expressionCode: 'EX-08',
    labelDa: 'Stille · vågen',
    labelEn: 'Quiet · Awake',
    subLabelDa: 'Cyanlinjer --',
    subLabelEn: 'Cyan lines --',
    descDa: 'Cyanlinjerne i "Stille" betyder vågen ro. Den mørke EX-08-sovetilstand bevares i kilden.',
    descEn: 'The cyan lines in "Quiet" mean awake calm. The dark EX-08 sleep state is preserved in the source.',
    headTiltDeg: 0,
    leftGripperPose: 'neutral',
    rightGripperPose: 'neutral',
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
  { nameDa: 'Chassis', nameEn: 'Chassis', hex: '#2D2D2D', roleDa: 'Hovedkroppens mørke metal', roleEn: 'Main body dark metal' },
  { nameDa: 'Paneler', nameEn: 'Panels', hex: '#3D3D3D', roleDa: 'Sekundære paneler og led', roleEn: 'Secondary panels & joints' },
  { nameDa: 'Skærm', nameEn: 'Screen', hex: '#0A0A0A', roleDa: 'Ansigtsskærmens dybe sort', roleEn: 'Face screen deep black' },
  { nameDa: 'Cyan', nameEn: 'Cyan', hex: '#00E5FF', roleDa: 'Primære øjne og lys', roleEn: 'Primary eyes & highlights' },
  { nameDa: 'Arbejder', nameEn: 'Working', hex: '#00BCD4', roleDa: 'Aktivitet og glød', roleEn: 'Activity & eye glow' },
  { nameDa: 'Plus', nameEn: 'Plus (+)', hex: '#FFD600', roleDa: 'Den store gule krydsknap', roleEn: 'Signature yellow cross button' },
  { nameDa: 'LED', nameEn: 'LED', hex: '#00C853', roleDa: 'Grønt driftslys og kendetegn', roleEn: 'Green operating status LED' },
  { nameDa: 'Fejl', nameEn: 'Error', hex: '#FF1744', roleDa: 'Blokering og kontrolknap', roleEn: 'Blockage & red control indicator' },
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
