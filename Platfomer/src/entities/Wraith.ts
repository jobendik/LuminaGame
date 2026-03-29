import { GameScene } from '../scenes/GameScene';
import { COLORS } from '../config';
import { damagePlayer } from '../systems/CombatSystem';

export function buildWraiths(s: GameScene) {
  s.wraiths = [];
  [
    { x1: 1400, x2: 1680, y: 250, speed: 0.0016, aggroRadius: 260 },
    { x1: 2260, x2: 2680, y: 305, speed: 0.0018, aggroRadius: 300 },
    { x1: 3380, x2: 3900, y: 290, speed: 0.0014, aggroRadius: 340 },
    { x1: 4100, x2: 4500, y: 260, speed: 0.0015, aggroRadius: 280 }
  ].forEach((d, i) => {
    const sprite = s.physics.add.sprite(d.x1, d.y, 'wraith_0').setDepth(21);
    sprite.play('wraith-float');
    (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false); 
    sprite.setImmovable(true); sprite.setAlpha(0.94);
    const glow = s.add.circle(d.x1, d.y, 32, COLORS.wraithGlow, 0.10).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(20);
    s.wraiths.push({
      sprite, glow, ...d, phase: i * 1.8,
      mode: 'patrol', focusX: d.x1, focusY: d.y,
      aggroUntil: 0, nextLungeAt: 0, lungeUntil: 0
    });
  });

  s.wraiths.forEach(w => {
    s.physics.add.overlap(s.player, w.sprite, () => damagePlayer(s, 1, w.sprite.x, w.sprite.y, 'A shadow being hits you.'));
  });
}

export function updateWraiths(s: GameScene, time: number, delta: number) {
  s.wraiths.forEach((w) => {
    const pd = Phaser.Math.Distance.Between(s.player.x, s.player.y, w.sprite.x, w.sprite.y);
    const band = Math.abs(s.player.y - w.sprite.y) < 130;
    const aggro = s.storyStarted && !s.inDialog && !s.stormActive && band && pd < (w.aggroRadius || 260);
    if (aggro) w.aggroUntil = time + 1500;

    if (time < w.aggroUntil) {
      w.mode = 'chase';
      w.focusX = Phaser.Math.Clamp(s.player.x + (s.playerFacing > 0 ? 20 : -20), w.x1 - 60, w.x2 + 60);
      w.focusY = Phaser.Math.Clamp(s.player.y - 18, w.y - 70, w.y + 70);
      if (time > w.nextLungeAt && pd < 130) { w.nextLungeAt = time + 1500; w.lungeUntil = time + 340; }
    } else {
      w.mode = 'patrol';
      const t = (Math.sin(time * w.speed + w.phase) + 1) * 0.5;
      w.focusX = Phaser.Math.Linear(w.x1, w.x2, t);
      w.focusY = w.y + Math.sin(time * 0.005 + w.phase) * 10;
    }

    if (w.lungeUntil && time < w.lungeUntil) {
      w.sprite.x += (s.player.x - w.sprite.x) * 0.14;
      w.sprite.y += (s.player.y - 10 - w.sprite.y) * 0.12;
      w.glow.alpha = 0.24;
    } else {
      w.lungeUntil = 0;
      const spd = w.mode === 'chase' ? 0.07 : 0.04;
      w.sprite.x = Phaser.Math.Linear(w.sprite.x, w.focusX, spd);
      w.sprite.y = Phaser.Math.Linear(w.sprite.y, w.focusY, spd);
      w.glow.alpha = (w.mode === 'chase' ? 0.16 : 0.08) + Math.sin(time * 0.007 + w.phase) * 0.03;
    }

    w.glow.x = w.sprite.x; w.glow.y = w.sprite.y;
    w.sprite.setFlipX(s.player.x < w.sprite.x);
    w.sprite.setScale(w.mode === 'chase' ? 1.1 : 1);
  });

  s.hazardRects.forEach(h => { h.gfx.alpha = 0.85 + Math.sin(time * 0.006 + h.phase) * 0.15; });
}
