import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ASSET_KEYS, PARALLAX_LAYERS } from '../config';
import { SettingsManager } from '../systems/SettingsManager';
import { SaveSystem } from '../systems/SaveSystem';

const MENU_FONT = "'HollowKnight', Georgia, serif";

export class MainMenuScene extends Phaser.Scene {
  private controlsContainer!: Phaser.GameObjects.Container;
  private controlsVisible = false;
  private parallaxImages: Phaser.GameObjects.TileSprite[] = [];
  private transitioning = false;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    this.transitioning = false;

    // Dark fill behind everything to prevent any seam/gap artifacts
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH + 20, GAME_HEIGHT + 20, 0x060c1a)
      .setDepth(-30);

    // ── 0. STATIC BACKGROUND IMAGE ────────────────────────────────────
    if (this.textures.exists('menu-bg')) {
      const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-bg');
      bg.setDepth(-26);
      bg.setAlpha(0.4);
      const bgScale = Math.max(GAME_WIDTH / bg.width, GAME_HEIGHT / bg.height);
      bg.setScale(bgScale);
      bg.setTint(0x0a1530);
    }

    // ── 1. CINEMATIC PARALLAX BACKGROUND ──────────────────────────────
    // Inspired by Hollow Knight's looping video background — we use the
    // parallax forest layers that drift slowly to create a living scene.
    this.parallaxImages = [];
    const layerConfigs = [
      { key: 'plx-sky',        speed: 0,    alpha: 1,    depth: -20, tint: 0x0a102a },
      { key: 'plx-forest-far', speed: 2,    alpha: 0.6,  depth: -19, tint: 0x1a2040 },
      { key: 'plx-forest-8',   speed: 3,    alpha: 0.55, depth: -18, tint: 0x1c2548 },
      { key: 'plx-forest-7',   speed: 5,    alpha: 0.5,  depth: -17, tint: 0x1e2a50 },
      { key: 'plx-forest-6',   speed: 7,    alpha: 0.45, depth: -16, tint: 0x1a2848 },
      { key: 'plx-particles-5',speed: 9,    alpha: 0.35, depth: -15, tint: 0x2a3868 },
      { key: 'plx-forest-4',   speed: 12,   alpha: 0.4,  depth: -14, tint: 0x182440 },
      { key: 'plx-particles-3',speed: 15,   alpha: 0.3,  depth: -13, tint: 0x2a3868 },
      { key: 'plx-bushes',     speed: 18,   alpha: 0.35, depth: -12, tint: 0x0e1828 },
      { key: 'plx-mist',       speed: 6,    alpha: 0.2,  depth: -11, tint: 0x2a4060 },
    ];

    for (const cfg of layerConfigs) {
      if (!this.textures.exists(cfg.key)) continue;
      const tex = this.textures.get(cfg.key);
      const frame = tex.getSourceImage();
      const ts = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, cfg.key);
      ts.setOrigin(0, 0);
      ts.setDepth(cfg.depth);
      ts.setAlpha(0); // start invisible — will fade in
      ts.setTint(cfg.tint);
      // Scale tile sprite to fill height
      ts.setTileScale(GAME_HEIGHT / frame.height, GAME_HEIGHT / frame.height);
      (ts as any)._driftSpeed = cfg.speed;
      (ts as any)._targetAlpha = cfg.alpha;
      this.parallaxImages.push(ts);
    }

    // ── 2. DARK OVERLAY & VIGNETTE ────────────────────────────────────
    // Smooth gradient using 1px-high bands (no visible stepping)
    const vignetteOverlay = this.add.graphics();
    vignetteOverlay.setDepth(-5);
    // Top-down gradient darkness — 1px per band for perfectly smooth fade
    const topBands = Math.floor(GAME_HEIGHT * 0.5);
    for (let i = 0; i < topBands; i++) {
      const a = 0.6 * (1 - i / topBands);
      vignetteOverlay.fillStyle(0x000000, a);
      vignetteOverlay.fillRect(0, i, GAME_WIDTH, 1);
    }
    // Bottom-up gradient darkness
    const bottomBands = Math.floor(GAME_HEIGHT * 0.4);
    for (let i = 0; i < bottomBands; i++) {
      const a = 0.8 * (1 - i / bottomBands);
      vignetteOverlay.fillStyle(0x000000, a);
      vignetteOverlay.fillRect(0, GAME_HEIGHT - 1 - i, GAME_WIDTH, 1);
    }
    vignetteOverlay.setAlpha(0);

    // ── 3. FULL-SCREEN BLACK FOR CINEMATIC FADE-IN ────────────────────
    const blackScreen = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000);
    blackScreen.setDepth(50);
    blackScreen.setAlpha(1);

    // ── 4. AMBIENT FLOATING PARTICLES (two layers for depth) ──────────
    // Background layer — slow, dim particles
    this.add.particles(0, 0, ASSET_KEYS.PARTICLE_DUST, {
      x: { min: 0, max: GAME_WIDTH },
      y: { min: GAME_HEIGHT, max: GAME_HEIGHT + 20 },
      lifespan: { min: 6000, max: 12000 },
      speed: { min: 8, max: 25 },
      angle: { min: 260, max: 280 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.15, end: 0 },
      frequency: 300,
      blendMode: 'ADD',
    }).setDepth(-4);

    // Foreground layer — brighter, faster motes
    this.add.particles(0, 0, ASSET_KEYS.PARTICLE_GLOW, {
      x: { min: 0, max: GAME_WIDTH },
      y: { min: GAME_HEIGHT * 0.5, max: GAME_HEIGHT },
      lifespan: { min: 4000, max: 8000 },
      speed: { min: 12, max: 35 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.5, end: 0.1 },
      alpha: { start: 0.4, end: 0 },
      frequency: 800,
      blendMode: 'ADD',
      tint: [0x6688cc, 0x88aadd, 0x5577bb, 0xaaccff],
    }).setDepth(5);

    // ── 5. TITLE — LUMINA ─────────────────────────────────────────────
    // Large title glow (bloom behind text — like HK's logo glow)
    const titleGlowOuter = this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT * 0.32, 500, 140, 0x4466aa, 0.0);
    titleGlowOuter.setBlendMode(Phaser.BlendModes.ADD);
    titleGlowOuter.setDepth(9);

    const titleGlowInner = this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT * 0.32, 280, 60, 0x88bbff, 0.0);
    titleGlowInner.setBlendMode(Phaser.BlendModes.ADD);
    titleGlowInner.setDepth(9);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.32, 'LUMINA', {
      fontSize: '84px',
      fontFamily: MENU_FONT,
      color: '#c8ddf8',
      stroke: '#4466aa',
      strokeThickness: 2,
    });
    title.setOrigin(0.5);
    title.setAlpha(0);
    title.setDepth(10);

    // Horizontal decorative line beneath title
    const titleLine = this.add.graphics();
    titleLine.setDepth(10);
    titleLine.setAlpha(0);
    const lineY = GAME_HEIGHT * 0.39;
    const lineW = 200;
    titleLine.lineStyle(1, 0x6688bb, 0.6);
    titleLine.beginPath();
    titleLine.moveTo(GAME_WIDTH / 2 - lineW, lineY);
    titleLine.lineTo(GAME_WIDTH / 2 + lineW, lineY);
    titleLine.strokePath();
    // Center diamond ornament
    titleLine.fillStyle(0x88aadd, 0.8);
    titleLine.fillRect(GAME_WIDTH / 2 - 3, lineY - 3, 6, 6);

    // Subtitle with typewriter effect
    const subtitleFull = 'a world waiting to be colored';
    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.44, '', {
      fontSize: '18px',
      fontFamily: MENU_FONT,
      color: '#5577aa',
    });
    subtitle.setOrigin(0.5);
    subtitle.setAlpha(0);
    subtitle.setDepth(10);

    // ── 6. MENU OPTIONS ───────────────────────────────────────────────
    const menuY = GAME_HEIGHT * 0.62;
    const startText = this.add.text(GAME_WIDTH / 2, menuY, 'Start Game', {
      fontSize: '32px',
      fontFamily: MENU_FONT,
      color: '#8899bb',
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    const controlsText = this.add.text(GAME_WIDTH / 2, menuY + 55, 'Controls', {
      fontSize: '22px',
      fontFamily: MENU_FONT,
      color: '#556688',
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    // Interactive hover glow (like HK's h1:hover text-shadow)
    startText.setInteractive({ useHandCursor: true });
    startText.on('pointerover', () => {
      if (!this.transitioning) startText.setStyle({ color: '#ddeeff' });
    });
    startText.on('pointerout', () => {
      if (!this.transitioning) startText.setStyle({ color: '#8899bb' });
    });
    startText.on('pointerdown', () => this.startGame());

    controlsText.setInteractive({ useHandCursor: true });
    controlsText.on('pointerover', () => {
      if (!this.transitioning) controlsText.setStyle({ color: '#aabbcc' });
    });
    controlsText.on('pointerout', () => {
      if (!this.transitioning) controlsText.setStyle({ color: '#556688' });
    });
    controlsText.on('pointerdown', () => this.toggleControls());

    // Bottom hints
    const bottomHints: string[] = [];
    if (SaveSystem.hasSave()) {
      bottomHints.push('Saved progress will be restored');
    }
    const bottomText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, bottomHints.join('   ·   '), {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#334455',
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    // Volume display
    const vol = Math.round(SettingsManager.get().masterVolume * 100);
    const volText = this.add.text(GAME_WIDTH - 20, 20, `Vol: ${vol}%`, {
      fontSize: '13px',
      fontFamily: 'Arial, sans-serif',
      color: '#445566',
    }).setOrigin(1, 0).setAlpha(0).setDepth(10);

    // ── 7. CINEMATIC REVEAL SEQUENCE ──────────────────────────────────
    // Phase 1: Black screen fades, parallax layers emerge from darkness
    this.tweens.add({
      targets: blackScreen,
      alpha: 0,
      duration: 3000,
      ease: 'Sine.easeOut',
      delay: 400,
      onComplete: () => blackScreen.destroy(),
    });

    // Parallax layers fade in staggered (back to front)
    this.parallaxImages.forEach((ts, i) => {
      this.tweens.add({
        targets: ts,
        alpha: (ts as any)._targetAlpha,
        duration: 2500,
        delay: 300 + i * 200,
        ease: 'Sine.easeOut',
      });
    });

    // Vignette overlay fades in
    this.tweens.add({
      targets: vignetteOverlay,
      alpha: 1,
      duration: 2000,
      delay: 800,
    });

    // Phase 2: Title emerges (delay ~2s)
    this.tweens.add({
      targets: title,
      alpha: 1,
      y: GAME_HEIGHT * 0.32,
      duration: 2000,
      delay: 1800,
      ease: 'Cubic.easeOut',
    });
    // Title starts slightly higher and drifts down
    title.setY(GAME_HEIGHT * 0.28);

    // Title glow breathing animation
    this.tweens.add({
      targets: titleGlowOuter,
      alpha: { from: 0, to: 0.08 },
      duration: 2500,
      delay: 1800,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: titleGlowOuter,
          alpha: { from: 0.04, to: 0.12 },
          scaleX: { from: 0.9, to: 1.2 },
          scaleY: { from: 0.85, to: 1.15 },
          duration: 3000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      },
    });
    this.tweens.add({
      targets: titleGlowInner,
      alpha: { from: 0, to: 0.06 },
      duration: 3000,
      delay: 2200,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: titleGlowInner,
          alpha: { from: 0.03, to: 0.1 },
          scaleX: { from: 0.95, to: 1.1 },
          scaleY: { from: 0.9, to: 1.1 },
          duration: 2400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      },
    });

    // Title decorative line
    this.tweens.add({
      targets: titleLine,
      alpha: 1,
      duration: 1000,
      delay: 2800,
      ease: 'Sine.easeOut',
    });

    // Phase 3: Subtitle typewriter (delay ~3s)
    this.time.delayedCall(3200, () => {
      subtitle.setAlpha(0.8);
      let charIdx = 0;
      this.time.addEvent({
        delay: 55,
        repeat: subtitleFull.length - 1,
        callback: () => {
          charIdx++;
          subtitle.setText(subtitleFull.substring(0, charIdx));
        },
      });
    });

    // Phase 4: Menu items appear (delay ~5s)
    this.tweens.add({
      targets: startText,
      alpha: 1,
      duration: 1200,
      delay: 5000,
      ease: 'Sine.easeOut',
      onComplete: () => {
        // Gentle pulsing on "Start Game"
        this.tweens.add({
          targets: startText,
          alpha: { from: 1, to: 0.5 },
          duration: 1600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      },
    });

    this.tweens.add({
      targets: controlsText,
      alpha: 0.6,
      duration: 1000,
      delay: 5400,
      ease: 'Sine.easeOut',
    });

    this.tweens.add({
      targets: [bottomText, volText],
      alpha: 0.4,
      duration: 800,
      delay: 5800,
    });

    // ── 8. AMBIENT MUSIC ──────────────────────────────────────────────
    // Like HK playing home.mp3 on the menu screen
    if (this.sound.get(ASSET_KEYS.MUSIC_AMBIENT)) {
      const existing = this.sound.get(ASSET_KEYS.MUSIC_AMBIENT);
      if (!existing.isPlaying) {
        (existing as Phaser.Sound.WebAudioSound).play({ loop: true, volume: 0 });
        this.tweens.add({ targets: existing, volume: 0.3, duration: 4000, delay: 1000 });
      }
    } else {
      const music = this.sound.add(ASSET_KEYS.MUSIC_AMBIENT, { loop: true, volume: 0 });
      music.play();
      this.tweens.add({ targets: music, volume: 0.3, duration: 4000, delay: 1000 });
    }

    // ── 9. CONTROLS OVERLAY ───────────────────────────────────────────
    this.createControlsOverlay();

    // ── 10. DECORATIVE FRAME ──────────────────────────────────────────
    // Prominent ornate border inspired by HK's canvas framing
    const frame = this.add.graphics();
    frame.setDepth(150);
    frame.setAlpha(0);

    const m = 6; // margin from edge
    // Outer border — bright and thick
    frame.lineStyle(3, 0x8aafdd, 0.8);
    frame.strokeRect(m, m, GAME_WIDTH - m * 2, GAME_HEIGHT - m * 2);
    // Inner glow line
    frame.lineStyle(1, 0x5580bb, 0.4);
    frame.strokeRect(m + 5, m + 5, GAME_WIDTH - (m + 5) * 2, GAME_HEIGHT - (m + 5) * 2);
    // Subtle outer dark line to ground it
    frame.lineStyle(1, 0x1a2a44, 0.6);
    frame.strokeRect(m - 1, m - 1, GAME_WIDTH - (m - 1) * 2, GAME_HEIGHT - (m - 1) * 2);

    // Corner ornaments — larger diamonds with glow
    const cs = 10; // corner ornament half-size
    const co = m + 2; // corner offset from edge
    const cornerPositions = [
      [co, co],
      [GAME_WIDTH - co, co],
      [co, GAME_HEIGHT - co],
      [GAME_WIDTH - co, GAME_HEIGHT - co],
    ];
    for (const [cx, cy] of cornerPositions) {
      // Glow behind diamond
      frame.fillStyle(0x88bbff, 0.15);
      frame.fillCircle(cx, cy, cs + 4);
      // Diamond shape (45-deg rotated square)
      frame.fillStyle(0xaaccee, 0.9);
      frame.beginPath();
      frame.moveTo(cx, cy - cs);
      frame.lineTo(cx + cs, cy);
      frame.lineTo(cx, cy + cs);
      frame.lineTo(cx - cs, cy);
      frame.closePath();
      frame.fillPath();
      // Diamond border
      frame.lineStyle(1, 0xffffff, 0.5);
      frame.beginPath();
      frame.moveTo(cx, cy - cs);
      frame.lineTo(cx + cs, cy);
      frame.lineTo(cx, cy + cs);
      frame.lineTo(cx - cs, cy);
      frame.closePath();
      frame.strokePath();
    }

    // Midpoint ornaments on each edge
    const midSize = 5;
    const edgeMids = [
      [GAME_WIDTH / 2, m],          // top center
      [GAME_WIDTH / 2, GAME_HEIGHT - m], // bottom center
      [m, GAME_HEIGHT / 2],          // left center
      [GAME_WIDTH - m, GAME_HEIGHT / 2], // right center
    ];
    frame.fillStyle(0x88aadd, 0.7);
    for (const [mx, my] of edgeMids) {
      frame.beginPath();
      frame.moveTo(mx, my - midSize);
      frame.lineTo(mx + midSize, my);
      frame.lineTo(mx, my + midSize);
      frame.lineTo(mx - midSize, my);
      frame.closePath();
      frame.fillPath();
    }

    this.tweens.add({ targets: frame, alpha: 1, duration: 1500, delay: 4000 });

    // ── 11. KEY HANDLER ───────────────────────────────────────────────
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.code === 'KeyC') {
        this.toggleControls();
        return;
      }
      if (this.controlsVisible) {
        this.toggleControls();
        return;
      }
      if (event.code === 'Enter' || event.code === 'Space') {
        this.startGame();
      }
    });
  }

  update(): void {
    // Slowly drift parallax layers to the left — creates the living background
    // Similar to HK's looping video, but with parallax depth
    for (const ts of this.parallaxImages) {
      ts.tilePositionX += (ts as any)._driftSpeed * 0.016; // ~60fps normalized
    }
  }

  private startGame(): void {
    if (this.transitioning) return;
    this.transitioning = true;

    this.input.keyboard?.removeAllListeners();

    // Fade out menu music
    const music = this.sound.get(ASSET_KEYS.MUSIC_AMBIENT);
    if (music) {
      this.tweens.add({ targets: music, volume: 0, duration: 1500 });
    }

    // ── CINEMATIC TRANSITION ──────────────────────────────────────────
    // Inspired by HK's screen transitions: brief white flash → fade to black → start

    // White flash
    const whiteFlash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0);
    whiteFlash.setDepth(200);
    this.tweens.add({
      targets: whiteFlash,
      alpha: 0.7,
      duration: 300,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.tweens.add({
          targets: whiteFlash,
          alpha: 0,
          duration: 500,
          ease: 'Cubic.easeOut',
        });
      },
    });

    // Fade to black after the flash
    this.time.delayedCall(400, () => {
      this.cameras.main.fadeOut(1200, 0, 0, 0);
    });

    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Stop menu music completely
      if (music) music.stop();
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    });
  }

  private createControlsOverlay(): void {
    const bg = this.add.rectangle(0, 0, 600, 420, 0x050d1e, 0.95);
    bg.setStrokeStyle(1.5, 0xffffff, 0.08);

    const glow = this.add.ellipse(0, -140, 350, 80, 0x8090c0, 0.05);
    glow.setBlendMode(Phaser.BlendModes.SCREEN);

    const heading = this.add.text(0, -160, 'Controls', {
      fontFamily: MENU_FONT,
      fontSize: '36px',
      color: '#fff6dc',
    }).setOrigin(0.5);

    const controlLines = [
      ['A / D  or  ← / →', 'Move left / right'],
      ['W  or  ↑', 'Jump'],
      ['SHIFT', 'Dash (air OK)'],
      ['SPACE (hold in air)', 'Glide'],
      ['J', 'Melee attack (2-hit combo)'],
      ['K', 'Ranged blast (needs charges)'],
      ['H', 'Toggle Heavy Form'],
      ['V', 'Toggle Spirit Vision'],
      ['E', 'Interact / advance dialogue'],
      ['ESC / P', 'Pause'],
      ['F12', 'Debug overlay'],
    ];

    const items: Phaser.GameObjects.Text[] = [];
    const startY = -100;
    for (let i = 0; i < controlLines.length; i++) {
      const [key, desc] = controlLines[i];
      const keyText = this.add.text(-260, startY + i * 28, key, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#aaccee',
      }).setOrigin(0, 0.5);
      const descText = this.add.text(30, startY + i * 28, desc, {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#8899aa',
      }).setOrigin(0, 0.5);
      items.push(keyText, descText);
    }

    const footer = this.add.text(0, 170, 'Press C or any key to close', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#556677',
    }).setOrigin(0.5);

    this.controlsContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2,
      [bg, glow, heading, ...items, footer]);
    this.controlsContainer.setDepth(100);
    this.controlsContainer.setVisible(false);
  }

  private toggleControls(): void {
    this.controlsVisible = !this.controlsVisible;
    if (this.controlsVisible) {
      this.controlsContainer.setAlpha(0);
      this.controlsContainer.setVisible(true);
      this.tweens.add({ targets: this.controlsContainer, alpha: 1, duration: 200 });
    } else {
      this.tweens.add({
        targets: this.controlsContainer,
        alpha: 0,
        duration: 200,
        onComplete: () => this.controlsContainer.setVisible(false),
      });
    }
  }
}
