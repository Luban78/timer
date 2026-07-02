const STORAGE_KEY = "mg3i_move_maps";

let moveMaps = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(moveMaps));
}

function normalizeDiffs(diffs) {
  return diffs
    .map(d => `${d.index}:${d.from}>${d.to}`)
    .sort()
    .join("|");
}

export function saveMoveMap(move, diffs) {
  moveMaps[move] = diffs;
  saveToStorage();
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
  moveMaps = {};
  saveToStorage();
}