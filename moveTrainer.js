export function renderAlgorithmPreview(selectedAlg){
  const text = selectedAlg.innerText || "";
  const parts = text.split(":");
  const alg = parts[1] ? parts[1].trim() : "";

  if(!alg){
    selectedAlg.innerHTML = "Algoritmus: nevybráno";
    return;
  }

  const moves = alg.split(/\s+/);

  selectedAlg.innerHTML =
    "Algoritmus:<br>" +
    moves.map((move,index)=>{
      if(index===0){
        return `<span class="next-move">${move}</span>`;
      }

      return `<span class="alg-move">${move}</span>`;
    }).join(" ");
}