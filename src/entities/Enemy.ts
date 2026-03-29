import Phaser from 'phaser';
import { StateMachine } from '../utils/StateMachine';
import { ENEMY } from '../config';
import { REGIONS } from '../data/regions';

const WORLD_WIDTH = 3840;
const REGION_WIDTH = WORLD_WIDTH / REGIONS.length;

export interface WraithConfig {
  x1: number;
  x2: number;
  y: number;
  speed?: number;
  aggroRadius?: number;
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private stateMachine: StateMachine;
  private glow: Phaser.GameObjects.Arc;
  private outerGlow: Phaser.GameObjects.Arc;
  private player!: Phaser.Physics.Arcade.Sprite;

  private x1: number;
  private x2: number;
  private baseY: number;
  private speed: number;
  private aggroRadius: number;
  private phase: number;

  private aggroUntil = 0;
  private lungeUntil = 0;
  private nextLungeAt = 0;
  private nextOrbAt = 0;
  private spiralUntil = 0;
  private spiralAngle = 0;
  private spiralCenterX = 0;
  private spiralCenterY = 0;
  private divePhase = false;
  private focusX: number;
  private focusY: number;
  private hp = ENEMY.WRAITH_HP ?? 3;
  private stunUntil = 0;
  private recoilVx = 0;
  private recoilVy = 0;
  private regionTint: number;

  constructor(scene: Phaser.Scene, config: WraithConfig, index: number) {
    super(scene, config.x1, config.y, 'wraith_0');

    this.x1 = config.x1;
    this.x2 = config.x2;
    this.baseY = config.y;
    this.speed = config.speed ?? ENEMY.WRAITH_PATROL_SPEED;
    this.aggroRadius = config.aggroRadius ?? ENEMY.WRAITH_AGGRO_RADIUS;
    this.phase = index * 1.8;
    this.focusX = config.x1;
    this.focusY = config.y;

    // Region variation: subtle colour tint
    const ri = Math.min(Math.floor(config.x1 / REGION_WIDTH), REGIONS.length - 1);
    this.regionTint = REGIONS[ri].palette.accent;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(21);
    this.setTint(this.regionTint);

    // Spawn fade-in
    this.setAlpha(0);
    scene.tweens.add({ targets: this, alpha: 0.94, duration: 500, ease: 'Sine.easeIn' });
    this.setImmovable(true);
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    this.play('wraith-float');

    // Glow circle — inner bright core
    this.glow = scene.add.circle(
      config.x1, config.y,
      ENEMY.WRAITH_GLOW_RADIUS,
      ENEMY.WRAITH_GLOW_COLOR, 0.10,
    );
    this.glow.setBlendMode(Phaser.BlendModes.SCREEN);
    this.glow.setDepth(20);

    // Outer atmospheric glow
    this.outerGlow = scene.add.circle(
      config.x1, config.y,
      ENEMY.WRAITH_GLOW_RADIUS * 1.8,
      ENEMY.WRAITH_GLOW_COLOR, 0.04,
    );
    this.outerGlow.setBlendMode(Phaser.BlendModes.SCREEN);
    this.outerGlow.setDepth(19);

    // State machine
    this.stateMachine = new StateMachine();
    this.stateMachine
      .addState('patrol', {
        update: (delta) => this.updatePatrol(delta),
      })
      .addState('chase', {
        enter: () => { this.setScale(1.1); },
        update: (delta) => this.updateChase(delta),
        exit: () => { this.setScale(1); },
      })
      .addState('lunge', {
        enter: () => {
          this.glow.alpha = 0.24; this.outerGlow.alpha = 0.12;
          this.telegraphFlash();
        },
        update: (delta) => this.updateLunge(delta),
      })
      .addState('orb_attack', {
        enter: () => {
          this.glow.alpha = 0.30; this.outerGlow.alpha = 0.16;
          this.telegraphFlash();
        },
        update: (delta) => this.updateOrbAttack(delta),
      })
      .addState('spiral', {
        enter: () => {
          this.glow.alpha = 0.28;
          this.outerGlow.alpha = 0.14;
          this.spiralCenterX = this.player.x;
          this.spiralCenterY = this.player.y - 20;
          this.spiralAngle = Math.atan2(this.y - this.spiralCenterY, this.x - this.spiralCenterX);
          this.divePhase = false;
          this.telegraphFlash();
        },
        update: (delta) => this.updateSpiral(delta),
      });

    this.stateMachine.transition('patrol');
  }

  setPlayer(player: Phaser.Physics.Arcade.Sprite): void {
    this.player = player;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.player) return;

    const now = time;

