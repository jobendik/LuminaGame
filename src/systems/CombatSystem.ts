import Phaser from 'phaser';
import { COMBAT } from '../config';

export class CombatSystem {
  private scene: Phaser.Scene;
  private player!: Phaser.Physics.Arcade.Sprite;
  private _health: number;
  private _maxHealth: number;
  private damageLocked = false;
  private isRespawning = false;
  private hitFreezeTimer = 0;
  private _invincible = false;
  private getSpawnPoint: () => { x: number; y: number };

  // Blast charges
  private _blastCharges: number;
  private _maxBlastCharges: number;

  constructor(
    scene: Phaser.Scene,
    getSpawnPoint: () => { x: number; y: number },
  ) {
    this.scene = scene;
    this._maxHealth = COMBAT.MAX_HEALTH;
    this._health = this._maxHealth;
    this._maxBlastCharges = COMBAT.BLAST_MAX_CHARGES;
    this._blastCharges = this._maxBlastCharges;
    this.getSpawnPoint = getSpawnPoint;
  }

  get health(): number {
    return this._health;
  }

  get maxHealth(): number {
    return this._maxHealth;
  }

  get isDead(): boolean {
    return this._health <= 0;
  }

  get isFrozen(): boolean {
    return this.hitFreezeTimer > 0;
  }

  get blastCharges(): number {
    return this._blastCharges;
  }

  get maxBlastCharges(): number {
    return this._maxBlastCharges;
  }

  canBlast(): boolean {
    return this._blastCharges > 0;
  }

  useBlastCharge(): boolean {
    if (this._blastCharges <= 0) return false;
    this._blastCharges--;
    this.scene.events.emit('blast-charges-changed', this._blastCharges, this._maxBlastCharges);
    return true;
  }

  addBlastCharge(amount = 1): void {
    this._blastCharges = Math.min(this._maxBlastCharges, this._blastCharges + amount);
    this.scene.events.emit('blast-charges-changed', this._blastCharges, this._maxBlastCharges);
  }

  heal(amount: number): void {
    if (this._health >= this._maxHealth) return;
    this._health = Math.min(this._maxHealth, this._health + amount);
    this.scene.events.emit('player-damaged', this._health, this._maxHealth, 'heal');
  }

  setInvincible(value: boolean): void {
    this._invincible = value;
  }

  setPlayer(player: Phaser.Physics.Arcade.Sprite): void {
    this.player = player;
  }

  update(delta: number): void {
    if (this.hitFreezeTimer > 0) {
      this.hitFreezeTimer = Math.max(0, this.hitFreezeTimer - delta);
    }
  }

  damagePlayer(amount: number, sourceX: number, sourceY: number, reason: string): void {
    if (this.damageLocked || this.isRespawning || this._invincible || !this.player) return;

    this._health = Math.max(0, this._health - amount);
    this.damageLocked = true;
    this.hitFreezeTimer = COMBAT.HIT_FREEZE;

    // Knockback direction away from source
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const dx = this.player.x > sourceX ? 1 : -1;
    body.setVelocity(dx * COMBAT.KNOCKBACK_X, COMBAT.KNOCKBACK_Y);

    // Emit events for other systems to react
    this.scene.events.emit('player-damaged', this._health, this._maxHealth, reason);

    // Camera feedback
    this.scene.cameras.main.shake(140, 0.005);
    this.scene.cameras.main.flash(100, 180, 40, 40, false);

    // Play hurt animation
    this.scene.events.emit('player-hurt');

    // Iframes blink effect
    this.blinkPlayer();

    // Play damage SFX
    this.scene.events.emit('play-sfx', 'sfx-damage', 0.35);

    // Show toast notification
    this.scene.events.emit('show-toast', reason, 0xff8a9e);

    if (this._health <= 0) {
      this.scene.time.delayedCall(220, () => this.playerDie(reason));
    } else {
      // Unlock damage after iframes
      this.scene.time.delayedCall(COMBAT.IFRAMES, () => {
        this.damageLocked = false;
        if (this.player) this.player.setAlpha(1);
      });
    }
  }

  private playerDie(reason: string): void {
    if (this.isRespawning) return;
    this.isRespawning = true;
    this.damageLocked = true;

    this.scene.events.emit('player-died', reason);

    // Fade camera to black
    this.scene.cameras.main.fadeOut(COMBAT.RESPAWN_FADE, 10, 10, 26);

    this.scene.time.delayedCall(COMBAT.RESPAWN_DELAY, () => {
      const spawn = this.getSpawnPoint();
      this.player.setPosition(spawn.x, spawn.y);

      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      this.player.setAlpha(1);

      this._health = this._maxHealth;
      this._blastCharges = this._maxBlastCharges;
      this.isRespawning = false;

      // Brief iframes after respawn
      this.scene.time.delayedCall(COMBAT.IFRAMES, () => {
        this.damageLocked = false;
      });

      // Respawn visual: fade player in + emit bloom event
      this.player.setAlpha(0.2);
      this.scene.tweens.add({
        targets: this.player,
        alpha: 1,
        duration: 400,
        ease: 'Sine.easeIn',
      });

      this.scene.cameras.main.fadeIn(COMBAT.RESPAWN_FADE, 10, 10, 26);
      this.scene.events.emit('player-respawned', this._health, this._maxHealth);
      this.scene.events.emit('respawn-bloom', spawn.x, spawn.y - 40);
    });
  }

  private blinkPlayer(): void {
    const count = COMBAT.IFRAMES_BLINKS;
    const interval = Math.floor(COMBAT.IFRAMES / (count * 2));
    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(interval * (i * 2), () => {
        if (this.player) this.player.setAlpha(0.3);
      });
      this.scene.time.delayedCall(interval * (i * 2 + 1), () => {
        if (this.player) this.player.setAlpha(1);
      });
    }
  }
}
