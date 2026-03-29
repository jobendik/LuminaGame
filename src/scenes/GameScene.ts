import Phaser from 'phaser';
import { ASSET_KEYS, GAME_HEIGHT, GAME_WIDTH, QUEST, COMBAT } from '../config';
import { PlayerSystem } from '../systems/PlayerSystem';
import { CameraSystem } from '../systems/CameraSystem';
import { ParallaxSystem } from '../systems/ParallaxSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { AbilitySystem } from '../systems/AbilitySystem';
import { ColorSystem } from '../systems/ColorSystem';
import { AudioSystem } from '../systems/AudioSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { CheckpointSystem } from '../systems/CheckpointSystem';
import { DialogueSystem } from '../systems/DialogueSystem';
import { QuestSystem } from '../systems/QuestSystem';
import { BossSystem } from '../systems/BossSystem';
import { StormSystem } from '../systems/StormSystem';
import { createPlatforms } from '../entities/Platform';
import { MemoryFragment } from '../entities/MemoryFragment';
import { Enemy, WraithConfig } from '../entities/Enemy';
import { Crawler, CrawlerConfig } from '../entities/Crawler';
import { NPC } from '../entities/NPC';
import { Beacon, BeaconConfig } from '../entities/Beacon';
import { RestBench, BenchConfig } from '../entities/RestBench';
import { BossDoor, BossDoorConfig } from '../entities/BossDoor';
import { NPC_CONFIGS } from '../data/characters';
import { ToastSystem } from '../ui/ToastSystem';
import { PauseMenu } from '../ui/PauseMenu';
import { IntroOverlay } from '../ui/IntroOverlay';
import { EndingOverlay } from '../ui/EndingOverlay';
import { AbilityId } from '../types';
import { JumpAbility } from '../abilities/JumpAbility';
import { DashAbility } from '../abilities/DashAbility';
import { GlideAbility } from '../abilities/GlideAbility';
import { HeavyFormAbility } from '../abilities/HeavyFormAbility';
import { SpiritVisionAbility } from '../abilities/SpiritVisionAbility';
import { Blast } from '../entities/Blast';
import { Meteor, spawnMeteors } from '../entities/Meteor';
import { MovingPlatform, MovingPlatformConfig } from '../entities/MovingPlatform';
import { WindZone, WindZoneConfig } from '../entities/WindZone';
import { HiddenPlatform, HiddenPlatformConfig } from '../entities/HiddenPlatform';
import { Trigger } from '../entities/Trigger';
import { REGIONS } from '../data/regions';
import { SaveSystem, SaveData } from '../systems/SaveSystem';

const WORLD_WIDTH = 3840;
const WORLD_HEIGHT = 720;
const REGION_COUNT = REGIONS.length;
const REGION_WIDTH = WORLD_WIDTH / REGION_COUNT;

export class GameScene extends Phaser.Scene {
  private playerSystem!: PlayerSystem;
  private cameraSystem!: CameraSystem;
  private parallaxSystem!: ParallaxSystem;
  private particleSystem!: ParticleSystem;
  private abilitySystem!: AbilitySystem;
  private colorSystem!: ColorSystem;
  private audioSystem!: AudioSystem;
  private fragments: MemoryFragment[] = [];
  private collectedCount = 0;
  private debugMode = false;
  private door!: Phaser.GameObjects.Container;
  private doorZone!: Phaser.GameObjects.Zone;
  private doorPrompt!: Phaser.GameObjects.Text;
  private playerNearDoor = false;
  private combatSystem!: CombatSystem;
  private checkpointSystem!: CheckpointSystem;
  private hazards!: Phaser.Physics.Arcade.StaticGroup;
  private wraiths: Enemy[] = [];
  private crawlers: Crawler[] = [];
  private dialogueSystem!: DialogueSystem;
  private questSystem!: QuestSystem;
  private toastSystem!: ToastSystem;
  private npcs: NPC[] = [];
  private nearestNpc: NPC | null = null;
  private beacons: Beacon[] = [];
  private benches: RestBench[] = [];
  private bossDoor!: BossDoor;
  private eKey!: Phaser.Input.Keyboard.Key;
  private eHoldTime = 0;
  private pauseMenu!: PauseMenu;
  private escKey!: Phaser.Input.Keyboard.Key;
  private pKey!: Phaser.Input.Keyboard.Key;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private tabKey!: Phaser.Input.Keyboard.Key;
  private bossSystem!: BossSystem;
  private stormSystem!: StormSystem;
  private introOverlay!: IntroOverlay;
  private endingOverlay!: EndingOverlay;
  private endingSeen = false;
  private startTime = 0;
  private blasts!: Phaser.Physics.Arcade.Group;
  private meteors!: Phaser.Physics.Arcade.Group;
  private movingPlatforms: MovingPlatform[] = [];
  private windZones: WindZone[] = [];
  private hiddenPlatforms: HiddenPlatform[] = [];
  private triggers: Trigger[] = [];
  private waterZones: Phaser.GameObjects.Zone[] = [];
  private playerInWater = false;
  private currentRegionIndex = -1;
  private introPanning = false;
  private spiritVisionActive = false;
  private spiritVignette: Phaser.GameObjects.Graphics | null = null;
  private spiritModeLabel: Phaser.GameObjects.Text | null = null;
  private holdProgressRing: Phaser.GameObjects.Graphics | null = null;
  private benchHoldRing: Phaser.GameObjects.Graphics | null = null;
  private mKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // --- Systems ---
    this.abilitySystem = new AbilitySystem();
    this.abilitySystem.register(new JumpAbility());
    this.abilitySystem.register(new DashAbility());
    this.abilitySystem.register(new GlideAbility());
    this.abilitySystem.register(new HeavyFormAbility());
    this.abilitySystem.register(new SpiritVisionAbility());
    this.abilitySystem.unlock(AbilityId.JUMP);
    // Dash, Glide, Heavy Form, Spirit Vision unlock via fragment collection

    this.parallaxSystem = new ParallaxSystem(this);
    this.parallaxSystem.create();

    this.particleSystem = new ParticleSystem(this);
    this.particleSystem.create();

    this.colorSystem = new ColorSystem(this);
    this.colorSystem.create();
    // Set initial background to first region palette
    this.cameras.main.setBackgroundColor(REGIONS[0].palette.background);

    this.audioSystem = new AudioSystem(this);
    this.audioSystem.create();

    // --- Platforms ---
    const platforms = createPlatforms(this, ASSET_KEYS.PLATFORM, [
      // Ground floor
      { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT - 16, scaleX: 30, scaleY: 1 },

      // Section 1 → fragment 1 (x:500, y:470)
      { x: 350, y: 570 },
      { x: 550, y: 470 },

      // Section 2 → fragment 2 (x:850, y:390)
      { x: 750, y: 540 },
      { x: 900, y: 410 },

      // Section 3 → fragment 3 (x:1450, y:370)
      { x: 1200, y: 560 },
      { x: 1350, y: 430 },
      { x: 1500, y: 370 },

      // Section 4 → fragment 4 (x:2050, y:330)
      { x: 1850, y: 550 },
      { x: 1970, y: 420 },
      { x: 2100, y: 340 },

      // Section 5 → fragment 5 (x:2650, y:300)
      { x: 2400, y: 560 },
      { x: 2530, y: 430 },
      { x: 2660, y: 320 },

      // Section 6 → fragment 6 (x:3250, y:410)
      { x: 3100, y: 550 },
      { x: 3250, y: 420 },
    ]);

    // --- Moving Platforms ---
    const movingPlatConfigs: MovingPlatformConfig[] = [
      // Horizontal oscillating — shortcuts between sections
      { x: 1050, y: 480, type: 'oscillating', axis: 'horizontal', distance: 160, speed: 50 },
      { x: 2250, y: 460, type: 'oscillating', axis: 'horizontal', distance: 140, speed: 55 },
      // Vertical oscillating — reach high fragments
      { x: 1680, y: 420, type: 'oscillating', axis: 'vertical', distance: 120, speed: 40 },
      { x: 2900, y: 400, type: 'oscillating', axis: 'vertical', distance: 100, speed: 45 },
      // Crumbling — risk/reward
      { x: 1100, y: 380, type: 'crumbling' },
      { x: 2050, y: 360, type: 'crumbling' },
      { x: 2800, y: 350, type: 'crumbling' },
    ];
    this.movingPlatforms = movingPlatConfigs.map((cfg) => new MovingPlatform(this, cfg));

    // --- Wind Zones ---
    const windConfigs: WindZoneConfig[] = [
      { x: 1400, y: WORLD_HEIGHT - 200, width: 250, height: 400, strength: 300 },
      { x: 2600, y: WORLD_HEIGHT - 200, width: 200, height: 400, strength: -350 },
      { x: 3200, y: WORLD_HEIGHT - 250, width: 180, height: 500, strength: 280 },
    ];
    this.windZones = windConfigs.map((cfg) => new WindZone(this, cfg));

