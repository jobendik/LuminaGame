import { GameScene } from '../scenes/GameScene';
import { COLORS } from '../config';
import { playChime } from '../systems/AudioSystem';
import { startFinalRun } from '../systems/StormSystem';
import { updateHUD } from '../ui/HUD';

export function buildPortal(s: GameScene) {
  s.portal = s.add.container(4800, 516).setDepth(22);
  const glow = s.add.circle(0, -18, 80, COLORS.portal, 0.05).setBlendMode(Phaser.BlendModes.SCREEN);
  const ring = s.add.image(0, -20, 'portalRing').setAlpha(0.35);
  const inner = s.add.circle(0, -20, 40, COLORS.portal, 0.14).setBlendMode(Phaser.BlendModes.SCREEN);
  const pedestal = s.add.rectangle(0, 34, 110, 16, 0x44545b, 1);
  const text = s.add.text(0, -130, 'The portal is slambering', {
    fontFamily: 'Cinzel, serif', fontSize: '22px', color: '#fff6d8'
  }).setOrigin(0.5);
  text.setShadow(0, 0, '#9fdfff', 20, true, true);
  s.portal.add([glow, ring, inner, pedestal, text]);
  s.portalGlow = glow; s.portalRing = ring; s.portalInner = inner; s.portalText = text;
  s.portalEmitter = s.add.particles(4800, 498, 'spark', {
    speed: { min: 10, max: 100 }, angle: { min: 0, max: 360 },
    lifespan: { min: 700, max: 1500 }, scale: { start: 0.4, end: 0.02 },
    alpha: { start: 0.6, end: 0 }, frequency: 100,
    tint: [0xbfeeff, 0xf5dfff, 0xfff1ad], blendMode: 'SCREEN'
  }).setDepth(24);
}

export function updatePortal(s: GameScene, time: number) {
  s.portalRing.rotation += s.portalOpened ? 0.02 : (s.questFinished ? 0.012 : 0.003);
  s.portalGlow.alpha = s.portalOpened ? 0.25 + Math.sin(time * 0.006) * 0.08 : (s.questFinished ? 0.18 + Math.sin(time * 0.005) * 0.05 : 0.06 + Math.sin(time * 0.004) * 0.02);
  s.portalInner.alpha = s.portalOpened ? 0.45 + Math.sin(time * 0.007) * 0.12 : (s.questFinished ? 0.30 + Math.sin(time * 0.006) * 0.08 : 0.12 + Math.sin(time * 0.004) * 0.03);
  s.portalText.setText(s.portalOpened ? (s.stormActive ? 'Run into the portal!' : 'The portal is open') : (s.questFinished ? 'Talk to Veyra' : 'The portal is slumbering'));
  s.portalEmitter.setFrequency(s.portalOpened ? 16 : (s.questFinished ? 26 : 100));
  if (s.portalOpened && s.stormActive && Phaser.Math.Distance.Between(s.player.x, s.player.y, 4800, 500) < 100) completeGame(s);
}

export function unlockPortal(s: GameScene) {
  s.finalBlessingDone = true; s.portalOpened = true;
  updateHUD(s);
  s.portalBurst.emitParticleAt(4800, 500, 100);
  s.cameras.main.flash(400, 200, 225, 255);
  s.cameras.main.shake(180, 0.004);
  playChime(s, 523.25, 783.99, 0.05);
  const txt = s.add.text(4800, 420, 'The portal awakens - but so does the darkness', {
    fontFamily: 'Cinzel, serif', fontSize: '24px', color: '#fff6dc'
  }).setOrigin(0.5).setDepth(100);
  txt.setShadow(0, 0, '#6090c0', 16, true, true);
  s.tweens.add({ targets: txt, y: txt.y - 40, alpha: 0, duration: 2000, onComplete: () => txt.destroy() });
  s.time.delayedCall(700, () => startFinalRun(s));
}

export function showPortalMoment(s: GameScene) {
  s.portalBurst.emitParticleAt(4800, 500, 50);
  playChime(s, 659.25, 987.77, 0.04);
  const txt = s.add.text(s.player.x, s.player.y - 90, 'The portal hums. All is ready.', {
    fontFamily: 'Cinzel, serif', fontSize: '22px', color: '#fff8dc'
  }).setOrigin(0.5).setDepth(100);
  txt.setShadow(0, 0, '#6090c0', 18, true, true);
  s.tweens.add({ targets: txt, y: txt.y - 30, alpha: 0, duration: 1600, onComplete: () => txt.destroy() });
}

export function completeGame(s: GameScene) {
  if (s.endingSeen) return;
  s.endingSeen = true; s.stormActive = false; s.stormResolved = true;
  s.boss.active = false; s.bossBolts.clear(true, true);
  if (s.stormPulseEvent) s.stormPulseEvent.remove(false);
  s.weatherParticles.setFrequency(50);
  s.portalBurst.emitParticleAt(4800, 500, 60);
  playChime(s, 659.25, 987.77, 0.06);
  s.cameras.main.flash(600, 210, 235, 255);

  const bonus = s.secretCount >= s.secretTarget
    ? 'You found all the hidden memories.\nThe world feels more real, more yours.'
    : 'There are still hidden memories here.';

  s.endingBody.setText(
    'You reached the portal while the storm pressed behind you.\n\n' +
    bonus + '\n\n' +
    `Pages: ${s.questCount}/${s.questTarget}  ·  Beacons: ${s.beaconCount}/${s.beaconTarget}  ·  Memories: ${s.secretCount}/${s.secretTarget}`
  );
  s.pauseMenu.setVisible(false); s.pausedGame = false;
  s.time.delayedCall(500, () => {
    s.endingOverlay.setAlpha(0); s.endingOverlay.setVisible(true);
    s.tweens.add({ targets: s.endingOverlay, alpha: 1, duration: 600 });
  });
  updateHUD(s);
}
