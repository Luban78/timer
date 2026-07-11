/* ==================================================
   CUBE TRAINER – VÝBĚR PLL A OLL ALGORITMŮ
   ================================================== */

function openAlgorithmMenu({
  algList,
  modal,
  selectedAlg,
  algorithms,
  onSelect
}) {
  if (!algList || !modal || !selectedAlg || !algorithms) {
    console.warn(
      "Algorithm menu: chybí prvek nebo databáze"
    );
    return;
  }
  
  algList.innerHTML = "";
  
  Object.entries(algorithms).forEach(
    ([name, value]) => {
      const button =
        document.createElement("button");
      
      button.className = "algBtn";
      button.type = "button";
      button.textContent = name;
      
      const algorithm =
        typeof value === "string" ?
        value :
        (
          value?.algorithm ||
          value?.algorithms?.[0] ||
          ""
        );
      
      button.onclick = event => {
        event.preventDefault();
        event.stopPropagation();
        
        selectedAlg.textContent =
          `${name}: ${algorithm}`;
        
        modal.style.display = "none";
        
        if (typeof onSelect === "function") {
          onSelect(name);
        }
      };
      
      algList.appendChild(button);
    }
  );
  
  modal.style.display = "block";
}


/* ===== PLL ===== */

export function openPLLMenu({
  algList,
  modal,
  selectedAlg,
  pllAlgs,
  onSelect
}) {
  console.log("OPEN PLL MENU");
  
  openAlgorithmMenu({
    algList,
    modal,
    selectedAlg,
    algorithms: pllAlgs,
    onSelect
  });
}


/* ===== OLL ===== */

export function openOLLMenu({
  algList,
  modal,
  selectedAlg,
  ollAlgs,
  onSelect
}) {
  console.log("OPEN OLL MENU");
  
  openAlgorithmMenu({
    algList,
    modal,
    selectedAlg,
    algorithms: ollAlgs,
    onSelect
  });
}