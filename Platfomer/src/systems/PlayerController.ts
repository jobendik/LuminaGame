import { GameScene } from '../scenes/GameScene';
import { CFG, COLORS } from '../config';
import { playChime } from './AudioSystem';
import { playerDie } from './CombatSystem';
import { updateHUD } from '../ui/HUD';

export function updatePlayerMovement(s: GameScene, time: number, delta: number) {
  const p = s.player;
  const body = p.body as Phaser.Physics.Arcade.Body;
  if (!s.storyStarted || s.inDialog || s.endingOverlay.visible || s.isRespawning) {
    p.setVelocityX(Phaser.Math.Linear(body.velocity.x, 0, 0.22));
    s.trailParticles.stop(); s.wallSliding = false;
    if (!s.isRespawning && p.anims.currentAnim?.key !== 'hero-idle') p.play('hero-idle', true);
    return;
  }

  const left = s.cursors.left.isDown || s.keys.left.isDown;
  const right = s.cursors.right.isDown || s.keys.right.isDown;
  const jumpDown = Phaser.Input.Keyboard.JustDown(s.cursors.up) || Phaser.Input.Keyboard.JustDown(s.cursors.space) || Phaser.Input.Keyboard.JustDown(s.keys.up);
  const dashDown = Phaser.Input.Keyboard.JustDown(s.keys.dash) || Phaser.Input.Keyboard.JustDown(s.cursors.shift);
  const onFloor = body.blocked.down || body.touching.down;
  const dir = (right ? 1 : 0) - (left ? 1 : 0);

  // Coyote time
  if (onFloor) s.coyoteTimer = CFG.COYOTE_MS;
  else s.coyoteTimer = Math.max(0, s.coyoteTimer - delta);

  // Jump buffer
  if (jumpDown) { s.jumpBuffered = true; s.jumpBufferTimer = CFG.JUMP_BUFFER_MS; }
  if (s.jumpBuffered) {
    s.jumpBufferTimer -= delta;
    if (s.jumpBufferTimer <= 0) s.jumpBuffered = false;
  }

  // Wall slide detection
  const wallLeft = body.blocked.left;
  const wallRight = body.blocked.right;
  const onWall = (wallLeft || wallRight) && !onFloor && body.velocity.y > 0;
  s.wallSliding = onWall && ((wallLeft && left) || (wallRight && right));
  s.wallDir = wallLeft ? -1 : (wallRight ? 1 : 0);

  if (s.wallSliding) {
    p.setVelocityY(Math.min(body.velocity.y, CFG.WALL_SLIDE_SPEED));
    s.canWallJump = true;
  }

  // Movement
  if (!s.isDashing) p.setVelocityX(Phaser.Math.Linear(body.velocity.x, dir * CFG.PLAYER_SPEED, onFloor ? 0.20 : 0.12));
  if (dir !== 0) s.playerFacing = dir;
  p.setFlipX(s.playerFacing < 0);

  // Jump (with coyote and buffer)
  const canJump = s.coyoteTimer > 0 || onFloor;
  if ((jumpDown || s.jumpBuffered) && canJump && !s.wallSliding) {
    p.setVelocityY(CFG.JUMP_FORCE);
    s.coyoteTimer = 0; s.jumpBuffered = false;
    s.jumpParticles.explode(16, p.x, p.y + 28);
    playChime(s, 330, 440, 0.02);
    s.tweens.add({ targets: p, scaleX: 1.18, scaleY: 0.80, duration: 80, yoyo: true });
  }

  // Wall jump
  if (jumpDown && s.canWallJump && s.wallSliding) {
    p.setVelocityX(-s.wallDir * CFG.WALL_JUMP_X);
    p.setVelocityY(CFG.WALL_JUMP_Y);
    s.canWallJump = false; s.wallSliding = false;
    s.playerFacing = -s.wallDir;
    s.jumpParticles.explode(12, p.x + s.wallDir * 16, p.y);
    playChime(s, 380, 500, 0.02);
  }

  // Dash
  if (dashDown && s.dashReady) {
    s.dashReady = false; s.isDashing = true;
    p.setVelocityX(s.playerFacing * CFG.DASH_SPEED);
    p.setVelocityY(Math.min(body.velocity.y, -50));
    s.jumpParticles.explode(20, p.x, p.y + 18);
    playChime(s, 392, 523.25, 0.025);
    p.play('hero-dash', true);
    // Afterimages
    for (let i = 0; i < 3; i++) {
        const p_x = p.x;
        const p_y = p.y;
        const facing = s.playerFacing;
      s.time.delayedCall(i * 40, () => {
        if (!s.player) return;
        const ghost = s.add.image(p_x, p_y, 'dashGhost').setDepth(29)
          .setAlpha(0.4 - i * 0.1).setFlipX(facing < 0)
          .setBlendMode(Phaser.BlendModes.SCREEN).setTint(COLORS.heroGlow as number);
        s.dashTrails.push({ img: ghost, life: 200 });
      });
    }
    s.time.delayedCall(170, () => s.isDashing = false);
    s.time.delayedCall(CFG.DASH_CD, () => { s.dashReady = true; updateHUD(s); });
    updateHUD(s);
  }

  // Landing squash
  if (!s.wasOnFloor && onFloor && body.velocity.y >= 0) {
    s.jumpParticles.explode(14, p.x, p.y + 30);
    s.tweens.add({ targets: p, scaleX: 1.22, scaleY: 0.82, duration: 70, yoyo: true });
  }
  s.wasOnFloor = onFloor;

  // Run trail
  if (Math.abs(body.velocity.x) > 80 && onFloor) s.trailParticles.start();
  else s.trailParticles.stop();

  // Animation state
  let anim = 'hero-idle';
  if (s.damageLocked && !s.isRespawning) anim = 'hero-hurt';
  else if (s.isDashing) anim = 'hero-dash';
  else if (s.wallSliding) anim = 'hero-wall';
  else if (!onFloor) anim = 'hero-jump';
  else if (Math.abs(body.velocity.x) > 50) anim = 'hero-run';
  if (p.anims.currentAnim?.key !== anim) p.play(anim, true);

  // Squash & stretch
  if (!onFloor && !s.wallSliding) {
    p.scaleX = Phaser.Math.Linear(p.scaleX, 0.90, 0.12);
    p.scaleY = Phaser.Math.Linear(p.scaleY, 1.12, 0.12);
  } else if (Math.abs(body.velocity.x) > 15) {
    const bob = Math.sin(time * 0.022) * 0.03;
    p.scaleX = Phaser.Math.Linear(p.scaleX, 1.02 + bob, 0.16);
    p.scaleY = Phaser.Math.Linear(p.scaleY, 0.98 - bob, 0.16);
  } else {
    p.scaleX = Phaser.Math.Linear(p.scaleX, 1, 0.14);
    p.scaleY = Phaser.Math.Linear(p.scaleY, 1, 0.14);
  }

  if (p.y > CFG.H + 240) playerDie(s, 'You fell off the world.');
}

export function updateDashTrails(s: GameScene, delta: number) {
  s.dashTrails = s.dashTrails.filter(t => {
    t.life -= delta;
    t.img.alpha = Math.max(0, t.life / 200) * 0.3;
    if (t.life <= 0) { t.img.destroy(); return false; }
    return true;
  });
}
