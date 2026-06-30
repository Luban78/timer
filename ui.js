export function setText(el, value){
  el.innerText = value;
}

export function clearCanvas(ctx, canvas){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function resetStatsUI({
  notation,
  stateMsg,
  tpsDiv,
  timeVal,
  movesVal,
  avgVal,
  maxVal,
  pauseVal,
  isConnected
}){
  notation.innerText = "Notace:";
  stateMsg.innerText = isConnected ? "PŘIPRAVEN" : "Připoj kostku...";
  stateMsg.style.color = "yellow";
  tpsDiv.innerText = "0.0";
  timeVal.innerText = "0.00s";
  movesVal.innerText = "0";
  avgVal.innerText = "0.0";
  maxVal.innerText = "0.0";
  pauseVal.innerText = "0.00s";
}
export function showRecord(time, recordTime, recordModal){
  recordTime.textContent=time.toFixed(2)+" s";
  recordModal.style.display="block";

  setTimeout(()=>{
    recordModal.style.display="none";
  },2200);
}