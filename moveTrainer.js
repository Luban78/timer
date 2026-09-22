import * as puzzles from "https://cdn.cubing.net/v0/js/cubing/puzzles";
import { Alg } from "https://cdn.cubing.net/v0/js/cubing/alg";
import { ExperimentalSVGAnimator } from "https://cdn.cubing.net/v0/js/cubing/twisty";
import {
  rotateMove,
  isTrainerMove,
  stripTrainerMove,
  getTrainerRotation,
  setTrainerRotation
} from "./orientation.js";
import {
  pllAlgs,
  ollAlgs,
  getActivePllAlg,
  getActiveOllAlg
} from "./algorithms.js";

/* =========================================================
   STAV TRAINERU
   ========================================================= */

let displayMoves = [];
let checkMoves = [];

let displayIndex = 0;
let checkIndex = 0;
let wrongDisplayIndex = -1;
let correctionStack = [];

// Zatím řešíme bezpečně jen rotaci y.
// x / z zatím pouze přeskočíme.
let virtualY = 0;
let virtualX = 0;
let virtualZ = 0;

// Smart Cube nehlásí fyzické otočení celé kostky v ruce.
// Proto u PLL na začátku solve automaticky zamkneme osu podle prvního
// jednoznačného bočního tahu (R/F/L/B), aniž bychom měnili algoritmus.
let autoOrientacePll = false;



/* =========================================================
   ZÁKLADNÍ POMOCNÉ FUNKCE
   ========================================================= */

function expandMove(move, displayIndex) {
  return [
    { move, displayIndex }
  ];
}

function expandAlgorithm(moves) {
  return moves.flatMap((move, index) => expandMove(move, index));
}

function isCubeRotationMove(move) {
  return (
    move === "x" || move === "x'" || move === "x2" ||
    move === "y" || move === "y'" || move === "y2" ||
    move === "z" || move === "z'" || move === "z2"
  );
}

function buildDisplaySteps(moves) {
  const steps = [];

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];

    if (isCubeRotationMove(move) && moves[i + 1]) {
      steps.push(move + " " + moves[i + 1]);
      i++;
    } else {
      steps.push(move);
    }
  }

  return steps;
}

function getGroupedDisplayIndex(originalIndex) {
  let stepIndex = 0;

  for (let i = 0; i < displayMoves.length; i++) {
    const move = displayMoves[i];

    if (isCubeRotationMove(move) && displayMoves[i + 1]) {
      if (originalIndex === i || originalIndex === i + 1) {
        return stepIndex;
      }

      i++;
      stepIndex++;
      continue;
    }

    if (originalIndex === i) {
      return stepIndex;
    }

    stepIndex++;
  }

  return stepIndex;
}


/* =========================================================
   OPRAVA CHYBNÉHO TAHU BEZ RESETU ALGORITMU
   ========================================================= */

function normalizeCorrectionMove(move) {
  return String(move || "")
    .trim()
    .replace(/’/g, "'")
    .replace(/\s+/g, "");
}

function areInverseCorrectionMoves(a, b) {
  a = normalizeCorrectionMove(a);
  b = normalizeCorrectionMove(b);
  if (!a || !b) return false;

  // Dvojtah je sám sobě inverzní.
  if (a.endsWith("2") || b.endsWith("2")) {
    return a === b && a.endsWith("2");
  }

  const baseA = a.endsWith("'") ? a.slice(0, -1) : a;
  const baseB = b.endsWith("'") ? b.slice(0, -1) : b;
  if (baseA !== baseB) return false;

  return a.endsWith("'") !== b.endsWith("'");
}

function processCorrectionMove(move, selectedAlg) {
  const normalized = normalizeCorrectionMove(move);
  if (!normalized) return "correction";

  const last = correctionStack[correctionStack.length - 1];

  // Správné vrácení posledního chybného tahu.
  if (last && areInverseCorrectionMoves(last, normalized)) {
    correctionStack.pop();

    if (correctionStack.length === 0) {
      wrongDisplayIndex = -1;
      renderTrainer(selectedAlg);
      return "corrected";
    }

    renderTrainer(selectedAlg);
    return "undoing";
  }

  // Když při opravě udělá uživatel další chybu, musí ji nejdřív vrátit.
  correctionStack.push(normalized);
  renderTrainer(selectedAlg);
  return "wrong";
}

/* =========================================================
   VIRTUÁLNÍ ROTACE Y
   ========================================================= */

function applySkippedRotation(move) {
  if (move === "y") {
    virtualY = (virtualY + 1) % 4;
  }

  if (move === "y'") {
    virtualY = (virtualY + 3) % 4;
  }

  if (move === "y2") {
    virtualY = (virtualY + 2) % 4;
  }

  if (move === "x") {
    virtualX = (virtualX + 1) % 4;
  }

  if (move === "x'") {
    virtualX = (virtualX + 3) % 4;
  }

  if (move === "x2") {
    virtualX = (virtualX + 2) % 4;
  }
  if (move === "z") {
  virtualZ = (virtualZ + 3) % 4;
}

if (move === "z'") {
  virtualZ = (virtualZ + 1) % 4;
}

if (move === "z2") {
  virtualZ = (virtualZ + 2) % 4;
}
  window.__lastSkippedRotation = move;
}

