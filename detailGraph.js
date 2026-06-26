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

  const moves = solve.moves || [];
  if(moves.length < 2)return;

  const points = [];

  for(let i=1;i<moves.length;i++){
    const dt = moves[i].time - moves[i-1].time;
    if(dt <= 0)continue;

    points.push({
      time:moves[i].time,
      tps:1 / dt
    });
  }

  if(points.length < 2)return;

  const maxTime = moves[moves.length-1].time || 1;
  const maxTps = Math.max(...points.map(p=>p.tps), 1);

  ctx.beginPath();
  ctx.strokeStyle = "#00e676";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";

  points.forEach((p,i)=>{
    const x = pad + (p.time / maxTime) * (w - pad*2);
    const y = (h - pad) - (p.tps / maxTps) * (h - pad*2);

    if(i===0)ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  });

  ctx.stroke();
}