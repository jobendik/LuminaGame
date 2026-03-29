import { GameScene } from '../scenes/GameScene';
import { CFG, COLORS } from '../config';
import { playStormPulse } from './AudioSystem';
import { showToast } from '../ui/ToastSystem';
import { damagePlayer, playerDie } from './CombatSystem';

export function buildStormFX(s: GameScene) {
  s.stormShade = s.add.rectangle(0, CFG.H / 2, 10, CFG.H + 200, 0x0b0716, 0.01).setOrigin(0, 0.5).setDepth(48);
  s.stormFront = s.add.ellipse(-999, CFG.GROUND_Y - 110, 200, 560, COLORS.wraithGlow, 0.01).setDepth(49).setBlendMode(Phaser.BlendModes.SCREEN);
  s.stormWarning = s.add.text(0, 0, '', { fontFamily: 'Cinzel, serif', fontSize: '28px', color: '#ffe7cb' }).setOrigin(0.5).setDepth(250).setScrollFactor(0).setVisible(false);
}

export function startFinalRun(s: GameScene) {
  if (s.stormActive || s.stormResolved) return;
  s.stormActive = true;
  s.stormWallX = Math.max(0, s.player.x - 240);
  s.stormSpeed = 100;
  s.weatherParticles.setFrequency(22);
  s.stormWarning.setText('The storm is rising - run to the portal!');
  s.stormWarning.setPosition(s.scale.width / 2, 100);
  s.stormWarning.setVisible(true); s.stormWarning.setAlpha(0);
  s.tweens.add({ targets: s.stormWarning, alpha: 1, duration: 220, yoyo: true, hold: 1200, onComplete: () => s.stormWarning.setVisible(false) });
  showToast(s, 'Run towards the portal!', '#ffc0a0');
  s.audioMood = 'boss';
  s.boss.active = true; s.boss.state = 'stalk';
  s.boss.nextShotAt = s.time.now + 1100;
  s.boss.nextLungeAt = s.time.now + 1900;
  s.bossSprite.setPosition(s.player.x - 420, s.player.y - 40);
  s.bossGlow.setPosition(s.player.x - 430, s.player.y - 40);
  s.bossSprite.setAlpha(0.75); s.bossGlow.setAlpha(0.12);
  if (!s.stormPulseEvent) {
    s.stormPulseEvent = s.time.addEvent({ delay: 900, loop: true, callback: () => playStormPulse(s) });
  }
}

export function updateStorm(s: GameScene, delta: number, time: number) {
  if (!s.stormActive) {
    s.stormShade.alpha = Phaser.Math.Linear(s.stormShade.alpha, 0.01, 0.05);
    s.stormFront.alpha = Phaser.Math.Linear(s.stormFront.alpha, 0.01, 0.05);
    return;
  }
  s.stormSpeed = Phaser.Math.Linear(s.stormSpeed, 160, 0.006);
  s.stormWallX += s.stormSpeed * (delta / 1000);
  s.stormShade.x = 0; s.stormShade.displayWidth = Math.max(10, s.stormWallX);
  s.stormShade.alpha = 0.28 + Math.sin(time * 0.01) * 0.05;
  s.stormFront.x = s.stormWallX;
  s.stormFront.alpha = 0.28 + Math.sin(time * 0.015) * 0.07;
  s.stormFront.scaleX = 1 + Math.sin(time * 0.008) * 0.1;
  if (s.player.x < s.stormWallX + 20) damagePlayer(s, 1, s.player.x - 20, s.player.y, 'The darkness catches you.');
  if (s.stormWallX > CFG.WORLD_W + 200 && !s.endingSeen) playerDie(s, 'The storm swallowed the entire path.');
}
