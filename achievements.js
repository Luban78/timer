export const ACHIEVEMENTS = [
  { id: "first_solve", title: "První solve" },
  { id: "level_2", title: "Level 2" },
  { id: "ten_solves", title: "10 solve" },
  { id: "sub_5", title: "Sub 5" },
  { id: "tps_5", title: "TPS 5+" },
  { id: "new_pb", title: "Nový osobní rekord" }
];

export function updateAchievementList(achievementList, playerProfile){
  achievementList.innerHTML=ACHIEVEMENTS.map(a=>{
    const unlocked=playerProfile.achievements.includes(a.id);

    return `
      <div class="achievement-item ${unlocked ? "unlocked" : "locked"}">
        <span>${unlocked ? "✅" : "🔒"}</span>
        <span>${a.title}</span>
      </div>
    `;
  }).join("");
}
