import { rotateMove, isTrainerMove, stripTrainerMove } from "./orientation.js";

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
  console.log("SKIP ROTATION:", move, "virtualY:", virtualY, "virtualX:", virtualX, "virtualZ:", virtualZ);
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

function renderCubePlaceholder(algName) {
  const imageSrc = ALGORITHM_IMAGE_MAP[algName];

  if (imageSrc) {
    return `
      <div class="alg-picture alg-picture-image" data-alg="${escapeHtml(algName)}" aria-label="Náhled algoritmu ${escapeHtml(algName)}">
        <img src="${escapeHtml(imageSrc)}" alt="Náhled ${escapeHtml(algName)}">
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
  
  const orientationTop =
    presetKey === "white_green" ? "White" : "Yellow";
  
  const orientationFront = "Green";
  
  return `
    <div class="alg-card-head${empty ? " alg-card-empty" : ""}">
      ${empty ? `<span class="alg-empty-marker"></span>` : ""}
      <div class="alg-title${empty ? " alg-title-empty" : ""}">${safeName}</div>
      ${empty ? "" : `
        <div class="alg-orientation-hint">
          <div>Top: ${orientationTop}</div>
          <div>Front: ${orientationFront}</div>
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

  console.log("MOVE CHECK:", {
  real: move,
  expectedOriginal: expected.move,
  expectedAfterRotation: expectedMove,
  virtualY,
  virtualX,
  virtualZ
});

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