function applyVirtualXToExpectedMove(move) {
  if (!move) return move;

  const face = move[0];
  const suffix = move.slice(1);

  if (virtualX === 0) return move;

  const maps = [
    { U: "U", D: "D", F: "F", B: "B", R: "R", L: "L" },

    // po x: podle testu D2 se fyzicky hlásí jako B2
    { U: "F", D: "B", F: "D", B: "U", R: "R", L: "L" },

    // x2
    { U: "D", D: "U", F: "B", B: "F", R: "R", L: "L" },

    // x'
    { U: "B", D: "F", F: "U", B: "D", R: "R", L: "L" }
  ];

  const map = maps[virtualX];

  if (!map[face]) return move;

  return map[face] + suffix;
}


function applyVirtualZToExpectedMove(move) {
  if (!move) return move;
  
  const face = move[0];
  const suffix = move.slice(1);
  
  if (virtualZ === 0) return move;
  
  const maps = [
    { U: "U", D: "D", F: "F", B: "B", R: "R", L: "L" },
    
    // správná rotace z podle testu:
    // R se fyzicky hlásí jako D
    { U: "R", R: "D", D: "L", L: "U", F: "F", B: "B" },
    
    // z2
    { U: "D", D: "U", R: "L", L: "R", F: "F", B: "B" },
    
    // z'
    { U: "L", L: "D", D: "R", R: "U", F: "F", B: "B" }
  ];
  
  const map = maps[virtualZ];
  
  if (!map[face]) return move;
  
  return map[face] + suffix;
}
function applyVirtualYToExpectedMove(move) {
  if (!move) return move;

  const face = move[0];
  const suffix = move.slice(1);

  if (virtualY === 0) return move;

  const maps = [
    { F: "F", R: "R", B: "B", L: "L" },

    // po y: R se fyzicky hlásí jako F
    { F: "L", R: "F", B: "R", L: "B" },

    // y2
    { F: "B", R: "L", B: "F", L: "R" },

    // y'
    { F: "R", R: "B", B: "L", L: "F" }
  ];

  const map = maps[virtualY];

  if (!map[face]) return move;

  return map[face] + suffix;
}

function skipRotationMoves() {
  let skipped = false;

  while (true) {
    const expected = checkMoves[checkIndex];

    if (!expected) break;
    if (!isCubeRotationMove(expected.move)) break;

    applySkippedRotation(expected.move);
    checkIndex++;
    skipped = true;
  }

  return skipped;
}


/* =========================================================
   VYKRESLENÍ ALGORITMU
   ========================================================= */

