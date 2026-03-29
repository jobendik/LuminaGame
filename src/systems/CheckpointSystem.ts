import Phaser from 'phaser';
import { ASSET_KEYS } from '../config';
import { ICheckpointData } from '../types';

const ACTIVATION_RADIUS = 72;

export class CheckpointSystem {
  private scene: Phaser.Scene;
  private player!: Phaser.Physics.Arcade.Sprite;
  private checkpoints: {
    data: ICheckpointData;
    sprite: Phaser.GameObjects.Container;
    activated: boolean;
  }[] = [];
  private activeCheckpointIndex = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setPlayer(player: Phaser.Physics.Arcade.Sprite): void {
    this.player = player;
  }

  create(checkpointData: ICheckpointData[]): void {
    for (let i = 0; i < checkpointData.length; i++) {
      const cp = checkpointData[i];

      // Lamppost visual — ornate iron-style lamppost
      const gfx = this.scene.add.graphics();

      // Post shadow
      gfx.fillStyle(0x000000, 0.15);
      gfx.fillEllipse(0, 0, 20, 6);

      // Main post — tapered from base
      gfx.fillStyle(0x3d4a5c, 1);
      gfx.fillRect(-4, -60, 8, 60);
      // Post highlight (left edge)
      gfx.fillStyle(0x6b7d94, 0.5);
      gfx.fillRect(-4, -60, 2, 60);

      // Decorative base plate
      gfx.fillStyle(0x4a5a6e, 1);
      gfx.fillRoundedRect(-10, -4, 20, 6, 2);

      // Crossbar
      gfx.fillStyle(0x3d4a5c, 1);
      gfx.fillRect(-12, -58, 24, 3);
      // Hook arm curving up
      gfx.fillRect(-13, -63, 3, 8);
      gfx.fillRect(10, -63, 3, 8);

      // Lantern housing
      gfx.fillStyle(0x4a5a6e, 1);
      gfx.fillRoundedRect(-8, -72, 16, 14, 3);
      // Lantern cap
      gfx.fillStyle(0x5a6a7e, 1);
      gfx.fillTriangle(-9, -72, 0, -78, 9, -72);

      // Dim inner flame (will brighten on activate)
      gfx.fillStyle(0xffdd88, 0.2);
      gfx.fillCircle(0, -66, 5);
      // Dim outer glow
      gfx.fillStyle(0xffdd88, 0.08);
      gfx.fillCircle(0, -66, 18);

      const container = this.scene.add.container(cp.x, cp.y, [gfx]);
      container.setDepth(3);

      this.checkpoints.push({
        data: cp,
        sprite: container,
        activated: i === 0, // First checkpoint starts activated
      });
    }
  }

  update(): void {
    if (!this.player) return;

    for (let i = 0; i < this.checkpoints.length; i++) {
      const cp = this.checkpoints[i];
      if (cp.activated && i <= this.activeCheckpointIndex) continue;

      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        cp.data.x, cp.data.y,
      );

      if (dist < ACTIVATION_RADIUS) {
        this.activateCheckpoint(i);
      }
    }
  }

  getSpawnPoint(): { x: number; y: number } {
    const cp = this.checkpoints[this.activeCheckpointIndex];
    return { x: cp.data.x, y: cp.data.y - 40 };
  }

  getActiveIndex(): number {
    return this.activeCheckpointIndex;
  }

  restoreIndex(index: number): void {
    for (let i = 0; i <= index && i < this.checkpoints.length; i++) {
      this.checkpoints[i].activated = true;
      // Brighten lamp for already-activated checkpoints
      const gfx = this.checkpoints[i].sprite.getAt(0) as Phaser.GameObjects.Graphics;
      gfx.fillStyle(0xffcc44, 0.9);
      gfx.fillCircle(0, -66, 6);
      gfx.fillStyle(0xffdd88, 0.35);
      gfx.fillCircle(0, -66, 22);
    }
    this.activeCheckpointIndex = index;
  }

  private activateCheckpoint(index: number): void {
    if (index <= this.activeCheckpointIndex) return;

    const cp = this.checkpoints[index];
    cp.activated = true;
    this.activeCheckpointIndex = index;

    // Brighten the lamp glow — warm flame
    const gfx = cp.sprite.getAt(0) as Phaser.GameObjects.Graphics;
    gfx.fillStyle(0xffcc44, 0.9);
    gfx.fillCircle(0, -66, 6);
    gfx.fillStyle(0xffdd88, 0.35);
    gfx.fillCircle(0, -66, 22);
    gfx.fillStyle(0xffeeaa, 0.12);
    gfx.fillCircle(0, -66, 36);

    // Pulse animation
    this.scene.tweens.add({
      targets: cp.sprite,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 200,
      yoyo: true,
      ease: 'Sine.easeOut',
    });

    this.scene.events.emit('checkpoint-activated', cp.data.id);
    this.scene.events.emit('play-sfx', 'sfx-checkpoint', 0.3);
    this.scene.events.emit('show-toast', 'Checkpoint reached', 0xffdd88);
  }
}
