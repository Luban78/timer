// app.js
// Hlavní logika MG3i Traineru

import {
  makeStateSignature,
  recognizeStateMove,
  saveStateMoveMap,
  exportMoveMapsText,
  getMoveMapCount,
  applyStateMoveMap
} from "./moveMaps.js";

import {
  saveBaseFacelets,
  diffFacelets,
  getBaseFacelets
} from "./faceletMapper.js";

import {
  initCubeEngine,
  createSolvedPattern,
  applyAlgorithm,
  isPatternSolved,
  createPatternFromGanState,
  patternsIdentical
} from "./cubeEngine.js";

import {
  setCurrentFacelets,
  getCurrentFacelets,
  saveStartFacelets,
  isBackToStart,
  setCurrentCubeState,
  getCurrentCubeState,
  saveBaseCubeState,
  getBaseCubeState
} from "./cubeState.js";

import {
  renderAlgorithmPreview,
  checkMove,
  getExpectedMove,
  resetTrainer
} from "./moveTrainer.js";

import { startSolve } from "./timer.js";
import { updateCoach } from "./coach.js";
import { updateStats, calcAverage } from "./statistics.js";

import {
  updateXPUI,
  showLevelUp,
  addXP
} from "./xp.js";

import {
  updateAchievementList,
  unlockAchievement
} from "./achievements.js";

import {
  saveDailyProgress,
  resetDailyProgress,
  updateDailyTasks,
  checkDailyTasks
} from "./dailyTasks.js";

import { getAlgorithmStats } from "./algorithmStats.js";
import { drawDetailGraph } from "./detailGraph.js";
import { openPLLMenu } from "./algMenu.js";
import { resetStatsUI, clearCanvas, showRecord } from "./ui.js";
import { initAudio, beep, playErrorSound } from "./sound.js";
import { drawGraph, resizeGraphCanvas } from "./graph.js";
import { renderHistory } from "./history.js";
import { loadSolves, saveSolves, loadProfile, saveProfile } from "./storage.js";
import { connectCube } from "./cubeConnection.js?v=19";
import { pllAlgs } from "./algorithms.js";
/*
*/

const DEV_MODE = true;

const btn = document.getElementById("btn");
const modeButtons = document.getElementById("modeButtons");
const pllBtn = document.getElementById("pllBtn");
const ollBtn = document.getElementById("ollBtn");
const modal = document.getElementById("modal");
const algList = document.getElementById("algList");
const closeModal = document.getElementById("closeModal");
const status = document.getElementById("status");
const selectedAlg = document.getElementById("selectedAlg");
const mDebug = document.getElementById("m-debug");
const notation = document.getElementById("notation");
const stateMsg = document.getElementById("state-msg");
const tpsDiv = document.getElementById("tps");
const timeVal = document.getElementById("time-val");
const movesVal = document.getElementById("moves-val");
const avgVal = document.getElementById("avg-val");
const maxVal = document.getElementById("max-val");
const pauseVal = document.getElementById("pause-val");
const historyList = document.getElementById("history-list");
const canvas = document.getElementById("graph");
const ctx = canvas.getContext("2d");

const statBest = document.getElementById("stat-best");
const statAo5 = document.getElementById("stat-ao5");
const statAo12 = document.getElementById("stat-ao12");
const statCount = document.getElementById("stat-count");

const clearHistoryBtn = document.getElementById("clear-history-btn");
const solveDetail = document.getElementById("solve-detail");
const solveDetailContent = document.getElementById("solve-detail-content");
const closeDetailBtn = document.getElementById("close-detail-btn");

const exportHistoryBtn = document.getElementById("export-history-btn");
const exportModal = document.getElementById("export-modal");
const exportText = document.getElementById("export-text");
const closeExportBtn = document.getElementById("close-export-btn");
const copyExportBtn = document.getElementById("copy-export-btn");

const importHistoryBtn = document.getElementById("import-history-btn");
const importModal = document.getElementById("import-modal");
const importText = document.getElementById("import-text");
const runImportBtn = document.getElementById("run-import-btn");
const closeImportBtn = document.getElementById("close-import-btn");

const navTimer = document.getElementById("nav-timer");
const navStats = document.getElementById("nav-stats");
const navSettings = document.getElementById("nav-settings");

const appScreen = document.getElementById("app");
const mainLayout = document.getElementById("main-layout");
const historyPanel = document.getElementById("history");
const settingsScreen = document.getElementById("settings-screen");
const statsScreen = document.getElementById("stats-screen");

const settingsExportBtn = document.getElementById("settings-export-btn");
const settingsImportBtn = document.getElementById("settings-import-btn");
const settingsClearBtn = document.getElementById("settings-clear-btn");
const settingsResetProfileBtn = document.getElementById("settings-reset-profile-btn");

const statsBest = document.getElementById("stats-best");
const statsBestTPS = document.getElementById("stats-best-tps");
const statsSolves = document.getElementById("stats-solves");
const statsAvgTPS = document.getElementById("stats-avg-tps");
const statsTotalTime = document.getElementById("stats-total-time");
const statsWorst = document.getElementById("stats-worst");

const algorithmStatsDiv = document.getElementById("algorithm-stats");
const coachAlg = document.getElementById("coach-alg");
const coachDetail = document.getElementById("coach-detail");

const playerLevel = document.getElementById("player-level");
const xpFill = document.getElementById("xp-fill");
const xpText = document.getElementById("xp-text");

const levelModal = document.getElementById("level-modal");
const levelNumber = document.getElementById("level-number");

const achievementModal = document.getElementById("achievement-modal");
const achievementTitle = document.getElementById("achievement-title");
const achievementList = document.getElementById("achievement-list");

const recordModal = document.getElementById("record-modal");
const recordTime = document.getElementById("record-time");

