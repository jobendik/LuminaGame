import Phaser from 'phaser';
import { ASSET_KEYS } from '../config';

export class ParticleSystem {
  private scene: Phaser.Scene;
  private dustEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private ambientEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private dashTrailEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private glideTrailEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private regionEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private spiritAuraEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private currentRegionIndex = -1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    // Ambient floating particles — light motes drifting slowly
    this.ambientEmitter = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_DUST, {
      x: { min: 0, max: 3840 },
      y: { min: 0, max: 720 },
      lifespan: { min: 3000, max: 6000 },
      speed: { min: 5, max: 20 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.4, end: 0 },
      frequency: 300,
      blendMode: 'ADD',
    });
    this.ambientEmitter.setDepth(5);
    this.ambientEmitter.setScrollFactor(0.8);

    // Dash trail — glow particles emitted during dash
    this.dashTrailEmitter = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_GLOW, {
      speed: { min: 10, max: 50 },
      angle: { min: 150, max: 210 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 350,
      blendMode: 'ADD',
      tint: [0x88aadd, 0xaaccff, 0xccddff],
      emitting: false,
    });
    this.dashTrailEmitter.setDepth(4);

    // Glide trail — soft particles drifting upward
    this.glideTrailEmitter = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_DUST, {
      speed: { min: 10, max: 25 },
      angle: { min: 260, max: 280 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.3, end: 0 },
      lifespan: 600,
      blendMode: 'ADD',
      tint: 0xaaccff,
      emitting: false,
    });
    this.glideTrailEmitter.setDepth(4);
  }

  emitDust(x: number, y: number, intensity = 1): void {
    if (!this.dustEmitter) {
      this.dustEmitter = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_DUST, {
        speed: { min: 20, max: 60 },
        angle: { min: 230, max: 310 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 400,
        gravityY: -50,
        emitting: false,
      });
      this.dustEmitter.setDepth(4);
    }

    const count = Math.round(6 * Math.min(intensity, 3));
    this.dustEmitter.emitParticleAt(x, y, count);
  }

  emitDashTrail(x: number, y: number): void {
    this.dashTrailEmitter?.emitParticleAt(x, y, 3);

    // HK dash effect sprite
    const dashFx = this.scene.add.sprite(x, y - 8, 'hk-dash-1');
    dashFx.setDepth(9).setScale(1.2).setAlpha(0.5);
    dashFx.setBlendMode(Phaser.BlendModes.SCREEN);
    dashFx.play('hk-dash-effect');
    dashFx.once('animationcomplete', () => dashFx.destroy());
  }

  emitGlideTrail(x: number, y: number): void {
    this.glideTrailEmitter?.emitParticleAt(x, y, 1);
  }

  /** Start spirit vision aura — blue wisps trailing the player */
  startSpiritAura(): void {
    if (this.spiritAuraEmitter) return;
    this.spiritAuraEmitter = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_GLOW, {
      speed: { min: 15, max: 40 },
      angle: { min: 240, max: 300 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: { min: 500, max: 900 },
      blendMode: 'ADD',
      tint: [0x88eeff, 0x66ccff, 0xaaddff],
      frequency: 120,
      emitting: false,
    });
    this.spiritAuraEmitter.setDepth(11);
  }

  /** Update spirit aura position each frame */
  updateSpiritAura(x: number, y: number): void {
    if (this.spiritAuraEmitter) {
      this.spiritAuraEmitter.emitParticleAt(x + Phaser.Math.Between(-10, 10), y - 16, 1);
    }
  }

  /** Stop spirit vision aura */
  stopSpiritAura(): void {
    if (this.spiritAuraEmitter) {
      this.spiritAuraEmitter.stop();
      this.scene.time.delayedCall(1000, () => {
        this.spiritAuraEmitter?.destroy();
        this.spiritAuraEmitter = null;
      });
    }
  }

  /** Sparkle burst for collecting a memory fragment */
  emitCollectBurst(x: number, y: number, tint = 0xaaccff): void {
    const burst = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_GLOW, {
      x, y,
      speed: { min: 40, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 600,
      blendMode: 'ADD',
      tint,
      quantity: 12,
      emitting: false,
    });
    burst.setDepth(6);
    burst.emitParticleAt(x, y, 12);

    // Auto-cleanup after particles finish
    this.scene.time.delayedCall(700, () => burst.destroy());
  }

  /** Red/orange damage burst at player position */
  emitDamageBurst(x: number, y: number): void {
    const burst = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_GLOW, {
      x, y,
      speed: { min: 60, max: 160 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 400,
      blendMode: 'ADD',
      tint: 0xff6644,
      quantity: 16,
      emitting: false,
    });
    burst.setDepth(20);
    burst.emitParticleAt(x, y, 16);
    this.scene.time.delayedCall(500, () => burst.destroy());
  }

  /** Melee attack slash effect — arc of particles + HK slash sprite overlay */
  emitAttackSlash(x: number, y: number, dir: number, comboStep: number): void {
    const tint = comboStep === 2 ? 0xeeccff : 0xccddff;
    const baseAngle = dir > 0 ? -45 : 135;
    const burst = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_GLOW, {
      x: x + dir * 20, y: y - 16,
      speed: { min: 80, max: 180 },
      angle: { min: baseAngle - 30, max: baseAngle + 30 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 250,
      blendMode: 'ADD',
      tint,
      quantity: 8,
      emitting: false,
    });
    burst.setDepth(16);
    burst.emitParticleAt(x + dir * 20, y - 16, 8);
    this.scene.time.delayedCall(350, () => burst.destroy());

    // HK animated slash sprite overlay
    const animKey = comboStep === 2 ? 'hk-slash2' : 'hk-slash';
    const slash = this.scene.add.sprite(x + dir * 24, y - 12, comboStep === 2 ? 'hk-attack2-1' : 'hk-attack-1');
    slash.setDepth(17).setScale(1.5).setAlpha(0.85).setFlipX(dir < 0);
    slash.setBlendMode(Phaser.BlendModes.ADD);
    slash.setTint(tint);
    slash.play(animKey);
    slash.once('animationcomplete', () => {
      this.scene.tweens.add({
        targets: slash, alpha: 0, duration: 80,
        onComplete: () => slash.destroy(),
      });
    });
  }

  /** Blast launch effect — burst at origin point + HK blast sprite */
  emitBlastLaunch(x: number, y: number, dir: number): void {
    const burst = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_GLOW, {
      x, y,
      speed: { min: 30, max: 90 },
      angle: dir > 0 ? { min: -20, max: 20 } : { min: 160, max: 200 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 300,
      blendMode: 'ADD',
      tint: 0x88bbff,
      quantity: 6,
      emitting: false,
    });
    burst.setDepth(16);
    burst.emitParticleAt(x, y, 6);
    this.scene.time.delayedCall(400, () => burst.destroy());

    // HK blast sprite animation at fire point
    const blastFx = this.scene.add.sprite(x + dir * 16, y, 'hk-blast-1');
    blastFx.setDepth(17).setScale(1.3).setAlpha(0.8).setFlipX(dir < 0);
    blastFx.setBlendMode(Phaser.BlendModes.ADD);
    blastFx.play('hk-blast');
    blastFx.once('animationcomplete', () => blastFx.destroy());
  }

  /** Enemy hit splash — white-purple burst + HK hit sprite */
  emitEnemyHitBurst(x: number, y: number): void {
    const burst = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_GLOW, {
      x, y,
      speed: { min: 50, max: 130 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 350,
      blendMode: 'ADD',
      tint: 0xddaaff,
      quantity: 10,
      emitting: false,
    });
    burst.setDepth(22);
    burst.emitParticleAt(x, y, 10);
    this.scene.time.delayedCall(450, () => burst.destroy());

    // HK animated hit sprite
    const hit = this.scene.add.sprite(x, y, 'hk-hit-1');
    hit.setDepth(23).setScale(1.4).setAlpha(0.9);
    hit.setBlendMode(Phaser.BlendModes.ADD);
    hit.setAngle(Phaser.Math.Between(-20, 20));
    hit.play('hk-hit');
    hit.once('animationcomplete', () => {
      this.scene.tweens.add({
        targets: hit, alpha: 0, scale: 1.8, duration: 60,
        onComplete: () => hit.destroy(),
      });
    });
  }

  emitEnemyDeath(x: number, y: number, type: string): void {
    const tint = type === 'wraith' ? 0xbb88ff : 0x88ddaa;
    const count = type === 'wraith' ? 18 : 12;

    // Outward soul-fragment burst
    const burst = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_GLOW, {
      x, y,
      speed: { min: 40, max: 160 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 600,
      blendMode: 'ADD',
      tint,
      quantity: count,
      emitting: false,
    });
    burst.setDepth(22);
    burst.emitParticleAt(x, y, count);
    this.scene.time.delayedCall(700, () => burst.destroy());

    // Rising wisps (ghost effect)
    const wisps = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_GLOW, {
      x: { min: x - 16, max: x + 16 },
      y,
      speedY: { min: -80, max: -40 },
      speedX: { min: -15, max: 15 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 800,
      blendMode: 'ADD',
      tint: 0xffffff,
      quantity: 6,
      emitting: false,
    });
    wisps.setDepth(22);
    wisps.emitParticleAt(x, y, 6);
    this.scene.time.delayedCall(900, () => wisps.destroy());

    // Type-specific extras
    if (type === 'crawler') {
      // Ground dust cloud — brown dirt puff
      const dust = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_GLOW, {
        x: { min: x - 20, max: x + 20 },
        y,
        speedY: { min: -30, max: -10 },
        speedX: { min: -60, max: 60 },
        scale: { start: 1.5, end: 0.2 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 500,
        tint: [0x886644, 0x997755, 0x665533],
        quantity: 8,
        emitting: false,
      });
      dust.setDepth(21);
      dust.emitParticleAt(x, y, 8);
      this.scene.time.delayedCall(600, () => dust.destroy());
    } else if (type === 'wraith') {
      // Trailing soul wisps — slow rising spirals
      const spirals = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_GLOW, {
        x: { min: x - 24, max: x + 24 },
        y: { min: y - 10, max: y + 10 },
        speedY: { min: -120, max: -60 },
        speedX: { min: -20, max: 20 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.7, end: 0 },
        lifespan: 1200,
        blendMode: 'ADD',
        tint: [0xcc66ff, 0x9944cc, 0xeeccff],
        quantity: 10,
        emitting: false,
      });
      spirals.setDepth(23);
      spirals.emitParticleAt(x, y, 10);
      this.scene.time.delayedCall(1300, () => spirals.destroy());
    }
  }

  emitMeteorImpact(x: number, y: number): void {
    const burst = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_GLOW, {
      x, y,
      speed: { min: 60, max: 180 },
      angle: { min: 200, max: 340 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 400,
      blendMode: 'ADD',
      tint: [0xff6644, 0xff4422, 0xffcc88],
      quantity: 8,
      emitting: false,
    });
    burst.setDepth(55);
    burst.emitParticleAt(x, y, 8);
    this.scene.time.delayedCall(500, () => burst.destroy());
  }

  emitBossStun(x: number, y: number): void {
    // Orbiting stars / daze effect
    const stars = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_GLOW, {
      x: { min: x - 40, max: x + 40 },
      y: { min: y - 30, max: y + 10 },
      speed: { min: 20, max: 60 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 1000,
      blendMode: 'ADD',
      tint: [0x88ccff, 0xaaddff, 0xffffff],
      quantity: 12,
      emitting: false,
    });
    stars.setDepth(55);
    stars.emitParticleAt(x, y, 12);
    this.scene.time.delayedCall(1100, () => stars.destroy());
  }

  emitBossLand(x: number, y: number): void {
    const dust = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_DUST, {
      x, y,
      speed: { min: 40, max: 120 },
      angle: { min: 160, max: 380 },
      scale: { start: 1, end: 0.2 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 500,
      tint: 0x8866cc,
      quantity: 10,
      emitting: false,
    });
    dust.setDepth(22);
    dust.emitParticleAt(x, y, 10);
    this.scene.time.delayedCall(600, () => dust.destroy());
  }

  emitBossDeath(x: number, y: number): void {
    const burst = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_GLOW, {
      x, y,
      speed: { min: 30, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 1200,
      blendMode: 'ADD',
      tint: [0xcc88ff, 0xeeddff, 0xffffff],
      quantity: 25,
      emitting: false,
    });
    burst.setDepth(56);
    burst.emitParticleAt(x, y, 25);
    this.scene.time.delayedCall(1300, () => burst.destroy());
  }

  emitRespawnBloom(x: number, y: number): void {
    // Upward-radiating light motes
    const bloom = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_GLOW, {
      x, y,
      speed: { min: 20, max: 90 },
      angle: { min: 240, max: 300 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 800,
      blendMode: 'ADD',
      tint: [0xaaccff, 0xffffff, 0xddeeff],
      quantity: 14,
      emitting: false,
    });
    bloom.setDepth(55);
    bloom.emitParticleAt(x, y, 14);
    this.scene.time.delayedCall(900, () => bloom.destroy());

    // Expanding ring
    const ring = this.scene.add.circle(x, y, 8, 0xaaccff, 0.4);
    ring.setBlendMode(Phaser.BlendModes.SCREEN);
    ring.setDepth(54);
    this.scene.tweens.add({
      targets: ring,
      scale: 6,
      alpha: 0,
      duration: 600,
      ease: 'Sine.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  emitBlastTrail(x: number, y: number, tint = 0x88bbff): void {
    const mote = this.scene.add.circle(x, y, 3, tint, 0.7);
    mote.setBlendMode(Phaser.BlendModes.SCREEN);
    mote.setDepth(14);
    this.scene.tweens.add({
      targets: mote,
      scale: 0.2,
      alpha: 0,
      duration: 250,
      ease: 'Sine.easeOut',
      onComplete: () => mote.destroy(),
    });
  }

  emitBlastImpact(x: number, y: number): void {
    const burst = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_GLOW, {
      x, y,
      speed: { min: 50, max: 160 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 350,
      blendMode: 'ADD',
      tint: [0x88bbff, 0xaaddff, 0xffffff],
      quantity: 10,
      emitting: false,
    });
    burst.setDepth(15);
    burst.emitParticleAt(x, y, 10);
    this.scene.time.delayedCall(400, () => burst.destroy());
  }

  /** Set region-specific ambient particles. Each region gets unique floating effects. */
  setRegionParticles(regionIndex: number, regionWidth: number): void {
    if (regionIndex === this.currentRegionIndex) return;
    this.currentRegionIndex = regionIndex;

    // Destroy previous region emitter
    if (this.regionEmitter) {
      this.regionEmitter.stop();
      this.scene.time.delayedCall(2000, () => this.regionEmitter?.destroy());
      this.regionEmitter = null;
    }

    const rx = regionIndex * regionWidth;

    switch (regionIndex) {
      case 1: // Echo Forest — green fireflies
        this.regionEmitter = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_GLOW, {
          x: { min: rx, max: rx + regionWidth },
          y: { min: 200, max: 680 },
          lifespan: { min: 2500, max: 5000 },
          speed: { min: 4, max: 18 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.4, end: 0.1 },
          alpha: { start: 0, end: 0 },
          frequency: 400,
          blendMode: 'ADD',
          tint: [0x88dd88, 0xaaff99, 0x66cc66],
        });
        // Pulse alpha for firefly blink
        this.regionEmitter.addEmitZone({
          type: 'random',
          source: new Phaser.Geom.Rectangle(rx, 200, regionWidth, 480),
          quantity: 1,
        });
        this.regionEmitter.setParticleAlpha({ start: 0.6, end: 0, ease: 'Sine.easeInOut' });
        break;

      case 2: // Sunken Ruins — rising bubbles
        this.regionEmitter = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_DUST, {
          x: { min: rx, max: rx + regionWidth },
          y: { min: 600, max: 700 },
          lifespan: { min: 3000, max: 5500 },
          speedY: { min: -30, max: -12 },
          speedX: { min: -5, max: 5 },
          scale: { start: 0.3, end: 0.6 },
          alpha: { start: 0.4, end: 0 },
          frequency: 350,
          blendMode: 'ADD',
          tint: [0x8888cc, 0xaaaaee, 0x6688bb],
        });
        break;

      case 3: // Sky Fracture — wind-blown debris
        this.regionEmitter = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_DUST, {
          x: { min: rx - 50, max: rx },
          y: { min: 100, max: 650 },
          lifespan: { min: 2000, max: 3500 },
          speedX: { min: 30, max: 80 },
          speedY: { min: -8, max: 8 },
          scale: { start: 0.5, end: 0.2 },
          alpha: { start: 0.35, end: 0 },
          frequency: 250,
          blendMode: 'NORMAL',
          tint: [0xddaa66, 0xccaa55, 0xeebb77],
          angle: { min: -10, max: 10 },
        });
        break;

      case 4: // Core Veil — purple spirit wisps
        this.regionEmitter = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_GLOW, {
          x: { min: rx, max: rx + regionWidth },
          y: { min: 100, max: 680 },
          lifespan: { min: 3000, max: 6000 },
          speed: { min: 6, max: 22 },
          angle: { min: 240, max: 300 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 0.5, end: 0 },
          frequency: 300,
          blendMode: 'ADD',
          tint: [0xdd88cc, 0xbb66aa, 0xff99dd],
        });
        break;

      default: // Silent Plains — default motes (handled by ambientEmitter)
        break;
    }

    if (this.regionEmitter) {
      this.regionEmitter.setDepth(3);
      this.regionEmitter.setScrollFactor(0.9);
    }
  }

  /** Echo ripple effect — concentric rings on player action in Echo Forest */
  emitEchoRipple(x: number, y: number): void {
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.circle(x, y, 6, 0x88dd88, 0.3 - i * 0.08);
      ring.setBlendMode(Phaser.BlendModes.SCREEN);
      ring.setDepth(3);
      this.scene.tweens.add({
        targets: ring,
        scale: 3 + i * 2,
        alpha: 0,
        duration: 600 + i * 200,
        delay: i * 150,
        ease: 'Sine.easeOut',
        onComplete: () => ring.destroy(),
      });
    }
  }

  /** Water splash particles for entering/exiting water zones */
  emitWaterSplash(x: number, y: number): void {
    const splash = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_DUST, {
      x, y,
      speed: { min: 30, max: 100 },
      angle: { min: 220, max: 320 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 500,
      tint: [0x8888cc, 0xaaaaee, 0x6688bb],
      quantity: 8,
      emitting: false,
    });
    splash.setDepth(4);
    splash.emitParticleAt(x, y, 8);
    this.scene.time.delayedCall(600, () => splash.destroy());
  }

  emitBeaconFountain(x: number, y: number): void {
    const fountain = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_GLOW, {
      x, y,
      speed: { min: 60, max: 180 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: { min: 600, max: 1200 },
      tint: [0xffd080, 0xffcc44, 0xffe8a0],
      blendMode: 'ADD',
      frequency: 30,
    });
    fountain.setDepth(19);
    // Stop and clean up after burst
    this.scene.time.delayedCall(800, () => fountain.stop());
    this.scene.time.delayedCall(2200, () => fountain.destroy());
  }

  emitArmorBreak(x: number, y: number): void {
    // Crystalline armor shard burst
    const shards = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_GLOW, {
      x, y,
      speed: { min: 80, max: 200 },
      angle: { min: 180, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 700,
      tint: [0x4488cc, 0x66aaff, 0x88ccff],
      quantity: 12,
      emitting: false,
    });
    shards.setDepth(55);
    shards.emitParticleAt(x, y, 12);
    this.scene.time.delayedCall(800, () => shards.destroy());

    // Expanding ring
    const ring = this.scene.add.circle(x, y, 10, 0x88ccff, 0.6);
    ring.setDepth(54).setBlendMode(Phaser.BlendModes.SCREEN);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 6,
      scaleY: 6,
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  emitLightningStrike(x: number, topY: number, bottomY: number): void {
    // Draw jagged lightning bolt
    const g = this.scene.add.graphics();
    g.setDepth(55).setAlpha(0.9);
    g.lineStyle(2, 0xffffff, 1);
    g.beginPath();
    g.moveTo(x, topY);
    let cy = topY;
    while (cy < bottomY) {
      cy += Phaser.Math.Between(20, 50);
      const cx = x + Phaser.Math.Between(-30, 30);
      g.lineTo(cx, Math.min(cy, bottomY));
    }
    g.strokePath();

    // Flash then fade
    this.scene.tweens.add({
      targets: g,
      alpha: 0,
      duration: 250,
      delay: 80,
      onComplete: () => g.destroy(),
    });

    // Impact sparks at bottom
    const sparks = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_GLOW, {
      x, y: bottomY,
      speed: { min: 40, max: 120 },
      angle: { min: 220, max: 320 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 300,
      tint: [0xffffff, 0xccccff, 0x8888ff],
      quantity: 6,
      emitting: false,
    });
    sparks.setDepth(55);
    sparks.emitParticleAt(x, bottomY, 6);
    this.scene.time.delayedCall(400, () => sparks.destroy());
  }
}
