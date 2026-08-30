import {
  pllAlgVariants,
  ollAlgVariants,
  getActivePllAlg,
  getActiveOllAlg
} from "./algorithms.js";

let pendingVariantIndex = null;
let currentName = null;
let onSaveCallback = null;
let currentType = "pll";
let pendingImageData = null;
let removePendingImage = false;

const IMAGE_KEY_PREFIX = "algorithmImage:";

function getVariantsForName(name) {
  if (ollAlgVariants[name]) {
    currentType = "oll";
    return ollAlgVariants[name];
  }

  currentType = "pll";
  return pllAlgVariants[name];
}

function getActiveAlgorithm(name) {
  return currentType === "oll"
    ? getActiveOllAlg(name)
    : getActivePllAlg(name);
}

function getVariantStorageKey(name) {
  return `${currentType}Variant:${name}`;
}

function getStoredAlgorithmImage(name) {
  try {
    return localStorage.getItem(IMAGE_KEY_PREFIX + name) || "";
  } catch {
    return "";
  }
}

function ensureImagePickerUi() {
  const modalBox = document.querySelector("#algVariantModal .variant-modal-box");
  const list = document.getElementById("variantList");
  if (!modalBox || !list) return null;

  let panel = document.getElementById("variantImagePanel");
  if (panel) return panel;

  panel = document.createElement("div");
  panel.id = "variantImagePanel";
  panel.style.cssText = [
    "margin:12px 12px 0",
    "padding:12px",
    "border:1px solid rgba(0,230,118,.42)",
    "border-radius:16px",
    "background:rgba(0,0,0,.16)"
  ].join(";");

  panel.innerHTML = `
    <div style="font-weight:900;color:var(--green);margin-bottom:10px">Obrázek orientace</div>
    <div style="display:grid;grid-template-columns:86px 1fr;gap:12px;align-items:center">
      <div id="variantImagePreviewWrap" style="width:86px;height:86px;border-radius:14px;border:1px solid rgba(255,255,255,.14);display:grid;place-items:center;overflow:hidden;background:rgba(0,0,0,.22)">
        <span id="variantImageEmpty" style="opacity:.55;font-size:12px;text-align:center;padding:6px">Automatický</span>
        <img id="variantImagePreview" alt="Náhled orientace" style="display:none;width:100%;height:100%;object-fit:contain">
      </div>
      <div style="display:grid;gap:8px">
        <button id="chooseVariantImageBtn" type="button" style="min-height:44px;font-size:15px">🖼 Vybrat obrázek</button>
        <button id="cameraVariantImageBtn" type="button" style="min-height:44px;font-size:15px">📷 Vyfotit</button>
        <button id="pasteVariantImageBtn" type="button" style="min-height:44px;font-size:15px">📋 Vložit ze schránky</button>
        <button id="removeVariantImageBtn" type="button" style="min-height:40px;font-size:14px">Použít automatický diagram</button>
      </div>
    </div>
    <div style="margin-top:9px;font-size:12px;line-height:1.35;opacity:.68">Bez vlastního obrázku se PLL/OLL diagram vytvoří automaticky z algoritmu.</div>
    <input id="variantImageInput" type="file" accept="image/*" hidden>
    <input id="variantCameraInput" type="file" accept="image/*" capture="environment" hidden>
  `;

  modalBox.insertBefore(panel, list);

  const chooseBtn = panel.querySelector("#chooseVariantImageBtn");
  const cameraBtn = panel.querySelector("#cameraVariantImageBtn");
  const pasteBtn = panel.querySelector("#pasteVariantImageBtn");
  const removeBtn = panel.querySelector("#removeVariantImageBtn");
  const input = panel.querySelector("#variantImageInput");
  const cameraInput = panel.querySelector("#variantCameraInput");

  async function prepareSelectedImage(file) {
    if (!file) return;

    try {
      pendingImageData = await compressImageForStorage(file);
      removePendingImage = false;
      refreshImagePreview(pendingImageData);
    } catch (error) {
      console.error("Image prepare failed:", error);
      showImageWarning("Obrázek se nepodařilo načíst", "Zkus prosím jiný obrázek.");
    }
  }

  chooseBtn?.addEventListener("click", () => input?.click());
  cameraBtn?.addEventListener("click", () => cameraInput?.click());

  pasteBtn?.addEventListener("click", async () => {
    try {
      const imageBlob = await readImageFromClipboard();
      await prepareSelectedImage(imageBlob);
    } catch (error) {
      console.warn("Clipboard image read failed:", error);
      showImageWarning(
        "Obrázek ve schránce není dostupný",
        "Nejdřív na webu zkopíruj přímo obrázek. Pokud prohlížeč čtení obrázků ze schránky nepovolí, použij Vybrat obrázek."
      );
    }
  });

  removeBtn?.addEventListener("click", () => {
    pendingImageData = null;
    removePendingImage = true;
    refreshImagePreview("");
  });

  input?.addEventListener("change", async () => {
    await prepareSelectedImage(input.files?.[0]);
    input.value = "";
  });

  cameraInput?.addEventListener("change", async () => {
    await prepareSelectedImage(cameraInput.files?.[0]);
    cameraInput.value = "";
  });

  return panel;
}

