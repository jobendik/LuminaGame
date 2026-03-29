import Phaser from 'phaser';

/**
 * Generates short synthesized sound effects and registers them
 * with Phaser's audio cache so they can be played via scene.sound.play().
 */
export function generateSFX(scene: Phaser.Scene): void {
  const ctx = new AudioContext();

  registerBuffer(scene, 'sfx-jump', createJumpSound(ctx));
  registerBuffer(scene, 'sfx-land', createLandSound(ctx));
  registerBuffer(scene, 'sfx-dash', createDashSound(ctx));
  registerBuffer(scene, 'sfx-collect', createCollectSound(ctx));
  registerBuffer(scene, 'sfx-damage', createDamageSound(ctx));
  registerBuffer(scene, 'sfx-checkpoint', createCheckpointSound(ctx));
  registerBuffer(scene, 'sfx-wraith-aggro', createWraithAggroSound(ctx));
  registerBuffer(scene, 'sfx-dialogue-open', createDialogueOpenSound(ctx));
  registerBuffer(scene, 'sfx-beacon', createBeaconSound(ctx));
  registerBuffer(scene, 'sfx-attack', createAttackSound(ctx));
  registerBuffer(scene, 'sfx-blast', createBlastSound(ctx));
  registerBuffer(scene, 'sfx-enemy-hit', createEnemyHitSound(ctx));
  registerBuffer(scene, 'sfx-enemy-death', createEnemyDeathSound(ctx));
  registerBuffer(scene, 'sfx-boss-telegraph', createBossTelegraphSound(ctx));
  registerBuffer(scene, 'sfx-boss-jump', createBossJumpSound(ctx));
  registerBuffer(scene, 'sfx-boss-land', createBossLandSound(ctx));
  registerBuffer(scene, 'sfx-boss-attack', createBossAttackSound(ctx));
  registerBuffer(scene, 'sfx-boss-stun', createBossStunSound(ctx));
  registerBuffer(scene, 'sfx-boss-death', createBossDeathSound(ctx));
  registerBuffer(scene, 'sfx-bench-rest', createBenchRestSound(ctx));
}

function registerBuffer(scene: Phaser.Scene, key: string, buffer: AudioBuffer): void {
  if (scene.cache.audio.exists(key)) return;
  scene.cache.audio.add(key, buffer);
}

