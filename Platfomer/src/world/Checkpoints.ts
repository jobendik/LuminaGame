import { GameScene } from '../scenes/GameScene';
import { CFG } from '../config';
import { playChime } from '../systems/AudioSystem';
import { showToast } from '../ui/ToastSystem';
import { updateHUD } from '../ui/HUD';
import { COLORS } from '../config';

export function buildCheckpoints(s: GameScene) {
  s.checkpoints = [];
  [
    { x: 260, gy: 562, label: 'Start of the path' },
    { x: 1970, gy: 562, label: 'Middle beacon' },
    { x: 3340, gy: 562, label: 'The Portal Chamber' },
    { x: 4600, gy: 562, label: 'Final beacon' }
  ].forEach((p, i) => {
    const glow = s.add.circle(p.x, p.gy - 20, 30, COLORS.checkpoint, 0.08).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(17);
    const lamp = s.add.image(p.x, p.gy - 12, 'checkpointLamp').setDepth(20).setTint(0x9b9ba8);
    s.checkpoints.push({ glow, lamp, x: p.x, touchY: p.gy - 12, respawnY: p.gy - 100, label: p.label, active: i === 0 });
  });
  activateCheckpoint(s, s.checkpoints[0], true);
}

export function activateCheckpoint(s: GameScene, cp: any, silent: boolean = false) {
  if (!cp) return;
  s.checkpoint = { x: cp.x, y: cp.respawnY, label: cp.label };
  s.checkpoints.forEach(c => { c.active = false; c.glow.setFillStyle(COLORS.checkpoint, 0.06); c.lamp.setTint(0x9b9ba8); });
  cp.active = true; cp.glow.setFillStyle(COLORS.checkpoint, 0.22); cp.lamp.clearTint();
  s.checkpointParticles.emitParticleAt(cp.x, cp.touchY - 20, 24);
  if (!silent) { playChime(s, 330, 523.25, 0.025); showToast(s, 'Checkpoint: ' + cp.label, '#dfffd1'); }
  updateHUD(s);
}

export function updateCheckpoints(s: GameScene) {
  s.checkpoints.forEach(cp => {
    cp.glow.alpha = cp.active ? 0.20 + Math.sin(s.time.now * 0.004) * 0.05 : 0.06 + Math.sin(s.time.now * 0.004) * 0.02;
    const d = Phaser.Math.Distance.Between(s.player.x, s.player.y, cp.x, cp.touchY);
    if (d < 72 && s.checkpoint.label !== cp.label) activateCheckpoint(s, cp);
  });
}
