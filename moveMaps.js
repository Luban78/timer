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


function parseStateSignature(signature) {
  const result = {
    CP: new Map(),
    EP: new Map(),
    CO: new Map(),
    EO: new Map()
  };

  if (!signature) return result;

  for (const part of String(signature).split('|')) {
    if (!part) continue;

    const [key, rest, deltaText] = part.split(':');
    if (!key || !rest) continue;

    const [fromText, toText] = rest.split('>');
    const from = Number(fromText);
    const to = Number(toText);
    if (!Number.isFinite(from) || !Number.isFinite(to)) continue;

    if (key === 'CP' || key === 'EP') {
      result[key].set(from, to);
    } else if (key === 'CO' || key === 'EO') {
      const delta = Number(deltaText || 0);
      result[key].set(from + '>' + to, Number.isFinite(delta) ? delta : 0);
    }
  }

  return result;
}

function applyQuarterSignature(state, signature) {
  if (!state || !signature) return null;

  const parsed = parseStateSignature(signature);

  function applyPieces(permKey, oriKey, mod) {
    const oldPerm = state[permKey] || [];
    const oldOri = state[oriKey] || [];
    const newPerm = oldPerm.slice();
    const newOri = oldOri.slice();
    const moveMap = parsed[permKey];
    const deltaMap = parsed[oriKey];

    for (let from = 0; from < oldPerm.length; from++) {
      const to = moveMap.has(from) ? moveMap.get(from) : from;
      const delta = deltaMap.get(from + '>' + to) || 0;
      newPerm[to] = oldPerm[from];
      newOri[to] = ((oldOri[from] || 0) + delta + mod) % mod;
    }

    return [newPerm, newOri];
  }

  const [CP, CO] = applyPieces('CP', 'CO', 3);
  const [EP, EO] = applyPieces('EP', 'EO', 2);

  return { CP, CO, EP, EO };
}

function invertMoveName(move) {
  move = String(move || '').trim();
  if (!move) return '';
  if (move.includes('2')) return move.replace("'", '');
  if (move.includes("'")) return move.replace("'", '');
  return move + "'";
}

function getSignatureForMove(move) {
  return moveMaps['STATE_' + move] || '';
}

export function applyStateMoveMap(state, move) {
  move = String(move || '').trim().replace(/\s+/g, '').replace('’', "'");
  if (!state || !move) return null;

  if (move.includes('2')) {
    const direct = getSignatureForMove(move);
    if (direct) return applyQuarterSignature(state, direct);

    const base = move.replace('2', '').replace("'", '');
    const onceSig = getSignatureForMove(base) || getSignatureForMove(base + "'");
    if (!onceSig) return null;

    const once = applyQuarterSignature(state, onceSig);
    return once ? applyQuarterSignature(once, onceSig) : null;
  }

  const sig = getSignatureForMove(move);
  if (sig) return applyQuarterSignature(state, sig);

  // Když uživatel naučil jen opačný směr, umíme ho použít 3×.
  const inv = invertMoveName(move);
  const invSig = getSignatureForMove(inv);
  if (!invSig) return null;

  let out = state;
  for (let i = 0; i < 3; i++) {
    out = applyQuarterSignature(out, invSig);
    if (!out) return null;
  }
  return out;
}


/* Staré facelet funkce jen kvůli kompatibilitě s app.js */
export function saveMoveMap() {}

export function recognizeMove() {
  return null;
}
export function getMoveMapCount() {
  return Object.keys(moveMaps).length;
}