export function renderAlgorithmPreview(selectedAlg) {
  const algFromDataset = selectedAlg.dataset.algText || "";

  const text = selectedAlg.innerText || "";
  const parts = text.split(":");
  const alg = algFromDataset || (parts[1] ? parts[1].trim() : "");

  if (!alg) {
    displayMoves = [];
    checkMoves = [];
    displayIndex = 0;
    checkIndex = 0;
    wrongDisplayIndex = -1;
    correctionStack = [];
    virtualY = 0;
    virtualX = 0;
    virtualZ = 0;
    autoOrientacePll = false;

    selectedAlg.innerHTML = renderAlgorithmCard("Nevybráno", [], true);
    return;
  }

  displayMoves = alg.split(/\s+/).filter(Boolean);
  checkMoves = expandAlgorithm(displayMoves);

  displayIndex = 0;
  checkIndex = 0;
  wrongDisplayIndex = -1;
  correctionStack = [];
  virtualY = 0;
  virtualX = 0;
  virtualZ = 0;

  // Každý nový PLL solve může uživatel držet v jiné fyzické orientaci,
  // aby pattern odpovídal obrázku. Samotný zobrazený algoritmus se NEMĚNÍ.
  const algName = selectedAlg.dataset.algName || "";
  autoOrientacePll = Object.prototype.hasOwnProperty.call(pllAlgs, algName);

  renderTrainer(selectedAlg);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/*
 * Obrázky algoritmů se přidávají pouze sem.
 * Soubor vlož do složky alg-images a doplň název algoritmu.
 */
const ALGORITHM_IMAGE_MAP = {
  "F-perm": "alg-images/f-perm.png"
};

function getCustomAlgorithmImage(algName) {
  try {
    return localStorage.getItem("algorithmImage:" + algName) || "";
  } catch {
    return "";
  }
}

function getAutomaticDiagramAlgorithm(algName) {
  if (Object.prototype.hasOwnProperty.call(pllAlgs, algName)) {
    return getActivePllAlg(algName) || "";
  }

  if (Object.prototype.hasOwnProperty.call(ollAlgs, algName)) {
    return getActiveOllAlg(algName) || "";
  }

  return "";
}

function renderCubePlaceholder(algName) {
  // Vlastní obrázek přiřazený přes tužku má vždy nejvyšší prioritu.
  const customImage = getCustomAlgorithmImage(algName);

  if (customImage) {
    return `
      <div class="alg-picture alg-picture-image" data-alg="${escapeHtml(algName)}" aria-label="Vlastní náhled algoritmu ${escapeHtml(algName)}">
        <img src="${escapeHtml(customImage)}" alt="Náhled ${escapeHtml(algName)}">
      </div>`;
  }

  // Automatický PLL/OLL diagram. Geometrii vytvoří cubing.js a finální barvy
  // převedeme do stejného stylu, jako má referenční PLL/OLL aplikace.
  const automaticAlg = getAutomaticDiagramAlgorithm(algName);
  if (automaticAlg) {
    return `
      <div
        class="alg-picture alg-picture-auto"
        data-alg="${escapeHtml(algName)}"
        data-auto-alg="${escapeHtml(automaticAlg)}"
        aria-label="Automatický diagram ${escapeHtml(algName)}"
      ></div>`;
  }

  // Starší obrázek přímo v projektu necháváme už jen jako nouzovou zálohu.
  const builtInImage = ALGORITHM_IMAGE_MAP[algName];
  if (builtInImage) {
    return `
      <div class="alg-picture alg-picture-image" data-alg="${escapeHtml(algName)}" aria-label="Náhled algoritmu ${escapeHtml(algName)}">
        <img src="${escapeHtml(builtInImage)}" alt="Náhled ${escapeHtml(algName)}">
      </div>`;
  }

  return `
    <div class="alg-picture" data-alg="${escapeHtml(algName)}" aria-label="Náhled orientace kostky">
      <div class="alg-cube-placeholder">
        <span class="cube-cell is-corner"></span>
        <span class="cube-cell"></span>
        <span class="cube-cell is-corner"></span>
        <span class="cube-cell"></span>
        <span class="cube-cell"></span>
        <span class="cube-cell"></span>
        <span class="cube-cell is-corner"></span>
        <span class="cube-cell"></span>
        <span class="cube-cell is-corner"></span>
      </div>
    </div>`;
}

function jePllAlgoritmus(algName) {
  return Object.prototype.hasOwnProperty.call(pllAlgs, algName);
}

function jeOllAlgoritmus(algName) {
  return Object.prototype.hasOwnProperty.call(ollAlgs, algName);
}

let dataAutomatickehoDiagramu = null;

async function pripravDataAutomatickehoDiagramu() {
  if (dataAutomatickehoDiagramu) return dataAutomatickehoDiagramu;

  const kpuzzle = await puzzles.cube3x3x3.kpuzzle();
  const llSvg = await puzzles.cube3x3x3.llSVG();
  dataAutomatickehoDiagramu = { kpuzzle, llSvg };
  return dataAutomatickehoDiagramu;
}



function jeSkoroBila(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return min >= 205 && (max - min) <= 28;
}

function jeBarevnySticker(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max >= 90 && (max - min) >= 38;
}


const PLL_BARVY_FACE = {
  F: [50, 205, 50],
  R: [254, 0, 0],
  B: [35, 102, 255],
  L: [255, 165, 0]
};

function vzdalBarvy(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

function nactiBarvuZObrazku(imageData, nx, ny) {
  const { data, width, height } = imageData;
  const cx = Math.round(nx * (width - 1));
  const cy = Math.round(ny * (height - 1));
  const polomer = Math.max(3, Math.round(width * 0.012));
  const kandidati = [];

  for (let y = Math.max(0, cy - polomer); y <= Math.min(height - 1, cy + polomer); y++) {
    for (let x = Math.max(0, cx - polomer); x <= Math.min(width - 1, cx + polomer); x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 80) continue;

      const rgb = [data[i], data[i + 1], data[i + 2]];
      const max = Math.max(...rgb);
      const min = Math.min(...rgb);
      if (max < 80 || max - min < 35) continue;
      kandidati.push(rgb);
    }
  }

  if (!kandidati.length) return null;

  const prumer = [0, 0, 0];
  kandidati.forEach(rgb => {
    prumer[0] += rgb[0];
    prumer[1] += rgb[1];
    prumer[2] += rgb[2];
  });
  prumer[0] /= kandidati.length;
  prumer[1] /= kandidati.length;
  prumer[2] /= kandidati.length;

  let nejblizsi = null;
  let nejmensi = Infinity;
  Object.entries(PLL_BARVY_FACE).forEach(([face, rgb]) => {
    const vzdalenost = vzdalBarvy(prumer, rgb);
    if (vzdalenost < nejmensi) {
      nejmensi = vzdalenost;
      nejblizsi = face;
    }
  });

  return nejblizsi;
}

function zjistiPllPresuny(imageData) {
  // Středy bočních stickerů v LL SVG nejsou na 30/70 %, ale blíž 18/82 %.
  // Staré souřadnice často sáhly do sousedního stickeru a u R/G permů
  // vytvořily falešné přesuny rohů -> "chomáč" šipek uprostřed.
  const band = {
    topL: nactiBarvuZObrazku(imageData, 0.18, 0.07),
    topM: nactiBarvuZObrazku(imageData, 0.50, 0.07),
    topR: nactiBarvuZObrazku(imageData, 0.82, 0.07),
    rightT: nactiBarvuZObrazku(imageData, 0.93, 0.18),
    rightM: nactiBarvuZObrazku(imageData, 0.93, 0.50),
    rightB: nactiBarvuZObrazku(imageData, 0.93, 0.82),
    bottomL: nactiBarvuZObrazku(imageData, 0.18, 0.93),
    bottomM: nactiBarvuZObrazku(imageData, 0.50, 0.93),
    bottomR: nactiBarvuZObrazku(imageData, 0.82, 0.93),
    leftT: nactiBarvuZObrazku(imageData, 0.07, 0.18),
    leftM: nactiBarvuZObrazku(imageData, 0.07, 0.50),
    leftB: nactiBarvuZObrazku(imageData, 0.07, 0.82)
  };

  const targetEdge = { B: "ET", R: "ER", F: "EB", L: "EL" };
  const cornerTarget = {
    BL: "CTL",
    BR: "CTR",
    FR: "CBR",
    FL: "CBL"
  };

  const mapping = {};
  mapping.ET = targetEdge[band.topM] || "ET";
  mapping.ER = targetEdge[band.rightM] || "ER";
  mapping.EB = targetEdge[band.bottomM] || "EB";
  mapping.EL = targetEdge[band.leftM] || "EL";

  function targetRohu(a, b, fallback) {
    if (!a || !b) return fallback;
    const klic = [a, b].sort().join("");
    return cornerTarget[klic] || fallback;
  }

  mapping.CTL = targetRohu(band.topL, band.leftT, "CTL");
  mapping.CTR = targetRohu(band.topR, band.rightT, "CTR");
  mapping.CBR = targetRohu(band.bottomR, band.rightB, "CBR");
  mapping.CBL = targetRohu(band.bottomL, band.leftB, "CBL");

  return mapping;
}

function zkratBodNaUsecce(od, kam, vzdalenost) {
  const dx = kam.x - od.x;
  const dy = kam.y - od.y;
  const delka = Math.hypot(dx, dy) || 1;
  return {
    x: od.x + (dx / delka) * vzdalenost,
    y: od.y + (dy / delka) * vzdalenost
  };
}

function hlavickaSipky(ctx, bod, smerX, smerY, barva) {
  const delka = Math.hypot(smerX, smerY) || 1;
  const ux = smerX / delka;
  const uy = smerY / delka;
  const velikost = 13;
  const sirka = 7;
  const bx = bod.x - ux * velikost;
  const by = bod.y - uy * velikost;
  const px = -uy;
  const py = ux;

  ctx.fillStyle = barva;
  ctx.beginPath();
  ctx.moveTo(bod.x, bod.y);
  ctx.lineTo(bx + px * sirka, by + py * sirka);
  ctx.lineTo(bx - px * sirka, by - py * sirka);
  ctx.closePath();
  ctx.fill();
}

/*
 * PLL sipky – V2
 * Puvodni verze kreslila kazdy presun jako rovnou silnou caru pres stred.
 * U R/G permu se tak vsechny sipky prekryvaly a obrazek byl necitelny.
 * Tady zachovavame stejne mapovani dilku, ale kreslime jednotlive cykly
 * oddelene a rohy vedeme mirne obloukem po obvodu.
 */
function kresliSipku(ctx, od, kam, options = {}) {
  const {
    oboustranna = false,
    zakriveni = 0,
    barva = "rgba(52, 56, 58, 0.88)",
    tloustka = 5
  } = options;

  const dx = kam.x - od.x;
  const dy = kam.y - od.y;
  const delka = Math.hypot(dx, dy);
  if (delka < 4) return;

  const start = zkratBodNaUsecce(od, kam, 15);
  const end = zkratBodNaUsecce(kam, od, 15);

  let control = null;
  if (Math.abs(zakriveni) > 0.1) {
    const ux = dx / delka;
    const uy = dy / delka;
    const nx = -uy;
    const ny = ux;
    const mx = (start.x + end.x) / 2;
    const my = (start.y + end.y) / 2;
    control = {
      x: mx + nx * zakriveni,
      y: my + ny * zakriveni
    };
  }

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Jemny svetly lem pomuze sipce zustat citelne pres zlute dilky.
  ctx.strokeStyle = "rgba(255, 255, 255, 0.34)";
  ctx.lineWidth = tloustka + 3;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  if (control) ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
  else ctx.lineTo(end.x, end.y);
  ctx.stroke();

  ctx.strokeStyle = barva;
  ctx.lineWidth = tloustka;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  if (control) ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
  else ctx.lineTo(end.x, end.y);
  ctx.stroke();

  const smerKonce = control
    ? { x: end.x - control.x, y: end.y - control.y }
    : { x: end.x - start.x, y: end.y - start.y };
  hlavickaSipky(ctx, end, smerKonce.x, smerKonce.y, barva);

  if (oboustranna) {
    const smerStartu = control
      ? { x: start.x - control.x, y: start.y - control.y }
      : { x: start.x - end.x, y: start.y - end.y };
    hlavickaSipky(ctx, start, smerStartu.x, smerStartu.y, barva);
  }

  ctx.restore();
}

function najdiCyklyPll(mapping, povolenePozice) {
  const povolene = new Set(povolenePozice);
  const navstivene = new Set();
  const cykly = [];

  povolenePozice.forEach(start => {
    if (navstivene.has(start)) return;
    if (!mapping[start] || mapping[start] === start) {
      navstivene.add(start);
      return;
    }

    const cyklus = [];
    let aktualni = start;
    const lokalni = new Set();

    while (
      aktualni &&
      povolene.has(aktualni) &&
      !lokalni.has(aktualni) &&
      mapping[aktualni]
    ) {
      lokalni.add(aktualni);
      navstivene.add(aktualni);
      cyklus.push(aktualni);
      aktualni = mapping[aktualni];
    }

    if (aktualni === start && cyklus.length > 1) {
      cykly.push(cyklus);
    }
  });

  return cykly;
}

function smerZakriveniVen(od, kam, stred, sila) {
  const dx = kam.x - od.x;
  const dy = kam.y - od.y;
  const delka = Math.hypot(dx, dy) || 1;
  let nx = -dy / delka;
  let ny = dx / delka;
  const mx = (od.x + kam.x) / 2;
  const my = (od.y + kam.y) / 2;
  const vx = mx - stred.x;
  const vy = my - stred.y;

  if (nx * vx + ny * vy < 0) {
    nx *= -1;
    ny *= -1;
  }

  // kresliSipku bere pouze skalarní zakriveni; znaménko zvolíme podle normaly
  const puvodniNx = -dy / delka;
  const puvodniNy = dx / delka;
  return (puvodniNx * nx + puvodniNy * ny >= 0 ? 1 : -1) * sila;
}

function vykresliPllCyklus(ctx, cyklus, body, typ) {
  const stred = { x: ctx.canvas.width / 2, y: ctx.canvas.height / 2 };
  const jeRoh = typ === "rohy";
  const barva = jeRoh
    ? "rgba(42, 46, 48, 0.90)"
    : "rgba(78, 82, 84, 0.92)";

  if (cyklus.length === 2) {
    const od = body[cyklus[0]];
    const kam = body[cyklus[1]];
    const zakriveni = jeRoh ? smerZakriveniVen(od, kam, stred, 28) : 0;
    kresliSipku(ctx, od, kam, {
      oboustranna: true,
      zakriveni,
      barva,
      tloustka: jeRoh ? 5 : 4.5
    });
    return;
  }

  for (let i = 0; i < cyklus.length; i++) {
    const od = body[cyklus[i]];
    const kam = body[cyklus[(i + 1) % cyklus.length]];
    if (!od || !kam) continue;

    const sila = jeRoh ? 24 : 12;
    const zakriveni = smerZakriveniVen(od, kam, stred, sila);
    kresliSipku(ctx, od, kam, {
      zakriveni,
      barva,
      tloustka: jeRoh ? 5 : 4.5
    });
  }
}

function dokresliPllSipky(ctx, imageData) {
  const mapping = zjistiPllPresuny(imageData);
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  const body = {
    CTL: { x: w * 0.31, y: h * 0.31 },
    CTR: { x: w * 0.69, y: h * 0.31 },
    CBR: { x: w * 0.69, y: h * 0.69 },
    CBL: { x: w * 0.31, y: h * 0.69 },
    ET: { x: w * 0.50, y: h * 0.31 },
    ER: { x: w * 0.69, y: h * 0.50 },
    EB: { x: w * 0.50, y: h * 0.69 },
    EL: { x: w * 0.31, y: h * 0.50 }
  };

  const rohoveCykly = najdiCyklyPll(mapping, ["CTL", "CTR", "CBR", "CBL"]);
  const hranoveCykly = najdiCyklyPll(mapping, ["ET", "ER", "EB", "EL"]);

  // Rohy jsou vedené po vnějším oblouku, hrany blíž středu.
  // Tím se u R/G permů jednotlivé cykly nekříží v jednom bodě.
  rohoveCykly.forEach(cyklus => vykresliPllCyklus(ctx, cyklus, body, "rohy"));
  hranoveCykly.forEach(cyklus => vykresliPllCyklus(ctx, cyklus, body, "hrany"));
}

function prebarviPixelyDiagramu(imageData, jeOll) {
  const data = imageData.data;

  // Barvy odpovídají stylu aplikace, podle které se uživatel PLL/OLL učil.
  const zluta = [255, 229, 0];
  const seda = [92, 92, 92];

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 16) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // cubing.js používá U = bílá. V našem CFOP traineru musí být U = žlutá.
    if (jeSkoroBila(r, g, b)) {
      data[i] = zluta[0];
      data[i + 1] = zluta[1];
      data[i + 2] = zluta[2];
      continue;
    }

    // OLL obrázek má zobrazovat jen orientaci: žlutá / šedá.
    // Skutečné boční barvy by rozpoznávání OLL zbytečně rušily.
    if (jeOll && jeBarevnySticker(r, g, b)) {
      data[i] = seda[0];
      data[i + 1] = seda[1];
      data[i + 2] = seda[2];
    }
  }

  return imageData;
}

function nactiObrazekZUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("SVG diagram se nepodařilo načíst do canvasu."));
    image.src = url;
  });
}

async function prevedSvgNaStylApky(svg, algName) {
  const serializer = new XMLSerializer();
  const clone = svg.cloneNode(true);

  // SVG musí být samostatně vykreslitelné i po převodu na Blob.
  if (!clone.getAttribute("xmlns")) {
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }

  const zdroj = serializer.serializeToString(clone);
  const blob = new Blob([zdroj], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const image = await nactiObrazekZUrl(url);

    // Vyšší interní rozlišení = ostré hrany i po zvětšení v mobilu.
    const velikost = 512;
    const canvas = document.createElement("canvas");
    canvas.width = velikost;
    canvas.height = velikost;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas 2D není dostupný.");

    ctx.clearRect(0, 0, velikost, velikost);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, 0, 0, velikost, velikost);

    const imageData = ctx.getImageData(0, 0, velikost, velikost);
    const puvodniData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    const jeOll = jeOllAlgoritmus(algName);
    prebarviPixelyDiagramu(imageData, jeOll);
    ctx.putImageData(imageData, 0, 0);

    if (jePllAlgoritmus(algName)) {
      dokresliPllSipky(ctx, puvodniData);
    }

    const vysledek = document.createElement("img");
    vysledek.className = "alg-auto-image";
    vysledek.alt = `Diagram ${algName}`;
    vysledek.draggable = false;
    vysledek.src = canvas.toDataURL("image/png");
    return vysledek;
  } finally {
    URL.revokeObjectURL(url);
  }
}


