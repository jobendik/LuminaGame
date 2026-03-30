import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COMBAT, PHYSICS } from '../config';
import { DialogueSystem } from '../systems/DialogueSystem';

export class UIScene extends Phaser.Scene {
  private regionText!: Phaser.GameObjects.Text;
  private fragmentText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;

  // Minimap
  private minimapGraphics!: Phaser.GameObjects.Graphics;
  private minimapBg!: Phaser.GameObjects.Graphics;
  private minimapVisible = true;
  private minimapPlayerX = 0;
  private minimapPlayerY = 0;
  private minimapEnemies: { x: number; y: number; type: string }[] = [];
  private minimapFragments: { x: number; y: number; collected: boolean }[] = [];

  private static readonly MAP_W = 160;
  private static readonly MAP_H = 30;
  private static readonly MAP_X = GAME_WIDTH - 170;
  private static readonly MAP_Y = 10;
  private static readonly WORLD_W = 3840;
  private static readonly WORLD_H = 720;
  private questText!: Phaser.GameObjects.Text;
  private dashIndicator!: Phaser.GameObjects.Text;
  private blastIndicator!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private dashCooldownBar!: Phaser.GameObjects.Graphics;
  private dashCooldownTimer = 0;
  private dashCooldownTotal = 0;

  // Boss health bar
  private bossBarContainer!: Phaser.GameObjects.Container;
  private bossBarGraphics!: Phaser.GameObjects.Graphics;
  private bossNameText!: Phaser.GameObjects.Text;
  private bossBarVisible = false;
  private bossHealth = 0;
  private bossMaxHealth = 8;
  private bossArmor = 0;
  private bossMaxArmor = 4;
  private bossVulnerableText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    const chromeFont = '"Palatino Linotype", Georgia, serif';

    // Region name — fades in then out
    this.regionText = this.add.text(GAME_WIDTH / 2, 40, 'Silent Plains', {
      fontSize: '22px',
      fontFamily: chromeFont,
      color: '#88aadd',
    });
    this.regionText.setOrigin(0.5);
    this.regionText.setAlpha(0);
    this.regionText.setStroke('#081120', 4);

    const topLeftPanel = this.add.rectangle(118, 44, 210, 62, 0x091224, 0.72);
    topLeftPanel.setOrigin(0.5);
    topLeftPanel.setStrokeStyle(1, 0xb8d7f0, 0.1);

    const topRightPanel = this.add.rectangle(GAME_WIDTH - 92, 30, 132, 30, 0x091224, 0.72);
    topRightPanel.setOrigin(0.5);
    topRightPanel.setStrokeStyle(1, 0xb8d7f0, 0.1);

    const bottomRightPanel = this.add.rectangle(GAME_WIDTH - 94, GAME_HEIGHT - 30, 148, 42, 0x091224, 0.72);
    bottomRightPanel.setOrigin(0.5);
    bottomRightPanel.setStrokeStyle(1, 0xb8d7f0, 0.1);

    const controlsPanel = this.add.rectangle(150, GAME_HEIGHT - 34, 268, 48, 0x091224, 0.68);
    controlsPanel.setOrigin(0.5);
    controlsPanel.setStrokeStyle(1, 0xb8d7f0, 0.08);

    // Fade in the region name, hold, then fade out
    this.tweens.add({
      targets: this.regionText,
      alpha: 0.7,
      duration: 1500,
      ease: 'Sine.easeIn',
      hold: 2000,
      yoyo: true,
    });

    // Fragment counter (top-right, starts hidden)
    this.fragmentText = this.add.text(GAME_WIDTH - 30, 30, '', {
      fontSize: '16px',
      fontFamily: chromeFont,
      color: '#aaccff',
    });
    this.fragmentText.setOrigin(1, 0.5);
    this.fragmentText.setAlpha(0);

    // Health display (top-left)
    const hearts = '♥'.repeat(COMBAT.MAX_HEALTH);
    this.healthText = this.add.text(20, 20, hearts, {
      fontSize: '20px',
      fontFamily: chromeFont,
      color: '#ff6666',
    });
    this.healthText.setOrigin(0, 0.5);
    this.healthText.setAlpha(0.85);

    // Quest objective tracker (below health)
    this.questText = this.add.text(20, 44, '', {
      fontSize: '13px',
      fontFamily: chromeFont,
      color: '#c0d8f0',
    });
    this.questText.setOrigin(0, 0.5);
    this.questText.setAlpha(0);