    // --- Hidden Platforms (Spirit Vision reveals) ---
    const hiddenPlatConfigs: HiddenPlatformConfig[] = [
      { x: 950, y: 340 },
      { x: 1550, y: 300 },
      { x: 2350, y: 280 },
      { x: 3050, y: 320 },
    ];
    this.hiddenPlatforms = hiddenPlatConfigs.map((cfg) => new HiddenPlatform(this, cfg));

    // --- Water Pools (Sunken Ruins region) ---
    const waterPoolConfigs = [
      { x: 1700, y: WORLD_HEIGHT - 100, width: 200, height: 200 },
      { x: 2100, y: WORLD_HEIGHT - 120, width: 180, height: 240 },
    ];
    for (const wp of waterPoolConfigs) {
      const zone = this.add.zone(wp.x, wp.y, wp.width, wp.height);
      this.physics.add.existing(zone, true);
      this.waterZones.push(zone);

      // Visual water tint overlay
      const overlay = this.add.rectangle(wp.x, wp.y, wp.width, wp.height, 0x4466aa, 0.12);
      overlay.setDepth(1);
      overlay.setBlendMode(Phaser.BlendModes.SCREEN);

      // Subtle wave animation
      this.tweens.add({
        targets: overlay,
        alpha: { from: 0.08, to: 0.18 },
        yoyo: true,
        repeat: -1,
        duration: 2000,
        ease: 'Sine.easeInOut',
      });
    }

    // --- Region boundary triggers ---
    for (let i = 1; i < REGION_COUNT; i++) {
      const tx = i * REGION_WIDTH;
      const trigger = new Trigger(this, tx, WORLD_HEIGHT / 2, 40, WORLD_HEIGHT, `region-enter-${i}`, false);
      this.triggers.push(trigger);
    }

    // --- Player ---
    this.playerSystem = new PlayerSystem(this, this.abilitySystem);
    const player = this.playerSystem.create(200, WORLD_HEIGHT - 100);

    // --- Memory Fragments ---
    this.createMemoryFragments(player);

    // --- Collisions ---
    this.physics.add.collider(player, platforms);

    // Moving platform collisions
    for (const mp of this.movingPlatforms) {
      this.physics.add.collider(player, mp, () => {
        // Trigger crumbling when player stands on a crumbling platform
        mp.onPlayerStand();
      });
      // Crawlers also collide with moving platforms
    }

    // Wind zone overlaps — set player wind velocity while overlapping
    for (const wz of this.windZones) {
      this.physics.add.overlap(player, wz.getZone(), () => {
        this.playerSystem.windVelocity = wz.strength;
      });
    }

    // Hidden platform collisions (body toggled by spirit vision events)
    for (const hp of this.hiddenPlatforms) {
      this.physics.add.collider(player, hp);
    }

    // Region boundary trigger overlaps
    for (const trigger of this.triggers) {
      this.physics.add.overlap(player, trigger, () => {
        trigger.fire();
      });
    }

    // Water pool overlaps — reduce gravity when inside
    for (const wz of this.waterZones) {
      this.physics.add.overlap(player, wz, () => {
        this.playerInWater = true;
      });
    }

    // --- Camera ---
    this.cameraSystem = new CameraSystem(this);
    this.cameraSystem.setTarget(player);
    this.cameraSystem.setBounds(WORLD_WIDTH, WORLD_HEIGHT);

    // --- Checkpoints ---
    this.checkpointSystem = new CheckpointSystem(this);
    this.checkpointSystem.setPlayer(player);
    this.checkpointSystem.create([
      { x: 200, y: WORLD_HEIGHT - 32, id: 'cp-start' },
      { x: 1200, y: WORLD_HEIGHT - 32, id: 'cp-mid1' },
      { x: 2400, y: WORLD_HEIGHT - 32, id: 'cp-mid2' },
      { x: 3400, y: WORLD_HEIGHT - 32, id: 'cp-end' },
    ]);

    // --- Combat ---
    this.combatSystem = new CombatSystem(
      this,
      () => this.checkpointSystem.getSpawnPoint(),
    );
    this.combatSystem.setPlayer(player);

    // --- Hazards (thorn clusters) ---
    this.hazards = this.physics.add.staticGroup();
    const hazardPositions = [
      { x: 650, y: WORLD_HEIGHT - 24, scaleX: 3 },
      { x: 1700, y: WORLD_HEIGHT - 24, scaleX: 3.5 },
      { x: 2900, y: WORLD_HEIGHT - 24, scaleX: 2.5 },
    ];
    for (const h of hazardPositions) {
      const thorn = this.hazards.create(h.x, h.y, ASSET_KEYS.HAZARD_THORN) as Phaser.Physics.Arcade.Sprite;
      thorn.setScale(h.scaleX, 1);
      thorn.setDepth(2);
      thorn.refreshBody();
    }
    this.physics.add.overlap(player, this.hazards, () => {
      this.combatSystem.damagePlayer(1, player.x, player.y + 10, 'Pierced by thorns');
    });

    // --- Wraith Enemies ---
    const wraithConfigs: WraithConfig[] = [
      { x1: 800, x2: 1100, y: WORLD_HEIGHT - 120, speed: 0.0016, aggroRadius: 260 },
      { x1: 1600, x2: 1900, y: WORLD_HEIGHT - 140, speed: 0.0018, aggroRadius: 300 },
      { x1: 2500, x2: 2850, y: WORLD_HEIGHT - 110, speed: 0.0014, aggroRadius: 340 },
      { x1: 3100, x2: 3400, y: WORLD_HEIGHT - 130, speed: 0.0015, aggroRadius: 280 },
    ];
    this.wraiths = wraithConfigs.map((cfg, i) => {
      const wraith = new Enemy(this, cfg, i);
      wraith.setPlayer(player);
      this.physics.add.overlap(player, wraith, () => {
        this.combatSystem.damagePlayer(1, wraith.x, wraith.y, 'A shadow being strikes you');
      });
      return wraith;
    });

    // Wraith orb projectile overlap wiring
    this.events.on('wraith-orb-spawned', (orb: Phaser.GameObjects.Arc) => {
      this.physics.add.overlap(player, orb, () => {
        if (!orb.active) return;
        this.combatSystem.damagePlayer(1, orb.x, orb.y, 'A shadow orb burns you');
        this.particleSystem.emitEnemyHitBurst(orb.x, orb.y);
        orb.destroy();
      });
    });

    // --- Crawler Enemies (ground patrol) ---
    const crawlerConfigs: CrawlerConfig[] = [
      { x: 500, y: WORLD_HEIGHT - 48, patrolLeft: 400, patrolRight: 700 },
      { x: 1400, y: WORLD_HEIGHT - 48, patrolLeft: 1300, patrolRight: 1600 },
      { x: 2200, y: WORLD_HEIGHT - 48, patrolLeft: 2100, patrolRight: 2450 },
      { x: 3000, y: WORLD_HEIGHT - 48, patrolLeft: 2900, patrolRight: 3200 },
      { x: 3500, y: WORLD_HEIGHT - 48, patrolLeft: 3350, patrolRight: 3650 },
    ];
    this.crawlers = crawlerConfigs.map((cfg) => {
      const crawler = new Crawler(this, cfg);
      crawler.setPlayer(player);
      this.physics.add.collider(crawler, platforms);
      this.physics.add.overlap(player, crawler, () => {
        if (!crawler.isDead) {
          this.combatSystem.damagePlayer(1, crawler.x, crawler.y, 'A crawler bites you');
        }
      });
      return crawler;
    });

    // --- NPCs ---
    this.npcs = NPC_CONFIGS.map((cfg, i) => new NPC(this, cfg, i));

    // --- Dialogue ---
    this.dialogueSystem = new DialogueSystem(this);
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // --- Quest System ---
    this.questSystem = new QuestSystem(this, QUEST.FRAGMENT_TARGET, QUEST.BEACON_TARGET);

    // Context-aware dialogue: NPCs change lines based on player progress
    const eira = this.npcs[0]; // Stardust Librarian
    if (eira) {
      const qs = this.questSystem;
      eira.setGetLines(() => {
        const frags = qs.fragments.current;
        if (frags >= 4) {
          return [
            { speaker: 'Eira', text: 'You carry so many memories now… I can feel their warmth from here.' },
            { speaker: 'Eira', text: 'The abilities within you are nearly all awake. Spirit Vision is the last gift — it reveals what is hidden.' },
            { speaker: 'Eira', text: 'When you are ready, seek Veyra at the portal. The Nightmaw awaits.' },
          ];
        }
        if (frags >= 2) {
          return [
            { speaker: 'Eira', text: 'Two fragments already! You should be able to Glide now — hold Space in the air.' },
            { speaker: 'Eira', text: 'The Echo Forest to the east is strange. Sounds repeat there, echoing off ancient stones.' },
            { speaker: 'Eira', text: 'Keep going. The beacons need your light as well.' },
          ];
        }
        if (frags >= 1) {
          return [
            { speaker: 'Eira', text: 'You found a fragment! Try pressing Shift — the Dash should be yours now.' },
            { speaker: 'Eira', text: 'Each fragment unlocks a new ability. Two will grant you the power to Glide.' },
            { speaker: 'Eira', text: 'Be cautious of the wraiths. They have grown more cunning — some hurl shadow orbs.' },
          ];
        }
        return eira.dialogueLines;
      });
    }

