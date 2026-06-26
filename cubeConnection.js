import { connectGanCube } from "https://esm.sh/gan-web-bluetooth";

export async function connectCube({ onMove, onFacelets }){
  const cube = await connectGanCube();

  cube.events$.subscribe(event=>{
    if(event.type === "MOVE") onMove(event.move);
    if(event.type === "FACELETS") onFacelets();
  });

  if(typeof cube.sendCubeCommand === "function"){
    await cube.sendCubeCommand({ type: "REQUEST_FACELETS" });
  }

  return cube;
}