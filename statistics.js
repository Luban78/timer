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

export function calcAverage(times,count){
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

