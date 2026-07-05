// moveMaps.js

const STORAGE_KEY = "mg3i_state_move_maps_v2";

let moveMaps = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(moveMaps));
}

export function getMoveMaps() {
  return moveMaps;
}

export function makeStateSignature(baseState, currentState) {
  const parts = [];
  
  function permSignature(key) {
    const base = baseState?.[key] || [];
    const cur = currentState?.[key] || [];
    
    for (let from = 0; from < base.length; from++) {
      const piece = base[from];
      const to = cur.indexOf(piece);
      
      if (to !== -1 && from !== to) {
        parts.push(key + ":" + from + ">" + to);
      }
    }
  }
  
  function orientSignature(key, mod) {
    const permKey = key === "CO" ? "CP" : "EP";
    
    const basePerm = baseState?.[permKey] || [];
    const curPerm = currentState?.[permKey] || [];
    
    const baseOri = baseState?.[key] || [];
    const curOri = currentState?.[key] || [];
    
    for (let from = 0; from < basePerm.length; from++) {
      const piece = basePerm[from];
      const to = curPerm.indexOf(piece);
      
      if (to === -1) continue;
      
      const delta =
        ((curOri[to] || 0) - (baseOri[from] || 0) + mod) % mod;
      
      if (delta !== 0) {
        parts.push(key + ":" + from + ">" + to + ":" + delta);
      }
    }
  }
  
  permSignature("CP");
  permSignature("EP");
  orientSignature("CO", 3);
  orientSignature("EO", 2);
  
  return parts.sort().join("|");
}

export function saveStateMoveMap(move, signature) {
  if (!signature || signature.trim() === "") {
    alert("CHYBA: signature je prázdná, mapu neukládám.");
    return;
  }
  
  moveMaps["STATE_" + move] = signature;
  saveToStorage();
}

export function recognizeStateMove(signature) {
  for (const move in moveMaps) {
    if (!move.startsWith("STATE_")) continue;
    
    if (moveMaps[move] === signature) {
      return move.replace("STATE_", "");
    }
  }
  
  return null;
}

export function clearMoveMaps() {
  moveMaps = {};
  saveToStorage();
}

export function exportMoveMapsText() {
  return JSON.stringify(moveMaps, null, 2);
}

/* Staré facelet funkce jen kvůli kompatibilitě s app.js */
export function saveMoveMap() {}

export function recognizeMove() {
  return null;
}
export function getMoveMapCount() {
  return Object.keys(moveMaps).length;
}
