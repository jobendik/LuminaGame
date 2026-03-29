import Phaser from 'phaser';
import { PlayerState, AbilityId } from '../types';
import { PHYSICS, COMBAT, PLAYER_SHEET, PLAYER_ANIMS, ASSET_KEYS } from '../config';
import { StateMachine } from '../utils/StateMachine';
import { AbilitySystem } from './AbilitySystem';

const COYOTE_TIME = 100; // ms grace period after leaving ground
const JUMP_BUFFER = 120; // ms buffer for early jump press

export class PlayerSystem {
  private scene: Phaser.Scene;
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private dashKey!: Phaser.Input.Keyboard.Key;
  private glideKey!: Phaser.Input.Keyboard.Key;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private blastKey!: Phaser.Input.Keyboard.Key;
  private heavyFormKey!: Phaser.Input.Keyboard.Key;
  private spiritVisionKey!: Phaser.Input.Keyboard.Key;
  private stateMachine: StateMachine;
  private abilitySystem: AbilitySystem;
  private dashTimer = 0;
  private dashCooldown = 0;
  private wasGrounded = false;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private fallStartY = 0;
  private isGliding = false;
  private animationsCreated = false;
  public suppressJump = false;
  public inputLocked = false;
  private heavyFormActive = false;
  private spiritVisionActive = false;
  public windVelocity = 0; // set externally by wind zones
  public regionSpeedMultiplier = 1.0; // set externally by region mechanic
  public regionJumpMultiplier = 1.0; // set externally by region mechanic

  // Combat state
  private attackTimer = 0;
  private attackCooldown = 0;
  private comboStep = 0; // 0 = no combo, 1 = first hit, 2 = second hit
  private comboWindow = 0;
  private blastCooldown = 0;

  // Footstep timer
  private footstepTimer = 0;
  private baseMaxSpeed = PHYSICS.PLAYER_SPEED;
  private readonly FOOTSTEP_INTERVAL = 280; // ms between footstep sounds

  // Wall slide
  private wallSlideDir = 0; // -1 = left wall, 1 = right wall, 0 = none

