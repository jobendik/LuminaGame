import Phaser from 'phaser';
import { COMBAT, ASSET_KEYS } from '../config';

export class Blast extends Phaser.Physics.Arcade.Sprite {
  private lifeTimer: number;
  private trailTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, dirX: number) {
    super(scene, x, y, ASSET_KEYS.BLAST_PROJECTILE);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(15);
    this.setScale(1.5);
    this.setAlpha(0.9);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocityX(dirX * COMBAT.BLAST_SPEED);
    body.setSize(14, 10);

    this.setFlipX(dirX < 0);
    this.lifeTimer = COMBAT.BLAST_LIFETIME;

    // Pulsing glow
    scene.tweens.add({
      targets: this,
      alpha: { from: 0.9, to: 0.5 },
      scaleX: { from: 1.5, to: 1.8 },
      scaleY: { from: 1.5, to: 1.2 },
      duration: 200,
      yoyo: true,
      repeat: -1,
    });
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.lifeTimer -= delta;

    // Emit trail particles every 30ms
    this.trailTimer += delta;
    if (this.trailTimer >= 30) {
      this.trailTimer = 0;
      this.scene.events.emit('blast-trail', this.x, this.y);
    }

    if (this.lifeTimer <= 0) {
      this.scene.events.emit('blast-impact', this.x, this.y);
      this.destroy();
    }
  }
}
