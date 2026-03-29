import Phaser from 'phaser';
import { ASSET_KEYS } from '../config';

export interface MovingPlatformConfig {
  x: number;
  y: number;
  type: 'oscillating' | 'crumbling';
  /** For oscillating: total travel distance (px) */
  distance?: number;
  /** For oscillating: 'horizontal' | 'vertical' */
  axis?: 'horizontal' | 'vertical';
  /** For oscillating: movement speed (px/s) */
  speed?: number;
  scaleX?: number;
}

export class MovingPlatform extends Phaser.Physics.Arcade.Sprite {
  private platformType: 'oscillating' | 'crumbling';
  private startX: number;
  private startY: number;
  private distance: number;
  private axis: 'horizontal' | 'vertical';
  private moveSpeed: number;
  private moveDir = 1;
  private crumbling = false;
  private crumbleTimer = 0;
  private readonly CRUMBLE_DELAY = 500;
  private readonly CRUMBLE_FALL_DELAY = 300;
  private readonly RESPAWN_DELAY = 3000;
  private shakeOffset = 0;

  constructor(scene: Phaser.Scene, config: MovingPlatformConfig) {
    super(scene, config.x, config.y, ASSET_KEYS.PLATFORM);

    this.platformType = config.type;
    this.startX = config.x;
    this.startY = config.y;
    this.distance = config.distance ?? 120;
    this.axis = config.axis ?? 'horizontal';
    this.moveSpeed = config.speed ?? 60;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.setAllowGravity(false);

    if (config.scaleX) this.setScale(config.scaleX, 1);
    this.setDepth(3);

    // Visual distinction for crumbling platforms
    if (this.platformType === 'crumbling') {
      this.setTint(0xcc9988);
    }
  }

  preUpdate(time: number, delta: number): void {
    if (this.platformType === 'oscillating') {
      this.updateOscillating(delta);
    } else if (this.platformType === 'crumbling') {
      this.updateCrumbling(delta);
    }
  }

  /** Called by GameScene when player stands on this platform */
  onPlayerStand(): void {
    if (this.platformType === 'crumbling' && !this.crumbling) {
      this.crumbling = true;
      this.crumbleTimer = 0;
    }
  }

  private updateOscillating(delta: number): void {
    const dt = delta / 1000;
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.axis === 'horizontal') {
      this.x += this.moveDir * this.moveSpeed * dt;
      body.velocity.x = this.moveDir * this.moveSpeed;
      body.velocity.y = 0;

      if (this.x >= this.startX + this.distance / 2) {
        this.moveDir = -1;
      } else if (this.x <= this.startX - this.distance / 2) {
        this.moveDir = 1;
      }
    } else {
      this.y += this.moveDir * this.moveSpeed * dt;
      body.velocity.x = 0;
      body.velocity.y = this.moveDir * this.moveSpeed;

      if (this.y >= this.startY + this.distance / 2) {
        this.moveDir = -1;
      } else if (this.y <= this.startY - this.distance / 2) {
        this.moveDir = 1;
      }
    }

    body.updateFromGameObject();
  }

  private updateCrumbling(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.velocity.x = 0;
    body.velocity.y = 0;

    if (!this.crumbling) return;

    this.crumbleTimer += delta;

    // Shake phase
    if (this.crumbleTimer < this.CRUMBLE_DELAY) {
      const intensity = this.crumbleTimer / this.CRUMBLE_DELAY;
      this.shakeOffset = Math.sin(this.crumbleTimer * 0.1) * intensity * 3;
      this.x = this.startX + this.shakeOffset;
      this.setAlpha(1 - intensity * 0.3);
      this.setTint(Phaser.Display.Color.GetColor(
        204 + Math.floor(intensity * 51),
        153 - Math.floor(intensity * 50),
        136 - Math.floor(intensity * 50),
      ));

      // Dust particles during shake
      if (this.crumbleTimer % 80 < delta) {
        this.scene.events.emit('crumble-dust', this.x, this.startY - 4, intensity);
      }
    }
    // Fall phase
    else if (this.crumbleTimer < this.CRUMBLE_DELAY + this.CRUMBLE_FALL_DELAY) {
      const fallProgress = (this.crumbleTimer - this.CRUMBLE_DELAY) / this.CRUMBLE_FALL_DELAY;
      this.setAlpha(1 - fallProgress);
      this.y = this.startY + fallProgress * 60;
      body.updateFromGameObject();
    }
    // Disable
    else if (this.crumbleTimer < this.CRUMBLE_DELAY + this.CRUMBLE_FALL_DELAY + 50) {
      this.setActive(false).setVisible(false);
      body.enable = false;
    }
    // Respawn
    else if (this.crumbleTimer >= this.CRUMBLE_DELAY + this.CRUMBLE_FALL_DELAY + this.RESPAWN_DELAY) {
      this.crumbling = false;
      this.crumbleTimer = 0;
      this.x = this.startX;
      this.y = this.startY;
      this.setAlpha(1).setTint(0xcc9988);
      this.setActive(true).setVisible(true);
      body.enable = true;
      body.updateFromGameObject();
    }
  }
}
