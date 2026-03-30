import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class IntroOverlay {
  private container: Phaser.GameObjects.Container;
  private _dismissed = false;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.container.setScrollFactor(0).setDepth(200);
    const chromeFont = '"Palatino Linotype", Georgia, serif';

    const bg = scene.add.rectangle(0, 0, 880, 400, 0x060e22, 0.82);
    bg.setStrokeStyle(1.5, 0xffffff, 0.06);

    const glow = scene.add.ellipse(0, -120, 500, 140, 0x8090c0, 0.06);
    glow.setBlendMode(Phaser.BlendModes.SCREEN);

    const title = scene.add.text(0, -130, 'LUMINA', {
      fontFamily: chromeFont,
      fontSize: '48px',
      color: '#fff6dc',
    }).setOrigin(0.5);

    const body = scene.add.text(0, 0, '', {
        fontFamily: chromeFont,
        fontSize: '18px',
        color: '#d0c8e0',
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: 640 },
      },
    ).setOrigin(0.5);

    // Staged text reveal — line by line
    const lines = [
      'Far beyond ordinary maps lies a place',
      'where stories leave their embers while they sleep.',
      '',
      'This world is filled with danger and beauty.',
      '',
      'Find the lost memory fragments, light the beacons,',
      'and face the darkness when it awakens.',
    ];
    let revealed = '';
    lines.forEach((line, i) => {
      scene.time.delayedCall(600 * (i + 1), () => {
        revealed += (revealed ? '\n' : '') + line;
        body.setText(revealed);
        if (line.length > 0) {
          scene.events.emit('play-sfx', 'sfx-dialogue-open', 0.1);
        }
      });
    });

    const hint = scene.add.text(0, -160, 'A/D move  ·  W jump  ·  Shift dash\nSpace glide  ·  E interact  ·  J attack  ·  K blast', {
      fontFamily: chromeFont,
      fontSize: '12px',
      color: '#607890',
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5);

    const prompt = scene.add.text(0, 148, '▸ Press E or Enter to begin', {
      fontFamily: chromeFont,
      fontSize: '17px',
      color: '#90c0e0',
    }).setOrigin(0.5);

    scene.tweens.add({
      targets: prompt,
      alpha: { from: 0.4, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    this.container.add([bg, glow, title, hint, body, prompt]);
  }

  get dismissed(): boolean { return this._dismissed; }
  get visible(): boolean { return this.container.visible; }

  dismiss(scene: Phaser.Scene): void {
    if (this._dismissed) return;
    this._dismissed = true;
    scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 300,
      onComplete: () => this.container.setVisible(false),
    });
  }
}
