const moveMaps = {};

export function saveMoveMap(move, diffs) {
  moveMaps[move] = diffs;
}

export function getMoveMaps() {
  return moveMaps;
}

export function clearMoveMaps() {
  Object.keys(moveMaps).forEach(key => delete moveMaps[key]);
}