import * as puzzles from "https://cdn.cubing.net/v0/js/cubing/puzzles";
import { Alg } from "https://cdn.cubing.net/v0/js/cubing/alg";
import { ExperimentalSVGAnimator } from "https://cdn.cubing.net/v0/js/cubing/twisty";
import { rotateMove, isTrainerMove, stripTrainerMove } from "./orientation.js";
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

// Zatím řešíme bezpečně jen rotaci y.
// x / z zatím pouze přeskočíme.
let virtualY = 0;
let virtualX = 0;
let virtualZ = 0;



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
    virtualY = 0;
    virtualX = 0;
    virtualZ = 0;

    selectedAlg.innerHTML = renderAlgorithmCard("Nevybráno", [], true);
    return;
  }

  displayMoves = alg.split(/\s+/).filter(Boolean);
  checkMoves = expandAlgorithm(displayMoves);

  displayIndex = 0;
  checkIndex = 0;
  wrongDisplayIndex = -1;
  virtualY = 0;
  virtualX = 0;
  virtualZ = 0;

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
  const band = {
    topL: nactiBarvuZObrazku(imageData, 0.30, 0.07),
    topM: nactiBarvuZObrazku(imageData, 0.50, 0.07),
    topR: nactiBarvuZObrazku(imageData, 0.70, 0.07),
    rightT: nactiBarvuZObrazku(imageData, 0.88, 0.30),
    rightM: nactiBarvuZObrazku(imageData, 0.88, 0.50),
    rightB: nactiBarvuZObrazku(imageData, 0.88, 0.70),
    bottomL: nactiBarvuZObrazku(imageData, 0.30, 0.93),
    bottomM: nactiBarvuZObrazku(imageData, 0.50, 0.93),
    bottomR: nactiBarvuZObrazku(imageData, 0.70, 0.93),
    leftT: nactiBarvuZObrazku(imageData, 0.10, 0.30),
    leftM: nactiBarvuZObrazku(imageData, 0.10, 0.50),
    leftB: nactiBarvuZObrazku(imageData, 0.10, 0.70)
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

function kresliSipku(ctx, od, kam, oboustranna = false) {
  const dx = kam.x - od.x;
  const dy = kam.y - od.y;
  const delka = Math.hypot(dx, dy);
  if (delka < 4) return;

  const ux = dx / delka;
  const uy = dy / delka;
  const okraj = 18;
  const start = { x: od.x + ux * okraj, y: od.y + uy * okraj };
  const end = { x: kam.x - ux * okraj, y: kam.y - uy * okraj };

  ctx.save();
  ctx.strokeStyle = "rgba(72, 76, 78, 0.82)";
  ctx.fillStyle = "rgba(72, 76, 78, 0.82)";
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  function hlavicka(bod, smerX, smerY) {
    const velikost = 18;
    const sirka = 11;
    const bx = bod.x - smerX * velikost;
    const by = bod.y - smerY * velikost;
    const px = -smerY;
    const py = smerX;

    ctx.beginPath();
    ctx.moveTo(bod.x, bod.y);
    ctx.lineTo(bx + px * sirka, by + py * sirka);
    ctx.lineTo(bx - px * sirka, by - py * sirka);
    ctx.closePath();
    ctx.fill();
  }

  hlavicka(end, ux, uy);
  if (oboustranna) hlavicka(start, -ux, -uy);
  ctx.restore();
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

  const hotovo = new Set();

  Object.entries(mapping).forEach(([od, kam]) => {
    if (od === kam || !body[od] || !body[kam]) return;

    const opacny = mapping[kam] === od;
    const par = [od, kam].sort().join("|");
    if (opacny && hotovo.has(par)) return;

    kresliSipku(ctx, body[od], body[kam], opacny);
    if (opacny) hotovo.add(par);
  });
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

    ${empty ? "" : renderCubePlaceholder(algName)}

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

  if (isTrainerMove(move)) {
    move = stripTrainerMove(move);
  } else {
    move = rotateMove(move);
  }

  const expectedMove = applyVirtualYToExpectedMove(
  applyVirtualXToExpectedMove(
    applyVirtualZToExpectedMove(expected.move)
  )
);

  if (move !== expectedMove) {
    wrongDisplayIndex = getGroupedDisplayIndex(expected.displayIndex);
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
  virtualY = 0;
  virtualX = 0;
  virtualZ = 0;

  renderTrainer(selectedAlg);
}