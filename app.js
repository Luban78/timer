// app.js
// Hlavní logika aplikace: připojení kostky, měření solve, historie a UI.
//v4
import { drawDetailGraph } from "./detailGraph.js";
import { openPLLMenu } from "./algMenu.js";
import { resetStatsUI, clearCanvas } from "./ui.js";
import { initAudio, beep } from "./sound.js";
import { drawGraph, resizeGraphCanvas } from "./graph.js";
import { renderHistory } from "./history.js";
import { loadSolves, saveSolves } from "./storage.js";
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
      onFacelets: () => {
        status.innerText="Připojeno + stav načten";
      }
    });

    isConnected=true;
    btn.style.display="none";
    modeButtons.style.display="grid";
    status.innerText="Připojeno, začni otočením kostky";
    stateMsg.innerText="PŘIPRAVEN";
    beep(523,.08);

  }catch(e){
    status.innerText="Chyba: "+e.message;
  }
};

pllBtn.onclick=e=>{
e.stopPropagation();
openPLL();
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
    }
  });
};

document.body.addEventListener("click",e=>{
if(e.target.tagName==="BUTTON") return;
if(modal.style.display==="block") return;
if(isSolving) manualStop();
});

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

function startSolve(now){
currentMoves=[];
isSolving=true;
startTime=now;
lastMoveTime=now;
totalMoves=0;maxTPS=0;longestPause=0;
moveTimes=[];tpsHistory=[];seq=[];

stateMsg.innerText="SKLÁDÁŠ... KLEPNI PRO STOP";
stateMsg.style.color="#00e676";

timeVal.innerText="0.00s";
movesVal.innerText="0";
avgVal.innerText="0.0";
maxVal.innerText="0.0";
pauseVal.innerText="0.00s";
notation.innerText="Notace:";

clearInterval(uiTimer);
uiTimer=setInterval(updateUI,100);
}

function commitMove(move,now){
if(!isSolving){
startSolve(now);
}else{
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
currentMoves.push({
  move:move,
  time:Number(((now-startTime)/1000).toFixed(3))
});
if(seq.length>24)seq.shift();
notation.innerText="Notace:\n"+seq.join(" ");

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

function finishSolve(stopTime,manual){
if(!isSolving)return;

isSolving=false;
clearInterval(uiTimer);
clearTimeout(stopTimer);

const finalTime=(stopTime-startTime)/1000;
const finalAvg=finalTime>0?totalMoves/finalTime:0;

timeVal.innerText=finalTime.toFixed(2)+"s";
avgVal.innerText=finalAvg.toFixed(1);

moveTimes=[];
tpsDiv.innerText="0.0";

stateMsg.innerText=manual
?"ZASTAVENO - OTOČ PRO DALŠÍ"
:"HOTOVO - OTOČ PRO DALŠÍ";

stateMsg.style.color="yellow";

saveSolve(finalTime,totalMoves,finalAvg);

beep(880,.2);
}

function updateStats(){
  const times=savedSolves.map(s=>Number(s.time)).filter(t=>t>0);

  statCount.innerText=times.length;

  if(times.length===0){
    statBest.innerText="-";
    statAo5.innerText="-";
    statAo12.innerText="-";
    return;
  }

  statBest.innerText=Math.min(...times).toFixed(2)+"s";

  statAo5.innerText=calcAverage(times,5);
  statAo12.innerText=calcAverage(times,12);
}

function calcAverage(times,count){
  if(times.length<count)return "-";

  const last=times.slice(0,count);

  if(last.length>=3){
    const sorted=[...last].sort((a,b)=>a-b);
    sorted.shift();
    sorted.pop();
    return (sorted.reduce((a,b)=>a+b,0)/sorted.length).toFixed(2)+"s";
  }

  return (last.reduce((a,b)=>a+b,0)/last.length).toFixed(2)+"s";
}

function saveSolve(time,moves,avg){

const solve={
  id:Date.now(),
  algorithm:currentAlgorithmName,
  time:Number(time.toFixed(2)),
  htm:moves,
  tps:Number(avg.toFixed(1)),
  peakTPS:Number(maxTPS.toFixed(1)),
  longestPause:Number(longestPause.toFixed(2)),
  notation:currentMoves.map(m=>m.move),
  moves:[...currentMoves],
  date:new Date().toLocaleString("cs-CZ")
};

savedSolves.unshift(solve);

savedSolves=savedSolves.slice(0,200);


saveSolves(savedSolves);
renderHistory(historyList, savedSolves, showSolveDetail);
updateStats();

}


if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}
clearHistoryBtn.onclick=()=>{
  const ok=confirm("Opravdu vymazat všechny uložené časy?");
  if(!ok)return;

  savedSolves=[];
  saveSolves(savedSolves);
  renderHistory(historyList, savedSolves, showSolveDetail);
  updateStats();
};

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