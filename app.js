// app.js
// Hlavní logika MG3i Traineru

import { openVariantPicker, initVariantPicker } from "./variantPicker.js";
import { adaptSliceMoveForTrainer } from "./sliceAdapter.js";
import {
  setTrainerRotation,
  setTrainerTop,
  setTrainerFrontColor,
  detectFrontColorFromFacelets,
  getTrainerRotation
} from "./orientation.js";

import { detectPLLRotationFromFacelets } from "./pllDetector.js?v=3";

import {
  makeStateSignature,
  recognizeStateMove,
  saveStateMoveMap,
  exportMoveMapsText,
  getMoveMapCount
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
import { connectCube } from "./cubeConnection.js?v=13";
import { pllAlgs, getActivePllAlg } from "./algorithms.js";

/*
localStorage.removeItem("mg3i_move_maps");
alert("Move maps vymazány");
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
const topMenuWrap = document.getElementById("top-menu-wrap");
const topMenuBtn = document.getElementById("top-menu-btn");
const globalMenuBtn = document.getElementById("globalMenuBtn");
const screenMenuDropdown = document.getElementById("screen-menu-dropdown");
const aoPanel = document.getElementById("ao-panel");
const aoPanelToggle = document.getElementById("aoPanelToggle");
const aoPinBtn = document.getElementById("aoPinBtn");
const historyPanelToggle = document.getElementById("historyPanelToggle");
const historyPinBtn = document.getElementById("historyPinBtn");

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
const colorPresetBtn = document.getElementById("colorPresetBtn");


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
let moveDebugEnabled = false;
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
//úprava rychlosti U2
const DOUBLE_MOVE_WINDOW = 450;

const SLICE_PAIR_WINDOW = 260;
const SLICE_DOUBLE_MOVE_WINDOW = 650;


const TPS_WINDOW = 2000;
let moveBaseState = null;

let pendingSliceRaw = null;
let pendingSliceTimer = null;
let pendingGuidedOuter = null;
let pendingGuidedOuterTimer = null;
let sliceCenter = [0, 1, 2, 3, 4, 5];
const SLICE_CENTER_ROT = [
  [0, 2, 4, 3, 5, 1], // E / y'
  [5, 1, 0, 2, 4, 3], // M / x'
  [4, 0, 2, 1, 3, 5]  // S / z
];
let pendingVariantIndex = null;
let trainerPaused = false;







const COLOR_PRESETS = [
  {
    key: "yellow_green",
    label: "Top Yellow | Front Green",
    top: "yellow",
    front: "green"
  },
  {
    key: "white_green",
    label: "Top White | Front Green",
    top: "white",
    front: "green"
  }
];

function getColorPresetKey() {
  return localStorage.getItem("trainerColorPreset") || "yellow_green";
}

function getColorPreset() {
  const key = getColorPresetKey();
  return COLOR_PRESETS.find(p => p.key === key) || COLOR_PRESETS[0];
}

function applyColorPreset() {
  const preset = getColorPreset();

  setTrainerTop(preset.top);
  setTrainerFrontColor(preset.front);

  if (colorPresetBtn) {
    colorPresetBtn.textContent = preset.label;
  }

  document.querySelectorAll(".alg-orientation-hint").forEach(el => {
    el.textContent = preset.label;
  });
}

function toggleColorPreset() {
  const current = getColorPresetKey();
  const next = current === "yellow_green" ? "white_green" : "yellow_green";

  localStorage.setItem("trainerColorPreset", next);
  applyColorPreset();
}
function setTrainerPaused(value) {
  trainerPaused = !!value;

  if (selectedAlg) {
    if (selectedAlg) {
  selectedAlg.addEventListener("pointerdown", e => {
    if (e.target.closest("#editAlgVariantBtn")) return;
    
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    toggleTrainerPaused();
  });
}
    selectedAlg.classList.toggle("trainer-paused", trainerPaused);
  }

  if (stateMsg) {
    stateMsg.textContent = trainerPaused ? "PAUZA" : "PŘIPRAVEN";
  }
}

function toggleTrainerPaused() {
  if (!currentAlgorithmName || currentAlgorithmName === "Nevybráno") return;
  setTrainerPaused(!trainerPaused);
}
//localStorage.setItem("pllVariant:Jb-perm", "2");

function showTrainerDashboard() {
  document.body.classList.add("trainer-ready");

  const topDashboard = document.getElementById("top-dashboard");
  if (topDashboard) {
    topDashboard.classList.add("ready");
  }
}

function hideTrainerDashboard() {
  document.body.classList.remove("trainer-ready");

  const topDashboard = document.getElementById("top-dashboard");
  if (topDashboard) {
    topDashboard.classList.remove("ready");
  }
}
function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function processCubeStateMove(currentState) {
  // State rozpoznání je připravené jen jako ruční/záložní cesta.
  // Pro rychlé skládání se tahy berou z RAW MOVE eventů v handleRawMove().
  if (trainerLocked) return;
  if (!currentState) return;
  if (!moveBaseState) return;

  const stateNow = JSON.stringify(currentState);
  if (stateNow === lastStateSignature) return;
  lastStateSignature = stateNow;

  const signature = makeStateSignature(moveBaseState, currentState);
  if (!signature) return;

  const move = recognizeStateMove(signature);

  if (!move) {
    if (mDebug) mDebug.innerText = "STATE: tah neznám";
    return;
  }

  moveBaseState = cloneState(currentState);
  if (mDebug) mDebug.innerText = "STATE MOVE: " + move;

  commitMove(move, performance.now());
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
  lastStateSignature = "";
  
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
  function closeTopMenu() {
    document.body.classList.remove("menu-open");
    if (topMenuWrap) topMenuWrap.classList.remove("open");
  }

  function toggleTopMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    document.body.classList.toggle("menu-open");
    if (topMenuWrap) topMenuWrap.classList.toggle("open", document.body.classList.contains("menu-open"));
  }

  if (topMenuBtn) topMenuBtn.onclick = toggleTopMenu;
  if (globalMenuBtn) globalMenuBtn.onclick = toggleTopMenu;

  document.addEventListener("pointerdown", e => {
    if (e.target.closest("#top-menu-btn")) return;
    if (e.target.closest("#globalMenuBtn")) return;
    if (e.target.closest("#screen-menu-dropdown")) return;
    closeTopMenu();
  });

  navTimer.onclick = () => {
    closeTopMenu();
    setActiveNav(navTimer);
    showScreen("timer");
  };

  navStats.onclick = () => {
    closeTopMenu();
    setActiveNav(navStats);
    showScreen("stats");
  };

  navSettings.onclick = () => {
    closeTopMenu();
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
  document.body.classList.toggle("screen-timer", screen === "timer");
  document.body.classList.toggle("screen-stats", screen === "stats");
  document.body.classList.toggle("screen-settings", screen === "settings");

  if (mainLayout) {
    mainLayout.style.display = screen === "timer" ? "grid" : "none";
}
appScreen.style.display = screen === "timer" ? "flex" : "none";
historyPanel.style.display = screen === "timer" ? "block" : "none";
settingsScreen.style.display = screen === "settings" ? "block" : "none";
statsScreen.style.display = screen === "stats" ? "block" : "none";
}

function setupAoPanel() {
  if (!aoPanel || !aoPanelToggle) return;

  const pinned = localStorage.getItem("aoPanelPinned") === "1";
  if (pinned) {
    document.body.classList.add("ao-open", "ao-pinned");
  }

  aoPanelToggle.onclick = e => {
    e.preventDefault();
    e.stopPropagation();

    if (document.body.classList.contains("ao-pinned")) return;
    document.body.classList.toggle("ao-open");
  };

  if (aoPinBtn) {
    aoPinBtn.onclick = e => {
      e.preventDefault();
      e.stopPropagation();

      const willPin = !document.body.classList.contains("ao-pinned");
      document.body.classList.toggle("ao-pinned", willPin);
      document.body.classList.toggle("ao-open", willPin);
      localStorage.setItem("aoPanelPinned", willPin ? "1" : "0");
    };
  }

  document.addEventListener("pointerdown", e => {
    if (document.body.classList.contains("ao-pinned")) return;
    if (e.target.closest("#ao-panel")) return;
    document.body.classList.remove("ao-open");
  });
}


function setupHistoryPanel() {
  if (!historyPanel || !historyPanelToggle) return;

  const pinned = localStorage.getItem("historyPanelPinned") === "1";
  if (pinned) {
    document.body.classList.add("history-open", "history-pinned");
  }

  historyPanelToggle.onclick = e => {
    e.preventDefault();
    e.stopPropagation();

    if (document.body.classList.contains("history-pinned")) return;
    document.body.classList.toggle("history-open");
  };

  if (historyPinBtn) {
    historyPinBtn.onclick = e => {
      e.preventDefault();
      e.stopPropagation();

      const willPin = !document.body.classList.contains("history-pinned");
      document.body.classList.toggle("history-pinned", willPin);
      document.body.classList.toggle("history-open", willPin);
      localStorage.setItem("historyPanelPinned", willPin ? "1" : "0");
    };
  }

  document.addEventListener("pointerdown", e => {
    if (document.body.classList.contains("history-pinned")) return;
    if (e.target.closest("#history")) return;
    document.body.classList.remove("history-open");
  });
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
    showTrainerDashboard();
    /*stateMsg.innerText = "Vyber algoritmus a klepni pro start";
    stateMsg.style.color = "yellow";
    */
  };

  btn.onclick = async e => {
    e.stopPropagation();

    try {
      initAudio();
      status.innerText = "Připojuji...";

      await connectCube({
        onMove: move => {
          handleSmartRawMove(move);
        },

        onFacelets: event => {
          faceletCount++;

          setCurrentFacelets(event.facelets);
          setCurrentCubeState(event.state);

          // Automatická BASE jen pro MAP/testování. Trenér jede přes RAW MOVE.
          if (!moveBaseState && event.state) {
            moveBaseState = cloneState(event.state);
            lastStateSignature = "";
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
      showTrainerDashboard();
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
  
  moveDebugEnabled = !moveDebugEnabled;
  
  if (moveDebugEnabled) {
    ollBtn.classList.add("debug-on");
    
    showMoveDebug({
      expected: getExpectedMove(),
      actual: "čekám na tah",
      raw: window.__lastRawDebug || "-",
      result: "DEBUG ON"
    });
  } else {
    ollBtn.classList.remove("debug-on");
    
    const box = document.getElementById("moveDebugBox");
    if (box) {
      box.style.display = "none";
    }
  }
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
selectedAlg.dataset.algName = name;
selectedAlg.dataset.algText = getActivePllAlg(name);
selectedAlg.innerText = "Algoritmus: " + selectedAlg.dataset.algText;

prepareNext();
renderAlgorithmPreview(selectedAlg);
setTrainerPaused(false);
const editBtn = document.getElementById("editAlgVariantBtn");
if (editBtn) editBtn.classList.remove("hidden");
        clearPendingMove();
clearSliceMoveBuffer();
clearGuidedOuterBuffer();
resetSliceCenter();
        setTrainerTop("yellow");
        
        let pllRotation = detectPLLRotationFromFacelets(
          getCurrentFacelets(),
          currentAlgorithmName
          );
          let pllRotationForTrainer = pllRotation;

// TEST: Z-perm ambiguous → ručně zkusíme modrá vpředu = ROT 0.
// Později z toho uděláme tlačítka front barvy.
if (
  currentAlgorithmName === "Z-perm" &&
  window.__pllDebug &&
  window.__pllDebug.manualRotation
) {
  pllRotationForTrainer = 0;
}
        const faceletsNowForDebug = String(getCurrentFacelets() || "");
const pllDbgForDebug = window.__pllDebug || {};

if (moveDebugEnabled) {
  showMoveDebug({
    expected: "PLL ROT: " + pllRotation,
    actual:
  "PATTERN: " + (pllDbgForDebug.detectedPattern || "none") +
  " | ALG: " + currentAlgorithmName +
  " | LEN: " + faceletsNowForDebug.length,
    raw:
      "U: " + faceletsNowForDebug.slice(0, 9) + "\n" +
      "R: " + faceletsNowForDebug.slice(9, 18) + "\n" +
      "F: " + faceletsNowForDebug.slice(18, 27) + "\n" +
      "D: " + faceletsNowForDebug.slice(27, 36) + "\n" +
      "L: " + faceletsNowForDebug.slice(36, 45) + "\n" +
      "B: " + faceletsNowForDebug.slice(45, 54),
    result: "PLL DETECT"
  });
}
        
        
        if (moveDebugEnabled && currentAlgorithmName === "T-perm") {
  const faceletsNow = String(getCurrentFacelets() || "");
  const pllDbg = window.__pllDebug || {};

  showMoveDebug({
    expected: "PLL ROT: " + pllRotation,
    actual: "PATTERN: " + (pllDbg.detectedPattern || "none"),
    raw:
      "U: " + faceletsNow.slice(0, 9) + "\n" +
      "L: " + faceletsNow.slice(36, 45) + "\n" +
      "B: " + faceletsNow.slice(45, 54),
    result: "PLL DETECT"
  });
}
        // Spodní PLL/facelets debug box je vypnutý, aby nepřekrýval timer.
        const oldPllDebugBox = document.getElementById("pllDebugBox");
        if (oldPllDebugBox) oldPllDebugBox.remove();
        
        if (pllRotationForTrainer !== null && pllRotationForTrainer !== undefined) {
  setTrainerRotation(pllRotationForTrainer);
  if (mDebug) mDebug.innerText = "PLL ROT: " + pllRotationForTrainer;
} else {
          
          const frontColor = detectFrontColorFromFacelets(getCurrentFacelets());
          setTrainerFrontColor(frontColor || "green");
          
          if (mDebug) {
            mDebug.innerText = "FRONT fallback: " + (frontColor || "green");
          }
        }
        
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
     
      if (e.target.closest("#selectedAlg")) return;
      if (e.target.closest("#algVariantModal")) return;
      
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
  // Ruční start/stop jen klikem na velký čas
  if (!e.target.closest("#tps")) return;
  
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
  if (!e.target.closest("#tps")) return;
  
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
selectedAlg.dataset.algName = randomName;
selectedAlg.dataset.algText = getActivePllAlg(randomName);
selectedAlg.innerText = "Algoritmus: " + selectedAlg.dataset.algText;
  
  prepareNext();
  renderAlgorithmPreview(selectedAlg);
  setTrainerPaused(false);
  
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
  clearSliceMoveBuffer();
  clearGuidedOuterBuffer();
  resetSliceCenter();

  seq = [];
  moveTimes = [];
  tpsHistory = [];
  totalMoves = 0;
  maxTPS = 0;
  longestPause = 0;
  pendingMove = null;

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

function baseFace(move) {
  return String(move).replace("2", "").replace("'", "");
}

function direction(move) {
  return String(move).includes("'") ? -1 : 1;
}

function makeDoubleMove(move) {
  return baseFace(move) + "2";
}

function getCurrentAlgorithmText() {
  if (currentAlgorithmName && pllAlgs[currentAlgorithmName]) {
    return getActivePllAlg(currentAlgorithmName);
  }

  const text = selectedAlg ? (selectedAlg.innerText || "") : "";
  const parts = text.split(":");
  return parts[1] ? parts[1].trim() : "";
}






function selectedAlgorithmUsesSlice() {
  return /(^|\s)[MES](?:2|'|\s|$)/.test(getCurrentAlgorithmText());
}

function isSliceNotationMove(move) {
  return /^[MES](?:2|')?$/.test(normalizeMove(move));
}

function resetSliceCenter() {
  sliceCenter = [0, 1, 2, 3, 4, 5];
}

function clearSliceMoveBuffer() {
  if (pendingSliceTimer) {
    clearTimeout(pendingSliceTimer);
    pendingSliceTimer = null;
  }
  pendingSliceRaw = null;
}

function clearGuidedOuterBuffer() {
  if (pendingGuidedOuterTimer) {
    clearTimeout(pendingGuidedOuterTimer);
    pendingGuidedOuterTimer = null;
  }
  pendingGuidedOuter = null;
}

function getMoveSuffix(move) {
  move = normalizeMove(move);
  if (move.endsWith("2")) return "2";
  if (move.endsWith("'")) return "'";
  return "";
}

function getMovePow(move) {
  const suffix = getMoveSuffix(move);
  return " 2'".indexOf(suffix || " ") % 3;
}

function logicalOuterMove(rawMove) {
  rawMove = normalizeMove(rawMove);
  const rawFace = rawMove.charAt(0);
  const rawAxis = "URFDLB".indexOf(rawFace);
  if (rawAxis < 0) return rawMove;

  const logicalAxis = sliceCenter.indexOf(rawAxis);
  if (logicalAxis < 0) return rawMove;

  return "URFDLB".charAt(logicalAxis) + getMoveSuffix(rawMove);
}

function rotateSliceCenter(axisM, powM) {
  // Stejný princip jako csTimer getPrettyMoves(): po slice tahu se změní
  // orientační rámec středů. Díky tomu následné U po M neskočí jako D/U'.
  for (let p = 0; p < powM + 1; p++) {
    const next = [];
    for (let c = 0; c < 6; c++) {
      next[c] = sliceCenter[SLICE_CENTER_ROT[axisM][c]];
    }
    sliceCenter = next;
  }
}

function tryMakeSliceMove(rawA, rawB) {
  const a = logicalOuterMove(rawA);
  const b = logicalOuterMove(rawB);
  
  const axis = "URFDLB".indexOf(a.charAt(0));
  const axis2 = "URFDLB".indexOf(b.charAt(0));
  
  if (axis < 0 || axis2 < 0) return null;
  
  const pow = getMovePow(a);
  const pow2 = getMovePow(b);
  
  if (axis !== axis2 && axis % 3 === axis2 % 3 && pow + pow2 === 2) {
    const axisM = axis % 3;
    let powM = (pow - 1) * [1, 1, -1, -1, -1, 1][axis] + 1;
    
    // MG3i / GAN má M směr opačně proti tomu, co nám tady vyšlo.
    // R' + L má být M, ne M'.
    if (axisM === 1) {
      if (powM === 0) {
        powM = 2;
      } else if (powM === 2) {
        powM = 0;
      }
    }
    
    const move = "URFDLBEMS".charAt(axisM + 6) + " 2'".charAt(powM);
    
    rotateSliceCenter(axisM, powM);
    
    return move.trim();
  }
  
  return null;
}

function moveAxisGroup(move) {
  move = normalizeMove(move);
  const axis = "URFDLB".indexOf(move.charAt(0));
  return axis < 0 ? -1 : axis % 3;
}

function rawMatchesExpectedAxis(rawMove, expectedMove) {
  const expectedGroup = moveAxisGroup(expectedMove);
  if (expectedGroup < 0) return false;

  const rawGroup = moveAxisGroup(rawMove);
  const logicalGroup = moveAxisGroup(logicalOuterMove(rawMove));

  return rawGroup === expectedGroup || logicalGroup === expectedGroup;
}

function handleGuidedOuterMove(rawMove, expectedMove) {
  rawMove = normalizeMove(rawMove);
  expectedMove = normalizeMove(expectedMove);

  if (!rawMove || !expectedMove) return;

  const expectedBase = baseFace(expectedMove);
  if (!"URFDLB".includes(expectedBase)) {
    handleRawMove(logicalOuterMove(rawMove));
    return;
  }

  if (!rawMatchesExpectedAxis(rawMove, expectedMove)) {
    clearGuidedOuterBuffer();
    handleRawMove(logicalOuterMove(rawMove));
    return;
  }

  const now = performance.now();

  if (!expectedMove.endsWith("2")) {
    clearGuidedOuterBuffer();
    commitMove("=" + expectedMove, now);
    return;
  }

  if (getMoveSuffix(rawMove) === "2") {
    clearGuidedOuterBuffer();
    commitMove("=" + expectedMove, now);
    return;
  }

  if (
    pendingGuidedOuter &&
    baseFace(pendingGuidedOuter.expected) === expectedBase &&
    now - pendingGuidedOuter.time <= SLICE_DOUBLE_MOVE_WINDOW
  ) {
    clearGuidedOuterBuffer();
    commitMove("=" + expectedMove, now);
    return;
  }

  clearGuidedOuterBuffer();
  pendingGuidedOuter = { expected: expectedMove, time: now };
  pendingGuidedOuterTimer = setTimeout(() => {
    if (mDebug) {
      mDebug.innerText = "Čekám na 2. část " + expectedMove;
    }
    clearGuidedOuterBuffer();
  }, SLICE_DOUBLE_MOVE_WINDOW);

  if (mDebug) {
    mDebug.innerText = "1/2 pro " + expectedMove;
  }
}

function flushSlicePendingRaw() {
  if (!pendingSliceRaw) return;

  const item = pendingSliceRaw;
  clearSliceMoveBuffer();
  handleRawMove(logicalOuterMove(item.move));
}
function showMoveDebug(info = {}) {
  let box = document.getElementById("moveDebugBox");
  
  if (!box) {
    box = document.createElement("div");
    box.id = "moveDebugBox";
    document.body.appendChild(box);
  }
  
  if (!moveDebugEnabled) {
    box.style.display = "none";
    return;
  }
  
  box.style.display = "block";
  box.style.position = "fixed";
box.style.left = "10px";
box.style.top = "80px";
box.style.right = "auto";
box.style.bottom = "auto";
box.style.width = "260px";
box.style.maxWidth = "calc(100vw - 20px)";
box.style.maxHeight = "45vh";
box.style.overflow = "auto";
box.style.zIndex = "99999";
box.style.background = "rgba(0,0,0,0.88)";
box.style.color = "#fff";
box.style.border = "1px solid #00e676";
box.style.borderRadius = "10px";
box.style.padding = "10px";
box.style.fontSize = "15px";
box.style.lineHeight = "19px";
box.style.whiteSpace = "pre-line";
  
  box.innerText =
  "DEBUG TAH\n" +
  "ROT: " + getTrainerRotation() + "\n" +
  "OČEKÁVÁ: " + (info.expected || "-") + "\n" +
  "PŘIŠLO: " + (info.actual || "-") + "\n" +
  "RAW: " + (info.raw || "-") + "\n" +
  "VÝSLEDEK: " + (info.result || "-");
}



function handleSmartRawMove(move) {
    if (trainerPaused) {
    return;
  }
  window.__smartInCount = (window.__smartInCount || 0) + 1;

if (mDebug) {
  mDebug.innerText =
    "SMART IN #" + window.__smartInCount + "\n" +
    "MOVE: " + move;
}
  window.__lastRawDebug = String(move || "");
  
  move = normalizeMove(move);
  if (!move) return;
  // Pokud aktuální algoritmus NEobsahuje M/E/S, nesmí se používat slice buffer.
// Jinak se při rychlém T-permu může dvojice raw tahů omylem vyhodnotit jako M/E/S
// a rozhodí orientaci nebo pending tahy.
if (!selectedAlgorithmUsesSlice()) {
  clearSliceMoveBuffer();
  clearGuidedOuterBuffer();
  resetSliceCenter();

  window.__lastRawDebug = move;

  handleRawMove(move);
  return;
}
  

  const expected = normalizeMove(getExpectedMove());

  // V algoritmech se slice tahy (M/E/S) skládají z rychlé dvojice RAW tahů.
  // Jakmile se čeká běžný tah U/U2/R/... po slice tahu, nepoužíváme název z kostky
  // jako pravdu, protože po změně rámce může přijít jako U', D' apod.
  if (expected && !isSliceNotationMove(expected)) {
    clearSliceMoveBuffer();
    handleGuidedOuterMove(move, expected);
    return;
  }

  clearGuidedOuterBuffer();

  const now = performance.now();

  if (!pendingSliceRaw) {
    pendingSliceRaw = { move, time: now };
    pendingSliceTimer = setTimeout(flushSlicePendingRaw, SLICE_PAIR_WINDOW);
    if (mDebug) mDebug.innerText = "RAW čekám pár: " + move;
    return;
  }

  const previous = pendingSliceRaw;

  if (now - previous.time <= SLICE_PAIR_WINDOW) {
    const sliceMoveRaw = tryMakeSliceMove(previous.move, move);

if (sliceMoveRaw) {
  clearSliceMoveBuffer();
  
  const expectedNow = normalizeMove(getExpectedMove());
  
  const adaptedSlice = adaptSliceMoveForTrainer(
  sliceMoveRaw,
  expectedNow,
  getTrainerRotation(),
  currentAlgorithmName
);

let sliceMove = adaptedSlice.move;
  /*
  // U Ua/Ub algoritmů očekáváme M/M'/M2.
  // Když je PLL otočené jinou barvou dopředu,
  // fyzické M může z kostky přijít jako S.
  // Pro trenér ho převedeme zpět na očekávané M.
  if (
    expectedNow &&
    expectedNow.charAt(0) === "M" &&
    sliceMoveRaw.charAt(0) === "S"
  ) {
    sliceMove = "M" + sliceMoveRaw.slice(1);
  }
  */
  window.__lastRawDebug =
  previous.move + " + " + move + " => " + adaptedSlice.debug;
  
  if (mDebug) {
    mDebug.innerText =
      "RAW: " + previous.move + " + " + move +
      " → " + sliceMove +
      " | EXPECTED: " + expectedNow;
  }
  
  if ( expectedNow && expectedNow.endsWith("2")) {
    handleRawMove(sliceMove);
  } else {
    clearPendingMove();
    commitMove(sliceMove, performance.now());
  }
  
  return;
}
  
  }

  flushSlicePendingRaw();

  pendingSliceRaw = { move, time: now };
  pendingSliceTimer = setTimeout(flushSlicePendingRaw, SLICE_PAIR_WINDOW);
}

function handleRawMove(move) {
    if (trainerPaused) {
    return;
  }
  if (activeScreen !== "timer") return;
  if (cubeMode === "normal") return;
  if (trainerLocked) return;

  move = normalizeMove(move);
  if (!move) return;

  const now = performance.now();

  if (!isSolving && seq.length > 0) {
    prepareNext();
  }
    const expectedMove = normalizeMove(getExpectedMove());
  
  // FIX: běžné tahy nečekají v double-bufferu.
  // Debug okno aplikaci zpomalovalo, a tím maskovalo chybu.
  // Buffer necháme jen pro očekávané dvojtahy typu R2/U2/M2.
  if (
    expectedMove &&
    !expectedMove.endsWith("2") &&
    !isSliceNotationMove(expectedMove)
  ) {
    if (pendingMove) {
      clearTimeout(pendingTimer);
      pendingTimer = null;
      commitMove(pendingMove, pendingMoveTime);
      pendingMove = null;
      pendingMoveTime = 0;
    }
    
    commitMove(move, now);
    return;
  }
  
  // Když kostka pošle R2/U2 přímo jako jeden tah, potvrď ho hned.
  if (
    expectedMove &&
    expectedMove.endsWith("2") &&
    normalizeMove(move) === expectedMove
  ) {
    clearPendingMove();
    commitMove(move, now);
    return;
  }
  const doubleWindow =
    isSliceNotationMove(pendingMove) || isSliceNotationMove(move)
      ? SLICE_DOUBLE_MOVE_WINDOW
      : DOUBLE_MOVE_WINDOW;

  if (
    pendingMove &&
    baseFace(pendingMove) === baseFace(move) &&
    direction(pendingMove) === direction(move) &&
    now - pendingMoveTime < doubleWindow
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
  }, doubleWindow);
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
const expectedBeforeMove = getExpectedMove();
  const trainerResult = checkMove(move, selectedAlg);
showMoveDebug({
  expected: expectedBeforeMove,
  actual: move,
  raw: window.__lastRawDebug || "",
  result: trainerResult
});
  if (mDebug) {
    mDebug.innerText =
      "MOVE: " + move +
      " | EXPECTED: " + (getExpectedMove() || "-") +
      " | RESULT: " + trainerResult;
  }

  if (trainerResult === "wrong") {
  trainerLocked = true;
  
  clearPendingMove();
  clearSliceMoveBuffer();
  clearGuidedOuterBuffer();
  
  // Po chybě si hned vyžádáme nové facelets,
  // aby další výběr PLL pracoval s aktuálním stavem kostky.
  if (typeof requestFacelets === "function") {
    setTimeout(requestFacelets, 150);
    setTimeout(requestFacelets, 500);
  }
  
  playErrorSound();
  failSolve();
  
  setTimeout(() => {
    prepareNextTrainerRun();
    trainerLocked = false;
    
    // Ještě jedna pojistka po resetu traineru
    if (typeof requestFacelets === "function") {
      requestFacelets();
    }
  }, 1800);
  
  return;
}
  if (trainerResult === "finished") {
    trainerLocked = true;
    clearPendingMove();
    clearSliceMoveBuffer();
    clearGuidedOuterBuffer();

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
  
  if (!isSolving) {
    return;
  }
  
  const elapsed = (now - startTime) / 1000;
  
  // Velké číslo uprostřed = čas
  tpsDiv.innerText = elapsed.toFixed(2);
  
  // Malý levý box = aktuální TPS
timeVal.innerText = currentTPS.toFixed(1);
  
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

  timeVal.innerText = finalTime.toFixed(2);
  avgVal.innerText = finalAvg.toFixed(1);

  tpsDiv.innerText = finalTime.toFixed(2);
moveTimes = [];

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
  clearSliceMoveBuffer();
  clearGuidedOuterBuffer();
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
  setupAoPanel();
  setupHistoryPanel();
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
  applyColorPreset();

if (colorPresetBtn) {
  colorPresetBtn.onclick = toggleColorPreset;
}
  refreshAll();
  registerServiceWorker();
}

initVariantPicker();
initApp();

const editAlgVariantBtn = document.getElementById("editAlgVariantBtn");

if (editAlgVariantBtn) {
  editAlgVariantBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentAlgorithmName || currentAlgorithmName === "Nevybráno") return;

    openVariantPicker(currentAlgorithmName, (newAlg) => {
      selectedAlg.dataset.algText = newAlg;
      selectedAlg.innerText = "Algoritmus: " + newAlg;

      prepareNext();
      renderAlgorithmPreview(selectedAlg);
    });
  });
}
