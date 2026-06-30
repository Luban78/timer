let trainerMoves = [];
let trainerIndex = 0;

export function renderAlgorithmPreview(selectedAlg) {
  const text = selectedAlg.innerText || "";
  const parts = text.split(":");
  const alg = parts[1] ? parts[1].trim() : "";
  
  if (!alg) {
    trainerMoves = [];
    trainerIndex = 0;
    selectedAlg.innerHTML = "Algoritmus: nevybráno";
    return;
  }
  
  trainerMoves = alg.split(/\s+/);
  trainerIndex = 0;
  
  renderTrainer(selectedAlg);
}

export function renderTrainer(selectedAlg){
  selectedAlg.innerHTML =
    "Algoritmus:<br>" +
    trainerMoves.map((move,index)=>{
      if(index < trainerIndex){
        return `<span class="done-move">${move}</span>`;
      }

      if(index === trainerIndex){
        return `<span class="next-move">${move}</span>`;
      }

      return `<span class="alg-move">${move}</span>`;
    }).join(" ");
}

export function nextTrainerMove(selectedAlg) {
  if (trainerMoves.length === 0) return;
  
  trainerIndex++;
  
  if (trainerIndex >= trainerMoves.length) {
    trainerIndex = trainerMoves.length - 1;
  }
  
  renderTrainer(selectedAlg);
}

export function checkMove(move, selectedAlg){

  if(trainerMoves.length === 0){
    return "none";
  }

  if(move === trainerMoves[trainerIndex]){

    trainerIndex++;

    if(trainerIndex >= trainerMoves.length){
      trainerIndex = trainerMoves.length;
      renderTrainer(selectedAlg);
      return "finished";
    }

    renderTrainer(selectedAlg);
    return "correct";
  }

  return "wrong";
}