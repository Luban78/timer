export function startSolve({
  now,
  state,
  ui,
  clearUiTimer,
  startUiTimer
}){
  state.currentMoves.length = 0;
  state.isSolving = true;
  state.startTime = now;
  state.lastMoveTime = now;
  state.totalMoves = 0;
  state.maxTPS = 0;
  state.longestPause = 0;
  state.moveTimes.length = 0;
  state.tpsHistory.length = 0;
  state.seq.length = 0;

  ui.stateMsg.innerText = "SKLÁDÁŠ... KLEPNI PRO STOP";
  ui.stateMsg.style.color = "#00e676";

  ui.timeVal.innerText = "0.00s";
  ui.movesVal.innerText = "0";
  ui.avgVal.innerText = "0.0";
  ui.maxVal.innerText = "0.0";
  ui.pauseVal.innerText = "0.00s";
  ui.notation.innerText = "Notace:";

  clearUiTimer();
  startUiTimer();
}