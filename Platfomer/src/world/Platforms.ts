import { GameScene } from '../scenes/GameScene';
import { CFG, COLORS } from '../config';

export function buildPlatforms(s: GameScene) {
  s.platforms = s.physics.add.staticGroup();
  s.platformVisuals = [];
  [
    [560, 525, 260, 28], [900, 455, 220, 26], [1220, 390, 220, 26],
    [1520, 335, 220, 26], [1820, 405, 220, 26], [2140, 340, 230, 26],
    [2460, 395, 220, 26], [2790, 325, 240, 26], [3120, 385, 230, 26],
    [3450, 325, 230, 26], [3790, 390, 260, 26], [4100, 460, 220, 26],
    [4400, 380, 200, 26], [4700, 440, 240, 26],
    [700, 280, 130, 22], [2310, 250, 130, 22], [3340, 240, 130, 22],
    [4050, 320, 120, 22], [4600, 300, 120, 22], [5000, 350, 160, 22],
  ].forEach(p => addPlatform(s, p[0], p[1], p[2], p[3]));
}

function addPlatform(s: GameScene, x: number, y: number, w: number, h: number) {
  const visual = s.add.graphics().setDepth(10);
  // Platform body with shading
  visual.fillStyle(COLORS.platform, 1);
  visual.fillRoundedRect(x - w/2, y - h/2 + 4, w, h, 6);
  visual.fillStyle(0x2a4030, 0.7);
  visual.fillRoundedRect(x - w/2 + 2, y - h/2 + 8, w - 4, h - 6, 5);
  // Top surface
  visual.fillStyle(COLORS.platTop, 0.7);
  visual.fillRoundedRect(x - w/2, y - h/2, w, 8, { tl: 6, tr: 6, bl: 0, br: 0 } as any);
  // Glow highlight
  visual.fillStyle(COLORS.platGlow, 0.12);
  visual.fillRect(x - w/2 + 4, y - h/2 + 1, w * 0.9, 3);
  // Moss spots
  for (let i = 0; i < 3; i++) {
    visual.fillStyle(0x5aa870, 0.3);
    visual.fillCircle(x - w/3 + i * w/3, y - h/2 + 2, Phaser.Math.Between(4, 8));
  }

  const phys = s.add.rectangle(x, y, w, h, 0x000000, 0);
  s.physics.add.existing(phys, true);
  s.platforms.add(phys);
  s.platformVisuals.push(visual);
}

export function buildCrumblePlatforms(s: GameScene) {
  s.crumblePlatforms = [];
  [
    { x: 1780, y: 280, w: 110, h: 18 },
    { x: 2940, y: 265, w: 110, h: 18 },
    { x: 4300, y: 280, w: 100, h: 18 }
  ].forEach((d, i) => {
    const g = s.add.graphics().setDepth(18);
    g.fillStyle(0x605060, 1); g.fillRoundedRect(d.x - d.w/2, d.y - d.h/2, d.w, d.h, 5);
    g.lineStyle(2, 0xffa080, 0.25); g.strokeRoundedRect(d.x - d.w/2, d.y - d.h/2, d.w, d.h, 5);
    // Crack lines
    g.lineStyle(1, 0x908080, 0.4);
    g.beginPath(); g.moveTo(d.x - 20, d.y - 4); g.lineTo(d.x + 10, d.y + 2); g.strokePath();

    const rect = s.add.rectangle(d.x, d.y, d.w, d.h, 0x000000, 0).setDepth(17);
    s.physics.add.existing(rect);
    const body = rect.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true); body.setAllowGravity(false);
    const item = { rect, gfx: g, baseX: d.x, baseY: d.y, w: d.w, h: d.h, falling: false, respawning: false, touched: false };
    s.physics.add.collider(s.player, rect, () => triggerCrumble(s, item));
    s.crumblePlatforms.push(item);
  });
}

function triggerCrumble(s: GameScene, item: any) {
  if (!item || item.falling || item.respawning || item.touched) return;
  item.touched = true;
  s.tweens.add({
    targets: [item.rect, item.gfx], angle: { from: -2, to: 2 },
    duration: 60, yoyo: true, repeat: 5,
    onComplete: () => {
      item.falling = true;
      const body = item.rect.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(true); body.setImmovable(false);
      body.setVelocity(0, 50);
      s.tweens.add({ targets: item.gfx, alpha: 0.3, duration: 400 });
      s.time.delayedCall(2200, () => resetCrumble(s, item));
    }
  });
}

function resetCrumble(s: GameScene, item: any) {
  item.falling = false; item.respawning = true;
  const body = item.rect.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(false); body.stop();
  body.setImmovable(true);
  item.rect.x = item.baseX; item.rect.y = item.baseY + 300; item.rect.alpha = 0;
  item.gfx.x = 0; item.gfx.y = 300; item.gfx.alpha = 0;
  s.tweens.add({
    targets: [item.rect], y: item.baseY, alpha: 1, duration: 700,
    onComplete: () => { item.respawning = false; item.touched = false; }
  });
  s.tweens.add({ targets: item.gfx, y: 0, alpha: 1, duration: 700 });
}

export function updateCrumblePlatforms(s: GameScene) {
  s.crumblePlatforms.forEach(it => {
    if (it.falling && it.rect.y > CFG.H + 200) resetCrumble(s, it);
  });
}
