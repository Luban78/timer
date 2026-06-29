export function updateStats(
  savedSolves,
  statCount,
  statBest,
  statAo5,
  statAo12,
  calcAverage
) {
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