import Phaser from 'phaser';
import { CFG, COLORS } from '../config';

// Builders
import { buildProceduralAssets } from '../procedural';
import { buildBackground, updateFloatingElements, updateMist } from '../world/Background';
import { buildGround } from '../world/Ground';
import { buildPlatforms, buildCrumblePlatforms, updateCrumblePlatforms } from '../world/Platforms';
import { buildEffects } from '../world/Effects';
import { buildNPCs, updateNpcAnimation } from '../entities/NPC';
import { buildCreatures, updateCreatures } from '../entities/Creature';
import { buildPages, buildBeacons, buildSecrets, updateQuestCollectibles, updateSecrets } from '../systems/QuestSystem';
import { buildHUD, updateHUD } from '../ui/HUD';
import { buildCheckpoints, updateCheckpoints } from '../world/Checkpoints';
import { buildHazards } from '../world/Hazards';
import { buildPortal, updatePortal } from '../entities/Portal';
import { buildStormFX, updateStorm } from '../systems/StormSystem';
import { buildBoss, updateBoss } from '../systems/BossSystem';
import { buildWraiths, updateWraiths } from '../entities/Wraith';
import { buildDialogueUI } from '../systems/DialogueSystem';
import { buildIntro } from '../ui/IntroOverlay';
import { buildPauseMenu } from '../ui/PauseMenu';
import { buildCursor, buildPostFX, updateCursor, updatePostFX } from '../ui/Cursor';
import { buildEndingOverlay } from '../ui/EndingOverlay';
import { buildToastLayer, showToast } from '../ui/ToastSystem';
import { bindKeys } from '../systems/InputManager';

// Updaters
import { updateAudioMood } from '../systems/AudioSystem';
import { updatePlayerMovement, updateDashTrails } from '../systems/PlayerController';
import { buildPlayer } from '../entities/Player';

export class GameScene extends Phaser.Scene {
  // --- Game State ---
  public questCount: number = 0;
  public questTarget: number = 3;
  public beaconCount: number = 0;
  public beaconTarget: number = 2;
  public secretCount: number = 0;
  public secretTarget: number = 3;
  
  public questFinished: boolean = false;
  public finalBlessingDone: boolean = false;
  public endingSeen: boolean = false;
  public storyStarted: boolean = false;
  public portalOpened: boolean = false;
  public soundStarted: boolean = false;
  public stormActive: boolean = false;
  public stormResolved: boolean = false;
  public damageLocked: boolean = false;
  public isRespawning: boolean = false;
  public pausedGame: boolean = false;
  public currentAreaIndex: number = -1;
  public audioMood: string = 'calm';
  public maxHealth: number = CFG.MAX_HP;
  public health: number = CFG.MAX_HP;
  
  public wasOnFloor: boolean = false;
  public playerFacing: number = 1;
  public isDashing: boolean = false;
  public dashReady: boolean = true;
  
  public currentDialogLine: number = 0;
  public inDialog: boolean = false;
  public activeNpc: any = null;
  public nearNpc: any = null;
  public nearBeacon: any = null;
  
  public coyoteTimer: number = 0;
  public jumpBuffered: boolean = false;
  public jumpBufferTimer: number = 0;
  public wallSliding: boolean = false;
  public canWallJump: boolean = false;
  public wallDir: number = 0;
  
  public dashTrails: any[] = [];
  public hitFreezeTimer: number = 0;
  
  public checkpoint = { x: 220, y: 460, label: 'Start of the path' };

  // --- Entities & Groups ---
  public player!: Phaser.Physics.Arcade.Sprite;
  public ground!: Phaser.GameObjects.Rectangle;
  public platforms!: Phaser.Physics.Arcade.StaticGroup;
  public platformVisuals: Phaser.GameObjects.Graphics[] = [];
  public crumblePlatforms: any[] = [];
  
  public npcs: any[] = [];
  public creatures: any[] = [];
  public pages: any[] = [];
  public beacons: any[] = [];
  public secrets: any[] = [];
  public checkpoints: any[] = [];
  public thorns!: Phaser.Physics.Arcade.StaticGroup;
  public hazardRects: any[] = [];
  public wraiths: any[] = [];
  
