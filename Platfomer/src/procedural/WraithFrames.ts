import { GameScene } from '../scenes/GameScene';
import { COLORS } from '../config';

export function genWraithFrames(s: GameScene) {
  const draw = (key: string, sc: number, eyes: number, gla: number, jaw: number) => {
    if (s.textures.exists(key)) return;
    const g = s.add.graphics();
    // Smoke trail
    g.fillStyle(COLORS.wraith, 0.3); g.fillEllipse(44, 54, 60 + sc * 8, 20);
    // Body
    g.fillStyle(COLORS.wraith, 0.95); g.fillEllipse(44, 40, 52 + sc * 6, 30 + sc * 4);
    g.fillStyle(0x2a1844, 0.7); g.fillEllipse(44, 38, 44 + sc * 4, 24 + sc * 3);
    // Head lumps
    g.fillStyle(COLORS.wraith, 1);
    g.fillCircle(28, 30, 12 + sc); g.fillCircle(60, 30, 12 + sc);
    // Glow outline
    g.lineStyle(3, COLORS.wraithGlow, gla * 0.6);
    g.strokeEllipse(44, 40, 56 + sc * 8, 34 + sc * 4);
    // Inner glow
    g.fillStyle(COLORS.wraithGlow, gla * 0.3);
    g.fillEllipse(44, 40, 48 + sc * 6, 28 + sc * 3);
    // Eyes
    g.fillStyle(COLORS.wraithEye, 0.9);
    g.fillCircle(44 - eyes, 33, 3.5); g.fillCircle(44 + eyes, 33, 3.5);
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(44 - eyes - 0.5, 32.5, 1.2); g.fillCircle(44 + eyes - 0.5, 32.5, 1.2);
    // Jaw
    g.lineStyle(2.5, 0x8060c0, 0.4);
    g.beginPath(); g.moveTo(36, 50); g.lineTo(44, 50 + jaw); g.lineTo(52, 50); g.strokePath();
    g.generateTexture(key, 88, 84); g.destroy();
  };

  ([[0,9,0.20,2], [1,10,0.24,5], [0,8,0.20,1], [1,9,0.24,4]] as const).forEach(([a,b,c,d], i) => draw('wraith_'+i, a, b, c, d));
  ([[2,12,0.28,6], [3,13,0.32,10], [2,11,0.26,5], [3,12,0.30,9]] as const).forEach(([a,b,c,d], i) => draw('boss_'+i, a, b, c, d));
}
