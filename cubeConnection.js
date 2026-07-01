import { connectGanCube } from "https://esm.sh/gan-web-bluetooth";

export async function connectCube({ onMove, onFacelets }){
  const cube = await connectGanCube();

  if (event.type === "MOVE") {
  onMove(event.move);
  
  if (typeof cube.sendCubeCommand === "function") {
    cube.sendCubeCommand({ type: "REQUEST_FACELETS" });
  }
}

  if(typeof cube.sendCubeCommand === "function"){
    await cube.sendCubeCommand({ type: "REQUEST_FACELETS" });
  }

  return cube;
}