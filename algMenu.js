/* ==================================================
   CUBE TRAINER – VÝBĚR PLL A OLL ALGORITMŮ
   ================================================== */

const RANDOM_PLL_STORAGE_KEY = "cubeTrainer.randomPllSelection.v1";
const RANDOM_PLL_RETURN_SOLVED_KEY = "cubeTrainer.randomPllReturnSolved.v1";

function vlozStylyVyberuPll() {
  if (document.getElementById("pll-selection-style")) return;

  const style = document.createElement("style");
  style.id = "pll-selection-style";
  style.textContent = `
    .algGrid.alg-pll-selection-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      grid-auto-rows: 72px !important;
      align-items: stretch !important;
      gap: 12px !important;
    }

    .alg-pll-select-btn {
      position: relative !important;
      width: 100% !important;
      height: 72px !important;
      min-height: 72px !important;
      max-height: 72px !important;
      margin: 0 !important;
      padding: 8px 38px 8px 14px !important;
      box-sizing: border-box !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      overflow: hidden !important;
      white-space: normal !important;
      text-align: center !important;
      text-overflow: ellipsis !important;
      line-height: 1.08 !important;
      font-size: clamp(16px, 4.4vw, 22px) !important;
    }

    .alg-pll-select-btn::after {
      content: "";
      position: absolute;
      right: 10px;
      top: 50%;
      width: 24px;
      height: 24px;
      transform: translateY(-50%) scale(.8);
      display: grid;
      place-items: center;
      border-radius: 7px;
      background: transparent;
      color: transparent;
      font-size: 18px;
      font-weight: 950;
      line-height: 1;
      opacity: 0;
      transition: opacity .12s ease, transform .12s ease;
      pointer-events: none;
    }

    .alg-pll-select-btn.is-pll-selected {
      border-color: #00e676 !important;
      box-shadow:
        inset 0 0 24px rgba(0,230,118,.11),
        0 0 12px rgba(0,230,118,.10) !important;
    }

    .alg-pll-select-btn.is-pll-selected::after {
      content: "✓";
      background: #00e676;
      color: #062113;
      opacity: 1;
      transform: translateY(-50%) scale(1);
    }

    .alg-pll-footer {
      grid-column: 1 / -1;
      position: sticky;
      bottom: -1px;
      z-index: 12;
      padding-top: 10px;
      background: linear-gradient(180deg, rgba(20,31,37,0), #141f25 34%);
    }

    .alg-pll-apply-btn {
      width: 100% !important;
      min-height: 58px !important;
      height: 58px !important;
      margin: 0 !important;
      border-color: #00e676 !important;
      color: #00e676 !important;
      font-weight: 900 !important;
    }

    .alg-pll-apply-btn:disabled {
      opacity: .38 !important;
    }

    #modalTitle.pll-selection-title {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 10px !important;
    }

    .pll-random-options {
      margin-left: auto !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: flex-end !important;
      gap: 12px !important;
      min-width: 0 !important;
    }

    .pll-random-option-label,
    .pll-select-all-label {
      display: inline-flex !important;
      align-items: center !important;
      gap: 7px !important;
      color: #dfe8e4 !important;
      font-size: 14px !important;
      font-weight: 750 !important;
      line-height: 1.1 !important;
      white-space: nowrap !important;
      cursor: pointer !important;
      user-select: none !important;
    }

    .pll-random-option-label input,
    .pll-select-all-label input {
      width: 22px !important;
      height: 22px !important;
      margin: 0 !important;
      accent-color: #00e676 !important;
      flex: 0 0 auto !important;
    }

    @media (max-width: 899px) {
      .algGrid.alg-pll-selection-grid {
        grid-auto-rows: 64px !important;
        gap: 10px !important;
      }

      .alg-pll-select-btn {
        height: 64px !important;
        min-height: 64px !important;
        max-height: 64px !important;
        padding: 7px 36px 7px 10px !important;
        font-size: clamp(16px, 4.5vw, 21px) !important;
      }

      .alg-pll-select-btn::after {
        right: 8px;
        width: 22px;
        height: 22px;
        font-size: 17px;
      }

      .pll-random-options {
        gap: 8px !important;
      }

      .pll-random-option-label,
      .pll-select-all-label {
        font-size: 12px !important;
        gap: 5px !important;
      }

      .pll-random-option-label input,
      .pll-select-all-label input {
        width: 20px !important;
        height: 20px !important;
      }
    }
  `;

  document.head.appendChild(style);
}

function nactiNavratDoSlozene() {
  try {
    return localStorage.getItem(RANDOM_PLL_RETURN_SOLVED_KEY) === "1";
  } catch {
    return false;
  }
}

function ulozNavratDoSlozene(enabled) {
  const hodnota = !!enabled;
  window.__cubeTrainerRandomPllReturnSolved = hodnota;

  try {
    localStorage.setItem(RANDOM_PLL_RETURN_SOLVED_KEY, hodnota ? "1" : "0");
  } catch (error) {
    console.warn("PLL Random: nastavení návratu do složené se nepodařilo uložit", error);
  }
}

