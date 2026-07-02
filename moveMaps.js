const moveMaps = {};

function normalizeDiffs(diffs) {
  return diffs
    .map(d => `${d.index}:${d.from}>${d.to}`)
    .sort()
    .join("|");
}

export function saveMoveMap(move, diffs) {
  moveMaps[move] = diffs;
}

export function getMoveMaps() {
  return moveMaps;
}

export function recognizeMove(diffs) {
  const current = normalizeDiffs(diffs);
  
  for (const move in moveMaps) {
    if (normalizeDiffs(moveMaps[move]) === current) {
      return move;
    }
  }
  
  return null;
}

export function clearMoveMaps() {
  Object.keys(moveMaps).forEach(key => delete moveMaps[key]);
}