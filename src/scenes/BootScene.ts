import Phaser from 'phaser';
import { ASSET_KEYS, GAME_WIDTH, GAME_HEIGHT, PARALLAX_LAYERS, DAWN_PARALLAX_LAYERS, PLAYER_SHEET, ENEMY } from '../config';
import { generateSFX } from '../utils/sfx';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.createLoadingBar();
    this.generatePlaceholderAssets();

    // Load parallax background layers (Scene 1 — blue forest)
    for (const layer of PARALLAX_LAYERS) {
      this.load.image(layer.key, layer.file);
    }

    // Load parallax background layers (Scene 2 — dawn)
    for (const layer of DAWN_PARALLAX_LAYERS) {
      this.load.image(layer.key, layer.file);
    }

    // Load audio
    this.load.audio(ASSET_KEYS.MUSIC_AMBIENT, 'audio/Beyond_the_Winding_Ridge.mp3');
    this.load.audio(ASSET_KEYS.MUSIC_DAWN, 'audio/Beneath_the_Damp_Stone.mp3');

    // Load real SFX (keys match procedural names so they take priority)
    this.load.audio('sfx-attack', 'audio/sfx/sword.wav');
    this.load.audio('sfx-blast', 'audio/sfx/hero_blast.wav');
    this.load.audio('sfx-dash', 'audio/sfx/hero_dash.wav');
    this.load.audio('sfx-damage', 'audio/sfx/hero_hit.wav');
    this.load.audio('sfx-jump', 'audio/sfx/hero_jump.mp3');
    this.load.audio('sfx-land', 'audio/sfx/hero_land_hard.wav');
    this.load.audio('sfx-enemy-hit', 'audio/sfx/hit.wav');
    this.load.audio('sfx-enemy-death', 'audio/sfx/crawlid_death.wav');
    this.load.audio('sfx-bench-rest', 'audio/sfx/bench_rest.wav');
    this.load.audio('sfx-boss-telegraph', 'audio/sfx/false_knight_strike.wav');
    this.load.audio('sfx-boss-jump', 'audio/sfx/false_knight_jump.wav');
    this.load.audio('sfx-boss-land', 'audio/sfx/false_knight_land.wav');
    this.load.audio('sfx-boss-attack', 'audio/sfx/false_knight_attack.wav');
    this.load.audio('sfx-boss-stun', 'audio/sfx/false_knight_head_hit.wav');
    this.load.audio('sfx-boss-death', 'audio/sfx/boss.mp3');
    this.load.audio('sfx-victory', 'audio/sfx/victory.mp3');

    // Load crawlid sprite frames
    for (let i = 1; i <= 4; i++) {
      this.load.image(`hk-crawlid-walk-${i}`, `images/crawlid/walk/crawlid_0${i}.png`);
    }
    for (let i = 1; i <= 5; i++) {
      this.load.image(`hk-crawlid-die-${i}`, `images/crawlid/die/die_0${i}.png`);
    }

    // Load boss sprite frames
    for (let i = 1; i <= 5; i++) {
      this.load.image(`hk-boss-idle-${i}`, `images/boss/idle/idle_0${i}.png`);
    }
    for (let i = 1; i <= 6; i++) {
      this.load.image(`hk-boss-atkprep-${i}`, `images/boss/attack_prep/attack_prep_0${i}.png`);
    }
    for (let i = 1; i <= 8; i++) {
      this.load.image(`hk-boss-attack-${i}`, `images/boss/attack/attack_0${i}.png`);
    }
    for (let i = 1; i <= 7; i++) {
      this.load.image(`hk-boss-jump-${i}`, `images/boss/jump/jump_0${i}.png`);
    }
    for (let i = 1; i <= 3; i++) {
      this.load.image(`hk-boss-land-${i}`, `images/boss/land/land_0${i}.png`);
    }
    for (let i = 1; i <= 12; i++) {
      const pad = i < 10 ? `0${i}` : `${i}`;
      this.load.image(`hk-boss-stun-${i}`, `images/boss/stun/stun_${pad}.png`);
    }
    this.load.image('hk-boss-die-1', 'images/boss/die/die_01.png');
    for (let i = 1; i <= 4; i++) {
      this.load.image(`hk-boss-ghost-${i}`, `images/boss/ghost_die/ghost_die_0${i}.png`);
    }

    // Load particle sprites
    for (let i = 1; i <= 3; i++) {
      this.load.image(`hk-hit-${i}`, `images/particles/hit/hit_0${i}.png`);
    }
    for (let i = 1; i <= 7; i++) {
      this.load.image(`hk-blast-${i}`, `images/particles/blast/blast_0${i}.png`);
    }

    // Load object sprites
    this.load.image('hk-bench', 'images/objects/bench.png');
    this.load.image('hk-platform', 'images/objects/platform.png');

    // Load boss door sprites
    for (let i = 1; i <= 3; i++) {
      this.load.image(`hk-boss-door-${i}`, `images/boss_door/boss_door_${i}.png`);
    }

    // Load UI sprites
    this.load.image('hk-health', 'images/ui/health.png');

    // Load hero attack/effect sprites
    this.load.image('hk-attack-1', 'images/hero/attack/attack_01.png');
    this.load.image('hk-attack-2', 'images/hero/attack/attack_02.png');
    this.load.image('hk-attack2-1', 'images/hero/attack2/attack2_01.png');
    this.load.image('hk-attack2-2', 'images/hero/attack2/attack2_02.png');
    for (let i = 1; i <= 5; i++) {
      this.load.image(`hk-dash-${i}`, `images/hero/dash_effect/dash_effect_${i}.png`);
    }
    this.load.image('hk-splash1-1', 'images/hero/splash_1/splash-1_01.png');
    this.load.image('hk-splash1-2', 'images/hero/splash_1/splash-1_02.png');
    this.load.image('hk-splash2-1', 'images/hero/splash_2/splash-2_01.png');

    // Load NPC art
    this.load.image('npc1-sprite', 'images/npc/npc1_sprite.png');
    this.load.image('npc1-portrait', 'images/npc/npc1_portrait.png');
    this.load.image('npc2-sprite', 'images/npc/npc2_sprite.png');
    this.load.image('npc2-portrait', 'images/npc/npc2_portrait.png');
    this.load.image('npc3-sprite', 'images/npc/npc3_sprite.png');
    this.load.image('npc3-portrait', 'images/npc/npc3_portrait.png');
  }

  create(): void {
    // Keep player spritesheet crisp (pixel art) while rest uses smooth filtering
    this.textures.get(ASSET_KEYS.PLAYER)?.setFilter(Phaser.Textures.FilterMode.NEAREST);

    generateSFX(this);
    this.generateWraithFrames();
    this.generateCrawlerFrames();
    this.generateBossFrames();
    this.generateShadowBolt();
    this.generateMeteorTexture();
    this.createHKAnimations();
    this.scene.start('MainMenuScene');
  }

  private createLoadingBar(): void {
    const width = GAME_WIDTH * 0.5;
    const height = 20;
    const x = (GAME_WIDTH - width) / 2;
    const y = GAME_HEIGHT / 2;

    const bg = this.add.rectangle(x + width / 2, y, width, height, 0x222233);
    const bar = this.add.rectangle(x + 2, y, 0, height - 4, 0x6688cc);
    bar.setOrigin(0, 0.5);

    this.load.on('progress', (value: number) => {
      bar.width = (width - 4) * value;
    });

    this.load.on('complete', () => {
      bg.destroy();
      bar.destroy();
    });
  }

  private generatePlaceholderAssets(): void {
    // Player sprite sheet (real art)
    this.load.spritesheet(ASSET_KEYS.PLAYER, PLAYER_SHEET.FILE, {
      frameWidth: PLAYER_SHEET.FRAME_WIDTH,
      frameHeight: PLAYER_SHEET.FRAME_HEIGHT,
    });

    // Platform placeholder — 128x32 mossy stone
    const platGfx = this.make.graphics({});
    // Stone body gradient
    platGfx.fillStyle(0x3a4452, 1);
    platGfx.fillRoundedRect(0, 4, 128, 28, 6);
    platGfx.fillStyle(0x475563, 1);
    platGfx.fillRoundedRect(2, 2, 124, 18, 5);
    // Top highlight
    platGfx.fillStyle(0x5a6a78, 0.7);
    platGfx.fillRoundedRect(4, 2, 120, 8, 4);
    // Moss patches
    platGfx.fillStyle(0x4a6848, 0.6);
    platGfx.fillEllipse(20, 4, 24, 8);
    platGfx.fillEllipse(64, 3, 18, 7);
    platGfx.fillEllipse(105, 5, 22, 8);
    // Stone crack details
    platGfx.lineStyle(1, 0x2d3640, 0.4);
    platGfx.beginPath(); platGfx.moveTo(30, 12); platGfx.lineTo(38, 22); platGfx.strokePath();
    platGfx.beginPath(); platGfx.moveTo(78, 10); platGfx.lineTo(84, 20); platGfx.strokePath();
    platGfx.beginPath(); platGfx.moveTo(100, 14); platGfx.lineTo(108, 8); platGfx.strokePath();
    // Bottom shadow
    platGfx.fillStyle(0x1d2530, 0.5);
    platGfx.fillRoundedRect(2, 24, 124, 8, { tl: 0, tr: 0, bl: 6, br: 6 });
    platGfx.generateTexture(ASSET_KEYS.PLATFORM, 128, 32);
    platGfx.destroy();

    // NPC placeholder — 32x48 warm tone
    const npcGfx = this.make.graphics({});
    npcGfx.fillStyle(0xddaa88, 1);
    npcGfx.fillRect(0, 0, 32, 48);
    npcGfx.generateTexture(ASSET_KEYS.NPC, 32, 48);
    npcGfx.destroy();

    // Particle placeholder — 8x8 soft mote with radial fade
    const dustGfx = this.make.graphics({});
    dustGfx.fillStyle(0xffffff, 0.1);
    dustGfx.fillCircle(4, 4, 4);
    dustGfx.fillStyle(0xffffff, 0.4);
    dustGfx.fillCircle(4, 4, 2.5);
    dustGfx.fillStyle(0xffffff, 0.9);
    dustGfx.fillCircle(4, 4, 1);
    dustGfx.generateTexture(ASSET_KEYS.PARTICLE_DUST, 8, 8);
    dustGfx.destroy();

    // Glow particle — 16x16 soft radial circle for trails and effects
    const glowGfx = this.make.graphics({});
    glowGfx.fillStyle(0xffffff, 0.05);
    glowGfx.fillCircle(8, 8, 8);
    glowGfx.fillStyle(0xffffff, 0.2);
    glowGfx.fillCircle(8, 8, 5);
    glowGfx.fillStyle(0xffffff, 0.6);
    glowGfx.fillCircle(8, 8, 3);
    glowGfx.fillStyle(0xffffff, 0.9);
    glowGfx.fillCircle(8, 8, 1.5);
    glowGfx.generateTexture(ASSET_KEYS.PARTICLE_GLOW, 16, 16);
    glowGfx.destroy();

    // Memory fragment — 32x32 glowing orb with layered halo
    const fragGfx = this.make.graphics({});
    // Outer halo
    fragGfx.fillStyle(0x88bbff, 0.15);
    fragGfx.fillCircle(16, 16, 16);
    // Mid glow
    fragGfx.fillStyle(0xaaccff, 0.4);
    fragGfx.fillCircle(16, 16, 11);
    // Core
    fragGfx.fillStyle(0xddeeff, 0.85);
    fragGfx.fillCircle(16, 16, 7);
    // Hot center
    fragGfx.fillStyle(0xffffff, 0.95);
    fragGfx.fillCircle(16, 16, 3.5);
    // Sparkle highlight
    fragGfx.fillStyle(0xffffff, 0.7);
    fragGfx.fillCircle(13, 12, 1.6);
    fragGfx.generateTexture(ASSET_KEYS.MEMORY_FRAGMENT, 32, 32);
    fragGfx.destroy();

    // Damage particle — 12x12 hot spark with glow falloff
    const dmgGfx = this.make.graphics({});
    dmgGfx.fillStyle(0xff2222, 0.1);
    dmgGfx.fillCircle(6, 6, 6);
    dmgGfx.fillStyle(0xff4444, 0.4);
    dmgGfx.fillCircle(6, 6, 4);
    dmgGfx.fillStyle(0xff8844, 0.8);
    dmgGfx.fillCircle(6, 6, 2.5);
    dmgGfx.fillStyle(0xffdd88, 1);
    dmgGfx.fillCircle(6, 6, 1);
    dmgGfx.generateTexture(ASSET_KEYS.PARTICLE_DAMAGE, 12, 12);
    dmgGfx.destroy();

    // Hazard thorn — 40x36 organic dark spikes with poison tips
    const thornGfx = this.make.graphics({});
    // Base mound
    thornGfx.fillStyle(0x3a2538, 0.8);
    thornGfx.fillEllipse(20, 34, 40, 10);
    // Main spikes with gradients
    thornGfx.fillStyle(0x5a3040, 1);
    thornGfx.fillTriangle(3, 36, 9, 6, 15, 36);
    thornGfx.fillTriangle(12, 36, 20, 0, 28, 36);
    thornGfx.fillTriangle(25, 36, 31, 8, 37, 36);
    // Lighter inner highlights
    thornGfx.fillStyle(0x7a4058, 0.7);
    thornGfx.fillTriangle(6, 36, 9, 14, 12, 36);
    thornGfx.fillTriangle(16, 36, 20, 8, 24, 36);
    thornGfx.fillTriangle(28, 36, 31, 16, 34, 36);
    // Poison tips
    thornGfx.fillStyle(0xcc66aa, 0.6);
    thornGfx.fillCircle(9, 7, 2.5);
    thornGfx.fillCircle(20, 1, 3);
    thornGfx.fillCircle(31, 9, 2.5);
    thornGfx.generateTexture(ASSET_KEYS.HAZARD_THORN, 40, 36);
    thornGfx.destroy();

    // Blast projectile — 20x12 energy bolt
    const blastGfx = this.make.graphics({});
    blastGfx.fillStyle(0x4488ff, 0.15);
    blastGfx.fillEllipse(10, 6, 20, 12);
    blastGfx.fillStyle(0x88bbff, 0.5);
    blastGfx.fillEllipse(10, 6, 14, 8);
    blastGfx.fillStyle(0xccddff, 0.8);
    blastGfx.fillEllipse(10, 6, 8, 5);
    blastGfx.fillStyle(0xffffff, 0.9);
    blastGfx.fillCircle(10, 6, 2);
    blastGfx.generateTexture(ASSET_KEYS.BLAST_PROJECTILE, 20, 12);
    blastGfx.destroy();

    // Slash particle — 16x16 arc for melee attack
    const slashGfx = this.make.graphics({});
    slashGfx.fillStyle(0xffffff, 0.1);
    slashGfx.fillCircle(8, 8, 8);
    slashGfx.fillStyle(0xddeeff, 0.4);
    slashGfx.fillCircle(8, 8, 5);
    slashGfx.fillStyle(0xffffff, 0.8);
    slashGfx.fillCircle(8, 8, 2);
    slashGfx.generateTexture(ASSET_KEYS.PARTICLE_SLASH, 16, 16);
    slashGfx.destroy();
  }

  private generateWraithFrames(): void {
    const bodyColor = ENEMY.WRAITH_BODY_COLOR;
    const glowColor = ENEMY.WRAITH_GLOW_COLOR;
    const eyeColor = ENEMY.WRAITH_EYE_COLOR;

    const draw = (key: string, sc: number, eyes: number, gla: number, jaw: number) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({});
      // Smoke trail
      g.fillStyle(bodyColor, 0.3);
      g.fillEllipse(44, 54, 60 + sc * 8, 20);
      // Body
      g.fillStyle(bodyColor, 0.95);
      g.fillEllipse(44, 40, 52 + sc * 6, 30 + sc * 4);
      g.fillStyle(0x2a1844, 0.7);
      g.fillEllipse(44, 38, 44 + sc * 4, 24 + sc * 3);
      // Head lumps
      g.fillStyle(bodyColor, 1);
      g.fillCircle(28, 30, 12 + sc);
      g.fillCircle(60, 30, 12 + sc);
      // Glow outline
      g.lineStyle(3, glowColor, gla * 0.6);
      g.strokeEllipse(44, 40, 56 + sc * 8, 34 + sc * 4);
      // Inner glow
      g.fillStyle(glowColor, gla * 0.3);
      g.fillEllipse(44, 40, 48 + sc * 6, 28 + sc * 3);
      // Eyes
      g.fillStyle(eyeColor, 0.9);
      g.fillCircle(44 - eyes, 33, 3.5);
      g.fillCircle(44 + eyes, 33, 3.5);
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(44 - eyes - 0.5, 32.5, 1.2);
      g.fillCircle(44 + eyes - 0.5, 32.5, 1.2);
      // Jaw
      g.lineStyle(2.5, 0x8060c0, 0.4);
      g.beginPath();
      g.moveTo(36, 50);
      g.lineTo(44, 50 + jaw);
      g.lineTo(52, 50);
      g.strokePath();
      g.generateTexture(key, 88, 84);
      g.destroy();
    };

    // 4 wraith animation frames
    ([[0, 9, 0.20, 2], [1, 10, 0.24, 5], [0, 8, 0.20, 1], [1, 9, 0.24, 4]] as const)
      .forEach(([a, b, c, d], i) => draw(`wraith_${i}`, a, b, c, d));

    // Float animation
    this.anims.create({
      key: 'wraith-float',
      frames: [
        { key: 'wraith_0' },
        { key: 'wraith_1' },
        { key: 'wraith_2' },
        { key: 'wraith_3' },
      ],
      frameRate: 5,
      repeat: -1,
    });
  }

  private generateCrawlerFrames(): void {
    const bodyColor = ENEMY.CRAWLER_BODY_COLOR;
    const shellColor = ENEMY.CRAWLER_SHELL_COLOR;
    const eyeColor = ENEMY.CRAWLER_EYE_COLOR;

    const drawWalk = (key: string, legPhase: number) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({});
      // Shadow
      g.fillStyle(0x000000, 0.15);
      g.fillEllipse(20, 30, 36, 6);
      // Body
      g.fillStyle(bodyColor, 0.95);
      g.fillRoundedRect(4, 14, 32, 14, 4);
      // Shell plates
      g.fillStyle(shellColor, 0.9);
      g.fillRoundedRect(6, 10, 28, 10, { tl: 6, tr: 6, bl: 2, br: 2 });
      g.fillStyle(shellColor, 0.6);
      g.fillRect(12, 12, 2, 8);
      g.fillRect(20, 12, 2, 8);
      g.fillRect(28, 12, 2, 8);
      // Eyes
      g.fillStyle(eyeColor, 0.9);
      g.fillCircle(32, 16, 2.5);
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(32.5, 15.5, 0.8);
      // Legs (animated by phase)
      g.fillStyle(bodyColor, 0.7);
      const legY = 28;
      for (let i = 0; i < 3; i++) {
        const offset = Math.sin(legPhase + i * 2.1) * 2;
        g.fillRect(8 + i * 10, legY + offset, 3, 4);
      }
      g.generateTexture(key, 40, 32);
      g.destroy();
    };

    const drawDie = (key: string, frame: number) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({});
      const alpha = 1 - frame * 0.3;
      const yOff = frame * 2;
      // Body flips over
      g.fillStyle(bodyColor, alpha * 0.7);
      g.fillRoundedRect(4, 14 + yOff, 32, 14, 4);
      g.fillStyle(shellColor, alpha * 0.5);
      g.fillRoundedRect(6, 18 + yOff, 28, 10, { tl: 2, tr: 2, bl: 6, br: 6 });
      // X eyes
      g.lineStyle(1.5, eyeColor, alpha * 0.6);
      g.beginPath(); g.moveTo(30, 20 + yOff); g.lineTo(34, 24 + yOff); g.strokePath();
      g.beginPath(); g.moveTo(34, 20 + yOff); g.lineTo(30, 24 + yOff); g.strokePath();
      g.generateTexture(key, 40, 32);
      g.destroy();
    };

    // 4 walk frames
    [0, 1.6, 3.2, 4.8].forEach((phase, i) => drawWalk(`crawler_${i}`, phase));

    // 3 death frames
    [0, 1, 2].forEach((f) => drawDie(`crawler_die_${f}`, f));

    this.anims.create({
      key: 'crawler-walk',
      frames: [
        { key: 'crawler_0' },
        { key: 'crawler_1' },
        { key: 'crawler_2' },
        { key: 'crawler_3' },
      ],
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: 'crawler-die',
      frames: [
        { key: 'crawler_die_0' },
        { key: 'crawler_die_1' },
        { key: 'crawler_die_2' },
      ],
      frameRate: 6,
      repeat: 0,
    });
  }

  private generateBossFrames(): void {
    const bodyColor = 0x2a1040;
    const glowColor = 0xaa66ee;
    const eyeColor = 0xee88ff;

    const draw = (key: string, sc: number, eyes: number, gla: number, jaw: number) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({});
      // Smoke trail
      g.fillStyle(bodyColor, 0.35);
      g.fillEllipse(64, 80, 90 + sc * 10, 30);
      // Body — larger than wraith
      g.fillStyle(bodyColor, 0.95);
      g.fillEllipse(64, 60, 78 + sc * 8, 46 + sc * 6);
      g.fillStyle(0x1c0830, 0.7);
      g.fillEllipse(64, 58, 66 + sc * 6, 36 + sc * 4);
      // Head lumps
      g.fillStyle(bodyColor, 1);
      g.fillCircle(38, 42, 18 + sc);
      g.fillCircle(90, 42, 18 + sc);
      // Horns
      g.lineStyle(4, 0x441866, 0.8);
      g.beginPath(); g.moveTo(30, 38); g.lineTo(18, 14); g.strokePath();
      g.beginPath(); g.moveTo(98, 38); g.lineTo(110, 14); g.strokePath();
      // Glow outline
      g.lineStyle(3.5, glowColor, gla * 0.6);
      g.strokeEllipse(64, 60, 82 + sc * 10, 50 + sc * 6);
      // Inner glow
      g.fillStyle(glowColor, gla * 0.3);
      g.fillEllipse(64, 60, 70 + sc * 8, 40 + sc * 5);
      // Eyes — larger, redder
      g.fillStyle(eyeColor, 0.95);
      g.fillCircle(64 - eyes, 48, 5);
      g.fillCircle(64 + eyes, 48, 5);
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(64 - eyes - 0.5, 47, 1.8);
      g.fillCircle(64 + eyes - 0.5, 47, 1.8);
      // Jaw
      g.lineStyle(3, 0x9060d0, 0.5);
      g.beginPath();
      g.moveTo(50, 72);
      g.lineTo(64, 72 + jaw);
      g.lineTo(78, 72);
      g.strokePath();
      g.generateTexture(key, 128, 110);
      g.destroy();
    };

    ([[0, 12, 0.22, 3], [1, 14, 0.26, 6], [0, 11, 0.22, 2], [1, 13, 0.26, 5]] as const)
      .forEach(([a, b, c, d], i) => draw(`boss_${i}`, a, b, c, d));

    this.anims.create({
      key: 'boss-float',
      frames: [
        { key: 'boss_0' },
        { key: 'boss_1' },
        { key: 'boss_2' },
        { key: 'boss_3' },
      ],
      frameRate: 4,
      repeat: -1,
    });
  }

  private generateShadowBolt(): void {
    if (this.textures.exists('shadow-bolt')) return;
    const g = this.make.graphics({});
    g.fillStyle(0x8866cc, 0.9);
    g.fillEllipse(10, 6, 20, 12);
    g.fillStyle(0xcc88ff, 0.5);
    g.fillEllipse(10, 6, 12, 6);
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(10, 6, 2);
    g.generateTexture('shadow-bolt', 20, 12);
    g.destroy();
  }

  private generateMeteorTexture(): void {
    if (this.textures.exists('meteor')) return;
    const g = this.make.graphics({});
    // Outer glow
    g.fillStyle(0xff4422, 0.3);
    g.fillCircle(9, 9, 9);
    // Core
    g.fillStyle(0xff6644, 0.8);
    g.fillCircle(9, 9, 6);
    // Hot center
    g.fillStyle(0xffcc88, 0.9);
    g.fillCircle(9, 9, 3);
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(8, 8, 1.5);
    g.generateTexture('meteor', 18, 18);
    g.destroy();
  }

  private createHKAnimations(): void {
    // --- Crawlid animations (override procedural) ---
    this.anims.create({
      key: 'hk-crawlid-walk',
      frames: [
        { key: 'hk-crawlid-walk-1' },
        { key: 'hk-crawlid-walk-2' },
        { key: 'hk-crawlid-walk-3' },
        { key: 'hk-crawlid-walk-4' },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'hk-crawlid-die',
      frames: [
        { key: 'hk-crawlid-die-1' },
        { key: 'hk-crawlid-die-2' },
        { key: 'hk-crawlid-die-3' },
        { key: 'hk-crawlid-die-4' },
        { key: 'hk-crawlid-die-5' },
      ],
      frameRate: 8,
      repeat: 0,
    });

    // --- Boss animations ---
    this.anims.create({
      key: 'hk-boss-idle',
      frames: Array.from({ length: 5 }, (_, i) => ({ key: `hk-boss-idle-${i + 1}` })),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: 'hk-boss-attack-prep',
      frames: Array.from({ length: 6 }, (_, i) => ({ key: `hk-boss-atkprep-${i + 1}` })),
      frameRate: 8,
      repeat: 0,
    });
    this.anims.create({
      key: 'hk-boss-attack',
      frames: Array.from({ length: 8 }, (_, i) => ({ key: `hk-boss-attack-${i + 1}` })),
      frameRate: 12,
      repeat: 0,
    });
    this.anims.create({
      key: 'hk-boss-jump',
      frames: Array.from({ length: 7 }, (_, i) => ({ key: `hk-boss-jump-${i + 1}` })),
      frameRate: 10,
      repeat: 0,
    });
    this.anims.create({
      key: 'hk-boss-land',
      frames: Array.from({ length: 3 }, (_, i) => ({ key: `hk-boss-land-${i + 1}` })),
      frameRate: 8,
      repeat: 0,
    });
    this.anims.create({
      key: 'hk-boss-stun',
      frames: Array.from({ length: 12 }, (_, i) => ({ key: `hk-boss-stun-${i + 1}` })),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: 'hk-boss-ghost-die',
      frames: Array.from({ length: 4 }, (_, i) => ({ key: `hk-boss-ghost-${i + 1}` })),
      frameRate: 4,
      repeat: 0,
    });

    // --- Attack slash animations ---
    this.anims.create({
      key: 'hk-slash',
      frames: [{ key: 'hk-attack-1' }, { key: 'hk-attack-2' }],
      frameRate: 14,
      repeat: 0,
    });
    this.anims.create({
      key: 'hk-slash2',
      frames: [{ key: 'hk-attack2-1' }, { key: 'hk-attack2-2' }],
      frameRate: 14,
      repeat: 0,
    });

    // --- Blast animation ---
    this.anims.create({
      key: 'hk-blast',
      frames: Array.from({ length: 7 }, (_, i) => ({ key: `hk-blast-${i + 1}` })),
      frameRate: 14,
      repeat: 0,
    });

    // --- Hit effect animation ---
    this.anims.create({
      key: 'hk-hit',
      frames: Array.from({ length: 3 }, (_, i) => ({ key: `hk-hit-${i + 1}` })),
      frameRate: 12,
      repeat: 0,
    });

    // --- Dash effect animation ---
    this.anims.create({
      key: 'hk-dash-effect',
      frames: Array.from({ length: 5 }, (_, i) => ({ key: `hk-dash-${i + 1}` })),
      frameRate: 12,
      repeat: 0,
    });

    // --- Boss door animation ---
    this.anims.create({
      key: 'hk-boss-door-open',
      frames: [
        { key: 'hk-boss-door-1' },
        { key: 'hk-boss-door-2' },
        { key: 'hk-boss-door-3' },
      ],
      frameRate: 4,
      repeat: 0,
    });
  }
}
