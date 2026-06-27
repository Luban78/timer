const STORAGE_KEY = "mg3i_solves";

export function loadSolves(){
  try{
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  }catch(e){
    return [];
  }
}

export function saveSolves(solves){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(solves));
}

/*objekt hráče*/
const DEFAULT_PROFILE = {
  xp: 0,
  level: 1,
  streak: 0,
  totalXP: 0,
  achievements: []
};

function loadProfile(){
  return JSON.parse(
    localStorage.getItem("playerProfile")
  ) || {...DEFAULT_PROFILE};
}

function saveProfile(profile){
  localStorage.setItem(
    "playerProfile",
    JSON.stringify(profile)
  );
}