const dailyList = document.getElementById("daily-list");

const normalCubeBtn = document.getElementById("normalCubeBtn");
const modeLabel = document.getElementById("mode-label");

const devCorrect = document.getElementById("dev-correct");
const devWrong = document.getElementById("dev-wrong");
const devSaveFacelets = document.getElementById("dev-save-facelets");
const devExportMap = document.getElementById("dev-export-map");
/*alert(
  "BASE id = " + devSaveFacelets.id +
  "\nMAP id = " + devExportMap.id +
  "\nStejný objekt = " + (devSaveFacelets === devExportMap)
);
devSaveFacelets.onclick = () => alert("KLIK BASE");
devExportMap.onclick = () => alert("KLIK MAP");

*/




const singleModeBtn = document.getElementById("singleModeBtn");
const randomModeBtn = document.getElementById("randomModeBtn");
let waitingForStateAfterMove = false;
let syncBaseFromNextFacelets = false;
let guidedDoublePending = null;
let stateDoublePending = null;
let m2PulsePending = null;
let guidedCooldownUntil = 0;
let stateMovePending = false;
let m2HalfPending = null;
let mRawSlicePulseCount = 0;
let lastMRawSlicePulseTime = 0;

// V M algoritmech umí kostka poslat několik RAW MOVE událostí pro jeden fyzický M tah.
// Proto tyto RAW události slučujeme do krátkých „pulzů“.
const GUIDED_COOLDOWN_MS = 80;
const GUIDED_DOUBLE_TIMEOUT_MS = 2200;

let activeScreen = "timer";
let cubeMode = localStorage.getItem("cubeMode") || "smart";
let trainingMode = "single";
let lastStateSignature = "";
let faceletCount = 0;
let trainerLocked = false;

let seq = [];
let moveTimes = [];
let tpsHistory = [];
let totalMoves = 0;
let maxTPS = 0;
let longestPause = 0;

let isSolving = false;
let isConnected = false;
let startTime = 0;
let lastMoveTime = 0;

let uiTimer = null;
let stopTimer = null;

let pendingMove = null;
let pendingMoveTime = 0;
let pendingTimer = null;

let lastBeep = 0;

let currentMoves = [];
let currentAlgorithmName = "Nevybráno";

let savedSolves = loadSolves();
let playerProfile = loadProfile();

const DOUBLE_MOVE_WINDOW = 280;
const TPS_WINDOW = 2000;
let moveBaseState = null;

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function isStateMove(move) {
  const m = normalizeMove(move);
  return m === "M" || m === "M'" || m === "M2";
}

function expectedMoveUsesState() {
  return isStateMove(getExpectedMove());
}

function getCurrentAlgorithmText() {
  if (currentAlgorithmName && pllAlgs[currentAlgorithmName]) {
    return pllAlgs[currentAlgorithmName];
  }

  const text = selectedAlg ? (selectedAlg.innerText || "") : "";
  const parts = text.split(":");
  return parts[1] ? parts[1].trim() : "";
}

function selectedAlgorithmUsesM() {
  return getCurrentAlgorithmText()
    .split(/\s+/)
    .map(normalizeMove)
    .some(isStateMove);
}

function processCubeStateMove(currentState) {
  if (trainerLocked) return false;
  if (!currentState) return false;
  if (!moveBaseState) return false;

  const expected = normalizeMove(getExpectedMove());
  if (!isStateMove(expected)) return false;

  const stateNow = JSON.stringify(currentState);
  if (stateNow === lastStateSignature) return false;

  const signature = makeStateSignature(moveBaseState, currentState);
  if (!signature) return false;

  const recognized = normalizeMove(recognizeStateMove(signature));

  if (!isStateMove(recognized)) {
    if (mDebug) {
      mDebug.innerText = "STATE: čekám " + expected + ", přišlo: " + (recognized || "neznámé");
    }
    stateMovePending = false;
    return true;
  }

  const now = performance.now();

  if (expected === "M2") {
    // Rychlé M2: pokud přišly dva oddělené L/R pulzy a state ukazuje M-family,
    // potvrdíme M2 najednou. U/D/F/B pulzy se sem vůbec nepočítají.
    if (mRawSlicePulseCount >= 2) {
      m2HalfPending = null;
      mRawSlicePulseCount = 0;
      lastMRawSlicePulseTime = 0;
      stateMovePending = false;
      moveBaseState = cloneState(currentState);
      lastStateSignature = stateNow;
      if (mDebug) mDebug.innerText = "STATE M2: potvrzeno 2 pulzy";
      commitMove("M2", now);
      return true;
    }

    // Pomalejší M2: první M/M'/M2 je jen půlka, nikdy nezazelená celý M2.
    if (!m2HalfPending) {
      m2HalfPending = { move: recognized, time: now };
      mRawSlicePulseCount = 0;
      lastMRawSlicePulseTime = 0;
      stateMovePending = false;
      moveBaseState = cloneState(currentState);
      lastStateSignature = stateNow;
      if (mDebug) mDebug.innerText = "STATE M2: 1/2 (" + recognized + ")";
      return true;
    }

    // Druhá půlka M2.
    m2HalfPending = null;
    mRawSlicePulseCount = 0;
    lastMRawSlicePulseTime = 0;
    stateMovePending = false;
    moveBaseState = cloneState(currentState);
    lastStateSignature = stateNow;
    if (mDebug) mDebug.innerText = "STATE M2: 2/2";
    commitMove("M2", now);
    return true;
  }

  // Jednoduché M/M'. Do traineru pustíme jen M-family potvrzené stavem kostky.
  m2HalfPending = null;
  mRawSlicePulseCount = 0;
  lastMRawSlicePulseTime = 0;
  stateMovePending = false;
  moveBaseState = cloneState(currentState);
  lastStateSignature = stateNow;

  if (recognized !== expected && recognized !== "M2") {
    commitMove(recognized, now);
  } else {
    commitMove(expected, now);
  }
  return true;
}

