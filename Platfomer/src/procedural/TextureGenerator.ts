import { GameScene } from '../scenes/GameScene';
import { COLORS } from '../config';

export function genTextures(s: GameScene) {
  const mk = (key: string, fn: (g: Phaser.GameObjects.Graphics) => void, w: number, h: number) => {
    if (s.textures.exists(key)) return;
    const g = s.add.graphics(); fn(g); g.generateTexture(key, w, h); g.destroy();
  };

  // Soft particle
  mk('particleSoft', g => {
    for (let i = 8; i > 0; i--) {
      g.fillStyle(0xffffff, i === 8 ? 0.05 : (9 - i) / 12);
      g.fillCircle(12, 12, i * 1.5);
    }
  }, 24, 24);

  // Spark
  mk('spark', g => {
    g.fillStyle(0xffffff, 1); g.fillCircle(6, 6, 6);
    g.fillStyle(0xdce8ff, 0.9); g.fillCircle(6, 6, 3.5);
    g.fillStyle(0xffffff, 0.7); g.fillCircle(6, 6, 1.5);
  }, 12, 12);

  // Page collectible
  mk('page', g => {
    g.fillStyle(0xe8d8a8, 1); g.fillRoundedRect(4, 3, 40, 52, 6);
    g.fillStyle(COLORS.page, 1); g.fillRoundedRect(6, 5, 36, 48, 5);
    g.lineStyle(1.5, 0xc8a860, 0.6); g.strokeRoundedRect(6, 5, 36, 48, 5);
    // Text lines
    g.fillStyle(0x9a7acc, 0.85);
    g.fillRect(13, 16, 20, 2.5); g.fillRect(13, 22, 16, 2.5);
    g.fillRect(13, 28, 22, 2.5); g.fillRect(13, 34, 14, 2.5);
    // Star decoration
    g.fillStyle(0xd4a0ff, 0.5); g.fillCircle(34, 12, 3);
  }, 48, 58);

  mk('pageGlow', g => {
    for (let i = 5; i > 0; i--) {
      g.fillStyle(0xeed9ff, 0.04 * i); g.fillCircle(32, 32, 8 + i * 6);
    }
  }, 64, 64);

  // Portal ring
  mk('portalRing', g => {
    g.lineStyle(10, 0x60a8e0, 0.7); g.strokeCircle(64, 64, 50);
    g.lineStyle(4, COLORS.portalRing, 1); g.strokeCircle(64, 64, 50);
    g.lineStyle(2, 0xf7f1b7, 0.5); g.strokeCircle(64, 64, 58);
    g.lineStyle(1, 0xffffff, 0.3); g.strokeCircle(64, 64, 42);
    // Rune dots
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(64 + Math.cos(a) * 50, 64 + Math.sin(a) * 50, 2.5);
    }
  }, 128, 128);

  // Firefly
  mk('firefly', g => {
    g.fillStyle(0xfff7c0, 0.3); g.fillCircle(8, 8, 7);
    g.fillStyle(0xfff7c0, 0.7); g.fillCircle(8, 8, 4);
    g.fillStyle(0xffffff, 0.9); g.fillCircle(8, 8, 2);
  }, 16, 16);

  // Critter
  mk('critter', g => {
    g.fillStyle(0xa8e0f0, 0.3); g.fillEllipse(18, 16, 28, 20);
    g.fillStyle(0xd5f4ff, 1); g.fillEllipse(18, 16, 22, 14);
    g.fillStyle(0x8ae1ff, 1);
    g.fillTriangle(6, 16, 1, 10, 1, 22);
    g.fillTriangle(30, 16, 35, 10, 35, 22);
    g.fillStyle(0x1e3551, 1); g.fillCircle(15, 15, 1.8); g.fillCircle(21, 15, 1.8);
    g.fillStyle(0xffffff, 0.6); g.fillCircle(14.5, 14.5, 0.7); g.fillCircle(20.5, 14.5, 0.7);
  }, 36, 32);

  // Beacon
  mk('beacon', g => {
    g.fillStyle(COLORS.beaconBase, 1); g.fillRoundedRect(20, 34, 24, 26, 6);
    g.fillStyle(0x4a5880, 1); g.fillRoundedRect(22, 36, 20, 22, 5);
    g.fillStyle(0xbdd8ff, 1); g.fillRect(29, 14, 6, 28);
    g.fillStyle(0x8aa0c0, 1); g.fillRect(30, 16, 4, 24);
    g.fillStyle(COLORS.beacon, 1); g.fillCircle(32, 14, 10);
    g.fillStyle(0xffffff, 0.8); g.fillCircle(32, 12, 5);
    g.fillStyle(0xffffff, 0.4); g.fillCircle(30, 10, 2);
  }, 64, 64);

  mk('beaconGlow', g => {
    for (let i = 4; i > 0; i--) {
      g.fillStyle(COLORS.beacon, 0.05 * i); g.fillCircle(32, 32, 8 + i * 7);
    }
  }, 64, 64);

  // Secret seed
  mk('secretSeed', g => {
    g.fillStyle(COLORS.secret, 0.2); g.fillCircle(16, 16, 13);
    g.fillStyle(COLORS.secret, 0.8); g.fillCircle(16, 16, 7);
    g.fillStyle(0xffffff, 0.7); g.fillCircle(16, 16, 3.5);
    g.fillStyle(0xffffff, 0.3); g.fillCircle(14, 14, 1.5);
    g.lineStyle(2, 0x8ff5d0, 0.5); g.strokeCircle(16, 16, 10);
  }, 32, 32);

  // Checkpoint lamp
  mk('checkpointLamp', g => {
    g.fillStyle(0x31435d, 1); g.fillRoundedRect(25, 24, 14, 34, 5);
    g.fillStyle(0x3a5070, 1); g.fillRoundedRect(27, 26, 10, 30, 4);
    g.fillStyle(COLORS.checkpoint, 1); g.fillCircle(32, 16, 11);
    g.fillStyle(0xffffff, 0.8); g.fillCircle(32, 14, 5);
    g.fillStyle(0xffffff, 0.4); g.fillCircle(30, 12, 2);
    g.fillStyle(COLORS.checkpoint, 0.3); g.fillCircle(32, 16, 16);
  }, 64, 64);

  // Shadow bolt
  mk('shadowBolt', g => {
    g.fillStyle(COLORS.wraithGlow, 0.3); g.fillEllipse(26, 10, 44, 18);
    g.fillStyle(COLORS.wraithGlow, 0.8); g.fillEllipse(26, 10, 34, 12);
    g.fillStyle(0xcfe1ff, 0.9); g.fillEllipse(30, 10, 16, 6);
    g.fillStyle(0xffffff, 0.6); g.fillEllipse(34, 10, 6, 3);
  }, 52, 20);

  // NPC Portraits
  (Object.entries({
    portraitEira: COLORS.npcEira,
    portraitMilo: COLORS.npcMilo,
    portraitVeyra: COLORS.npcVeyra
  })).forEach(([key, c]) => mk(key, g => {
    g.fillStyle(0x0a0a1a, 1); g.fillCircle(36, 36, 35);
    g.fillStyle(c.glow, 0.15); g.fillCircle(36, 36, 34);
    g.fillStyle(c.skin, 1); g.fillCircle(36, 30, 16);
    g.fillStyle(c.robe, 1); g.fillRoundedRect(18, 42, 36, 22, 10);
    g.fillStyle(c.robe, 0.6); g.fillRoundedRect(22, 44, 28, 18, 8);
    g.fillStyle(c.hair, 1); g.fillEllipse(36, 22, 34, 18);
    g.fillStyle(0x1c132d, 1); g.fillCircle(31, 29, 2.2); g.fillCircle(41, 29, 2.2);
    g.fillStyle(0xffffff, 0.4); g.fillCircle(30.5, 28.5, 0.8); g.fillCircle(40.5, 28.5, 0.8);
    g.lineStyle(1, c.glow, 0.3); g.strokeCircle(36, 36, 34);
  }, 72, 72));

  // Vignette overlay
  mk('vignette', g => {
    const cx = 256, cy = 192;
    for (let i = 20; i > 0; i--) {
      const a = i < 6 ? 0.06 * (6 - i) : 0;
      g.fillStyle(0x000000, a);
      g.fillEllipse(cx, cy, 512 - i * 8, 384 - i * 6);
    }
    g.fillStyle(0x000000, 0.35); g.fillRect(0, 0, 512, 384);
    g.fillStyle(0x000000, 0);
    for (let i = 0; i < 30; i++) {
      g.fillStyle(0x000000, -0.012 * i);
      g.fillEllipse(cx, cy, 380 - i * 6, 280 - i * 4);
    }
  }, 512, 384);

  // Custom cursor
  mk('cursorTex', g => {
    g.lineStyle(2, 0xffffff, 0.8);
    g.strokeCircle(10, 10, 6);
    g.fillStyle(0xffffff, 0.3); g.fillCircle(10, 10, 2);
  }, 20, 20);

  // Dash trail ghost
  mk('dashGhost', g => {
    g.fillStyle(COLORS.heroGlow, 0.4);
    g.fillRoundedRect(10, 20, 28, 34, 10);
    g.fillCircle(24, 14, 12);
  }, 48, 56);
}
