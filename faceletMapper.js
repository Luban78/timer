let baseFacelets = "";

export function saveBaseFacelets(facelets) {
  baseFacelets = facelets || "";
}

export function getBaseFacelets() {
  return baseFacelets;
}

export function diffFacelets(currentFacelets) {
  if (!baseFacelets || !currentFacelets) return [];
  
  const diffs = [];
  
  for (let i = 0; i < Math.min(baseFacelets.length, currentFacelets.length); i++) {
    if (baseFacelets[i] !== currentFacelets[i]) {
      diffs.push({
        index: i,
        from: baseFacelets[i],
        to: currentFacelets[i]
      });
    }
  }
  
  return diffs;
}

export function clearBaseFacelets(){
  baseFacelets = "";
}