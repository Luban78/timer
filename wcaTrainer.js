/* =========================================================
   CUBE TRAINER – WCA 3x3
   Generátor scramblu, tolerantní kontrola zamíchání a solved check.

   Kontrola scramblu:
   - tahy "2" nemají časový limit; lze je udělat jako R2 nebo R + R,
   - při chybě se očekávaný tah zvýrazní červeně,
   - uživatel chybný tah vrátí opačným tahem,
   - po opravě se pokračuje přesně tam, kde skončil.
   ========================================================= */

const FACES = ["U", "D", "L", "R", "F", "B"];
const SUFFIXES = ["", "'", "2"];
const AXIS = {
  U: "y", D: "y",
  L: "x", R: "x",
  F: "z", B: "z"
};

let scrambleMoves = [];
let scrambleIndex = 0;
let partial = null;
let errorStack = [];

export function generateWcaScramble(length = 20) {
  const moves = [];
  let previousFace = "";
  let previousAxis = "";

  while (moves.length < length) {
    const face = FACES[Math.floor(Math.random() * FACES.length)];
    const axis = AXIS[face];

    if (face === previousFace) continue;

    /* Neumožní tři tahy po sobě na stejné ose. */
    if (
      moves.length >= 2 &&
      axis === previousAxis &&
      AXIS[moves[moves.length - 2][0]] === axis
    ) {
      continue;
    }

    const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
    moves.push(face + suffix);
    previousFace = face;
    previousAxis = axis;
  }

  return moves.join(" ");
}

function parseMove(move) {
  const value = String(move || "").trim();
  const match = value.match(/^([UDLRFB])(2|'|2')?$/);
  if (!match) return null;

  return {
    text: value,
    face: match[1],
    power: match[2]?.startsWith("2") ? 2 : match[2] === "'" ? 3 : 1
  };
}

function inverse(move) {
  if (!move) return null;
  return {
    face: move.face,
    power: move.power === 2 ? 2 : 4 - move.power
  };
}

function areInverse(a, b) {
  if (!a || !b || a.face !== b.face) return false;
  return (a.power + b.power) % 4 === 0;
}

export function beginWcaScramble(scramble) {
  scrambleMoves = String(scramble || "")
    .split(/\s+/)
    .map(parseMove)
    .filter(Boolean);

  scrambleIndex = 0;
  partial = null;
  errorStack = [];

  return getWcaScrambleState("ready");
}

export function getWcaScrambleState(status = "ready") {
  return {
    status,
    index: scrambleIndex,
    total: scrambleMoves.length,
    expected: scrambleMoves[scrambleIndex]?.text || null,
    partial: partial ? { ...partial } : null,
    errorDepth: errorStack.length,
    finished: scrambleMoves.length > 0 && scrambleIndex >= scrambleMoves.length
  };
}

function pushWrongMove(move) {
  const last = errorStack[errorStack.length - 1];

  /* Dovolíme uživateli opravit chybu přesným opačným tahem. */
  if (last && areInverse(last, move)) {
    errorStack.pop();
    return errorStack.length ? "wrong" : "corrected";
  }

  errorStack.push(move);
  return "wrong";
}

export function processWcaScrambleMove(rawMove) {
  const move = parseMove(rawMove);
  if (!move || !scrambleMoves.length) return getWcaScrambleState("ignored");

  /* Dokud existuje chyba, čekáme na její vrácení v opačném pořadí. */
  if (errorStack.length) {
    const status = pushWrongMove(move);
    return getWcaScrambleState(status);
  }

  const expected = scrambleMoves[scrambleIndex];
  if (!expected) return getWcaScrambleState("finished");

  /* Rozpracovaný dvojtah, např. první D z D2. */
  if (partial) {
    if (move.face !== partial.face) {
      errorStack.push(move);
      return getWcaScrambleState("wrong");
    }

    const sum = (partial.power + move.power) % 4;

    if (sum === 2) {
      partial = null;
      scrambleIndex += 1;
      return getWcaScrambleState(
        scrambleIndex >= scrambleMoves.length ? "finished" : "correct"
      );
    }

    /* Opačný čtvrt-tah první polovinu D2 vrátí. */
    if (sum === 0) {
      partial = null;
      return getWcaScrambleState("corrected");
    }

    partial.power = sum;
    return getWcaScrambleState("partial");
  }

  if (move.face !== expected.face) {
    errorStack.push(move);
    return getWcaScrambleState("wrong");
  }

  if (expected.power === 2) {
    if (move.power === 2) {
      scrambleIndex += 1;
      return getWcaScrambleState(
        scrambleIndex >= scrambleMoves.length ? "finished" : "correct"
      );
    }

    /* R2 lze udělat pomalu jako R + R nebo R' + R'. */
    partial = { face: move.face, power: move.power };
    return getWcaScrambleState("partial");
  }

  if (move.power !== expected.power) {
    errorStack.push(move);
    return getWcaScrambleState("wrong");
  }

  scrambleIndex += 1;
  return getWcaScrambleState(
    scrambleIndex >= scrambleMoves.length ? "finished" : "correct"
  );
}

export function paintWcaScramble(selectedAlg, state) {
  if (!selectedAlg || !state) return;

  const moves = [...selectedAlg.querySelectorAll(
    ".alg-move, .next-move, .done-move, .wrong-move"
  )];

  moves.forEach((element, index) => {
    element.classList.remove(
      "alg-move", "next-move", "done-move", "wrong-move", "wca-partial-move"
    );

    if (index < state.index) {
      element.classList.add("done-move");
    } else if (index === state.index) {
      if (state.status === "wrong") element.classList.add("wrong-move");
      else if (state.status === "partial") element.classList.add("next-move", "wca-partial-move");
      else element.classList.add("next-move");
    } else {
      element.classList.add("alg-move");
    }
  });
}

export function normalizeWcaFacelets(facelets) {
  if (Array.isArray(facelets) || ArrayBuffer.isView(facelets)) {
    return Array.from(facelets).join("");
  }

  if (facelets && typeof facelets === "object") {
    if (Array.isArray(facelets.facelets)) {
      return facelets.facelets.join("");
    }

    if (typeof facelets.facelets === "string") {
      return facelets.facelets.replace(/[\s,;|]/g, "");
    }
  }

  return String(facelets || "").replace(/[\s,;|]/g, "");
}

export function isSolvedFacelets(facelets) {
  const value = normalizeWcaFacelets(facelets);
  if (value.length !== 54) return false;

  for (let start = 0; start < 54; start += 9) {
    const center = value[start + 4];
    if (!center) return false;

    for (let i = start; i < start + 9; i += 1) {
      if (value[i] !== center) return false;
    }
  }

  return true;
}