/*
document.addEventListener("pointerdown", e => {
  alert(
    "TARGET:\n" +
    "tag: " + e.target.tagName +
    "\nid: " + e.target.id +
    "\nclass: " + e.target.className
  );
}, true);
*/

initCubeEngine().then(() => {
  const solved = createSolvedPattern();
  const afterM = applyAlgorithm(solved, "M M'");
  console.log("CubeEngine M test:", isPatternSolved(afterM));
});

function updateModeLabel() {
  if (!modeLabel) return;

  modeLabel.innerText =
    cubeMode === "normal"
      ? "Režim: Normal Cube"
      : "Režim: Smart Cube";
}

function updateTrainingButtons() {
  singleModeBtn.classList.toggle("active", trainingMode === "single");
  randomModeBtn.classList.toggle("active", trainingMode === "random");
}

function setupTrainingButtons() {
  singleModeBtn.onclick = e => {
    e.stopPropagation();
    trainingMode = "single";
    updateTrainingButtons();
  };

  randomModeBtn.onclick = e => {
    e.stopPropagation();
    trainingMode = "random";
    updateTrainingButtons();
  };

  updateTrainingButtons();
}

function setupDevButtons() {
  const devControls = document.getElementById("dev-controls");

  if (!DEV_MODE) {
    if (devControls) devControls.style.display = "none";
    return;
  }

  devCorrect.addEventListener("pointerdown", e => {
    e.stopImmediatePropagation();
    e.preventDefault();

    const move = getExpectedMove();
    if (!move) return;

    commitMove(move, performance.now());
  });

  devWrong.addEventListener("pointerdown", e => {
    e.stopImmediatePropagation();
    e.preventDefault();

    commitMove("F", performance.now());
  });



  devSaveFacelets.addEventListener("click", e => {
  e.stopImmediatePropagation();
  e.preventDefault();
  
  const state = getCurrentCubeState();
  
  if (!state) {
    alert("Nejdřív připoj kostku a počkej na FACELETS.");
    return;
  }
  
  moveBaseState = cloneState(state);
  lastStateSignature = JSON.stringify(state);
  waitingForStateAfterMove = false;
  syncBaseFromNextFacelets = false;
  
  saveBaseCubeState();
  
  status.innerText = "BASE / moveBaseState reset";
});

  devExportMap.addEventListener("click", e => {
  e.stopImmediatePropagation();
  e.preventDefault();
  
  runMapTest();
});
}




function runMapTest() {
  alert("Načteno map: " + getMoveMapCount());
  const baseState = getBaseCubeState();
  const currentState = getCurrentCubeState();

  if (!baseState) {
    alert("Nejdřív klikni BASE.");
    return;
  }

  if (!currentState) {
    alert("Nemám aktuální cubeState.");
    return;
  }

  const signature = makeStateSignature(baseState, currentState);

  if (!signature) {
    alert("Signature je prázdná. Udělej po BASE jeden skutečný tah.");
    return;
  }

  const recognized = recognizeStateMove(signature);

  if (recognized) {
    alert("Rozpoznáno: " + recognized);
    return;
  }

  const move = prompt(
    "Tah neznám.\nSignature:\n" + signature + "\n\nJaký tah jsi udělal?",
    "R"
  );

  if (!move) return;

  saveStateMoveMap(move.toUpperCase(), signature);

  alert("Mapa uložena: " + move.toUpperCase());
}








function setupNavigation() {
  navTimer.onclick = () => {
    setActiveNav(navTimer);
    showScreen("timer");
  };

  navStats.onclick = () => {
    setActiveNav(navStats);
    showScreen("stats");
  };

  navSettings.onclick = () => {
    setActiveNav(navSettings);
    showScreen("settings");
  };

  setActiveNav(navTimer);
  showScreen("timer");
}

function setActiveNav(activeBtn) {
  [navTimer, navStats, navSettings].forEach(btn => {
    btn.classList.remove("active");
  });

  activeBtn.classList.add("active");
}

function showScreen(screen) {
  activeScreen = screen;

  if (mainLayout) {
    mainLayout.style.display = screen === "timer" ? "flex" : "none";
  }

  appScreen.style.display = screen === "timer" ? "flex" : "none";
  historyPanel.style.display = screen === "timer" ? "flex" : "none";
  settingsScreen.style.display = screen === "settings" ? "block" : "none";
  statsScreen.style.display = screen === "stats" ? "block" : "none";
}

function setupImportExport() {
  function showImportModal() {
    importText.value = "";
    importModal.style.display = "block";
  }

  function showExportModal() {
    exportText.value = JSON.stringify(savedSolves, null, 2);
    exportModal.style.display = "block";
    exportText.select();
  }

  exportHistoryBtn.onclick = showExportModal;
  settingsExportBtn.onclick = showExportModal;

  importHistoryBtn.onclick = showImportModal;
  settingsImportBtn.onclick = showImportModal;

  closeImportBtn.onclick = () => {
    importModal.style.display = "none";
  };

  importModal.onclick = e => {
    if (e.target === importModal) {
      importModal.style.display = "none";
    }
  };

  runImportBtn.onclick = () => {
    try {
      const imported = JSON.parse(importText.value);

      if (!Array.isArray(imported)) {
        alert("Neplatný formát.");
        return;
      }

      savedSolves = imported;
      saveSolves(savedSolves);

      refreshAll();
      importModal.style.display = "none";

      alert("Import dokončen.");

    } catch (e) {
      alert("Import se nepodařil.");
    }
  };

  closeExportBtn.onclick = () => {
    exportModal.style.display = "none";
  };

  copyExportBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(exportText.value);

      const oldText = copyExportBtn.innerText;
      copyExportBtn.innerText = "✅ Zkopírováno";

      setTimeout(() => {
        copyExportBtn.innerText = oldText;
      }, 1500);

    } catch (e) {
      alert("Kopírování se nepodařilo.");
    }
  };

  exportModal.onclick = e => {
    if (e.target === exportModal) {
      exportModal.style.display = "none";
    }
  };
}

