import Phaser from 'phaser';
import { PARALLAX_LAYERS, GAME_WIDTH, GAME_HEIGHT, ParallaxLayerDef } from '../config';

interface ParallaxLayer {
  tileSprite: Phaser.GameObjects.TileSprite;
  scrollFactor: number;
}

export class ParallaxSystem {
  private scene: Phaser.Scene;
  private layers: ParallaxLayer[] = [];
  private layerDefs: readonly ParallaxLayerDef[];

  constructor(scene: Phaser.Scene, layerDefs?: readonly ParallaxLayerDef[]) {
    this.scene = scene;
    this.layerDefs = layerDefs ?? PARALLAX_LAYERS;
  }

  create(): void {
    const scaleY = GAME_HEIGHT / 1080;
    const displayWidth = GAME_WIDTH;

    for (const layerDef of this.layerDefs) {
      const ts = this.scene.add.tileSprite(
        0, 0,
        displayWidth, GAME_HEIGHT,
        layerDef.key
      );
      ts.setOrigin(0, 0);
      ts.setScrollFactor(0);
      ts.setDepth(layerDef.depth);
      ts.setTileScale(scaleY, scaleY);
      if (layerDef.alpha !== undefined) {
        ts.setAlpha(layerDef.alpha);
      }

      this.layers.push({
        tileSprite: ts,
        scrollFactor: layerDef.scrollFactor,
      });
    }
  }

  private velocityBoost = 0;

  update(): void {
    const cam = this.scene.cameras.main;
    // Decay velocity boost smoothly
    this.velocityBoost *= 0.92;
    for (const layer of this.layers) {
      // Shift tile position based on camera scroll × layer's parallax factor + velocity boost
      layer.tileSprite.tilePositionX = cam.scrollX * (layer.scrollFactor + this.velocityBoost * layer.scrollFactor);
    }
  }

  /** Temporarily boost parallax speed (called during dash/fast movement) */
  applyVelocityBoost(amount = 0.3): void {
    this.velocityBoost = Math.min(this.velocityBoost + amount, 0.8);
  }

  /** Tween all layers slightly brighter (tint toward white) */
  brighten(amount = 0.12, duration = 2000): void {
    for (const layer of this.layers) {
      const currentAlpha = layer.tileSprite.alpha;
      const targetAlpha = Math.min(currentAlpha + amount, 1);
      this.scene.tweens.add({
        targets: layer.tileSprite,
        alpha: targetAlpha,
        duration,
        ease: 'Sine.easeInOut',
      });
    }
  }
}