    const milo = this.npcs[1]; // Cartographer
    if (milo) {
      const qs = this.questSystem;
      milo.setGetLines(() => {
        const beacons = qs.beacons.current;
        const kills = qs.kills.current;
        if (beacons >= 2) {
          return [
            { speaker: 'Milo', text: 'Both beacons lit! The world feels brighter already.' },
            { speaker: 'Milo', text: 'My maps show a sealed door in the Core Veil. With enough strength, it should open for you now.' },
            { speaker: 'Milo', text: 'Beyond that door lies the storm — and the Nightmaw.' },
          ];
        }
        if (kills >= 5) {
          return [
            { speaker: 'Milo', text: 'You have vanquished many shadows. The crawlers grow agitated when you draw near — watch for their red glow.' },
            { speaker: 'Milo', text: 'Some paths are built for feet. Others for timing and courage.' },
            { speaker: 'Milo', text: 'Have you tried the Sunken Ruins? The water there slows your fall.' },
          ];
        }
        return milo.dialogueLines;
      });
    }

    const veyra = this.npcs[2]; // Guardian of the Silent Portal
    if (veyra) {
      const qs = this.questSystem;
      veyra.setGetLines(() => {
        if (qs.isComplete) {
          return [
            { speaker: 'Veyra', text: 'The memories stir… the beacons sing… the portal answers at last.' },
            { speaker: 'Veyra', text: 'Step through, Lumina. What was forgotten awaits beyond.' },
          ];
        }
        return [
          { speaker: 'Veyra', text: 'The portal responds only when both memories and light are awakened.' },
          { speaker: 'Veyra', text: `Fragments: ${qs.fragments.current}/${qs.fragments.target}. Beacons: ${qs.beacons.current}/${qs.beacons.target}.` },
          { speaker: 'Veyra', text: 'Collect all the fragments and ignite the beacons. Then the way forward will open.' },
        ];
      });
    }

    // --- Toast System ---
    this.toastSystem = new ToastSystem(this);

    // --- Beacons ---
    const beaconConfigs: BeaconConfig[] = [
      { x: 1100, y: WORLD_HEIGHT - 32, label: 'Western Beacon' },
      { x: 2700, y: WORLD_HEIGHT - 32, label: 'Eastern Beacon' },
    ];
    this.beacons = beaconConfigs.map((cfg, i) => new Beacon(this, cfg, i));

    // --- Rest Benches ---
    const benchConfigs: BenchConfig[] = [
      { x: 600, y: WORLD_HEIGHT - 32 },
      { x: 1800, y: WORLD_HEIGHT - 32 },
      { x: 3100, y: WORLD_HEIGHT - 32 },
    ];
    this.benches = benchConfigs.map((cfg) => new RestBench(this, cfg));

    // --- Boss Door (progression gate) ---
    this.bossDoor = new BossDoor(this, { x: 3400, y: WORLD_HEIGHT - 32, killsRequired: 3 });
    this.physics.add.collider(player, this.bossDoor.getZone());

    // --- Events ---

    // Trigger events (regions, story beats)
    this.events.on('trigger', (triggerId: string) => {
      // Region boundary triggers emit a subtle camera pulse
      if (triggerId.startsWith('region-enter-')) {
        this.cameraSystem.zoomPulse(0.008, 200);
      }
    });

    this.events.on('player-land', (x: number, y: number, shakeIntensity: number) => {
      this.particleSystem.emitDust(x, y, 1 + shakeIntensity * 200);
      if (shakeIntensity > 0.002) {
        this.cameraSystem.shake(shakeIntensity, 80);
      }
      this.audioSystem.playSFX('sfx-land', 0.25);

      // Hard landing camera flash
      if (shakeIntensity > 0.004) {
        this.cameras.main.flash(120, 255, 255, 255, false);
      }

      // Echo ripple in Echo Forest region
      if (this.currentRegionIndex === 1) {
        this.particleSystem.emitEchoRipple(x, y);
      }
    });

    this.events.on('player-jump', () => {
      this.audioSystem.playSFX('sfx-jump', 0.3);
    });

    this.events.on('player-dash', () => {
      this.cameraSystem.shake(0.003, 60);
      this.cameraSystem.zoomPulse(0.015, 150);
      this.audioSystem.playSFX('sfx-dash', 0.3);
      this.parallaxSystem.applyVelocityBoost(0.3);
    });

    this.events.on('dash-cooldown-start', (duration: number) => {
      this.scene.get('UIScene').events.emit('dash-cooldown-start', duration);
    });

    this.events.on('player-dash-trail', (x: number, y: number) => {
      this.particleSystem.emitDashTrail(x, y);

      // Dash afterimage ghost
      const ghost = this.add.sprite(x, y, player.texture.key, player.frame.name);
      ghost.setFlipX(player.flipX);
      ghost.setScale(player.scaleX, player.scaleY);
      ghost.setAlpha(0.35);
      ghost.setTint(0x8888ff);
      ghost.setBlendMode(Phaser.BlendModes.ADD);
      ghost.setDepth(player.depth - 1);
      this.tweens.add({
        targets: ghost,
        alpha: 0,
        scaleX: ghost.scaleX * 1.1,
        scaleY: ghost.scaleY * 0.9,
        duration: 250,
        onComplete: () => ghost.destroy(),
      });
    });

    this.events.on('player-glide-trail', (x: number, y: number) => {
      this.particleSystem.emitGlideTrail(x, y + 10);
    });

    // --- Wall slide / wall jump events ---
    this.events.on('player-wall-slide', (_x: number, _y: number, _dir: number) => {
      this.audioSystem.playSFX('sfx-land', 0.1);
    });

    this.events.on('player-wall-slide-trail', (x: number, y: number) => {
      this.particleSystem.emitDust(x, y + 8, 0.3);
    });

    this.events.on('player-wall-jump', (x: number, y: number) => {
      this.particleSystem.emitCollectBurst(x, y, 0xccddff);
      this.audioSystem.playSFX('sfx-land', 0.2);
      this.cameraSystem.shake(0.003, 60);
    });

    // --- Combat events ---
    this.events.on('player-hurt', () => {
      this.playerSystem.enterHurtState();
    });

    this.events.on('player-damaged', (health: number, maxHealth: number) => {
      const player = this.playerSystem.getPlayer();
      this.particleSystem.emitDamageBurst(player.x, player.y);
      // Red screen flash on damage
      this.cameras.main.flash(150, 180, 40, 40, false);
      // Update UIScene
      this.scene.get('UIScene').events.emit('update-health', health, maxHealth);
    });

    this.events.on('player-respawned', (health: number, maxHealth: number) => {
      this.scene.get('UIScene').events.emit('update-health', health, maxHealth);
    });

    this.events.on('respawn-bloom', (x: number, y: number) => {
      this.particleSystem.emitRespawnBloom(x, y);
      this.audioSystem.playSFX('sfx-checkpoint', 0.3);
      this.cameraSystem.shake(0.002, 60);
    });

    this.events.on('play-sfx', (key: string, volume: number) => {
      // Echo Forest region adds reverb to footsteps/landing
      if (this.currentRegionIndex === 1) {
        this.audioSystem.playSFXWithEcho(key, volume);
      } else {
        this.audioSystem.playSFX(key, volume);
      }
    });

    // --- Melee attack events ---
    this.blasts = this.physics.add.group({ runChildUpdate: true });

