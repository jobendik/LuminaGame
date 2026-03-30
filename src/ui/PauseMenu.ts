import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { SettingsManager } from '../systems/SettingsManager';

export class PauseMenu {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private _isPaused = false;
  private volText!: Phaser.GameObjects.Text;
  private musicText!: Phaser.GameObjects.Text;
  private sfxText!: Phaser.GameObjects.Text;
  private shakeText!: Phaser.GameObjects.Text;
  private pauseDots: Phaser.GameObjects.Arc[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.container.setScrollFactor(0);
    this.container.setDepth(300);
    const chromeFont = '"Palatino Linotype", Georgia, serif';

    const bg = scene.add.rectangle(0, 0, 720, 480, 0x050d1e, 0.92);
    bg.setStrokeStyle(1.5, 0xffffff, 0.08);

    const glow = scene.add.ellipse(0, -160, 400, 110, 0x8090c0, 0.05);
    glow.setBlendMode(Phaser.BlendModes.SCREEN);

    const title = scene.add.text(0, -180, 'Paused', {
      fontFamily: chromeFont,
      fontSize: '40px',
      color: '#fff6dc',
    }).setOrigin(0.5);

    const body = scene.add.text(0, -100,
      'ESC / P  =  resume\n' +
      'A / D  =  move   ·   W / ↑  =  jump   ·   SHIFT  =  dash\n' +
      'SPACE (hold)  =  glide   ·   E  =  interact\n' +
      'J  =  attack   ·   K  =  blast\n' +
      'H  =  heavy form   ·   V  =  spirit vision\n' +
      'F12  =  debug overlay',
      {
        fontFamily: chromeFont,
        fontSize: '14px',
        color: '#b0c0d0',
        align: 'center',
        lineSpacing: 6,
      },
    ).setOrigin(0.5);

    // Volume settings section
    const settingsLabel = scene.add.text(0, 10, '─── Settings ───', {
      fontFamily: chromeFont,
      fontSize: '16px',
      color: '#8899aa',
    }).setOrigin(0.5);

    const s = SettingsManager.get();

    this.volText = scene.add.text(0, 46, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#aaccee',
    }).setOrigin(0.5);

