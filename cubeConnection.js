import { connectGanCube } from "https://esm.sh/gan-web-bluetooth";

export async function connectCube({ onMove, onFacelets }) {
  const cube = await connectGanCube();

  function requestFacelets() {
    try {
      if (typeof cube.sendCubeCommand === "function") {
        cube.sendCubeCommand({ type: "REQUEST_FACELETS" });
      }
    } catch (e) {
      console.log("REQUEST_FACELETS error:", e);
    }
  }

  cube.events$.subscribe(event => {
    if (!event) return;

    const type = String(event.type || "").toUpperCase();

    // Rychlá cesta: fyzický tah jde hned do trenéru.
    if (event.move) {
      if (typeof onMove === "function") {
        onMove(event.move);
      }

      setTimeout(requestFacelets, 150);
      return;
    }

    // Některé MOVE eventy nemají event.move. Ty jen použijeme k obnově stavu.
    if (type.includes("MOVE")) {
      setTimeout(requestFacelets, 150);
      return;
    }

    // FACELETS/STATE jen ukládáme pro zobrazení a MAP test, neposíláme je do trenéru.
    if (event.facelets || event.state) {
      if (typeof onFacelets === "function") {
        onFacelets(event);
      }
    }
  });

  setTimeout(requestFacelets, 300);
  setTimeout(requestFacelets, 900);

  return cube;
}
