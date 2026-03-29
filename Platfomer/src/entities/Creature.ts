import { GameScene } from '../scenes/GameScene';
import { CFG } from '../config';

export function buildCreatures(s: GameScene) {
  s.creatures = [];
  [
    { x: 720, y: CFG.GROUND_Y - 10, range: 70 },
    { x: 1760, y: CFG.GROUND_Y - 10, range: 90 },
    { x: 2950, y: CFG.GROUND_Y - 10, range: 80 },
    { x: 3620, y: CFG.GROUND_Y - 10, range: 65 },
    { x: 4500, y: CFG.GROUND_Y - 10, range: 75 }
  ].forEach((sp, i) => {
    const sprite = s.add.sprite(sp.x, sp.y, 'critter_0').setDepth(26);
    sprite.play('critter-hop');
    const glow = s.add.image(sp.x, sp.y - 8, 'firefly').setScale(1.8).setAlpha(0.18).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(24);
    s.creatures.push({ sprite, glow, baseX: sp.x, baseY: sp.y, range: sp.range, phase: i * 1.4 });
  });
}

export function updateCreatures(s: GameScene, time: number) {
  s.creatures.forEach((c, i) => {
    const off = Math.sin(time * 0.0015 + c.phase) * c.range;
    c.sprite.x = c.baseX + off; c.glow.x = c.sprite.x;
    c.sprite.y = c.baseY + Math.sin(time * 0.005 + i) * 2;
    c.glow.y = c.sprite.y - 8 + Math.sin(time * 0.003 + i) * 3;
    c.sprite.scaleX = off >= 0 ? 1 : -1;
    c.glow.alpha = 0.12 + Math.sin(time * 0.006 + i) * 0.06;
  });
}
