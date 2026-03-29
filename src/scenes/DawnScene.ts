import Phaser from 'phaser';
import { ASSET_KEYS, DAWN_PARALLAX_LAYERS, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { PlayerSystem } from '../systems/PlayerSystem';
import { CameraSystem } from '../systems/CameraSystem';
import { ParallaxSystem } from '../systems/ParallaxSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { AbilitySystem } from '../systems/AbilitySystem';
import { AudioSystem } from '../systems/AudioSystem';
import { createPlatforms } from '../entities/Platform';
import { AbilityId } from '../types';
import { JumpAbility } from '../abilities/JumpAbility';
import { DashAbility } from '../abilities/DashAbility';
import { GlideAbility } from '../abilities/GlideAbility';
import { EndingStats } from '../ui/EndingOverlay';

const WORLD_WIDTH = 3840;
const WORLD_HEIGHT = 720;

export class DawnScene extends Phaser.Scene {
  private playerSystem!: PlayerSystem;
  private cameraSystem!: CameraSystem;
  private parallaxSystem!: ParallaxSystem;
  private particleSystem!: ParticleSystem;
  private abilitySystem!: AbilitySystem;
  private audioSystem!: AudioSystem;
  private debugMode = false;
  private door!: Phaser.GameObjects.Container;
  private doorZone!: Phaser.GameObjects.Zone;
  private doorPrompt!: Phaser.GameObjects.Text;
  private playerNearDoor = false;
  private incomingStats: EndingStats | null = null;

  constructor() {
    super({ key: 'DawnScene' });
  }

  create(data?: { stats?: EndingStats }): void {
    this.incomingStats = data?.stats ?? null;
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // --- Systems ---
    this.abilitySystem = new AbilitySystem();
    this.abilitySystem.register(new JumpAbility());
    this.abilitySystem.register(new DashAbility());
    this.abilitySystem.register(new GlideAbility());
    this.abilitySystem.unlock(AbilityId.JUMP);
    this.abilitySystem.unlock(AbilityId.DASH);
    this.abilitySystem.unlock(AbilityId.GLIDE);

    this.parallaxSystem = new ParallaxSystem(this, DAWN_PARALLAX_LAYERS);
    this.parallaxSystem.create();

    this.particleSystem = new ParticleSystem(this);
    this.particleSystem.create();

    this.audioSystem = new AudioSystem(this);
    this.audioSystem.create();

    // --- Platforms ---
    const platforms = createPlatforms(this, ASSET_KEYS.PLATFORM, [
      // Ground floor
      { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT - 16, scaleX: 30, scaleY: 1 },

      // Stepping-stone platforms
      { x: 400, y: 570 },
      { x: 650, y: 480 },
      { x: 950, y: 550 },
      { x: 1250, y: 440 },
      { x: 1550, y: 520 },
      { x: 1800, y: 400 },
      { x: 2100, y: 500 },
      { x: 2400, y: 420 },
      { x: 2700, y: 530 },
      { x: 3000, y: 450 },
      { x: 3300, y: 380 },
      { x: 3600, y: 500 },
    ]);

    // --- Player ---
    this.playerSystem = new PlayerSystem(this, this.abilitySystem);
    const player = this.playerSystem.create(100, WORLD_HEIGHT - 100);

    // --- Collisions ---
    this.physics.add.collider(player, platforms);

    // --- Camera ---
    this.cameraSystem = new CameraSystem(this);
    this.cameraSystem.setTarget(player);
    this.cameraSystem.setBounds(WORLD_WIDTH, WORLD_HEIGHT);

    // --- Events ---
    this.events.on('player-land', (x: number, y: number, shakeIntensity: number) => {
      this.particleSystem.emitDust(x, y, 1 + shakeIntensity * 200);
      if (shakeIntensity > 0.002) {
        this.cameraSystem.shake(shakeIntensity, 80);
      }
      this.audioSystem.playSFX('sfx-land', 0.25);
    });

    this.events.on('player-jump', () => {
      this.audioSystem.playSFX('sfx-jump', 0.3);
    });

    this.events.on('player-dash', () => {
      this.cameraSystem.shake(0.003, 60);
      this.cameraSystem.zoomPulse(0.015, 150);
      this.audioSystem.playSFX('sfx-dash', 0.3);
    });

    this.events.on('player-dash-trail', (x: number, y: number) => {
      this.particleSystem.emitDashTrail(x, y);
    });

    // --- Audio ---
    this.audioSystem.playTrack(ASSET_KEYS.MUSIC_DAWN);

    // --- Debug toggle (F12) ---
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F12).on('down', () => {
      this.debugMode = !this.debugMode;
      this.physics.world.drawDebug = this.debugMode;
      if (!this.debugMode) {
        this.physics.world.debugGraphic?.clear();
      }
    });

    // --- Door back to Scene 1 (far left of world) ---
    this.createDoor(80, WORLD_HEIGHT - 32, player);

    // --- Region name ---
    const regionText = this.add.text(this.scale.width / 2, 40, 'Crimson Dawn', {
      fontSize: '22px',
      fontFamily: 'Georgia, serif',
      color: '#ffaaaa',
    });
    regionText.setOrigin(0.5);
    regionText.setAlpha(0);
    regionText.setScrollFactor(0);
    regionText.setDepth(100);

    this.tweens.add({
      targets: regionText,
      alpha: 0.7,
      duration: 1500,
      ease: 'Sine.easeIn',
      hold: 2000,
      yoyo: true,
    });

    // Fade in
    this.cameras.main.fadeIn(1000, 10, 10, 26);

    // Intro camera pan: start from offset, pan to player
    const cam = this.cameras.main;
    cam.setScroll(player.x + 400, cam.scrollY);
    this.tweens.add({
      targets: cam,
      scrollX: player.x - GAME_WIDTH / 2,
      duration: 2000,
      ease: 'Sine.easeInOut',
    });

    // Player idle breathing animation
    this.tweens.add({
      targets: player,
      scaleY: { from: 1.0, to: 1.02 },
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Show stats banner if arriving from boss victory
    if (this.incomingStats) {
      this.showStatsBanner(this.incomingStats);
    }
  }

  private getRank(timeSec: number): { letter: string; color: string } {
    if (timeSec < 180) return { letter: 'S', color: '#ffd866' };
    if (timeSec < 360) return { letter: 'A', color: '#88ddff' };
    if (timeSec < 600) return { letter: 'B', color: '#aaddaa' };
    return { letter: 'C', color: '#ccaaaa' };
  }

  private showStatsBanner(stats: EndingStats): void {
    const rank = this.getRank(stats.timeSec);
    const mins = Math.floor(stats.timeSec / 60);
    const secs = Math.floor(stats.timeSec % 60);
    const timeStr = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;

    const bg = this.add.rectangle(GAME_WIDTH / 2, 60, 340, 100, 0x050d1e, 0.75);
    bg.setScrollFactor(0).setDepth(200);
    bg.setStrokeStyle(1, 0xffffff, 0.1);

    const rankLabel = this.add.text(GAME_WIDTH / 2, 30, `Rank: ${rank.letter}`, {
      fontFamily: 'Georgia, serif',
      fontSize: '26px',
      color: rank.color,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    const statsLabel = this.add.text(GAME_WIDTH / 2, 60, `Time: ${timeStr}  ·  Fragments: ${stats.fragments}/${stats.fragmentsTotal}`, {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#c0c8d0',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    const killLine = stats.kills !== undefined ? `Kills: ${stats.kills}` : '';
    const bossLine = stats.bossDefeated ? '  ·  Boss: Defeated' : '';
    const extra = this.add.text(GAME_WIDTH / 2, 82, killLine + bossLine, {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#a0a8b0',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    // Staggered reveals
    const items = [bg, rankLabel, statsLabel, extra];
    items.forEach(obj => obj.setAlpha(0));
    items.forEach((obj, i) => {
      this.tweens.add({
        targets: obj,
        alpha: 1,
        duration: 600,
        delay: 1500 + i * 400,
        ease: 'Sine.easeIn',
      });
    });

    // Fade out all together after display
    this.time.delayedCall(1500 + items.length * 400 + 5000, () => {
      this.tweens.add({
        targets: items,
        alpha: 0,
        duration: 1000,
        ease: 'Sine.easeOut',
      });
    });
  }

  update(_time: number, delta: number): void {
    // Suppress jump when near door so Up/W only enters the door
    this.playerSystem.suppressJump = this.playerNearDoor;

    this.playerSystem.update(delta);
    this.cameraSystem.update();
    this.parallaxSystem.update();

    // Door interaction — press Up/W near the door
    if (this.playerNearDoor) {
      const up = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      if (this.input.keyboard?.checkDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP)) ||
          (up && this.input.keyboard?.checkDown(up))) {
        this.enterDoor();
      }
    }
  }

  private createDoor(x: number, y: number, player: Phaser.Physics.Arcade.Sprite): void {
    const doorGfx = this.add.graphics();
    doorGfx.fillStyle(0x442233, 1);
    doorGfx.fillRect(-24, -80, 48, 80);
    doorGfx.fillStyle(0x553344, 1);
    doorGfx.fillEllipse(0, -80, 52, 24);
    doorGfx.fillStyle(0xffeedd, 0.3);
    doorGfx.fillRect(-16, -70, 32, 70);
    doorGfx.fillStyle(0xffeecc, 0.5);
    doorGfx.fillRect(-8, -60, 16, 60);

    this.door = this.add.container(x, y, [doorGfx]);
    this.door.setDepth(5);

    this.tweens.add({
      targets: doorGfx,
      alpha: { from: 0.8, to: 1 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.doorPrompt = this.add.text(x, y - 100, '▲ Enter', {
      fontSize: '16px',
      color: '#ffeedd',
      fontFamily: 'monospace',
    });
    this.doorPrompt.setOrigin(0.5, 1);
    this.doorPrompt.setDepth(15);
    this.doorPrompt.setAlpha(0);

    this.doorZone = this.add.zone(x, y - 40, 64, 80);
    this.physics.add.existing(this.doorZone, true);

    this.physics.add.overlap(player, this.doorZone, () => {
      if (!this.playerNearDoor) {
        this.playerNearDoor = true;
        this.tweens.add({ targets: this.doorPrompt, alpha: 1, duration: 200 });
      }
    });

    this.events.on('update', () => {
      if (this.playerNearDoor && this.doorZone) {
        const dist = Phaser.Math.Distance.Between(
          player.x, player.y,
          this.doorZone.x, this.doorZone.y
        );
        if (dist > 60) {
          this.playerNearDoor = false;
          this.tweens.add({ targets: this.doorPrompt, alpha: 0, duration: 200 });
        }
      }
    });
  }

  private enterDoor(): void {
    this.playerNearDoor = false;
    this.audioSystem.stopTrack();
    this.cameras.main.fadeOut(800, 10, 10, 26);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }
}
