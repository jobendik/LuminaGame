import { GameScene } from '../scenes/GameScene';
import { COLORS } from '../config';

export function genHeroFrames(s: GameScene) {
  const draw = (key: string, p: any) => {
    if (s.textures.exists(key)) return;
    const g = s.add.graphics();
    const bob = p.bob || 0, tilt = p.tilt || 0, arm = p.arm || 0;
    const legA = p.legA || 0, legB = p.legB || 0;
    const gl = p.glow || 0.18, scarf = p.scarf || 0;

    // Glow aura
    g.fillStyle(COLORS.heroGlow, gl * 0.5);
    g.fillEllipse(32, 36, 32 + Math.abs(arm) * 4, 44);
    g.fillStyle(COLORS.heroGlow, gl * 0.3);
    g.fillEllipse(32, 36, 40 + Math.abs(arm) * 5, 52);

    // Body
    g.fillStyle(COLORS.heroBody, 1);
    g.fillRoundedRect(18, 24 + bob, 28, 30, 10);
    // Body shading
    g.fillStyle(0x3a60b8, 0.6);
    g.fillRoundedRect(20, 26 + bob, 24, 26, 8);
    // Chest plate
    g.fillStyle(0xd8fbff, 0.9); g.fillRoundedRect(23, 27 + bob, 18, 7, 4);
    g.fillStyle(0xffffff, 0.3); g.fillRoundedRect(24, 28 + bob, 12, 3, 2);

    // Arms
    g.lineStyle(5, 0xb0d8ff, 1);
    g.beginPath(); g.moveTo(24, 33 + bob); g.lineTo(14 + arm, 45 + bob + tilt); g.strokePath();
    g.lineStyle(5, 0xc8e8ff, 1);
    g.beginPath(); g.moveTo(40, 33 + bob); g.lineTo(50 - arm, 45 + bob - tilt); g.strokePath();
    // Hands
    g.fillStyle(COLORS.heroSkin, 1);
    g.fillCircle(14 + arm, 46 + bob + tilt, 3);
    g.fillCircle(50 - arm, 46 + bob - tilt, 3);

    // Legs
    g.lineStyle(6, 0x2040a0, 1);
    g.beginPath(); g.moveTo(28, 53 + bob); g.lineTo(24 + legA, 66 + bob); g.strokePath();
    g.beginPath(); g.moveTo(36, 53 + bob); g.lineTo(40 + legB, 66 + bob); g.strokePath();
    // Shoes
    g.fillStyle(0x304080, 1);
    g.fillRoundedRect(21 + legA, 64 + bob, 8, 5, 2);
    g.fillRoundedRect(37 + legB, 64 + bob, 8, 5, 2);

    // Head
    g.fillStyle(COLORS.heroSkin, 1); g.fillCircle(32, 15 + bob, 13);
    // Hair
    g.fillStyle(COLORS.heroHair, 1); g.fillEllipse(32, 8 + bob, 26, 14);
    g.fillStyle(0x1a2a44, 1); g.fillEllipse(32, 6 + bob, 22, 10);
    // Eyes
    g.fillStyle(0x223145, 1); g.fillCircle(28, 15 + bob, 2.2); g.fillCircle(36, 15 + bob, 2.2);
    g.fillStyle(0xffffff, 0.5); g.fillCircle(27.5, 14.5 + bob, 0.8); g.fillCircle(35.5, 14.5 + bob, 0.8);
    // Mouth
    g.lineStyle(1.5, 0xc8a090, 0.5);
    g.beginPath(); g.moveTo(30, 20 + bob); g.lineTo(34, 20 + bob); g.strokePath();

    // Scarf
    if (scarf) {
      g.lineStyle(4, COLORS.heroScarf, 0.9);
      g.beginPath(); g.moveTo(40, 26 + bob); g.lineTo(48 + scarf, 22 + bob); g.strokePath();
      g.lineStyle(3, 0xe8c050, 0.6);
      g.beginPath(); g.moveTo(48 + scarf, 22 + bob); g.lineTo(52 + scarf * 1.2, 26 + bob); g.strokePath();
    }

    g.generateTexture(key, 64, 72); g.destroy();
  };

  const idle = [
    { bob: 0, arm: 0, legA: 0, legB: 0, scarf: 2, glow: 0.16 },
    { bob: -1, arm: 1, legA: -1, legB: 1, scarf: 3, glow: 0.18 },
    { bob: -1.5, arm: 0, legA: 0, legB: 0, scarf: 2, glow: 0.20 },
    { bob: -1, arm: -1, legA: 1, legB: -1, scarf: 1, glow: 0.18 },
  ];
  const run = [
    { bob: 0, arm: -7, legA: -8, legB: 8, scarf: 5, glow: 0.22 },
    { bob: -2, arm: -3, legA: -3, legB: 4, scarf: 4, glow: 0.20 },
    { bob: 1, arm: 4, legA: 6, legB: -6, scarf: -3, glow: 0.23 },
    { bob: 0, arm: 8, legA: 9, legB: -9, scarf: -6, glow: 0.26 },
    { bob: -2, arm: 3, legA: 2, legB: -4, scarf: -4, glow: 0.20 },
    { bob: 1, arm: -4, legA: -6, legB: 6, scarf: 3, glow: 0.23 },
  ];
  const jump = [
    { bob: -3, tilt: -2, arm: -3, legA: -4, legB: 4, scarf: 4, glow: 0.26 },
    { bob: -4, tilt: 2, arm: 4, legA: 6, legB: -2, scarf: 3, glow: 0.28 },
  ];
  const dash = [
    { bob: -1, arm: 10, legA: 8, legB: -8, scarf: 8, glow: 0.38 },
    { bob: 0, arm: 12, legA: 10, legB: -10, scarf: 10, glow: 0.42 },
  ];
  const hurt = [
    { bob: 2, tilt: 4, arm: -6, legA: 3, legB: 6, scarf: -5, glow: 0.15 },
    { bob: 0, tilt: -4, arm: 6, legA: -6, legB: -2, scarf: 5, glow: 0.12 },
  ];
  const wall = [
    { bob: 0, arm: -4, legA: 5, legB: 5, scarf: -3, glow: 0.20 },
    { bob: -1, arm: -3, legA: 6, legB: 4, scarf: -4, glow: 0.22 },
  ];

  idle.forEach((p, i) => draw('hero_idle_' + i, p));
  run.forEach((p, i) => draw('hero_run_' + i, p));
  jump.forEach((p, i) => draw('hero_jump_' + i, p));
  dash.forEach((p, i) => draw('hero_dash_' + i, p));
  hurt.forEach((p, i) => draw('hero_hurt_' + i, p));
  wall.forEach((p, i) => draw('hero_wall_' + i, p));
}
