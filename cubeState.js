import { Alg } from "https://cdn.cubing.net/v0/js/cubing/alg";

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

export function testCubingAlg(){
  const alg = new Alg("R U R'");
  return alg.toString();
}

function rotateFaceCW(arr, start){
  const old = [...arr];

  arr[start+0] = old[start+6];
  arr[start+1] = old[start+3];
  arr[start+2] = old[start+0];
  arr[start+3] = old[start+7];
  arr[start+5] = old[start+1];
  arr[start+6] = old[start+8];
  arr[start+7] = old[start+5];
  arr[start+8] = old[start+2];
}

export function applyR(facelets){
  const arr = facelets.split("");
  const old = [...arr];

  rotateFaceCW(arr, 9);

  arr[20] = old[2];
  arr[23] = old[5];
  arr[26] = old[8];

  arr[29] = old[20];
  arr[32] = old[23];
  arr[35] = old[26];

  arr[51] = old[29];
  arr[48] = old[32];
  arr[45] = old[35];

  arr[2] = old[51];
  arr[5] = old[48];
  arr[8] = old[45];

  return arr.join("");
}
let currentCubeState = null;
let baseCubeState = null;

export function setCurrentCubeState(state){
  currentCubeState = state || null;
}

export function getCurrentCubeState(){
  return currentCubeState;
}

export function saveBaseCubeState(){
  baseCubeState = currentCubeState;
}

export function getBaseCubeState(){
  return baseCubeState;
}