    // Dash cooldown indicator (bottom-right)
    this.dashIndicator = this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 20, 'DASH ●', {
      fontSize: '13px',
      fontFamily: chromeFont,
      color: '#80eea0',
    });
    this.dashIndicator.setOrigin(1, 1);
    this.dashIndicator.setAlpha(0.6);

    // Blast charge indicator (above dash indicator)
    this.blastIndicator = this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 38, 'BLAST ●●●', {
      fontSize: '13px',
      fontFamily: chromeFont,
      color: '#88bbff',
    });
    this.blastIndicator.setOrigin(1, 1);
    this.blastIndicator.setAlpha(0.6);

    // Combo display (center-upper, starts hidden)
    this.comboText = this.add.text(GAME_WIDTH / 2, 90, '', {
      fontSize: '18px',
      fontFamily: chromeFont,
      color: '#ffd080',
    });
    this.comboText.setOrigin(0.5);
    this.comboText.setAlpha(0);

    // Dash cooldown arc bar (next to dash indicator)
    this.dashCooldownBar = this.add.graphics();
    this.dashCooldownBar.setDepth(2);

    // Ability keybindings (bottom-left)
    const controls = [
      'Move A/D or ←/→   Jump W or ↑   Dash Shift',
      'Glide Space   Attack J   Blast K   Interact E',
    ];
    const controlsText = this.add.text(20, GAME_HEIGHT - 22, controls.join('\n'), {
      fontSize: '11px',
      fontFamily: chromeFont,
      color: '#8ea7be',
      lineSpacing: 4,
    });
    controlsText.setOrigin(0, 1);
    controlsText.setAlpha(0.72);

    // Fade out controls after a few seconds
    this.tweens.add({
      targets: controlsText,
      alpha: 0,
      delay: 8000,
      duration: 2000,
    });

    // Listen for fragment collection updates from GameScene
    this.events.on('update-fragments', (collected: number, total: number) => {
      this.fragmentText.setText(`✦ ${collected} / ${total}`);
      if (this.fragmentText.alpha === 0) {
        this.tweens.add({
          targets: this.fragmentText,
          alpha: 0.8,
          duration: 500,
        });
      }
      // Pulse the counter on collection
      this.tweens.add({
        targets: this.fragmentText,
        scale: 1.3,
        duration: 150,
        yoyo: true,
        ease: 'Sine.easeOut',
      });
    });

    // Listen for health updates from GameScene
    this.events.on('update-health', (health: number, maxHealth: number) => {
      const filled = '♥'.repeat(Math.max(0, health));
      const empty = '♡'.repeat(Math.max(0, maxHealth - health));
      this.healthText.setText(filled + empty);

      // Flash red on damage
      if (health < maxHealth) {
        this.tweens.add({
          targets: this.healthText,
          scale: 1.3,
          duration: 100,
          yoyo: true,
          ease: 'Sine.easeOut',
        });
      }
    });

    // Listen for quest progress from GameScene
    this.events.on('update-quest', (progress: { fragments: { current: number; target: number }; beacons: { current: number; target: number }; isComplete: boolean }) => {
      if (progress.isComplete) {
        this.questText.setText('✦ All objectives complete');
        this.questText.setColor('#ffd080');
      } else {
        this.questText.setText(
          `Fragments: ${progress.fragments.current}/${progress.fragments.target}  ·  Beacons: ${progress.beacons.current}/${progress.beacons.target}`,
        );
      }
      if (this.questText.alpha === 0) {
        this.tweens.add({ targets: this.questText, alpha: 0.7, duration: 400 });
      }
      // Pulse on update
      this.tweens.add({
        targets: this.questText,
        scale: 1.15,
        duration: 120,
        yoyo: true,
        ease: 'Sine.easeOut',
      });
    });

    // Listen for dash cooldown from GameScene
    this.events.on('dash-cooldown-start', (duration: number) => {
      this.dashCooldownTimer = duration;
      this.dashCooldownTotal = duration;
      this.dashIndicator.setColor('#ff9966');
      this.dashIndicator.setText('DASH ○');
    });

    // Listen for blast charges update from GameScene
    this.events.on('blast-charges-changed', (current: number, max: number) => {
      const filled = '●'.repeat(Math.max(0, current));
      const empty = '○'.repeat(Math.max(0, max - current));
      this.blastIndicator.setText(`BLAST ${filled}${empty}`);
      this.blastIndicator.setColor(current > 0 ? '#88bbff' : '#ff9966');
      // Pulse on change
      this.tweens.add({
        targets: this.blastIndicator,
        scale: 1.2,
        duration: 100,
        yoyo: true,
        ease: 'Sine.easeOut',
      });
    });

    // Listen for combo step from player attack
    this.events.on('combo-step', (step: number, mult: number) => {
      const label = step === 2 ? `COMBO! x${mult}` : `HIT ${step}`;
      this.comboText.setText(label);
      this.comboText.setColor(step === 2 ? '#ffcc44' : '#ffd080');
      this.comboText.setAlpha(0.9);
      this.comboText.setScale(1);
      // Pop in
      this.tweens.add({
        targets: this.comboText,
        scale: step === 2 ? 1.4 : 1.15,
        duration: 80,
        yoyo: true,
        ease: 'Sine.easeOut',
      });
      // Fade out after hold
      this.tweens.add({
        targets: this.comboText,
        alpha: 0,
        delay: 500,
        duration: 300,
      });
    });

    // --- Minimap ---
    this.minimapBg = this.add.graphics();
    this.minimapBg.fillStyle(0x060e22, 0.7);
    this.minimapBg.fillRoundedRect(
      UIScene.MAP_X - 4, UIScene.MAP_Y - 4,
      UIScene.MAP_W + 8, UIScene.MAP_H + 8, 4
    );
    this.minimapBg.lineStyle(1, 0x4a6a9a, 0.3);
    this.minimapBg.strokeRoundedRect(
      UIScene.MAP_X - 4, UIScene.MAP_Y - 4,
      UIScene.MAP_W + 8, UIScene.MAP_H + 8, 4
    );
    this.minimapBg.setDepth(100);

    this.minimapGraphics = this.add.graphics();
    this.minimapGraphics.setDepth(101);

    // Listen for minimap data from GameScene
    this.events.on('minimap-update', (data: {
      playerX: number; playerY: number;
      enemies: { x: number; y: number; type: string }[];
      fragments: { x: number; y: number; collected: boolean }[];
    }) => {
      this.minimapPlayerX = data.playerX;
      this.minimapPlayerY = data.playerY;
      this.minimapEnemies = data.enemies;
      this.minimapFragments = data.fragments;
    });

    this.events.on('minimap-toggle', () => {
      this.minimapVisible = !this.minimapVisible;
      this.minimapBg.setVisible(this.minimapVisible);
      this.minimapGraphics.setVisible(this.minimapVisible);
    });

    // --- Boss Health Bar ---
    this.bossBarContainer = this.add.container(GAME_WIDTH / 2, 50);
    this.bossBarContainer.setDepth(200);
    this.bossBarContainer.setVisible(false);

    this.bossNameText = this.add.text(0, -18, 'THE NIGHTMAW', {
      fontSize: '12px',
      fontFamily: chromeFont,
      color: '#cc8899',
      letterSpacing: 4,
    }).setOrigin(0.5);

    this.bossBarGraphics = this.add.graphics();

    this.bossVulnerableText = this.add.text(0, 18, 'VULNERABLE!', {
      fontSize: '14px',
      fontFamily: 'Georgia, serif',
      color: '#ff6666',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    this.bossBarContainer.add([this.bossNameText, this.bossBarGraphics, this.bossVulnerableText]);

    // Listen for boss health changes
    this.events.on('boss-health-changed', (health: number, maxHealth: number, armor: number, maxArmor: number) => {
      this.bossHealth = health;
      this.bossMaxHealth = maxHealth;
      this.bossArmor = armor;
      this.bossMaxArmor = maxArmor;
      if (!this.bossBarVisible) {
        this.bossBarVisible = true;
        this.bossBarContainer.setVisible(true);
        this.bossBarContainer.setAlpha(0);
        this.tweens.add({ targets: this.bossBarContainer, alpha: 1, duration: 400 });
      }
      this.drawBossBar();
    });

    // Show VULNERABLE text when boss is stunned
    this.events.on('boss-vulnerable', () => {
      this.bossVulnerableText.setAlpha(1);
      this.bossVulnerableText.setScale(1.3);
      this.tweens.add({
        targets: this.bossVulnerableText,
        scale: 1,
        duration: 200,
        ease: 'Sine.easeOut',
      });
      // Pulse effect
      this.tweens.add({
        targets: this.bossVulnerableText,
        alpha: { from: 1, to: 0.6 },
        scale: { from: 1, to: 1.15 },
        duration: 400,
        yoyo: true,
        repeat: -1,
      });
    });

    // Hide VULNERABLE text when boss recovers
    this.events.on('boss-recovered', () => {
      this.tweens.killTweensOf(this.bossVulnerableText);
      this.tweens.add({
        targets: this.bossVulnerableText,
        alpha: 0,
        duration: 200,
      });
    });

    // Hide boss bar on defeat
    this.events.on('boss-defeated-ui', () => {
      this.tweens.add({
        targets: this.bossBarContainer,
        alpha: 0,
        duration: 800,
        onComplete: () => {
          this.bossBarVisible = false;
          this.bossBarContainer.setVisible(false);
        },
      });
    });

    // --- Dialogue Box ---
    this.createDialogueUI();
  }

  update(_time: number, delta: number): void {
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - delta);
      if (this.dashCooldownTimer <= 0) {
        this.dashIndicator.setColor('#80eea0');
        this.dashIndicator.setText('DASH ●');
        this.dashCooldownBar.clear();
      } else {
        // Draw cooldown arc next to dash indicator
        const progress = 1 - (this.dashCooldownTimer / this.dashCooldownTotal);
        const cx = GAME_WIDTH - 75;
        const cy = GAME_HEIGHT - 20;
        this.dashCooldownBar.clear();
        this.dashCooldownBar.lineStyle(2, 0x80eea0, 0.5);
        this.dashCooldownBar.beginPath();
        this.dashCooldownBar.arc(cx, cy, 6, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2, false);
        this.dashCooldownBar.strokePath();
      }
    }

    // Draw minimap
    if (this.minimapVisible) {
      this.drawMinimap();
    }
  }

  private drawBossBar(): void {
    const g = this.bossBarGraphics;
    g.clear();

    const barW = 200;
    const barH = 8;
    const x = -barW / 2;
    const y = -barH / 2;

    // Background
    g.fillStyle(0x111122, 0.8);
    g.fillRoundedRect(x - 2, y - 2, barW + 4, barH + 4, 3);
    g.lineStyle(1, 0x4a4a6a, 0.5);
    g.strokeRoundedRect(x - 2, y - 2, barW + 4, barH + 4, 3);

    if (this.bossArmor > 0) {
      // Armor phase — show blue armor bar
      const armorFrac = Math.max(0, this.bossArmor / this.bossMaxArmor);
      g.fillStyle(0x4488cc, 0.9);
      g.fillRoundedRect(x, y, barW * armorFrac, barH, 2);
      // Armor segment lines
      for (let i = 1; i < this.bossMaxArmor; i++) {
        const lx = x + (i / this.bossMaxArmor) * barW;
        g.lineStyle(1, 0x223344, 0.6);
        g.lineBetween(lx, y, lx, y + barH);
      }
    } else {
      // Health phase — show red health bar
      const healthFrac = Math.max(0, this.bossHealth / this.bossMaxHealth);
      g.fillStyle(0xcc4444, 0.9);
      g.fillRoundedRect(x, y, barW * healthFrac, barH, 2);
      // Health segment lines
      for (let i = 1; i < this.bossMaxHealth; i++) {
        const lx = x + (i / this.bossMaxHealth) * barW;
        g.lineStyle(1, 0x331111, 0.6);
        g.lineBetween(lx, y, lx, y + barH);
      }
    }
  }

  private drawMinimap(): void {
    const g = this.minimapGraphics;
    g.clear();

    const mx = UIScene.MAP_X;
    const my = UIScene.MAP_Y;
    const mw = UIScene.MAP_W;
    const mh = UIScene.MAP_H;
    const sx = mw / UIScene.WORLD_W;
    const sy = mh / UIScene.WORLD_H;

    // Region boundary lines
    const regionCount = 5;
    g.lineStyle(1, 0x4a6a9a, 0.2);
    for (let i = 1; i < regionCount; i++) {
      const lx = mx + (i / regionCount) * mw;
      g.lineBetween(lx, my, lx, my + mh);
    }

    // Fragments
    for (const f of this.minimapFragments) {
      const fx = mx + f.x * sx;
      const fy = my + f.y * sy;
      g.fillStyle(f.collected ? 0x445566 : 0x88ccff, f.collected ? 0.4 : 0.8);
      g.fillCircle(fx, fy, f.collected ? 1 : 1.5);
    }

    // Enemies
    for (const e of this.minimapEnemies) {
      const ex = mx + e.x * sx;
      const ey = my + e.y * sy;
      g.fillStyle(e.type === 'boss' ? 0xff6644 : 0xff4444, 0.7);
      g.fillCircle(ex, ey, e.type === 'boss' ? 2.5 : 1.5);
    }

    // Player — blinking dot
    const blinkAlpha = 0.6 + 0.4 * Math.sin(this.time.now * 0.006);
    const px = mx + this.minimapPlayerX * sx;
    const py = my + this.minimapPlayerY * sy;
    g.fillStyle(0xffffff, blinkAlpha);
    g.fillCircle(px, py, 2);
  }

  private createDialogueUI(): void {
    const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 120);
    container.setDepth(210);

    // === Outer frame ===
    const outerFrame = this.add.graphics();
    outerFrame.fillStyle(0x0c1636, 0.95);
    outerFrame.fillRoundedRect(-440, -90, 880, 180, 12);
    // Decorative border
    outerFrame.lineStyle(2, 0x4a6a9a, 0.35);
    outerFrame.strokeRoundedRect(-440, -90, 880, 180, 12);
    // Inner border accent
    outerFrame.lineStyle(1, 0x2a3a5a, 0.25);
    outerFrame.strokeRoundedRect(-434, -84, 868, 168, 10);

    // === Portrait area (left side) ===
    const portraitBg = this.add.graphics();
    // Portrait background panel
    portraitBg.fillStyle(0x0a0e22, 0.7);
    portraitBg.fillRoundedRect(-424, -76, 120, 152, 8);
    // Portrait border
    portraitBg.lineStyle(1.5, 0x3a5a8a, 0.3);
    portraitBg.strokeRoundedRect(-424, -76, 120, 152, 8);
    // Corner accents
    portraitBg.fillStyle(0x4a7aaa, 0.2);
    portraitBg.fillCircle(-420, -72, 3);
    portraitBg.fillCircle(-308, -72, 3);
    portraitBg.fillCircle(-420, 72, 3);
    portraitBg.fillCircle(-308, 72, 3);

    // Portrait character drawing (drawn by DialogueSystem)
    const portraitGraphics = this.add.graphics();
    portraitGraphics.setPosition(-364, 0);

    // === Text area separator ===
    const separator = this.add.graphics();
    separator.lineStyle(1, 0x3a5a8a, 0.2);
    separator.lineBetween(-296, -70, -296, 70);

    // === Soft ambient glow ===
    const light = this.add.ellipse(-364, -10, 80, 60, 0x6688cc, 0.04);
    light.setBlendMode(Phaser.BlendModes.SCREEN);

    // === Top edge highlight ===
    const topHighlight = this.add.graphics();
    topHighlight.fillStyle(0x5588bb, 0.08);
    topHighlight.fillRoundedRect(-430, -90, 860, 3, { tl: 12, tr: 12, bl: 0, br: 0 });

    // === Speaker name ===
    const speakerText = this.add.text(-280, -68, '', {
      fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
      fontSize: '20px',
      color: '#ffefc5',
      fontStyle: 'italic',
    });

    // Speaker name underline
    const nameUnderline = this.add.graphics();
    nameUnderline.fillStyle(0xffefc5, 0.12);
    nameUnderline.fillRect(-280, -44, 200, 1);

    // === Dialogue line ===
    const lineText = this.add.text(-280, -34, '', {
      fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
      fontSize: '18px',
      color: '#e8e4f8',
      wordWrap: { width: 680 },
      lineSpacing: 7,
    });

    // === Continue prompt ===
    const continueText = this.add.text(310, 58, '▸ Press E', {
      fontFamily: '"Palatino Linotype", Georgia, serif',
      fontSize: '14px',
      color: '#6aa0c8',
    });
    continueText.setOrigin(1, 0.5);

    container.add([
      outerFrame, portraitBg, portraitGraphics, separator,
      light, topHighlight, nameUnderline,
      speakerText, lineText, continueText,
    ]);
    container.setVisible(false);

    // Bind to DialogueSystem in GameScene
    const gameScene = this.scene.get('GameScene');
    const dialogueSystem = (gameScene as any).dialogueSystem as DialogueSystem;
    if (dialogueSystem) {
      dialogueSystem.bindUI(container, speakerText, lineText, continueText, portraitGraphics, this);
    }
  }
}
