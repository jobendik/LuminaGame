export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const PHYSICS = {
  GRAVITY: 800,
  PLAYER_SPEED: 200,
  PLAYER_JUMP_VELOCITY: -540,
  PLAYER_DASH_VELOCITY: 350,
  PLAYER_DASH_DURATION: 200,
  PLAYER_DASH_COOLDOWN: 600,
  PLAYER_GLIDE_GRAVITY: 100,
  WALL_SLIDE_GRAVITY: 120,
  WALL_JUMP_VELOCITY_X: 260,
  WALL_JUMP_VELOCITY_Y: -460,
  ACCELERATION: 600,
  DECELERATION: 500,
  AIR_CONTROL: 0.7,
} as const;

export const COMBAT = {
  MAX_HEALTH: 10,
  IFRAMES: 1000,
  IFRAMES_BLINKS: 5,
  HIT_FREEZE: 60,
  KNOCKBACK_X: 250,
  KNOCKBACK_Y: -280,
  HURT_DURATION: 400,
  RESPAWN_FADE: 400,
  RESPAWN_DELAY: 500,

  // Melee attack
  ATTACK_DURATION: 300,
  ATTACK_COOLDOWN: 400,
  ATTACK_RANGE: 48,
  ATTACK_DAMAGE: 1,
  ATTACK_KNOCKBACK: 200,
  ATTACK_COMBO_WINDOW: 500,

  // Ranged blast
  BLAST_SPEED: 500,
  BLAST_DAMAGE: 2,
  BLAST_MAX_CHARGES: 3,
  BLAST_COOLDOWN: 600,
  BLAST_LIFETIME: 1200,
  BLAST_CHARGE_ON_HIT: 1,
} as const;

export const CAMERA = {
  LERP: 0.08,
  LOOK_AHEAD: 60,
  VERTICAL_DEADZONE: 50,
} as const;

export const PARALLAX_LAYERS = [
  { key: 'plx-sky',        file: 'images/parallax/10_Sky.png',        scrollFactor: 0.00, depth: -20 },
  { key: 'plx-forest-far', file: 'images/parallax/09_Forest.png',     scrollFactor: 0.05, depth: -19 },
  { key: 'plx-forest-8',   file: 'images/parallax/08_Forest.png',     scrollFactor: 0.10, depth: -18 },
  { key: 'plx-forest-7',   file: 'images/parallax/07_Forest.png',     scrollFactor: 0.16, depth: -17 },
  { key: 'plx-forest-6',   file: 'images/parallax/06_Forest.png',     scrollFactor: 0.24, depth: -16 },
  { key: 'plx-particles-5',file: 'images/parallax/05_Particles.png',  scrollFactor: 0.32, depth: -15 },
  { key: 'plx-forest-4',   file: 'images/parallax/04_Forest.png',     scrollFactor: 0.42, depth: -14 },
  { key: 'plx-particles-3',file: 'images/parallax/03_Particles.png',  scrollFactor: 0.52, depth: -13 },
  { key: 'plx-bushes',     file: 'images/parallax/02_Bushes.png',     scrollFactor: 0.68, depth: -12 },
  { key: 'plx-mist',       file: 'images/parallax/01_Mist.png',       scrollFactor: 0.80, depth: -11 },
] as const;

export type ParallaxLayerDef = { key: string; file: string; scrollFactor: number; depth: number; alpha?: number };

export const DAWN_PARALLAX_LAYERS: ParallaxLayerDef[] = [
  { key: 'dawn-light',   file: 'images/dawn/1.png',  scrollFactor: 0.00, depth: -107 },
  { key: 'dawn-sky',     file: 'images/dawn/2.png',  scrollFactor: 0.05, depth: -106 },
  { key: 'dawn-far',     file: 'images/dawn/3.png',  scrollFactor: 0.12, depth: -105 },
  { key: 'dawn-mid',     file: 'images/dawn/4.png',  scrollFactor: 0.20, depth: -104 },
  { key: 'dawn-near',    file: 'images/dawn/5.png',  scrollFactor: 0.32, depth: -103 },
  { key: 'dawn-fog',     file: 'images/dawn/6.png',  scrollFactor: 0.42, depth: -102, alpha: 0.75 },
  { key: 'dawn-ground',  file: 'images/dawn/7.png',  scrollFactor: 0.55, depth: -101 },
  { key: 'dawn-trees',   file: 'images/dawn/8.png',  scrollFactor: 0.72, depth: -100 },
];

export const COLORS = {
  BACKGROUND: 0xc8ffff,  // matches 10_Sky.png color
  DESATURATED: 0.15,
  FULL_SATURATION: 1.0,
} as const;

