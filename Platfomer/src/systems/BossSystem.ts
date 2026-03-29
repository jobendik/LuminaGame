import { GameScene } from '../scenes/GameScene';
import { CFG, COLORS } from '../config';
import { showToast } from '../ui/ToastSystem';
import { damagePlayer } from './CombatSystem';

export function buildBoss(s: GameScene) {
  s.boss = { active: false, state: 'hidden', nextShotAt: 0, nextLungeAt: 0, telegraphUntil: 0, lungeUntil: 0 };
  s.bossGlow = s.add.circle(-900, CFG.GROUND_Y - 110, 96, COLORS.wraithGlow, 0.01).setDepth(52).setBlendMode(Phaser.BlendModes.SCREEN);
  s.bossSprite = s.add.sprite(-900, CFG.GROUND_Y - 110, 'boss_0').setDepth(53).setAlpha(0.01);
  s.bossSprite.play('boss-float');
  s.bossBolts = s.physics.add.group({ allowGravity: false, immovable: true });
  s.physics.add.overlap(s.player, s.bossBolts, (_, bolt: any) => {
    if (!bolt.active) return; bolt.destroy();
    damagePlayer(s, 1, s.bossSprite.x, s.bossSprite.y, 'The Nightmaw hurls shadows at you.');
  });
}

export function updateBoss(s: GameScene, time: number, delta: number) {
  if (!s.boss?.active || s.endingSeen) {
    if (s.bossSprite) {
      s.bossSprite.alpha = Phaser.Math.Linear(s.bossSprite.alpha, 0.01, 0.08);
      s.bossGlow.alpha = Phaser.Math.Linear(s.bossGlow.alpha, 0.01, 0.08);
    }
    return;
  }
  const b = s.boss;
  const tx = Math.max(s.stormWallX + 130, s.player.x - 270 + Math.sin(time * 0.004) * 30);
  const ty = Phaser.Math.Clamp(s.player.y - 50 + Math.sin(time * 0.007) * 24, 150, CFG.GROUND_Y - 40);
  s.bossSprite.x = Phaser.Math.Linear(s.bossSprite.x, tx, 0.04);
  s.bossSprite.y = Phaser.Math.Linear(s.bossSprite.y, ty, 0.05);
  s.bossGlow.x = s.bossSprite.x - 8; s.bossGlow.y = s.bossSprite.y;
  s.bossGlow.alpha = 0.16 + Math.sin(time * 0.014) * 0.08;
  s.bossSprite.alpha = 0.90;

  if (time > b.nextShotAt && !s.pausedGame) {
    b.nextShotAt = time + 1400;
    const bolt = s.bossBolts.create(s.bossSprite.x + 44, s.bossSprite.y + Phaser.Math.Between(-18, 18), 'shadowBolt');
    bolt.setDepth(54).setVelocity(440 + (s.stormActive ? 80 : 0), Phaser.Math.Between(-70, 70));
    bolt.setScale(1.1); bolt.body.setAllowGravity(false);
    s.tweens.add({ targets: bolt, alpha: { from: 1, to: 0.3 }, duration: 200, yoyo: true, repeat: 1 });
  }

  if (time > b.nextLungeAt && !b.telegraphUntil && !b.lungeUntil) {
    b.telegraphUntil = time + 480; b.nextLungeAt = time + 2400;
    showToast(s, 'The Nightmaw is gathering itself!', '#ffc0e0');
  }
  if (b.telegraphUntil) {
    s.bossGlow.scale = 1.25 + Math.sin(time * 0.06) * 0.14;
    s.bossGlow.alpha = 0.32 + Math.sin(time * 0.03) * 0.1;
    if (time >= b.telegraphUntil) { b.telegraphUntil = 0; b.lungeUntil = time + 440; b.lungeDir = s.player.x > s.bossSprite.x ? 1 : -1; }
  } else {
    s.bossGlow.scale = Phaser.Math.Linear(s.bossGlow.scaleX || 1, 1, 0.12);
    s.bossGlow.setScale(s.bossGlow.scaleX || 1);
  }
  if (b.lungeUntil) {
    s.bossSprite.x += b.lungeDir * 11 + (s.player.x - s.bossSprite.x) * 0.06;
    s.bossSprite.y = Phaser.Math.Linear(s.bossSprite.y, s.player.y - 22, 0.12);
    if (time >= b.lungeUntil) b.lungeUntil = 0;
  }

  s.bossBolts.children.each((bolt: any) => { 
    if (bolt?.active && (bolt.x > CFG.WORLD_W + 120 || bolt.y < -120 || bolt.y > CFG.H + 220)) bolt.destroy(); 
    return true; // add return for each
  });
  
  const bd = Phaser.Math.Distance.Between(s.player.x, s.player.y, s.bossSprite.x + 40, s.bossSprite.y + 10);
  if (bd < 90 || (b.lungeUntil && bd < 120)) damagePlayer(s, 1, s.bossSprite.x, s.bossSprite.y, 'The Nightmaw strikes!');
}
