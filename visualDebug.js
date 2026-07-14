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
  const COMMITTED_CSS_KEY = "cubeTrainer.visualDebug.committedCss.v1";
  const STYLE_ID = "ct-vd-runtime-style";
  const COMMITTED_STYLE_ID = "ct-vd-committed-style";
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
    unlocked: false,
    unlockClicks: [],
    grid: false,
    outlines: false,
    activeTab: "layout",
    drag: null,
    pickGesture: null,
    suppressClickUntil: 0,
    minimized: false,
    panelOpacity: 0.92,
    history: [],
    activeProperty: "",
    quickDrag: null,
    quickMoved: false,
    quickPressDelay: null,
    quickPressInterval: null,
    quickPressPointerId: null,
    showMeasure: true,
    cssFileHandle: null,
    exportSection: "START SCREEN"
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

    /*
     * Prefer a short, stable selector anchored to the nearest parent ID.
     * Example: #selectedAlg .alg-title
     * This is more readable and more reliable than nth-of-type selectors.
     */
    const stableClasses = [...element.classList]
      .filter(name => !name.startsWith("active") && !name.startsWith("open") && !name.startsWith("hidden"))
      .slice(0, 3);
    const idParent = element.parentElement?.closest?.("[id]");

    if (idParent && stableClasses.length) {
      const anchored = `#${cssEscape(idParent.id)} ${stableClasses.map(name => `.${cssEscape(name)}`).join("")}`;
      try {
        if (document.querySelectorAll(anchored).length === 1) return anchored;
      } catch (_) {}
    }

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

  function ensureCommittedStyleElement() {
    let style = document.getElementById(COMMITTED_STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = COMMITTED_STYLE_ID;
      document.head.appendChild(style);
    }
    return style;
  }

  function renderCommittedCss() {
    const css = localStorage.getItem(COMMITTED_CSS_KEY) || "";
    ensureCommittedStyleElement().textContent = css;
  }

  function saveCommittedCss(cssText) {
    localStorage.setItem(COMMITTED_CSS_KEY, cssText);
    ensureCommittedStyleElement().textContent = cssText;
  }

  function clearCommittedCss() {
    localStorage.removeItem(COMMITTED_CSS_KEY);
    ensureCommittedStyleElement().textContent = "";
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

  function boostedSelector(selector) {
    const value = String(selector || "").trim();
    if (!value || value === ":root") return value;

    /*
     * Existing application CSS contains several highly-specific !important
     * rules (for example #selectedAlg .alg-title). Two :is() wrappers add
     * enough specificity for Visual Debug declarations to win reliably,
     * while still matching exactly the originally selected element.
     */
    return `:is(#ct-vd-specificity-a, ${value}):is(#ct-vd-specificity-b, ${value})`;
  }

  function profileCss(profile) {
    const rules = state.rules[profile] || {};
    return Object.entries(rules)
      .filter(([, declarations]) => declarations && Object.keys(declarations).length)
      .map(([selector, declarations]) => {
        const css = declarationsToCss(declarations);
        const runtimeSelector = boostedSelector(selector);
        return css ? `${runtimeSelector} {\n${css}\n}` : "";
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

  function currentSelectorCss() {
    if (!state.selector) return "";
    const declarations = currentRule(false);
    if (!declarations || !Object.keys(declarations).length) return "";
    const css = declarationsToCss(declarations);
    return `${boostedSelector(state.selector)} {\n${css}\n}`;
  }

  const CSS_SECTION_ALIASES = {
    "START SCREEN": ["START SCREEN", "START OBRAZOVKA", "STARTOVNI OBRAZOVKA", "START OBRAZOVKA MOBIL"],
    "TIMER": ["TIMER"],
    "STATISTICS": ["STATISTICS", "STATISTIKY"],
    "SETTINGS": ["SETTINGS", "NASTAVENI"],
    "HISTORY / AO PANELS": ["HISTORY / AO PANELS", "HISTORIE / AO PANELY", "HISTORY AO PANELS", "HISTORIE AO PANELY"],
    "OLL MENU": ["OLL MENU", "OLL VYBER"],
    "PLL MENU": ["PLL MENU", "PLL VYBER"],
    "ALGORITHM IMAGES": ["ALGORITHM IMAGES", "OBRAZKY ALGORITMU"],
    "DIALOGS / MODALS": ["DIALOGS / MODALS", "DIALOGY A MODALY", "DIALOGY MODALY"]
  };

  function normalizeSectionLabel(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function sectionAliases(section) {
    const aliases = CSS_SECTION_ALIASES[section] || [section];
    return aliases.map(normalizeSectionLabel).filter(Boolean);
  }

  function cssComments(fileText) {
    const comments = [];
    const regex = /\/\*[\s\S]*?\*\//g;
    let match;
    while ((match = regex.exec(fileText))) {
      comments.push({ index: match.index, end: regex.lastIndex, text: match[0] });
    }
    return comments;
  }

  function sectionMatchScore(commentText, section) {
    const aliases = sectionAliases(section);
    const lines = commentText
      .replace(/^\/\*|\*\/$/g, "")
      .split(/\r?\n/)
      .map(normalizeSectionLabel)
      .filter(Boolean);

    let score = 0;
    for (const line of lines) {
      for (const alias of aliases) {
        if (line === alias) score = Math.max(score, 100);
        else if (line.startsWith(`${alias} `) && !line.includes("VISUAL DEBUG EXPORT")) score = Math.max(score, 60);
      }
    }
    return score;
  }

  function findSectionHeading(fileText, section) {
    let best = null;
    for (const comment of cssComments(fileText)) {
      const score = sectionMatchScore(comment.text, section);
      if (!score) continue;
      if (!best || score > best.score || (score === best.score && comment.index < best.index)) {
        best = { ...comment, score };
      }
    }
    return best;
  }

  function findNextSectionStart(fileText, currentHeading) {
    const headings = Object.keys(CSS_SECTION_ALIASES)
      .map(section => findSectionHeading(fileText, section))
      .filter(Boolean)
      .filter((heading, index, all) => all.findIndex(item => item.index === heading.index) === index)
      .sort((a, b) => a.index - b.index);

    return headings.find(heading => heading.index > currentHeading.index)?.index ?? -1;
  }

  function sectionHeadingComment(section) {
    return `\n\n  /* =====================================================\n     ${section}\n  ===================================================== */\n`;
  }

  function replaceOrInsertRuleInSection(fileText, section, selector, ruleCss) {
    let heading = findSectionHeading(fileText, section);
    let createdSection = false;

    if (!heading) {
      const insertionPoint = fileText.lastIndexOf("}");
      const safePoint = insertionPoint >= 0 ? insertionPoint : fileText.length;
      const headingText = sectionHeadingComment(section);
      fileText = fileText.slice(0, safePoint) + headingText + "\n" + fileText.slice(safePoint);
      heading = findSectionHeading(fileText, section);
      createdSection = true;
    }

    if (!heading) throw new Error(`Sekci ${section} se nepodařilo vytvořit`);

    const sectionStart = heading.end;
    const nextSectionStart = findNextSectionStart(fileText, heading);
    const finalBrace = fileText.lastIndexOf("}");
    const sectionEnd = nextSectionStart >= 0
      ? nextSectionStart
      : (finalBrace >= sectionStart ? finalBrace : fileText.length);
    const sectionText = fileText.slice(sectionStart, sectionEnd);
    const markerKey = encodeURIComponent(selector);
    const startMarker = `/* CT-VD:${markerKey} */`;
    const endMarker = `/* /CT-VD:${markerKey} */`;
    const managedBlock = `${startMarker}\n${ruleCss}\n${endMarker}`;

    const markerStart = sectionText.indexOf(startMarker);
    if (markerStart >= 0) {
      const markerEnd = sectionText.indexOf(endMarker, markerStart);
      if (markerEnd >= 0) {
        const after = markerEnd + endMarker.length;
        const updated = sectionText.slice(0, markerStart) + managedBlock + sectionText.slice(after);
        return {
          text: fileText.slice(0, sectionStart) + updated + fileText.slice(sectionEnd),
          createdSection,
          replaced: true
        };
      }
    }

    const selectorIndex = sectionText.indexOf(selector);
    if (selectorIndex >= 0) {
      let blockStart = sectionText.lastIndexOf("}", selectorIndex);
      blockStart = blockStart < 0 ? 0 : blockStart + 1;
      while (blockStart < selectorIndex && /\s/.test(sectionText[blockStart])) blockStart++;
      const openBrace = sectionText.indexOf("{", selectorIndex);
      if (openBrace >= 0) {
        let depth = 0;
        let blockEnd = -1;
        for (let i = openBrace; i < sectionText.length; i++) {
          if (sectionText[i] === "{") depth++;
          if (sectionText[i] === "}") {
            depth--;
            if (depth === 0) { blockEnd = i + 1; break; }
          }
        }
        if (blockEnd > 0) {
          const updated = sectionText.slice(0, blockStart) + managedBlock + sectionText.slice(blockEnd);
          return {
            text: fileText.slice(0, sectionStart) + updated + fileText.slice(sectionEnd),
            createdSection,
            replaced: true
          };
        }
      }
    }

    const spacer = sectionText.trim() ? "\n\n" : "\n";
    const updated = sectionText.replace(/\s*$/, "") + spacer + managedBlock + "\n\n";
    return {
      text: fileText.slice(0, sectionStart) + updated + fileText.slice(sectionEnd),
      createdSection,
      replaced: false
    };
  }

  async function chooseCssFile() {
    if (!("showOpenFilePicker" in window)) {
      toast("Přímý zápis zde není podporovaný – použij kopírování");
      return null;
    }
    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{ description: "CSS soubor", accept: { "text/css": [".css"] } }]
      });
      state.cssFileHandle = handle;
      refs.cssFileStatus.textContent = handle.name || "CSS připojeno";
      toast(`Připojeno: ${handle.name}`);
      return handle;
    } catch (error) {
      if (error?.name !== "AbortError") toast("Soubor se nepodařilo připojit");
      return null;
    }
  }



function reloadConnectedDebugStylesheet(expectedSelector = "", expectedCssText = "") {
  const stylesheet = Array.from(
    document.querySelectorAll('link[rel="stylesheet"]')
  ).find((link) => {
    const href = link.getAttribute("href") || "";
    return href.includes("debugMobile.css");
  });

  if (!stylesheet) {
    return Promise.resolve({ reloaded: false, servedMatches: false });
  }

  const currentHref = stylesheet.getAttribute("href") || "debugMobile.css";
  const cleanHref = currentHref.split("?")[0];
  const refreshedHref = `${cleanHref}?vd=${Date.now()}`;

  return new Promise((resolve) => {
    let finished = false;

    const finish = async () => {
      if (finished) return;
      finished = true;
      stylesheet.removeEventListener("load", finish);
      stylesheet.removeEventListener("error", finish);

      let servedMatches = false;
      if (expectedSelector) {
        try {
          const response = await fetch(`${cleanHref}?vdcheck=${Date.now()}`, { cache: "no-store" });
          const servedCss = await response.text();
          const marker = `/* CT-VD:${encodeURIComponent(expectedSelector)} */`;
          const normalizedServed = servedCss.trim().replace(/\r\n/g, "\n");
          const normalizedExpected = String(expectedCssText).trim().replace(/\r\n/g, "\n");
          servedMatches = response.ok && (
            normalizedExpected
              ? normalizedServed === normalizedExpected
              : servedCss.includes(marker)
          );
        } catch (_) {
          servedMatches = false;
        }
      }

      resolve({ reloaded: true, servedMatches });
    };

    stylesheet.addEventListener("load", finish);
    stylesheet.addEventListener("error", finish);
    stylesheet.setAttribute("href", refreshedHref);

    setTimeout(finish, 1500);
  });
}



  async function saveCurrentRuleToCssFile() {
    if (!state.selector) { toast("Nejdřív vyber prvek"); return; }
    const ruleCss = currentSelectorCss();
    if (!ruleCss) { toast("Vybraný prvek nemá žádnou úpravu"); return; }
    const handle = state.cssFileHandle || await chooseCssFile();
    if (!handle) {
      await copyCurrentRule();
      return;
    }
    try {
      const file = await handle.getFile();
      const original = await file.text();
      const result = replaceOrInsertRuleInSection(original, state.exportSection, state.selector, ruleCss);
      const writable = await handle.createWritable();
      await writable.write(result.text);
      await writable.close();

      /* Ověříme, že se skutečně změnil soubor vybraný přes Android picker. */
      const verifiedFile = await handle.getFile();
      const verifiedText = await verifiedFile.text();
      if (verifiedText !== result.text) {
        throw new Error("Vybraný CSS soubor se nepodařilo ověřit po zápisu");
      }

      /*
       * Android/Spck může přes picker otevřít jinou kopii souboru, než jakou
       * localhost právě servíruje. Uložené CSS proto zároveň zrcadlíme do
       * samostatného trvalého style tagu. Reset debug pravidel toto zrcadlo
       * nesmaže, takže uložená úprava po Reset všeho zůstane viditelná.
       */
      saveCommittedCss(verifiedText);

      const reloadResult = await reloadConnectedDebugStylesheet(state.selector, verifiedText);

      const action = result.replaced ? "Přepsáno" : "Uloženo";
      const suffix = result.createdSection
        ? " (sekce byla vytvořena)"
        : "";

      if (reloadResult.servedMatches) {
        clearCommittedCss();
        toast(`${action} do ${state.exportSection}${suffix} a načteno z CSS`);
      } else {
        toast(`${action}${suffix}. Localhost používá jinou kopii; aktivní přes uložené zrcadlo`);
      }
    } catch (error) {
      console.error(error);
      toast(error?.message || "Přímý zápis selhal");
    }
  }

  async function copyCurrentRule() {
    const css = currentSelectorCss();
    if (!css) { toast("Vybraný prvek nemá žádnou úpravu"); return; }
    const text = `/* Sekce: ${state.exportSection} */\n${css}\n`;
    try {
      await navigator.clipboard.writeText(text);
      toast("CSS aktuálního prvku zkopírováno");
    } catch (_) {
      downloadText("visualDebug-current-rule.css", text);
      toast("CSS aktuálního prvku staženo");
    }
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
    refs.measure.hidden = !state.showMeasure;
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

    /* Na dotykovém zařízení během scrollování nic nevybíráme. */
    if (event.pointerType === "touch") {
      if (state.pickGesture && event.pointerId === state.pickGesture.pointerId) {
        const dx = event.clientX - state.pickGesture.x;
        const dy = event.clientY - state.pickGesture.y;
        if (Math.hypot(dx, dy) > 10) state.pickGesture.moved = true;
      }
      return;
    }

    const target = event.target instanceof Element ? event.target : null;
    if (!target || isInternal(target)) return;
    state.hoverTarget = target;
    state.selector = uniqueSelector(target);
    updateHighlight(target);
  }

  function startPickGesture(event) {
    if (!state.picking) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target || isInternal(target)) return;

    state.pickGesture = {
      pointerId: event.pointerId,
      target,
      x: event.clientX,
      y: event.clientY,
      moved: false,
      startedAt: performance.now()
    };
  }

  function finishPickGesture(event) {
    if (!state.picking || !state.pickGesture) return;
    if (event.pointerId !== state.pickGesture.pointerId) return;

    const gesture = state.pickGesture;
    state.pickGesture = null;

    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    const moved = gesture.moved || Math.hypot(dx, dy) > 10;
    const tooLong = performance.now() - gesture.startedAt > 900;

    /* Scroll, tah nebo dlouhé podržení nikdy nesmí změnit vybraný prvek. */
    if (moved || tooLong) return;

    const target = document.elementFromPoint(event.clientX, event.clientY) || gesture.target;
    if (!(target instanceof Element) || isInternal(target)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    state.suppressClickUntil = performance.now() + 500;
    selectElement(target);
    setPicking(false);
  }

  function cancelPickGesture(event) {
    if (!state.pickGesture) return;
    if (event?.pointerId != null && event.pointerId !== state.pickGesture.pointerId) return;
    state.pickGesture = null;
  }

  function suppressPostPickClick(event) {
    if (performance.now() > state.suppressClickUntil) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }


  function elementOptionLabel(element, selector) {
    const text = String(element.getAttribute("aria-label") || element.textContent || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 42);
    return text ? `${selector} — ${text}` : selector;
  }

  function refreshElementList() {
    if (!refs.elementList) return;

    const previous = refs.elementList.value;
    const seen = new Set();
    const items = [];
    const candidates = document.querySelectorAll(
      "body *:not(script):not(style):not(link):not(meta):not(option)"
    );

    candidates.forEach(element => {
      if (!(element instanceof HTMLElement) || isInternal(element)) return;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") return;
      if (rect.width < 2 || rect.height < 2) return;

      const selector = uniqueSelector(element);
      if (!selector || seen.has(selector)) return;
      seen.add(selector);
      items.push({ selector, label: elementOptionLabel(element, selector) });
    });

    items.sort((a, b) => a.label.localeCompare(b.label, "cs"));
    refs.elementList.innerHTML = '<option value="">— vyber prvek na obrazovce —</option>';

    items.forEach(item => {
      const option = document.createElement("option");
      option.value = item.selector;
      option.textContent = item.label;
      refs.elementList.appendChild(option);
    });

    if (items.some(item => item.selector === previous)) refs.elementList.value = previous;
  }

  function selectFromElementList() {
    const selector = refs.elementList?.value;
    if (!selector) return;
    refs.selector.value = selector;
    resolveSelector();
  }

  function unlockFromSecretClicks() {
    const targets = [
      { element: document.querySelector(".start-screen__logo"), clicks: 5 },
      { element: document.getElementById("puzzleModeBtn"), clicks: 4 }
    ].filter(item => item.element);

    targets.forEach(({ element, clicks }) => {
      element.addEventListener("click", () => {
        const now = performance.now();
        state.unlockClicks = state.unlockClicks.filter(time => now - time < 2200);
        state.unlockClicks.push(now);

        if (state.unlockClicks.length >= clicks) {
          state.unlockClicks = [];
          state.unlocked = true;
          setDebugUiVisible(true, true);
          refreshElementList();
          updateRuleInfo();
          toast("Visual Debug odemčen");
        }
      }, true);
    });
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
    if (!state.unlocked && force !== false) {
      state.unlocked = true;
    }

    const nextOpen = typeof force === "boolean" ? force : !state.panelOpen;
    setDebugUiVisible(nextOpen, state.unlocked);

    if (state.panelOpen) {
      refreshElementList();
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
      minimized: state.minimized,
      opacity: state.panelOpacity,
      showMeasure: state.showMeasure,
      exportSection: state.exportSection
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
      setPanelPosition(
        Number.parseFloat(data.left) || 0,
        Number.parseFloat(data.top) || 12
      );
    }
    state.showMeasure = data.showMeasure !== false;
    state.exportSection = data.exportSection || "START SCREEN";
    refs.toggleMeasure.textContent = state.showMeasure ? "Skrýt název objektu" : "Zobrazit název objektu";
    refs.exportSection.value = state.exportSection;
    state.minimized = Boolean(data.minimized);
    refs.panel.classList.toggle("ct-vd-minimized", state.minimized);
    refs.minimize?.setAttribute("aria-expanded", String(!state.minimized));
    refs.minimize && (refs.minimize.textContent = state.minimized ? "▢" : "—");

    const storedOpacity = Number(data.opacity);
    state.panelOpacity = Number.isFinite(storedOpacity)
      ? clamp(storedOpacity, 0.35, 1)
      : 0.92;
    applyPanelOpacity(state.panelOpacity, false);

    /* Debug je tajný: po každém načtení zůstane zavřený a bez FAB. */
    setDebugUiVisible(false, false);
  }

  function applyPanelOpacity(value, persist = true) {
    state.panelOpacity = clamp(value, 0.35, 1);
    refs.panel.style.setProperty("--ct-vd-panel-opacity", String(state.panelOpacity));
    if (refs.panelOpacity) refs.panelOpacity.value = String(Math.round(state.panelOpacity * 100));
    if (refs.panelOpacityValue) refs.panelOpacityValue.textContent = `${Math.round(state.panelOpacity * 100)} %`;
    if (persist) savePanelState();
  }

  function setPanelPosition(left, top) {
    refs.panel.style.setProperty("left", `${Math.round(left)}px`, "important");
    refs.panel.style.setProperty("top", `${Math.round(top)}px`, "important");
    refs.panel.style.setProperty("right", "auto", "important");
    refs.panel.style.setProperty("bottom", "auto", "important");
  }

  function setDebugUiVisible(open, unlocked = state.unlocked) {
    state.panelOpen = Boolean(open);
    state.unlocked = Boolean(unlocked);

    if (state.unlocked) {
      refs.quickbar.hidden = false;
      refs.quickbar.style.removeProperty("display");
    } else {
      refs.quickbar.hidden = true;
      refs.quickbar.style.setProperty("display", "none", "important");
    }

    if (state.panelOpen && state.unlocked) {
      refs.panel.hidden = false;
      refs.panel.style.removeProperty("display");
    } else {
      refs.panel.hidden = true;
      refs.panel.style.setProperty("display", "none", "important");
    }

    refs.fab.setAttribute("aria-expanded", String(state.panelOpen));
  }

  function centerPanel() {
    const rect = refs.panel.getBoundingClientRect();
    const left = Math.max(0, Math.round((window.innerWidth - rect.width) / 2));
    const top = Math.max(0, Math.round((window.innerHeight - Math.min(rect.height, window.innerHeight)) / 2));
    setPanelPosition(left, top);
    savePanelState();
  }

  function resetPanelPosition() {
    refs.panel.style.setProperty("left", "auto", "important");
    refs.panel.style.setProperty("top", "12px", "important");
    refs.panel.style.setProperty("right", "12px", "important");
    refs.panel.style.setProperty("bottom", "auto", "important");
    savePanelState();
  }

  function activateTab(tab) {
    state.activeTab = tab;
    refs.tabs.forEach(button => button.classList.toggle("active", button.dataset.tab === tab));
    refs.panes.forEach(pane => { pane.hidden = pane.dataset.pane !== tab; });
    savePanelState();
  }

  function dragPointFromEvent(event) {
    const touch = event.touches?.[0] || event.changedTouches?.[0];
    return touch
      ? { x: touch.clientX, y: touch.clientY, id: "touch" }
      : { x: event.clientX, y: event.clientY, id: event.pointerId ?? "mouse" };
  }

  function startDrag(event) {
    if (state.drag) return;
    if (event.button != null && event.button !== 0) return;
    if (event.target.closest("button, input, select, textarea, label, a")) return;

    const point = dragPointFromEvent(event);
    const rect = refs.panel.getBoundingClientRect();
    state.drag = {
      pointerId: point.id,
      x: point.x,
      y: point.y,
      left: rect.left,
      top: rect.top
    };

    refs.panel.classList.add("ct-vd-dragging");
    if (event.pointerId != null) {
      try { refs.head.setPointerCapture?.(event.pointerId); } catch (_) {}
    }
    event.preventDefault();
    event.stopPropagation();
  }

  function moveDrag(event) {
    if (!state.drag) return;
    const point = dragPointFromEvent(event);
    if (state.drag.pointerId !== point.id && state.drag.pointerId !== "touch") return;

    const panelWidth = refs.panel.offsetWidth;
    const panelHeight = refs.panel.offsetHeight;
    const keepVisible = Math.min(72, panelHeight);
    const maxLeft = Math.max(0, window.innerWidth - Math.min(70, panelWidth));
    const maxTop = Math.max(0, window.innerHeight - keepVisible);

    const left = clamp(
      state.drag.left + point.x - state.drag.x,
      Math.min(0, 70 - panelWidth),
      maxLeft
    );
    const top = clamp(
      state.drag.top + point.y - state.drag.y,
      0,
      maxTop
    );

    setPanelPosition(left, top);
    event.preventDefault();
    event.stopPropagation();
  }

  function endDrag(event) {
    if (!state.drag) return;
    const point = dragPointFromEvent(event || {});
    if (event?.pointerId != null && state.drag.pointerId !== point.id) return;
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

  function activePropertyConfig() {
    return propertyConfig.find(config => config.key === state.activeProperty) || null;
  }

  function setActiveProperty(config) {
    if (!config) return;
    state.activeProperty = config.key;
    refs.quickLabel.textContent = config.label;
    refs.quickbar.dataset.ready = state.selected ? "true" : "false";
    refs.controls.forEach((control, key) => {
      control.row?.classList.toggle("ct-vd-control-active", key === config.key);
    });
  }

  function adjustActiveProperty(direction) {
    const config = activePropertyConfig();
    if (!state.selected || !state.selector) {
      toast("Nejdřív vyber prvek");
      return false;
    }
    if (!config) {
      toast("Nejdřív klepni na parametr v panelu");
      return false;
    }

    const current = valueForControl(config);
    const decimals = config.step < 1 ? 2 : 0;
    const next = Number(clamp(current + direction * config.step, config.min, config.max).toFixed(decimals));
    setDeclaration(config.key, formatPropertyValue(config, next));

    const control = refs.controls.get(config.key);
    if (control) {
      control.range.value = next;
      control.number.value = next;
    }
    updateHighlight();
    refs.quickValue.textContent = `${next}${config.unit}`;
    return true;
  }

  function stopQuickPressRepeat() {
    if (state.quickPressDelay) clearTimeout(state.quickPressDelay);
    if (state.quickPressInterval) clearInterval(state.quickPressInterval);
    state.quickPressDelay = null;
    state.quickPressInterval = null;
    state.quickPressPointerId = null;
    refs.quickMinus?.classList.remove("ct-vd-quick-pressing");
    refs.quickPlus?.classList.remove("ct-vd-quick-pressing");
  }

  function startQuickPressRepeat(event, direction) {
    if (event.button != null && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    stopQuickPressRepeat();

    if (!adjustActiveProperty(direction)) return;

    const button = event.currentTarget;
    state.quickPressPointerId = event.pointerId ?? "mouse";
    button.classList.add("ct-vd-quick-pressing");
    try { button.setPointerCapture?.(event.pointerId); } catch (_) {}

    state.quickPressDelay = setTimeout(() => {
      state.quickPressInterval = setInterval(() => {
        adjustActiveProperty(direction);
      }, 70);
    }, 320);
  }

  function endQuickPressRepeat(event) {
    if (state.quickPressPointerId == null) return;
    if (event?.pointerId != null && state.quickPressPointerId !== event.pointerId) return;
    stopQuickPressRepeat();
  }

  function enterQuickMode() {
    if (!state.selected || !state.selector) {
      toast("Nejdřív vyber prvek");
      return;
    }
    if (!activePropertyConfig()) {
      toast("Klepni nejdřív na parametr, který chceš ladit");
      return;
    }
    togglePanel(false);
    refs.quickbar.classList.add("ct-vd-quick-active");
    refs.quickLabel.textContent = activePropertyConfig().label;
    refs.quickValue.textContent = String(valueForControl(activePropertyConfig()));
    toast("Rychlé ladění: použij − a +");
  }

  function toggleQuickPanel() {
    if (state.panelOpen) enterQuickMode();
    else {
      refs.quickbar.classList.remove("ct-vd-quick-active");
      togglePanel(true);
    }
  }

  function setQuickbarPosition(left, top) {
    refs.quickbar.style.setProperty("left", `${Math.round(left)}px`, "important");
    refs.quickbar.style.setProperty("top", `${Math.round(top)}px`, "important");
    refs.quickbar.style.setProperty("right", "auto", "important");
    refs.quickbar.style.setProperty("bottom", "auto", "important");
  }

  function startQuickDrag(event) {
    if (event.button != null && event.button !== 0) return;
    const rect = refs.quickbar.getBoundingClientRect();
    state.quickDrag = {
      pointerId: event.pointerId ?? "mouse",
      x: event.clientX,
      y: event.clientY,
      left: rect.left,
      top: rect.top
    };
    state.quickMoved = false;
    try { refs.quickbar.setPointerCapture?.(event.pointerId); } catch (_) {}
  }

  function moveQuickDrag(event) {
    if (!state.quickDrag) return;
    if (event.pointerId != null && state.quickDrag.pointerId !== event.pointerId) return;
    const dx = event.clientX - state.quickDrag.x;
    const dy = event.clientY - state.quickDrag.y;
    if (Math.hypot(dx, dy) < 7 && !state.quickMoved) return;
    state.quickMoved = true;
    const rect = refs.quickbar.getBoundingClientRect();
    const left = clamp(state.quickDrag.left + dx, 0, Math.max(0, window.innerWidth - rect.width));
    const top = clamp(state.quickDrag.top + dy, 0, Math.max(0, window.innerHeight - rect.height));
    setQuickbarPosition(left, top);
    event.preventDefault();
  }

  function endQuickDrag(event) {
    if (!state.quickDrag) return;
    if (event?.pointerId != null && state.quickDrag.pointerId !== event.pointerId) return;
    state.quickDrag = null;
    setTimeout(() => { state.quickMoved = false; }, 0);
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
    row.dataset.property = config.key;
    const activate = () => setActiveProperty(config);
    row.addEventListener("pointerdown", activate);
    range.addEventListener("focus", activate);
    number.addEventListener("focus", activate);

    const apply = raw => {
      const value = clamp(raw, config.min, config.max);
      range.value = value;
      number.value = value;
      setDeclaration(config.key, formatPropertyValue(config, value));
      updateHighlight();
    };
    range.addEventListener("input", () => apply(range.value));
    number.addEventListener("change", () => apply(number.value));
    refs.controls.set(config.key, { range, number, row });
    return row;
  }

  function buildPanel() {
    const quickbar = document.createElement("div");
    quickbar.id = "ct-vd-quickbar";
    quickbar.hidden = true;
    quickbar.innerHTML = `
      <button id="ct-vd-quick-minus" type="button" aria-label="Zmenšit hodnotu">−</button>
      <button id="ct-vd-fab" type="button" title="Otevřít nebo skrýt Visual Debug" aria-label="Visual Debug">🛠</button>
      <button id="ct-vd-quick-plus" type="button" aria-label="Zvětšit hodnotu">+</button>
      <span id="ct-vd-quick-status"><b id="ct-vd-quick-label">parametr</b><small id="ct-vd-quick-value">–</small></span>
    `;
    const fab = quickbar.querySelector("#ct-vd-fab");

    const panel = document.createElement("aside");
    panel.id = "ct-vd-panel";
    panel.hidden = true;
    panel.innerHTML = `
      <div class="ct-vd-head">
        <div class="ct-vd-drag-handle" id="ct-vd-drag-handle" title="Táhni prstem nebo myší">⠿</div>
        <div class="ct-vd-title">
          <strong>Visual Debug</strong>
          <small id="ct-vd-target-name">Žádný prvek</small>
        </div>
        <button class="ct-vd-icon-btn" id="ct-vd-undo" type="button" title="Zpět">↶</button>
        <button class="ct-vd-icon-btn" id="ct-vd-minimize" type="button" title="Sbalit panel" aria-expanded="true">—</button>
        <button class="ct-vd-icon-btn" id="ct-vd-close" type="button" title="Zavřít">×</button>
      </div>
      <div class="ct-vd-body">
        <section class="ct-vd-section ct-vd-panel-tools">
          <div class="ct-vd-section-title"><span>Panel</span><span>Táhni za zelenou hlavičku</span></div>
          <div class="ct-vd-panel-opacity-row">
            <label for="ct-vd-panel-opacity">Průhlednost</label>
            <input id="ct-vd-panel-opacity" class="ct-vd-range" type="range" min="35" max="100" step="1" value="92">
            <output id="ct-vd-panel-opacity-value">92 %</output>
          </div>
          <div class="ct-vd-actions" style="margin-top:8px !important">
            <button id="ct-vd-center-panel" class="ct-vd-btn" type="button">Vycentrovat panel</button>
            <button id="ct-vd-reset-panel-position" class="ct-vd-btn" type="button">Vrátit doprava</button>
            <button id="ct-vd-toggle-measure" class="ct-vd-btn" type="button">Skrýt název objektu</button>
          </div>
        </section>

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
          <div class="ct-vd-auto-save" style="margin-top:9px !important">
            <select id="ct-vd-export-section" class="ct-vd-select" aria-label="Sekce CSS">
              <option>START SCREEN</option><option>TIMER</option><option>STATISTICS</option>
              <option>SETTINGS</option><option>HISTORY / AO PANELS</option><option>OLL MENU</option>
              <option>PLL MENU</option><option>ALGORITHM IMAGES</option><option>DIALOGS / MODALS</option>
            </select>
            <button id="ct-vd-connect-css" class="ct-vd-btn" type="button">Připojit CSS</button>
            <button id="ct-vd-save-current" class="ct-vd-btn primary" type="button">Zapsat prvek</button>
            <button id="ct-vd-copy-current" class="ct-vd-btn" type="button">Kopírovat prvek</button>
            <small id="ct-vd-css-file-status">Soubor nepřipojen</small>
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

    document.body.append(quickbar, panel, highlight, measure, toastEl, grid);

    refs = {
      fab,
      quickbar,
      quickMinus: quickbar.querySelector("#ct-vd-quick-minus"),
      quickPlus: quickbar.querySelector("#ct-vd-quick-plus"),
      quickLabel: quickbar.querySelector("#ct-vd-quick-label"),
      quickValue: quickbar.querySelector("#ct-vd-quick-value"),
      panel,
      head: panel.querySelector(".ct-vd-head"),
      dragHandle: panel.querySelector("#ct-vd-drag-handle"),
      close: panel.querySelector("#ct-vd-close"),
      minimize: panel.querySelector("#ct-vd-minimize"),
      panelOpacity: panel.querySelector("#ct-vd-panel-opacity"),
      panelOpacityValue: panel.querySelector("#ct-vd-panel-opacity-value"),
      centerPanel: panel.querySelector("#ct-vd-center-panel"),
      resetPanelPosition: panel.querySelector("#ct-vd-reset-panel-position"),
      toggleMeasure: panel.querySelector("#ct-vd-toggle-measure"),
      exportSection: panel.querySelector("#ct-vd-export-section"),
      connectCss: panel.querySelector("#ct-vd-connect-css"),
      saveCurrent: panel.querySelector("#ct-vd-save-current"),
      copyCurrent: panel.querySelector("#ct-vd-copy-current"),
      cssFileStatus: panel.querySelector("#ct-vd-css-file-status"),
      undo: panel.querySelector("#ct-vd-undo"),
      targetName: panel.querySelector("#ct-vd-target-name"),
      selector: panel.querySelector("#ct-vd-selector"),
      resolve: panel.querySelector("#ct-vd-resolve"),
      pickBtn: panel.querySelector("#ct-vd-pick"),
      elementList: panel.querySelector("#ct-vd-element-list"),
      elementsRefresh: panel.querySelector("#ct-vd-elements-refresh"),
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
    refs.fab.addEventListener("click", event => {
      if (state.quickMoved) return;
      event.stopPropagation();
      toggleQuickPanel();
    });
    refs.quickMinus.addEventListener("pointerdown", event => startQuickPressRepeat(event, -1));
    refs.quickPlus.addEventListener("pointerdown", event => startQuickPressRepeat(event, 1));
    refs.quickMinus.addEventListener("pointerup", endQuickPressRepeat);
    refs.quickPlus.addEventListener("pointerup", endQuickPressRepeat);
    refs.quickMinus.addEventListener("pointercancel", endQuickPressRepeat);
    refs.quickPlus.addEventListener("pointercancel", endQuickPressRepeat);
    refs.quickMinus.addEventListener("lostpointercapture", endQuickPressRepeat);
    refs.quickPlus.addEventListener("lostpointercapture", endQuickPressRepeat);
    refs.quickMinus.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      if (event.detail === 0) adjustActiveProperty(-1);
    });
    refs.quickPlus.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      if (event.detail === 0) adjustActiveProperty(1);
    });
    refs.quickbar.addEventListener("pointerdown", startQuickDrag, { passive: true });
    refs.quickbar.addEventListener("pointermove", moveQuickDrag, { passive: false });
    refs.quickbar.addEventListener("pointerup", endQuickDrag);
    refs.quickbar.addEventListener("pointercancel", endQuickDrag);
    window.addEventListener("pointerup", endQuickPressRepeat, true);
    window.addEventListener("pointercancel", endQuickPressRepeat, true);
    window.addEventListener("blur", stopQuickPressRepeat);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopQuickPressRepeat();
    });
    refs.close.addEventListener("click", () => togglePanel(false));
    refs.minimize.addEventListener("click", toggleMinimize);
    refs.panelOpacity.addEventListener("input", () => {
      applyPanelOpacity(Number(refs.panelOpacity.value) / 100);
    });
    refs.centerPanel.addEventListener("click", centerPanel);
    refs.resetPanelPosition.addEventListener("click", resetPanelPosition);
    refs.toggleMeasure.addEventListener("click", () => {
      state.showMeasure = !state.showMeasure;
      refs.toggleMeasure.textContent = state.showMeasure ? "Skrýt název objektu" : "Zobrazit název objektu";
      if (state.selected) updateHighlight();
      savePanelState();
    });
    refs.exportSection.addEventListener("change", () => { state.exportSection = refs.exportSection.value; savePanelState(); });
    refs.connectCss.addEventListener("click", chooseCssFile);
    refs.saveCurrent.addEventListener("click", saveCurrentRuleToCssFile);
    refs.copyCurrent.addEventListener("click", copyCurrentRule);
    refs.undo.addEventListener("click", undo);
    refs.pickBtn.addEventListener("click", () => setPicking(!state.picking));
    refs.elementList?.addEventListener("change", selectFromElementList);
    refs.elementsRefresh?.addEventListener("click", refreshElementList);
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

    document.addEventListener("pointerdown", startPickGesture, true);
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerup", finishPickGesture, true);
    document.addEventListener("pointercancel", cancelPickGesture, true);
    document.addEventListener("click", suppressPostPickClick, true);
    window.addEventListener("scroll", () => state.panelOpen && updateHighlight(), true);
    window.addEventListener("resize", () => {
      updateRuleInfo();
      if (state.panelOpen) {
        updateHighlight();
        const rect = refs.panel.getBoundingClientRect();
        if (rect.left > window.innerWidth - 70 || rect.top > window.innerHeight - 54) resetPanelPosition();
      }
    });
    document.addEventListener("keydown", event => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        togglePanel();
      }
      if (event.key === "Escape" && state.picking) setPicking(false);
    });

    /* Panel lze táhnout za celé záhlaví kromě jeho tlačítek.
       Pohyb sledujeme na window, takže tažení nepřestane po opuštění madla. */
    refs.head.addEventListener("pointerdown", startDrag, { passive: false });
    window.addEventListener("pointermove", moveDrag, { passive: false, capture: true });
    window.addEventListener("pointerup", endDrag, { passive: false, capture: true });
    window.addEventListener("pointercancel", endDrag, { passive: false, capture: true });

    /* Dotykový fallback je záměrně aktivní i ve WebView s neúplnými Pointer Events. */
    refs.head.addEventListener("touchstart", startDrag, { passive: false });
    window.addEventListener("touchmove", moveDrag, { passive: false, capture: true });
    window.addEventListener("touchend", endDrag, { passive: false, capture: true });
    window.addEventListener("touchcancel", endDrag, { passive: false, capture: true });
  }

  function init() {
    renderCommittedCss();
    renderRuntimeCss();
    buildPanel();
    restorePanelState();
    updateRuleInfo();
    unlockFromSecretClicks();

    /* Po startu nesmí být vybraný ani orámovaný žádný prvek.
       Výběr začne až po odemčení panelu a stisku „Vybrat prvek“. */
    state.selected = null;
    state.selector = "";
    state.picking = false;
    refs.selector.value = "";
    refs.targetName.textContent = "Žádný prvek";
    refs.highlight.hidden = true;
    refs.measure.hidden = true;
    document.body.classList.remove("ct-vd-picking");

    // Public helpers for console debugging.
    window.CubeTrainerVisualDebug = {
      open: () => togglePanel(true),
      close: () => togglePanel(false),
      select: selector => {
        refs.selector.value = selector;
        resolveSelector();
      },
      exportCss: generateCss,
      setPanelOpacity: value => applyPanelOpacity(Number(value)),
      centerPanel,
      resetPanelPosition,
      resetAll,
      quickMode: enterQuickMode
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