  // --- Portal & Storm & Boss ---
  public portal!: Phaser.GameObjects.Container;
  public portalGlow!: Phaser.GameObjects.Arc;
  public portalRing!: Phaser.GameObjects.Image;
  public portalInner!: Phaser.GameObjects.Arc;
  public portalText!: Phaser.GameObjects.Text;
  public portalEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  
  public stormShade!: Phaser.GameObjects.Rectangle;
  public stormFront!: Phaser.GameObjects.Ellipse;
  public stormWarning!: Phaser.GameObjects.Text;
  public stormSpeed: number = 0;
  public stormWallX: number = 0;
  public stormPulseEvent?: Phaser.Time.TimerEvent;
  
  public boss: any;
  public bossGlow!: Phaser.GameObjects.Arc;
  public bossSprite!: Phaser.GameObjects.Sprite;
  public bossBolts!: Phaser.Physics.Arcade.Group;

  // --- UI Elements ---
  public dialogueTypingEvent?: Phaser.Time.TimerEvent;
  public dialogueFullText: string = '';
  public dialogueCharIndex: number = 0;
  public dialogueIsTyping: boolean = false;
  
  public dialogue!: Phaser.GameObjects.Container;
  public dialoguePortrait!: Phaser.GameObjects.Image;
  public dialogueSpeaker!: Phaser.GameObjects.Text;
  public dialogueLine!: Phaser.GameObjects.Text;
  public dialogueContinue!: Phaser.GameObjects.Text;
  public promptBubble!: Phaser.GameObjects.Container;
  public endingOverlay!: Phaser.GameObjects.Container;
  public endingBody!: Phaser.GameObjects.Text;
  public introOverlay!: Phaser.GameObjects.Container;
  public pauseMenu!: Phaser.GameObjects.Container;
  public toastLayer!: Phaser.GameObjects.Container;
  public customCursor!: Phaser.GameObjects.Image;
  
  public hudContainer!: Phaser.GameObjects.Container;
  public hudTitle!: Phaser.GameObjects.Text;
  public hudHearts!: Phaser.GameObjects.Text;
  public hudObjective!: Phaser.GameObjects.Text;
  public hudDash!: Phaser.GameObjects.Text;
  public hudArea!: Phaser.GameObjects.Text;

  // --- Effects ---
  public vignette!: Phaser.GameObjects.Image;
  public auroraGraphics!: Phaser.GameObjects.Graphics;
  public floatingLights: Phaser.GameObjects.Arc[] = [];
  public mistBands: any[] = [];
  
  public ambientParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  public jumpParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  public trailParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  public pageGlowParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  public weatherParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  public portalBurst!: Phaser.GameObjects.Particles.ParticleEmitter;
  public damageParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  public checkpointParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  public secretParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

  // --- Input ---
  public cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  public keys!: any;

