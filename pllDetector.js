// pllDetector.js
// Detekce natočení PLL případu podle facelets.

import { PLL_PATTERNS } from "./pllPatterns.js";

function normalizeFacelets(facelets) {
  if (!facelets) return "";
  
  if (typeof facelets === "string") {
    return facelets.trim();
  }
  
  if (Array.isArray(facelets)) {
    return facelets.join("");
  }
  
  return "";
}

function isValidFacelets(facelets) {
  return typeof facelets === "string" && facelets.length >= 54;
}

function splitFacelets(facelets) {
  return {
    U: facelets.slice(0, 9),
    R: facelets.slice(9, 18),
    F: facelets.slice(18, 27),
    D: facelets.slice(27, 36),
    L: facelets.slice(36, 45),
    B: facelets.slice(45, 54)
  };
}

function patternMatches(f, pattern) {
  if (pattern.U && f.U !== pattern.U) return false;
  if (pattern.R && f.R !== pattern.R) return false;
  if (pattern.F && f.F !== pattern.F) return false;
  if (pattern.D && f.D !== pattern.D) return false;
  if (pattern.L && f.L !== pattern.L) return false;
  if (pattern.B && f.B !== pattern.B) return false;
  
  return true;
}

export function detectPLLRotationFromFacelets(facelets, algorithmName) {
  facelets = normalizeFacelets(facelets);
  
  if (!isValidFacelets(facelets)) {
    return null;
  }
  
  algorithmName = String(algorithmName || "").trim();
  
  const f = splitFacelets(facelets);
  
  let detectedRotation = null;
  let detectedPattern = "none";
  
 let checkedPatterns = [];

for (const pattern of PLL_PATTERNS) {
  if (pattern.algorithmName !== algorithmName) {
    continue;
  }
  
  checkedPatterns.push(pattern.name);
  
  if (patternMatches(f, pattern)) {
  if (pattern.rotation === "manual") {
    detectedRotation = null;
    detectedPattern = pattern.name;
  } else if (pattern.rotation === "keep") {
    detectedRotation = null;
    detectedPattern = pattern.name + " keep";
  } else {
    detectedRotation = pattern.rotation;
    detectedPattern = pattern.name;
  }
  
  break;
}
}





  window.__pllDebug = {
  U: f.U,
  R: f.R,
  F: f.F,
  D: f.D,
  L: f.L,
  B: f.B,
  detectedRotation,
  detectedPattern,
  manualRotation: detectedPattern === "Z ambiguous front",
  checkedPatterns,
  full: facelets
};
  return detectedRotation;
}