function zavriDiagramZoom() {
  const existujici = document.getElementById("alg-diagram-zoom-overlay");
  if (existujici) existujici.remove();
}

function otevriDiagramZoom(obrazek, algName) {
  if (!obrazek?.src) return;

  zavriDiagramZoom();

  const overlay = document.createElement("div");
  overlay.id = "alg-diagram-zoom-overlay";
  overlay.className = "alg-diagram-zoom-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", `Zvětšený diagram ${algName}`);

  const card = document.createElement("div");
  card.className = "alg-diagram-zoom-card";

  const title = document.createElement("div");
  title.className = "alg-diagram-zoom-title";
  title.textContent = algName;

  const img = document.createElement("img");
  img.src = obrazek.src;
  img.alt = `Zvětšený diagram ${algName}`;
  img.draggable = false;

  const hint = document.createElement("div");
  hint.className = "alg-diagram-zoom-hint";
  hint.textContent = "Klepnutím zavřít";

  card.append(title, img, hint);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  overlay.addEventListener("click", zavriDiagramZoom, { once: true });
}

function aktivujZoomDiagramu(wrapper, obrazek, algName) {
  wrapper.classList.add("alg-picture-zoomable");
  wrapper.setAttribute("role", "button");
  wrapper.setAttribute("tabindex", "0");
  wrapper.setAttribute("aria-label", `Zvětšit diagram ${algName}`);

  const otevri = event => {
    event.preventDefault();
    event.stopPropagation();
    otevriDiagramZoom(obrazek, algName);
  };

  wrapper.onclick = otevri;
  wrapper.onkeydown = event => {
    if (event.key === "Enter" || event.key === " ") otevri(event);
  };
}

