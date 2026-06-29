export function stopIfSolving(isSolving, manualStop){
  if(isSolving){
    manualStop();
  }
}