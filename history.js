export function renderHistory(historyList, savedSolves){
  if(savedSolves.length === 0){
    historyList.innerText = "-";
    return;
  }

  historyList.innerHTML = savedSolves.map((s,i)=>{
    const time = Number(s.time || 0);
    const htm = s.htm ?? s.moves ?? 0;
    const tps = s.tps ?? s.avg ?? 0;

    return `
      <div class="hist-row">
        <div class="hist-time">${i+1}. ${time.toFixed(2)}s</div>
        <div class="hist-small">${htm}t</div>
        <div class="hist-small">${Number(tps).toFixed(1)}TPS</div>
      </div>
    `;
  }).join("");
}