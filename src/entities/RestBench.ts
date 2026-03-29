import Phaser from 'phaser';

export interface BenchConfig {
  x: number;
  y: number;
  label?: string;
}

export class RestBench extends Phaser.GameObjects.Container {
  private prompt: Phaser.GameObjects.Text;
  private isResting = false;
  private restTimer = 0;
  private readonly HOLD_TIME = 800; // ms to hold E

  constructor(scene: Phaser.Scene, config: BenchConfig) {
    super(scene, config.x, config.y);
    scene.add.existing(this);

    // Bench visual — HK bench sprite
    const benchSprite = scene.add.image(0, -8, 'hk-bench');
    benchSprite.setScale(0.5);
    this.add(benchSprite);

    // Gentle glow
    const glow = scene.add.ellipse(0, -4, 50, 30, 0x8866cc, 0.06);
    glow.setBlendMode(Phaser.BlendModes.SCREEN);
    this.add(glow);
    scene.tweens.add({
      targets: glow,
      alpha: { from: 0.04, to: 0.09 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.prompt = scene.add.text(0, -28, 'Hold E: Rest', {
      fontSize: '12px',
      color: '#ccbbdd',
      fontFamily: 'monospace',
    });
    this.prompt.setOrigin(0.5, 1);
    this.prompt.setAlpha(0);
    this.add(this.prompt);

    this.setDepth(5);
    this.setSize(48, 24);
  }

  showPrompt(): void {
    if (this.prompt.alpha < 1) {
      this.prompt.setScale(0.7);
      this.scene.tweens.add({ targets: this.prompt, alpha: 1, scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.easeOut' });
    }
  }

  hidePrompt(): void {
    if (this.prompt.alpha > 0) {
      this.scene.tweens.add({ targets: this.prompt, alpha: 0, duration: 150 });
      this.restTimer = 0;
      this.isResting = false;
    }
  }

  holdRest(delta: number): boolean {
    this.restTimer += delta;
    if (this.restTimer >= this.HOLD_TIME) {
      this.restTimer = 0;
      this.isResting = true;
      return true; // heal triggered
    }
    return false;
  }

  get resting(): boolean {
    return this.isResting;
  }

  get holdProgress(): number {
    return Phaser.Math.Clamp(this.restTimer / this.HOLD_TIME, 0, 1);
  }

  resetRest(): void {
    this.isResting = false;
    this.restTimer = 0;
  }
}