    this.events.on('player-attack', (x: number, y: number, dir: number, comboStep: number) => {
      this.particleSystem.emitAttackSlash(x, y, dir, comboStep);
      this.audioSystem.playSFX('sfx-attack', 0.35);
      // Scale attack feedback with combo step
      const isCombo = comboStep === 2;
      this.cameraSystem.shake(isCombo ? 0.004 : 0.002, isCombo ? 80 : 50);

      // Brief hit-stop for weighty combo impacts
      if (isCombo) {
        this.time.timeScale = 0.15;
        this.time.delayedCall(60, () => { this.time.timeScale = 1; });
      }

      // Combo damage: 2nd hit deals 1.5x
      const dmgMult = isCombo ? 1.5 : 1;
      const meleeDmg = Math.round(COMBAT.ATTACK_DAMAGE * dmgMult);

      // Forward combo step to UI with multiplier
      this.scene.get('UIScene').events.emit('combo-step', comboStep, dmgMult);

      // Melee hit detection against wraiths
      for (const wraith of this.wraiths) {
        if (!wraith.active) continue;
        const dist = Phaser.Math.Distance.Between(x, y, wraith.x, wraith.y);
        if (dist <= COMBAT.ATTACK_RANGE) {
          wraith.takeDamage(meleeDmg, dir);
          this.particleSystem.emitEnemyHitBurst(wraith.x, wraith.y);
          this.audioSystem.playSFX('sfx-enemy-hit', isCombo ? 0.4 : 0.3);
          this.combatSystem.addBlastCharge(COMBAT.BLAST_CHARGE_ON_HIT);
          this.cameraSystem.shake(isCombo ? 0.008 : 0.004, isCombo ? 120 : 80);
          this.spawnDamageNumber(wraith.x, wraith.y, meleeDmg, isCombo);
        }
      }

      // Melee hit detection against crawlers
      for (const crawler of this.crawlers) {
        if (!crawler.active || crawler.isDead) continue;
        const dist = Phaser.Math.Distance.Between(x, y, crawler.x, crawler.y);
        if (dist <= COMBAT.ATTACK_RANGE) {
          crawler.takeDamage(meleeDmg, dir);
          this.particleSystem.emitEnemyHitBurst(crawler.x, crawler.y);
          this.audioSystem.playSFX('sfx-enemy-hit', isCombo ? 0.4 : 0.3);
          this.combatSystem.addBlastCharge(COMBAT.BLAST_CHARGE_ON_HIT);
          this.cameraSystem.shake(isCombo ? 0.008 : 0.004, isCombo ? 120 : 80);
          this.spawnDamageNumber(crawler.x, crawler.y, meleeDmg, isCombo);
        }
      }

      // Melee hit against boss
      if (this.bossSystem.active) {
        const bossSprite = this.bossSystem.getBossSprite();
        if (bossSprite && bossSprite.active) {
          const dist = Phaser.Math.Distance.Between(x, y, bossSprite.x, bossSprite.y);
          if (dist <= COMBAT.ATTACK_RANGE * 1.5) {
            this.bossSystem.damageBoss(meleeDmg);
            this.particleSystem.emitEnemyHitBurst(bossSprite.x, bossSprite.y);
            this.audioSystem.playSFX('sfx-enemy-hit', 0.35);
            this.combatSystem.addBlastCharge(COMBAT.BLAST_CHARGE_ON_HIT);
            this.spawnDamageNumber(bossSprite.x, bossSprite.y, meleeDmg, isCombo);
          }
        }
      }
    });

    // --- Blast request: check charges before firing ---
    this.events.on('player-blast-request', () => {
      if (this.combatSystem.canBlast()) {
        this.combatSystem.useBlastCharge();
        this.playerSystem.enterBlastState();
      }
    });

    // --- Blast fired: create projectile ---
    this.events.on('player-blast', (x: number, y: number, dir: number) => {
      this.particleSystem.emitBlastLaunch(x, y, dir);
      this.audioSystem.playSFX('sfx-blast', 0.4);
      this.cameraSystem.shake(0.003, 60);

      const blast = new Blast(this, x, y, dir);
      this.blasts.add(blast);

      // Blast overlap with wraiths
      for (const wraith of this.wraiths) {
        this.physics.add.overlap(blast, wraith, () => {
          if (!blast.active) return;
          const blastDir = blast.body ? Math.sign((blast.body as Phaser.Physics.Arcade.Body).velocity.x) : 1;
          wraith.takeDamage(COMBAT.BLAST_DAMAGE, blastDir);
          this.particleSystem.emitEnemyHitBurst(wraith.x, wraith.y);
          this.audioSystem.playSFX('sfx-enemy-hit', 0.3);
          this.combatSystem.addBlastCharge(1);
          this.spawnDamageNumber(wraith.x, wraith.y, COMBAT.BLAST_DAMAGE);
          blast.destroy();
        });
      }

      // Blast overlap with crawlers
      for (const crawler of this.crawlers) {
        this.physics.add.overlap(blast, crawler, () => {
          if (!blast.active || crawler.isDead) return;
          const blastDirC = blast.body ? Math.sign((blast.body as Phaser.Physics.Arcade.Body).velocity.x) : 1;
          crawler.takeDamage(COMBAT.BLAST_DAMAGE, blastDirC);
          this.particleSystem.emitEnemyHitBurst(crawler.x, crawler.y);
          this.audioSystem.playSFX('sfx-enemy-hit', 0.3);
          this.combatSystem.addBlastCharge(1);
          this.spawnDamageNumber(crawler.x, crawler.y, COMBAT.BLAST_DAMAGE);
          blast.destroy();
        });
      }

      // Blast overlap with boss
      if (this.bossSystem.active) {
        const bossSprite = this.bossSystem.getBossSprite();
        if (bossSprite && bossSprite.active) {
          this.physics.add.overlap(blast, bossSprite, () => {
            if (!blast.active) return;
            this.bossSystem.damageBoss(COMBAT.BLAST_DAMAGE);
            this.particleSystem.emitEnemyHitBurst(bossSprite.x, bossSprite.y);
            this.audioSystem.playSFX('sfx-enemy-hit', 0.35);
            this.spawnDamageNumber(bossSprite.x, bossSprite.y, COMBAT.BLAST_DAMAGE);
            blast.destroy();
          });
        }
      }
    });

    // --- Forward blast charges to UI ---
    this.events.on('blast-charges-changed', (charges: number, max: number) => {
      this.scene.get('UIScene').events.emit('blast-charges-changed', charges, max);
    });

    // --- Enemy death effects ---
    this.events.on('enemy-death', (x: number, y: number, type: string) => {
      this.particleSystem.emitEnemyDeath(x, y, type);
      this.audioSystem.playSFX('sfx-enemy-death', 0.35);
      this.cameraSystem.shake(0.002, 60);
      this.questSystem.registerKill();
      // Brief time-freeze for kill weight
      this.time.timeScale = 0.15;
      this.time.delayedCall(80, () => { this.time.timeScale = 1; });
    });

    this.events.on('fragment-collected', (fragment: MemoryFragment) => {
      this.collectedCount++;
      this.questSystem.collectFragment();
      this.particleSystem.emitCollectBurst(fragment.x, fragment.y);
      this.colorSystem.addSaturation(0.1);
      this.cameraSystem.zoomPulse(0.02, 300);
      this.audioSystem.playSFX('sfx-collect', 0.4);
      this.toastSystem.show('A memory fragment found its way home.', '#c8e0ff');

      // Brief time-slow for dramatic impact
      this.time.timeScale = 0.3;
      this.time.delayedCall(150, () => { this.time.timeScale = 1; });

      // Screen flash
      this.cameras.main.flash(200, 160, 200, 255, false);

      // Ability unlock progression
      this.checkAbilityUnlocks();

      // Emit to UIScene
      this.scene.get('UIScene').events.emit(
        'update-fragments',
        this.collectedCount,
        this.fragments.length
      );

      // The "wow moment" — final fragment triggers full color bloom
      if (this.collectedCount === this.fragments.length) {
        this.toastSystem.show('All fragments found! Light the beacons.', '#fff0c0');
        this.time.delayedCall(400, () => {
          this.colorSystem.triggerColorBloom(0xaaccff, 3000);
          this.cameraSystem.shake(0.006, 300);
          this.cameraSystem.zoomPulse(0.04, 600);
        });
      }
    });

    this.events.on('quest-progress', (progress: any) => {
      this.scene.get('UIScene').events.emit('update-quest', progress);
    });

    this.events.on('quest-complete', () => {
      this.toastSystem.show('All objectives complete! The storm awakens…', '#ffd080');
      this.cameraSystem.zoomPulse(0.03, 500);
      // Delay the storm + boss activation for dramatic effect
      this.time.delayedCall(2000, () => {
        this.stormSystem.start();
        this.bossSystem.activate(this.stormSystem.wallX);
        this.toastSystem.show('Run towards the portal!', '#ffc0a0');
      });
    });

    // --- Audio (start ambient music) ---
    // Browsers require user interaction before audio can play.
    // The main menu keypress counts as interaction, so this should work.
    this.audioSystem.playTrack(ASSET_KEYS.MUSIC_AMBIENT);

