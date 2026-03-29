import Phaser from 'phaser';

export class MemoryFragment extends Phaser.Physics.Arcade.Sprite {
  public fragmentId: string;
  public collected = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, fragmentId: string) {
    super(scene, x, y, texture);

    this.fragmentId = fragmentId;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    // Floating animation
    scene.tweens.add({
      targets: this,
      y: y - 8,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Gentle spin
    scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 3200,
      repeat: -1,
      ease: 'Linear',
    });
  }

  collect(): void {
    if (this.collected) return;
    this.collected = true;

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 1.5,
      duration: 400,
      onComplete: () => this.destroy(),
    });
  }
}
