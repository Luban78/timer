// pllDetector.js
// Detekce natočení PLL případu podle facelets.

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

function matchesPattern(f, pattern) {
  return (
    f.U === pattern.U &&
    f.R === pattern.R &&
    f.F === pattern.F &&
    f.D === pattern.D &&
    f.L === pattern.L &&
    f.B === pattern.B
  );
}

export function detectPLLRotationFromFacelets(facelets, algorithmName) {
  facelets = normalizeFacelets(facelets);
  
  if (!isValidFacelets(facelets)) {
    return null;
  }
  
  algorithmName = String(algorithmName || "").trim();
  
  // Zatím řešíme jen T-perm.
  if (
  algorithmName !== "T-perm" &&
  algorithmName !== "Ub-perm" &&
  algorithmName !== "Ua-perm"
) {
  return null;
}
  
  const f = splitFacelets(facelets);

  

  let detectedRotation = null;
  let detectedPattern = "none";
  
  // T-perm, zelená vpředu → rotation 2
if (
  f.U === "UUDUUURUU" &&
  f.L === "LLDDLLFRB" &&
  f.B === "BBBBBBFBL"
) {
  detectedRotation = 2;
  detectedPattern = "T green front";
}

// T-perm, modrá vpředu → rotation 0
if (
  f.U === "UUDUUURUU" &&
  f.L === "LLDDLLRRL" &&
  f.B === "BBBBBBRBB"
) {
  detectedRotation = 0;
  detectedPattern = "T blue front";
}
// T-perm, modrá vpředu → rotation 0
// další reálný vzorek z MG3i facelets
if (
  f.U === "RUDUUURUU" &&
  f.L === "DLDFLLLRL" &&
  f.B === "BBFBBDLDF"
) {
  detectedRotation = 0;
  detectedPattern = "T blue front 2";
}
// T-perm, oranžová vpředu → rotation 1
// reálný vzorek z MG3i facelets
if (
  f.U === "RUDUUURUU" &&
  f.L === "DLDFLLULL" &&
  f.B === "BBFBBDLDR"
) {
  detectedRotation = 1;
  detectedPattern = "T orange front";
}
// T-perm, červená vpředu → rotation 3
// reálný vzorek z MG3i facelets
if (
  f.U === "RUDUUURUU" &&
  f.L === "DLDFLLLLU" &&
  f.B === "BBFBBDUDF"
) {
  detectedRotation = 3;
  detectedPattern = "T red front";
}


// Ub-perm, modrá vpředu → rotation 0
// reálný vzorek z MG3i facelets
if (
  algorithmName === "Ub-perm" &&
  f.U === "RUDUUURUU" &&
  f.R === "RRLRRRLDR" &&
  f.F === "BFFFFFFDU" &&
  f.D === "DLBBDDUBB" &&
  f.L === "DLDFLLLRL" &&
  f.B === "BBFBBDULF"
) {
  detectedRotation = 0;
  detectedPattern = "Ub blue front";
}


// Ub-perm, zelená vpředu → rotation 2
// reálný vzorek z MG3i facelets
if (
  algorithmName === "Ub-perm" &&
  f.U === "RUDUUURUU" &&
  f.R === "RRLRRRLLR" &&
  f.F === "BFFFFFFRU" &&
  f.D === "DDBLDBUBB" &&
  f.L === "DLDFLLLDL" &&
  f.B === "BBFBBDUDF"
) {
  detectedRotation = 2;
  detectedPattern = "Ub green front";
}
// Ub-perm, oranžová vpředu → rotation 1
// reálný vzorek z MG3i facelets
if (
  algorithmName === "Ub-perm" &&
  f.U === "RUDUUURUU" &&
  f.R === "RRLRRRLRR" &&
  f.F === "BFFFFFFDU" &&
  f.D === "DBBLDDUBB" &&
  f.L === "DLDFLLLDL" &&
  f.B === "BBFBBDULF"
) {
  detectedRotation = 1;
  detectedPattern = "Ub orange front";
}



// Ua-perm, zelená vpředu → rotation 2
// reálný vzorek z MG3i facelets
if (
  algorithmName === "Ua-perm" &&
  f.U === "RUDUUURUU" &&
  f.R === "RRLRRRLDR" &&
  f.F === "BFFFFFFLU" &&
  f.D === "DBBDDLUBB" &&
  f.L === "DLDFLLLRL" &&
  f.B === "BBFBBDUDF"
) {
  detectedRotation = 2;
  detectedPattern = "Ua green front";
}
// Ua-perm, oranžová vpředu → rotation 1
// reálný vzorek z MG3i facelets
if (
  algorithmName === "Ua-perm" &&
  f.U === "RUDUUURUU" &&
  f.R === "RRLRRRLRR" &&
  f.F === "BFFFFFFLU" &&
  f.D === "DBBBDDULB" &&
  f.L === "DLDFLLLDL" &&
  f.B === "BBFBBDUDF"
) {
  detectedRotation = 1;
  detectedPattern = "Ua orange front";
}
// Ua-perm, modrá vpředu → rotation 0
// reálný vzorek z MG3i facelets
if (
  algorithmName === "Ua-perm" &&
  f.U === "RUDUUURUU" &&
  f.R === "RRLRRRLLR" &&
  f.F === "BFFFFFFDU" &&
  f.D === "DLBBDBUDB" &&
  f.L === "DLDFLLLDL" &&
  f.B === "BBFBBDURF"
) {
  detectedRotation = 0;
  detectedPattern = "Ua blue front";
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
    full: facelets
  };
  
  return detectedRotation;
}