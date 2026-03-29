import { GameScene } from '../scenes/GameScene';

export function buildCursor(s: GameScene) {
  s.customCursor = s.add.image(0, 0, 'cursorTex').setScrollFactor(0).setDepth(999).setAlpha(0.7);
}

export function updateCursor(s: GameScene) {
  s.customCursor.x = s.input.activePointer.x;
  s.customCursor.y = s.input.activePointer.y;
}

export function buildPostFX(s: GameScene) {
  s.vignette = s.add.image(s.scale.width / 2, s.scale.height / 2, 'vignette')
    .setScrollFactor(0).setDepth(280).setDisplaySize(s.scale.width + 20, s.scale.height + 20)
    .setBlendMode(Phaser.BlendModes.MULTIPLY).setAlpha(0.65);
}

export function updatePostFX(s: GameScene, time: number) {
  // Aurora update
  if (s.auroraGraphics) {
    s.auroraGraphics.clear();
    for (let i = 0; i < 5; i++) {
      const x = 100 + i * 280 + Math.sin(time * 0.0003 + i) * 80;
      const y = 40 + Math.sin(time * 0.0005 + i * 0.7) * 30;
      const w = 200 + Math.sin(time * 0.0004 + i * 1.3) * 60;
      const colors = [0x40c890, 0x6080e0, 0xc060d0]; // aurora colors
      s.auroraGraphics.fillStyle(colors[i % 3], 0.02 + Math.sin(time * 0.001 + i) * 0.01);
      s.auroraGraphics.fillEllipse(x, y, w, 60 + Math.sin(time * 0.0006) * 20);
    }
  }
}