function setupCubeButtons() {
  normalCubeBtn.onclick = () => {
    cubeMode = "normal";
    localStorage.setItem("cubeMode", cubeMode);

    isConnected = true;

    btn.style.display = "none";
    normalCubeBtn.style.display = "none";
    modeButtons.style.display = "grid";

    updateModeLabel();

    status.innerText = "Normal Cube režim";
    stateMsg.innerText = "Vyber algoritmus a klepni pro start";
    stateMsg.style.color = "yellow";
  };

  btn.onclick = async e => {
    e.stopPropagation();

    try {
      initAudio();
      status.innerText = "Připojuji...";

      await connectCube({
        onMove: move => {
          const expected = normalizeMove(getExpectedMove());

          if (selectedAlgorithmUsesM() && isStateMove(expected)) {
            // M/M'/M2 nikdy netrénujeme podle RAW názvu. RAW jen řekne,
            // že se kostka pohnula; skutečný M tah potvrdí až STATE/FACELETS.
            clearPendingMove();
            registerMSliceRawPulse(move);
            stateMovePending = true;
            return;
          }

          if (selectedAlgorithmUsesM()) {
            // Po M tazích může GAN poslat fyzické U jako D'. Tady se RAW jen
            // přemapuje do stejné orientace jako zvolený algoritmus a jede
            // dál rychlou cestou jako R/U/F/... u normálních PLL.
            stateMovePending = false;
            m2HalfPending = null;
            mRawSlicePulseCount = 0;
            lastMRawSlicePulseTime = 0;
            const mapped = mapRawMoveInMAlgorithm(move, expected);
            handleRawMove(mapped);
            return;
          }

          // Běžné PLL bez M jedou rychlou RAW cestou.
          m2HalfPending = null;
          mRawSlicePulseCount = 0;
          lastMRawSlicePulseTime = 0;
          handleRawMove(move);
          syncBaseFromNextFacelets = false;
        },

        onFacelets: event => {
          faceletCount++;

          setCurrentFacelets(event.facelets);
          setCurrentCubeState(event.state);

          if (!moveBaseState && event.state) {
            moveBaseState = cloneState(event.state);
            lastStateSignature = JSON.stringify(event.state);
          }

          if (stateMovePending && event.state && expectedMoveUsesState()) {
            processCubeStateMove(event.state);
          } else if (syncBaseFromNextFacelets && event.state) {
            moveBaseState = cloneState(event.state);
            lastStateSignature = JSON.stringify(event.state);
            syncBaseFromNextFacelets = false;
          }

          const stateText = isBackToStart() ? " ✅ START" : " 🔄 ZMĚNA";

          status.innerText =
            "FACELETS " + faceletCount + stateText + ":\n" + event.facelets;
        }
      });
      

      isConnected = true;
      cubeMode = "smart";
      localStorage.setItem("cubeMode", cubeMode);

      updateModeLabel();

      btn.style.display = "none";
      normalCubeBtn.style.display = "none";
      modeButtons.style.display = "grid";

      status.innerText = "Připojeno, začni otočením kostky";
      stateMsg.innerText = "PŘIPRAVEN";

      beep(523, .08);

    } catch (e) {
      status.innerText = "Chyba: " + e.message;
    }
  };
}

function setupAlgorithmButtons() {
  ollBtn.onclick = e => {
    e.stopPropagation();
    alert("OLL menu doplníme v další verzi. Teď je hotové PLL.");
  };

  pllBtn.onclick = e => {
    e.stopPropagation();

    openPLLMenu({
      algList,
      modal,
      selectedAlg,
      pllAlgs,
      onSelect: name => {
        currentAlgorithmName = name;
        prepareNext();
        renderAlgorithmPreview(selectedAlg);
      }
    });
  };

  closeModal.onclick = e => {
    e.stopPropagation();
    modal.style.display = "none";
  };

  modal.onclick = e => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  };
}

function setupGlobalControls() {
  document.addEventListener("pointerdown", e => {
    if (activeScreen !== "timer") return;

    if (e.target.closest("button")) return;
    if (e.target.closest("#dev-controls")) return;
    if (e.target.closest("#history")) return;
    if (e.target.closest("#history-list")) return;
    if (e.target.closest(".hist-row")) return;
    if (e.target.closest("#bottom-nav")) return;
    if (e.target.closest("#modal")) return;
    if (e.target.closest("#solve-detail")) return;
    if (e.target.closest("#export-modal")) return;
    if (e.target.closest("#import-modal")) return;
    if (e.target.closest("#level-modal")) return;
    if (e.target.closest("#achievement-modal")) return;
    if (e.target.closest("#record-modal")) return;

    if (cubeMode === "normal") {
      if (!isSolving) {
        runStartSolve(performance.now());
      } else {
        manualStop();
      }
      return;
    }

    // Smart Cube se nezastavuje dotykem obrazovky, aby screenshot/tap nerozbil solve.
  });

  document.addEventListener("keydown", e => {
    if (activeScreen !== "timer") return;

    if (cubeMode === "normal") {
      if (!isSolving) {
        runStartSolve(performance.now());
      } else {
        manualStop();
      }
      return;
    }

    // Smart Cube se nezastavuje dotykem obrazovky, aby screenshot/tap nerozbil solve.
  });
}

function setupProfileButtons() {
  settingsClearBtn.onclick = clearHistory;
  clearHistoryBtn.onclick = clearHistory;
  settingsResetProfileBtn.onclick = resetProfile;
}

