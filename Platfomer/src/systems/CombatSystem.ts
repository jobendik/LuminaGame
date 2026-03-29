import { GameScene } from '../scenes/GameScene';
import { CFG } from '../config';
import { playChime } from './AudioSystem';
import { showToast } from '../ui/ToastSystem';
import { updateHUD } from '../ui/HUD';

export function damagePlayer(s: GameScene, amount: number, sx: number, sy: number, reason: string) {
  if (s.damageLocked || s.isRespawning || s.endingSeen || !s.storyStarted) return;
  s.damageLocked = true;
  s.health = Math.max(0, s.health - amount);
  s.damageParticles.emitParticleAt(s.player.x, s.player.y, 28);
  // Hit freeze
  s.hitFreezeTimer = 60;
  s.cameras.main.shake(140, 0.005);
  s.cameras.main.flash(100, 255, 60, 80);
  playChime(s, 240, 170, 0.02);
  showToast(s, reason, '#ffd0d0');

  const dx = s.player.x >= sx ? 1 : -1;
  s.player.play('hero-hurt', true);
  s.player.setVelocity(dx * 340, -280);
  s.player.alpha = 0.5;
  s.time.delayedCall(100, () => s.player.alpha = 1);
  s.time.delayedCall(200, () => s.player.alpha = 0.5);
  s.time.delayedCall(300, () => s.player.alpha = 1);
  s.time.delayedCall(400, () => s.player.alpha = 0.5);
  s.time.delayedCall(500, () => s.player.alpha = 1);
  updateHUD(s);
  if (s.health <= 0) s.time.delayedCall(220, () => playerDie(s, reason));
  else s.time.delayedCall(CFG.IFRAMES, () => { s.damageLocked = false; });
}

export function playerDie(s: GameScene, reason: string) {
  if (s.isRespawning) return;
  s.isRespawning = true; s.damageLocked = true; s.health = 0;
  updateHUD(s);
  const msg = s.add.text(s.player.x, s.player.y - 90, 'You fade away...', {
    fontFamily: 'Cinzel, serif', fontSize: '22px', color: '#ffe0d0'
  }).setOrigin(0.5).setDepth(110);
  msg.setShadow(0, 0, '#ff6080', 16, true, true);
  s.tweens.add({ targets: msg, alpha: 0, y: msg.y - 28, duration: 1200, onComplete: () => msg.destroy() });
  s.cameras.main.fade(400, 5, 5, 15);
  s.pauseMenu.setVisible(false); s.pausedGame = false;

  s.time.delayedCall(500, () => {
    s.player.setPosition(s.checkpoint.x, s.checkpoint.y);
    s.player.setVelocity(0, 0); s.player.alpha = 1;
    s.health = s.maxHealth; s.damageLocked = false; s.isRespawning = false;
    if (s.stormActive) {
      s.stormWallX = Math.max(0, s.checkpoint.x - 260);
      s.bossSprite.setPosition(s.checkpoint.x - 400, s.checkpoint.y - 50);
      s.bossGlow.setPosition(s.checkpoint.x - 410, s.checkpoint.y - 50);
      s.boss.nextLungeAt = s.time.now + 1800;
      s.boss.nextShotAt = s.time.now + 900;
    }
    s.cameras.main.fadeIn(400, 0, 0, 0);
    s.checkpointParticles.emitParticleAt(s.checkpoint.x, s.checkpoint.y + 40, 30);
    showToast(s, 'Back at ' + s.checkpoint.label, '#c8e0ff');
    updateHUD(s);
  });
}
