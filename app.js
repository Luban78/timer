// app.js
// Hlavní logika aplikace: připojení kostky, měření solve, historie a UI.
//v4
import {
  saveBaseFacelets,
  diffFacelets
} from "./faceletMapper.js";
import {
  initCubeEngine,
  createSolvedPattern,
  applyAlgorithm,
  isPatternSolved
} from "./cubeEngine.js";
import {
  setCurrentFacelets,
  getCurrentFacelets,
  saveStartFacelets,
  isBackToStart
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
  ACHIEVEMENTS,
  updateAchievementList,
  unlockAchievement
} from "./achievements.js";

import {
  DAILY_TASKS,
  dailyProgress,
  saveDailyProgress,
  resetDailyProgress,
  updateDailyTasks,
  completeDailyTask,
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
import { connectCube } from "./cubeConnection.js";
import { pllAlgs } from "./algorithms.js";

const btn=document.getElementById("btn");
const modeButtons=document.getElementById("modeButtons");
const pllBtn=document.getElementById("pllBtn");
const ollBtn=document.getElementById("ollBtn");
const modal=document.getElementById("modal");
const algList=document.getElementById("algList");
const closeModal=document.getElementById("closeModal");
const status=document.getElementById("status");
const selectedAlg=document.getElementById("selectedAlg");
const notation=document.getElementById("notation");
const stateMsg=document.getElementById("state-msg");
const tpsDiv=document.getElementById("tps");
const timeVal=document.getElementById("time-val");
const movesVal=document.getElementById("moves-val");
const avgVal=document.getElementById("avg-val");
const maxVal=document.getElementById("max-val");
const pauseVal=document.getElementById("pause-val");
const historyList=document.getElementById("history-list");
const canvas=document.getElementById("graph");
const ctx=canvas.getContext("2d");
const statBest=document.getElementById("stat-best");
const statAo5=document.getElementById("stat-ao5");
const statAo12=document.getElementById("stat-ao12");
const statCount=document.getElementById("stat-count");
const clearHistoryBtn=document.getElementById("clear-history-btn");
const solveDetail=document.getElementById("solve-detail");
const solveDetailContent=document.getElementById("solve-detail-content");
const closeDetailBtn=document.getElementById("close-detail-btn");
const exportHistoryBtn=document.getElementById("export-history-btn");
const exportModal=document.getElementById("export-modal");
const exportText=document.getElementById("export-text");
const closeExportBtn=document.getElementById("close-export-btn");
const copyExportBtn=document.getElementById("copy-export-btn");
const importHistoryBtn=document.getElementById("import-history-btn");
const importModal=document.getElementById("import-modal");
const importText=document.getElementById("import-text");
const runImportBtn=document.getElementById("run-import-btn");
const closeImportBtn=document.getElementById("close-import-btn");
const navTimer=document.getElementById("nav-timer");
const navStats=document.getElementById("nav-stats");
const navSettings=document.getElementById("nav-settings");
const appScreen=document.getElementById("app");
const historyPanel=document.getElementById("history");
const settingsScreen=document.getElementById("settings-screen");
const settingsExportBtn=document.getElementById("settings-export-btn");
const settingsImportBtn=document.getElementById("settings-import-btn");
const settingsClearBtn=document.getElementById("settings-clear-btn");
const statsScreen=document.getElementById("stats-screen");
const statsBest = document.getElementById("stats-best");
const statsBestTPS = document.getElementById("stats-best-tps");
const statsSolves = document.getElementById("stats-solves");
const statsAvgTPS=document.getElementById("stats-avg-tps");
const statsTotalTime=document.getElementById("stats-total-time");
const statsWorst=document.getElementById("stats-worst");
const algorithmStatsDiv=document.getElementById("algorithm-stats");
const coachAlg=document.getElementById("coach-alg");
const coachDetail=document.getElementById("coach-detail");
const playerLevel=document.getElementById("player-level");
const xpFill=document.getElementById("xp-fill");
const xpText=document.getElementById("xp-text");
const levelModal=document.getElementById("level-modal");
const levelNumber=document.getElementById("level-number");
const achievementModal=document.getElementById("achievement-modal");
const achievementTitle=document.getElementById("achievement-title");
const settingsResetProfileBtn=document.getElementById("settings-reset-profile-btn");
const achievementList=document.getElementById("achievement-list");
const recordModal=document.getElementById("record-modal");
const recordTime=document.getElementById("record-time");
const dailyList=document.getElementById("daily-list");
const normalCubeBtn=document.getElementById("normalCubeBtn");
const modeLabel=document.getElementById("mode-label");
const devCorrect=document.getElementById("dev-correct");
const devWrong=document.getElementById("dev-wrong");
const mDebug = document.getElementById("m-debug");
const devSaveFacelets = document.getElementById("dev-save-facelets");


//**""""*"*********"
let faceletCount = 0;
let mDebugMoves = [];
let trainerLocked = false;
let trainingMode = "single";
const singleModeBtn = document.getElementById("singleModeBtn");
const randomModeBtn = document.getElementById("randomModeBtn");




initCubeEngine().then(()=>{
  const solved = createSolvedPattern();
  const afterM = applyAlgorithm(solved, "M M'");

  console.log(
    "CubeEngine M test:",
    isPatternSolved(afterM)
  );
});
//console.log("CUBING TEST:", testCubingAlg());

function updateTrainingButtons(){
  singleModeBtn.classList.toggle(
    "active",
    trainingMode==="single"
  );

  randomModeBtn.classList.toggle(
    "active",
    trainingMode==="random"
  );
}

singleModeBtn.onclick=e=>{
  e.stopPropagation();
  trainingMode="single";
  updateTrainingButtons();
  console.log("trainingMode:", trainingMode);
};

randomModeBtn.onclick=e=>{
  e.stopPropagation();
  trainingMode="random";
  updateTrainingButtons();
  console.log("trainingMode:", trainingMode);
};

updateTrainingButtons();
//$$$$$$$$$$$$$$$$$$



const DEV_MODE = true;

if (DEV_MODE) {
  devCorrect.onclick = e => {
    e.stopPropagation();
    const move = getExpectedMove();
    if (!move) return;
    commitMove(move, performance.now());
  };
  
  devWrong.onclick = e => {
    e.stopPropagation();
    commitMove("F", performance.now());
  };
  document.getElementById("dev-controls").addEventListener("pointerdown", e => {
  e.stopPropagation();
  e.preventDefault();
  
  if (e.target.id !== "dev-save-facelets") return;
  
  alert("BASE klik");
  alert("typ: " + typeof getCurrentFacelets);
  status.innerText = "BASE uloženo";
});
} else {
  document.getElementById("dev-controls").style.display = "none";
}



function updateModeLabel(){
  modeLabel.innerText =
    cubeMode==="normal"
      ? "Režim: Normal Cube"
      : "Režim: Smart Cube";
}

updateDailyTasks(dailyList);
/*
function showRecord(time){
  recordTime.textContent=time.toFixed(2)+" s";
  recordModal.style.display="block";

  setTimeout(()=>{
    recordModal.style.display="none";
  },2200);
}*/

function resetProfile() {
  
  const ok = confirm("Opravdu vymazat XP, level a achievementy?");
  if (!ok) return;
  
  // Reset profilu hráče
  playerProfile = {
    xp: 0,
    level: 1,
    streak: 0,
    totalXP: 0,
    achievements: []
  };
  
  saveProfile(playerProfile);
  
  // Reset denních úkolů
  resetDailyProgress();
  
  // Překreslení celé obrazovky
  updateXPUI(playerProfile, playerLevel, xpText, xpFill);
  updateAchievementList(achievementList, playerProfile);
  updateDailyTasks(dailyList);
  
  alert("Profil resetován.");
}
settingsResetProfileBtn.onclick=resetProfile;

function showAchievement(title) {
  achievementTitle.textContent = title;
  achievementModal.style.display = "block";
  
  setTimeout(() => {
    achievementModal.style.display = "none";
  }, 2200);
}



  

function updateAlgorithmStats(){
  const algStats=getAlgorithmStats(savedSolves);

  if(algStats.length===0){
    algorithmStatsDiv.innerHTML="<p>Zatím žádná data algoritmů.</p>";
    return;
  }

  algorithmStatsDiv.innerHTML=algStats.map(a=>`
    <div class="stat-card">
      <h3>${a.name}</h3>
      <div>${a.count}×</div>
      <p>Best: ${a.best.toFixed(2)} s</p>
      <p>Avg: ${a.avg.toFixed(2)} s</p>
    </div>
  `).join("");
}

function updateStatistics(){

  if(savedSolves.length===0){
    statsBest.textContent="-";
    statsBestTPS.textContent="-";
    statsSolves.textContent="0";
    statsAvgTPS.textContent="-";
    statsTotalTime.textContent="-";
    statsWorst.textContent="-";
    return;
  }

  const best=Math.min(...savedSolves.map(s=>Number(s.time)||0));

  const bestTPS=Math.max(...savedSolves.map(s=>Number(s.tps ?? s.avg ?? 0)));

  statsBest.textContent=best.toFixed(2)+" s";
  statsBestTPS.textContent=bestTPS.toFixed(1);
  statsSolves.textContent=savedSolves.length;
  const avgTPS =
  savedSolves.reduce((sum,s)=>sum+Number(s.tps ?? s.avg ?? 0),0) / savedSolves.length;

const totalTime =
  savedSolves.reduce((sum,s)=>sum+Number(s.time || 0),0);

const worst =
  Math.max(...savedSolves.map(s=>Number(s.time)||0));

statsAvgTPS.textContent=avgTPS.toFixed(1);
statsTotalTime.textContent=totalTime.toFixed(1)+" s";
statsWorst.textContent=worst.toFixed(2)+" s";

}

function setActiveNav(activeBtn){
  [navTimer,navStats,navSettings].forEach(btn=>{
    btn.classList.remove("active");
  });

  activeBtn.classList.add("active");
}

function showScreen(screen) {
  activeScreen=screen;
  appScreen.style.display = screen === "timer" ? "flex" : "none";
  historyPanel.style.display = screen === "timer" ? "block" : "none";
  settingsScreen.style.display = screen === "settings" ? "block" : "none";
  statsScreen.style.display = screen === "stats" ? "block" : "none";
}

navTimer.onclick = () => {
  setActiveNav(navTimer);
  showScreen("timer");
};

navStats.onclick=()=>{
  setActiveNav(navStats);
  showScreen("stats");
};

navSettings.onclick=()=>{
  setActiveNav(navSettings);
  showScreen("settings");
};

setActiveNav(navTimer);

function showImportModal(){
  importText.value="";
  importModal.style.display="block";
}

importHistoryBtn.onclick=showImportModal;
settingsImportBtn.onclick=showImportModal;

closeImportBtn.onclick = () => {
  importModal.style.display = "none";
};


importModal.onclick = e => {
  if (e.target === importModal) {
    importModal.style.display = "none";
  }
};
/* run import buton*/
runImportBtn.onclick=()=>{
  try{

    const imported=JSON.parse(importText.value);

    if(!Array.isArray(imported)){
      alert("Neplatný formát.");
      return;
    }

    savedSolves.length=0;
    savedSolves.push(...imported);

    saveSolves(savedSolves);

    renderHistory(historyList,savedSolves,showSolveDetail);
    updateStats();
    updateStatistics();
    updateAlgorithmStats();
    updateCoach(
  savedSolves,
  getAlgorithmStats,
  coachAlg,
  coachDetail
);
    updateAchievementList(achievementList, playerProfile);
    importModal.style.display="none";

    alert("Import dokončen.");

  }catch(e){
    alert("Import se nepodařil.");
  }
};

normalCubeBtn.onclick=()=>{
  cubeMode="normal";
  localStorage.setItem("cubeMode",cubeMode);

  isConnected=true;

  btn.style.display="none";
  normalCubeBtn.style.display="none";
  modeButtons.style.display="grid";

  status.innerText="Normal Cube režim";
  stateMsg.innerText="Vyber algoritmus a klepni pro start";
  stateMsg.style.color="yellow";
};

/* end run import button*/
function showExportModal(){
  exportText.value=JSON.stringify(savedSolves,null,2);
  exportModal.style.display="block";
  exportText.select();
}

exportHistoryBtn.onclick=showExportModal;
settingsExportBtn.onclick=showExportModal;

settingsExportBtn.onclick=()=>{
  exportHistoryBtn.onclick();
};

settingsImportBtn.onclick=()=>{
  importHistoryBtn.onclick();
};

settingsClearBtn.onclick=clearHistory;

closeExportBtn.onclick=()=>{
  exportModal.style.display="none";
};
copyExportBtn.onclick=async()=>{
  try{
    await navigator.clipboard.writeText(exportText.value);

    const oldText=copyExportBtn.innerText;
    copyExportBtn.innerText="✅ Zkopírováno";

    setTimeout(()=>{
      copyExportBtn.innerText=oldText;
    },1500);

  }catch(e){
    alert("Kopírování se nepodařilo.");
  }
};
exportModal.onclick=e=>{
  if(e.target===exportModal){
    exportModal.style.display="none";
  }
};
let activeScreen="timer";
let cubeMode=localStorage.getItem("cubeMode") || "smart";
let seq=[];
let moveTimes=[];
let tpsHistory=[];
let totalMoves=0,maxTPS=0,longestPause=0;
let isSolving=false,isConnected=false;
let startTime=0,lastMoveTime=0;
let uiTimer=null,stopTimer=null;
let pendingMove=null,pendingMoveTime=0,pendingTimer=null;
let lastBeep=0;

let currentMoves=[];
let currentAlgorithmName="Nevybráno";
let savedSolves = loadSolves();

let playerProfile = loadProfile();
//const DEV_MODE = true;

const DOUBLE_MOVE_WINDOW=280;
const TPS_WINDOW=2000;

window.onresize = () => resizeGraphCanvas(canvas);
resizeGraphCanvas(canvas);

btn.onclick=async(e)=>{
  e.stopPropagation();

  try{
    initAudio();
    status.innerText="Připojuji...";

    await connectCube({
      onMove: move => handleRawMove(move),
      onFacelets: event => {
  faceletCount++;
  
  setCurrentFacelets(event.facelets);
  
  const stateText = isBackToStart() ? " ✅ START" : " 🔄 ZMĚNA";
  
  status.innerText =
    "FACELETS " + faceletCount + stateText + ":\n" + event.facelets;
}
    });

    isConnected=true;
    cubeMode="smart";
    updateModeLabel();
localStorage.setItem("cubeMode",cubeMode);
    btn.style.display="none";
    normalCubeBtn.style.display="none";
    modeButtons.style.display="grid";
    status.innerText="Připojeno, začni otočením kostky";
    stateMsg.innerText="PŘIPRAVEN";
    beep(523,.08);

  }catch(e){
    status.innerText="Chyba: "+e.message;
  }
};

ollBtn.onclick=e=>{
e.stopPropagation();
alert("OLL menu doplníme v další verzi. Teď je hotové PLL.");
};

closeModal.onclick=e=>{
e.stopPropagation();
modal.style.display="none";
};

modal.onclick=e=>{
if(e.target===modal) modal.style.display="none";
};

pllBtn.onclick=e=>{
  e.stopPropagation();
  openPLLMenu({
    algList,
    modal,
    selectedAlg,
    pllAlgs,
    onSelect: name=>{
  currentAlgorithmName = name;
  prepareNext();
  renderAlgorithmPreview(selectedAlg);
}
  });
};
/*
selectedAlg.addEventListener("pointerdown", e => {
    e.stopPropagation();

    const ok = checkMove("R", selectedAlg);

    console.log(ok);
});
console.log(checkMove("R", selectedAlg));
console.log(checkMove("U", selectedAlg));
*/
/*
if(DEV_MODE){
  selectedAlg.onclick = () => {
    const move = prompt("Zadej tah:", "R");
    if(!move) return;

    commitMove(move, performance.now());
  };
}*/


/*
if(DEV_MODE){
  document.addEventListener("keydown", e=>{

    if(e.key.toLowerCase()==="s"){
      const move = getExpectedMove();
      if(!move) return;

      commitMove(move, performance.now());
    }

    if(e.key.toLowerCase()==="w"){
      commitMove("F", performance.now());
    }

  });
}*/
function pickRandomPLL(){
  const names = Object.keys(pllAlgs);
  const randomName = names[Math.floor(Math.random() * names.length)];

  currentAlgorithmName = randomName;
  selectedAlg.innerText = "Algoritmus: " + pllAlgs[randomName];

  prepareNext();
  renderAlgorithmPreview(selectedAlg);
}



function prepareNextTrainerRun() {
  console.log("prepareNextTrainerRun");

  if (trainingMode === "random") {
    console.log("Random mode");
    pickRandomPLL();
    return;
  } else {
    console.log("Single mode");
  }

  resetTrainer(selectedAlg);
  prepareNext();
}

function prepareNext(){
seq=[];moveTimes=[];tpsHistory=[];
totalMoves=0;maxTPS=0;longestPause=0;pendingMove=null;
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

function baseFace(move){return String(move).replace("2","").replace("'","");}
function direction(move){return String(move).includes("'")?-1:1;}
function makeDoubleMove(move){return baseFace(move)+"2";}

function handleRawMove(move){
  if(activeScreen!=="timer")return;
if(cubeMode==="normal")return;
  
const now=performance.now();

if(!isSolving && seq.length>0){
prepareNext();
}

if(
pendingMove &&
baseFace(pendingMove)===baseFace(move) &&
direction(pendingMove)===direction(move) &&
now-pendingMoveTime<DOUBLE_MOVE_WINDOW
){
clearTimeout(pendingTimer);
const merged=makeDoubleMove(move);
pendingMove=null;
commitMove(merged,now);
return;
}

if(pendingMove){
clearTimeout(pendingTimer);
commitMove(pendingMove,pendingMoveTime);
}

pendingMove=move;
pendingMoveTime=now;

pendingTimer=setTimeout(()=>{
if(pendingMove){
commitMove(pendingMove,pendingMoveTime);
pendingMove=null;
}
},DOUBLE_MOVE_WINDOW);
}

function runStartSolve(now){
  startSolve(now,{
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

  isSolving=true;
  startTime=now;
  lastMoveTime=now;
  totalMoves=0;
  maxTPS=0;
  longestPause=0;
  currentMoves=[];
  moveTimes=[];
  tpsHistory=[];
  seq=[];

  clearInterval(uiTimer);
  uiTimer=setInterval(updateUI,100);
}

function commitMove(move,now){
//  mDebug.innerText("commitMove: " + move);
  if(trainerLocked){
  return;
}
  
if (!isSolving) {
  saveStartFacelets();
  runStartSolve(now);
} else {
const pause=(now-lastMoveTime)/1000;
if(totalMoves>0&&pause>longestPause){
longestPause=pause;
pauseVal.innerText=pause.toFixed(2)+"s";
}
}

lastMoveTime=now;
totalMoves++;
movesVal.innerText=totalMoves;

seq.push(move);

//mDebugMoves.push(move);
//if(mDebugMoves.length > 8) mDebugMoves.shift();
//console.log("M DEBUG:", mDebugMoves.join(" "));
currentMoves.push({
  move:move,
  time:Number(((now-startTime)/1000).toFixed(3))
});
if(seq.length>24)seq.shift();
notation.innerText="Notace:\n"+seq.join(" ");

if (!trainerLocked) {
  
  const trainerResult = checkMove(move, selectedAlg);
  
  if (trainerResult === "wrong") {
  
  trainerLocked = true;
  
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
    
    finishSolve(performance.now(), false);
    
    setTimeout(() => {
      prepareNextTrainerRun();
      trainerLocked = false;
    }, 800);
    
    return;
  }
  
}

moveTimes.push(now);
clearTimeout(stopTimer);
stopTimer=setTimeout(()=>finishSolve(lastMoveTime,false),3000);
}

function updateUI(){
const now=performance.now();
moveTimes=moveTimes.filter(t=>now-t<TPS_WINDOW);
const currentTPS=moveTimes.length/(TPS_WINDOW/1000);

tpsDiv.innerText=currentTPS.toFixed(1);

if(isSolving){
const elapsed=(now-startTime)/1000;
timeVal.innerText=elapsed.toFixed(2)+"s";

if(elapsed>0){
const avg=totalMoves/elapsed;
avgVal.innerText=avg.toFixed(1);
if(totalMoves>8&&currentTPS<avg*.65&&now-lastBeep>1200){
beep(220,.12);
lastBeep=now;
}
}

if(currentTPS>maxTPS){
maxTPS=currentTPS;
maxVal.innerText=maxTPS.toFixed(1);
}

tpsHistory.push(currentTPS);
if(tpsHistory.length>100)tpsHistory.shift();
drawGraph(ctx, canvas, tpsHistory);
}
}

function manualStop(){
const stopTime=performance.now();

if(pendingMove){
clearTimeout(pendingTimer);
commitMove(pendingMove,pendingMoveTime);
pendingMove=null;
}

finishSolve(stopTime,true);
}

document.addEventListener("pointerdown", e=>{
  if(activeScreen!=="timer")return;

  if(e.target.closest("button"))return;
  if(e.target.closest("#history"))return;
  if(e.target.closest("#history-list"))return;
  if(e.target.closest(".hist-row"))return;
  if(e.target.closest("#bottom-nav"))return;
  if(e.target.closest("#modal"))return;
  if(e.target.closest("#solve-detail"))return;
  if(e.target.closest("#export-modal"))return;
  if(e.target.closest("#import-modal"))return;
  if(e.target.closest("#level-modal"))return;
  if(e.target.closest("#achievement-modal"))return;
  if(e.target.closest("#record-modal"))return;

  if(cubeMode==="normal"){
    if(!isSolving){
      runStartSolve(performance.now());
    }else{
      manualStop();
    }
    return;
  }

  if(cubeMode==="smart" && isSolving){
    manualStop();
  }
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
  
  if (cubeMode === "smart" && isSolving) {
    manualStop();
  }
});

function getNormalMoveCount(){
  const algText = selectedAlg.innerText || "";
  const parts = algText.split(":");
  const alg = parts[1] ? parts[1].trim() : "";

  if(!alg)return 0;

  return alg
    .split(/\s+/)
    .filter(m=>m.length>0)
    .length;
}


function giveXP(amount) {
  //alert("giveXP běží: +" + amount);
  
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
    resetTimerUI();
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
  
  stateMsg.innerText = manual ?
    "ZASTAVENO" :
    "HOTOVO";
  
  stateMsg.style.color = "yellow";
  
  const oldBest = savedSolves.length ?
    Math.min(...savedSolves.map(s => Number(s.time) || 999)) :
    Infinity;
  
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

function failSolve(){
  //alert("failSolve");
  console.log("failSolve");


  if(!isSolving)return;

  isSolving=false;

  clearInterval(uiTimer);
  clearTimeout(stopTimer);

  moveTimes=[];

  stateMsg.innerText="INCORRECT";
  stateMsg.style.color="red";
//console.log("beep");
  //initAudio();
//beep(120,.6);
//setTimeout(()=>beep(80,.6),140);
}

function saveSolve(time,moves,avg){
  
console.log("saveSolve start");
const solve={
  id:Date.now(),
  algorithm:currentAlgorithmName,
  time:Number(time.toFixed(2)),
  htm:moves,
  tps:Number(avg.toFixed(1)),
  peakTPS:Number(maxTPS.toFixed(1)),
  longestPause:Number(longestPause.toFixed(2)),
  notation: Array.isArray(currentMoves)
  ? currentMoves.map(m=>m.move)
  : [],

moves: Array.isArray(currentMoves)
  ? [...currentMoves]
  : [],
  date:new Date().toLocaleString("cs-CZ")
};
savedSolves.unshift(solve);
savedSolves=savedSolves.slice(0,200);
renderHistory(historyList, savedSolves, showSolveDetail);
updateStats(
  savedSolves,
  statCount,
  statBest,
  statAo5,
  statAo12,
  calcAverage
);

saveSolves(savedSolves);

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

updateAchievementList(achievementList, playerProfile);
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}

function clearHistory() {
  const ok = confirm("Opravdu vymazat všechny uložené časy?");
  if (!ok) return;
  
  savedSolves = [];
  saveSolves(savedSolves);
  
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
clearHistoryBtn.onclick=clearHistory;
settingsClearBtn.onclick=clearHistory;
settingsResetProfileBtn.onclick=resetProfile;

function showSolveDetail(solve){
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

  solveDetail.style.display="block";

  setTimeout(()=>{
    drawDetailGraph(
      document.getElementById("detail-graph"),
      solve
    );
  }, 0);
}

closeDetailBtn.onclick=()=>{
  solveDetail.style.display="none";
};

solveDetail.onclick=e=>{
  if(e.target===solveDetail){
    solveDetail.style.display="none";
  }
};

renderHistory(historyList, savedSolves, showSolveDetail);
updateStats();
updateStatistics();
updateAlgorithmStats(); 
updateCoach(
  savedSolves,
  getAlgorithmStats,
  coachAlg,
  coachDetail
);
updateAchievementList(achievementList, playerProfile);
