import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export interface EndingStats {
  fragments: number;
  fragmentsTotal: number;
  beacons: number;
  beaconsTotal: number;
  timeSec: number;
  kills?: number;
  bossDefeated?: boolean;
}

export class EndingOverlay {
  private container: Phaser.GameObjects.Container;
  private bodyText: Phaser.GameObjects.Text;
  private rankText: Phaser.GameObjects.Text;
  private footText: Phaser.GameObjects.Text;
  private _visible = false;
  private _stats: EndingStats | null = null;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.container.setScrollFactor(0).setDepth(260);

    const bg = scene.add.rectangle(0, 0, 960, 520, 0x050d1e, 0.88);
    bg.setStrokeStyle(1.5, 0xffffff, 0.08);

    const glow = scene.add.ellipse(0, -100, 560, 140, 0xc0d8f0, 0.06);
    glow.setBlendMode(Phaser.BlendModes.SCREEN);

    const title = scene.add.text(0, -150, 'A new page begins', {
      fontFamily: 'Georgia, serif',
      fontSize: '40px',
      color: '#fff6dc',
    }).setOrigin(0.5);

    this.rankText = scene.add.text(0, -100, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '28px',
      color: '#ffd866',
    }).setOrigin(0.5);

    this.bodyText = scene.add.text(0, 10, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#e0d8f0',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);

    this.footText = scene.add.text(0, 180, 'E = close  ·  R = restart', {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: '#80a0c0',
    }).setOrigin(0.5);

    this.container.add([bg, glow, title, this.rankText, this.bodyText, this.footText]);
    this.container.setVisible(false);
  }

  get visible(): boolean { return this._visible; }
  get stats(): EndingStats | null { return this._stats; }

  private getRank(timeSec: number): { letter: string; color: string } {
    if (timeSec < 180) return { letter: 'S', color: '#ffd866' };
    if (timeSec < 360) return { letter: 'A', color: '#88ddff' };
    if (timeSec < 600) return { letter: 'B', color: '#aaddaa' };
    return { letter: 'C', color: '#ccaaaa' };
  }

  show(scene: Phaser.Scene, stats: EndingStats): void {
    this._stats = stats;
    const mins = Math.floor(stats.timeSec / 60);
    const secs = Math.floor(stats.timeSec % 60);
    const timeStr = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;

    const rank = this.getRank(stats.timeSec);
    this.rankText.setText(`Rank: ${rank.letter}`);
    this.rankText.setColor(rank.color);

    const killLine = stats.kills !== undefined ? `Enemies Vanquished: ${stats.kills}\n` : '';
    const bossLine = stats.bossDefeated ? 'The Nightmaw: Defeated\n' : '';

    this.bodyText.setText(
      `Memory Fragments: ${stats.fragments} / ${stats.fragmentsTotal}\n` +
      `Beacons Lit: ${stats.beacons} / ${stats.beaconsTotal}\n` +
      killLine +
      bossLine +
      `\nTime: ${timeStr}\n\n` +
      'The world remembers what you gave it.\n' +
      'And now, a new story may begin.\n\n' +
      '— Credits —\n' +
      'A game made with light and memory',
    );

    const footStr = stats.bossDefeated
      ? 'E = close  ·  R = restart  ·  D = Enter the Dawn'
      : 'E = close  ·  R = restart';
    this.footText.setText(footStr);

    this.container.setAlpha(0);
    this.container.setVisible(true);
    this._visible = true;

    // Stagger child element reveals
    const children = this.container.list as Phaser.GameObjects.GameObject[];
    for (const child of children) {
      const go = child as unknown as { setAlpha?: (a: number) => void };
      if (go.setAlpha) go.setAlpha(0);
    }

    scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 400,
    });

    // Reveal each child element with staggered delay
    children.forEach((child, i) => {
      const go = child as unknown as { setAlpha?: (a: number) => void };
      if (go.setAlpha) {
        scene.tweens.add({
          targets: child,
          alpha: 1,
          duration: 500,
          delay: 200 + i * 120,
          ease: 'Sine.easeOut',
        });
      }
    });

    // Rank text scale bounce
    this.rankText.setScale(0.5);
    scene.tweens.add({
      targets: this.rankText,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      delay: 600,
      ease: 'Back.easeOut',
    });

    // Camera flash for dramatic reveal
    scene.cameras.main.flash(300, 200, 220, 255, false);
  }

  hide(): void {
    this.container.setVisible(false);
    this._visible = false;
  }
}