function updateAlgorithmStats() {
  const algStats = getAlgorithmStats(savedSolves);

  if (algStats.length === 0) {
    algorithmStatsDiv.innerHTML = "<p>Zatím žádná data algoritmů.</p>";
    return;
  }

  algorithmStatsDiv.innerHTML = algStats.map(a => `
    <div class="stat-card">
      <h3>${a.name}</h3>
      <div>${a.count}×</div>
      <p>Best: ${a.best.toFixed(2)} s</p>
      <p>Avg: ${a.avg.toFixed(2)} s</p>
    </div>
  `).join("");
}

function updateStatistics() {
  if (savedSolves.length === 0) {
    statsBest.textContent = "-";
    statsBestTPS.textContent = "-";
    statsSolves.textContent = "0";
    statsAvgTPS.textContent = "-";
    statsTotalTime.textContent = "-";
    statsWorst.textContent = "-";
    return;
  }

  const best = Math.min(...savedSolves.map(s => Number(s.time) || 0));
  const bestTPS = Math.max(...savedSolves.map(s => Number(s.tps ?? s.avg ?? 0)));

  const avgTPS =
    savedSolves.reduce((sum, s) => sum + Number(s.tps ?? s.avg ?? 0), 0) /
    savedSolves.length;

  const totalTime =
    savedSolves.reduce((sum, s) => sum + Number(s.time || 0), 0);

  const worst =
    Math.max(...savedSolves.map(s => Number(s.time) || 0));

  statsBest.textContent = best.toFixed(2) + " s";
  statsBestTPS.textContent = bestTPS.toFixed(1);
  statsSolves.textContent = savedSolves.length;
  statsAvgTPS.textContent = avgTPS.toFixed(1);
  statsTotalTime.textContent = totalTime.toFixed(1) + " s";
  statsWorst.textContent = worst.toFixed(2) + " s";
}

function refreshAll() {
  renderHistory(historyList, savedSolves, showSolveDetail);

  updateStats(
    savedSolves,
    statCount,
    statBest,
    statAo5,
    statAo12,
    calcAverage
  );

  updateStatistics();
  updateAlgorithmStats();

  updateCoach(
    savedSolves,
    getAlgorithmStats,
    coachAlg,
    coachDetail
  );

  updateAchievementList(achievementList, playerProfile);
}

function resetProfile() {
  const ok = confirm("Opravdu vymazat XP, level a achievementy?");
  if (!ok) return;

  playerProfile = {
    xp: 0,
    level: 1,
    streak: 0,
    totalXP: 0,
    achievements: []
  };

  saveProfile(playerProfile);
  resetDailyProgress();

  updateXPUI(playerProfile, playerLevel, xpText, xpFill);
  updateAchievementList(achievementList, playerProfile);
  updateDailyTasks(dailyList);

  alert("Profil resetován.");
}

function showAchievement(title) {
  achievementTitle.textContent = title;
  achievementModal.style.display = "block";

  setTimeout(() => {
    achievementModal.style.display = "none";
  }, 2200);
}

function pickRandomPLL() {
  const names = Object.keys(pllAlgs);
  const randomName = names[Math.floor(Math.random() * names.length)];

  currentAlgorithmName = randomName;
  selectedAlg.innerText = "Algoritmus: " + pllAlgs[randomName];

  prepareNext();
  renderAlgorithmPreview(selectedAlg);
}

function prepareNextTrainerRun() {
  if (trainingMode === "random") {
    pickRandomPLL();
    return;
  }

  resetTrainer(selectedAlg);
  prepareNext();
}

function prepareNext() {
  clearPendingMove();
  clearGuidedDoublePending();
  clearStateDoublePending();
  clearM2PulsePending();

  seq = [];
  moveTimes = [];
  tpsHistory = [];
  totalMoves = 0;
  maxTPS = 0;
  longestPause = 0;
  pendingMove = null;
  waitingForStateAfterMove = false;
  syncBaseFromNextFacelets = false;
  guidedCooldownUntil = 0;
  stateMovePending = false;
  m2HalfPending = null;
  mRawSlicePulseCount = 0;
  lastMRawSlicePulseTime = 0;

  resetStatsUI({
    notation,
    stateMsg,
    tpsDiv,
    timeVal,
    movesVal,
    avgVal,
    maxVal,
    pauseVal,
    isConnected
  });

  clearCanvas(ctx, canvas);
}

function normalizeMove(move) {
  if (move == null) return "";

  return String(move)
    .trim()
    .replace(/\s+/g, "")
    .replace("’", "'");
}

function clearPendingMove() {
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }

  pendingMove = null;
  pendingMoveTime = 0;
}

function clearGuidedDoublePending() {
  if (guidedDoublePending && guidedDoublePending.timer) {
    clearTimeout(guidedDoublePending.timer);
  }

  guidedDoublePending = null;
}

function clearStateDoublePending() {
  stateDoublePending = null;
}

function clearM2PulsePending() {
  if (m2PulsePending && m2PulsePending.timer) {
    clearTimeout(m2PulsePending.timer);
  }

  m2PulsePending = null;
  mRawSlicePulseCount = 0;
  lastMRawSlicePulseTime = 0;
}

function rawLooksLikeMSlice(move) {
  const f = baseFace(normalizeMove(move));
  // GAN/MonsterGo pro fyzický M typicky hlásí vnější osu L/R.
  // U/D/F/B sem nepatří, aby U nikdy nedokončilo čekající M2.
  return f === "L" || f === "R";
}