function showImageWarning(title, message) {
  if (typeof window.showAppDialog === "function") {
    window.showAppDialog({
      title,
      message,
      type: "warning",
      icon: "i"
    });
    return;
  }

  alert(message);
}

async function readImageFromClipboard() {
  if (!navigator.clipboard || typeof navigator.clipboard.read !== "function") {
    throw new Error("Clipboard image API není dostupné");
  }

  const items = await navigator.clipboard.read();
  for (const item of items) {
    const imageType = item.types.find((type) => type.startsWith("image/"));
    if (!imageType) continue;
    return item.getType(imageType);
  }

  throw new Error("Ve schránce není obrázek");
}

function refreshImagePreview(src) {
  const img = document.getElementById("variantImagePreview");
  const empty = document.getElementById("variantImageEmpty");
  if (!img || !empty) return;

  if (src) {
    img.src = src;
    img.style.display = "block";
    empty.style.display = "none";
  } else {
    img.removeAttribute("src");
    img.style.display = "none";
    empty.style.display = "block";
  }
}

function compressImageForStorage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(reader.error || new Error("Soubor nelze přečíst"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Obrázek nelze načíst"));
      img.onload = () => {
        const maxSize = 320;
        const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
        const width = Math.max(1, Math.round(img.naturalWidth * scale));
        const height = Math.max(1, Math.round(img.naturalHeight * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas není dostupný"));
          return;
        }

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // WebP výrazně zmenší obrázky, aby se do localStorage vešlo více PLL/OLL.
        let data = canvas.toDataURL("image/webp", 0.82);
        if (!data.startsWith("data:image/webp")) {
          data = canvas.toDataURL("image/jpeg", 0.84);
        }
        resolve(data);
      };
      img.src = String(reader.result || "");
    };

    reader.readAsDataURL(file);
  });
}

export function openVariantPicker(name, onSave) {
  currentName = name;
  onSaveCallback = onSave;
  
  const variants = getVariantsForName(name);
  
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
  
  const savedIndex = Number(localStorage.getItem(getVariantStorageKey(name)));
  const activeIndex =
    Number.isInteger(savedIndex) && variants[savedIndex] ?
    savedIndex :
    0;
  
  pendingVariantIndex = activeIndex;
  pendingImageData = getStoredAlgorithmImage(name);
  removePendingImage = false;

  ensureImagePickerUi();
  refreshImagePreview(pendingImageData);
  
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
  currentType = "pll";
  pendingImageData = null;
  removePendingImage = false;
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
        getVariantStorageKey(currentName),
        String(pendingVariantIndex)
      );

      try {
        if (removePendingImage) {
          localStorage.removeItem(IMAGE_KEY_PREFIX + currentName);
        } else if (pendingImageData) {
          localStorage.setItem(IMAGE_KEY_PREFIX + currentName, pendingImageData);
        }
      } catch (error) {
        console.error("Image save failed:", error);
        if (typeof window.showAppDialog === "function") {
          window.showAppDialog({
            title: "Obrázek se nepodařilo uložit",
            message: "Úložiště prohlížeče je pravděpodobně plné. Zkus menší obrázek.",
            type: "warning",
            icon: "i"
          });
        }
      }
      
      if (typeof onSaveCallback === "function") {
        onSaveCallback(getActiveAlgorithm(currentName));
      }
      
      closeVariantPicker();
    });
  }
}