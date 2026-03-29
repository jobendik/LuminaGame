import Phaser from 'phaser';
import { GAME_HEIGHT } from '../config';

const METEOR_SPEED = 280;
const METEOR_SIZE = 18;

export class Meteor extends Phaser.Physics.Arcade.Sprite {
  private lifetime = 0;
  private trailTimer = 0;

  constructor(scene: Phaser.Scene, x: number) {
    super(scene, x, -METEOR_SIZE, 'meteor');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocityY(METEOR_SPEED);
    body.setSize(METEOR_SIZE, METEOR_SIZE);

    this.setDepth(54);
    this.setAlpha(0.9);

    // Spinning + pulsing
    scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 800,
      repeat: -1,
    });
    scene.tweens.add({
      targets: this,
      scale: { from: 1, to: 1.3 },
      alpha: { from: 0.9, to: 0.6 },
      duration: 300,
      yoyo: true,
      repeat: -1,
    });
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.lifetime += delta;

    // Fire trail every 40ms
    this.trailTimer += delta;
    if (this.trailTimer >= 40) {
      this.trailTimer = 0;
      this.scene.events.emit('meteor-trail', this.x, this.y);
    }

    // Destroy when past ground or after too long
    if (this.y > GAME_HEIGHT + 40 || this.lifetime > 4000) {
      this.scene.events.emit('meteor-impact', this.x, GAME_HEIGHT - 16);
      this.destroy();
    }
  }
}

/** Spawn N meteors spread around a target X position */
export function spawnMeteors(
  scene: Phaser.Scene,
  group: Phaser.Physics.Arcade.Group,
  count: number,
  _bossX: number,
  _bossY: number,
): void {
  const playerX = (scene as Phaser.Scene & { playerSystem?: { getPlayer(): Phaser.Physics.Arcade.Sprite } })
    .playerSystem?.getPlayer()?.x ?? _bossX + 200;

  for (let i = 0; i < count; i++) {
    // Spread around player area with randomness
    const x = playerX + Phaser.Math.Between(-200, 200);
    const meteor = new Meteor(scene, x);
    group.add(meteor);
  }
}