function registerMSliceRawPulse(move) {
  const now = performance.now();

  if (!rawLooksLikeMSlice(move)) {
    if (mDebug) {
      mDebug.innerText = "M režim: čekám M, ignoruji RAW " + normalizeMove(move);
    }
    return;
  }

  // Krátké duplicitní hlášky z jednoho fyzického flicku nepočítáme jako druhé M.
  if (now - lastMRawSlicePulseTime > 70) {
    mRawSlicePulseCount++;
    lastMRawSlicePulseTime = now;
  }

  if (mDebug) {
    mDebug.innerText = "M RAW pulz " + mRawSlicePulseCount + ": " + normalizeMove(move);
  }
}

function oppositeUDMove(move) {
  move = normalizeMove(move);
  if (move === "D'") return "U";
  if (move === "D") return "U'";
  if (move === "D2") return "U2";
  if (move === "U'") return "D";
  if (move === "U") return "D'";
  if (move === "U2") return "D2";
  return move;
}

function mapRawMoveInMAlgorithm(rawMove, expected) {
  rawMove = normalizeMove(rawMove);
  expected = normalizeMove(expected);
  if (!rawMove || !expected) return rawMove;

  // H/Z perm používají po M tazích U vrstvu. Některé GAN/MG kostky ji po M
  // hlásí jako opačnou D vrstvu. Opravujeme jen tehdy, když algoritmus čeká U.
  if (baseFace(expected) === "U" && baseFace(rawMove) === "D") {
    return oppositeUDMove(rawMove);
  }

  return rawMove;
}

function advanceMoveBaseState(move) {
  if (!moveBaseState) return;
  const nextState = applyStateMoveMap(moveBaseState, move);
  if (!nextState) {
    if (mDebug && selectedAlgorithmUsesM()) {
      mDebug.innerText = "Nemám STATE mapu pro " + move + " – klikni MAP a nauč tah.";
    }
    return;
  }

  moveBaseState = cloneState(nextState);
  lastStateSignature = JSON.stringify(moveBaseState);
}

function handleExpectedM2Pulse() {
  const expected = normalizeMove(getExpectedMove());
  if (expected !== "M2") return false;

  const now = performance.now();

  if (
    m2PulsePending &&
    now - m2PulsePending.time < 1800
  ) {
    clearM2PulsePending();
    clearStateDoublePending();

    if (mDebug) {
      mDebug.innerText = "M2: 2/2 → potvrzeno";
    }

    commitMove("M2", now);
    syncBaseFromNextFacelets = true;
    return true;
  }

  clearM2PulsePending();

  m2PulsePending = {
    time: now,
    timer: setTimeout(() => {
      if (m2PulsePending) {
        m2PulsePending = null;
        if (mDebug && normalizeMove(getExpectedMove()) === "M2") {
          mDebug.innerText = "M2: čekám na druhý M";
        }
      }
    }, 1800)
  };

  if (mDebug) {
    mDebug.innerText = "M2: 1/2";
  }

  return false;
}

function handleGuidedAlgorithmMove(rawMove) {
  if (activeScreen !== "timer") return false;
  if (cubeMode === "normal") return false;
  if (trainerLocked) return false;

  const expected = normalizeMove(getExpectedMove());
  if (!expected) return false;
  const raw = normalizeMove(rawMove);

  const now = performance.now();

  if (!isSolving && seq.length > 0) {
    prepareNext();
  }

  // Jeden fyzický M tah často vytvoří více RAW událostí.
  // Tady je všechny dočasně ignorujeme, aby první M nikdy nepotvrdilo celé M2.
  if (now < guidedCooldownUntil) {
    if (mDebug) {
      mDebug.innerText = "M režim: ignoruji duplicitní pulz pro " + expected;
    }
    return false;
  }

  // Dvojité tahy v M algoritmech potvrzujeme až po dvou oddělených pulzech.
  // Platí pro M2 i U2 v H/Z permu.
  if (expected.includes("2")) {
    return handleGuidedDoubleExpected(expected, now, raw);
  }

  clearGuidedDoublePending();
  clearStateDoublePending();
  clearM2PulsePending();

  commitMove(expected, now);
  guidedCooldownUntil = now + GUIDED_COOLDOWN_MS;
  syncBaseFromNextFacelets = true;
  return true;
}

function handleGuidedDoubleExpected(expected, now, rawMove) {
  if (rawMove && rawMove.includes("2")) {
    clearGuidedDoublePending();
    clearStateDoublePending();
    clearM2PulsePending();
    commitMove(expected, now);
    guidedCooldownUntil = now + GUIDED_COOLDOWN_MS;
    syncBaseFromNextFacelets = true;
    return true;
  }

  if (
    guidedDoublePending &&
    guidedDoublePending.expected === expected &&
    now - guidedDoublePending.time >= GUIDED_COOLDOWN_MS &&
    now - guidedDoublePending.time <= GUIDED_DOUBLE_TIMEOUT_MS
  ) {
    clearGuidedDoublePending();
    clearStateDoublePending();
    clearM2PulsePending();

    commitMove(expected, now);
    guidedCooldownUntil = now + GUIDED_COOLDOWN_MS;
    syncBaseFromNextFacelets = true;
    return true;
  }

  clearGuidedDoublePending();
  clearStateDoublePending();
  clearM2PulsePending();

  guidedDoublePending = {
    expected,
    time: now,
    timer: setTimeout(() => {
      if (guidedDoublePending && guidedDoublePending.expected === expected) {
        guidedDoublePending = null;
        if (mDebug) {
          mDebug.innerText = "M režim: čekám druhou polovinu " + expected;
        }
      }
    }, GUIDED_DOUBLE_TIMEOUT_MS)
  };

  guidedCooldownUntil = now + GUIDED_COOLDOWN_MS;

  if (mDebug) {
    mDebug.innerText = "M režim: " + expected + " 1/2";
  }

  return false;
}

function baseFace(move) {
  return String(move).replace("2", "").replace("'", "");
}

