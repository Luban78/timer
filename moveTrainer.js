function expandMove(move, displayIndex){
  if(move === "M"){
    return [
      { move:"L'", displayIndex },
      { move:"R", displayIndex }
    ];
  }

  if(move === "M'"){
    return [
      { move:"R'", displayIndex },
      { move:"L", displayIndex }
    ];
  }

  if(move === "M2"){
    return [
      { move:"R'", displayIndex },
      { move:"L", displayIndex },
      { move:"R'", displayIndex },
      { move:"L", displayIndex }
    ];
  }

  return [
    { move, displayIndex }
  ];
}

function expandAlgorithm(moves){
  return moves.flatMap((move,index)=>expandMove(move,index));
}

let displayMoves = [];
let checkMoves = [];
let displayIndex = 0;
let checkIndex = 0;

export function renderAlgorithmPreview(selectedAlg){
  const text = selectedAlg.innerText || "";
  const parts = text.split(":");
  const alg = parts[1] ? parts[1].trim() : "";
  if(/\bM2?\b|\bM'\b/.test(alg)){
  displayMoves = [];
  checkMoves = [];
  displayIndex = 0;
  checkIndex = 0;
  selectedAlg.innerHTML = "Algoritmus:<br><span class='wrong-move'>M tahy zatím nejsou podporované</span>";
  return;
}

  if(!alg){
    displayMoves = [];
    checkMoves = [];
    displayIndex = 0;
    checkIndex = 0;
    selectedAlg.innerHTML = "Algoritmus: nevybráno";
    return;
  }

  displayMoves = alg.split(/\s+/);
  checkMoves = expandAlgorithm(displayMoves);

  displayIndex = 0;
  checkIndex = 0;

  renderTrainer(selectedAlg);
}

export function renderTrainer(selectedAlg){
  selectedAlg.innerHTML =
    "Algoritmus:<br>" +
    displayMoves.map((move,index)=>{
      if(index < displayIndex){
        return `<span class="done-move">${move}</span>`;
      }

      if(index === displayIndex){
        return `<span class="next-move">${move}</span>`;
      }

      return `<span class="alg-move">${move}</span>`;
    }).join(" ");
}

export function nextTrainerMove(selectedAlg){
  if(displayMoves.length === 0) return;

  displayIndex++;

  if(displayIndex >= displayMoves.length){
    displayIndex = displayMoves.length - 1;
  }

  renderTrainer(selectedAlg);
}

export function checkMove(move, selectedAlg){
  if(checkMoves.length === 0){
    return "none";
  }

  const expected = checkMoves[checkIndex];

  if(!expected){
    return "none";
  }

  if(move !== expected.move){
    return "wrong";
  }

  checkIndex++;

  const nextExpected = checkMoves[checkIndex];

  if(nextExpected){
    displayIndex = nextExpected.displayIndex;
    renderTrainer(selectedAlg);
    return "correct";
  }

  displayIndex = displayMoves.length;
  renderTrainer(selectedAlg);
  return "finished";
}