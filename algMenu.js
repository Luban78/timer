export function openPLLMenu({
  algList,
  modal,
  selectedAlg,
  pllAlgs,
  onSelect
}){
  algList.innerHTML = "";

  Object.entries(pllAlgs).forEach(([name, alg])=>{
    const b = document.createElement("button");
    b.className = "algBtn";
    b.innerText = name;

    b.onclick = e=>{
      e.stopPropagation();
      selectedAlg.innerText = name + ": " + alg;
      modal.style.display = "none";
      onSelect(name);
    };

    algList.appendChild(b);
  });

  modal.style.display = "block";
}