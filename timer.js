export function startSolve(
  now,
  state
){
  state.currentMoves.length=0;
  state.isSolving=true;
  state.startTime=now;
  state.lastMoveTime=now;
  state.totalMoves=0;
  state.maxTPS=0;
  state.longestPause=0;
  state.moveTimes.length=0;
  state.tpsHistory.length=0;
  state.seq.length=0;

  state.stateMsg.innerText="SKLÁDÁŠ... KLEPNI PRO STOP";
  state.stateMsg.style.color="#00e676";

  state.timeVal.innerText="0.00s";
  state.movesVal.innerText="0";
  state.avgVal.innerText="0.0";
  state.maxVal.innerText="0.0";
  state.pauseVal.innerText="0.00s";
  state.notation.innerText="Notace:";

  clearInterval(state.uiTimer);
  state.uiTimer=setInterval(state.updateUI,100);
}
