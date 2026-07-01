let currentFacelets = "";

export function setCurrentFacelets(facelets){
  currentFacelets = facelets || "";
}

export function getCurrentFacelets(){
  return currentFacelets;
}