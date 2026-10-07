// Sound starts only after the child explicitly turns it on.
let context;
export async function playPortalChime(enabled){
  if(!enabled)return;
  try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;context??=new Audio();if(context.state==='suspended')await context.resume();const start=context.currentTime;
    [523.25,659.25,783.99].forEach((frequency,i)=>{const oscillator=context.createOscillator(),gain=context.createGain(),t=start+i*.11;oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.045,t+.025);gain.gain.exponentialRampToValueAtTime(.0001,t+.28);oscillator.connect(gain);gain.connect(context.destination);oscillator.start(t);oscillator.stop(t+.3);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};});
  }catch{/* Audio is optional; answer persistence must still succeed. */}
}
