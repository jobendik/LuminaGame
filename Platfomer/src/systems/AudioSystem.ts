import { GameScene } from '../scenes/GameScene';

export function ensureAudio(s: GameScene) {
  if (s.soundStarted) return;
  s.soundStarted = true;
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const reverb = ctx.createConvolver();
  const reverbLen = ctx.sampleRate * 1.5;
  const reverbBuf = ctx.createBuffer(2, reverbLen, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = reverbBuf.getChannelData(ch);
    for (let i = 0; i < reverbLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 2.5);
  }
  reverb.buffer = reverbBuf;
  const reverbGain = ctx.createGain();
  reverbGain.gain.value = 0.15;
  reverb.connect(reverbGain);
  reverbGain.connect(ctx.destination);
  s.audioCtx = ctx; s.audioReverb = reverb;

  if (!s.bgmMusic) {
    s.bgmMusic = s.sound.add('bgm', { loop: true, volume: 0.5 });
    s.bgmMusic.play();
  }
}

export function playChime(s: GameScene, f1: number, f2: number, gv = 0.03) {
  if (!s.audioCtx) return;
  const ctx = s.audioCtx, t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(f1, t);
  osc.frequency.linearRampToValueAtTime(f2, t + 0.3);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(gv, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
  osc.connect(gain); gain.connect(ctx.destination);
  if (s.audioReverb) gain.connect(s.audioReverb);
  osc.start(t); osc.stop(t + 1.1);
}

export function playStormPulse(s: GameScene) {
  if (!s.audioCtx) return;
  const ctx = s.audioCtx, t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.type = 'sawtooth'; osc.frequency.setValueAtTime(80, t);
  osc.frequency.exponentialRampToValueAtTime(35, t + 0.35);
  filter.type = 'lowpass'; filter.frequency.setValueAtTime(200, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.6);
}

export function updateAudioMood(s: GameScene) {
  if (!s.bgmMusic) return;
  const targetVol = s.stormActive ? 0.8 : (s.audioMood === 'calm' ? 0.4 : 0.6);
  const m = s.bgmMusic as any;
  if (m.volume !== undefined) {
    m.volume = Phaser.Math.Linear(m.volume, targetVol, 0.02);
  }
}
