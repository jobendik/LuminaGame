import Phaser from 'phaser';
import { GAME_HEIGHT, ENEMY } from '../config';

const BOSS = {
  // Health & Armor
  MAX_HEALTH: 8,
  MAX_ARMOR: 4,

  // Movement
  FOLLOW_LERP_X: 0.04,
  FOLLOW_LERP_Y: 0.05,
  CONTACT_RANGE: 90,

  // Bolts
  SHOT_INTERVAL: 1400,
  BOLT_SPEED: 440,
  BOLT_SPEED_STORM: 520,

  // Attack phase
  ATTACK_PREP_TIME: 800,
  ATTACK_TIMES: 3,
  METEORS_PER_ATTACK: 3,

  // Jump phase
  JUMP_FORCE: -380,
  JUMP_RANDOM: 60,
  JUMP_DRIFT: 2.5,

  // Land
  LAND_DURATION: 400,

  // Lunge (legacy kept as jump-lunge)
  LUNGE_SPEED: 11,
  LUNGE_CHASE: 0.06,

  // Stun
  STUN_DURATION: 2000,
  STUN_KNOCKBACK: 200,

  // Death
  DEATH_KNOCKBACK: 150,
  GHOST_SPEED: 100,
  GHOST_DURATION: 1500,

  // Decision
  IDLE_DECISION_DELAY: 1000,
} as const;

type BossState = 'inactive' | 'idle' | 'attack_prep' | 'attack' | 'jump' | 'land' | 'stun' | 'death';

export class BossSystem {
  private scene: Phaser.Scene;
  private sprite!: Phaser.GameObjects.Sprite;
  private glow!: Phaser.GameObjects.Arc;
  private bolts!: Phaser.Physics.Arcade.Group;
  private player!: Phaser.Physics.Arcade.Sprite;

  private _active = false;
  private state: BossState = 'inactive';
  private stateTimer = 0;
  private health = BOSS.MAX_HEALTH;
  private armor = BOSS.MAX_ARMOR;
  private attackCount = 0;
  private meteorSpawned = false;
  private jumpVy = 0;
  private jumpBaseY = 0;
  private nextShotAt = 0;
  private stormActive = false;
  private _dead = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  get active(): boolean { return this._active; }
  get isDead(): boolean { return this._dead; }

  create(player: Phaser.Physics.Arcade.Sprite): void {
    this.player = player;

    this.glow = this.scene.add.circle(-900, GAME_HEIGHT - 142, 96, ENEMY.WRAITH_GLOW_COLOR, 0.01);
    this.glow.setDepth(52).setBlendMode(Phaser.BlendModes.SCREEN);

    this.sprite = this.scene.add.sprite(-900, GAME_HEIGHT - 142, 'hk-boss-idle-1');
    this.sprite.setDepth(53).setAlpha(0.01).setScale(1.6);
    this.sprite.play('hk-boss-idle');

    this.bolts = this.scene.physics.add.group({ allowGravity: false, immovable: true });

    // Overlap: bolts damage player
    this.scene.physics.add.overlap(player, this.bolts, (_p, bolt) => {
      const b = bolt as Phaser.Physics.Arcade.Sprite;
      if (!b.active) return;
      b.destroy();
      this.scene.events.emit('boss-hit-player', this.sprite.x, this.sprite.y);
    });
  }

  activate(stormWallX: number): void {
    if (this._active || this._dead) return;
    this._active = true;
    this.health = BOSS.MAX_HEALTH;
    this.armor = BOSS.MAX_ARMOR;
    this.nextShotAt = this.scene.time.now + 3000; // delayed first shot for cinematic

    // Emit initial health state for UI
    this.scene.events.emit('boss-health-changed', this.health, BOSS.MAX_HEALTH, this.armor, BOSS.MAX_ARMOR);

    // Position boss off-screen above player
    const spawnX = this.player.x + 300;
    const spawnY = GAME_HEIGHT - 142;
    this.sprite.setPosition(spawnX, spawnY - 80);
    this.glow.setPosition(spawnX, spawnY - 80);

    // --- Cinematic entrance ---
    this.scene.events.emit('boss-cinematic-start');

    // Darken screen
    this.scene.cameras.main.flash(800, 10, 5, 30, false);

    // Glow pulses in first
    this.glow.setAlpha(0);
    this.scene.tweens.add({
      targets: this.glow,
      alpha: 0.25,
      duration: 600,
      ease: 'Sine.easeIn',
      yoyo: true,
      repeat: 1,
    });

    // Boss descends into position
    this.sprite.setAlpha(0);
    this.scene.tweens.add({
      targets: this.sprite,
      y: spawnY,
      alpha: 0.75,
      duration: 1200,
      delay: 300,
      ease: 'Sine.easeOut',
    });
    this.scene.tweens.add({
      targets: this.glow,
      y: spawnY,
      alpha: 0.12,
      duration: 1200,
      delay: 300,
      ease: 'Sine.easeOut',
    });

    // Camera zoom pulse
    this.scene.cameras.main.zoomTo(1.08, 600, 'Sine.easeInOut', false, (_camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress >= 1) {
        this.scene.cameras.main.zoomTo(1, 400, 'Sine.easeInOut');
      }
    });