export const ASSET_KEYS = {
  PLAYER: 'player',
  PLATFORM: 'platform',
  NPC: 'npc',
  MEMORY_FRAGMENT: 'memory-fragment',
  PARTICLE_DUST: 'particle-dust',
  PARTICLE_GLOW: 'particle-glow',
  PARTICLE_DAMAGE: 'particle-damage',
  PARTICLE_SLASH: 'particle-slash',
  BLAST_PROJECTILE: 'blast-projectile',
  MUSIC_AMBIENT: 'music-ambient',
  MUSIC_LEVEL1: 'music-level1',
  MUSIC_DAWN: 'music-dawn',
  CHECKPOINT: 'checkpoint',
  HAZARD_THORN: 'hazard-thorn',
  WRAITH: 'wraith',
  CRAWLER: 'crawler',
} as const;

export const ENEMY = {
  WRAITH_AGGRO_RADIUS: 250,
  WRAITH_VERTICAL_BAND: 130,
  WRAITH_PATROL_SPEED: 0.0016,
  WRAITH_PATROL_LERP: 0.04,
  WRAITH_CHASE_LERP: 0.05,
  WRAITH_LUNGE_LERP: 0.08,
  WRAITH_LUNGE_DURATION: 340,
  WRAITH_LUNGE_COOLDOWN: 3000,
  WRAITH_AGGRO_TIMEOUT: 1000,
  WRAITH_LUNGE_RANGE: 130,
  WRAITH_GLOW_RADIUS: 32,
  WRAITH_GLOW_COLOR: 0x8866cc,
  WRAITH_BODY_COLOR: 0x3a2050,
  WRAITH_EYE_COLOR: 0xcc88ff,
  WRAITH_HP: 3,
  WRAITH_ORB_SPEED: 140,
  WRAITH_ORB_LIFESPAN: 2500,
  WRAITH_ORB_COOLDOWN: 4500,
  WRAITH_SPIRAL_RADIUS: 80,
  WRAITH_SPIRAL_SPEED: 0.006,
  WRAITH_SPIRAL_DURATION: 1200,
  WRAITH_DIVE_LERP: 0.14,
  CRAWLER_SPEED: 1.2,
  CRAWLER_HP: 2,
  CRAWLER_BODY_COLOR: 0x2a4830,
  CRAWLER_SHELL_COLOR: 0x3a6848,
  CRAWLER_EYE_COLOR: 0xffcc44,
} as const;

export const QUEST = {
  FRAGMENT_TARGET: 6,
  BEACON_TARGET: 2,
  BEACON_ACTIVATE_DIST: 60,
  BEACON_HOLD_TIME: 800,
} as const;

export const PLAYER_SHEET = {
  FILE: 'images/AnimationSheet_Character.png',
  FRAME_WIDTH: 32,
  FRAME_HEIGHT: 32,
  SCALE: 2,
} as const;

export const WORLD_RENDER = {
  PLATFORM: {
    WIDTH: 128,
    HEIGHT: 32,
    REAL_TEXTURE_KEY: 'hk-platform',
  },
  CRAWLER: {
    HEIGHT: 44,
    BODY_WIDTH_RATIO: 0.62,
    BODY_HEIGHT_RATIO: 0.42,
    BODY_OFFSET_X_RATIO: 0.19,
    BODY_OFFSET_Y_RATIO: 0.44,
  },
  BENCH: {
    HEIGHT: 40,
    FOOTPRINT_WIDTH_RATIO: 0.62,
  },
  BOSS_DOOR: {
    HEIGHT: 180,
    BLOCKER_WIDTH: 36,
  },
  BOSS: {
    HEIGHT: 220,
    GHOST_SCALE_MULTIPLIER: 1.1,
    DEATH_MIN_SCALE_MULTIPLIER: 0.25,
  },
} as const;

export const PLAYER_ANIMS = {
  IDLE:        { key: 'player_idle',        frames: [0, 1],                         frameRate: 3,  repeat: -1 },
  WALK:        { key: 'player_walk',        frames: [24, 25, 26, 27, 28, 29, 30, 31], frameRate: 10, repeat: -1 },
  AIR:         { key: 'player_air',         frames: [40, 41, 42, 43, 44, 45, 46, 47], frameRate: 10, repeat: -1 },
  HURT:        { key: 'player_hurt',        frames: [32, 33, 34, 35, 36, 37],       frameRate: 12, repeat: 0  },
  ATTACK:      { key: 'player_attack',      frames: [64, 65, 66, 67, 68, 69, 70, 71], frameRate: 16, repeat: 0  },
  ATTACK2:     { key: 'player_attack2',     frames: [71, 70, 69, 68, 67, 66, 65, 64], frameRate: 16, repeat: 0  },
  BLAST:       { key: 'player_blast',       frames: [64, 65, 66, 67],               frameRate: 14, repeat: 0  },
  DEATH_START: { key: 'player_death_start', frames: [48, 49, 50, 51],               frameRate: 10, repeat: 0  },
  DEATH_FALL:  { key: 'player_death_fall',  frames: [56, 57, 58, 59, 60, 61, 62, 63], frameRate: 10, repeat: 0  },
} as const;
