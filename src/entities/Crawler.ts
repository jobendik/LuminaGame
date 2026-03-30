import Phaser from 'phaser';
import { ENEMY, WORLD_RENDER } from '../config';
import { REGIONS } from '../data/regions';

const WORLD_WIDTH = 3840;
const REGION_WIDTH = WORLD_WIDTH / REGIONS.length;

export interface CrawlerConfig {
  x: number;
  y: number;
  patrolLeft: number;
  patrolRight: number;
}

export class Crawler extends Phaser.Physics.Arcade.Sprite {
  private patrolLeft: number;
  private patrolRight: number;
  private speed: number;
  private dir = 1;
  private hp: number;
  private _dead = false;
  private stunUntil = 0;
  private recoilVx = 0;
  private player: Phaser.Physics.Arcade.Sprite | null = null;
  private agitated = false;
  private agitatedUntil = 0;
  private edgePauseUntil = 0;
  private regionTint: number;
  private regionSpeedMult: number;

  constructor(scene: Phaser.Scene, config: CrawlerConfig) {
    super(scene, config.x, config.y, 'hk-crawlid-walk-1');

    this.patrolLeft = config.patrolLeft;
    this.patrolRight = config.patrolRight;
    this.speed = ENEMY.CRAWLER_SPEED;
    this.hp = ENEMY.CRAWLER_HP;

    // Region variation: tint & speed
    const ri = Math.min(Math.floor(config.x / REGION_WIDTH), REGIONS.length - 1);
    this.regionTint = REGIONS[ri].palette.accent;
    this.regionSpeedMult = 1 + ri * 0.08; // later regions slightly faster

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    this.setScale(WORLD_RENDER.CRAWLER.HEIGHT / this.height);
    body.setSize(
      this.width * WORLD_RENDER.CRAWLER.BODY_WIDTH_RATIO,
      this.height * WORLD_RENDER.CRAWLER.BODY_HEIGHT_RATIO,
    );
    body.setOffset(
      this.width * WORLD_RENDER.CRAWLER.BODY_OFFSET_X_RATIO,
      this.height * WORLD_RENDER.CRAWLER.BODY_OFFSET_Y_RATIO,
    );
    body.setAllowGravity(true);
    body.setBounce(0);

    this.setDepth(21);
    this.play('hk-crawlid-walk');
    this.setTint(this.regionTint);

    // Spawn fade-in
    this.setAlpha(0);
    scene.tweens.add({ targets: this, alpha: 1, duration: 400, ease: 'Sine.easeIn' });
  }

  get isDead(): boolean {
    return this._dead;
  }

  setPlayer(player: Phaser.Physics.Arcade.Sprite): void {
    this.player = player;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this._dead) return;

    // Hit stun — slide via recoil, skip patrol
    if (time < this.stunUntil) {
      this.x += this.recoilVx * (delta / 16.67);
      this.recoilVx *= 0.85;
      return;
    }

    // Edge pause — briefly stop at patrol boundary
    if (time < this.edgePauseUntil) {
      this.anims.pause();
      return;
    }
    if (this.anims.isPaused) this.anims.resume();

    // Check for player proximity → agitated state
    if (this.player && this.player.active) {
      const dx = this.player.x - this.x;
      const dy = this.player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 200 && Math.abs(dy) < 80) {
        this.agitated = true;
        this.agitatedUntil = time + 2000;
      }
    }

    if (this.agitated && time < this.agitatedUntil) {
      // Agitated: chase player at 1.8x speed
      const chaseSpeed = this.speed * 1.8;
      const chaseDir = this.player && this.player.x > this.x ? 1 : -1;
      this.x += chaseDir * chaseSpeed * (delta / 16.67);
      this.setFlipX(chaseDir < 0);

      // Clamp to extended patrol range
      if (this.x >= this.patrolRight + 60) {
        this.x = this.patrolRight + 60;
      } else if (this.x <= this.patrolLeft - 60) {
        this.x = this.patrolLeft - 60;
      }

      // Tint red when agitated + jitter
      this.setTint(0xff8888);
      this.y += Math.sin(time * 0.04) * 0.6;
      return;
    }

    // Reset tint when calming down
    if (this.agitated) {
      this.agitated = false;
      this.setTint(this.regionTint);
    }

    // Patrol: walk back and forth between bounds
    this.x += this.dir * this.speed * this.regionSpeedMult * (delta / 16.67);

    if (this.x >= this.patrolRight) {
      this.dir = -1;
      this.edgePauseUntil = time + 300 + Math.random() * 400;
    } else if (this.x <= this.patrolLeft) {
      this.dir = 1;
      this.edgePauseUntil = time + 300 + Math.random() * 400;
    }

    this.setFlipX(this.dir < 0);
  }

  takeDamage(amount: number, hitDirX = 0): void {
    if (this._dead) return;
    this.hp -= amount;

    // Flash white on hit
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.active && !this._dead) this.setTint(this.regionTint);
    });

    // Hit stun + recoil
    this.stunUntil = this.scene.time.now + 150;
    this.recoilVx = hitDirX * 5;

    // Squash/stretch on impact
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.75,
      scaleY: 1.25,
      duration: 50,
      yoyo: true,
      ease: 'Sine.easeOut',
    });

    if (this.hp <= 0) {
      this.die();
    }
  }

  private die(): void {
    this._dead = true;

    // Stop movement
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setAllowGravity(false);

    // Play death animation
    this.play('hk-crawlid-die');
    this.setTint(0x886688);

    // Emit death event for particles/sfx
    this.scene.events.emit('enemy-death', this.x, this.y, 'crawler');

    // Fade out and destroy
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y - 12,
      duration: 500,
      delay: 200,
      onComplete: () => this.destroy(),
    });
  }
}
