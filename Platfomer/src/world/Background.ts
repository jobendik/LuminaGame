import { GameScene } from '../scenes/GameScene';
import { CFG, COLORS } from '../config';

export function buildBackground(s: GameScene) {
  // Deep sky
  s.add.rectangle(0, 0, CFG.WORLD_W, CFG.H, COLORS.bg).setOrigin(0,0).setScrollFactor(0);

  // Gradient sky
  const skyG = s.add.graphics().setScrollFactor(0).setDepth(0);
  for (let y = 0; y < 400; y += 4) {
    const t = y / 400;
    const r = Math.floor(5 + t * 15);
    const g2 = Math.floor(13 + t * 25);
    const b = Math.floor(30 + t * 40);
    skyG.fillStyle(Phaser.Display.Color.GetColor(r, g2, b), 0.6);
    skyG.fillRect(0, y, CFG.W + 100, 6);
  }

  // Aurora borealis effect
  s.auroraGraphics = s.add.graphics().setScrollFactor(0.01).setDepth(1).setBlendMode(Phaser.BlendModes.SCREEN);

  // Nebulae
  s.add.ellipse(300, 120, 800, 340, COLORS.nebula1, 0.12).setScrollFactor(0.02).setBlendMode(Phaser.BlendModes.SCREEN);
  s.add.ellipse(1600, 160, 1100, 420, COLORS.nebula2, 0.07).setScrollFactor(0.01).setBlendMode(Phaser.BlendModes.SCREEN);
  s.add.ellipse(900, 70, 380, 140, 0xffffff, 0.05).setScrollFactor(0.015).setBlendMode(Phaser.BlendModes.SCREEN);

  // Moon with halo
  const moonHalo = s.add.circle(1100, 130, 80, COLORS.moon, 0.06).setScrollFactor(0.03).setBlendMode(Phaser.BlendModes.SCREEN);
  const moon = s.add.circle(1100, 130, 44, COLORS.moon, 0.5).setScrollFactor(0.03);
  s.add.circle(1108, 126, 38, 0xc8d8f0, 0.12).setScrollFactor(0.03);
  s.tweens.add({ targets: [moon, moonHalo], alpha: { from: 0.35, to: 0.55 }, duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  // Stars - varied sizes and twinkle
  for (let i = 0; i < 320; i++) {
    const sz = Phaser.Math.FloatBetween(0.5, 2.5);
    const a = Phaser.Math.FloatBetween(0.25, 0.95);
    const star = s.add.circle(
      Phaser.Math.Between(0, CFG.WORLD_W),
      Phaser.Math.Between(0, 280),
      sz, COLORS.star, a
    ).setScrollFactor(Phaser.Math.FloatBetween(0.01, 0.06));
    if (Math.random() > 0.6) {
      s.tweens.add({
        targets: star, alpha: { from: a * 0.2, to: a },
        duration: Phaser.Math.Between(800, 4000), yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  // Distant mountains / skyline
  const skyline = s.add.graphics().setScrollFactor(0.12).setDepth(2);
  skyline.fillStyle(0x182848, 0.9);
  for (let x = 0; x < CFG.WORLD_W; x += 80) {
    const h = Phaser.Math.Between(80, 240);
    const w = Phaser.Math.Between(60, 120);
    skyline.fillTriangle(x, CFG.GROUND_Y - 20, x + w/2, CFG.GROUND_Y - 20 - h, x + w, CFG.GROUND_Y - 20);
  }

  // Midground trees
  const mg = s.add.graphics().setScrollFactor(0.4).setDepth(3);
  for (let i = 0; i < 40; i++) {
    const x = i * 140 + Phaser.Math.Between(-20, 20);
    const h = Phaser.Math.Between(100, 180);
    mg.fillStyle(0x1a3a2a, 0.95); mg.fillRect(x + 28, CFG.GROUND_Y - h + 44, 10, h);
    const colors = [0x2a6a44, 0x2d7a4e, 0x348a58];
    colors.forEach((c, j) => {
      mg.fillStyle(c, 0.85 - j * 0.1);
      mg.fillEllipse(x + j * 6, CFG.GROUND_Y - h + 80 + j * 12, 80 - j * 8, 100 - j * 10);
    });
  }

  // Foreground grass blades
  const fg = s.add.graphics().setScrollFactor(0.88).setDepth(8);
  fg.fillStyle(0x142818, 1); fg.fillRect(0, CFG.GROUND_Y - 6, CFG.WORLD_W, 12);
  for (let i = 0; i < 540; i++) {
    const x = i * 10;
    const h = Phaser.Math.Between(10, 34);
    const shade = Phaser.Math.Between(0, 40);
    fg.fillStyle(Phaser.Display.Color.GetColor(40 + shade, 100 + shade, 55 + shade), 0.9);
    fg.fillTriangle(x, CFG.GROUND_Y + 4, x + 3, CFG.GROUND_Y - h, x + 6, CFG.GROUND_Y + 4);
  }

  // Floating light orbs
  s.floatingLights = [];
  for (let i = 0; i < 22; i++) {
    const orb = s.add.circle(200 + i * 240, Phaser.Math.Between(120, 320),
      Phaser.Math.Between(6, 20), 0xc8eeff, 0.08
    ).setBlendMode(Phaser.BlendModes.SCREEN).setScrollFactor(0.1);
    s.floatingLights.push(orb);
  }

  // Mist bands
  s.mistBands = [];
  for (let i = 0; i < 8; i++) {
    const mist = s.add.ellipse(400 + i * 650, 530 + (i % 2) * 30, 460, 80, COLORS.mist, 0.04)
      .setBlendMode(Phaser.BlendModes.SCREEN).setScrollFactor(0.22 + i * 0.03);
    s.mistBands.push({ sprite: mist, baseX: mist.x, baseY: mist.y, phase: i * 0.8 });
  }
}

export function updateFloatingElements(s: GameScene, time: number) {
  s.floatingLights.forEach((orb, i) => {
    orb.y += Math.sin(time * 0.001 + i) * 0.06;
    orb.x += Math.sin(time * 0.0007 + i * 2) * 0.04;
    orb.alpha = 0.06 + Math.sin(time * 0.002 + i) * 0.03;
  });
}

export function updateMist(s: GameScene, time: number) {
  s.mistBands.forEach(b => {
    b.sprite.x = b.baseX + Math.sin(time * 0.00022 + b.phase) * 90;
    b.sprite.y = b.baseY + Math.cos(time * 0.00037 + b.phase) * 8;
    b.sprite.alpha = 0.03 + Math.sin(time * 0.0008 + b.phase) * 0.015;
  });
}
