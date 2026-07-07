// sliceAdapter.js
// Úpravy slice tahů pro trenér podle očekávaného tahu, aktuální PLL rotace a algoritmu.

export function adaptSliceMoveForTrainer(sliceMoveRaw, expectedMove, trainerRotation, algorithmName) {
  let move = String(sliceMoveRaw || "").trim();
  const expected = String(expectedMove || "").trim();
  const alg = String(algorithmName || "").trim();
  
  let debug = move;
  
  if (!move || !expected) {
    return {
      move,
      debug
    };
  }
  
  // Když trenér čeká M a kostka po rotaci pošle S,
  // převedeme S / S' / S2 na M / M' / M2.
  if (
    expected.charAt(0) === "M" &&
    move.charAt(0) === "S"
  ) {
    move = "M" + move.slice(1);
    debug += " | FIX S→M => " + move;
  }
  
  // Směr M/M' flipujeme jen tam, kde jsme to reálně ověřili.
  // M2 se tímhle nikdy nemění.
  if (
  expected.charAt(0) === "M" &&
  move.charAt(0) === "M" &&
  (
    Number(trainerRotation) === 0 ||
    Number(trainerRotation) === 3
  )
) {
  if (move === "M") {
    move = "M'";
    debug += " | FIX " + alg + " ROT" + trainerRotation + " => " + move;
  } else if (move === "M'") {
    move = "M";
    debug += " | FIX " + alg + " ROT" + trainerRotation + " => " + move;
  }
}
// DOČASNÝ TRÉNINKOVÝ REŽIM PRO Z-perm
// Z-perm má některé fronty podle facelets nerozlišitelné.
// Aby šel trénovat bez řešení barvy vpředu,
// u M / M' dorovnáme tah podle toho, co trenér čeká.
// POZOR: není to čistá kontrola fyzicky správného směru kostky.
if (
  alg === "Z-perm" &&
  expected.charAt(0) === "M" &&
  move.charAt(0) === "M" &&
  expected !== "M2" &&
  move !== "M2" &&
  move !== expected
) {
  move = expected;
  debug += " | TRAIN Z => " + move;
}
  return {
    move,
    debug
  };
}