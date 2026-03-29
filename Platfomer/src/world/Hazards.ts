import { GameScene } from '../scenes/GameScene';
import { CFG, COLORS } from '../config';
import { damagePlayer } from '../systems/CombatSystem';

export function buildHazards(s: GameScene) {
  s.hazardRects = [];
  s.thorns = s.physics.add.staticGroup();
  [
    [980, CFG.GROUND_Y - 10, 110, 20], [1680, CFG.GROUND_Y - 10, 120, 20],
    [2560, CFG.GROUND_Y - 10, 120, 20], [3560, CFG.GROUND_Y - 10, 120, 20],
    [4200, CFG.GROUND_Y - 10, 100, 20],
    [2080, 328, 80, 16], [3080, 370, 90, 16]
  ].forEach(d => {
    const [x, y, w, h] = d;
    const g = s.add.graphics().setDepth(19);
    for (let i = -w / 2; i < w / 2; i += 12) {
      g.fillStyle(COLORS.thorn, 1);
      g.fillTriangle(x + i, y + 8, x + i + 6, y - 10, x + i + 12, y + 8);
      g.fillStyle(COLORS.thornTip, 0.8);
      g.fillTriangle(x + i + 3, y - 2, x + i + 6, y - 10, x + i + 9, y - 2);
    }
    const rect = s.add.rectangle(x, y, w, h, 0xff0000, 0);
    s.physics.add.existing(rect, true); s.thorns.add(rect);
    s.hazardRects.push({ gfx: g, rect, phase: x * 0.001 });
  });

  s.physics.add.overlap(s.player, s.thorns, (_, thorn: any) => damagePlayer(s, 1, thorn.x, thorn.y, 'Thorns tear at you.'));
}
