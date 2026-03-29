import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';

export class ToastSystem {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(GAME_WIDTH / 2, 80);
    this.container.setScrollFactor(0);
    this.container.setDepth(240);
  }

  show(text: string, color = '#ffffff'): void {
    const boxWidth = Math.min(800, 120 + text.length * 5.5);
    const box = this.scene.add.rectangle(0, 0, boxWidth, 42, 0x080e20, 0.82);
    box.setStrokeStyle(1, 0xffffff, 0.05);

    const label = this.scene.add.text(0, 0, text, {
      fontFamily: 'Georgia, sans-serif',
      fontSize: '17px',
      color,
    }).setOrigin(0.5);

    const group = this.scene.add.container(0, 0, [box, label]);
    this.container.add(group);
    group.y = 0;
    group.alpha = 0;

    this.scene.tweens.add({
      targets: group,
      alpha: 1,
      y: -16,
      duration: 180,
      yoyo: true,
      hold: 1800,
      onComplete: () => group.destroy(),
    });
  }
}
