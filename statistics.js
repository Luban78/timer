export function updateStats(
  savedSolves,
  statCount,
  statBest,
  statAo3,
  statAo5,
  statAo12,
  statAo100,
  calcAverage
) {
  const times = savedSolves
    .map((solve) => Number(solve.time))
    .filter((time) => Number.isFinite(time) && time > 0);

  if (statCount) statCount.innerText = String(times.length);

  if (times.length === 0) {
    if (statBest) statBest.innerText = "-";
    if (statAo3) statAo3.innerText = "-";
    if (statAo5) statAo5.innerText = "-";
    if (statAo12) statAo12.innerText = "-";
    if (statAo100) statAo100.innerText = "-";
    return;
  }

  if (statBest) {
    statBest.innerText = Math.min(...times).toFixed(2) + "s";
  }

  if (statAo3) statAo3.innerText = calcAverage(times, 3);
  if (statAo5) statAo5.innerText = calcAverage(times, 5);
  if (statAo12) statAo12.innerText = calcAverage(times, 12);
  if (statAo100) statAo100.innerText = calcAverage(times, 100);
}

export function calcAverage(times, count) {
  if (times.length < count) return "-";

  const latest = times.slice(0, count);

  if (latest.length >= 3) {
    const sorted = [...latest].sort((a, b) => a - b);
    sorted.shift();
    sorted.pop();

    return (
      sorted.reduce((sum, time) => sum + time, 0) /
      sorted.length
    ).toFixed(2) + "s";
  }

  return (
    latest.reduce((sum, time) => sum + time, 0) /
    latest.length
  ).toFixed(2) + "s";
}
