/* =============================================================
   CUBE TRAINER – VISUAL DEBUG PANEL
   Live element picker and responsive CSS editor.

   Controls are stored in localStorage and applied on every reload.
   Exported CSS can later be pasted into the relevant project CSS file.
   ============================================================= */

(() => {
  "use strict";

  const STORAGE_KEY = "cubeTrainer.visualDebug.rules.v1";
  const PANEL_KEY = "cubeTrainer.visualDebug.panel.v1";
  const SNAPSHOT_KEY = "cubeTrainer.visualDebug.snapshot.v1";
  const STYLE_ID = "ct-vd-runtime-style";
  const INTERNAL_PREFIX = "ct-vd-";
  const MOBILE_MAX = 899;

  const state = {
    selected: null,
    selector: "",
    profile: window.innerWidth <= MOBILE_MAX ? "mobile" : "desktop",
    rules: loadJson(STORAGE_KEY, { mobile: {}, desktop: {}, all: {} }),
    picking: false,
    hoverTarget: null,
    panelOpen: false,
    grid: false,
    outlines: false,
    activeTab: "layout",
    drag: null,
    minimized: false,
    history: []
  };

  const propertyConfig = [
    { key: "font-size", label: "Velikost textu", tab: "text", min: 8, max: 96, step: 1, unit: "px" },
    { key: "font-weight", label: "Tloušťka textu", tab: "text", min: 100, max: 900, step: 100, unit: "" },
    { key: "line-height", label: "Výška řádku", tab: "text", min: 0.7, max: 3, step: 0.05, unit: "" },
    { key: "letter-spacing", label: "Rozestup písmen", tab: "text", min: -3, max: 12, step: 0.1, unit: "px" },

    { key: "width", label: "Šířka", tab: "layout", min: 0, max: 1600, step: 1, unit: "px", zeroAuto: true },
    { key: "height", label: "Výška", tab: "layout", min: 0, max: 1000, step: 1, unit: "px", zeroAuto: true },
    { key: "max-width", label: "Max. šířka", tab: "layout", min: 0, max: 1800, step: 1, unit: "px", zeroNone: true },
    { key: "min-height", label: "Min. výška", tab: "layout", min: 0, max: 1000, step: 1, unit: "px" },
    { key: "padding-inline", label: "Padding X", tab: "layout", min: 0, max: 120, step: 1, unit: "px" },
    { key: "padding-block", label: "Padding Y", tab: "layout", min: 0, max: 120, step: 1, unit: "px" },
    { key: "margin-inline", label: "Margin X", tab: "layout", min: -100, max: 160, step: 1, unit: "px" },
    { key: "margin-block", label: "Margin Y", tab: "layout", min: -100, max: 160, step: 1, unit: "px" },
    { key: "gap", label: "Mezera / gap", tab: "layout", min: 0, max: 100, step: 1, unit: "px" },

    { key: "border-radius", label: "Zaoblení", tab: "style", min: 0, max: 100, step: 1, unit: "px" },
    { key: "border-width", label: "Síla rámečku", tab: "style", min: 0, max: 10, step: 0.5, unit: "px" },
    { key: "opacity", label: "Průhlednost", tab: "style", min: 0.05, max: 1, step: 0.01, unit: "" },
    { key: "box-shadow-blur", label: "Síla neon glow", tab: "style", min: 0, max: 80, step: 1, unit: "px", virtual: true },

    { key: "translate-x", label: "Posun X", tab: "position", min: -500, max: 500, step: 1, unit: "px", virtual: true },
    { key: "translate-y", label: "Posun Y", tab: "position", min: -500, max: 500, step: 1, unit: "px", virtual: true },
    { key: "scale", label: "Měřítko", tab: "position", min: 0.25, max: 2, step: 0.01, unit: "", virtual: true },
    { key: "z-index", label: "Vrstva z-index", tab: "position", min: -10, max: 1000, step: 1, unit: "" }
  ];

  let refs = {};

  function loadJson(key, fallback) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "null");
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveRules() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.rules));
    renderRuntimeCss();
    updateRuleInfo();
  }

  function isInternal(element) {
    if (!element || !(element instanceof Element)) return true;
    return Boolean(element.closest(`[id^="${INTERNAL_PREFIX}"]`));
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(value);
    }
    return String(value).replace(/([^a-zA-Z0-9_-])/g, "\\$1");
  }

  function uniqueSelector(element) {
    if (!element || element === document.documentElement) return ":root";
    if (element.id) return `#${cssEscape(element.id)}`;

    const parts = [];
    let current = element;

    while (current && current !== document.body && parts.length < 6) {
      let part = current.tagName.toLowerCase();
      const stableClasses = [...current.classList]
        .filter(name => !name.startsWith("active") && !name.startsWith("open") && !name.startsWith("hidden"))
        .slice(0, 2);

      if (stableClasses.length) {
        part += stableClasses.map(name => `.${cssEscape(name)}`).join("");
      }

      const parent = current.parentElement;
      if (parent) {
        const sameType = [...parent.children].filter(child => child.tagName === current.tagName);
        if (sameType.length > 1) {
          part += `:nth-of-type(${sameType.indexOf(current) + 1})`;
        }
      }

      parts.unshift(part);
      const candidate = parts.join(" > ");
      try {
        if (document.querySelectorAll(candidate).length === 1) return candidate;
      } catch (_) {}
      current = parent;
    }

    return `body > ${parts.join(" > ")}`;
  }

  function ensureStyleElement() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    return style;
  }

  function declarationsToCss(declarations) {
    const normal = { ...declarations };
    const tx = normal["translate-x"] ?? "0px";
    const ty = normal["translate-y"] ?? "0px";
    const scale = normal.scale ?? "1";
    const glow = normal["box-shadow-blur"];
    const glowColor = normal["--ct-vd-glow-color"] || "#18ef7d";

    delete normal["translate-x"];
    delete normal["translate-y"];
    delete normal.scale;
    delete normal["box-shadow-blur"];
    delete normal["--ct-vd-glow-color"];

    if (tx !== "0px" || ty !== "0px" || scale !== "1") {
      normal.transform = `translate(${tx}, ${ty}) scale(${scale})`;
    }
    if (glow && parseFloat(glow) > 0) {
      normal["box-shadow"] = `0 0 ${glow} ${glowColor}`;
    }

    return Object.entries(normal)
      .filter(([, value]) => value !== "" && value != null)
      .map(([property, value]) => `  ${property}: ${value} !important;`)
      .join("\n");
  }

  function profileCss(profile) {
    const rules = state.rules[profile] || {};
    return Object.entries(rules)
      .filter(([, declarations]) => declarations && Object.keys(declarations).length)
      .map(([selector, declarations]) => {
        const css = declarationsToCss(declarations);
        return css ? `${selector} {\n${css}\n}` : "";
      })
      .filter(Boolean)
      .join("\n\n");
  }

  function generateCss() {
    const all = profileCss("all");
    const mobile = profileCss("mobile");
    const desktop = profileCss("desktop");
    const chunks = [
      "/* Cube Trainer – export z Visual Debug Panelu */",
      all,
      mobile ? `@media (max-width: ${MOBILE_MAX}px) {\n${indentCss(mobile)}\n}` : "",
      desktop ? `@media (min-width: ${MOBILE_MAX + 1}px) {\n${indentCss(desktop)}\n}` : ""
    ];
    return chunks.filter(Boolean).join("\n\n") + "\n";
  }

  function indentCss(css) {
    return css.split("\n").map(line => `  ${line}`).join("\n");
  }

  function renderRuntimeCss() {
    ensureStyleElement().textContent = generateCss();
  }

  function currentRule(create = false) {
    if (!state.selector) return null;
    const profileRules = state.rules[state.profile] || (state.rules[state.profile] = {});
    if (!profileRules[state.selector] && create) profileRules[state.selector] = {};
    return profileRules[state.selector] || null;
  }

  function pushHistory() {
    state.history.push(JSON.stringify(state.rules));
    if (state.history.length > 30) state.history.shift();
  }

  function setDeclaration(property, value) {
    if (!state.selector) return;
    pushHistory();
    const rule = currentRule(true);
    if (value === "" || value == null) delete rule[property];
    else rule[property] = value;
    if (!Object.keys(rule).length) delete state.rules[state.profile][state.selector];
    saveRules();
  }

  function getDeclaration(property) {
    return currentRule(false)?.[property] ?? "";
  }

  function computedNumeric(element, config) {
    if (!element) return config.key === "scale" ? 1 : 0;
    const style = getComputedStyle(element);
    switch (config.key) {
      case "padding-inline": return averagePx(style.paddingLeft, style.paddingRight);
      case "padding-block": return averagePx(style.paddingTop, style.paddingBottom);
      case "margin-inline": return averagePx(style.marginLeft, style.marginRight);
      case "margin-block": return averagePx(style.marginTop, style.marginBottom);
      case "box-shadow-blur": return 0;
      case "translate-x": return 0;
      case "translate-y": return 0;
      case "scale": return 1;
      case "width": return Math.round(element.getBoundingClientRect().width);
      case "height": return Math.round(element.getBoundingClientRect().height);
      case "max-width": return style.maxWidth === "none" ? 0 : parseFloat(style.maxWidth) || 0;
      default: return parseFloat(style.getPropertyValue(config.key)) || 0;
    }
  }

  function averagePx(a, b) {
    return (parseFloat(a) + parseFloat(b)) / 2 || 0;
  }

  function valueForControl(config) {
    const stored = getDeclaration(config.key);
    if (stored !== "") return parseFloat(stored) || 0;
    return clamp(computedNumeric(state.selected, config), config.min, config.max);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value) || 0));
  }

  function formatPropertyValue(config, rawValue) {
    const value = Number(rawValue);
    if (config.zeroAuto && value === 0) return "auto";
    if (config.zeroNone && value === 0) return "none";
    return `${value}${config.unit}`;
  }

  function selectElement(element, selectorOverride = "") {
    if (!element || isInternal(element)) return;
    state.selected = element;
    state.selector = selectorOverride || uniqueSelector(element);
    refs.selector.value = state.selector;
    refs.targetName.textContent = describeElement(element);
    syncControls();
    updateHighlight(element);
    updateRuleInfo();
  }

  function describeElement(element) {
    if (!element) return "Žádný prvek";
    const id = element.id ? `#${element.id}` : "";
    const cls = [...element.classList].slice(0, 2).map(c => `.${c}`).join("");
    return `${element.tagName.toLowerCase()}${id}${cls}`;
  }

  function resolveSelector() {
    const selector = refs.selector.value.trim();
    if (!selector) return;
    try {
      const element = document.querySelector(selector);
      if (!element) {
        toast("Selektor nebyl nalezen");
        return;
      }
      selectElement(element, selector);
    } catch (_) {
      toast("Neplatný CSS selektor");
    }
  }

  function updateHighlight(element = state.selected) {
    if (!element || !document.contains(element)) {
      refs.highlight.hidden = true;
      refs.measure.hidden = true;
      return;
    }
    const rect = element.getBoundingClientRect();
    refs.highlight.hidden = false;
    Object.assign(refs.highlight.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`
    });
    refs.measure.hidden = false;
    refs.measure.textContent = `${state.selector || describeElement(element)}  ${Math.round(rect.width)}×${Math.round(rect.height)} px`;
    const top = Math.max(4, rect.top - 27);
    const left = Math.min(Math.max(4, rect.left), window.innerWidth - Math.min(440, window.innerWidth - 8));
    Object.assign(refs.measure.style, { left: `${left}px`, top: `${top}px` });
  }

  function setPicking(enabled) {
    state.picking = enabled;
    document.body.classList.toggle("ct-vd-picking", enabled);
    refs.pickBtn.classList.toggle("active", enabled);
    refs.pickBtn.textContent = enabled ? "Klikni na prvek…" : "Vybrat prvek";
    if (!enabled) state.hoverTarget = null;
  }

  function onPointerMove(event) {
    if (!state.picking) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target || isInternal(target)) return;
    state.hoverTarget = target;
    state.selector = uniqueSelector(target);
    updateHighlight(target);
  }

  function onPick(event) {
    if (!state.picking) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target || isInternal(target)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    selectElement(target);
    setPicking(false);
  }

  function syncControls() {
    propertyConfig.forEach(config => {
      const range = refs.controls.get(config.key)?.range;
      const number = refs.controls.get(config.key)?.number;
      if (!range || !number) return;
      const value = valueForControl(config);
      range.value = value;
      number.value = Number(value.toFixed(config.step < 1 ? 2 : 0));
    });

    if (state.selected) {
      const style = getComputedStyle(state.selected);
      refs.textColor.value = rgbToHex(style.color) || "#ffffff";
      refs.bgColor.value = rgbToHex(style.backgroundColor) || "#001015";
      refs.borderColor.value = rgbToHex(style.borderColor) || "#18ef7d";
      refs.glowColor.value = getDeclaration("--ct-vd-glow-color") || "#18ef7d";
      refs.textAlign.value = getDeclaration("text-align") || style.textAlign || "left";
      refs.display.value = getDeclaration("display") || style.display || "block";
    }
  }

  function rgbToHex(rgb) {
    const values = String(rgb).match(/[\d.]+/g);
    if (!values || values.length < 3) return "";
    const [r, g, b] = values.slice(0, 3).map(v => Math.round(Number(v)));
    return `#${[r, g, b].map(v => v.toString(16).padStart(2, "0")).join("")}`;
  }

  function updateRuleInfo() {
    const current = currentRule(false) || {};
    refs.ruleCount.textContent = String(Object.keys(current).length);
    refs.totalCount.textContent = String(
      Object.values(state.rules).reduce((sum, profile) => sum + Object.keys(profile || {}).length, 0)
    );
    refs.viewport.textContent = `${window.innerWidth}×${window.innerHeight}`;
    refs.breakpoint.textContent = window.innerWidth <= MOBILE_MAX ? "mobil" : "desktop";
  }

  function resetSelected() {
    if (!state.selector) return;
    pushHistory();
    delete state.rules[state.profile][state.selector];
    saveRules();
    syncControls();
    toast(`Resetováno: ${state.profile}`);
  }

  function resetAll() {
    pushHistory();
    state.rules = { mobile: {}, desktop: {}, all: {} };
    saveRules();
    syncControls();
    toast("Všechny debug úpravy byly odstraněny");
  }

  function undo() {
    const previous = state.history.pop();
    if (!previous) {
      toast("Není co vrátit");
      return;
    }
    state.rules = JSON.parse(previous);
    saveRules();
    syncControls();
    toast("Poslední změna vrácena");
  }

  function totalEditedSelectors() {
    return ["all", "mobile", "desktop"].reduce((sum, profile) => {
      return sum + Object.values(state.rules[profile] || {}).filter(
        declarations => declarations && Object.keys(declarations).length
      ).length;
    }, 0);
  }

  async function copyCss() {
    const css = generateCss();
    try {
      await navigator.clipboard.writeText(css);
      toast(`Zkopírováno celé CSS (${totalEditedSelectors()} selektorů)`);
    } catch (_) {
      downloadText("cube-trainer-debug.css", css);
      toast(`Staženo celé CSS (${totalEditedSelectors()} selektorů)`);
    }
  }

  function downloadCss() {
    downloadText("cube-trainer-debug-complete.css", generateCss());
    toast(`Staženo celé CSS (${totalEditedSelectors()} selektorů)`);
  }

  function downloadJson() {
    downloadText("cube-trainer-debug-preset.json", JSON.stringify(state.rules, null, 2));
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function saveSnapshot() {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(state.rules));
    toast("Snapshot uložen");
  }

  function restoreSnapshot() {
    const snapshot = loadJson(SNAPSHOT_KEY, null);
    if (!snapshot) {
      toast("Žádný snapshot není uložen");
      return;
    }
    pushHistory();
    state.rules = snapshot;
    saveRules();
    syncControls();
    toast("Snapshot obnoven");
  }

  function importPreset(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed.mobile || !parsed.desktop || !parsed.all) throw new Error("bad format");
        pushHistory();
        state.rules = parsed;
        saveRules();
        syncControls();
        toast("Preset importován");
      } catch (_) {
        toast("Soubor není platný debug preset");
      }
    };
    reader.readAsText(file);
  }

  function toast(message) {
    refs.toast.textContent = message;
    refs.toast.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { refs.toast.hidden = true; }, 2200);
  }

  function togglePanel(force) {
    state.panelOpen = typeof force === "boolean" ? force : !state.panelOpen;
    refs.panel.hidden = !state.panelOpen;
    refs.fab.setAttribute("aria-expanded", String(state.panelOpen));
    if (state.panelOpen) {
      updateRuleInfo();
      if (state.selected) updateHighlight();
    } else {
      setPicking(false);
      refs.highlight.hidden = true;
      refs.measure.hidden = true;
    }
    savePanelState();
  }

  function savePanelState() {
    const data = {
      open: state.panelOpen,
      profile: state.profile,
      tab: state.activeTab,
      top: refs.panel.style.top || "",
      left: refs.panel.style.left || "",
      right: refs.panel.style.right || "",
      minimized: state.minimized
    };
    localStorage.setItem(PANEL_KEY, JSON.stringify(data));
  }

  function restorePanelState() {
    const data = loadJson(PANEL_KEY, {});
    state.profile = ["mobile", "desktop", "all"].includes(data.profile) ? data.profile : state.profile;
    state.activeTab = data.tab || "layout";
    refs.profile.value = state.profile;
    activateTab(state.activeTab);
    if (data.left) {
      refs.panel.style.left = data.left;
      refs.panel.style.top = data.top || "12px";
      refs.panel.style.right = "auto";
      refs.panel.style.bottom = "auto";
    }
    state.minimized = Boolean(data.minimized);
    refs.panel.classList.toggle("ct-vd-minimized", state.minimized);
    refs.minimize?.setAttribute("aria-expanded", String(!state.minimized));
    refs.minimize && (refs.minimize.textContent = state.minimized ? "▢" : "—");
    togglePanel(Boolean(data.open));
  }

  function activateTab(tab) {
    state.activeTab = tab;
    refs.tabs.forEach(button => button.classList.toggle("active", button.dataset.tab === tab));
    refs.panes.forEach(pane => { pane.hidden = pane.dataset.pane !== tab; });
    savePanelState();
  }

  function startDrag(event) {
    if (event.button != null && event.button !== 0) return;
    if (event.target.closest("button, input, select, textarea, label, a")) return;

    const rect = refs.panel.getBoundingClientRect();
    state.drag = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: rect.left,
      top: rect.top
    };

    refs.panel.classList.add("ct-vd-dragging");
    refs.head.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function moveDrag(event) {
    if (!state.drag || event.pointerId !== state.drag.pointerId) return;

    const panelWidth = refs.panel.offsetWidth;
    const panelHeight = refs.panel.offsetHeight;
    const keepVisible = Math.min(72, panelHeight);
    const maxLeft = Math.max(0, window.innerWidth - Math.min(70, panelWidth));
    const maxTop = Math.max(0, window.innerHeight - keepVisible);

    const left = clamp(
      state.drag.left + event.clientX - state.drag.x,
      Math.min(0, 70 - panelWidth),
      maxLeft
    );
    const top = clamp(
      state.drag.top + event.clientY - state.drag.y,
      0,
      maxTop
    );

    refs.panel.style.left = `${left}px`;
    refs.panel.style.top = `${top}px`;
    refs.panel.style.right = "auto";
    refs.panel.style.bottom = "auto";
    event.preventDefault();
  }

  function endDrag(event) {
    if (!state.drag) return;
    if (event?.pointerId != null && event.pointerId !== state.drag.pointerId) return;
    state.drag = null;
    refs.panel.classList.remove("ct-vd-dragging");
    savePanelState();
  }

  function toggleMinimize() {
    state.minimized = !state.minimized;
    refs.panel.classList.toggle("ct-vd-minimized", state.minimized);
    refs.minimize.setAttribute("aria-expanded", String(!state.minimized));
    refs.minimize.textContent = state.minimized ? "▢" : "—";
    savePanelState();
  }

  function createControl(config) {
    const row = document.createElement("div");
    row.className = "ct-vd-control";
    row.innerHTML = `
      <label>${config.label}</label>
      <input class="ct-vd-range" type="range" min="${config.min}" max="${config.max}" step="${config.step}">
      <input class="ct-vd-value" type="number" min="${config.min}" max="${config.max}" step="${config.step}">
    `;
    const range = row.children[1];
    const number = row.children[2];

    const apply = raw => {
      const value = clamp(raw, config.min, config.max);
      range.value = value;
      number.value = value;
      setDeclaration(config.key, formatPropertyValue(config, value));
      updateHighlight();
    };
    range.addEventListener("input", () => apply(range.value));
    number.addEventListener("change", () => apply(number.value));
    refs.controls.set(config.key, { range, number });
    return row;
  }

  function buildPanel() {
    const fab = document.createElement("button");
    fab.id = "ct-vd-fab";
    fab.type = "button";
    fab.title = "Visual Debug Panel (Ctrl+Shift+D)";
    fab.setAttribute("aria-label", "Otevřít Visual Debug Panel");
    fab.textContent = "🛠";

    const panel = document.createElement("aside");
    panel.id = "ct-vd-panel";
    panel.hidden = true;
    panel.innerHTML = `
      <div class="ct-vd-head">
        <div class="ct-vd-title">
          <strong>Visual Debug</strong>
          <small id="ct-vd-target-name">Žádný prvek</small>
        </div>
        <button class="ct-vd-icon-btn" id="ct-vd-undo" type="button" title="Zpět">↶</button>
        <button class="ct-vd-icon-btn" id="ct-vd-minimize" type="button" title="Sbalit panel" aria-expanded="true">—</button>
        <button class="ct-vd-icon-btn" id="ct-vd-close" type="button" title="Zavřít">×</button>
      </div>
      <div class="ct-vd-body">
        <section class="ct-vd-section">
          <div class="ct-vd-section-title"><span>Výběr prvku</span><span id="ct-vd-profile-badge"></span></div>
          <div class="ct-vd-target">
            <input id="ct-vd-selector" class="ct-vd-selector" type="text" placeholder="#id nebo .class">
            <button id="ct-vd-resolve" class="ct-vd-btn" type="button">Použít</button>
          </div>
          <div class="ct-vd-actions" style="margin-top:8px !important">
            <button id="ct-vd-pick" class="ct-vd-btn primary" type="button">Vybrat prvek</button>
            <select id="ct-vd-profile" class="ct-vd-select" aria-label="Profil">
              <option value="mobile">Mobil ≤899</option>
              <option value="desktop">Desktop ≥900</option>
              <option value="all">Všechny velikosti</option>
            </select>
          </div>
        </section>

        <div class="ct-vd-tabs">
          <button class="ct-vd-tab active" data-tab="layout" type="button">Rozměry</button>
          <button class="ct-vd-tab" data-tab="text" type="button">Text</button>
          <button class="ct-vd-tab" data-tab="style" type="button">Styl</button>
          <button class="ct-vd-tab" data-tab="position" type="button">Pozice</button>
        </div>

        <section class="ct-vd-section ct-vd-pane" data-pane="layout"><div id="ct-vd-layout-controls"></div></section>
        <section class="ct-vd-section ct-vd-pane" data-pane="text" hidden>
          <div id="ct-vd-text-controls"></div>
          <div class="ct-vd-control">
            <label>Zarovnání</label>
            <select id="ct-vd-text-align" class="ct-vd-select">
              <option value="left">Vlevo</option><option value="center">Na střed</option><option value="right">Vpravo</option><option value="justify">Do bloku</option>
            </select><span></span>
          </div>
        </section>
        <section class="ct-vd-section ct-vd-pane" data-pane="style" hidden>
          <div id="ct-vd-style-controls"></div>
          <div class="ct-vd-color-row">
            <label class="ct-vd-color-field">Text <input id="ct-vd-text-color" type="color"></label>
            <label class="ct-vd-color-field">Pozadí <input id="ct-vd-bg-color" type="color"></label>
            <label class="ct-vd-color-field">Rámeček <input id="ct-vd-border-color" type="color"></label>
            <label class="ct-vd-color-field">Glow <input id="ct-vd-glow-color" type="color"></label>
          </div>
        </section>
        <section class="ct-vd-section ct-vd-pane" data-pane="position" hidden>
          <div id="ct-vd-position-controls"></div>
          <div class="ct-vd-control">
            <label>Display</label>
            <select id="ct-vd-display" class="ct-vd-select">
              <option value="block">block</option><option value="flex">flex</option><option value="grid">grid</option><option value="inline-flex">inline-flex</option><option value="none">none</option>
            </select><span></span>
          </div>
        </section>

        <section class="ct-vd-section">
          <div class="ct-vd-section-title">Pomůcky</div>
          <div class="ct-vd-actions three">
            <button id="ct-vd-grid-btn" class="ct-vd-btn" type="button">Mřížka</button>
            <button id="ct-vd-outline-btn" class="ct-vd-btn" type="button">Obrysy</button>
            <button id="ct-vd-refresh" class="ct-vd-btn" type="button">Přeměřit</button>
          </div>
        </section>

        <section class="ct-vd-section">
          <div class="ct-vd-section-title">Uložit / exportovat</div>
          <div class="ct-vd-actions three">
            <button id="ct-vd-copy" class="ct-vd-btn primary" type="button">Kopírovat celé CSS</button>
            <button id="ct-vd-download" class="ct-vd-btn" type="button">Stáhnout celé CSS</button>
            <button id="ct-vd-json" class="ct-vd-btn" type="button">Export preset</button>
          </div>
          <div class="ct-vd-actions three" style="margin-top:7px !important">
            <button id="ct-vd-snapshot-save" class="ct-vd-btn" type="button">Uložit snapshot</button>
            <button id="ct-vd-snapshot-load" class="ct-vd-btn" type="button">Obnovit snapshot</button>
            <button id="ct-vd-import" class="ct-vd-btn" type="button">Import preset</button>
          </div>
          <input id="ct-vd-file" type="file" accept="application/json,.json" hidden>
        </section>

        <section class="ct-vd-section">
          <div class="ct-vd-section-title">Reset</div>
          <div class="ct-vd-actions">
            <button id="ct-vd-reset-selected" class="ct-vd-btn" type="button">Reset prvku</button>
            <button id="ct-vd-reset-all" class="ct-vd-btn danger" type="button">Reset všeho</button>
          </div>
        </section>

        <section class="ct-vd-section">
          <div class="ct-vd-info">
            <div>Viewport: <b id="ct-vd-viewport">–</b></div>
            <div>Režim: <b id="ct-vd-breakpoint">–</b></div>
            <div>Vlastnosti prvku: <b id="ct-vd-rule-count">0</b></div>
            <div>Upravené selektory: <b id="ct-vd-total-count">0</b></div>
          </div>
        </section>
      </div>
    `;

    const highlight = document.createElement("div");
    highlight.id = "ct-vd-highlight";
    highlight.hidden = true;
    const measure = document.createElement("div");
    measure.id = "ct-vd-measure";
    measure.hidden = true;
    const toastEl = document.createElement("div");
    toastEl.id = "ct-vd-toast";
    toastEl.hidden = true;
    const grid = document.createElement("div");
    grid.id = "ct-vd-grid";
    grid.hidden = true;

    document.body.append(fab, panel, highlight, measure, toastEl, grid);

    refs = {
      fab,
      panel,
      head: panel.querySelector(".ct-vd-head"),
      close: panel.querySelector("#ct-vd-close"),
      minimize: panel.querySelector("#ct-vd-minimize"),
      undo: panel.querySelector("#ct-vd-undo"),
      targetName: panel.querySelector("#ct-vd-target-name"),
      selector: panel.querySelector("#ct-vd-selector"),
      resolve: panel.querySelector("#ct-vd-resolve"),
      pickBtn: panel.querySelector("#ct-vd-pick"),
      profile: panel.querySelector("#ct-vd-profile"),
      tabs: [...panel.querySelectorAll(".ct-vd-tab")],
      panes: [...panel.querySelectorAll(".ct-vd-pane")],
      controls: new Map(),
      textAlign: panel.querySelector("#ct-vd-text-align"),
      display: panel.querySelector("#ct-vd-display"),
      textColor: panel.querySelector("#ct-vd-text-color"),
      bgColor: panel.querySelector("#ct-vd-bg-color"),
      borderColor: panel.querySelector("#ct-vd-border-color"),
      glowColor: panel.querySelector("#ct-vd-glow-color"),
      highlight,
      measure,
      toast: toastEl,
      grid,
      gridBtn: panel.querySelector("#ct-vd-grid-btn"),
      outlineBtn: panel.querySelector("#ct-vd-outline-btn"),
      viewport: panel.querySelector("#ct-vd-viewport"),
      breakpoint: panel.querySelector("#ct-vd-breakpoint"),
      ruleCount: panel.querySelector("#ct-vd-rule-count"),
      totalCount: panel.querySelector("#ct-vd-total-count")
    };

    propertyConfig.forEach(config => {
      const host = panel.querySelector(`#ct-vd-${config.tab}-controls`);
      host?.appendChild(createControl(config));
    });

    wireEvents();
  }

  function wireEvents() {
    refs.fab.addEventListener("click", () => togglePanel());
    refs.close.addEventListener("click", () => togglePanel(false));
    refs.minimize.addEventListener("click", toggleMinimize);
    refs.undo.addEventListener("click", undo);
    refs.pickBtn.addEventListener("click", () => setPicking(!state.picking));
    refs.resolve.addEventListener("click", resolveSelector);
    refs.selector.addEventListener("keydown", event => { if (event.key === "Enter") resolveSelector(); });

    refs.profile.addEventListener("change", () => {
      state.profile = refs.profile.value;
      syncControls();
      updateRuleInfo();
      savePanelState();
    });

    refs.tabs.forEach(button => button.addEventListener("click", () => activateTab(button.dataset.tab)));

    refs.textAlign.addEventListener("change", () => setDeclaration("text-align", refs.textAlign.value));
    refs.display.addEventListener("change", () => setDeclaration("display", refs.display.value));
    refs.textColor.addEventListener("input", () => setDeclaration("color", refs.textColor.value));
    refs.bgColor.addEventListener("input", () => setDeclaration("background-color", refs.bgColor.value));
    refs.borderColor.addEventListener("input", () => setDeclaration("border-color", refs.borderColor.value));
    refs.glowColor.addEventListener("input", () => setDeclaration("--ct-vd-glow-color", refs.glowColor.value));

    refs.gridBtn.addEventListener("click", () => {
      state.grid = !state.grid;
      refs.grid.hidden = !state.grid;
      refs.gridBtn.classList.toggle("active", state.grid);
    });
    refs.outlineBtn.addEventListener("click", () => {
      state.outlines = !state.outlines;
      document.body.classList.toggle("ct-vd-outlines", state.outlines);
      refs.outlineBtn.classList.toggle("active", state.outlines);
    });
    refs.panel.querySelector("#ct-vd-refresh").addEventListener("click", () => { syncControls(); updateHighlight(); });

    refs.panel.querySelector("#ct-vd-copy").addEventListener("click", copyCss);
    refs.panel.querySelector("#ct-vd-download").addEventListener("click", downloadCss);
    refs.panel.querySelector("#ct-vd-json").addEventListener("click", downloadJson);
    refs.panel.querySelector("#ct-vd-snapshot-save").addEventListener("click", saveSnapshot);
    refs.panel.querySelector("#ct-vd-snapshot-load").addEventListener("click", restoreSnapshot);
    refs.panel.querySelector("#ct-vd-import").addEventListener("click", () => refs.panel.querySelector("#ct-vd-file").click());
    refs.panel.querySelector("#ct-vd-file").addEventListener("change", event => importPreset(event.target.files?.[0]));
    refs.panel.querySelector("#ct-vd-reset-selected").addEventListener("click", resetSelected);
    refs.panel.querySelector("#ct-vd-reset-all").addEventListener("click", resetAll);

    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("click", onPick, true);
    window.addEventListener("scroll", () => state.panelOpen && updateHighlight(), true);
    window.addEventListener("resize", () => { updateRuleInfo(); state.panelOpen && updateHighlight(); });
    document.addEventListener("keydown", event => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        togglePanel();
      }
      if (event.key === "Escape" && state.picking) setPicking(false);
    });

    refs.head.addEventListener("pointerdown", startDrag);
    window.addEventListener("pointermove", moveDrag);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  }

  function init() {
    renderRuntimeCss();
    buildPanel();
    restorePanelState();
    updateRuleInfo();

    // Useful initial target.
    const initial = document.querySelector("#algorithm-card-wrap") || document.querySelector("#app") || document.body;
    selectElement(initial);

    // Public helpers for console debugging.
    window.CubeTrainerVisualDebug = {
      open: () => togglePanel(true),
      close: () => togglePanel(false),
      select: selector => {
        refs.selector.value = selector;
        resolveSelector();
      },
      exportCss: generateCss,
      resetAll
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