  // Light effect
  private lightGlow!: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, abilitySystem: AbilitySystem) {
    this.scene = scene;
    this.abilitySystem = abilitySystem;
    this.stateMachine = new StateMachine();
    this.setupStates();
  }

  create(x: number, y: number): Phaser.Physics.Arcade.Sprite {
    this.player = this.scene.physics.add.sprite(x, y, ASSET_KEYS.PLAYER, 0);
    this.player.setCollideWorldBounds(true);
    this.player.setScale(PLAYER_SHEET.SCALE);
    this.player.setOrigin(0.5, 1);
    this.player.setDepth(10);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(14, 24);
    body.setOffset(9, 8);
    body.setMaxVelocity(PHYSICS.PLAYER_SPEED, 600);
    this.baseMaxSpeed = PHYSICS.PLAYER_SPEED;

    this.cursors = this.scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.dashKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.glideKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.attackKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.blastKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.heavyFormKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.H);
    this.spiritVisionKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.V);

    this.createAnimations();
    this.player.anims.play(PLAYER_ANIMS.IDLE.key);
    this.stateMachine.transition(PlayerState.IDLE);

    // Radial light glow around player
    this.lightGlow = this.scene.add.ellipse(x, y - 16, 120, 100, 0xaaccff, 0.07);
    this.lightGlow.setBlendMode(Phaser.BlendModes.SCREEN);
    this.lightGlow.setDepth(9);
    this.scene.tweens.add({
      targets: this.lightGlow,
      alpha: { from: 0.05, to: 0.1 },
      scaleX: { from: 0.95, to: 1.08 },
      scaleY: { from: 0.95, to: 1.05 },
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return this.player;
  }

  enterHurtState(): void {
    this.stateMachine.transition(PlayerState.HURT);
  }

  enterBlastState(): void {
    if (this.blastCooldown <= 0) {
      this.stateMachine.transition(PlayerState.BLAST);
    }
  }

  update(delta: number): void {
    if (this.inputLocked) {
      this.stateMachine.update(delta);
      this.updateLightPosition();
      return;
    }

    // Dash cooldown countdown
    if (this.dashCooldown > 0) {
      const prev = this.dashCooldown;
      this.dashCooldown = Math.max(0, this.dashCooldown - delta);
      // Flash player when dash becomes available again
      if (prev > 0 && this.dashCooldown <= 0) {
        this.player.setTintFill(0xaaccff);
        this.scene.time.delayedCall(80, () => {
          if (this.player.active) this.player.clearTint();
        });
      }
    }

    // Attack cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    }
    if (this.blastCooldown > 0) {
      this.blastCooldown = Math.max(0, this.blastCooldown - delta);
    }
    if (this.comboWindow > 0) {
      this.comboWindow = Math.max(0, this.comboWindow - delta);
      if (this.comboWindow <= 0) this.comboStep = 0;
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;

    // --- Coyote time ---
    if (onGround) {
      this.coyoteTimer = COYOTE_TIME;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    }

    // --- Jump buffer ---
    const jumpJustPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up!) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.W);
    if (this.suppressJump) {
      this.jumpBufferTimer = 0;
    } else if (jumpJustPressed) {
      this.jumpBufferTimer = JUMP_BUFFER;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
    }

    // --- Landing detection ---
    if (onGround && !this.wasGrounded) {
      const fallDistance = Math.max(0, this.player.y - this.fallStartY);
      const shakeIntensity = Math.min(fallDistance * 0.00003, 0.008);
      this.scene.events.emit('player-land', this.player.x, this.player.y, shakeIntensity);

      // Squash on land
      this.squash();

      // Consume jump buffer on landing
      if (this.jumpBufferTimer > 0 && !this.suppressJump) {
        this.jumpBufferTimer = 0;
        this.stateMachine.transition(PlayerState.JUMP);
        this.wasGrounded = onGround;
        return;
      }
    }

    // Track fall start
    if (!onGround && this.wasGrounded) {
      this.fallStartY = this.player.y;
    }
    this.wasGrounded = onGround;

    // --- Glide handling ---
    const glideHeld = this.glideKey.isDown;
    if (
      !onGround &&
      glideHeld &&
      body.velocity.y > 0 &&
      this.abilitySystem.isUnlocked(AbilityId.GLIDE) &&
      this.stateMachine.currentState !== PlayerState.DASH
    ) {
      if (!this.isGliding) {
        this.isGliding = true;
        this.stateMachine.transition(PlayerState.GLIDE);
      }
    } else if (this.isGliding) {
      this.isGliding = false;
      body.setGravityY(0);
      if (!onGround) {
        this.stateMachine.transition(PlayerState.FALL);
      }
    }

    // --- Wall slide detection ---
    const touchingWall = body.blocked.left || body.blocked.right;
    if (!onGround && touchingWall && body.velocity.y > 0 && !this.isGliding &&
        this.stateMachine.currentState !== PlayerState.DASH) {
      this.wallSlideDir = body.blocked.left ? -1 : 1;
      if (this.stateMachine.currentState !== PlayerState.WALL_SLIDE) {
        this.stateMachine.transition(PlayerState.WALL_SLIDE);
      }
    } else if (this.stateMachine.currentState === PlayerState.WALL_SLIDE) {
      this.wallSlideDir = 0;
      if (onGround) {
        this.stateMachine.transition(PlayerState.IDLE);
      } else {
        this.stateMachine.transition(PlayerState.FALL);
      }
    }

    // --- State transitions based on physics ---
    const currentState = this.stateMachine.currentState;
    if (currentState === PlayerState.HURT) return;

    // --- Heavy Form toggle (H key) ---
    if (Phaser.Input.Keyboard.JustDown(this.heavyFormKey) && this.abilitySystem.isUnlocked(AbilityId.HEAVY_FORM)) {
      if (this.heavyFormActive) {
        this.heavyFormActive = false;
        const ability = this.abilitySystem.getAbility(AbilityId.HEAVY_FORM);
        ability?.onDeactivate(this.player);
        this.scene.events.emit('heavy-form-deactivated');
      } else {
        this.heavyFormActive = true;
        const ability = this.abilitySystem.getAbility(AbilityId.HEAVY_FORM);
        ability?.onActivate(this.player);
        this.scene.events.emit('heavy-form-activated');
      }
    }

    // --- Spirit Vision toggle (V key) ---
    if (Phaser.Input.Keyboard.JustDown(this.spiritVisionKey) && this.abilitySystem.isUnlocked(AbilityId.SPIRIT_VISION)) {
      if (this.spiritVisionActive) {
        this.spiritVisionActive = false;
        this.scene.events.emit('spirit-vision-deactivated');
      } else {
        this.spiritVisionActive = true;
        this.scene.events.emit('spirit-vision-activated');
      }
    }

    // --- Wind force (reduced by Heavy Form) ---
    if (this.windVelocity !== 0) {
      const windFactor = this.heavyFormActive ? 0.2 : 1.0;
      body.velocity.x += this.windVelocity * windFactor * (delta / 1000);
    }

    // --- Footstep SFX ---
    if (onGround && this.isMovingHorizontally()) {
      this.footstepTimer += delta;
      if (this.footstepTimer >= this.FOOTSTEP_INTERVAL) {
        this.footstepTimer = 0;
        this.scene.events.emit('play-sfx', 'sfx-land', 0.1);
      }
    } else {
      this.footstepTimer = 0;
    }
    if (currentState === PlayerState.ATTACK || currentState === PlayerState.BLAST) {
      // Attack/blast states run their own timers; don't override
      this.stateMachine.update(delta);
      this.updateAnimation();
      return;
    }
    if (currentState !== PlayerState.DASH && currentState !== PlayerState.GLIDE) {
      if (onGround) {
        const moving = this.isMovingHorizontally();
        if (moving) {
          this.stateMachine.transition(PlayerState.RUN);
        } else {
          this.stateMachine.transition(PlayerState.IDLE);
        }
      } else {
        if (body.velocity.y > 0) {
          this.stateMachine.transition(PlayerState.FALL);
        } else if (currentState !== PlayerState.JUMP) {
          this.stateMachine.transition(PlayerState.FALL);
        }
      }
    }

    this.stateMachine.update(delta);
    this.updateAnimation();
    this.updateLightPosition();
  }

  getPlayer(): Phaser.Physics.Arcade.Sprite {
    return this.player;
  }

  private updateLightPosition(): void {
    if (this.lightGlow && this.player) {
      this.lightGlow.setPosition(this.player.x, this.player.y - 16);
    }
  }

  private createAnimations(): void {
    if (this.animationsCreated) return;
    this.animationsCreated = true;

    const defs = Object.values(PLAYER_ANIMS);
    for (const def of defs) {
      if (this.scene.anims.exists(def.key)) continue;
      this.scene.anims.create({
        key: def.key,
        frames: this.scene.anims.generateFrameNumbers(ASSET_KEYS.PLAYER, {
          frames: [...def.frames],
        }),
        frameRate: def.frameRate,
        repeat: def.repeat,
      });
    }
  }

  private playAnim(key: string): void {
    if (this.player.anims.currentAnim?.key !== key) {
      this.player.anims.play(key, true);
    }
  }

  private updateAnimation(): void {
    const state = this.stateMachine.currentState;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    switch (state) {
      case PlayerState.IDLE:
        this.playAnim(PLAYER_ANIMS.IDLE.key);
        break;
      case PlayerState.RUN:
        this.playAnim(PLAYER_ANIMS.WALK.key);
        break;
      case PlayerState.JUMP:
      case PlayerState.FALL:
      case PlayerState.GLIDE:
      case PlayerState.WALL_SLIDE:
        this.playAnim(PLAYER_ANIMS.AIR.key);
        break;
      case PlayerState.DASH:
        this.playAnim(PLAYER_ANIMS.ATTACK.key);
        break;
      case PlayerState.ATTACK:
        if (this.comboStep === 2) {
          this.playAnim(PLAYER_ANIMS.ATTACK2.key);
        } else {
          this.playAnim(PLAYER_ANIMS.ATTACK.key);
        }
        break;
      case PlayerState.BLAST:
        this.playAnim(PLAYER_ANIMS.BLAST.key);
        break;
      case PlayerState.HURT:
        this.playAnim(PLAYER_ANIMS.HURT.key);
        break;
    }
  }

  /** Squash effect on landing */
  private squash(): void {
    const base = PLAYER_SHEET.SCALE;
    this.scene.tweens.add({
      targets: this.player,
      scaleX: base * 1.3,
      scaleY: base * 0.7,
      duration: 60,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.player.setScale(base);
      },
    });
  }

  /** Stretch effect during jump */
  private stretch(): void {
    const base = PLAYER_SHEET.SCALE;
    this.scene.tweens.add({
      targets: this.player,
      scaleX: base * 0.8,
      scaleY: base * 1.25,
      duration: 100,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.player.setScale(base);
      },
    });
  }

  private canJump(): boolean {
    return this.coyoteTimer > 0;
  }

  private setupStates(): void {
    this.stateMachine
      .addState(PlayerState.IDLE, {
        update: () => this.handleMovement(),
      })
      .addState(PlayerState.RUN, {
        update: () => this.handleMovement(),
      })
      .addState(PlayerState.JUMP, {
        enter: () => {
          const body = this.player.body as Phaser.Physics.Arcade.Body;
          body.setVelocityY(PHYSICS.PLAYER_JUMP_VELOCITY * this.regionJumpMultiplier);
          this.coyoteTimer = 0;
          this.stretch();
          this.scene.events.emit('player-jump');
        },
        update: () => this.handleAirMovement(),
      })
      .addState(PlayerState.FALL, {
        update: () => this.handleAirMovement(),
      })
      .addState(PlayerState.GLIDE, {
        enter: () => {
          const body = this.player.body as Phaser.Physics.Arcade.Body;
          body.setGravityY(-PHYSICS.GRAVITY + PHYSICS.PLAYER_GLIDE_GRAVITY);
          body.setVelocityY(Math.min(body.velocity.y, 40));
          this.scene.events.emit('play-sfx', 'sfx-land', 0.08);
        },
        update: () => {
          this.handleAirMovement();
          this.scene.events.emit('player-glide-trail', this.player.x, this.player.y);
        },
        exit: () => {
          const body = this.player.body as Phaser.Physics.Arcade.Body;
          body.setGravityY(0);
        },
      })
      .addState(PlayerState.WALL_SLIDE, {
        enter: () => {
          const body = this.player.body as Phaser.Physics.Arcade.Body;
          body.setGravityY(-PHYSICS.GRAVITY + PHYSICS.WALL_SLIDE_GRAVITY);
          body.setVelocityY(Math.min(body.velocity.y, PHYSICS.WALL_SLIDE_GRAVITY));
          // Face away from wall
          this.player.setFlipX(this.wallSlideDir < 0 ? false : true);
          this.scene.events.emit('player-wall-slide', this.player.x, this.player.y, this.wallSlideDir);
        },
        update: () => {
          const body = this.player.body as Phaser.Physics.Arcade.Body;
          // Cap slide speed
          if (body.velocity.y > PHYSICS.WALL_SLIDE_GRAVITY) {
            body.setVelocityY(PHYSICS.WALL_SLIDE_GRAVITY);
          }
          // Wall slide particle trail
          this.scene.events.emit('player-wall-slide-trail', this.player.x, this.player.y);
          // Wall jump
          if (this.jumpBufferTimer > 0 && !this.suppressJump) {
            this.jumpBufferTimer = 0;
            body.setGravityY(0);
            body.setVelocityX(-this.wallSlideDir * PHYSICS.WALL_JUMP_VELOCITY_X);
            body.setVelocityY(PHYSICS.WALL_JUMP_VELOCITY_Y);
            this.player.setFlipX(this.wallSlideDir > 0 ? false : true);
            this.wallSlideDir = 0;
            this.stretch();
            this.coyoteTimer = 0;
            this.scene.events.emit('player-wall-jump', this.player.x, this.player.y);
            this.stateMachine.transition(PlayerState.JUMP);
          }
        },
        exit: () => {
          const body = this.player.body as Phaser.Physics.Arcade.Body;
          body.setGravityY(0);
        },
      })
      .addState(PlayerState.HURT, {
        enter: () => {
          this.inputLocked = true;
          this.scene.time.delayedCall(COMBAT.HURT_DURATION, () => {
            this.inputLocked = false;
            const body = this.player.body as Phaser.Physics.Arcade.Body;
            if (body.blocked.down) {
              this.stateMachine.transition(PlayerState.IDLE);
            } else {
              this.stateMachine.transition(PlayerState.FALL);
            }
          });
        },
      })
      .addState(PlayerState.DASH, {
        enter: () => {
          this.dashTimer = PHYSICS.PLAYER_DASH_DURATION;
          this.dashCooldown = PHYSICS.PLAYER_DASH_COOLDOWN;
          const body = this.player.body as Phaser.Physics.Arcade.Body;
          body.setMaxVelocity(PHYSICS.PLAYER_DASH_VELOCITY, 600);
          const dir = this.player.flipX ? -1 : 1;
          body.setVelocityX(PHYSICS.PLAYER_DASH_VELOCITY * dir);
          body.setAllowGravity(false);
          body.setVelocityY(0);
          this.scene.events.emit('player-dash', this.player.x, this.player.y);
          this.scene.events.emit('dash-cooldown-start', PHYSICS.PLAYER_DASH_COOLDOWN);
        },
        update: (delta: number) => {
          this.dashTimer -= delta;
          // Emit dash trail particles
          this.scene.events.emit('player-dash-trail', this.player.x, this.player.y);
          if (this.dashTimer <= 0) {
            const body = this.player.body as Phaser.Physics.Arcade.Body;
            body.setAllowGravity(true);
            this.stateMachine.transition(PlayerState.FALL);
          }
        },
        exit: () => {
          const body = this.player.body as Phaser.Physics.Arcade.Body;
          body.setAllowGravity(true);
          body.setMaxVelocity(PHYSICS.PLAYER_SPEED, 600);
        },
      })
      .addState(PlayerState.ATTACK, {
        enter: () => {
          this.attackTimer = COMBAT.ATTACK_DURATION;
          this.attackCooldown = COMBAT.ATTACK_COOLDOWN;

          // Advance combo
          if (this.comboStep === 0 || this.comboStep === 2) {
            this.comboStep = 1;
          } else {
            this.comboStep = 2;
          }
          this.comboWindow = COMBAT.ATTACK_COMBO_WINDOW;

          // Slight forward push
          const body = this.player.body as Phaser.Physics.Arcade.Body;
          const dir = this.player.flipX ? -1 : 1;
          body.setVelocityX(dir * 80);

          // Force animation restart for combo feedback
          const animKey = this.comboStep === 2 ? PLAYER_ANIMS.ATTACK2.key : PLAYER_ANIMS.ATTACK.key;
          this.player.anims.play(animKey, true);

          this.scene.events.emit('player-attack', this.player.x, this.player.y, dir, this.comboStep);
        },
        update: (delta: number) => {
          this.attackTimer -= delta;
          // Allow horizontal input during attack
          const body = this.player.body as Phaser.Physics.Arcade.Body;
          const left = this.cursors.left?.isDown || this.wasd.A.isDown;
          const right = this.cursors.right?.isDown || this.wasd.D.isDown;
          if (left) this.player.setFlipX(true);
          else if (right) this.player.setFlipX(false);

          if (this.attackTimer <= 0) {
            const onGround = body.blocked.down;
            if (onGround) {
              this.stateMachine.transition(PlayerState.IDLE);
            } else {
              this.stateMachine.transition(PlayerState.FALL);
            }
          }
        },
      })
      .addState(PlayerState.BLAST, {
        enter: () => {
          this.blastCooldown = COMBAT.BLAST_COOLDOWN;
          const dir = this.player.flipX ? -1 : 1;
          this.player.anims.play(PLAYER_ANIMS.BLAST.key, true);

          // Brief recoil
          const body = this.player.body as Phaser.Physics.Arcade.Body;
          body.setVelocityX(-dir * 60);

          this.scene.events.emit('player-blast', this.player.x, this.player.y, dir);

          // Transition back after animation
          this.scene.time.delayedCall(COMBAT.BLAST_COOLDOWN * 0.5, () => {
            if (this.stateMachine.currentState !== PlayerState.BLAST) return;
            const onGround = (this.player.body as Phaser.Physics.Arcade.Body).blocked.down;
            if (onGround) {
              this.stateMachine.transition(PlayerState.IDLE);
            } else {
              this.stateMachine.transition(PlayerState.FALL);
            }
          });
        },
      });
  }

  private handleMovement(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const left = this.cursors.left?.isDown || this.wasd.A.isDown;
    const right = this.cursors.right?.isDown || this.wasd.D.isDown;
    const dashPressed = Phaser.Input.Keyboard.JustDown(this.dashKey);
    const attackPressed = Phaser.Input.Keyboard.JustDown(this.attackKey);
    const blastPressed = Phaser.Input.Keyboard.JustDown(this.blastKey);

    // Apply region speed modifier to max velocity
    const effectiveMaxSpeed = this.baseMaxSpeed * this.regionSpeedMultiplier;
    body.setMaxVelocity(effectiveMaxSpeed, 600);
    const accel = PHYSICS.ACCELERATION * this.regionSpeedMultiplier;

    if (left) {
      body.setAccelerationX(-accel);
      this.player.setFlipX(true);
    } else if (right) {
      body.setAccelerationX(accel);
      this.player.setFlipX(false);
    } else {
      body.setAccelerationX(0);
      body.setVelocityX(body.velocity.x * 0.85);
    }

    // Jump with coyote time support
    if (this.jumpBufferTimer > 0 && this.canJump() && !this.suppressJump) {
      this.jumpBufferTimer = 0;
      this.stateMachine.transition(PlayerState.JUMP);
    }

    if (dashPressed && this.abilitySystem.isUnlocked(AbilityId.DASH) && this.dashCooldown <= 0) {
      this.stateMachine.transition(PlayerState.DASH);
    }

    // Attack (J key)
    if (attackPressed && this.attackCooldown <= 0) {
      this.stateMachine.transition(PlayerState.ATTACK);
    }

    // Blast (K key)
    if (blastPressed && this.blastCooldown <= 0) {
      this.scene.events.emit('player-blast-request');
    }
  }

  private handleAirMovement(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const left = this.cursors.left?.isDown || this.wasd.A.isDown;
    const right = this.cursors.right?.isDown || this.wasd.D.isDown;
    const dashPressed = Phaser.Input.Keyboard.JustDown(this.dashKey);
    const attackPressed = Phaser.Input.Keyboard.JustDown(this.attackKey);
    const blastPressed = Phaser.Input.Keyboard.JustDown(this.blastKey);

    const airAccel = PHYSICS.ACCELERATION * PHYSICS.AIR_CONTROL * this.regionSpeedMultiplier;
    if (left) {
      body.setAccelerationX(-airAccel);
      this.player.setFlipX(true);
    } else if (right) {
      body.setAccelerationX(airAccel);
      this.player.setFlipX(false);
    } else {
      body.setAccelerationX(0);
      body.setVelocityX(body.velocity.x * 0.95);
    }

    // Coyote jump — can still jump briefly after walking off a ledge
    if (this.jumpBufferTimer > 0 && this.canJump() && !this.suppressJump) {
      this.jumpBufferTimer = 0;
      this.stateMachine.transition(PlayerState.JUMP);
    }

    if (dashPressed && this.abilitySystem.isUnlocked(AbilityId.DASH) && this.dashCooldown <= 0) {
      this.stateMachine.transition(PlayerState.DASH);
    }

    // Attack (J key) — air attack
    if (attackPressed && this.attackCooldown <= 0) {
      this.stateMachine.transition(PlayerState.ATTACK);
    }

    // Blast (K key) — air blast
    if (blastPressed && this.blastCooldown <= 0) {
      this.scene.events.emit('player-blast-request');
    }
  }

  private isMovingHorizontally(): boolean {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    return Math.abs(body.velocity.x) > 10;
  }
}
