/**
 * Utility to play notification sounds and loud ringtones for new orders.
 * Attempts to play the downloaded wav file first, falling back to 
 * Web Audio API synthesized telephone chimes/rings if the file fails.
 * Also utilizes browser SpeechSynthesis API to speak "Order placed" aloud.
 */

let cachedAudio = null;
let audioUnlocked = false;

// Pre-initialize Speech Synthesis voices
if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  if (window.speechSynthesis.addEventListener) {
    window.speechSynthesis.addEventListener("voiceschanged", () => {
      window.speechSynthesis.getVoices();
    });
  }
}

// Helper to get or create cached HTML5 Audio with fallback handling
const getOrCreateAudio = () => {
  if (!cachedAudio) {
    cachedAudio = new Audio("/notification.wav");
    cachedAudio.volume = 1.0;
    cachedAudio.onerror = (e) => {
      console.warn("Failed to load /notification.wav:", e);
    };
  }
  return cachedAudio;
};

// Speak text aloud using browser SpeechSynthesis API
export const speakNotification = (text = "Order placed! Order placed!") => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  try {
    // Cancel any ongoing speech to avoid overlap
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = 1.0;
    utterance.rate = 0.95; // Slightly slower for clear pronounciation
    utterance.pitch = 1.0;  // Natural pitch
    
    // Attempt to pick a premium English voice
    const voices = window.speechSynthesis.getVoices();
    const chosenVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha"))) || voices.find(v => v.lang.startsWith("en"));
    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.warn("Speech synthesis failed:", error);
  }
};

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

// Initialize listeners to unlock audio on first user interaction (bypasses autoplay blocks)
export const initAudioUnlock = () => {
  if (typeof window === "undefined" || audioUnlocked) return;

  const unlock = () => {
    if (audioUnlocked) return;

    console.log("User interaction detected, unlocking audio context...");

    // 1. Unlock HTML5 Audio
    const audio = getOrCreateAudio();
    audio.volume = 0; // Play silently to unlock
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 1.0;
          audioUnlocked = true;
          console.log("HTML5 Audio successfully unlocked");
          cleanup();
        })
        .catch((err) => {
          console.warn("HTML5 Audio unlock failed:", err);
        });
    } else {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1.0;
      audioUnlocked = true;
      console.log("HTML5 Audio unlocked (no promise)");
      cleanup();
    }

    // 2. Unlock Web Audio API context for fallbacks
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        const tempCtx = new AudioContextClass();
        if (tempCtx.state === "suspended") {
          tempCtx.resume().then(() => {
            tempCtx.close();
            console.log("Web Audio API successfully unlocked");
          });
        } else {
          tempCtx.close();
        }
      }
    } catch (e) {
      console.warn("Failed to unlock Web Audio API:", e);
    }
    
    // 3. Unlock SpeechSynthesis (by speaking an empty string)
    try {
      if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance("");
        window.speechSynthesis.speak(u);
        console.log("SpeechSynthesis successfully unlocked");
      }
    } catch (e) {
      console.warn("Failed to unlock SpeechSynthesis:", e);
    }
  };

  const cleanup = () => {
    document.removeEventListener("click", unlock);
    document.removeEventListener("keydown", unlock);
    document.removeEventListener("touchstart", unlock);
  };

  document.addEventListener("click", unlock);
  document.addEventListener("keydown", unlock);
  document.addEventListener("touchstart", unlock);
};

// Play a single order notification chime (at max volume)
export const playNotificationSound = () => {
  try {
    const audio = getOrCreateAudio();
    audio.currentTime = 0;
    audio.volume = 1.0;
    
    // Attach error handler for this instance play
    audio.onerror = () => {
      console.warn("Failed to load /notification.wav, using Web Audio fallback");
      playFallbackChime();
      speakNotification("Order placed!");
    };
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          speakNotification("Order placed!");
        })
        .catch((error) => {
          console.warn("Audio play blocked by browser autoplay policy, attempting fallback.", error);
          playFallbackChime();
          speakNotification("Order placed!");
        });
    } else {
      speakNotification("Order placed!");
    }
  } catch (err) {
    console.warn("Failed to play notification sound, using Web Audio fallback.", err);
    playFallbackChime();
    speakNotification("Order placed!");
  }
};

// Play the sound sequence multiple times like a phone ringtone (zor se ringtone jaisa)
export const playLoudRingtone = (times = 3) => {
  let playCount = 0;
  
  const playOnce = () => {
    try {
      const audio = getOrCreateAudio();
      audio.currentTime = 0;
      audio.volume = 1.0;
      
      // Attach error handler for this instance play
      audio.onerror = () => {
        console.warn("Failed to load /notification.wav, using retro ringtone fallback");
        playFallbackRingtone();
        speakNotification("New order placed!");
      };
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Speak "New order placed!" slightly after the ringtone starts
            setTimeout(() => {
              speakNotification("New order placed!");
            }, 800);
          })
          .catch((error) => {
            console.warn("Audio play blocked, using retro ringtone fallback", error);
            playFallbackRingtone();
            speakNotification("New order placed!");
          });
      } else {
        setTimeout(() => {
          speakNotification("New order placed!");
        }, 800);
      }
    } catch (err) {
      console.warn("Failed to play audio, using retro ringtone fallback", err);
      playFallbackRingtone();
      speakNotification("New order placed!");
    }
    
    playCount++;
    if (playCount < times) {
      setTimeout(playOnce, 6000); // 6 seconds between rings (sound is 5 seconds long)
    }
  };
  
  playOnce();
};
