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

export function isBackToStart(){
  return compareFacelets(currentFacelets, startFacelets);
}

export function compareFacelets(faceletsA, faceletsB){
  if(!faceletsA || !faceletsB){
    return false;
  }

  return faceletsA === faceletsB;
}