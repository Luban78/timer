/* ==================================================
   MG3i TRAINER – NAVIGACE STATISTIK
   Samostatné obrazovky bez prodlužování app.js
   ================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const statsScreen = document.getElementById("stats-screen");
  const algorithmStatsScreen =
  document.getElementById("algorithm-stats-screen");
  
  /* Pokrok a úkoly */
  const openProgressBtn =
    document.getElementById("openProgressStats");
  
  const progressView =
    document.getElementById("stats-progress-view");
  
  const backFromProgressBtn =
    document.getElementById("backFromProgressStats");
  
  /* Algoritmy */
  const openAlgorithmsBtn =
    document.getElementById("openAlgorithmOverview");
  
  const algorithmsView =
    document.getElementById("stats-algorithms-view");
  
  const backFromAlgorithmsBtn =
    document.getElementById("backFromAlgorithmsStats");
  
  if (!statsScreen) {
    console.warn(
      "statsNavigation: #stats-screen nebyl nalezen"
    );
    return;
  }
  
  /**
   * Otevře vybranou podstránku Statistik.
   */
  function openStatsSubview(view) {
    if (!view) return;
    
    statsScreen
      .querySelectorAll(".stats-subview")
      .forEach((subview) => {
        subview.hidden = true;
      });
    
    statsScreen.classList.add("stats-subview-open");
    view.hidden = false;
    
    statsScreen.scrollTop = 0;
    
    window.scrollTo({
      top: 0,
      behavior: "instant"
    });
  }
  
  /**
   * Zavře podstránku a vrátí hlavní dashboard.
   */
  function closeStatsSubview() {
    statsScreen
      .querySelectorAll(".stats-subview")
      .forEach((subview) => {
        subview.hidden = true;
      });
    
    statsScreen.classList.remove("stats-subview-open");
    statsScreen.scrollTop = 0;
    
    window.scrollTo({
      top: 0,
      behavior: "instant"
    });
  }
  
  /* Pokrok a úkoly */
  openProgressBtn?.addEventListener("click", () => {
    openStatsSubview(progressView);
  });
  
  backFromProgressBtn?.addEventListener("click", () => {
    closeStatsSubview();
  });
  
  /* Algoritmy */
  openAlgorithmsBtn?.addEventListener("click", () => {
    openStatsSubview(algorithmsView);
  });
  
  backFromAlgorithmsBtn?.addEventListener("click", () => {
    closeStatsSubview();
  });
  
  /*
   * Po odchodu ze Statistik podstránku zavřeme.
   * Při návratu se zobrazí hlavní dashboard.
   */
  const statsVisibilityObserver = new MutationObserver(() => {
    if (statsScreen.style.display === "none") {
      closeStatsSubview();
    }
  });
  
  statsVisibilityObserver.observe(statsScreen, {
    attributes: true,
    attributeFilter: ["style"]
  });
  /* ==================================================
   HORNÍ LIŠTA NA OBRAZOVKÁCH STATISTIK
   ================================================== */

function isElementVisible(element) {
  if (!element) return false;

  return window.getComputedStyle(element).display !== "none";
}

function updateStatsTopStrip() {
  const mainStatsVisible = isElementVisible(statsScreen);
  const algorithmDetailVisible =
    isElementVisible(algorithmStatsScreen);

  /* Jsme na některé obrazovce Statistik */
  document.body.classList.toggle(
    "stats-section-active",
    mainStatsVisible || algorithmDetailVisible
  );

  /* Jsme přímo v detailu OLL nebo PLL */
  document.body.classList.toggle(
    "stats-algorithm-detail-open",
    algorithmDetailVisible
  );
}

const topStripObserver = new MutationObserver(() => {
  updateStatsTopStrip();
});

topStripObserver.observe(statsScreen, {
  attributes: true,
  attributeFilter: ["style", "class"]
});

if (algorithmStatsScreen) {
  topStripObserver.observe(algorithmStatsScreen, {
    attributes: true,
    attributeFilter: ["style", "class"]
  });
}

updateStatsTopStrip();
  console.log("statsNavigation.js načten");
});