  // --- Audio ---
  public audioCtx?: AudioContext;
  public audioReverb?: ConvolverNode;
  public bgmMusic?: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Generate procedural assets here for now
    this.load.audio('bgm', '/assets/audio/bgm.mp3');
  }

  create() {
    // Setup camera bounds
    this.physics.world.setBounds(0, 0, CFG.WORLD_W, CFG.H + 320);
    this.cameras.main.setBounds(0, 0, CFG.WORLD_W, CFG.H);
    this.cameras.main.fadeIn(1800, 0, 0, 0);

    buildProceduralAssets(this);
    buildBackground(this);
    buildGround(this);
    buildPlatforms(this);
    buildPlayer(this);
    buildCrumblePlatforms(this);
    buildEffects(this);
    buildNPCs(this);
    buildCreatures(this);
    buildPages(this);
    buildBeacons(this);
    buildSecrets(this);
    buildHUD(this);
    buildCheckpoints(this);
    buildHazards(this);
    buildWraiths(this);
    buildPortal(this);
    buildStormFX(this);
    buildBoss(this);
  
    buildDialogueUI(this);
    buildEndingOverlay(this);
    buildIntro(this);
    buildPauseMenu(this);
    buildToastLayer(this);
    buildPostFX(this);
    buildCursor(this);
    bindKeys(this);

    this.cameras.main.startFollow(this.player, true, 0.06, 0.06, 0, 20);

    this.scale.on('resize', (gs: any) => {
      this.cameras.main.setViewport(0, 0, gs.width, gs.height);
      if (this.dialogue) { this.dialogue.x = gs.width / 2; this.dialogue.y = gs.height - 200; }
      if (this.introOverlay) { this.introOverlay.x = gs.width / 2; this.introOverlay.y = gs.height / 2; }
      if (this.endingOverlay) { this.endingOverlay.x = gs.width / 2; this.endingOverlay.y = gs.height / 2; }
      if (this.toastLayer) { this.toastLayer.x = gs.width / 2; this.toastLayer.y = 80; }
      if (this.pauseMenu) { this.pauseMenu.x = gs.width / 2; this.pauseMenu.y = gs.height / 2; }
      if (this.hudContainer) { this.hudContainer.x = 22; this.hudContainer.y = 18; }
      if (this.vignette) { this.vignette.setPosition(gs.width / 2, gs.height / 2); this.vignette.setDisplaySize(gs.width + 20, gs.height + 20); }
    });

    updateHUD(this);
  }

  update(time: number, delta: number) {
    if (!this.player) return;

    if (this.hitFreezeTimer > 0) {
      this.hitFreezeTimer -= delta;
      return;
    }

    if (this.pausedGame) return;

    this.updateAreaPacing();
    updateAudioMood(this);
    updatePlayerMovement(this, time, delta);
    updateDashTrails(this, delta);
    this.updateNearbyNpc();
    this.updateNearbyBeacon();
    updateQuestCollectibles(this);
    updateSecrets(this);
    updateCheckpoints(this);
    updatePortal(this, time);
    updateWraiths(this, time, delta);
    updateStorm(this, delta, time);
    updateBoss(this, time, delta);
    updateFloatingElements(this, time);
    updateNpcAnimation(this, time);
    updateMist(this, time);
    updateCreatures(this, time);
    updateCrumblePlatforms(this);
    updateHUD(this);
    updateCursor(this);
    updatePostFX(this, time);
  }

  // --- Misc Helpers ---
  private updateAreaPacing() {
    if (!this.storyStarted || this.endingSeen) return;
    const x = this.player.x;
    let idx = 0;
    if (x >= 4200) idx = 3;
    else if (x >= 2800) idx = 2;
    else if (x >= 1400) idx = 1;
    if (idx === this.currentAreaIndex) return;
    this.currentAreaIndex = idx;
    const areas = [
      { name: 'Stardust Path', color: '#c8e8ff', mood: 'calm' },
      { name: 'Shadow Terrace', color: '#ffc8a0', mood: 'tense' },
      { name: 'Stairs of Memory', color: '#ffe0a0', mood: 'urgent' },
      { name: 'Portal Chamber', color: '#e0c0f0', mood: 'boss' }
    ];
    const area = areas[idx];
    this.audioMood = area.mood;
    showToast(this, area.name, area.color);
    if (idx > 0) this.cameras.main.shake(160, 0.002 + idx * 0.0005);
    updateHUD(this);
  }

  private updateNearbyNpc() {
    if (!this.storyStarted || this.inDialog || this.endingOverlay.visible) {
      if (!this.nearBeacon) this.promptBubble.setVisible(false);
      this.nearNpc = null; return;
    }
    let nearest: any = null, best = Infinity;
    this.npcs.forEach(npc => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.container.x, npc.container.y);
      if (d < 120 && d < best) { best = d; nearest = npc; }
    });
    this.nearNpc = nearest;
    if (nearest) {
      this.promptBubble.setVisible(true);
      this.promptBubble.x = nearest.container.x; this.promptBubble.y = nearest.container.y - 90;
    } else if (!this.nearBeacon) this.promptBubble.setVisible(false);
  }

  private updateNearbyBeacon() {
    if (!this.storyStarted || this.inDialog || this.endingOverlay.visible) {
      this.nearBeacon = null; if (!this.nearNpc) this.promptBubble.setVisible(false); return;
    }
    let nearest: any = null, best = Infinity;
    this.beacons.forEach(b => {
      if (b.active) return;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, b.sprite.x, b.sprite.y);
      if (d < 90 && d < best) { best = d; nearest = b; }
    });
    this.nearBeacon = nearest;
    if (nearest && !this.nearNpc) {
      this.promptBubble.setVisible(true);
      this.promptBubble.x = nearest.sprite.x; this.promptBubble.y = nearest.sprite.y - 74;
    } else if (!this.nearNpc) this.promptBubble.setVisible(false);
  }
}
