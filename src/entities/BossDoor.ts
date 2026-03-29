import Phaser from 'phaser';

export interface BossDoorConfig {
  x: number;
  y: number;
  killsRequired: number;
}

export class BossDoor extends Phaser.GameObjects.Container {
  private doorSprite: Phaser.GameObjects.Sprite;
  private glow: Phaser.GameObjects.Ellipse;
  private prompt: Phaser.GameObjects.Text;
  private _isOpen = false;
  private killsRequired: number;
  private zone: Phaser.GameObjects.Zone;

  constructor(scene: Phaser.Scene, config: BossDoorConfig) {
    super(scene, config.x, config.y);
    scene.add.existing(this);
    this.killsRequired = config.killsRequired;

    // Door visual — HK boss door sprite
    this.doorSprite = scene.add.sprite(0, -40, 'hk-boss-door-1');
    this.doorSprite.setScale(0.8);
    this.add(this.doorSprite);

    // Pulsing seal glow
    this.glow = scene.add.ellipse(0, -40, 30, 60, 0xcc4488, 0.15);
    this.glow.setBlendMode(Phaser.BlendModes.SCREEN);
    this.add(this.glow);
    scene.tweens.add({
      targets: this.glow,
      alpha: { from: 0.1, to: 0.22 },
      scaleX: { from: 0.9, to: 1.15 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Kill counter prompt
    this.prompt = scene.add.text(0, -90, '', {
      fontSize: '11px',
      color: '#cc88aa',
      fontFamily: 'monospace',
      align: 'center',
    });
    this.prompt.setOrigin(0.5, 1);
    this.prompt.setAlpha(0);
    this.add(this.prompt);

    this.setDepth(6);

    // Physics zone for blocking player
    this.zone = scene.add.zone(config.x, config.y - 40, 20, 80);
    scene.physics.add.existing(this.zone, true);
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  getZone(): Phaser.GameObjects.Zone {
    return this.zone;
  }

  showPrompt(kills: number): void {
    if (this._isOpen) return;
    this.prompt.setText(`Defeat enemies\n${kills}/${this.killsRequired}`);
    if (this.prompt.alpha < 1) {
      this.scene.tweens.add({ targets: this.prompt, alpha: 1, duration: 150 });
    }
  }

  hidePrompt(): void {
    if (this.prompt.alpha > 0) {
      this.scene.tweens.add({ targets: this.prompt, alpha: 0, duration: 150 });
    }
  }

  tryOpen(kills: number): boolean {
    if (this._isOpen) return true;
    if (kills < this.killsRequired) return false;

    this._isOpen = true;

    // Play door open animation
    this.doorSprite.play('hk-boss-door-open');

    // Dramatic open animation
    this.scene.tweens.add({
      targets: this.glow,
      alpha: 0.6,
      scaleX: 2,
      scaleY: 2,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: [this.doorSprite, this.glow, this.prompt],
          alpha: 0,
          duration: 400,
          onComplete: () => {
            // Remove physics blocker
            (this.zone.body as Phaser.Physics.Arcade.StaticBody).enable = false;
          },
        });
      },
    });

    this.scene.events.emit('boss-door-opened');
    this.scene.events.emit('play-sfx', 'sfx-beacon', 0.5);
    this.scene.cameras.main.flash(200, 180, 80, 160, false);
    return true;
  }
}