async function namontujAutomatickyDiagram(selectedAlg, algName) {
  const wrapper = selectedAlg.querySelector(".alg-picture-auto");
  if (!wrapper) return;

  const automaticAlg = wrapper.dataset.autoAlg || getAutomaticDiagramAlgorithm(algName);
  if (!automaticAlg) return;

  // Při rychlém přepnutí algoritmu nesmí dokončený async render
  // vložit obrázek do už neaktuální karty.
  const renderToken = `${algName}:${automaticAlg}:${Date.now()}:${Math.random()}`;
  wrapper.dataset.diagramRenderToken = renderToken;
  wrapper.textContent = "";
  wrapper.classList.remove("alg-picture-auto-error");

  try {
    const { kpuzzle, llSvg } = await pripravDataAutomatickehoDiagramu();
    if (!wrapper.isConnected || wrapper.dataset.diagramRenderToken !== renderToken) return;

    // Vytvoříme stav, který právě vybraný algoritmus vyřeší.
    const solved = kpuzzle.defaultPattern();
    const casePattern = solved.applyAlg(new Alg(automaticAlg).invert());

    // cubing.js nám spolehlivě dodá geometrii LL diagramu.
    // Jeho barvy ale nepoužíváme jako finální vzhled: obrázek převedeme
    // do stylu referenční aplikace (PLL = žlutý vršek + barevné boky,
    // OLL = pouze žlutá + šedá).
    const animator = new ExperimentalSVGAnimator(kpuzzle, llSvg);
    animator.drawPattern(casePattern);

    const obrazek = await prevedSvgNaStylApky(animator.svgElement, algName);
    if (!wrapper.isConnected || wrapper.dataset.diagramRenderToken !== renderToken) return;

    wrapper.replaceChildren(obrazek);
    aktivujZoomDiagramu(wrapper, obrazek, algName);
  } catch (error) {
    if (!wrapper.isConnected || wrapper.dataset.diagramRenderToken !== renderToken) return;
    console.warn(`[DIAGRAM] ${algName}: diagram ve stylu PLL/OLL aplikace se nepodařilo vytvořit.`, error);
    wrapper.classList.add("alg-picture-auto-error");
    wrapper.textContent = "DIAGRAM";
  }
}