/** Short rising chirp */
function createJumpSound(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const duration = 0.12;
  const length = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(1, length, sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sr;
    const freq = 300 + 600 * (t / duration); // rising pitch
    const env = 1 - t / duration; // fade out
    data[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.35;
  }
  return buffer;
}

/** Low thud */
function createLandSound(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const duration = 0.08;
  const length = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(1, length, sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sr;
    const freq = 120 - 80 * (t / duration); // falling pitch
    const env = 1 - t / duration;
    data[i] = Math.sin(2 * Math.PI * freq * t) * env * env * 0.4;
  }
  return buffer;
}

/** Whoosh — noise burst with falling filter */
function createDashSound(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const duration = 0.18;
  const length = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(1, length, sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sr;
    const noise = Math.random() * 2 - 1;
    const env = 1 - t / duration;
    // Mix noise with a low sine for body
    const sine = Math.sin(2 * Math.PI * 80 * t) * 0.3;
    data[i] = (noise * 0.5 + sine) * env * env * 0.3;
  }
  return buffer;
}

/** Bright two-tone chime */
function createCollectSound(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const duration = 0.3;
  const length = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(1, length, sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sr;
    const env = Math.max(0, 1 - t / duration);
    // Two harmonious tones: E5 and G#5
    const tone1 = Math.sin(2 * Math.PI * 659 * t);
    const tone2 = Math.sin(2 * Math.PI * 831 * t) * (t > 0.08 ? 1 : 0);
    data[i] = (tone1 * 0.3 + tone2 * 0.25) * env * env * 0.4;
  }
  return buffer;
}

/** Impact crunch — noise with low thud */
function createDamageSound(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const duration = 0.15;
  const length = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(1, length, sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sr;
    const env = Math.max(0, 1 - t / duration);
    const noise = (Math.random() * 2 - 1) * 0.4;
    const thud = Math.sin(2 * Math.PI * 60 * t) * 0.5;
    data[i] = (noise + thud) * env * env * 0.35;
  }
  return buffer;
}

/** Warm ascending chime for checkpoint */
function createCheckpointSound(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const duration = 0.35;
  const length = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(1, length, sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sr;
    const env = Math.max(0, 1 - t / duration);
    // Ascending triad: C5 → E5 → G5
    const f = 523 + 200 * (t / duration);
    const tone = Math.sin(2 * Math.PI * f * t);
    const harmonic = Math.sin(2 * Math.PI * f * 1.5 * t) * 0.3;
    data[i] = (tone * 0.3 + harmonic * 0.15) * env * 0.4;
  }
  return buffer;
}

/** Eerie descending whisper for wraith aggro */
function createWraithAggroSound(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const duration = 0.25;
  const length = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(1, length, sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sr;
    const env = Math.max(0, 1 - t / duration);
    // Descending eerie tone with dissonant harmonics
    const f = 400 - 200 * (t / duration);
    const tone = Math.sin(2 * Math.PI * f * t) * 0.2;
    const harmonic = Math.sin(2 * Math.PI * f * 1.47 * t) * 0.12;
    const noise = (Math.random() * 2 - 1) * 0.08;
    data[i] = (tone + harmonic + noise) * env * env * 0.35;
  }
  return buffer;
}

/** Soft chime for dialogue box opening */
function createDialogueOpenSound(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const duration = 0.2;
  const length = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(1, length, sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sr;
    const env = Math.max(0, 1 - t / duration);
    // Soft dual-tone bell
    const tone1 = Math.sin(2 * Math.PI * 880 * t) * 0.15;
    const tone2 = Math.sin(2 * Math.PI * 1320 * t) * 0.1;
    data[i] = (tone1 + tone2) * env * env * 0.3;
  }
  return buffer;
}

/** Rising warm chime for beacon activation */
function createBeaconSound(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const duration = 0.4;
  const length = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(1, length, sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sr;
    const env = Math.max(0, 1 - t / duration);
    // Rising triad: G4 → B4 → D5
    const f = 392 + 300 * (t / duration);
    const tone = Math.sin(2 * Math.PI * f * t) * 0.25;
    const harmonic = Math.sin(2 * Math.PI * f * 1.5 * t) * 0.12;
    data[i] = (tone + harmonic) * env * 0.4;
  }
  return buffer;
}

/** Quick metallic slash for melee attack */
function createAttackSound(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const duration = 0.12;
  const length = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(1, length, sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sr;
    const env = Math.max(0, 1 - t / duration);
    // Metallic slash: bright noise + high sine sweep
    const noise = (Math.random() * 2 - 1) * 0.35;
    const sweep = Math.sin(2 * Math.PI * (1200 - 800 * (t / duration)) * t) * 0.25;
    data[i] = (noise + sweep) * env * env * 0.3;
  }
  return buffer;
}

/** Energy blast projectile launch */
function createBlastSound(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const duration = 0.2;
  const length = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(1, length, sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sr;
    const env = Math.max(0, 1 - t / duration);
    // Rising energy tone with harmonics
    const freq = 200 + 600 * (t / duration);
    const tone = Math.sin(2 * Math.PI * freq * t) * 0.3;
    const overtone = Math.sin(2 * Math.PI * freq * 2.5 * t) * 0.1;
    const noise = (Math.random() * 2 - 1) * 0.1;
    data[i] = (tone + overtone + noise) * env * 0.35;
  }
  return buffer;
}

/** Soft impact when enemy is hit */
function createEnemyHitSound(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const duration = 0.1;
  const length = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(1, length, sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sr;
    const env = Math.max(0, 1 - t / duration);
    const thud = Math.sin(2 * Math.PI * 180 * t) * 0.3;
    const crack = (Math.random() * 2 - 1) * 0.2 * (t < 0.03 ? 1 : 0);
    data[i] = (thud + crack) * env * env * 0.35;
  }
  return buffer;
}

/** Descending whispered hiss — enemy dissolving */
function createEnemyDeathSound(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const duration = 0.4;
  const length = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(1, length, sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sr;
    const env = Math.max(0, 1 - t / duration);
    // Descending tone (ghost fading)
    const freq = 600 - 400 * (t / duration);
    const tone = Math.sin(2 * Math.PI * freq * t) * 0.15;
    // Breathy noise layer
    const noise = (Math.random() * 2 - 1) * 0.12 * env;
    // Sub-bass thud at start
    const thud = Math.sin(2 * Math.PI * 80 * t) * 0.2 * Math.max(0, 1 - t / 0.08);
    data[i] = (tone + noise + thud) * env * 0.4;
  }
  return buffer;
}

/** Rising warning tone — boss about to act */
function createBossTelegraphSound(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const duration = 0.35;
  const length = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(1, length, sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sr;
    const env = Math.min(t / 0.05, 1) * Math.max(0, 1 - t / duration);
    const freq = 220 + 400 * (t / duration) * (t / duration);
    const tone = Math.sin(2 * Math.PI * freq * t) * 0.25;
    const dissonant = Math.sin(2 * Math.PI * freq * 1.06 * t) * 0.15;
    data[i] = (tone + dissonant) * env * 0.4;
  }
  return buffer;
}

/** Whoosh upward — boss jumps */
function createBossJumpSound(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const duration = 0.2;
  const length = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(1, length, sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sr;
    const env = Math.max(0, 1 - t / duration);
    const noise = (Math.random() * 2 - 1) * 0.3;
    const sweep = Math.sin(2 * Math.PI * (150 + 500 * (t / duration)) * t) * 0.25;
    data[i] = (noise + sweep) * env * env * 0.35;
  }
  return buffer;
}

/** Heavy ground impact — boss lands */
function createBossLandSound(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const duration = 0.25;
  const length = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(1, length, sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sr;
    const env = Math.max(0, 1 - t / duration);
    const thud = Math.sin(2 * Math.PI * 55 * t) * 0.5;
    const crack = (Math.random() * 2 - 1) * 0.4 * Math.max(0, 1 - t / 0.04);
    const rumble = Math.sin(2 * Math.PI * 30 * t) * 0.3 * env;
    data[i] = (thud + crack + rumble) * env * env * 0.4;
  }
  return buffer;
}

/** Explosive meteor launch */
function createBossAttackSound(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const duration = 0.3;
  const length = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(1, length, sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sr;
    const env = Math.max(0, 1 - t / duration);
    const burst = (Math.random() * 2 - 1) * 0.3 * Math.max(0, 1 - t / 0.06);
    const low = Math.sin(2 * Math.PI * 90 * t) * 0.35;
    const crackle = Math.sin(2 * Math.PI * (800 - 600 * (t / duration)) * t) * 0.15;
    data[i] = (burst + low + crackle) * env * 0.4;
  }
  return buffer;
}

/** Crystalline shatter — armor breaks, boss stunned */
function createBossStunSound(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const duration = 0.35;
  const length = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(1, length, sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sr;
    const env = Math.max(0, 1 - t / duration);
    // Glass-like shimmer
    const t1 = Math.sin(2 * Math.PI * 1200 * t) * 0.15;
    const t2 = Math.sin(2 * Math.PI * 1800 * t) * 0.1;
    const t3 = Math.sin(2 * Math.PI * 2400 * t) * 0.08;
    const noise = (Math.random() * 2 - 1) * 0.2 * Math.max(0, 1 - t / 0.1);
    data[i] = (t1 + t2 + t3 + noise) * env * env * 0.35;
  }
  return buffer;
}

/** Deep reverberating fade — boss defeated */
function createBossDeathSound(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const duration = 0.8;
  const length = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(1, length, sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sr;
    const env = Math.max(0, 1 - t / duration);
    const deep = Math.sin(2 * Math.PI * 50 * t) * 0.35;
    const mid = Math.sin(2 * Math.PI * (300 - 200 * (t / duration)) * t) * 0.2;
    const shimmer = Math.sin(2 * Math.PI * 800 * t) * 0.08 * Math.max(0, 1 - t / 0.3);
    const noise = (Math.random() * 2 - 1) * 0.06 * env;
    data[i] = (deep + mid + shimmer + noise) * env * env * 0.4;
  }
  return buffer;
}

/** Warm healing chime — resting at a bench */
function createBenchRestSound(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const duration = 0.5;
  const length = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(1, length, sr);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sr;
    const env = Math.max(0, 1 - t / duration);
    // Warm ascending chords
    const f = 440 + 220 * (t / duration);
    const tone = Math.sin(2 * Math.PI * f * t) * 0.2;
    const harmonic = Math.sin(2 * Math.PI * f * 1.5 * t) * 0.12;
    const bell = Math.sin(2 * Math.PI * f * 2 * t) * 0.06;
    data[i] = (tone + harmonic + bell) * env * env * 0.4;
  }
  return buffer;
}