    this.stormActive = true;

    // Toast announcement
    this.scene.events.emit('show-toast', 'The Nightmaw stirs...', '#ff8888');

    // Start idle state after cinematic
    this.scene.time.delayedCall(1600, () => {
      this.transitionTo('idle');
      this.scene.events.emit('boss-cinematic-end');
    });
  }

  private transitionTo(newState: BossState): void {
    this.state = newState;
    this.stateTimer = 0;

    switch (newState) {
      case 'idle':
        this.sprite.setScale(1.6);
        this.sprite.clearTint();
        this.sprite.play('hk-boss-idle');
        break;
      case 'attack_prep':
        this.attackCount = 0;
        this.sprite.setScale(1.7);
        this.sprite.setTint(0xff8866);
        this.sprite.play('hk-boss-attack-prep');
        this.scene.events.emit('boss-telegraph');
        this.scene.events.emit('play-sfx', 'sfx-boss-telegraph', 0.35);
        break;
      case 'attack':
        this.meteorSpawned = false;
        this.sprite.setScale(1.9);
        this.sprite.setTint(0xff4444);
        this.sprite.play('hk-boss-attack');
        break;
      case 'jump':
        this.jumpBaseY = this.sprite.y;
        this.jumpVy = BOSS.JUMP_FORCE + Phaser.Math.Between(-BOSS.JUMP_RANDOM, BOSS.JUMP_RANDOM);
        this.sprite.play('hk-boss-jump');
        this.scene.events.emit('play-sfx', 'sfx-boss-jump', 0.3);
        break;
      case 'land':
        this.sprite.setScale(1.8);
        this.sprite.play('hk-boss-land');
        this.scene.events.emit('boss-land', this.sprite.x, this.sprite.y);
        this.scene.events.emit('play-sfx', 'sfx-boss-land', 0.4);
        break;
      case 'stun':
        this.sprite.setScale(1.5);
        this.sprite.setTint(0x88ccff);
        this.sprite.play('hk-boss-stun');
        this.glow.setScale(2);
        this.scene.events.emit('boss-stunned', this.sprite.x, this.sprite.y);
        this.scene.events.emit('play-sfx', 'sfx-boss-stun', 0.4);
        // Knockback
        const kb = this.sprite.x < this.player.x ? -1 : 1;
        this.sprite.x += kb * BOSS.STUN_KNOCKBACK;
        break;
      case 'death':
        this._dead = true;
        this.sprite.setTint(0x442266);
        this.scene.events.emit('boss-death', this.sprite.x, this.sprite.y);
        this.scene.events.emit('play-sfx', 'sfx-boss-death', 0.5);
        this.spawnGhost();

        // Cinematic time-slow
        this.scene.time.timeScale = 0.2;
        this.scene.time.delayedCall(400, () => { this.scene.time.timeScale = 1; });

        // Screen flash
        this.scene.cameras.main.flash(600, 80, 40, 120, false);

        // Dramatic rotation
        this.scene.tweens.add({
          targets: this.sprite,
          angle: 360,
          duration: 1800,
          ease: 'Sine.easeInOut',
        });
        break;
    }
  }

  update(time: number, delta: number, stormWallX: number): void {
    if (!this._active) {
      this.sprite.alpha = Phaser.Math.Linear(this.sprite.alpha, 0.01, 0.08);
      this.glow.alpha = Phaser.Math.Linear(this.glow.alpha, 0.01, 0.08);
      return;
    }

    this.stateTimer += delta;

    switch (this.state) {
      case 'idle':
        this.updateIdle(time, delta, stormWallX);
        break;
      case 'attack_prep':
        this.updateAttackPrep(time, delta, stormWallX);
        break;
      case 'attack':
        this.updateAttack(time, delta, stormWallX);
        break;
      case 'jump':
        this.updateJump(time, delta, stormWallX);
        break;
      case 'land':
        this.updateLand();
        break;
      case 'stun':
        this.updateStun(time);
        break;
      case 'death':
        this.updateDeath();
        break;
    }

    // Shadow bolt shooting (in all active non-stun/death states)
    if (this.state !== 'stun' && this.state !== 'death' && this.state !== 'land') {
      this.updateBolts(time);
    }

    // Clean up off-screen bolts
    this.bolts.children.each((bolt) => {
      const b = bolt as Phaser.Physics.Arcade.Sprite;
      if (b?.active && (b.x > 4200 || b.y < -120 || b.y > GAME_HEIGHT + 220)) {
        b.destroy();
      }
      return true;
    });

    // Track glow to sprite
    this.glow.x = this.sprite.x - 8;
    this.glow.y = this.sprite.y;

    // Contact damage (not during stun/death)
    if (this.state !== 'stun' && this.state !== 'death') {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        this.sprite.x + 40, this.sprite.y + 10,
      );
      if (dist < BOSS.CONTACT_RANGE) {
        this.scene.events.emit('boss-hit-player', this.sprite.x, this.sprite.y);
      }
    }
  }

  private updateIdle(time: number, _delta: number, stormWallX: number): void {
    // Follow player
    this.followPlayer(time, stormWallX);
    this.glow.alpha = 0.16 + Math.sin(time * 0.014) * 0.08;
    this.sprite.alpha = 0.9;

    // After delay, choose next action (50/50 attack or jump)
    if (this.stateTimer >= BOSS.IDLE_DECISION_DELAY) {
      if (Math.random() < 0.5) {
        this.transitionTo('attack_prep');
      } else {
        this.transitionTo('jump');
      }
    }
  }

  private updateAttackPrep(time: number, _delta: number, stormWallX: number): void {
    this.followPlayer(time, stormWallX);
    // Pulsing grow effect
    const pulse = 1.7 + Math.sin(time * 0.02) * 0.1;
    this.sprite.setScale(pulse);
    this.glow.alpha = 0.32 + Math.sin(time * 0.03) * 0.1;
    this.glow.setScale(1.25 + Math.sin(time * 0.06) * 0.14);

    if (this.stateTimer >= BOSS.ATTACK_PREP_TIME) {
      this.transitionTo('attack');
    }
  }

  private updateAttack(time: number, _delta: number, stormWallX: number): void {
    this.followPlayer(time, stormWallX);

    // Spawn meteors once per attack cycle
    if (!this.meteorSpawned && this.stateTimer >= 200) {
      this.meteorSpawned = true;
      this.scene.events.emit('boss-spawn-meteors', BOSS.METEORS_PER_ATTACK, this.sprite.x, this.sprite.y);
      this.scene.events.emit('play-sfx', 'sfx-boss-attack', 0.4);
    }

    // Attack cycle ends
    if (this.stateTimer >= 600) {
      this.attackCount++;
      if (this.attackCount >= BOSS.ATTACK_TIMES) {
        this.transitionTo('idle');
      } else {
        // Reset for next attack in cycle
        this.stateTimer = 0;
        this.meteorSpawned = false;
      }
    }
  }

  private updateJump(time: number, delta: number, stormWallX: number): void {
    // Horizontal drift toward player
    const driftDir = this.player.x > this.sprite.x ? 1 : -1;
    this.sprite.x += driftDir * BOSS.JUMP_DRIFT * (delta / 16.67);

    // Vertical arc
    this.jumpVy += 15 * (delta / 16.67); // gravity
    this.sprite.y += this.jumpVy * (delta / 1000);

    // Landed
    if (this.sprite.y >= this.jumpBaseY && this.stateTimer > 200) {
      this.sprite.y = this.jumpBaseY;
      this.transitionTo('land');
    }

    // Constrain to world
    this.sprite.x = Math.max(stormWallX + 130, this.sprite.x);
    this.glow.alpha = 0.2;
  }

  private updateLand(): void {
    this.sprite.alpha = 0.9;
    this.glow.alpha = 0.2;
    const s = this.glow.scaleX || 1;
    this.glow.setScale(Phaser.Math.Linear(s, 1, 0.12));

    if (this.stateTimer >= BOSS.LAND_DURATION) {
      this.transitionTo('idle');
    }
  }

  private updateStun(time: number): void {
    // Pulsing vulnerable glow
    this.sprite.alpha = 0.6 + Math.sin(time * 0.02) * 0.2;
    this.glow.alpha = 0.3 + Math.sin(time * 0.015) * 0.15;

    if (this.stateTimer >= BOSS.STUN_DURATION) {
      // Recover from stun
      this.armor = BOSS.MAX_ARMOR;
      this.glow.setScale(1);
      this.sprite.clearTint();
      this.scene.events.emit('boss-recovered');
      this.scene.events.emit('boss-health-changed', this.health, BOSS.MAX_HEALTH, this.armor, BOSS.MAX_ARMOR);
      this.transitionTo('idle');
    }
  }

  private updateDeath(): void {
    // Enhanced fade with pulsing
    const pulse = Math.sin(this.stateTimer * 0.008) * 0.1;
    this.sprite.alpha = Math.max(0, this.sprite.alpha - 0.004 + pulse * 0.002);
    this.glow.alpha = Math.max(0, this.glow.alpha - 0.006);

    // Scale shrink
    const s = Phaser.Math.Linear(this.sprite.scaleX, 0.4, 0.003);
    this.sprite.setScale(s);

    // Emit periodic burst particles
    if (this.stateTimer % 300 < 16) {
      this.scene.events.emit('boss-death-burst', this.sprite.x, this.sprite.y);
    }

    if (this.stateTimer >= 2000) {
      this._active = false;
      this.sprite.setVisible(false);
      this.glow.setVisible(false);
      this.scene.events.emit('boss-defeated');
    }
  }

  private followPlayer(time: number, stormWallX: number): void {
    const tx = Math.max(stormWallX + 130, this.player.x - 270 + Math.sin(time * 0.004) * 30);
    const ty = Phaser.Math.Clamp(
      this.player.y - 50 + Math.sin(time * 0.007) * 24,
      150,
      GAME_HEIGHT - 72,
    );
    this.sprite.x = Phaser.Math.Linear(this.sprite.x, tx, BOSS.FOLLOW_LERP_X);
    this.sprite.y = Phaser.Math.Linear(this.sprite.y, ty, BOSS.FOLLOW_LERP_Y);
  }

  private updateBolts(time: number): void {
    if (time > this.nextShotAt) {
      this.nextShotAt = time + BOSS.SHOT_INTERVAL;
      const bolt = this.bolts.create(
        this.sprite.x + 44,
        this.sprite.y + Phaser.Math.Between(-18, 18),
        'shadow-bolt',
      ) as Phaser.Physics.Arcade.Sprite;
      bolt.setDepth(54);
      const speed = this.stormActive ? BOSS.BOLT_SPEED_STORM : BOSS.BOLT_SPEED;
      bolt.setVelocity(speed, Phaser.Math.Between(-70, 70));
      (bolt.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      this.scene.tweens.add({
        targets: bolt,
        alpha: { from: 1, to: 0.3 },
        duration: 200,
        yoyo: true,
        repeat: 1,
      });
    }
  }

  private spawnGhost(): void {
    const ghost = this.scene.add.sprite(this.sprite.x, this.sprite.y, 'hk-boss-ghost-1');
    ghost.setDepth(55).setAlpha(0.6).setScale(1.8).setTint(0xccaaff);
    ghost.play('hk-boss-ghost-die');

    const dir = this.sprite.x < this.player.x ? -1 : 1;
    this.scene.tweens.add({
      targets: ghost,
      x: ghost.x + dir * BOSS.GHOST_SPEED,
      y: ghost.y - 80,
      alpha: 0,
      scale: 2.2,
      duration: BOSS.GHOST_DURATION,
      ease: 'Quad.easeOut',
      onComplete: () => ghost.destroy(),
    });
  }

  deactivate(): void {
    this._active = false;
  }

  getBossSprite(): Phaser.GameObjects.Sprite {
    return this.sprite;
  }

  damageBoss(amount: number): void {
    if (!this._active || this._dead) return;

    // Visual feedback — flash
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.sprite?.active && !this._dead) {
        // Restore state-appropriate tint
        if (this.state === 'stun') {
          this.sprite.setTint(0x88ccff);
        } else {
          this.sprite.clearTint();
        }
      }
    });

    if (this.state === 'stun') {
      // While stunned, damage goes to health
      this.health -= amount;
      this.scene.events.emit('boss-health-changed', this.health, BOSS.MAX_HEALTH, this.armor, BOSS.MAX_ARMOR);
      if (this.health <= 0) {
        this.transitionTo('death');
      }
    } else if (this.state !== 'jump') {
      // In other states (not jump), damage goes to armor
      this.armor -= amount;
      this.scene.events.emit('boss-health-changed', this.health, BOSS.MAX_HEALTH, this.armor, BOSS.MAX_ARMOR);
      // Brief knockback
      const dir = this.sprite.x < this.player.x ? -1 : 1;
      this.sprite.x += dir * 30;

      if (this.armor <= 0) {
        this.scene.events.emit('boss-armor-broken', this.sprite.x, this.sprite.y);
        this.transitionTo('stun');
      }
    }
  }
}