    // Hit stun — slide via recoil, skip AI
    if (now < this.stunUntil) {
      this.x += this.recoilVx * (delta / 16.67);
      this.y += this.recoilVy * (delta / 16.67);
      this.recoilVx *= 0.88;
      this.recoilVy *= 0.88;
      this.glow.x = this.x;
      this.glow.y = this.y;
      this.outerGlow.x = this.x;
      this.outerGlow.y = this.y;
      return;
    }
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.x, this.y,
    );
    const verticalBand = Math.abs(this.player.y - this.y) < ENEMY.WRAITH_VERTICAL_BAND;
    const aggro = verticalBand && dist < this.aggroRadius;

    if (aggro) {
      this.aggroUntil = now + ENEMY.WRAITH_AGGRO_TIMEOUT;
    }

    // Decide state
    if (this.lungeUntil && now < this.lungeUntil) {
      if (this.stateMachine.currentState !== 'lunge') {
        this.stateMachine.transition('lunge');
      }
    } else if (this.spiralUntil && now < this.spiralUntil) {
      if (this.stateMachine.currentState !== 'spiral') {
        this.stateMachine.transition('spiral');
      }
    } else if (now < this.aggroUntil) {
      this.lungeUntil = 0;
      this.spiralUntil = 0;
      // Check attack trigger
      if (now > this.nextLungeAt && dist < ENEMY.WRAITH_LUNGE_RANGE) {
        // Randomly pick attack: 40% lunge, 30% orb, 30% spiral
        const roll = Math.random();
        if (roll < 0.4) {
          this.nextLungeAt = now + ENEMY.WRAITH_LUNGE_COOLDOWN;
          this.lungeUntil = now + ENEMY.WRAITH_LUNGE_DURATION;
          this.stateMachine.transition('lunge');
        } else if (roll < 0.7 && now > this.nextOrbAt) {
          this.nextLungeAt = now + ENEMY.WRAITH_LUNGE_COOLDOWN;
          this.nextOrbAt = now + ENEMY.WRAITH_ORB_COOLDOWN;
          this.fireOrbs();
          this.stateMachine.transition('orb_attack');
        } else {
          this.nextLungeAt = now + ENEMY.WRAITH_LUNGE_COOLDOWN;
          this.spiralUntil = now + ENEMY.WRAITH_SPIRAL_DURATION;
          this.stateMachine.transition('spiral');
        }
      } else if (this.stateMachine.currentState !== 'chase') {
        this.stateMachine.transition('chase');
      }
    } else {
      this.lungeUntil = 0;
      this.spiralUntil = 0;
      if (this.stateMachine.currentState !== 'patrol') {
        this.stateMachine.transition('patrol');
      }
    }

    this.stateMachine.update(delta);

    // Keep glows tracking
    this.glow.x = this.x;
    this.glow.y = this.y;
    this.outerGlow.x = this.x;
    this.outerGlow.y = this.y;

    // Face the player
    this.setFlipX(this.player.x < this.x);
  }

  private updatePatrol(_delta: number): void {
    const now = this.scene.time.now;
    const t = (Math.sin(now * this.speed + this.phase) + 1) * 0.5;
    this.focusX = Phaser.Math.Linear(this.x1, this.x2, t);
    this.focusY = this.baseY + Math.sin(now * 0.005 + this.phase) * 10;

    this.x = Phaser.Math.Linear(this.x, this.focusX, ENEMY.WRAITH_PATROL_LERP);
    this.y = Phaser.Math.Linear(this.y, this.focusY, ENEMY.WRAITH_PATROL_LERP);

    this.glow.alpha = 0.08 + Math.sin(now * 0.007 + this.phase) * 0.03;
    this.outerGlow.alpha = 0.03 + Math.sin(now * 0.005 + this.phase) * 0.015;
  }

  private updateChase(_delta: number): void {
    const now = this.scene.time.now;

    // Vector-based pursuit: compute direction to player + lead offset
    const ahead = this.player.flipX ? -30 : 30;
    const targetX = Phaser.Math.Clamp(
      this.player.x + ahead, this.x1 - 80, this.x2 + 80,
    );
    const targetY = Phaser.Math.Clamp(
      this.player.y - 18, this.baseY - 80, this.baseY + 80,
    );
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // Accelerate toward player — faster when close (intensity ramp)
    const intensity = Phaser.Math.Clamp(1 - dist / this.aggroRadius, 0.3, 1);
    const chaseSpeed = ENEMY.WRAITH_CHASE_LERP * (1 + intensity * 0.6);
    this.x += (dx / dist) * dist * chaseSpeed;
    this.y += (dy / dist) * dist * chaseSpeed;

    this.glow.alpha = 0.16 + intensity * 0.08 + Math.sin(now * 0.007 + this.phase) * 0.03;
    this.outerGlow.alpha = 0.08 + intensity * 0.04 + Math.sin(now * 0.005 + this.phase) * 0.03;
  }

  private updateLunge(_delta: number): void {
    this.x += (this.player.x - this.x) * ENEMY.WRAITH_LUNGE_LERP;
    this.y += (this.player.y - 10 - this.y) * 0.12;
  }

  private updateOrbAttack(_delta: number): void {
    // Hover in place while orbs fly — gentle drift away from player
    const dx = this.x - this.player.x;
    const retreatDir = dx > 0 ? 1 : -1;
    this.x += retreatDir * 0.4;
    this.y = Phaser.Math.Linear(this.y, this.baseY - 20, 0.03);
  }

  private updateSpiral(_delta: number): void {
    const now = this.scene.time.now;
    const elapsed = ENEMY.WRAITH_SPIRAL_DURATION - (this.spiralUntil - now);

    if (!this.divePhase && elapsed < ENEMY.WRAITH_SPIRAL_DURATION * 0.7) {
      // Circle phase — orbit around the player's last position
      this.spiralAngle += ENEMY.WRAITH_SPIRAL_SPEED * _delta;
      const targetX = this.spiralCenterX + Math.cos(this.spiralAngle) * ENEMY.WRAITH_SPIRAL_RADIUS;
      const targetY = this.spiralCenterY + Math.sin(this.spiralAngle) * ENEMY.WRAITH_SPIRAL_RADIUS;
      this.x = Phaser.Math.Linear(this.x, targetX, 0.15);
      this.y = Phaser.Math.Linear(this.y, targetY, 0.15);
    } else {
      // Dive phase — quick dive at player
      this.divePhase = true;
      this.x += (this.player.x - this.x) * ENEMY.WRAITH_DIVE_LERP;
      this.y += (this.player.y - 10 - this.y) * ENEMY.WRAITH_DIVE_LERP;
    }
  }

  private fireOrbs(): void {
    const dx = this.player.x - this.x;
    const dy = this.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const baseAngle = Math.atan2(dy, dx);

    // Fire 3 orbs in a spread pattern
    const spread = 0.25; // radians
    for (let i = -1; i <= 1; i++) {
      const angle = baseAngle + i * spread;
      const vx = Math.cos(angle) * ENEMY.WRAITH_ORB_SPEED;
      const vy = Math.sin(angle) * ENEMY.WRAITH_ORB_SPEED;

      const orb = this.scene.add.circle(this.x, this.y, 6, 0xbb88ff, 0.9);
      orb.setBlendMode(Phaser.BlendModes.ADD);
      orb.setDepth(22);

      this.scene.physics.add.existing(orb);
      const orbBody = orb.body as Phaser.Physics.Arcade.Body;
      orbBody.setAllowGravity(false);
      orbBody.setVelocity(vx, vy);
      orbBody.setCircle(6);

      // Tag for GameScene overlap detection
      (orb as Phaser.GameObjects.Arc & { isWraithOrb?: boolean }).isWraithOrb = true;
      this.scene.events.emit('wraith-orb-spawned', orb);

      // Destroy after lifespan
      this.scene.time.delayedCall(ENEMY.WRAITH_ORB_LIFESPAN, () => {
        if (orb.active) orb.destroy();
      });
    }
  }

  /** Brief red flash on wraith + glow flare to telegraph an incoming attack. */
  private telegraphFlash(): void {
    // Sprite flash
    this.setTintFill(0xff4444);
    this.scene.time.delayedCall(100, () => {
      if (this.active) this.setTint(this.regionTint);
    });

    // Glow flare — spike then settle
    const prevGlow = this.glow.alpha;
    const prevOuter = this.outerGlow.alpha;
    this.glow.alpha = 0.55;
    this.outerGlow.alpha = 0.35;
    this.scene.tweens.add({
      targets: this.glow,
      alpha: prevGlow,
      duration: 200,
      ease: 'Sine.easeOut',
    });
    this.scene.tweens.add({
      targets: this.outerGlow,
      alpha: prevOuter,
      duration: 200,
      ease: 'Sine.easeOut',
    });
  }

  takeDamage(amount: number, hitDirX = 0): void {
    this.hp -= amount;

    // Flash white on hit
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.active) this.setTint(this.regionTint);
    });

    // Hit stun + recoil knockback
    this.stunUntil = this.scene.time.now + 180;
    this.recoilVx = hitDirX * 4;
    this.recoilVy = -1.5;

    // Squash/stretch on impact
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.7,
      scaleY: 1.3,
      duration: 60,
      yoyo: true,
      ease: 'Sine.easeOut',
    });

    if (this.hp <= 0) {
      this.die();
    }
  }

  private die(): void {
    // Emit death event for particles/sfx
    this.scene.events.emit('enemy-death', this.x, this.y, 'wraith');

    // Expand glow on death
    if (this.glow) {
      this.scene.tweens.add({
        targets: this.glow,
        alpha: 0.4,
        scale: 2.5,
        duration: 400,
        ease: 'Quad.easeOut',
        onComplete: () => this.glow?.destroy(),
      });
    }
    if (this.outerGlow) {
      this.scene.tweens.add({
        targets: this.outerGlow,
        alpha: 0,
        duration: 300,
        onComplete: () => this.outerGlow?.destroy(),
      });
    }

    // Fade-out and float upward
    this.setTint(0xbb88ff);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y - 40,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => this.destroy(),
    });

    // Disable overlap immediately
    (this.body as Phaser.Physics.Arcade.Body)?.setEnable(false);
  }

  destroy(fromScene?: boolean): void {
    this.glow?.destroy();
    this.outerGlow?.destroy();
    super.destroy(fromScene);
  }
}
