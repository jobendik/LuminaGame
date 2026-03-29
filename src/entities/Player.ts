import Phaser from 'phaser';
import { PLAYER_SHEET } from '../config';

/**
 * Player entity — thin wrapper for player-specific sprite configuration.
 * Heavy logic lives in PlayerSystem; this class handles sprite setup.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string = 'player') {
    super(scene, x, y, texture, 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(PLAYER_SHEET.SCALE);
    this.setOrigin(0.5, 1);
    this.setDepth(10);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(14, 24);
    body.setOffset(9, 8);
    body.setCollideWorldBounds(true);
    body.setMaxVelocity(200, 600);
  }
}
