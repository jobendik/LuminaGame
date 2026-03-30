import Phaser from 'phaser';
import { ASSET_KEYS, COMBAT, DAWN_PARALLAX_LAYERS, GAME_HEIGHT, GAME_WIDTH, PLAYER_SHEET } from '../config';
import { PlayerSystem } from '../systems/PlayerSystem';
import { CameraSystem } from '../systems/CameraSystem';
import { ParallaxSystem } from '../systems/ParallaxSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { AbilitySystem } from '../systems/AbilitySystem';
import { AudioSystem } from '../systems/AudioSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { CheckpointSystem } from '../systems/CheckpointSystem';
import { DialogueSystem } from '../systems/DialogueSystem';
import { createPlatforms } from '../entities/Platform';
import { Enemy, WraithConfig } from '../entities/Enemy';
import { Crawler, CrawlerConfig } from '../entities/Crawler';
import { NPC } from '../entities/NPC';
import { Beacon, BeaconConfig } from '../entities/Beacon';
import { RestBench, BenchConfig } from '../entities/RestBench';
import { MemoryFragment } from '../entities/MemoryFragment';
import { MovingPlatform, MovingPlatformConfig } from '../entities/MovingPlatform';
import { WindZone, WindZoneConfig } from '../entities/WindZone';
import { Blast } from '../entities/Blast';
import { ToastSystem } from '../ui/ToastSystem';
import { AbilityId } from '../types';
import { JumpAbility } from '../abilities/JumpAbility';
import { DashAbility } from '../abilities/DashAbility';
import { GlideAbility } from '../abilities/GlideAbility';
import { HeavyFormAbility } from '../abilities/HeavyFormAbility';
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
  private combatSystem!: CombatSystem;
  private checkpointSystem!: CheckpointSystem;
  private dialogueSystem!: DialogueSystem;
  private toastSystem!: ToastSystem;
  private debugMode = false;
  private door!: Phaser.GameObjects.Container;
  private doorZone!: Phaser.GameObjects.Zone;
  private doorPrompt!: Phaser.GameObjects.Text;
  private playerNearDoor = false;
  private incomingStats: EndingStats | null = null;
  private wraiths: Enemy[] = [];
  private crawlers: Crawler[] = [];
  private npcs: NPC[] = [];
  private nearestNpc: NPC | null = null;
  private beacons: Beacon[] = [];
  private benches: RestBench[] = [];
  private fragments: MemoryFragment[] = [];
  private collectedCount = 0;
  private movingPlatforms: MovingPlatform[] = [];
  private windZones: WindZone[] = [];
  private hazards!: Phaser.Physics.Arcade.StaticGroup;
  private blasts!: Phaser.Physics.Arcade.Group;
  private eKey!: Phaser.Input.Keyboard.Key;
  private eHoldTime = 0;
  private holdProgressRing: Phaser.GameObjects.Graphics | null = null;
  private benchHoldRing: Phaser.GameObjects.Graphics | null = null;

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
    this.abilitySystem.register(new HeavyFormAbility());
    this.abilitySystem.unlock(AbilityId.JUMP);
    this.abilitySystem.unlock(AbilityId.DASH);
    this.abilitySystem.unlock(AbilityId.GLIDE);
    this.abilitySystem.unlock(AbilityId.HEAVY_FORM);

    this.parallaxSystem = new ParallaxSystem(this, DAWN_PARALLAX_LAYERS);
    this.parallaxSystem.create();

    this.particleSystem = new ParticleSystem(this);
    this.particleSystem.create();

    this.audioSystem = new AudioSystem(this);
    this.audioSystem.create();

    this.toastSystem = new ToastSystem(this);

    // --- Platforms ---
    const platforms = createPlatforms(this, ASSET_KEYS.PLATFORM, [
      // Ground floor
      { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT - 16, scaleX: 30, scaleY: 1 },

      // Ember Fields (0–1280) — warm-up zone
      { x: 350, y: 570 },
      { x: 560, y: 480 },
      { x: 800, y: 540 },
      { x: 1050, y: 450 },

      // Ashen Corridors (1280–2560) — mid section
      { x: 1350, y: 560 },
      { x: 1550, y: 440 },
      { x: 1800, y: 520 },
      { x: 2000, y: 400 },
      { x: 2200, y: 480 },
      { x: 2400, y: 370 },

      // Crimson Heights (2560–3840) — final platforming
      { x: 2650, y: 540 },
      { x: 2850, y: 420 },
      { x: 3050, y: 500 },
      { x: 3250, y: 380 },
      { x: 3500, y: 460 },
      { x: 3700, y: 350 },
    ]);

    // --- Moving Platforms ---
    const movingPlatConfigs: MovingPlatformConfig[] = [
      { x: 900, y: 480, type: 'oscillating', axis: 'horizontal', distance: 140, speed: 55 },
      { x: 1750, y: 400, type: 'oscillating', axis: 'vertical', distance: 110, speed: 50 },
      { x: 2550, y: 450, type: 'oscillating', axis: 'horizontal', distance: 150, speed: 60 },
      { x: 3150, y: 360, type: 'crumbling' },
      { x: 3450, y: 340, type: 'crumbling' },
    ];
    this.movingPlatforms = movingPlatConfigs.map((cfg) => new MovingPlatform(this, cfg));

    // --- Wind Zone ---
    const windConfigs: WindZoneConfig[] = [
      { x: 2900, y: WORLD_HEIGHT - 200, width: 220, height: 400, strength: 280 },
      { x: 3400, y: WORLD_HEIGHT - 250, width: 180, height: 450, strength: -320 },
    ];
    this.windZones = windConfigs.map((cfg) => new WindZone(this, cfg));

    // --- Player ---
    this.playerSystem = new PlayerSystem(this, this.abilitySystem);
    const player = this.playerSystem.create(100, WORLD_HEIGHT - 100);

    // --- Collisions ---
    this.physics.add.collider(player, platforms);

    // Moving platform collisions
    for (const mp of this.movingPlatforms) {
      this.physics.add.collider(player, mp, () => {
        mp.onPlayerStand();
      });
    }

    // Wind zone overlaps
    for (const wz of this.windZones) {
      this.physics.add.overlap(player, wz.getZone(), () => {
        this.playerSystem.windVelocity = wz.strength;
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
      { x: 200, y: WORLD_HEIGHT - 32, id: 'dawn-cp-start' },
      { x: 1300, y: WORLD_HEIGHT - 32, id: 'dawn-cp-mid1' },
      { x: 2450, y: WORLD_HEIGHT - 32, id: 'dawn-cp-mid2' },
      { x: 3700, y: WORLD_HEIGHT - 32, id: 'dawn-cp-end' },
    ]);

    // --- Combat ---
    this.combatSystem = new CombatSystem(
      this,
      () => this.checkpointSystem.getSpawnPoint(),
    );
    this.combatSystem.setPlayer(player);

    // --- Hazards (ember thorns) ---
    this.hazards = this.physics.add.staticGroup();
    const hazardPositions = [
      { x: 1200, y: WORLD_HEIGHT - 16, count: 3, spacing: 22 },
      { x: 2450, y: WORLD_HEIGHT - 16, count: 3, spacing: 22 },
      { x: 3300, y: WORLD_HEIGHT - 16, count: 4, spacing: 22 },
    ];
    for (const h of hazardPositions) {
      const totalWidth = (h.count - 1) * h.spacing;
      for (let i = 0; i < h.count; i++) {
        const thornX = h.x - totalWidth / 2 + i * h.spacing;
        const thorn = this.hazards.create(thornX, h.y, ASSET_KEYS.HAZARD_THORN) as Phaser.Physics.Arcade.Sprite;
        thorn.setOrigin(0.5, 1);
        thorn.setDepth(2);
        thorn.refreshBody();
      }
    }
    this.physics.add.overlap(player, this.hazards, () => {
      this.combatSystem.damagePlayer(1, player.x, player.y + 10, 'Burned by ember thorns');
    });

    // --- Wraith Enemies ---
    const wraithConfigs: WraithConfig[] = [
      { x1: 1500, x2: 1700, y: WORLD_HEIGHT - 120, speed: 0.0016, aggroRadius: 180 },
      { x1: 2700, x2: 2900, y: WORLD_HEIGHT - 130, speed: 0.0018, aggroRadius: 180 },
      { x1: 3300, x2: 3500, y: WORLD_HEIGHT - 110, speed: 0.0015, aggroRadius: 180 },
    ];
    this.wraiths = wraithConfigs.map((cfg, i) => {
      const wraith = new Enemy(this, cfg, i);
      wraith.setPlayer(player);
      this.physics.add.overlap(player, wraith, () => {
        this.combatSystem.damagePlayer(1, wraith.x, wraith.y, 'A dawn wraith strikes you');
      });
      return wraith;
    });

    // Wraith orb projectile overlap
    this.events.on('wraith-orb-spawned', (orb: Phaser.GameObjects.Arc) => {
      this.physics.add.overlap(player, orb, () => {
        if (!orb.active) return;
        this.combatSystem.damagePlayer(1, orb.x, orb.y, 'A shadow orb burns you');
        this.particleSystem.emitEnemyHitBurst(orb.x, orb.y);
        orb.destroy();
      });
    });

    // --- Crawler Enemies ---
    const crawlerConfigs: CrawlerConfig[] = [
      { x: 600, y: WORLD_HEIGHT - 48, patrolLeft: 500, patrolRight: 750 },
      { x: 1600, y: WORLD_HEIGHT - 48, patrolLeft: 1500, patrolRight: 1750 },
      { x: 2350, y: WORLD_HEIGHT - 48, patrolLeft: 2300, patrolRight: 2550 },
    ];
    this.crawlers = crawlerConfigs.map((cfg) => {
      const crawler = new Crawler(this, cfg);
      crawler.setPlayer(player);
      this.physics.add.collider(crawler, platforms);
      this.physics.add.overlap(player, crawler, () => {
        if (!crawler.isDead) {
          this.combatSystem.damagePlayer(1, crawler.x, crawler.y, 'An ember crawler bites you');
        }
      });
      return crawler;
    });

    // --- NPCs ---
    const dawnNpcConfigs = [
      {
        x: 300,
        y: 688,
        name: 'Solara, Dawn Keeper',
        colors: { skin: 0xf5d6c0, robe: 0x993322, hair: 0xff8844, glow: 0xffaa66 },
        spriteKey: 'npc1-sprite',
        portraitKey: 'npc1-portrait',
        lines: [
          { speaker: 'Solara', text: 'The dawn sky burns with the memory of a world reborn.' },
          { speaker: 'Solara', text: 'The creatures here are remnants — echoes of the Nightmaw\'s influence.' },
          { speaker: 'Solara', text: 'You have proven your strength before. Now prove your endurance.' },
          { speaker: 'Solara', text: 'Find the embers scattered across the fields. They keep the dawn alive.' },
        ],
      },
      {
        x: 2100,
        y: 688,
        name: 'Cael, Ashen Scout',
        colors: { skin: 0xe0c0a0, robe: 0x554433, hair: 0x3a2a1a, glow: 0xcc8844 },
        spriteKey: 'npc3-sprite',
        portraitKey: 'npc3-portrait',
        lines: [
          { speaker: 'Cael', text: 'The wind in the Crimson Heights is relentless. Heavy Form might help you stay grounded.' },
          { speaker: 'Cael', text: 'I have seen ember fragments glowing on high ledges. You will need to platform carefully.' },
          { speaker: 'Cael', text: 'The wraiths here are bolder at dawn. They lunge without warning.' },
        ],
      },
    ];
    this.npcs = dawnNpcConfigs.map((cfg, i) => new NPC(this, cfg, i));

    // --- Dialogue ---
    this.dialogueSystem = new DialogueSystem(this);
    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // --- Rest Benches ---
    const benchConfigs: BenchConfig[] = [
      { x: 950, y: WORLD_HEIGHT - 32 },
      { x: 2000, y: WORLD_HEIGHT - 32 },
      { x: 3100, y: WORLD_HEIGHT - 32 },
    ];
    this.benches = benchConfigs.map((cfg) => new RestBench(this, cfg));

    // --- Beacons ---
    const beaconConfigs: BeaconConfig[] = [
      { x: 1100, y: WORLD_HEIGHT - 32, label: 'Ember Beacon' },
      { x: 2500, y: WORLD_HEIGHT - 32, label: 'Dawn Beacon' },
    ];
    this.beacons = beaconConfigs.map((cfg, i) => new Beacon(this, cfg, i));

    // --- Memory Fragments (collectible embers) ---
    const fragmentPositions = [
      { x: 560, y: 430, id: 'dawn-frag-1' },
      { x: 1550, y: 390, id: 'dawn-frag-2' },
      { x: 2400, y: 320, id: 'dawn-frag-3' },
      { x: 3700, y: 300, id: 'dawn-frag-4' },
    ];
    for (const pos of fragmentPositions) {
      const frag = new MemoryFragment(this, pos.x, pos.y, ASSET_KEYS.MEMORY_FRAGMENT, pos.id);
      this.fragments.push(frag);
      this.physics.add.overlap(player, frag, () => {
        if (!frag.collected) {
          frag.collect();
          this.collectedCount++;
          this.particleSystem.emitCollectBurst(frag.x, frag.y);
          this.cameraSystem.zoomPulse(0.02, 300);
          this.audioSystem.playSFX('sfx-collect', 0.4);
          this.toastSystem.show(`Ember fragment ${this.collectedCount}/4 recovered.`, '#ffcc88');
          this.cameras.main.flash(200, 255, 180, 100, false);
        }
      });
    }

    // --- Blast system ---
    this.blasts = this.physics.add.group({ runChildUpdate: true });

    // --- Combat events ---
    this.events.on('player-hurt', () => {
      this.playerSystem.enterHurtState();
    });

    this.events.on('player-damaged', (health: number, maxHealth: number) => {
      const p = this.playerSystem.getPlayer();
      this.particleSystem.emitDamageBurst(p.x, p.y);
      this.cameras.main.flash(150, 180, 40, 40, false);
    });

    this.events.on('player-died', (reason: string) => {
      const deathText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'FADING...', {
        fontFamily: 'Georgia, serif', fontSize: '32px', color: '#cc8888',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setAlpha(0);
      const reasonText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, reason, {
        fontFamily: 'Georgia, serif', fontSize: '16px', color: '#887788',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setAlpha(0);
      this.tweens.add({ targets: deathText, alpha: 0.9, duration: 250 });
      this.tweens.add({ targets: reasonText, alpha: 0.7, duration: 300, delay: 100 });
      this.time.delayedCall(COMBAT.RESPAWN_DELAY + 200, () => {
        this.tweens.add({
          targets: [deathText, reasonText], alpha: 0, duration: 300,
          onComplete: () => { deathText.destroy(); reasonText.destroy(); },
        });
      });
    });

    this.events.on('respawn-bloom', (x: number, y: number) => {
      this.particleSystem.emitRespawnBloom(x, y);
      this.audioSystem.playSFX('sfx-checkpoint', 0.3);
      this.cameraSystem.shake(0.002, 60);
    });

    this.events.on('player-respawned', (health: number, maxHealth: number) => {
      // health restored on respawn
    });

    this.events.on('play-sfx', (key: string, volume: number) => {
      this.audioSystem.playSFX(key, volume);
    });

    // --- Movement events ---
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
      this.parallaxSystem.applyVelocityBoost(0.3);
    });

    this.events.on('dash-cooldown-start', (_duration: number) => {
      // no UIScene in DawnScene
    });

    this.events.on('player-dash-trail', (x: number, y: number) => {
      this.particleSystem.emitDashTrail(x, y);
    });

    this.events.on('player-glide-trail', (x: number, y: number) => {
      this.particleSystem.emitGlideTrail(x, y + 10);
    });

    this.events.on('player-wall-slide-trail', (x: number, y: number) => {
      this.particleSystem.emitDust(x, y + 8, 0.3);
    });

    this.events.on('player-wall-jump', (x: number, y: number) => {
      this.particleSystem.emitCollectBurst(x, y, 0xccddff);
      this.audioSystem.playSFX('sfx-land', 0.2);
    });

    this.events.on('player-wall-slide', () => {
      this.audioSystem.playSFX('sfx-land', 0.1);
    });

    // --- Attack events ---
    this.events.on('player-attack', (x: number, y: number, dir: number, comboStep: number) => {
      this.particleSystem.emitAttackSlash(x, y, dir, comboStep);
      this.audioSystem.playSFX('sfx-attack', 0.35);
      const isCombo = comboStep === 2;
      this.cameraSystem.shake(isCombo ? 0.004 : 0.002, isCombo ? 80 : 50);
      if (isCombo) {
        this.time.timeScale = 0.15;
        this.time.delayedCall(60, () => { this.time.timeScale = 1; });
      }
      const dmgMult = isCombo ? 1.5 : 1;
      const meleeDmg = Math.round(COMBAT.ATTACK_DAMAGE * dmgMult);

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
    });

    this.events.on('player-blast-request', () => {
      if (this.combatSystem.canBlast()) {
        this.combatSystem.useBlastCharge();
        this.playerSystem.enterBlastState();
      }
    });

    this.events.on('player-blast', (x: number, y: number, dir: number) => {
      this.particleSystem.emitBlastLaunch(x, y, dir);
      this.audioSystem.playSFX('sfx-blast', 0.4);
      this.cameraSystem.shake(0.003, 60);
      const blast = new Blast(this, x, y, dir);
      this.blasts.add(blast);

      for (const wraith of this.wraiths) {
        this.physics.add.overlap(blast, wraith, () => {
          if (!blast.active) return;
          const bd = blast.body ? Math.sign((blast.body as Phaser.Physics.Arcade.Body).velocity.x) : 1;
          wraith.takeDamage(COMBAT.BLAST_DAMAGE, bd);
          this.particleSystem.emitEnemyHitBurst(wraith.x, wraith.y);
          this.audioSystem.playSFX('sfx-enemy-hit', 0.3);
          this.combatSystem.addBlastCharge(1);
          this.spawnDamageNumber(wraith.x, wraith.y, COMBAT.BLAST_DAMAGE);
          blast.destroy();
        });
      }
      for (const crawler of this.crawlers) {
        this.physics.add.overlap(blast, crawler, () => {
          if (!blast.active || crawler.isDead) return;
          const bd = blast.body ? Math.sign((blast.body as Phaser.Physics.Arcade.Body).velocity.x) : 1;
          crawler.takeDamage(COMBAT.BLAST_DAMAGE, bd);
          this.particleSystem.emitEnemyHitBurst(crawler.x, crawler.y);
          this.audioSystem.playSFX('sfx-enemy-hit', 0.3);
          this.combatSystem.addBlastCharge(1);
          this.spawnDamageNumber(crawler.x, crawler.y, COMBAT.BLAST_DAMAGE);
          blast.destroy();
        });
      }
    });

    this.events.on('blast-trail', (x: number, y: number) => {
      this.particleSystem.emitBlastTrail(x, y);
    });

    this.events.on('blast-impact', (x: number, y: number) => {
      this.particleSystem.emitBlastImpact(x, y);
    });

    this.events.on('enemy-death', (x: number, y: number, type: string) => {
      this.particleSystem.emitEnemyDeath(x, y, type);
      this.audioSystem.playSFX('sfx-enemy-death', 0.35);
      this.cameraSystem.shake(0.002, 60);
      this.time.timeScale = 0.15;
      this.time.delayedCall(80, () => { this.time.timeScale = 1; });
    });

    this.events.on('heavy-form-activated', () => {
      this.toastSystem.show('Heavy Form activated.', '#8888cc');
      this.audioSystem.playSFX('sfx-land', 0.3);
      this.cameraSystem.shake(0.006, 150);
      this.particleSystem.emitCollectBurst(player.x, player.y + 20, 0x666688);
    });

    this.events.on('heavy-form-deactivated', () => {
      this.toastSystem.show('Heavy Form deactivated.', '#aaaacc');
      this.audioSystem.playSFX('sfx-land', 0.15);
    });

    this.events.on('checkpoint-activated', () => {
      const cpPoint = this.checkpointSystem.getSpawnPoint();
      this.particleSystem.emitCollectBurst(cpPoint.x, cpPoint.y, 0xffdd88);
      this.cameras.main.flash(150, 255, 220, 130, false);
      this.cameraSystem.zoomPulse(0.01, 200);
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
      scaleY: { from: PLAYER_SHEET.SCALE, to: PLAYER_SHEET.SCALE * 1.01 },
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

    // Reset wind velocity each frame
    this.playerSystem.windVelocity = 0;

    // Hit freeze
    if (this.combatSystem.isFrozen) {
      this.combatSystem.update(delta);
      return;
    }

    this.combatSystem.update(delta);
    if (!this.dialogueSystem.isOpen) {
      this.playerSystem.update(delta);
    }
    this.cameraSystem.update();
    this.parallaxSystem.update();
    this.checkpointSystem.update();

    // NPC proximity & dialogue
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
        this.combatSystem.setInvincible(true);
        this.dialogueSystem.open(
          this.nearestNpc.getCurrentLines(),
          () => { this.combatSystem.setInvincible(false); },
          this.nearestNpc.colors,
          this.nearestNpc.portraitKey,
        );
      }
    }

    // Beacon hold-E activation
    const BEACON_DIST = 60;
    const BEACON_HOLD = 800;
    let nearBeacon: Beacon | null = null;
    for (const beacon of this.beacons) {
      beacon.update(_time);
      const dist = Phaser.Math.Distance.Between(player.x, player.y, beacon.x, beacon.y);
      if (dist < BEACON_DIST && !beacon.active) {
        nearBeacon = beacon;
        beacon.showPrompt();
      } else {
        beacon.hidePrompt();
      }
    }
    if (nearBeacon && this.eKey.isDown && !this.dialogueSystem.isOpen) {
      this.eHoldTime += delta;
      this.drawHoldRing(nearBeacon.x, nearBeacon.y - 70, this.eHoldTime / BEACON_HOLD);
      if (this.eHoldTime >= BEACON_HOLD) {
        this.eHoldTime = 0;
        this.clearHoldRing();
        nearBeacon.activate();
        this.audioSystem.playSFX('sfx-beacon', 0.4);
        this.toastSystem.show(`${nearBeacon.beaconLabel} is lit!`, '#ffcc88');
        this.particleSystem.emitCollectBurst(nearBeacon.x, nearBeacon.y - 56);
        this.cameraSystem.shake(0.005, 200);
        this.cameras.main.flash(250, 255, 220, 140, false);
        this.cameraSystem.zoomPulse(0.03, 500);
      }
    } else {
      this.eHoldTime = 0;
      this.clearHoldRing();
    }

    // Bench proximity & hold-E to heal
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

    // Door interaction — press Up/W near the door
    if (this.playerNearDoor) {
      const up = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      if (this.input.keyboard?.checkDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP)) ||
          (up && this.input.keyboard?.checkDown(up))) {
        this.enterDoor();
      }
    }
  }

  private drawHoldRing(x: number, y: number, progress: number): void {
    if (!this.holdProgressRing) {
      this.holdProgressRing = this.add.graphics();
      this.holdProgressRing.setDepth(200);
    }
    this.holdProgressRing.clear();
    const radius = 18;
    const t = Phaser.Math.Clamp(progress, 0, 1);
    this.holdProgressRing.lineStyle(3, 0x444466, 0.3);
    this.holdProgressRing.strokeCircle(x, y, radius);
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI * 2 * t;
    this.holdProgressRing.lineStyle(3, 0xffd080, 0.9);
    this.holdProgressRing.beginPath();
    this.holdProgressRing.arc(x, y, radius, startAngle, endAngle, false);
    this.holdProgressRing.strokePath();
  }

  private clearHoldRing(): void {
    if (this.holdProgressRing) this.holdProgressRing.clear();
  }

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

  private clearBenchRing(): void {
    if (this.benchHoldRing) this.benchHoldRing.clear();
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
