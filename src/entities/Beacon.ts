import Phaser from 'phaser';

export interface BeaconConfig {
  x: number;
  y: number;
  label: string;
}

export class Beacon extends Phaser.GameObjects.Container {
  public beaconLabel: string;
  public active = false;
  public promptBubble: Phaser.GameObjects.Container;

  private glow: Phaser.GameObjects.Arc;
  private pulse: Phaser.GameObjects.Arc;
  private beaconSprite: Phaser.GameObjects.Graphics;
  private baseY: number;
  private bobPhase: number;

  constructor(scene: Phaser.Scene, config: BeaconConfig, index: number) {
    super(scene, config.x, config.y);

    this.beaconLabel = config.label;
    this.baseY = config.y;
    this.bobPhase = index;

    scene.add.existing(this);
    this.setDepth(18);

    // Beacon pillar — ornate stone pillar with lantern
    this.beaconSprite = scene.add.graphics();

    // Ground shadow
    this.beaconSprite.fillStyle(0x000000, 0.15);
    this.beaconSprite.fillEllipse(0, 2, 36, 8);

    // Stone base — wide
    this.beaconSprite.fillStyle(0x3d4a5c, 1);
    this.beaconSprite.fillRoundedRect(-18, -8, 36, 14, 4);
    this.beaconSprite.fillStyle(0x4a5a70, 0.6);
    this.beaconSprite.fillRoundedRect(-16, -6, 32, 10, 3);

    // Main pillar — tapered
    this.beaconSprite.fillStyle(0x3a4a60, 1);
    this.beaconSprite.fillRect(-10, -70, 20, 64);
    // Pillar highlight
    this.beaconSprite.fillStyle(0x5a6a80, 0.4);
    this.beaconSprite.fillRect(-10, -70, 5, 64);
    // Stone groove details
    this.beaconSprite.lineStyle(1, 0x2a3a50, 0.4);
    this.beaconSprite.lineBetween(-10, -30, 10, -30);
    this.beaconSprite.lineBetween(-10, -50, 10, -50);

    // Pillar cap / capital
    this.beaconSprite.fillStyle(0x4a5a70, 1);
    this.beaconSprite.fillRoundedRect(-14, -76, 28, 8, 3);

    // Lantern housing
    this.beaconSprite.fillStyle(0x556688, 0.9);
    this.beaconSprite.fillRoundedRect(-10, -90, 20, 16, 5);
    // Lantern dome
    this.beaconSprite.fillStyle(0x5a7090, 0.8);
    this.beaconSprite.fillTriangle(-11, -90, 0, -98, 11, -90);

    // Dormant flame
    this.beaconSprite.fillStyle(0xffd080, 0.25);
    this.beaconSprite.fillCircle(0, -83, 6);

    this.add(this.beaconSprite);

    // Glow circle (dim when inactive)
    this.glow = scene.add.circle(config.x, config.y - 83, 36, 0xffd080, 0.10);
    this.glow.setBlendMode(Phaser.BlendModes.SCREEN);
    this.glow.setDepth(16);

    // Pulse ring
    this.pulse = scene.add.circle(config.x, config.y - 83, 20, 0xffd080, 0.08);
    this.pulse.setBlendMode(Phaser.BlendModes.SCREEN);
    this.pulse.setDepth(17);

    // Prompt bubble
    this.promptBubble = scene.add.container(config.x, config.y - 110);
    this.promptBubble.setDepth(60);
    const pb = scene.add.rectangle(0, 0, 120, 32, 0x0a1230, 0.85);
    pb.setStrokeStyle(1, 0xffffff, 0.08);
    const pt = scene.add.text(0, 0, '▸ Hold E', {
      fontFamily: 'Georgia, sans-serif',
      fontSize: '16px',
      color: '#ffd080',
    }).setOrigin(0.5);
    this.promptBubble.add([pb, pt]);
    this.promptBubble.setVisible(false);
  }

  update(time: number): void {
    const bob = Math.sin(time * 0.002 + this.bobPhase) * 3;
    this.y = this.baseY + bob;
    this.glow.y = this.baseY - 83 + bob;
    this.pulse.y = this.baseY - 83 + bob;
    this.promptBubble.y = this.baseY - 110 + bob;

    // Glow breathing
    if (this.active) {
      this.glow.alpha = 0.35 + Math.sin(time * 0.004 + this.bobPhase) * 0.08;
    } else {
      this.glow.alpha = 0.12 + Math.sin(time * 0.004 + this.bobPhase) * 0.03;
    }
  }

  activate(): void {
    if (this.active) return;
    this.active = true;

    // Re-draw lantern as bright flame
    this.beaconSprite.fillStyle(0xffcc44, 1);
    this.beaconSprite.fillCircle(0, -83, 8);
    this.beaconSprite.fillStyle(0xffd080, 0.5);
    this.beaconSprite.fillCircle(0, -83, 12);

    // Brighten glow
    this.glow.setAlpha(0.55);
    this.pulse.setFillStyle(0xffd080, 0.3);

    // Pulsing animation
    this.scene.tweens.add({
      targets: [this.glow, this.pulse],
      scale: { from: 0.9, to: 1.2 },
      alpha: { from: 0.3, to: 0.65 },
      yoyo: true,
      repeat: -1,
      duration: 1100,
    });

    this.hidePrompt();
  }

  showPrompt(): void {
    if (this.active || this.promptBubble.visible) return;
    this.promptBubble.setVisible(true);
    this.promptBubble.setAlpha(0);
    this.scene.tweens.add({ targets: this.promptBubble, alpha: 1, duration: 150 });
  }

  hidePrompt(): void {
    if (!this.promptBubble.visible) return;
    this.scene.tweens.add({
      targets: this.promptBubble,
      alpha: 0,
      duration: 150,
      onComplete: () => this.promptBubble.setVisible(false),
    });
  }

  destroy(fromScene?: boolean): void {
    this.glow?.destroy();
    this.pulse?.destroy();
    this.promptBubble?.destroy();
    super.destroy(fromScene);
  }
}
