export function updateXPUI(playerProfile, playerLevel, xpText, xpFill) {
  playerLevel.textContent = playerProfile.level;
  
  const need = playerProfile.level * 100;
  
  xpText.textContent = `${playerProfile.xp} / ${need} XP`;
  
  xpFill.style.width = (playerProfile.xp / need * 100) + "%";
}

export function showLevelUp(level, levelModal, levelNumber){
  levelNumber.textContent="Level "+level;
  levelModal.style.display="block";

  setTimeout(()=>{
    levelModal.style.display="none";
  },1800);
}

export function addXP(
  amount,
  playerProfile,
  saveProfile,
  updateXPUI,
  playerLevel,
  xpText,
  xpFill,
  showLevelUp,
  levelModal,
  levelNumber
){
  playerProfile.xp += amount;
  playerProfile.totalXP += amount;

  while(playerProfile.xp >= playerProfile.level * 100){

    playerProfile.xp -= playerProfile.level * 100;

    playerProfile.level++;

    showLevelUp(
      playerProfile.level,
      levelModal,
      levelNumber
    );
  }

  saveProfile(playerProfile);

  updateXPUI(
    playerProfile,
    playerLevel,
    xpText,
    xpFill
  );
}