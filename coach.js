export function updateCoach(
  savedSolves,
  getAlgorithmStats,
  coachAlg,
  coachDetail
){
  const algStats=getAlgorithmStats(savedSolves);

  if(algStats.length===0){
    coachAlg.textContent="-";
    coachDetail.textContent="Zatím nemám žádný uložený algoritmus.";
    return;
  }

  const ready=algStats.filter(a=>a.count>=5);

  if(ready.length===0){
    const closest=[...algStats].sort((a,b)=>b.count-a.count)[0];
    const missing=5-closest.count;

    coachAlg.textContent=closest.name;
    coachDetail.textContent=
      `Přidej ještě ${missing} solve, pak začnu doporučovat trénink.`;
    return;
  }
  const weakest=ready.sort((a,b)=>b.avg-a.avg)[0];

  coachAlg.textContent=weakest.name;
  coachDetail.textContent=
    `Dnes trénuj ${weakest.name}. Průměr ${weakest.avg.toFixed(2)} s • ${weakest.count} solve`;
}