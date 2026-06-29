export const DAILY_TASKS = [
  { id: "solve10", title: "Udělej 10 solve" },
  { id: "pb", title: "Překonej osobní rekord" },
  { id: "tps5", title: "TPS vyšší než 5" }
];

export const dailyProgress =
  JSON.parse(localStorage.getItem("dailyProgress")) || {
    solve10: false,
    pb: false,
    tps5: false
  };

export function saveDailyProgress() {
  localStorage.setItem("dailyProgress", JSON.stringify(dailyProgress));
}

export function resetDailyProgress() {
  localStorage.removeItem("dailyProgress");
  
  dailyProgress.solve10 = false;
  dailyProgress.pb = false;
  dailyProgress.tps5 = false;
  
  saveDailyProgress();
}

export function updateDailyTasks(dailyList){
  dailyList.innerHTML =
    DAILY_TASKS.map(task=>{
      const done=dailyProgress[task.id];

      return `
        <div class="achievement-item ${done ? "unlocked" : "locked"}">
          <span>${done ? "✅" : "⬜"}</span>
          <span>${task.title}</span>
        </div>
      `;
    }).join("");
}


export function completeDailyTask(id, xp, dailyList, addXP){
  if(dailyProgress[id]) return;

  dailyProgress[id]=true;
  saveDailyProgress();

  addXP(xp);
  updateDailyTasks(dailyList);

  alert("🎯 Denní úkol splněn!\n\n+"+xp+" XP");
}

export function checkDailyTasks(savedSolves, finalAvg, isPB, dailyList, addXP){
  if(savedSolves.length>=10){
    completeDailyTask("solve10",50,dailyList,addXP);
  }

  if(isPB){
    completeDailyTask("pb",100,dailyList,addXP);
  }

  if(finalAvg>=5){
    completeDailyTask("tps5",75,dailyList,addXP);
  }
}