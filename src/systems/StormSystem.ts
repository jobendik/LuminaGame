import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, ASSET_KEYS } from '../config';

const STORM = {
  INITIAL_SPEED: 100,
  MAX_SPEED: 160,
  ACCELERATION: 0.006,
  SHADE_ALPHA: 0.28,
  FRONT_ALPHA: 0.28,
  LIGHTNING_MIN_INTERVAL: 1200,
  LIGHTNING_MAX_INTERVAL: 2500,
  WIND_PARTICLE_FREQ: 80,
} as const;

export class StormSystem {
  private scene: Phaser.Scene;
  private shade!: Phaser.GameObjects.Rectangle;
  private front!: Phaser.GameObjects.Ellipse;
  private warningText!: Phaser.GameObjects.Text;
  private player!: Phaser.Physics.Arcade.Sprite;

  private _active = false;
  private _wallX = 0;
  private speed: number = STORM.INITIAL_SPEED;
  private nextLightningAt = 0;
  private windEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private screenDistortion = 0;
  private warningOverlay!: Phaser.GameObjects.Graphics;
  private warningTriggered = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  get active(): boolean { return this._active; }
  get wallX(): number { return this._wallX; }

  create(player: Phaser.Physics.Arcade.Sprite): void {
    this.player = player;

    this.shade = this.scene.add.rectangle(0, GAME_HEIGHT / 2, 10, GAME_HEIGHT + 200, 0x0b0716, 0.01);
    this.shade.setOrigin(0, 0.5).setDepth(48);

    this.front = this.scene.add.ellipse(-999, GAME_HEIGHT - 142, 200, 560, 0x8866cc, 0.01);
    this.front.setDepth(49).setBlendMode(Phaser.BlendModes.SCREEN);

    this.warningText = this.scene.add.text(0, 0, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '26px',
      color: '#ffe7cb',
    }).setOrigin(0.5).setDepth(250).setScrollFactor(0).setVisible(false);

    // Wind debris particles (horizontal streaks moving right)
    this.windEmitter = this.scene.add.particles(0, 0, ASSET_KEYS.PARTICLE_DUST, {
      speed: { min: 200, max: 400 },
      angle: { min: -10, max: 10 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: { min: 400, max: 800 },
      tint: [0xccaaff, 0xaa88dd, 0x8866cc],
      frequency: -1,
      emitting: false,
    });
    this.windEmitter.setDepth(50);

    // Warning vignette overlay (pulsing red edges when wall is close)
    this.warningOverlay = this.scene.add.graphics();
    this.warningOverlay.setScrollFactor(0);
    this.warningOverlay.setDepth(200);
    this.warningOverlay.setAlpha(0);
  }

  start(): void {
    if (this._active) return;
    this._active = true;
    this._wallX = Math.max(0, this.player.x - 240);
    this.speed = STORM.INITIAL_SPEED;
    this.nextLightningAt = this.scene.time.now + Phaser.Math.Between(STORM.LIGHTNING_MIN_INTERVAL, STORM.LIGHTNING_MAX_INTERVAL);

    this.warningText.setText('The storm is rising — run to the portal!');
    this.warningText.setPosition(this.scene.scale.width / 2, 100);
    this.warningText.setVisible(true);
    this.warningText.setAlpha(0);
    this.scene.tweens.add({
      targets: this.warningText,
      alpha: 1,
      duration: 220,
      yoyo: true,
      hold: 1200,
      onComplete: () => this.warningText.setVisible(false),
    });
  }

  update(delta: number, time: number): void {
    if (!this._active) {
      this.shade.alpha = Phaser.Math.Linear(this.shade.alpha, 0.01, 0.05);
      this.front.alpha = Phaser.Math.Linear(this.front.alpha, 0.01, 0.05);
      return;
    }

    this.speed = Phaser.Math.Linear(this.speed, STORM.MAX_SPEED, STORM.ACCELERATION);
    this._wallX += this.speed * (delta / 1000);

    // Update visuals
    this.shade.x = 0;
    this.shade.displayWidth = Math.max(10, this._wallX);
    this.shade.alpha = STORM.SHADE_ALPHA + Math.sin(time * 0.01) * 0.05;

    this.front.x = this._wallX;
    this.front.alpha = STORM.FRONT_ALPHA + Math.sin(time * 0.015) * 0.07;
    this.front.scaleX = 1 + Math.sin(time * 0.008) * 0.1;

    // Wind debris particles — emit near/ahead of the storm wall
    if (this.windEmitter) {
      const proximity = Math.max(0, 1 - (this.player.x - this._wallX) / 400);
      const count = Math.floor(proximity * 3);
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          this.windEmitter.emitParticleAt(
            this._wallX + Phaser.Math.Between(0, 160),
            Phaser.Math.Between(50, GAME_HEIGHT - 50),
            1,
          );
        }
      }
    }

    // Lightning strikes
    if (time >= this.nextLightningAt) {
      this.nextLightningAt = time + Phaser.Math.Between(STORM.LIGHTNING_MIN_INTERVAL, STORM.LIGHTNING_MAX_INTERVAL);
      // Strike near the storm wall
      const lx = this._wallX + Phaser.Math.Between(-60, 100);
      this.scene.events.emit('storm-lightning', lx, 0, GAME_HEIGHT);
      // Brief screen flash
      this.scene.cameras.main.flash(150, 200, 200, 255, false);
    }

    // Screen distortion — mild camera offset as wall approaches
    const distToWall = this.player.x - this._wallX;
    if (distToWall < 200) {
      this.screenDistortion = Math.sin(time * 0.02) * (1 - distToWall / 200) * 3;
      this.scene.cameras.main.setFollowOffset(0, this.screenDistortion);
    }

    // Proximity warning — pulsing red vignette when wall is near
    const WARNING_DIST = 500;
    if (distToWall < WARNING_DIST) {
      const intensity = (1 - distToWall / WARNING_DIST);
      const pulse = 0.5 + 0.5 * Math.sin(time * 0.008);
      const alpha = intensity * pulse * 0.35;

      this.warningOverlay.clear();
      // Left-edge red gradient strip
      this.warningOverlay.fillGradientStyle(0xff4422, 0xff4422, 0xff4422, 0xff4422, 0.8, 0, 0.8, 0);
      this.warningOverlay.fillRect(0, 0, 80, GAME_HEIGHT);
      // Top/bottom edges
      this.warningOverlay.fillGradientStyle(0xff4422, 0xff4422, 0xff4422, 0xff4422, 0.4, 0.4, 0, 0);
      this.warningOverlay.fillRect(0, 0, GAME_WIDTH, 30);
      this.warningOverlay.fillGradientStyle(0xff4422, 0xff4422, 0xff4422, 0xff4422, 0, 0, 0.4, 0.4);
      this.warningOverlay.fillRect(0, GAME_HEIGHT - 30, GAME_WIDTH, 30);
      this.warningOverlay.setAlpha(alpha);

      // Play warning SFX once when entering danger zone
      if (!this.warningTriggered) {
        this.warningTriggered = true;
        this.scene.events.emit('play-sfx', 'sfx-damage', 0.15);
      }
    } else {
      this.warningOverlay.setAlpha(0);
      this.warningTriggered = false;
    }

    // Damage player if caught by the storm
    if (this.player.x < this._wallX + 20) {
      this.scene.events.emit('storm-damage');
    }
  }

  stop(): void {
    this._active = false;
    this.scene.cameras.main.setFollowOffset(0, 0);
    this.warningOverlay.setAlpha(0);
    this.warningTriggered = false;
  }
}
