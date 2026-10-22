// Web Audio API Synthesizer Chime + Text to Speech announcement with Mute support

let isMuted = localStorage.getItem('smartqueue_audio_muted') === 'true';

export const getAudioMuted = () => isMuted;

export const setAudioMuted = (muted) => {
  isMuted = !!muted;
  localStorage.setItem('smartqueue_audio_muted', isMuted ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('smartqueue_audio_mute_changed', { detail: { isMuted } }));
};

export const toggleAudioMuted = () => {
  setAudioMuted(!isMuted);
  return isMuted;
};

export const playChime = () => {
  if (isMuted) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // First tone (high chime: 659.25 Hz - E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.6);

    // Second tone (lower melodic finish: 523.25 Hz - C5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(523.25, ctx.currentTime + 0.25);
    gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.25);
    osc2.stop(ctx.currentTime + 0.9);
  } catch (err) {
    console.warn('Audio chime playback error:', err);
  }
};

export const announceToken = (tokenNumber, counterName) => {
  if (isMuted) return;
  playChime();
  if ('speechSynthesis' in window) {
    setTimeout(() => {
      window.speechSynthesis.cancel(); // Clear any ongoing speech
      const formattedToken = String(tokenNumber || '').replace('-', ' ');
      const text = `Token ${formattedToken}, please proceed to ${counterName || 'the assigned counter'}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }, 450);
  }
};
