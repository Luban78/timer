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