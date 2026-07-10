/* ==================================================
   MG3i TRAINER – HISTORIE VE STATISTIKÁCH
   Filtry + souhrn: Počet / Best / Průměr
   ================================================== */

document.addEventListener("DOMContentLoaded", function() {
  const openHistoryBtn =
    document.getElementById("openHistoryStats");
  
  const historyList =
    document.getElementById("stats-history-list");
  
  const filterButtons =
    document.querySelectorAll(".stats-history-filter");
  
  const summaryCount =
    document.getElementById("history-summary-count");
  
  const summaryBest =
    document.getElementById("history-summary-best");
  
  const summaryAverage =
    document.getElementById("history-summary-average");
  
  if (!historyList) {
    console.warn(
      "statsHistory: #stats-history-list nebyl nalezen"
    );
    return;
  }
  
  let activeFilter = "all";
  
  function loadHistorySolves() {
    try {
      const stored =
        localStorage.getItem("mg3i_solves");
      
      const solves = JSON.parse(stored || "[]");
      
      return Array.isArray(solves) ? solves : [];
    } catch (error) {
      console.error(
        "statsHistory: historii se nepodařilo načíst",
        error
      );
      
      return [];
    }
  }
  
  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  function formatNumber(value, decimals) {
    const number = Number(value);
    
    if (!Number.isFinite(number)) {
      return "-";
    }
    
    return number.toFixed(decimals);
  }
  
  function getAlgorithmName(solve) {
    const name = String(
      solve?.algorithm || ""
    ).trim();
    
    if (
      !name ||
      name === "Nevybráno" ||
      name.toLowerCase().startsWith("wca")
    ) {
      return "WCA 3×3";
    }
    
    return name;
  }
  
  function getSolveCategory(solve) {
    const name =
      getAlgorithmName(solve).toLowerCase();
    
    if (name.startsWith("wca")) {
      return "wca";
    }
    
    if (
      name.startsWith("oll") ||
      name.includes(" oll")
    ) {
      return "oll";
    }
    
    return "pll";
  }
  
  function getFilteredSolves() {
    const solves = loadHistorySolves();
    
    if (activeFilter === "all") {
      return solves;
    }
    
    return solves.filter(function(solve) {
      return getSolveCategory(solve) === activeFilter;
    });
  }
  
  function updateHistorySummary(solves) {
    const validTimes = solves
      .map(function(solve) {
        return Number(solve.time);
      })
      .filter(function(time) {
        return Number.isFinite(time) && time >= 0;
      });
    
    if (summaryCount) {
      summaryCount.textContent =
        String(solves.length);
    }
    
    if (validTimes.length === 0) {
      if (summaryBest) {
        summaryBest.textContent = "-";
      }
      
      if (summaryAverage) {
        summaryAverage.textContent = "-";
      }
      
      return;
    }
    
    const bestTime =
      Math.min(...validTimes);
    
    const totalTime =
      validTimes.reduce(function(sum, time) {
        return sum + time;
      }, 0);
    
    const averageTime =
      totalTime / validTimes.length;
    
    if (summaryBest) {
      summaryBest.textContent =
        `${formatNumber(bestTime, 2)} s`;
    }
    
    if (summaryAverage) {
      summaryAverage.textContent =
        `${formatNumber(averageTime, 2)} s`;
    }
  }
  
  function renderStatsHistory() {
    const solves = getFilteredSolves();
    
    updateHistorySummary(solves);
    
    if (solves.length === 0) {
      historyList.innerHTML = `
        <p class="stats-history-empty">
          Pro tento filtr zatím nejsou žádné solve.
        </p>
      `;
      
      return;
    }
    
    historyList.innerHTML = solves
      .map(function(solve, index) {
        const algorithm =
          getAlgorithmName(solve);
        
        const time =
          formatNumber(solve.time, 2);
        
        const tps =
          formatNumber(
            solve.tps ?? solve.avg,
            1
          );
        
        const moves =
          solve.htm ??
          (
            Array.isArray(solve.moves) ?
            solve.moves.length :
            solve.moves
          ) ??
          0;
        
        const date =
          solve.date || "Datum neuvedeno";
        
        return `
          <article class="stats-history-row">
            <div class="stats-history-number">
              ${index + 1}
            </div>

            <div class="stats-history-main">
              <strong class="stats-history-algorithm">
                ${escapeHtml(algorithm)}
              </strong>

              <span class="stats-history-date">
                ${escapeHtml(date)}
              </span>
            </div>

            <div class="stats-history-result">
              <strong>${time} s</strong>

              <span>
                ${escapeHtml(moves)} HTM · ${tps} TPS
              </span>
            </div>
          </article>
        `;
      })
      .join("");
    
    historyList.scrollTop = 0;
  }
  
  function setActiveFilter(filter) {
    activeFilter = filter;
    
    filterButtons.forEach(function(button) {
      const isActive =
        button.dataset.historyFilter === filter;
      
      button.classList.toggle(
        "active",
        isActive
      );
    });
    
    renderStatsHistory();
  }
  
  filterButtons.forEach(function(button) {
    button.addEventListener("click", function() {
      const filter =
        button.dataset.historyFilter || "all";
      
      setActiveFilter(filter);
    });
  });
  
  openHistoryBtn?.addEventListener(
    "click",
    function() {
      setActiveFilter(activeFilter);
    }
  );
  console.log("statsHistory.js načten");
});