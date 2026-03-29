import Phaser from 'phaser';
import { ASSET_KEYS } from '../config';

export interface HiddenPlatformConfig {
  x: number;
  y: number;
  scaleX?: number;
}

export class HiddenPlatform extends Phaser.Physics.Arcade.Sprite {
  private revealed = false;

  constructor(scene: Phaser.Scene, config: HiddenPlatformConfig) {
    super(scene, config.x, config.y, ASSET_KEYS.PLATFORM);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    this.setScale(config.scaleX ?? 1, 1);
    this.setDepth(2);
    this.setAlpha(0);
    this.setTint(0x88ccff);

    // Start with collisions disabled
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = false;

    // Listen for spirit vision events
    scene.events.on('spirit-vision-activated', this.reveal, this);
    scene.events.on('spirit-vision-deactivated', this.hide, this);
  }

  private reveal(): void {
    if (this.revealed) return;
    this.revealed = true;
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = true;

    // Spirit reveal particle burst
    this.scene.events.emit('hidden-platform-revealed', this.x, this.y);

    this.scene.tweens.add({
      targets: this,
      alpha: 0.7,
      duration: 400,
      ease: 'Sine.easeOut',
    });
  }

  private hide(): void {
    if (!this.revealed) return;
    this.revealed = false;

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 400,
      ease: 'Sine.easeIn',
      onComplete: () => {
        (this.body as Phaser.Physics.Arcade.StaticBody).enable = false;
      },
    });
  }
}