function ziskejCssTriduBarvy(nazevBarvy) {
  const map = {
    White: "is-white",
    Yellow: "is-yellow",
    Green: "is-green",
    Blue: "is-blue",
    Red: "is-red",
    Orange: "is-orange"
  };

  return map[nazevBarvy] || "";
}

function vykresliRadekOrientace(label, value) {
  return `
    <div>
      <span class="alg-orientation-label">${label}</span>
      <span class="alg-orientation-color-value ${ziskejCssTriduBarvy(value)}">${value}</span>
    </div>`;
}

function renderMove(move, index) {
  const safeMove = escapeHtml(move);

  if (index === wrongDisplayIndex) {
    return `<span class="wrong-move">${safeMove}</span>`;
  }

  if (index < displayIndex) {
    return `<span class="done-move">${safeMove}</span>`;
  }

  if (index === displayIndex) {
    return `<span class="next-move">${safeMove}</span>`;
  }

  return `<span class="alg-move">${safeMove}</span>`;
}

function renderMoveRows(displaySteps) {
  const rows = [];
  const isDesktop = window.matchMedia("(min-width: 900px)").matches;

  /*
   * Mobil zůstává po šesti tazích na řádek.
   * Desktop rozdělí celý algoritmus do dvou širokých řádků,
   * aby nebyla notace schovaná pod kartou.
   */
  const movesPerRow = isDesktop
    ? Math.max(1, Math.ceil(displaySteps.length / 2))
    : 6;

  for (let i = 0; i < displaySteps.length; i += movesPerRow) {
    const row = displaySteps
      .slice(i, i + movesPerRow)
      .map((move, offset) => renderMove(move, i + offset))
      .join("");

    rows.push(`<div class="alg-move-line">${row}</div>`);
  }

  return rows.join("");
}

function renderAlgorithmCard(algName, displaySteps, empty = false) {
  const safeName = escapeHtml(algName || "Nevybráno");
  
  const presetKey = localStorage.getItem("trainerColorPreset") || "yellow_green";
  
  const isWca = String(algName || "").toLowerCase().startsWith("wca");

  const orientationTop = isWca
    ? "White"
    : (presetKey === "white_green" ? "White" : "Yellow");
  
  const orientationFront = "Green";
  
  return `
    <div class="alg-card-head${empty ? " alg-card-empty" : ""}">
      ${empty ? `<span class="alg-empty-marker"></span>` : ""}
      <div class="alg-title${empty ? " alg-title-empty" : ""}">${safeName}</div>
      ${empty ? "" : `
        <div class="alg-orientation-hint">
          ${vykresliRadekOrientace("Top:", orientationTop)}
          ${vykresliRadekOrientace("Front:", orientationFront)}
        </div>
      `}
    </div>

    ${empty ? "" : (isWca
      ? `<div class="alg-picture alg-picture-wca-spacer" aria-hidden="true"></div>`
      : renderCubePlaceholder(algName))}

    <div class="alg-moves-row">
      ${empty ? "" : renderMoveRows(displaySteps)}
    </div>
  `;
}

export function renderTrainer(selectedAlg) {
  const algName = selectedAlg.dataset.algName || "Algoritmus";
  const displaySteps = buildDisplaySteps(displayMoves);

  selectedAlg.innerHTML = renderAlgorithmCard(algName, displaySteps, false);
  namontujAutomatickyDiagram(selectedAlg, algName);
}

/* =========================================================
   RUČNÍ POSUN TRAINERU
   ========================================================= */

export function nextTrainerMove(selectedAlg) {
  if (displayMoves.length === 0) return;

  const displaySteps = buildDisplaySteps(displayMoves);

  displayIndex++;

  if (displayIndex >= displaySteps.length) {
    displayIndex = displaySteps.length - 1;
  }

  renderTrainer(selectedAlg);
}


