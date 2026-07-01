let currentFacelets = "";
let startFacelets = "";

export function setCurrentFacelets(facelets) {
  currentFacelets = facelets || "";
}

export function getCurrentFacelets() {
  return currentFacelets;
}

export function saveStartFacelets() {
  startFacelets = currentFacelets;
}

export function getStartFacelets() {
  return startFacelets;
}

export function isBackToStart() {
  return currentFacelets !== "" && currentFacelets === startFacelets;
}