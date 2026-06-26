export function drawGraph(ctx, canvas, tpsHistory){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(tpsHistory.length<2)return;

    ctx.beginPath();
    ctx.strokeStyle="rgba(0,230,118,.75)";
    ctx.lineWidth=4;
    ctx.lineJoin="round";

    const step=canvas.width/100;

    for(let i=0;i<tpsHistory.length;i++){
        const x=i*step+(canvas.width-tpsHistory.length*step);
        const y=canvas.height-(tpsHistory[i]/6)*canvas.height;

        if(i===0)ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
    }

    ctx.stroke();
}