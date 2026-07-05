let trainerRotation = 0;
let trainerTop = "white"; // "white" nebo "yellow"
const FRONT_ROTATION = {
  blue: 0,
  orange: 1,
  green: 2,
  red: 3
};
const ROT = [
  { U: "U", R: "R", F: "F", D: "D", L: "L", B: "B" },
  { U: "U", R: "B", F: "R", D: "D", L: "F", B: "L" },
  { U: "U", R: "L", F: "B", D: "D", L: "R", B: "F" },
  { U: "U", R: "F", F: "L", D: "D", L: "B", B: "R" }
];

// Když držíš žlutou nahoře místo bílé:
// interní U/D a F/B se pro trainer prohodí.
const TOP = {
  white: { U: "U", R: "R", F: "F", D: "D", L: "L", B: "B" },
  yellow: { U: "D", R: "R", F: "B", D: "U", L: "L", B: "F" }
};

function normalize(move) {
  return String(move || "")
    .trim()
    .replace(/\s+/g, "")
    .replace("’", "'");
}

function mapMove(move, map) {
  move = normalize(move);
  if (!move) return "";
  
  const face = move.charAt(0);
  const suffix = move.slice(1);
  
  return (map[face] || face) + suffix;
}

export function setTrainerRotation(rot) {
  trainerRotation = ((rot % 4) + 4) % 4;
}

export function getTrainerRotation() {
  return trainerRotation;
}


export function setTrainerFrontColor(color) {
  if (FRONT_ROTATION[color] === undefined) return;
  setTrainerRotation(FRONT_ROTATION[color]);
}
export function setTrainerTop(top) {
  trainerTop = top === "yellow" ? "yellow" : "white";
}

export function rotateMove(move) {
  move = normalize(move);
  
  // 1) nejdřív opravíme top: bílá/žlutá
  move = mapMove(move, TOP[trainerTop]);
  
  // 2) potom otočení kolem horní vrstvy
  move = mapMove(move, ROT[trainerRotation]);
  
  return move;
}

export function isTrainerMove(move) {
  return String(move || "").startsWith("=");
}

export function stripTrainerMove(move) {
  return String(move || "").replace(/^=/, "");
}
const FACELET_CENTER = {
  U: 4,
  R: 13,
  F: 22,
  D: 31,
  L: 40,
  B: 49
};

const COLOR_NAME = {
  U: "white",
  D: "yellow",
  F: "green",
  B: "blue",
  R: "red",
  L: "orange"
};

export function detectFrontColorFromFacelets(facelets) {
  if (!facelets || facelets.length < 54) return null;

  const frontLetter = facelets[FACELET_CENTER.F];
  return COLOR_NAME[frontLetter] || null;
}