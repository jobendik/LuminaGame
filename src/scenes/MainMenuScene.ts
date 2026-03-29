import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, ASSET_KEYS } from '../config';
import { SettingsManager } from '../systems/SettingsManager';
import { SaveSystem } from '../systems/SaveSystem';

export class MainMenuScene extends Phaser.Scene {
  private controlsContainer!: Phaser.GameObjects.Container;
  private controlsVisible = false;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x0a0a1a);

    // Ambient particles on the title screen
    this.add.particles(0, 0, ASSET_KEYS.PARTICLE_DUST, {
      x: { min: 0, max: GAME_WIDTH },
      y: { min: 0, max: GAME_HEIGHT },
      lifespan: { min: 4000, max: 8000 },
      speed: { min: 3, max: 12 },
      angle: { min: 260, max: 280 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.3, end: 0 },
      frequency: 400,
      blendMode: 'ADD',
    });

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.35, 'LUMINA', {
      fontSize: '72px',
      fontFamily: 'Georgia, serif',
      color: '#88aadd',
    });
    title.setOrigin(0.5);
    title.setAlpha(0);

    // Pulsing glow behind the title
    const titleGlow = this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT * 0.35, 320, 80, 0x6688cc, 0.0);
    titleGlow.setBlendMode(Phaser.BlendModes.SCREEN);
    this.tweens.add({
      targets: titleGlow,
      alpha: { from: 0.04, to: 0.12 },
      scaleX: { from: 0.9, to: 1.15 },
      scaleY: { from: 0.8, to: 1.1 },
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 1800,
    });

    const subtitleFull = 'a world waiting to be colored';
    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.48, '', {
      fontSize: '18px',
      fontFamily: 'Georgia, serif',
      color: '#556688',
    });
    subtitle.setOrigin(0.5);
    subtitle.setAlpha(0);

    const prompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.7, 'Press any key to begin', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#445566',
    });
    prompt.setOrigin(0.5);
    prompt.setAlpha(0);

    // Controls & save info at the bottom
    const bottomHints: string[] = ['C = Controls'];
    if (SaveSystem.hasSave()) {
      bottomHints.push('Saved progress will be restored');
    }
    const bottomText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, bottomHints.join('   ·   '), {
      fontSize: '13px',
      fontFamily: 'Arial, sans-serif',
      color: '#334455',
    }).setOrigin(0.5).setAlpha(0);

    // Elegant fade-in sequence
    this.tweens.add({
      targets: title,
      alpha: 1,
      duration: 2000,
      ease: 'Sine.easeIn',
    });

    // Subtitle typewriter reveal
    this.time.delayedCall(1200, () => {
      subtitle.setAlpha(0.8);
      let charIdx = 0;
      this.time.addEvent({
        delay: 65,
        repeat: subtitleFull.length - 1,
        callback: () => {
          charIdx++;
          subtitle.setText(subtitleFull.substring(0, charIdx));
        },
      });
    });

    this.tweens.add({
      targets: prompt,
      alpha: 0.6,
      duration: 1000,
      delay: 2500,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.tweens.add({
          targets: prompt,
          alpha: 0.2,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      },
    });

    this.tweens.add({
      targets: bottomText,
      alpha: 0.5,
      duration: 800,
      delay: 3000,
    });

    // --- Controls Overlay ---
    this.createControlsOverlay();

    // --- Volume display ---
    const vol = Math.round(SettingsManager.get().masterVolume * 100);
    const volText = this.add.text(GAME_WIDTH - 20, 20, `Vol: ${vol}%`, {
      fontSize: '13px',
      fontFamily: 'Arial, sans-serif',
      color: '#445566',
    }).setOrigin(1, 0).setAlpha(0);
    this.tweens.add({ targets: volText, alpha: 0.4, duration: 800, delay: 3000 });

    // Key handler — C toggles controls, anything else starts game
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.code === 'KeyC') {
        this.toggleControls();
        return;
      }
      if (this.controlsVisible) {
        this.toggleControls();
        return;
      }

      // Start game
      this.input.keyboard?.removeAllListeners();
      this.cameras.main.fadeOut(800, 10, 10, 26);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene');
        this.scene.launch('UIScene');
      });
    });
  }

  private createControlsOverlay(): void {
    const bg = this.add.rectangle(0, 0, 600, 420, 0x050d1e, 0.95);
    bg.setStrokeStyle(1.5, 0xffffff, 0.08);

    const glow = this.add.ellipse(0, -140, 350, 80, 0x8090c0, 0.05);
    glow.setBlendMode(Phaser.BlendModes.SCREEN);

    const heading = this.add.text(0, -160, 'Controls', {
      fontFamily: 'Georgia, serif',
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
