import Phaser from 'phaser';

export class Trigger extends Phaser.GameObjects.Zone {
  public triggerId: string;
  private triggered = false;
  private oneShot: boolean;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    triggerId: string,
    oneShot = true
  ) {
    super(scene, x, y, width, height);

    this.triggerId = triggerId;
    this.oneShot = oneShot;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);
  }

  fire(): void {
    if (this.oneShot && this.triggered) return;
    this.triggered = true;
    this.scene.events.emit('trigger', this.triggerId);
  }
}
