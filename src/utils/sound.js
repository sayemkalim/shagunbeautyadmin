/**
 * Utility to play notification sounds and loud ringtones for new orders.
 * Attempts to play the downloaded wav file first, falling back to 
 * Web Audio API synthesized telephone chimes/rings if the file fails.
 */

let cachedAudio = null;

// Fallback chime: simple double-chime using Web Audio API
const playFallbackChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    
    // First chime (higher pitch)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.5);

    // Second chime (lower pitch, slightly delayed)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.15); // C6
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.15);
    gain2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.7);
  } catch (error) {
    console.warn("Web Audio API fallback chime play failed:", error);
  }
};

// Fallback ringtone: loud retro telephone trill ring using Web Audio API
const playFallbackRingtone = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Telephone frequencies: 440Hz + 480Hz chord
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(440, ctx.currentTime);
    
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(480, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    
    // Alternating volume every 50ms to create a rapid 10Hz telephone trill / ring sound
    const ringTime = 1.0; // 1 second ring duration
    for (let t = 0; t < ringTime; t += 0.1) {
      gainNode.gain.setValueAtTime(0.8, ctx.currentTime + t);
      gainNode.gain.setValueAtTime(0.05, ctx.currentTime + t + 0.05);
    }
    gainNode.gain.setValueAtTime(0, ctx.currentTime + ringTime);
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + ringTime);
    osc2.stop(ctx.currentTime + ringTime);
  } catch (error) {
    console.warn("Retro ringtone synthesis failed:", error);
  }
};

// Play a single order notification chime (at max volume)
export const playNotificationSound = () => {
  try {
    if (!cachedAudio) {
      cachedAudio = new Audio("/notification.wav");
      cachedAudio.volume = 1.0;
      cachedAudio.onerror = () => {
        console.warn("Failed to load /notification.wav, using Web Audio fallback");
        playFallbackChime();
      };
    }
    
    cachedAudio.currentTime = 0;
    cachedAudio.volume = 1.0;
    
    const playPromise = cachedAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn("Audio play blocked by browser autoplay policy, attempting fallback.", error);
        playFallbackChime();
      });
    }
  } catch (err) {
    console.warn("Failed to play notification sound, using Web Audio fallback.", err);
    playFallbackChime();
  }
};

// Play the sound sequence multiple times like a phone ringtone (zor se ringtone jaisa)
export const playLoudRingtone = (times = 3) => {
  let playCount = 0;
  
  const playOnce = () => {
    try {
      if (!cachedAudio) {
        cachedAudio = new Audio("/notification.wav");
        cachedAudio.volume = 1.0;
        cachedAudio.onerror = () => {
          console.warn("Failed to load /notification.wav, using retro ringtone fallback");
          playFallbackRingtone();
        };
      }
      
      cachedAudio.currentTime = 0;
      cachedAudio.volume = 1.0;
      
      const playPromise = cachedAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn("Audio play blocked, using retro ringtone fallback", error);
          playFallbackRingtone();
        });
      }
    } catch (err) {
      console.warn("Failed to play audio, using retro ringtone fallback", err);
      playFallbackRingtone();
    }
    
    playCount++;
    if (playCount < times) {
      setTimeout(playOnce, 2000); // 2 seconds between rings
    }
  };
  
  playOnce();
};