    this.musicText = scene.add.text(0, 72, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#aaccee',
    }).setOrigin(0.5);

    this.sfxText = scene.add.text(0, 98, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#aaccee',
    }).setOrigin(0.5);

    this.shakeText = scene.add.text(0, 124, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#aaccee',
    }).setOrigin(0.5);

    this.refreshSettingsText();

    const settingsHint = scene.add.text(0, 158, '← / → keys to adjust  ·  ↑ / ↓ to select  ·  Tab to toggle', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#556677',
    }).setOrigin(0.5);

    const foot = scene.add.text(0, 195, 'Take a breath. Move on when you are ready.', {
      fontFamily: chromeFont,
      fontSize: '14px',
      color: '#607890',
    }).setOrigin(0.5);

    this.container.add([bg, glow, title, body, settingsLabel,
      this.volText, this.musicText, this.sfxText, this.shakeText,
      settingsHint, foot]);
    this.container.setVisible(false);

    // Drifting ambient dots
    for (let i = 0; i < 12; i++) {
      const dot = scene.add.circle(
        Phaser.Math.Between(-300, 300),
        Phaser.Math.Between(-220, 220),
        Phaser.Math.Between(1, 3),
        0x8090c0, 0.15,
      );
      dot.setBlendMode(Phaser.BlendModes.SCREEN);
      this.container.add(dot);
      this.pauseDots.push(dot);
      scene.tweens.add({
        targets: dot,
        y: dot.y - Phaser.Math.Between(40, 100),
        x: dot.x + Phaser.Math.Between(-30, 30),
        alpha: { from: 0.08, to: 0.2 },
        duration: Phaser.Math.Between(3000, 6000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 2000),
      });
    }
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  private selectedRow = 0;
  private readonly settingsKeys: (keyof ReturnType<typeof SettingsManager.get>)[] =
    ['masterVolume', 'musicVolume', 'sfxVolume', 'screenShake'];

  toggle(): void {
    this._isPaused = !this._isPaused;
    if (this._isPaused) {
      this.scene.physics.world.pause();
      this.scene.anims.pauseAll();
      this.container.setAlpha(0);
      this.container.setVisible(true);
      this.scene.tweens.add({ targets: this.container, alpha: 1, duration: 160 });
      this.selectedRow = 0;
      this.refreshSettingsText();
    } else {
      this.scene.physics.world.resume();
      this.scene.anims.resumeAll();
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0,
        duration: 120,
        onComplete: () => this.container.setVisible(false),
      });
    }
  }

  handleInput(cursors: Phaser.Types.Input.Keyboard.CursorKeys, tabKey: Phaser.Input.Keyboard.Key): void {
    if (!this._isPaused) return;

    if (Phaser.Input.Keyboard.JustDown(cursors.up!)) {
      this.selectedRow = Math.max(0, this.selectedRow - 1);
      this.refreshSettingsText();
      this.scene.events.emit('play-sfx', 'sfx-dialogue-open', 0.06);
    }
    if (Phaser.Input.Keyboard.JustDown(cursors.down!)) {
      this.selectedRow = Math.min(this.settingsKeys.length - 1, this.selectedRow + 1);
      this.refreshSettingsText();
      this.scene.events.emit('play-sfx', 'sfx-dialogue-open', 0.06);
    }

    const key = this.settingsKeys[this.selectedRow];

    if (key === 'screenShake') {
      if (Phaser.Input.Keyboard.JustDown(cursors.left!) ||
          Phaser.Input.Keyboard.JustDown(cursors.right!) ||
          Phaser.Input.Keyboard.JustDown(tabKey)) {
        SettingsManager.set('screenShake', !SettingsManager.get().screenShake);
        this.refreshSettingsText();
        this.pulseSelectedRow();
      }
    } else {
      const step = 0.1;
      if (Phaser.Input.Keyboard.JustDown(cursors.left!)) {
        const cur = SettingsManager.get()[key] as number;
        SettingsManager.set(key, Math.max(0, Math.round((cur - step) * 10) / 10));
        this.refreshSettingsText();
        this.pulseSelectedRow();
        this.scene.events.emit('settings-changed');
      }
      if (Phaser.Input.Keyboard.JustDown(cursors.right!)) {
        const cur = SettingsManager.get()[key] as number;
        SettingsManager.set(key, Math.min(1, Math.round((cur + step) * 10) / 10));
        this.refreshSettingsText();
        this.pulseSelectedRow();
        this.scene.events.emit('settings-changed');
      }
    }
  }

  private refreshSettingsText(): void {
    const s = SettingsManager.get();
    const sel = (i: number) => i === this.selectedRow ? '► ' : '  ';
    const bar = (val: number) => {
      const filled = Math.round(val * 10);
      return '█'.repeat(filled) + '░'.repeat(10 - filled);
    };

    this.volText.setText(`${sel(0)}Master Volume: ${bar(s.masterVolume)} ${Math.round(s.masterVolume * 100)}%`);
    this.musicText.setText(`${sel(1)}Music Volume:  ${bar(s.musicVolume)} ${Math.round(s.musicVolume * 100)}%`);
    this.sfxText.setText(`${sel(2)}SFX Volume:    ${bar(s.sfxVolume)} ${Math.round(s.sfxVolume * 100)}%`);
    this.shakeText.setText(`${sel(3)}Screen Shake:  ${s.screenShake ? '[ON]' : '[OFF]'}`);
  }

  private pulseSelectedRow(): void {
    const targets = [this.volText, this.musicText, this.sfxText, this.shakeText];
    const t = targets[this.selectedRow];
    if (!t) return;
    this.scene.tweens.add({
      targets: t,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 80,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }
}
