export function drawDetailGraph(canvas, solve){
  if(!canvas || !solve)return;

  const ctx = canvas.getContext("2d");

  canvas.width = canvas.clientWidth;
  canvas.height = 120;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = "#777";
  ctx.font = "14px Arial";
  ctx.fillText("TPS graf připravujeme...", 12, 24);
}