    // --- Debug toggle (F12) ---
    this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F12).on('down', () => {
      this.debugMode = !this.debugMode;
      this.physics.world.drawDebug = this.debugMode;
      if (this.debugMode) {
        if (!this.physics.world.debugGraphic) {
          this.physics.world.createDebugGraphic();
        }
      } else {
        this.physics.world.debugGraphic?.clear();
      }
    });

    // --- Pause Menu ---
    this.pauseMenu = new PauseMenu(this);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.pKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.tabKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
    this.mKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M);

    // --- Boss System ---
    this.bossSystem = new BossSystem(this);
    this.bossSystem.create(player);

    // --- Storm System ---
    this.stormSystem = new StormSystem(this);
    this.stormSystem.create(player);

    // --- Intro Overlay ---
    this.introOverlay = new IntroOverlay(this);

    // --- Ending Overlay ---
    this.endingOverlay = new EndingOverlay(this);
    this.startTime = this.time.now;

    // --- Boss/Storm events ---
    this.events.on('boss-hit-player', (bx: number, by: number) => {
      this.combatSystem.damagePlayer(1, bx, by, 'The Nightmaw strikes!');
    });

    this.events.on('boss-telegraph', () => {
      this.toastSystem.show('The Nightmaw is gathering itself!', '#ffc0e0');

      // Ground AoE warning marker at player position
      const marker = this.add.circle(player.x, player.y + 24, 60, 0xff4466, 0.0);
      marker.setStrokeStyle(2, 0xff4466, 0.6);
      marker.setBlendMode(Phaser.BlendModes.ADD);
      marker.setDepth(5);
      this.tweens.add({
        targets: marker,
        alpha: 0.15,
        scale: { from: 0.3, to: 1.2 },
        duration: 700,
        yoyo: true,
        onComplete: () => marker.destroy(),
      });
    });

    this.events.on('storm-damage', () => {
      this.combatSystem.damagePlayer(1, player.x - 20, player.y, 'The darkness catches you.');
    });

    this.events.on('storm-lightning', (lx: number, topY: number, bottomY: number) => {
      this.particleSystem.emitLightningStrike(lx, topY, bottomY);
      this.audioSystem.playSFX('sfx-boss-attack', 0.2);
    });

    // --- Boss Phase 3 events ---
    this.meteors = this.physics.add.group({ runChildUpdate: true });

    this.events.on('boss-spawn-meteors', (count: number, bx: number, by: number) => {
      spawnMeteors(this, this.meteors, count, bx, by);
      // Overlap each new meteor with player for damage
      this.meteors.getChildren().forEach((m) => {
        if (!(m as Phaser.GameObjects.GameObject).getData('overlapped')) {
          this.physics.add.overlap(player, m as Phaser.Physics.Arcade.Sprite, () => {
            if (!(m as Phaser.Physics.Arcade.Sprite).active) return;
            this.combatSystem.damagePlayer(1, (m as Phaser.Physics.Arcade.Sprite).x, (m as Phaser.Physics.Arcade.Sprite).y, 'A meteor strikes you!');
            (m as Phaser.Physics.Arcade.Sprite).destroy();
          });
          (m as Phaser.GameObjects.GameObject).setData('overlapped', true);
        }
      });
    });

    this.events.on('meteor-impact', (x: number, y: number) => {
      this.particleSystem.emitMeteorImpact(x, y);
      this.cameraSystem.shake(0.003, 80);
    });

    this.events.on('meteor-trail', (x: number, y: number) => {
      this.particleSystem.emitBlastTrail(x, y, 0xff6644);
    });

    this.events.on('blast-trail', (x: number, y: number) => {
      this.particleSystem.emitBlastTrail(x, y);
    });

    this.events.on('blast-impact', (x: number, y: number) => {
      this.particleSystem.emitBlastImpact(x, y);
    });

    this.events.on('boss-land', (x: number, y: number) => {
      this.particleSystem.emitBossLand(x, y);
      this.cameraSystem.shake(0.005, 120);
    });

    this.events.on('boss-stunned', (x: number, y: number) => {
      this.particleSystem.emitBossStun(x, y);
      this.toastSystem.show('The Nightmaw is stunned! Strike now!', '#88ccff');
    });

    this.events.on('boss-death', (x: number, y: number) => {
      this.particleSystem.emitBossDeath(x, y);
      this.colorSystem.triggerColorBloom(0xcc88ff, 3000);
      this.cameraSystem.shake(0.008, 300);
      this.cameraSystem.zoomPulse(0.04, 600);
    });

    this.events.on('boss-death-burst', (x: number, y: number) => {
      this.particleSystem.emitEnemyHitBurst(x, y);
    });

    this.events.on('boss-defeated', () => {
      this.stormSystem.stop();
      this.toastSystem.show('The Nightmaw fades… the portal beckons.', '#eeddff');
      this.scene.get('UIScene').events.emit('boss-defeated-ui');
    });

    this.events.on('boss-health-changed', (health: number, maxHealth: number, armor: number, maxArmor: number) => {
      this.scene.get('UIScene').events.emit('boss-health-changed', health, maxHealth, armor, maxArmor);
    });

    this.events.on('boss-stunned', () => {
      this.scene.get('UIScene').events.emit('boss-vulnerable');
    });

    this.events.on('boss-recovered', () => {
      this.scene.get('UIScene').events.emit('boss-recovered');
    });

    this.events.on('boss-armor-broken', (bx: number, by: number) => {
      this.particleSystem.emitArmorBreak(bx, by);
      this.cameraSystem.shake(0.01, 200);
      this.cameras.main.flash(200, 255, 255, 255);
      this.audioSystem.playSFX('sfx-boss-stun', 0.5);
      this.cameraSystem.zoomPulse(0.03, 500);

      // Dramatic slow-motion
      this.time.timeScale = 0.3;
      this.time.delayedCall(350, () => { this.time.timeScale = 1; });
    });

    this.events.on('boss-door-opened', () => {
      this.toastSystem.show('The seal is broken… darkness awaits beyond.', '#ff88aa');
      this.cameraSystem.shake(0.004, 200);
      this.audioSystem.playSFX('sfx-collect', 0.3);
    });

    // --- Ability feedback events ---
    this.events.on('heavy-form-activated', () => {
      this.toastSystem.show('Heavy Form activated — wind resistance increased.', '#8888cc');
      this.audioSystem.playSFX('sfx-land', 0.3);
      this.cameraSystem.shake(0.006, 150);
      // Ground stomp particles
      this.particleSystem.emitCollectBurst(player.x, player.y + 20, 0x666688);

      // Ground crack lines
      const crack = this.add.graphics();
      crack.setDepth(1);
      const cx = player.x;
      const cy = player.y + 22;
      crack.lineStyle(1.5, 0x667788, 0.7);
      for (let i = 0; i < 5; i++) {
        const ang = -Math.PI + (Math.PI / 4) * i + (Math.random() - 0.5) * 0.3;
        const len = 14 + Math.random() * 18;
        crack.beginPath();
        crack.moveTo(cx, cy);
        crack.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len * 0.4);
        crack.strokePath();
      }
      this.tweens.add({
        targets: crack,
        alpha: 0,
        duration: 600,
        delay: 200,
        onComplete: () => crack.destroy(),
      });
    });

    this.events.on('heavy-form-deactivated', () => {
      this.toastSystem.show('Heavy Form deactivated.', '#aaaacc');
      this.audioSystem.playSFX('sfx-land', 0.15);
    });

    this.events.on('spirit-vision-activated', () => {
      this.toastSystem.show('Spirit Vision — hidden paths revealed.', '#88eeff');
      this.audioSystem.playSFX('sfx-dialogue-open', 0.25);
      // Blue screen tint pulse
      this.cameras.main.flash(300, 80, 180, 255, false);
      // Start sustained aura
      this.spiritVisionActive = true;
      this.particleSystem.startSpiritAura();

      // Blue vignette overlay
      if (!this.spiritVignette) {
        this.spiritVignette = this.add.graphics();
        this.spiritVignette.setScrollFactor(0).setDepth(195);
      }
      this.spiritVignette.clear();
      this.spiritVignette.fillStyle(0x4488cc, 0.12);
      this.spiritVignette.fillRect(0, 0, GAME_WIDTH, 30);
      this.spiritVignette.fillRect(0, GAME_HEIGHT - 30, GAME_WIDTH, 30);
      this.spiritVignette.fillRect(0, 0, 30, GAME_HEIGHT);
      this.spiritVignette.fillRect(GAME_WIDTH - 30, 0, 30, GAME_HEIGHT);
      this.spiritVignette.setAlpha(0);
      this.tweens.add({ targets: this.spiritVignette, alpha: 1, duration: 400 });

      // SPIRIT MODE label
      if (!this.spiritModeLabel) {
        this.spiritModeLabel = this.add.text(GAME_WIDTH / 2, 16, 'SPIRIT MODE', {
          fontSize: '11px', fontFamily: 'monospace', color: '#88eeff',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(196).setAlpha(0);
      }
      this.spiritModeLabel.setAlpha(0);
      this.tweens.add({
        targets: this.spiritModeLabel,
        alpha: { from: 0, to: 0.7 },
        duration: 400,
      });
      // Pulse label
      this.tweens.add({
        targets: this.spiritModeLabel,
        alpha: { from: 0.5, to: 0.8 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    this.events.on('spirit-vision-deactivated', () => {
      this.toastSystem.show('Spirit Vision fades.', '#88aabb');
      this.audioSystem.playSFX('sfx-dialogue-open', 0.15);
      this.cameras.main.flash(200, 40, 60, 100, false);
      // Stop sustained aura
      this.spiritVisionActive = false;
      this.particleSystem.stopSpiritAura();

      // Fade out vignette
      if (this.spiritVignette) {
        this.tweens.add({
          targets: this.spiritVignette,
          alpha: 0,
          duration: 400,
        });
      }
      // Fade out label
      if (this.spiritModeLabel) {
        this.tweens.killTweensOf(this.spiritModeLabel);
        this.tweens.add({
          targets: this.spiritModeLabel,
          alpha: 0,
          duration: 300,
        });
      }
    });

    // Hidden platform spirit reveal burst
    this.events.on('hidden-platform-revealed', (x: number, y: number) => {
      this.particleSystem.emitCollectBurst(x, y, 0x88ccff);
    });

    // Crumbling platform dust
    this.events.on('crumble-dust', (x: number, y: number, intensity: number) => {
      const count = Math.ceil(intensity * 3);
      for (let i = 0; i < count; i++) {
        this.particleSystem.emitDust(
          x + Phaser.Math.Between(-20, 20),
          y,
          0.2 + intensity * 0.4,
        );
      }
    });

    // Death overlay
    this.events.on('player-died', (reason: string) => {
      const deathText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'FADING...', {
        fontFamily: 'Georgia, serif',
        fontSize: '32px',
        color: '#cc8888',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setAlpha(0);

      const reasonText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, reason, {
        fontFamily: 'Georgia, serif',
        fontSize: '16px',
        color: '#887788',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setAlpha(0);

      this.tweens.add({ targets: deathText, alpha: 0.9, duration: 250, ease: 'Sine.easeIn' });
      this.tweens.add({ targets: reasonText, alpha: 0.7, duration: 300, delay: 100, ease: 'Sine.easeIn' });

      // Clean up after respawn
      this.time.delayedCall(COMBAT.RESPAWN_DELAY + 200, () => {
        this.tweens.add({
          targets: [deathText, reasonText],
          alpha: 0,
          duration: 300,
          onComplete: () => { deathText.destroy(); reasonText.destroy(); },
        });
      });
    });

    // --- Auto-save triggers ---
    this.events.on('checkpoint-activated', (id: string) => {
      this.saveGame();
      // VFX: flash + particles at checkpoint
      const cpPoint = this.checkpointSystem.getSpawnPoint();
      this.particleSystem.emitCollectBurst(cpPoint.x, cpPoint.y, 0xffdd88);
      this.cameras.main.flash(150, 255, 220, 130, false);
      this.cameraSystem.zoomPulse(0.01, 200);
    });
    this.events.on('fragment-collected', () => {
      this.saveGame();
    });

    // --- Door to Scene 2 (far right of world) ---
    this.createDoor(WORLD_WIDTH - 120, WORLD_HEIGHT - 32, player);

    // Fade in
    this.cameras.main.fadeIn(1000, 10, 10, 26);

    // Load saved progress
    this.loadGame();
  }

  update(_time: number, delta: number): void {
    // Intro overlay — block input until dismissed
    if (!this.introOverlay.dismissed) {
      const enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      if (Phaser.Input.Keyboard.JustDown(this.eKey) || (enterKey && Phaser.Input.Keyboard.JustDown(enterKey))) {
        this.introOverlay.dismiss(this);
        this.startIntroPan();
      }
      return;
    }

    // Intro pan — block input while panning
    if (this.introPanning) return;

    // Ending overlay — block input
    if (this.endingOverlay.visible) {
      if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
        this.endingOverlay.hide();
      }
      const rKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R);
      if (rKey && Phaser.Input.Keyboard.JustDown(rKey)) {
        this.scene.restart();
      }
      const dKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      if (dKey && Phaser.Input.Keyboard.JustDown(dKey) && this.endingOverlay.stats?.bossDefeated) {
        this.endingOverlay.hide();
        this.audioSystem.stopTrack();
        this.cameras.main.fadeOut(800, 10, 10, 26);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.stop('UIScene');
          this.scene.start('DawnScene', { stats: this.endingOverlay.stats });
        });
      }
      return;
    }

    // Pause toggle
    if (Phaser.Input.Keyboard.JustDown(this.escKey) || Phaser.Input.Keyboard.JustDown(this.pKey)) {
      this.pauseMenu.toggle();
    }
    if (this.pauseMenu.isPaused) {
      this.pauseMenu.handleInput(this.cursors, this.tabKey);
      return;
    }

    // Minimap toggle
    if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
      this.scene.get('UIScene').events.emit('minimap-toggle');
    }

    // Hit freeze: skip all updates during freeze frame
    if (this.combatSystem.isFrozen) {
      this.combatSystem.update(delta);
      return;
    }

    // Suppress jump when near door so Up/W only enters the door
    this.playerSystem.suppressJump = this.playerNearDoor;

    // Reset wind velocity — will be set by overlap callbacks this frame
    this.playerSystem.windVelocity = 0;

    // Reset water state — will be set by overlap callbacks this frame
    const wasInWater = this.playerInWater;
    this.playerInWater = false;

    this.combatSystem.update(delta);
    if (!this.dialogueSystem.isOpen) {
      this.playerSystem.update(delta);
    }

    // Spirit Vision sustained aura particles
    if (this.spiritVisionActive) {
      const p = this.playerSystem.getPlayer();
      this.particleSystem.updateSpiritAura(p.x, p.y);
    }

    // Water pool physics: reduce gravity & emit splash on enter/exit
    const playerBody = this.playerSystem.getPlayer().body as Phaser.Physics.Arcade.Body;
    if (this.playerInWater) {
      playerBody.setGravityY(-600); // Counteracts most of base gravity for floaty feel
      if (!wasInWater) {
        const p = this.playerSystem.getPlayer();
        this.particleSystem.emitWaterSplash(p.x, p.y);
        this.audioSystem.playSFX('sfx-land', 0.2);
      }
    } else if (wasInWater) {
      playerBody.setGravityY(0); // Reset to default scene gravity
      const p = this.playerSystem.getPlayer();
      this.particleSystem.emitWaterSplash(p.x, p.y);
    }

    this.cameraSystem.update();
    this.parallaxSystem.update();
    this.colorSystem.update(delta);
    this.checkpointSystem.update();

    // Storm & Boss updates
    this.stormSystem.update(delta, _time);
    this.bossSystem.update(_time, delta, this.stormSystem.wallX);

    // Region-based ambient music crossfade
    this.updateRegionMusic();

    // Minimap data → UIScene
    this.emitMinimapData();

    // NPC proximity & dialogue interaction
    const player = this.playerSystem.getPlayer();
    this.nearestNpc = null;
    const NPC_INTERACT_DIST = 80;
    for (const npc of this.npcs) {
      npc.update(_time);
      const dist = Phaser.Math.Distance.Between(player.x, player.y, npc.x, npc.y);
      if (dist < NPC_INTERACT_DIST) {
        this.nearestNpc = npc;
        npc.showPrompt();
      } else {
        npc.hidePrompt();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      if (this.dialogueSystem.isOpen) {
        this.dialogueSystem.advance();
      } else if (this.nearestNpc) {
        this.dialogueSystem.open(
          this.nearestNpc.getCurrentLines(),
          undefined,
          this.nearestNpc.colors,
          this.nearestNpc.portraitKey,
        );
      }
    }

    // Beacon proximity & hold-E activation
    let nearBeacon: Beacon | null = null;
    for (const beacon of this.beacons) {
      beacon.update(_time);
      const dist = Phaser.Math.Distance.Between(player.x, player.y, beacon.x, beacon.y);
      if (dist < QUEST.BEACON_ACTIVATE_DIST && !beacon.active) {
        nearBeacon = beacon;
        beacon.showPrompt();
      } else {
        beacon.hidePrompt();
      }
    }

    if (nearBeacon && this.eKey.isDown && !this.dialogueSystem.isOpen) {
      this.eHoldTime += delta;
      // Draw hold progress ring
      this.drawHoldRing(nearBeacon.x, nearBeacon.y - 70, this.eHoldTime / QUEST.BEACON_HOLD_TIME);
      if (this.eHoldTime >= QUEST.BEACON_HOLD_TIME) {
        this.eHoldTime = 0;
        this.clearHoldRing();
        nearBeacon.activate();
        this.questSystem.activateBeacon();
        this.audioSystem.playSFX('sfx-beacon', 0.4);
        this.toastSystem.show(`${nearBeacon.beaconLabel} is lit!`, '#fff0bf');
        this.particleSystem.emitCollectBurst(nearBeacon.x, nearBeacon.y - 56);

        // Beacon ceremony — particle fountain, world reaction
        this.particleSystem.emitBeaconFountain(nearBeacon.x, nearBeacon.y - 80);
        this.cameraSystem.shake(0.005, 200);
        this.cameras.main.flash(250, 255, 220, 140, false);
        this.parallaxSystem.brighten(0.08, 2500);
        this.colorSystem.addSaturation(0.15);
        this.colorSystem.triggerColorBloom(0xffd080, 2500);
        this.cameraSystem.zoomPulse(0.03, 500);

        // Brief time-slow
        this.time.timeScale = 0.4;
        this.time.delayedCall(200, () => { this.time.timeScale = 1; });
      }
    } else {
      this.eHoldTime = 0;
      this.clearHoldRing();
    }

    // Bench proximity & hold-E to rest/heal
    const BENCH_DIST = 60;
    let nearBench: RestBench | null = null;
    for (const bench of this.benches) {
      const dist = Phaser.Math.Distance.Between(player.x, player.y, bench.x, bench.y);
      if (dist < BENCH_DIST) {
        nearBench = bench;
        bench.showPrompt();
      } else {
        bench.hidePrompt();
      }
    }

    if (nearBench && this.eKey.isDown && !this.dialogueSystem.isOpen) {
      this.drawBenchRing(nearBench.x, nearBench.y - 30, nearBench.holdProgress);

      // Healing motes rising during hold
      if (Math.random() < 0.35) {
        const mote = this.add.circle(
          nearBench.x + Phaser.Math.Between(-16, 16),
          nearBench.y,
          Phaser.Math.Between(2, 4),
          0xaaddcc, 0.6,
        );
        mote.setBlendMode(Phaser.BlendModes.ADD).setDepth(19);
        this.tweens.add({
          targets: mote,
          y: nearBench.y - Phaser.Math.Between(30, 55),
          alpha: 0,
          scale: 0,
          duration: Phaser.Math.Between(500, 800),
          ease: 'Sine.easeIn',
          onComplete: () => mote.destroy(),
        });
      }

      if (nearBench.holdRest(delta)) {
        this.combatSystem.heal(this.combatSystem.maxHealth);
        this.audioSystem.playSFX('sfx-bench-rest', 0.4);
        this.toastSystem.show('You rest and recover your strength.', '#ccddff');
        this.particleSystem.emitCollectBurst(nearBench.x, nearBench.y - 20);
        this.clearBenchRing();
      }
    } else if (nearBench) {
      nearBench.resetRest();
      this.clearBenchRing();
    } else {
      this.clearBenchRing();
    }

    // Boss door proximity & kill-gate check
    if (!this.bossDoor.isOpen) {
      const doorDist = Phaser.Math.Distance.Between(player.x, player.y, this.bossDoor.x, this.bossDoor.y);
      if (doorDist < 100) {
        const kills = this.questSystem.kills.current;
        this.bossDoor.showPrompt(kills);
        this.bossDoor.tryOpen(kills);
      } else {
        this.bossDoor.hidePrompt();
      }
    }

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
    // Door visual — ornate glowing portal archway
    const doorGfx = this.add.graphics();

    // Outer stone frame
    doorGfx.fillStyle(0x2a1838, 1);
    doorGfx.fillRoundedRect(-34, -100, 68, 100, { tl: 20, tr: 20, bl: 2, br: 2 });
    // Stone border highlight
    doorGfx.lineStyle(2, 0x5a3878, 0.6);
    doorGfx.strokeRoundedRect(-34, -100, 68, 100, { tl: 20, tr: 20, bl: 2, br: 2 });

    // Inner dark void
    doorGfx.fillStyle(0x110820, 1);
    doorGfx.fillRoundedRect(-26, -92, 52, 92, { tl: 16, tr: 16, bl: 0, br: 0 });

    // Energy layers from outside in
    doorGfx.fillStyle(0x6633aa, 0.15);
    doorGfx.fillRoundedRect(-24, -88, 48, 88, { tl: 14, tr: 14, bl: 0, br: 0 });
    doorGfx.fillStyle(0x8844cc, 0.2);
    doorGfx.fillRoundedRect(-18, -80, 36, 80, { tl: 10, tr: 10, bl: 0, br: 0 });
    doorGfx.fillStyle(0xbb77ee, 0.25);
    doorGfx.fillRoundedRect(-12, -72, 24, 72, { tl: 8, tr: 8, bl: 0, br: 0 });
    doorGfx.fillStyle(0xeeddff, 0.35);
    doorGfx.fillRoundedRect(-6, -64, 12, 64, { tl: 6, tr: 6, bl: 0, br: 0 });

    // Rune markings on the frame
    doorGfx.fillStyle(0x9966dd, 0.3);
    doorGfx.fillCircle(-30, -50, 3);
    doorGfx.fillCircle(30, -50, 3);
    doorGfx.fillCircle(-30, -30, 3);
    doorGfx.fillCircle(30, -30, 3);
    doorGfx.fillCircle(0, -96, 4);

    // Step / threshold
    doorGfx.fillStyle(0x3a2848, 1);
    doorGfx.fillRoundedRect(-38, -2, 76, 6, 2);

    this.door = this.add.container(x, y, [doorGfx]);
    this.door.setDepth(5);

    // Ambient glow behind portal
    const portalGlow = this.add.circle(x, y - 50, 60, 0x8844cc, 0.08);
    portalGlow.setBlendMode(Phaser.BlendModes.SCREEN);
    portalGlow.setDepth(4);
    this.tweens.add({
      targets: portalGlow,
      alpha: { from: 0.05, to: 0.15 },
      scale: { from: 0.9, to: 1.15 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Glowing pulse on the door itself
    this.tweens.add({
      targets: doorGfx,
      alpha: { from: 0.85, to: 1 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Prompt text
    this.doorPrompt = this.add.text(x, y - 120, '▲ Enter', {
      fontSize: '16px',
      color: '#eeddff',
      fontFamily: 'monospace',
    });
    this.doorPrompt.setOrigin(0.5, 1);
    this.doorPrompt.setDepth(15);
    this.doorPrompt.setAlpha(0);

    // Overlap zone
    this.doorZone = this.add.zone(x, y - 40, 64, 80);
    this.physics.add.existing(this.doorZone, true);

    this.physics.add.overlap(player, this.doorZone, () => {
      if (!this.playerNearDoor) {
        this.playerNearDoor = true;
        this.tweens.add({ targets: this.doorPrompt, alpha: 1, duration: 200 });
      }
    });

    // Check when player leaves door zone
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
    // Prevent double-trigger
    this.playerNearDoor = false;

    if (this.stormSystem.active && this.questSystem.isComplete && !this.endingSeen) {
      // Victory! Show ending overlay
      this.endingSeen = true;
      this.stormSystem.stop();
      this.bossSystem.deactivate();
      this.colorSystem.triggerColorBloom(0xffeedd, 4000);
      this.cameraSystem.shake(0.008, 400);
      this.cameraSystem.zoomPulse(0.05, 800);
      const elapsed = (this.time.now - this.startTime) / 1000;
      this.endingOverlay.show(this, {
        fragments: this.questSystem.fragments.current,
        fragmentsTotal: this.questSystem.fragments.target,
        beacons: this.questSystem.beacons.current,
        beaconsTotal: this.questSystem.beacons.target,
        timeSec: elapsed,
        kills: this.questSystem.kills.current,
        bossDefeated: !this.bossSystem.active,
      });
      return;
    }

    this.audioSystem.stopTrack();
    this.cameras.main.fadeOut(800, 10, 10, 26);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UIScene');
      this.scene.start('DawnScene');
    });
  }

  private createMemoryFragments(player: Phaser.Physics.Arcade.Sprite): void {
    const fragmentPositions = [
      { x: 500, y: 420, id: 'fragment-1' },
      { x: 850, y: 360, id: 'fragment-2' },
      { x: 1450, y: 320, id: 'fragment-3' },
      { x: 2050, y: 290, id: 'fragment-4' },
      { x: 2650, y: 270, id: 'fragment-5' },
      { x: 3250, y: 370, id: 'fragment-6' },
    ];

    for (const pos of fragmentPositions) {
      const frag = new MemoryFragment(
        this,
        pos.x,
        pos.y,
        ASSET_KEYS.MEMORY_FRAGMENT,
        pos.id
      );
      this.fragments.push(frag);

      this.physics.add.overlap(player, frag, () => {
        if (!frag.collected) {
          frag.collect();
          this.events.emit('fragment-collected', frag);
        }
      });
    }
  }

  private saveGame(): void {
    const collectedIds = this.fragments
      .filter((f) => f.collected)
      .map((f) => f.fragmentId);
    const data: SaveData = {
      checkpointIndex: this.checkpointSystem.getActiveIndex(),
      collectedFragments: collectedIds,
      activatedBeacons: this.questSystem.beacons.current,
      killCount: this.questSystem.kills.current,
      timestamp: Date.now(),
    };
    SaveSystem.save(data);
  }

  private loadGame(): void {
    const data = SaveSystem.load();
    if (!data) return;

    // Restore checkpoint
    if (data.checkpointIndex > 0) {
      this.checkpointSystem.restoreIndex(data.checkpointIndex);
      const spawn = this.checkpointSystem.getSpawnPoint();
      const player = this.playerSystem.getPlayer();
      player.setPosition(spawn.x, spawn.y);
    }

    // Restore collected fragments
    for (const frag of this.fragments) {
      if (data.collectedFragments.includes(frag.fragmentId)) {
        frag.collect();
        this.collectedCount++;
      }
    }

    // Restore quest state
    this.questSystem.restoreState(
      data.collectedFragments.length,
      data.activatedBeacons,
      data.killCount,
    );

    // Restore beacon activations
    for (let i = 0; i < data.activatedBeacons && i < this.beacons.length; i++) {
      this.beacons[i].activate();
    }

    // Restore ability unlocks based on collected fragment count
    this.checkAbilityUnlocks();
  }

  private updateRegionMusic(): void {
    const playerX = this.playerSystem.getPlayer().x;
    const regionIndex = Math.min(
      REGION_COUNT - 1,
      Math.max(0, Math.floor(playerX / REGION_WIDTH)),
    );

    if (regionIndex !== this.currentRegionIndex) {
      const prevIndex = this.currentRegionIndex;
      this.currentRegionIndex = regionIndex;
      const region = REGIONS[regionIndex];
      const soundscapeKey = region.soundscape;

      // Use region soundscape if available, otherwise fall back to default ambient
      if (this.cache.audio.exists(soundscapeKey)) {
        this.audioSystem.playTrack(soundscapeKey, { volume: 0.3 });
      } else {
        this.audioSystem.playTrack(ASSET_KEYS.MUSIC_AMBIENT, { volume: 0.35 });
      }

      // Apply region mechanic modifiers
      this.applyRegionModifiers(region.mechanicModifier);

      // Region-specific ambient particles
      this.particleSystem.setRegionParticles(regionIndex, REGION_WIDTH);

      // Transition camera background color to region palette
      this.colorSystem.transitionBackground(region.palette.background, 2000);

      // Show region name toast on region change (skip initial spawn)
      if (prevIndex >= 0) {
        this.toastSystem.show(region.name, '#d0e8ff');

        // Region transition banner — larger centered text
        const banner = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, region.name, {
          fontFamily: 'Georgia, serif',
          fontSize: '36px',
          color: '#' + region.palette.accent.toString(16).padStart(6, '0'),
        }).setOrigin(0.5).setScrollFactor(0).setDepth(250).setAlpha(0);

        this.tweens.add({
          targets: banner,
          alpha: 0.8,
          duration: 400,
          hold: 1200,
          yoyo: true,
          ease: 'Sine.easeInOut',
          onComplete: () => banner.destroy(),
        });

        // Region accent color bloom
        this.colorSystem.triggerColorBloom(region.palette.accent, 1500);
      }
    }
  }

  private applyRegionModifiers(modifier: string | undefined): void {
    switch (modifier) {
      case 'water':
        // Sunken Ruins: slower, heavier movement
        this.playerSystem.regionSpeedMultiplier = 0.82;
        this.playerSystem.regionJumpMultiplier = 0.88;
        break;
      case 'wind':
        // Sky Fracture: slightly faster, higher jumps (wind boost)
        this.playerSystem.regionSpeedMultiplier = 1.12;
        this.playerSystem.regionJumpMultiplier = 1.15;
        break;
      case 'spirit':
        // Core Veil: normal speed, enhanced jump (ethereal)
        this.playerSystem.regionSpeedMultiplier = 1.0;
        this.playerSystem.regionJumpMultiplier = 1.1;
        break;
      case 'echo':
      default:
        // Silent Plains / Echo Forest: baseline
        this.playerSystem.regionSpeedMultiplier = 1.0;
        this.playerSystem.regionJumpMultiplier = 1.0;
        break;
    }
  }

  /** Draw radial progress ring around an interaction target */
  private drawHoldRing(x: number, y: number, progress: number): void {
    if (!this.holdProgressRing) {
      this.holdProgressRing = this.add.graphics();
      this.holdProgressRing.setDepth(200);
    }
    this.holdProgressRing.clear();
    const radius = 18;
    const t = Phaser.Math.Clamp(progress, 0, 1);
    // Background ring
    this.holdProgressRing.lineStyle(3, 0x444466, 0.3);
    this.holdProgressRing.strokeCircle(x, y, radius);
    // Progress arc
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI * 2 * t;
    this.holdProgressRing.lineStyle(3, 0xffd080, 0.9);
    this.holdProgressRing.beginPath();
    this.holdProgressRing.arc(x, y, radius, startAngle, endAngle, false);
    this.holdProgressRing.strokePath();
  }

  /** Remove the hold progress ring */
  private clearHoldRing(): void {
    if (this.holdProgressRing) {
      this.holdProgressRing.clear();
    }
  }

  /** Draw radial progress ring for bench rest hold */
  private drawBenchRing(x: number, y: number, progress: number): void {
    if (!this.benchHoldRing) {
      this.benchHoldRing = this.add.graphics();
      this.benchHoldRing.setDepth(200);
    }
    this.benchHoldRing.clear();
    const radius = 16;
    const t = Phaser.Math.Clamp(progress, 0, 1);
    this.benchHoldRing.lineStyle(3, 0x444466, 0.3);
    this.benchHoldRing.strokeCircle(x, y, radius);
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI * 2 * t;
    this.benchHoldRing.lineStyle(3, 0xccbbff, 0.9);
    this.benchHoldRing.beginPath();
    this.benchHoldRing.arc(x, y, radius, startAngle, endAngle, false);
    this.benchHoldRing.strokePath();
  }

  /** Remove the bench hold ring */
  private clearBenchRing(): void {
    if (this.benchHoldRing) {
      this.benchHoldRing.clear();
    }
  }

  private checkAbilityUnlocks(): void {
    const unlockMap: { count: number; ability: AbilityId; name: string; key: string; desc: string }[] = [
      { count: 1, ability: AbilityId.DASH, name: 'Dash', key: 'Shift', desc: 'Quick burst of speed with invincibility frames' },
      { count: 2, ability: AbilityId.GLIDE, name: 'Glide', key: 'Space (hold)', desc: 'Slow your fall and drift through the air' },
      { count: 3, ability: AbilityId.HEAVY_FORM, name: 'Heavy Form', key: 'H', desc: 'Resist wind gusts and increase ground impact' },
      { count: 4, ability: AbilityId.SPIRIT_VISION, name: 'Spirit Vision', key: 'V', desc: 'Reveal hidden platforms and secret paths' },
    ];

    for (const entry of unlockMap) {
      if (this.collectedCount >= entry.count && !this.abilitySystem.isUnlocked(entry.ability)) {
        this.abilitySystem.unlock(entry.ability);
        this.time.delayedCall(600, () => {
          this.toastSystem.show(`Ability unlocked: ${entry.name}`, '#ffe080');
          this.cameraSystem.zoomPulse(0.03, 400);
          this.audioSystem.playSFX('sfx-checkpoint', 0.4);
          const player = this.playerSystem.getPlayer();
          this.particleSystem.emitRespawnBloom(player.x, player.y);

          // Tutorial popup — centered keybind guide
          this.showAbilityTutorial(entry.name, entry.key, entry.desc);
        });
      }
    }
  }

  private showAbilityTutorial(name: string, key: string, desc: string): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2 + 80;

    const bg = this.add.rectangle(cx, cy, 420, 90, 0x0a1230, 0.9);
    bg.setScrollFactor(0).setDepth(250);
    bg.setStrokeStyle(1.5, 0xffe080, 0.3);

    const title = this.add.text(cx, cy - 22, `${name}  [ ${key} ]`, {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      color: '#ffe080',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(251);

    const body = this.add.text(cx, cy + 14, desc, {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#c0d0e0',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(251);

    const items = [bg, title, body];
    items.forEach(obj => obj.setAlpha(0));

    this.tweens.add({
      targets: items,
      alpha: 1,
      duration: 400,
      hold: 4000,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => items.forEach(obj => obj.destroy()),
    });
  }

  private startIntroPan(): void {
    this.introPanning = true;
    const cam = this.cameras.main;
    const player = this.playerSystem.getPlayer();
    const startX = player.x;
    const panTarget = Math.min(startX + REGION_WIDTH * 2, WORLD_WIDTH - GAME_WIDTH / 2);

    // Detach camera from player during pan
    cam.stopFollow();

    // Pan right
    cam.pan(panTarget, WORLD_HEIGHT / 2, 2500, 'Sine.easeInOut', false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) {
        // Pause briefly, then pan back
        this.time.delayedCall(400, () => {
          cam.pan(startX, WORLD_HEIGHT / 2, 1800, 'Sine.easeInOut', false, (_cam2: Phaser.Cameras.Scene2D.Camera, progress2: number) => {
            if (progress2 === 1) {
              this.introPanning = false;
              this.cameraSystem.setTarget(player);
            }
          });
        });
      }
    });
  }

  private spawnDamageNumber(x: number, y: number, amount: number, isCombo = false): void {
    const color = isCombo ? '#ffdd44' : '#ffffff';
    const text = this.add.text(x, y - 10, `${amount}`, {
      fontSize: isCombo ? '16px' : '13px',
      fontFamily: 'monospace',
      color,
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5).setDepth(200);
    this.tweens.add({
      targets: text,
      y: y - 70,
      alpha: 0,
      duration: 800,
      ease: 'Sine.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  private emitMinimapData(): void {
    const player = this.playerSystem.getPlayer();
    const enemies: { x: number; y: number; type: string }[] = [];

    for (const w of this.wraiths) {
      if (w.active) enemies.push({ x: w.x, y: w.y, type: 'wraith' });
    }
    for (const c of this.crawlers) {
      if (c.active && !c.isDead) enemies.push({ x: c.x, y: c.y, type: 'crawler' });
    }
    const bossSprite = this.bossSystem.getBossSprite();
    if (bossSprite && bossSprite.active) {
      enemies.push({ x: bossSprite.x, y: bossSprite.y, type: 'boss' });
    }

    const fragments = this.fragments.map(f => ({
      x: f.x, y: f.y, collected: f.collected,
    }));

    this.scene.get('UIScene').events.emit('minimap-update', {
      playerX: player.x,
      playerY: player.y,
      enemies,
      fragments,
    });
  }
}
