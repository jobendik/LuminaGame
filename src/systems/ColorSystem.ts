import Phaser from 'phaser';
import { lerp, clamp } from '../utils/math';

export class ColorSystem {
  private scene: Phaser.Scene;
  private _saturation = 0.15;
  private targetSaturation = 0.15;
  private colorMatrix: Phaser.FX.ColorMatrix | null = null;
  private bloomOverlay: Phaser.GameObjects.Graphics | null = null;
  private isBloomActive = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    // Apply desaturation using Phaser's built-in ColorMatrix post-FX
    const camera = this.scene.cameras.main;
    if (camera.postFX) {
      this.colorMatrix = camera.postFX.addColorMatrix();
      this.applyDesaturation();
    }

    // Prepare bloom overlay for color burst moments
    this.bloomOverlay = this.scene.add.graphics();
    this.bloomOverlay.setDepth(100);
    this.bloomOverlay.setScrollFactor(0);
    this.bloomOverlay.setAlpha(0);
  }

  setSaturation(value: number): void {
    this.targetSaturation = clamp(value, 0, 1);
  }

  getSaturation(): number {
    return this._saturation;
  }

  /** Increase saturation by a step (used when collecting fragments) */
  addSaturation(amount: number): void {
    this.targetSaturation = clamp(this.targetSaturation + amount, 0, 1);
  }

  /** Full-screen color bloom burst — the "wow moment" */
  triggerColorBloom(color: number = 0xaaccff, duration = 2000): void {
    if (this.isBloomActive || !this.bloomOverlay) return;
    this.isBloomActive = true;

    // Big saturation jump
    this.addSaturation(0.25);

    // Flash overlay
    this.bloomOverlay.clear();
    this.bloomOverlay.fillStyle(color, 1);
    this.bloomOverlay.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);

    this.scene.tweens.add({
      targets: this.bloomOverlay,
      alpha: { from: 0.6, to: 0 },
      duration,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.isBloomActive = false;
      },
    });

    // Camera flash effect
    this.scene.cameras.main.flash(400, 200, 220, 255, false);
  }

  /** Smoothly transition camera background color to target */
  transitionBackground(targetColor: number, duration = 2000): void {
    const camera = this.scene.cameras.main;
    const from = Phaser.Display.Color.IntegerToColor(camera.backgroundColor.color);
    const to = Phaser.Display.Color.IntegerToColor(targetColor);

    this.scene.tweens.addCounter({
      from: 0,
      to: 100,
      duration,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        const t = (tween.getValue() ?? 0) / 100;
        const r = Math.round(from.red + (to.red - from.red) * t);
        const g = Math.round(from.green + (to.green - from.green) * t);
        const b = Math.round(from.blue + (to.blue - from.blue) * t);
        camera.setBackgroundColor(Phaser.Display.Color.GetColor(r, g, b));
      },
    });
  }

  update(_delta: number): void {
    if (Math.abs(this._saturation - this.targetSaturation) > 0.001) {
      this._saturation = lerp(this._saturation, this.targetSaturation, 0.02);
      this.applyDesaturation();
    }
  }

  private applyDesaturation(): void {
    if (!this.colorMatrix) return;
    // Reset and apply grayscale based on inverse saturation
    this.colorMatrix.reset();
    this.colorMatrix.grayscale(1 - this._saturation, false);
  }
}
