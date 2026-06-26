export function renderHistory(historyList, savedSolves, onSelectSolve){
  if(savedSolves.length === 0){
    historyList.innerText = "-";
    return;
  }

  const bestTime = Math.min(...savedSolves.map(s => Number(s.time || 0)));

  historyList.innerHTML = savedSolves.map((s,i)=>{
    const time = Number(s.time || 0);
    const htm = s.htm ?? s.moves ?? 0;
    const tps = s.tps ?? s.avg ?? 0;
    const isPB = time === bestTime;

    return `
      <div class="hist-row" data-index="${i}">
        <div class="hist-time">${i+1}. ${isPB ? "🥇 " : ""}${time.toFixed(2)}s</div>
        <div class="hist-small">${htm}t</div>
        <div class="hist-small">${Number(tps).toFixed(1)}TPS</div>
      </div>
    `;
  }).join("");

  historyList.querySelectorAll(".hist-row").forEach(row=>{
    row.onclick = ()=>{
      const index = Number(row.dataset.index);
      onSelectSolve(savedSolves[index]);
    };
  });
}