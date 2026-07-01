let audioCtx = null;

export function initAudio(){
  if(!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  if(audioCtx.state === "suspended"){
    audioCtx.resume();
  }
}

export function beep(freq = 240, dur = 0.12){
  try{
    initAudio();

    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();

    o.frequency.value = freq;
    g.gain.setValueAtTime(0.06, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + dur);

    o.connect(g);
    g.connect(audioCtx.destination);

    o.start();
    o.stop(audioCtx.currentTime + dur);
  }catch(e){}
}

export function playErrorSound(){
  if(navigator.vibrate){
    navigator.vibrate([180,80,180]);
  }

  beep(900,0.12);
  setTimeout(()=>beep(300,0.18),120);
  setTimeout(()=>beep(900,0.12),320);
}