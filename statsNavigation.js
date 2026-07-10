/* ==================================================
   MG3i TRAINER – NAVIGACE STATISTIK
   Jednoduchá verze bez MutationObserverů
   ================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const statsScreen = document.getElementById("stats-screen");

  if (!statsScreen) {
    console.warn("statsNavigation: #stats-screen nebyl nalezen");
    return;
  }

  const openProgressBtn = document.getElementById("openProgressStats");
  const progressView = document.getElementById("stats-progress-view");
  const backFromProgressBtn = document.getElementById("backFromProgressStats");

  const openAlgorithmsBtn = document.getElementById("openAlgorithmOverview");
  const algorithmsView = document.getElementById("stats-algorithms-view");
  const backFromAlgorithmsBtn = document.getElementById("backFromAlgorithmsStats");

  function hideAllStatsSubviews() {
    statsScreen.querySelectorAll(".stats-subview").forEach((subview) => {
      subview.hidden = true;
    });
  }

  function resetStatsScroll() {
    statsScreen.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function openStatsSubview(view) {
    if (!view) return;

    hideAllStatsSubviews();
    statsScreen.classList.add("stats-subview-open");
    document.body.classList.add("stats-subview-active");
    view.hidden = false;
    resetStatsScroll();
  }

  function closeStatsSubview() {
    hideAllStatsSubviews();
    statsScreen.classList.remove("stats-subview-open");
    document.body.classList.remove("stats-subview-active");
    resetStatsScroll();
  }

  openProgressBtn?.addEventListener("click", () => {
    openStatsSubview(progressView);
  });

  backFromProgressBtn?.addEventListener("click", closeStatsSubview);

  openAlgorithmsBtn?.addEventListener("click", () => {
    openStatsSubview(algorithmsView);
  });

  backFromAlgorithmsBtn?.addEventListener("click", closeStatsSubview);

  /* Při odchodu přes hlavní menu se Statistiky vrátí na dashboard. */
  ["nav-timer", "nav-stats", "nav-settings"].forEach((buttonId) => {
    document.getElementById(buttonId)?.addEventListener("click", closeStatsSubview);
  });

  console.log("statsNavigation.js načten");
});
