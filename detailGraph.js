export function drawDetailGraph(canvas, solve) {
  if (!canvas || !solve) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const cssWidth = Math.max(260, canvas.clientWidth || 320);
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  const cssHeight = 190;

  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  canvas.style.height = cssHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const moves = Array.isArray(solve.moves) ? solve.moves : [];
  if (moves.length < 2) {
    ctx.fillStyle = "rgba(235,245,241,.58)";
    ctx.font = "14px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Zatím není dost timing dat pro graf.", cssWidth / 2, cssHeight / 2);
    return;
  }

  const points = [];
  for (let i = 1; i < moves.length; i += 1) {
    const previousTime = Number(moves[i - 1]?.time);
    const currentTime = Number(moves[i]?.time);
    const dt = currentTime - previousTime;
    if (!Number.isFinite(dt) || dt <= 0) continue;

    points.push({
      time: currentTime,
      tps: 1 / dt,
      dt,
      move: String(moves[i]?.move || ""),
      index: i + 1
    });
  }

  if (!points.length) return;

  const totalTime = Math.max(Number(solve.time) || 0, Number(moves[moves.length - 1]?.time) || 0, 0.1);
  const maxTps = Math.max(4, ...points.map(p => Math.min(p.tps, 12)));
  const pad = { left: 34, right: 12, top: 16, bottom: 34 };
  const graphW = cssWidth - pad.left - pad.right;
  const graphH = cssHeight - pad.top - pad.bottom;

  const xFor = time => pad.left + (time / totalTime) * graphW;
  const yFor = tps => pad.top + graphH - (Math.min(tps, maxTps) / maxTps) * graphH;

  // Jemná mřížka.
  ctx.strokeStyle = "rgba(121,151,143,.16)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = pad.top + (graphH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(cssWidth - pad.right, y);
    ctx.stroke();
  }

  // Výraznější pauzy jako svislé značky.
  const pauseThreshold = 0.55;
  points.filter(p => p.dt >= pauseThreshold).forEach(p => {
    const x = xFor(p.time);
    ctx.strokeStyle = "rgba(255,214,64,.25)";
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, pad.top + graphH);
    ctx.stroke();
  });

  // TPS křivka.
  ctx.beginPath();
  ctx.strokeStyle = "#00e676";
  ctx.lineWidth = 2.6;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  points.forEach((p, index) => {
    const x = xFor(p.time);
    const y = yFor(p.tps);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Body jednotlivých tahů.
  ctx.fillStyle = "#00e676";
  points.forEach(p => {
    const x = xFor(p.time);
    const y = yFor(p.tps);
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Osy a popisky času.
  ctx.fillStyle = "rgba(235,245,241,.56)";
  ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "left";
  ctx.fillText("TPS", 3, 14);
  ctx.fillText("0", 16, pad.top + graphH + 4);

  ctx.textAlign = "center";
  [0, 0.25, 0.5, 0.75, 1].forEach(ratio => {
    const x = pad.left + graphW * ratio;
    ctx.fillText((totalTime * ratio).toFixed(totalTime >= 20 ? 0 : 1) + "s", x, cssHeight - 8);
  });

  // Krátké štítky tahů – jen tolik, aby graf zůstal čitelný.
  const maxLabels = Math.max(5, Math.floor(graphW / 42));
  const labelStep = Math.max(1, Math.ceil(points.length / maxLabels));
  ctx.fillStyle = "rgba(235,245,241,.72)";
  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  points.forEach((p, index) => {
    if (index % labelStep !== 0 && index !== points.length - 1) return;
    ctx.fillText(p.move, xFor(p.time), pad.top + graphH + 15);
  });
}