function direction(move) {
  return String(move).includes("'") ? -1 : 1;
}

function makeDoubleMove(move) {
  return baseFace(move) + "2";
}

function handleRawMove(move) {
  if (activeScreen !== "timer") return;
  if (cubeMode === "normal") return;
  if (trainerLocked) return;

  move = normalizeMove(move);
  if (!move) return;

  const now = performance.now();

  if (!isSolving && seq.length > 0) {
    prepareNext();
  }

  if (
    pendingMove &&
    baseFace(pendingMove) === baseFace(move) &&
    direction(pendingMove) === direction(move) &&
    now - pendingMoveTime < DOUBLE_MOVE_WINDOW
  ) {
    clearTimeout(pendingTimer);

    const merged = makeDoubleMove(move);

    pendingMove = null;
    commitMove(merged, now);
    return;
  }

  if (pendingMove) {
    clearTimeout(pendingTimer);
    commitMove(pendingMove, pendingMoveTime);
  }

  pendingMove = move;
  pendingMoveTime = now;

  pendingTimer = setTimeout(() => {
    if (pendingMove) {
      commitMove(pendingMove, pendingMoveTime);
      pendingMove = null;
    }
  }, DOUBLE_MOVE_WINDOW);
}



function runStartSolve(now) {
  startSolve(now, {
    currentMoves,
    isSolving,
    startTime,
    lastMoveTime,
    totalMoves,
    maxTPS,
    longestPause,
    moveTimes,
    tpsHistory,
    seq,
    stateMsg,
    timeVal,
    movesVal,
    avgVal,
    maxVal,
    pauseVal,
    notation,
    uiTimer,
    updateUI
  });

  isSolving = true;
  startTime = now;
  lastMoveTime = now;
  totalMoves = 0;
  maxTPS = 0;
  longestPause = 0;
  currentMoves = [];
  moveTimes = [];
  tpsHistory = [];
  seq = [];

  clearInterval(uiTimer);
  uiTimer = setInterval(updateUI, 100);
}


function commitMove(move, now) {
  if (trainerLocked) return;

  move = normalizeMove(move);
  if (!move) return;

  if (!isSolving) {
    saveStartFacelets();
    runStartSolve(now);
  } else {
    const pause = (now - lastMoveTime) / 1000;

    if (totalMoves > 0 && pause > longestPause) {
      longestPause = pause;
      pauseVal.innerText = pause.toFixed(2) + "s";
    }
  }

  lastMoveTime = now;
  totalMoves++;
  movesVal.innerText = totalMoves;

  seq.push(move);

  currentMoves.push({
    move,
    time: Number(((now - startTime) / 1000).toFixed(3))
  });

  if (seq.length > 24) seq.shift();

  notation.innerText = "Notace:\n" + seq.join(" ");

  const trainerResult = checkMove(move, selectedAlg);

  if (mDebug) {
    mDebug.innerText =
      "MOVE: " + move +
      " | EXPECTED: " + (getExpectedMove() || "-") +
      " | RESULT: " + trainerResult;
  }

  if (trainerResult !== "wrong" && selectedAlgorithmUsesM() && !isStateMove(move)) {
    advanceMoveBaseState(move);
  }

  if (trainerResult === "wrong") {
    trainerLocked = true;
    clearPendingMove();
    clearGuidedDoublePending();
    clearStateDoublePending();
    clearM2PulsePending();
    stateMovePending = false;
    m2HalfPending = null;
    mRawSlicePulseCount = 0;
    lastMRawSlicePulseTime = 0;

    playErrorSound();
    failSolve();

    setTimeout(() => {
      prepareNextTrainerRun();
      trainerLocked = false;
    }, 1800);

    return;
  }

  if (trainerResult === "finished") {
    trainerLocked = true;
    clearPendingMove();
    clearGuidedDoublePending();
    clearStateDoublePending();
    clearM2PulsePending();
    stateMovePending = false;
    m2HalfPending = null;
    mRawSlicePulseCount = 0;
    lastMRawSlicePulseTime = 0;

    finishSolve(performance.now(), false);

    setTimeout(() => {
      prepareNextTrainerRun();
      trainerLocked = false;
    }, 1200);

    return;
  }

  moveTimes.push(now);

  // Smart PLL trainer se dokončuje přes checkMove() == "finished".
  // Ne auto-timeoutem, jinak se uprostřed algoritmu ukládal falešný solve.
}

function updateUI() {
  const now = performance.now();

  moveTimes = moveTimes.filter(t => now - t < TPS_WINDOW);

  const currentTPS = moveTimes.length / (TPS_WINDOW / 1000);
  tpsDiv.innerText = currentTPS.toFixed(1);

  if (!isSolving) return;

  const elapsed = (now - startTime) / 1000;
  timeVal.innerText = elapsed.toFixed(2) + "s";

  if (elapsed > 0) {
    const avg = totalMoves / elapsed;
    avgVal.innerText = avg.toFixed(1);

    if (totalMoves > 8 && currentTPS < avg * .65 && now - lastBeep > 1200) {
      beep(220, .12);
      lastBeep = now;
    }
  }

  if (currentTPS > maxTPS) {
    maxTPS = currentTPS;
    maxVal.innerText = maxTPS.toFixed(1);
  }

  tpsHistory.push(currentTPS);

  if (tpsHistory.length > 100) {
    tpsHistory.shift();
  }

  drawGraph(ctx, canvas, tpsHistory);
}

function manualStop() {
  const stopTime = performance.now();

  if (pendingMove) {
    clearTimeout(pendingTimer);
    commitMove(pendingMove, pendingMoveTime);
    pendingMove = null;
  }

  if (guidedDoublePending) {
    clearGuidedDoublePending();
  }

  clearStateDoublePending();
  finishSolve(stopTime, true);
}

