import { GameScene } from '../scenes/GameScene';
import { playChime } from './AudioSystem';
import { showToast } from '../ui/ToastSystem';
import { updateHUD, checkQuestCompletion } from '../ui/HUD';
import { COLORS } from '../config';

export function buildPages(s: GameScene) {
  s.pages = [];
  [
    { x: 1520, y: 270 }, { x: 2790, y: 255 }, { x: 4400, y: 310 }
  ].forEach((pos, i) => {
    const glow = s.add.image(pos.x, pos.y, 'pageGlow').setBlendMode(Phaser.BlendModes.SCREEN).setAlpha(0.6).setDepth(12);
    const sprite = s.physics.add.image(pos.x, pos.y, 'page').setImmovable(true).setDepth(18);
    (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    (sprite as any).collected = false;
    s.tweens.add({
      targets: [glow, sprite], y: '-=14', duration: 1600 + i * 300,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
    s.pages.push({ glow, sprite });
  });
}

export function buildBeacons(s: GameScene) {
  s.beacons = [];
  [
    { x: 1140, y: 330, label: 'Western Beacon' },
    { x: 3210, y: 322, label: 'Eastern Beacon' }
  ].forEach((pos, i) => {
    const glow = s.add.image(pos.x, pos.y, 'beaconGlow').setBlendMode(Phaser.BlendModes.SCREEN).setAlpha(0.18).setDepth(16);
    const sprite = s.add.image(pos.x, pos.y, 'beacon').setDepth(18).setTint(0x8890b8);
    const pulse = s.add.circle(pos.x, pos.y - 18, 16, COLORS.beacon, 0.10).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(17);
    s.beacons.push({ sprite, glow, pulse, active: false, label: pos.label, bobPhase: i, baseX: pos.x, baseY: pos.y });
  });
}

export function buildSecrets(s: GameScene) {
  s.secrets = [];
  [
    { x: 705, y: 220, text: 'A hidden memory: a drawing waiting to be seen.' },
    { x: 2315, y: 190, text: 'A hidden memory: an unfinished path that felt right anyway.' },
    { x: 3340, y: 180, text: 'A hidden memory: a little light refusing to give up.' }
  ].forEach((pos, i) => {
    const sprite = s.add.image(pos.x, pos.y, 'secretSeed').setDepth(18).setAlpha(0.85);
    const glow = s.add.circle(pos.x, pos.y, 22, COLORS.secret, 0.10).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(16);
    s.secrets.push({ sprite, glow, found: false, text: pos.text, phase: i, baseX: pos.x, baseY: pos.y });
  });
}

export function updateQuestCollectibles(s: GameScene) {
  s.pages.forEach(page => {
    if (page.sprite.collected) return;
    const d = Phaser.Math.Distance.Between(s.player.x, s.player.y, page.sprite.x, page.sprite.y);
    if (d < 48) {
      page.sprite.collected = true; s.questCount++;
      updateHUD(s);
      s.pageGlowParticles.emitParticleAt(page.sprite.x, page.sprite.y, 30);
      page.sprite.disableBody(true, true); page.glow.setVisible(false);
      playChime(s, 440, 659.25, 0.038);
      showToast(s, 'A star page found its way home.', '#fff0c0');
      if (s.questCount >= s.questTarget) showToast(s, 'All pages found! Light the beacons.', '#c8e0ff');
      checkQuestCompletion(s);
    }
  });
}

export function updateSecrets(s: GameScene) {
  s.secrets.forEach(sec => {
    if (sec.found) return;
    sec.sprite.y = sec.baseY + Math.sin(s.time.now * 0.004 + sec.phase) * 4;
    sec.glow.y = sec.sprite.y;
    sec.glow.alpha = 0.08 + Math.sin(s.time.now * 0.006 + sec.phase) * 0.03;
    const d = Phaser.Math.Distance.Between(s.player.x, s.player.y, sec.sprite.x, sec.sprite.y);
    if (d < 42) {
      sec.found = true; s.secretCount++;
      sec.sprite.setVisible(false); sec.glow.setVisible(false);
      s.secretParticles.emitParticleAt(sec.sprite.x, sec.sprite.y, 26);
      playChime(s, 523.25, 783.99, 0.028);
      showToast(s, sec.text, '#c0ffd8');
      updateHUD(s);
    }
  });
}

export function activateBeacon(s: GameScene, beacon: any) {
  if (!beacon || beacon.active) return;
  beacon.active = true; s.beaconCount++;
  beacon.sprite.clearTint(); beacon.glow.setAlpha(0.55);
  beacon.pulse.setFillStyle(COLORS.beacon, 0.3);
  s.tweens.add({ targets: [beacon.glow, beacon.pulse], scale: { from: 0.9, to: 1.2 }, alpha: { from: 0.3, to: 0.65 }, yoyo: true, repeat: -1, duration: 1100 });
  s.pageGlowParticles.emitParticleAt(beacon.sprite.x, beacon.sprite.y - 16, 35);
  playChime(s, 392, 659.25, 0.04);
  checkQuestCompletion(s);
  showToast(s, beacon.label + ' is lit.', '#fff0bf');
}