window.getRandomPllReturnToSolvedEnabled = function() {
  if (typeof window.__cubeTrainerRandomPllReturnSolved !== "boolean") {
    window.__cubeTrainerRandomPllReturnSolved = nactiNavratDoSlozene();
  }

  return window.__cubeTrainerRandomPllReturnSolved;
};

function nactiVyberRandomPll(nazvy) {
  const povoleneNazvy = new Set(nazvy);

  try {
    const raw = localStorage.getItem(RANDOM_PLL_STORAGE_KEY);
    const ulozene = raw ? JSON.parse(raw) : null;

    if (Array.isArray(ulozene)) {
      const platne = ulozene.filter(name => povoleneNazvy.has(name));
      if (platne.length > 0) {
        return new Set(platne);
      }
    }
  } catch (error) {
    console.warn("PLL Random: uložený výběr se nepodařilo načíst", error);
  }

  return new Set(nazvy);
}

function ziskejVyberRandomPll(nazvy) {
  if (!(window.__cubeTrainerRandomPllSelection instanceof Set)) {
    window.__cubeTrainerRandomPllSelection = nactiVyberRandomPll(nazvy);
  }

  return window.__cubeTrainerRandomPllSelection;
}

function ulozVyberRandomPll(vyber) {
  window.__cubeTrainerRandomPllSelection = new Set(vyber);

  try {
    localStorage.setItem(
      RANDOM_PLL_STORAGE_KEY,
      JSON.stringify(Array.from(vyber))
    );
  } catch (error) {
    console.warn("PLL Random: výběr se nepodařilo uložit", error);
  }
}

window.getSelectedRandomPllNames = function(nazvy = []) {
  if (
    !(window.__cubeTrainerRandomPllSelection instanceof Set) &&
    Array.isArray(nazvy) &&
    nazvy.length > 0
  ) {
    window.__cubeTrainerRandomPllSelection = nactiVyberRandomPll(nazvy);
  }

  const vyber = window.__cubeTrainerRandomPllSelection;
  return vyber instanceof Set ? Array.from(vyber) : [];
};