/* =========================================================
   AUTOMATICKÁ ORIENTACE PLL PODLE DRŽENÍ KOSTKY
   ========================================================= */

function zkusZamknoutOrientaciPll(rawMove, expectedMove) {
  if (!autoOrientacePll) return;
  if (!rawMove || !expectedMove) return;
  if (isTrainerMove(rawMove)) return;

  const expectedFace = String(expectedMove).charAt(0);

  // U/D ani slice tahy neumí jednoznačně určit natočení kolem svislé osy.
  // Necháme je projít podle dosavadní orientace a čekáme na první R/F/L/B.
  if (!"RFLB".includes(expectedFace)) return;

  const puvodniRotace = getTrainerRotation();
  const kandidati = [];

  for (let rotace = 0; rotace < 4; rotace++) {
    setTrainerRotation(rotace);
    const mapped = rotateMove(rawMove);

    if (mapped === expectedMove) {
      kandidati.push(rotace);
    }
  }

  if (kandidati.length === 0) {
    // Není to jen jiným držením kostky – vrať původní osu a nech checkMove
    // normálně označit chybný tah.
    setTrainerRotation(puvodniRotace);
    return;
  }

  // Pokud mezi kandidáty je dosavadní orientace, necháme ji. Jinak zvolíme
  // jedinou/nejbližší platnou osu. Od této chvíle je osa pro solve zamknutá.
  const vybranaRotace = kandidati.includes(puvodniRotace)
    ? puvodniRotace
    : kandidati[0];

  setTrainerRotation(vybranaRotace);
  autoOrientacePll = false;
}

/* =========================================================
   KONTROLA TAHU
   ========================================================= */

export function checkMove(move, selectedAlg) {
  if (checkMoves.length === 0) {
    return "none";
  }

  // Přeskočíme x/y/z, ale y zároveň nastaví virtuální osu.
  skipRotationMoves();

  const expected = checkMoves[checkIndex];

  if (!expected) {
    return "none";
  }

  const rawMoveProOrientaci = move;

  const expectedMove = applyVirtualYToExpectedMove(
  applyVirtualXToExpectedMove(
    applyVirtualZToExpectedMove(expected.move)
  )
);

  // Pokud už opravujeme chybu, očekávaný algoritmus se neposouvá.
  // Čekáme, dokud uživatel nevrátí chybné tahy přesně v opačném pořadí.
  if (correctionStack.length > 0) {
    if (isTrainerMove(move)) {
      move = stripTrainerMove(move);
    } else {
      move = rotateMove(move);
    }

    return processCorrectionMove(move, selectedAlg);
  }

  // DŮLEŽITÉ: nic nepřidáváme před Ra/Rb ani jiný PLL. Pokud uživatel
  // fyzicky otočil celou kostku tak, aby pattern vypadal jako na obrázku,
  // první boční tah pouze zamkne správnou osu Smart Cube.
  zkusZamknoutOrientaciPll(rawMoveProOrientaci, expectedMove);

  if (isTrainerMove(move)) {
    move = stripTrainerMove(move);
  } else {
    move = rotateMove(move);
  }

  if (move !== expectedMove) {
    wrongDisplayIndex = getGroupedDisplayIndex(expected.displayIndex);
    correctionStack.push(normalizeCorrectionMove(move));
    renderTrainer(selectedAlg);
    return "wrong";
  }

  wrongDisplayIndex = -1;
  checkIndex++;

  // Když je na konci algoritmu třeba x', přeskočíme ho a dokončíme algoritmus.
  skipRotationMoves();

  const nextExpected = checkMoves[checkIndex];

  if (nextExpected) {
    displayIndex = getGroupedDisplayIndex(nextExpected.displayIndex);
    renderTrainer(selectedAlg);
    return "correct";
  }

  displayIndex = buildDisplaySteps(displayMoves).length;
  renderTrainer(selectedAlg);
  return "finished";
}


/* =========================================================
   DALŠÍ OČEKÁVANÝ TAH PRO app.js
   POZOR: NESMÍ NIC POSOUVAT
   ========================================================= */

export function getExpectedMove() {
  if (checkMoves.length === 0) return null;

  let tempIndex = checkIndex;

  while (true) {
    const expected = checkMoves[tempIndex];

    if (!expected) return null;

    if (!isCubeRotationMove(expected.move)) {
      return expected.move;
    }

    tempIndex++;
  }
}


/* =========================================================
   RESET
   ========================================================= */

export function resetTrainer(selectedAlg) {
  displayIndex = 0;
  checkIndex = 0;
  wrongDisplayIndex = -1;
  correctionStack = [];
  virtualY = 0;
  virtualX = 0;
  virtualZ = 0;

  const algName = selectedAlg?.dataset?.algName || "";
  autoOrientacePll = Object.prototype.hasOwnProperty.call(pllAlgs, algName);

  renderTrainer(selectedAlg);
}