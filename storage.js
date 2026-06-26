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