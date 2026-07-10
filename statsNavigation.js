/* ==================================================
   MG3i TRAINER – NAVIGACE STATISTIK
   Jednoduchá verze bez MutationObserverů
   ================================================== */

document.addEventListener("DOMContentLoaded", function() {
  const statsScreen =
    document.getElementById("stats-screen");
  
  if (!statsScreen) {
    console.warn(
      "statsNavigation: #stats-screen nebyl nalezen"
    );
    return;
  }
  
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
  
  /* Odznaky */
  const openAchievementsBtn =
    document.getElementById("openAchievementsStats");
  
  const achievementsView =
    document.getElementById("stats-achievements-view");
  
  const backFromAchievementsBtn =
    document.getElementById("backFromAchievementsStats");
  
  /* Historie */
  const openHistoryBtn =
    document.getElementById("openHistoryStats");
  
  const historyView =
    document.getElementById("stats-history-view");
  
  const backFromHistoryBtn =
    document.getElementById("backFromHistoryStats");
  
  /* Návrat z detailu OLL / PLL */
  const backToStatsBtn =
    document.getElementById("backToStatsBtn");
  
  function hideAllStatsSubviews() {
    const subviews =
      statsScreen.querySelectorAll(".stats-subview");
    
    subviews.forEach(function(subview) {
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
  
  function addClick(element, handler) {
    if (element) {
      element.addEventListener("click", handler);
    }
  }
  
  /* Pokrok a úkoly */
  addClick(openProgressBtn, function() {
    openStatsSubview(progressView);
  });
  
  addClick(
    backFromProgressBtn,
    closeStatsSubview
  );
  
  /* Algoritmy */
  addClick(openAlgorithmsBtn, function() {
    openStatsSubview(algorithmsView);
  });
  
  
  addClick(
    backFromAlgorithmsBtn,
    closeStatsSubview
  );
  
  /* Odznaky */
  addClick(openAchievementsBtn, function() {
    openStatsSubview(achievementsView);
  });
  
  addClick(
    backFromAchievementsBtn,
    closeStatsSubview
  );
  
  /* Historie */
  addClick(openHistoryBtn, function() {
    openStatsSubview(historyView);
  });
  
  addClick(
    backFromHistoryBtn,
    closeStatsSubview
  );
  
  /*
   * Po návratu z detailu OLL nebo PLL zobrazíme
   * hlavní dashboard Statistik.
   */
  addClick(
    backToStatsBtn,
    closeStatsSubview
  );
  
  /*
   * Při přechodu přes hlavní MENU vždy zavřeme
   * vnitřní obrazovku Statistik.
   */
  [
    "nav-timer",
    "nav-stats",
    "nav-settings"
  ].forEach(function(buttonId) {
    const button =
      document.getElementById(buttonId);
    
    addClick(button, closeStatsSubview);
  });
  
  console.log("statsNavigation.js načten");
});