function getNormalMoveCount() {
  const algText = selectedAlg.innerText || "";
  const parts = algText.split(":");
  const alg = parts[1] ? parts[1].trim() : "";

  if (!alg) return 0;

  return alg
    .split(/\s+/)
    .filter(m => m.length > 0)
    .length;
}

function giveXP(amount) {
  addXP(
    amount,
    playerProfile,
    saveProfile,
    updateXPUI,
    playerLevel,
    xpText,
    xpFill,
    showLevelUp,
    levelModal,
    levelNumber
  );
}

function finishSolve(stopTime, manual) {
  if (!isSolving) return;

  const finalTime = (stopTime - startTime) / 1000;

  if (finalTime < 0.5) {
    isSolving = false;
    clearInterval(uiTimer);
    clearTimeout(stopTimer);
    prepareNext();
    return;
  }

  isSolving = false;

  clearInterval(uiTimer);
  clearTimeout(stopTimer);

  let finalMoves = totalMoves;

  if (cubeMode === "normal") {
    finalMoves = getNormalMoveCount();
    totalMoves = finalMoves;
    movesVal.innerText = finalMoves;
  }

  const finalAvg = finalTime > 0 ? finalMoves / finalTime : 0;

  timeVal.innerText = finalTime.toFixed(2) + "s";
  avgVal.innerText = finalAvg.toFixed(1);

  moveTimes = [];
  tpsDiv.innerText = "0.0";

  stateMsg.innerText = manual ? "ZASTAVENO" : "HOTOVO";
  stateMsg.style.color = "yellow";

  const oldBest = savedSolves.length
    ? Math.min(...savedSolves.map(s => Number(s.time) || 999))
    : Infinity;

  const isPB = finalTime < oldBest;

  saveSolve(finalTime, finalMoves, finalAvg);
  giveXP(10);

  checkDailyTasks(
    savedSolves,
    finalAvg,
    isPB,
    dailyList,
    giveXP
  );

  if (isPB) {
    showRecord(finalTime, recordTime, recordModal);

    unlockAchievement(
      "new_pb",
      "Nový osobní rekord",
      100,
      playerProfile,
      saveProfile,
      giveXP,
      showAchievement,
      updateAchievementList,
      achievementList
    );
  }

  if (savedSolves.length === 1) {
    unlockAchievement(
      "first_solve",
      "První solve",
      50,
      playerProfile,
      saveProfile,
      giveXP,
      showAchievement,
      updateAchievementList,
      achievementList
    );
  }

  beep(880, .2);
}

function failSolve() {
  clearPendingMove();
  if (!isSolving) return;

  isSolving = false;

  clearInterval(uiTimer);
  clearTimeout(stopTimer);

  moveTimes = [];

  stateMsg.innerText = "INCORRECT";
  stateMsg.style.color = "red";
}

function saveSolve(time, moves, avg) {
  const solve = {
    id: Date.now(),
    algorithm: currentAlgorithmName,
    time: Number(time.toFixed(2)),
    htm: moves,
    tps: Number(avg.toFixed(1)),
    peakTPS: Number(maxTPS.toFixed(1)),
    longestPause: Number(longestPause.toFixed(2)),
    notation: Array.isArray(currentMoves)
      ? currentMoves.map(m => m.move)
      : [],
    moves: Array.isArray(currentMoves)
      ? [...currentMoves]
      : [],
    date: new Date().toLocaleString("cs-CZ")
  };

  savedSolves.unshift(solve);
  savedSolves = savedSolves.slice(0, 200);

  saveSolves(savedSolves);
  refreshAll();
}

function clearHistory() {
  const ok = confirm("Opravdu vymazat všechny uložené časy?");
  if (!ok) return;

  savedSolves = [];
  saveSolves(savedSolves);

  refreshAll();
}

function showSolveDetail(solve) {
  solveDetailContent.innerHTML = `
    <div><b>Algoritmus:</b> ${solve.algorithm || "Nevybráno"}</div>
    <div><b>Čas:</b> ${Number(solve.time).toFixed(2)}s</div>
    <div><b>Tahy:</b> ${solve.htm ?? solve.moves ?? 0}</div>
    <div><b>TPS:</b> ${Number(solve.tps ?? solve.avg ?? 0).toFixed(1)}</div>
    <div><b>Peak TPS:</b> ${Number(solve.peakTPS ?? 0).toFixed(1)}</div>
    <div><b>Nejdelší pauza:</b> ${Number(solve.longestPause ?? 0).toFixed(2)}s</div>
    <div><b>Datum:</b> ${solve.date || "-"}</div>
    <div class="detail-notation">
      <b>Notace:</b><br>
      ${(solve.notation || []).join(" ")}
    </div>
  `;

  solveDetail.style.display = "block";

  setTimeout(() => {
    drawDetailGraph(
      document.getElementById("detail-graph"),
      solve
    );
  }, 0);
}

closeDetailBtn.onclick = () => {
  solveDetail.style.display = "none";
};

solveDetail.onclick = e => {
  if (e.target === solveDetail) {
    solveDetail.style.display = "none";
  }
};

window.onresize = () => resizeGraphCanvas(canvas);
resizeGraphCanvas(canvas);

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  const isLocal =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";

  if (isLocal) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(reg => reg.unregister());
    });
    return;
  }

  navigator.serviceWorker.register("./sw.js");
}

function initApp() {
  updateModeLabel();

  setupTrainingButtons();
  setupDevButtons();
  setupNavigation();
  setupImportExport();
  setupCubeButtons();
  setupAlgorithmButtons();
  setupGlobalControls();
  setupProfileButtons();

  updateDailyTasks(dailyList);

  updateXPUI(
    playerProfile,
    playerLevel,
    xpText,
    xpFill
  );

  refreshAll();
  registerServiceWorker();
}

initApp();