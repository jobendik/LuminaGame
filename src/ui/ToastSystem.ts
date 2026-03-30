import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';

export class ToastSystem {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private activeToasts: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(GAME_WIDTH / 2, 80);
    this.container.setScrollFactor(0);
    this.container.setDepth(240);
  }

  show(text: string, color = '#ffffff'): void {
    const maxWidth = 440;
    const label = this.scene.add.text(0, 0, text, {
      fontFamily: '"Palatino Linotype", Georgia, serif',
      fontSize: '17px',
      color,
      align: 'center',
      wordWrap: { width: maxWidth - 42 },
      lineSpacing: 4,
    }).setOrigin(0.5);

    const boxWidth = Math.min(maxWidth, Math.max(220, label.width + 42));
    const boxHeight = Math.max(44, label.height + 20);
    const box = this.scene.add.rectangle(0, 0, boxWidth, boxHeight, 0x080e20, 0.88);
    box.setStrokeStyle(1, 0xfff3d0, 0.08);

    const group = this.scene.add.container(0, 0, [box, label]);
    this.container.add(group);
    this.activeToasts.unshift(group);
    this.reflowToasts();
    group.alpha = 0;
    group.setScale(0.96);

    this.scene.tweens.add({
      targets: group,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 180,
      yoyo: true,
      hold: 1800,
      onComplete: () => {
        this.activeToasts = this.activeToasts.filter((toast) => toast !== group);
        group.destroy();
        this.reflowToasts();
      },
    });
  }

  private reflowToasts(): void {
    this.activeToasts.forEach((toast, index) => {
      const targetY = index * 54;
      this.scene.tweens.add({
        targets: toast,
        y: targetY,
        duration: 140,
        ease: 'Sine.easeOut',
      });
    });
  }
}
