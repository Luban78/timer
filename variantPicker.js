import { pllAlgVariants, getActivePllAlg } from "./algorithms.js";

let pendingVariantIndex = null;
let currentName = null;
let onSaveCallback = null;

export function openVariantPicker(name, onSave) {
  currentName = name;
  onSaveCallback = onSave;
  
  const variants = pllAlgVariants[name];
  
  if (!variants || variants.length === 0) {
    if (typeof window.showAppDialog === "function") {
      window.showAppDialog({
        title: "Varianty algoritmu",
        message: "Pro tento algoritmus zatím nejsou uložené žádné varianty.",
        type: "warning",
        icon: "i"
      });
    } else {
      alert("Pro tento algoritmus zatím nejsou varianty.");
    }
    return;
  }
  
  const modal = document.getElementById("algVariantModal");
  const title = document.getElementById("variantModalTitle");
  const list = document.getElementById("variantList");
  
  if (!modal || !title || !list) return;
  
  const savedIndex = Number(localStorage.getItem("pllVariant:" + name));
  const activeIndex =
    Number.isInteger(savedIndex) && variants[savedIndex] ?
    savedIndex :
    0;
  
  pendingVariantIndex = activeIndex;
  
  title.innerText = "Varianty: " + name;
  
  list.innerHTML = variants.map((variant, index) => {
    const selectedClass = index === activeIndex ? " selected" : "";
    const check = index === activeIndex ? "✓" : "";
    
    return `
      <div class="variant-item${selectedClass}" data-index="${index}">
        <div class="variant-item-head">
          <div class="variant-name">${variant.name}</div>
          <div class="variant-check">${check}</div>
        </div>
        <div class="variant-alg">${variant.alg}</div>
      </div>
    `;
  }).join("");
  
  modal.classList.remove("hidden");
}

export function closeVariantPicker() {
  const modal = document.getElementById("algVariantModal");
  if (modal) modal.classList.add("hidden");
  
  pendingVariantIndex = null;
  currentName = null;
  onSaveCallback = null;
}

function refreshVariantSelection() {
  const list = document.getElementById("variantList");
  if (!list) return;
  
  const items = list.querySelectorAll(".variant-item");
  
  items.forEach((item) => {
    const index = Number(item.dataset.index);
    const check = item.querySelector(".variant-check");
    
    if (index === pendingVariantIndex) {
      item.classList.add("selected");
      if (check) check.innerText = "✓";
    } else {
      item.classList.remove("selected");
      if (check) check.innerText = "";
    }
  });
}

export function initVariantPicker() {
  const list = document.getElementById("variantList");
  const closeBtn = document.getElementById("closeVariantModalBtn");
  const cancelBtn = document.getElementById("cancelVariantBtn");
  const saveBtn = document.getElementById("saveVariantBtn");
  
  if (list) {
    list.addEventListener("click", (e) => {
      const item = e.target.closest(".variant-item");
      if (!item) return;
      
      pendingVariantIndex = Number(item.dataset.index);
      refreshVariantSelection();
    });
  }
  
  if (closeBtn) closeBtn.addEventListener("click", closeVariantPicker);
  if (cancelBtn) cancelBtn.addEventListener("click", closeVariantPicker);
  
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      if (!currentName || pendingVariantIndex === null) return;
      
      localStorage.setItem(
        "pllVariant:" + currentName,
        String(pendingVariantIndex)
      );
      
      if (typeof onSaveCallback === "function") {
        onSaveCallback(getActivePllAlg(currentName));
      }
      
      closeVariantPicker();
    });
  }
}