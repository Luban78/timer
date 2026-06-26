export function drawDetailGraph(canvas, solve){
  if(!canvas || !solve)return;

  const ctx = canvas.getContext("2d");

  canvas.width = canvas.clientWidth;
  canvas.height = 120;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  const w = canvas.width;
  const h = canvas.height;
  const pad = 18;

  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, h - pad);
  ctx.lineTo(w - pad, h - pad);
  ctx.stroke();

  ctx.fillStyle = "#aaa";
  ctx.font = "12px Arial";
  ctx.fillText("TPS", pad, 12);
  ctx.fillText("Start", pad, h - 4);
  ctx.fillText("Finish", w - 52, h - 4);
}