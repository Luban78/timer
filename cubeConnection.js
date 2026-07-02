import { connectGanCube } from "https://esm.sh/gan-web-bluetooth";

export async function connectCube({ onMove, onFacelets }) {
  const cube = await connectGanCube();
  
  function requestFacelets() {
    if (typeof cube.sendCubeCommand === "function") {
      try {
        cube.sendCubeCommand({ type: "REQUEST_FACELETS" });
      } catch (e) {
        console.log("REQUEST_FACELETS error:", e);
      }
    }
  }
  
  cube.events$.subscribe(event => {
    
    // DŮLEŽITÉ: ochrana proti prázdnému eventu
    if (!event || !event.type) {
      return;
    }
    
    if (event.type === "MOVE") {
      onMove(event.move);
      
      // po tahu počkáme malinko, aby kostka stihla změnit stav
      setTimeout(requestFacelets, 80);
    }
    
    if (event.type === "FACELETS") {
      onFacelets(event);
}
  });
  
  // první načtení stavu po připojení
  setTimeout(requestFacelets, 300);
  
  return cube;
}

/*alert("CP:\n" + JSON.stringify(event.state.CP));

alert("CO:\n" + JSON.stringify(event.state.CO));

alert("EP:\n" + JSON.stringify(event.state.EP));

alert("EO:\n" + JSON.stringify(event.state.EO));
  onFacelets(event);*/