function otevriPllVyber({
  algList,
  modal,
  selectedAlg,
  algorithms,
  onSelect,
  randomSelectionMode
}) {
  vlozStylyVyberuPll();
  algList.classList.add("alg-pll-selection-grid");

  const nazvyAlgoritmu = Object.keys(algorithms);
  const jeRandom = !!randomSelectionMode;

  let rozpracovanyVyber;

  if (jeRandom) {
    rozpracovanyVyber = new Set(ziskejVyberRandomPll(nazvyAlgoritmu));
  } else {
    const aktivniNazev = selectedAlg?.dataset?.algName;
    rozpracovanyVyber = new Set(
      aktivniNazev && nazvyAlgoritmu.includes(aktivniNazev)
        ? [aktivniNazev]
        : []
    );
  }

  const tlacitka = new Map();
  let vybratVseCheckbox = null;
  let navratDoSlozeneCheckbox = null;

  const prekresliVyber = () => {
    tlacitka.forEach((button, name) => {
      const selected = rozpracovanyVyber.has(name);
      button.classList.toggle("is-pll-selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });

    if (vybratVseCheckbox) {
      const pocetVybranych = rozpracovanyVyber.size;
      const vsechny = nazvyAlgoritmu.length > 0 && pocetVybranych === nazvyAlgoritmu.length;
      vybratVseCheckbox.checked = vsechny;
      vybratVseCheckbox.indeterminate = pocetVybranych > 0 && !vsechny;
    }
  };

  const footer = document.createElement("div");
  footer.className = "alg-pll-footer";

  const applyBtn = document.createElement("button");
  applyBtn.className = "alg-pll-apply-btn";
  applyBtn.type = "button";
  applyBtn.textContent = "VYBRAT";

  const modalTitle = modal.querySelector("#modalTitle");
  if (modalTitle) {
    modalTitle.classList.remove("pll-selection-title");
    modalTitle.textContent = "PLL";

    // „Vybrat všechny“ má smysl jen pro Random, kde lze vybrat více PLL.
    if (jeRandom) {
      modalTitle.classList.add("pll-selection-title");

      const titleText = document.createElement("span");
      titleText.textContent = "PLL";

      const options = document.createElement("span");
      options.className = "pll-random-options";

      const navratLabel = document.createElement("label");
      navratLabel.className = "pll-random-option-label";
      navratLabel.setAttribute(
        "aria-label",
        "Po každém Random PLL nabídnout návratový PLL, aby kostka skončila znovu složená"
      );
      navratLabel.title = "Návrat do složené";

      navratDoSlozeneCheckbox = document.createElement("input");
      navratDoSlozeneCheckbox.type = "checkbox";
      navratDoSlozeneCheckbox.checked = typeof window.getRandomPllReturnToSolvedEnabled === "function"
        ? window.getRandomPllReturnToSolvedEnabled()
        : false;

      const navratText = document.createElement("span");
      navratText.textContent = "Návrat";
      navratLabel.append(navratDoSlozeneCheckbox, navratText);

      const label = document.createElement("label");
      label.className = "pll-select-all-label";
      label.setAttribute("aria-label", "Vybrat nebo odznačit všechny PLL");

      vybratVseCheckbox = document.createElement("input");
      vybratVseCheckbox.type = "checkbox";

      const labelText = document.createElement("span");
      labelText.textContent = "Vybrat všechny";

      label.append(vybratVseCheckbox, labelText);
      options.append(navratLabel, label);
      modalTitle.replaceChildren(titleText, options);

      navratLabel.addEventListener("click", event => {
        event.stopPropagation();
      });

      label.addEventListener("click", event => {
        event.stopPropagation();
      });

      navratDoSlozeneCheckbox.addEventListener("change", event => {
        event.stopPropagation();
      });

      vybratVseCheckbox.addEventListener("change", event => {
        event.stopPropagation();

        if (vybratVseCheckbox.checked) {
          nazvyAlgoritmu.forEach(name => rozpracovanyVyber.add(name));
        } else {
          rozpracovanyVyber.clear();
        }

        prekresliVyber();
        applyBtn.disabled = rozpracovanyVyber.size === 0;
      });
    }
  }

  Object.keys(algorithms).forEach(name => {
    const button = document.createElement("button");
    button.className = "algBtn alg-pll-select-btn";
    button.type = "button";
    button.textContent = name;
    button.setAttribute("aria-label", jeRandom
      ? `Zařadit ${name} do Random tréninku`
      : `Vybrat ${name}`
    );

    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      if (jeRandom) {
        if (rozpracovanyVyber.has(name)) {
          rozpracovanyVyber.delete(name);
        } else {
          rozpracovanyVyber.add(name);
        }
      } else {
        rozpracovanyVyber.clear();
        rozpracovanyVyber.add(name);
      }

      prekresliVyber();
      applyBtn.disabled = rozpracovanyVyber.size === 0;
    });

    tlacitka.set(name, button);
    algList.appendChild(button);
  });

  applyBtn.disabled = rozpracovanyVyber.size === 0;

  applyBtn.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();

    if (rozpracovanyVyber.size === 0) return;

    if (jeRandom) {
      ulozVyberRandomPll(rozpracovanyVyber);
      ulozNavratDoSlozene(navratDoSlozeneCheckbox?.checked);

      window.dispatchEvent(
        new CustomEvent("cube-trainer-random-pll-selection-changed", {
          detail: {
            selected: Array.from(rozpracovanyVyber),
            returnToSolved: !!navratDoSlozeneCheckbox?.checked
          }
        })
      );
    } else {
      const [name] = rozpracovanyVyber;
      if (name && typeof onSelect === "function") {
        onSelect(name);
      }
    }

    modal.style.display = "none";
  });

  footer.appendChild(applyBtn);
  algList.appendChild(footer);

  prekresliVyber();
  modal.style.display = "block";
}

function openAlgorithmMenu({
  algList,
  modal,
  selectedAlg,
  algorithms,
  onSelect
}) {
  if (!algList || !modal || !selectedAlg || !algorithms) {
    console.warn("Algorithm menu: chybí prvek nebo databáze");
    return;
  }

  algList.innerHTML = "";
  algList.classList.remove("alg-pll-selection-grid");

  Object.entries(algorithms).forEach(([name, value]) => {
    const button = document.createElement("button");
    button.className = "algBtn";
    button.type = "button";
    button.textContent = name;

    const algorithm =
      typeof value === "string"
        ? value
        : (value?.algorithm || value?.algorithms?.[0] || "");

    button.onclick = event => {
      event.preventDefault();
      event.stopPropagation();

      selectedAlg.textContent = `${name}: ${algorithm}`;
      modal.style.display = "none";

      if (typeof onSelect === "function") {
        onSelect(name);
      }
    };

    algList.appendChild(button);
  });

  modal.style.display = "block";
}

/* ===== PLL ===== */

export function openPLLMenu({
  algList,
  modal,
  selectedAlg,
  pllAlgs,
  onSelect,
  randomSelectionMode = false
}) {
  if (!algList || !modal || !selectedAlg || !pllAlgs) {
    console.warn("PLL menu: chybí prvek nebo databáze");
    return;
  }

  algList.innerHTML = "";
  algList.classList.remove("alg-pll-selection-grid");

  otevriPllVyber({
    algList,
    modal,
    selectedAlg,
    algorithms: pllAlgs,
    onSelect,
    randomSelectionMode
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
  const modalTitle = modal?.querySelector("#modalTitle");
  if (modalTitle) {
    modalTitle.classList.remove("pll-selection-title");
    modalTitle.textContent = "OLL";
  }

  openAlgorithmMenu({
    algList,
    modal,
    selectedAlg,
    algorithms: ollAlgs,
    onSelect
  });
}
