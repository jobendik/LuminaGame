import { GameScene } from '../scenes/GameScene';
import { CFG, COLORS } from '../config';

export function buildGround(s: GameScene) {
  // Visual ground with layers
  const gv = s.add.graphics().setDepth(9);
  // Main body
  gv.fillStyle(COLORS.ground, 1);
  gv.fillRect(0, CFG.GROUND_Y + 6, CFG.WORLD_W + 300, 260);
  // Top surface gradient
  gv.fillStyle(COLORS.groundTop, 1);
  gv.fillRect(0, CFG.GROUND_Y - 2, CFG.WORLD_W + 300, 10);
  gv.fillStyle(COLORS.groundMoss, 0.5);
  gv.fillRect(0, CFG.GROUND_Y - 4, CFG.WORLD_W + 300, 4);
  // Dirt texture
  for (let x = 0; x < CFG.WORLD_W; x += 20) {
    const shade = Phaser.Math.Between(-15, 15);
    gv.fillStyle(Phaser.Display.Color.GetColor(26 + shade, 46 + shade, 31 + shade), 0.8);
    gv.fillRect(x, CFG.GROUND_Y + 10, Phaser.Math.Between(10, 30), Phaser.Math.Between(8, 20));
  }

  // Physics ground
  s.ground = s.add.rectangle(CFG.WORLD_W / 2, CFG.GROUND_Y + 92, CFG.WORLD_W + 300, 250, 0x000000, 0);
  s.physics.add.existing(s.ground, true);
}
