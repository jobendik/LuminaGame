import Phaser from 'phaser';
import { DialogueLine } from '../systems/DialogueSystem';

export interface NPCColors {
  skin: number;
  robe: number;
  hair: number;
  glow: number;
}

export interface NPCConfig {
  x: number;
  y: number;
  name: string;
  colors: NPCColors;
  lines: DialogueLine[];
  getLines?: () => DialogueLine[];
  spriteKey?: string;
  portraitKey?: string;
}

export class NPC extends Phaser.GameObjects.Container {
  public npcName: string;
  public dialogueLines: DialogueLine[];
  public colors: NPCColors;
  public portraitKey?: string;
  private getLinesFn?: () => DialogueLine[];
  public aura: Phaser.GameObjects.Arc;
  public promptBubble: Phaser.GameObjects.Container;

  private baseY: number;
  private bobPhase: number;
  private visualHeight: number;

  constructor(scene: Phaser.Scene, config: NPCConfig, index: number) {
    super(scene, config.x, config.y);

    this.npcName = config.name;
    this.dialogueLines = config.lines;
    this.colors = config.colors;
    this.portraitKey = config.portraitKey;
    this.getLinesFn = config.getLines;
    this.baseY = config.y;
    this.bobPhase = index * 0.9;
    this.visualHeight = 82;

    scene.add.existing(this);
    this.setDepth(25);

    if (config.spriteKey && scene.textures.exists(config.spriteKey)) {
      // Use real sprite art
      const sprite = scene.add.image(0, 0, config.spriteKey);
      sprite.setOrigin(0.5, 1);
      // Normalize imported NPC art to a stable world height.
      const targetHeight = 108;
      sprite.setScale(targetHeight / sprite.height);
      this.visualHeight = sprite.displayHeight;
      this.add(sprite);

      // Ground shadow
      const shadow = scene.add.graphics();
      shadow.fillStyle(0x000000, 0.18);
      shadow.fillEllipse(0, 6, 48, 10);
      this.add(shadow);
    } else {
      // Procedural fallback — draw NPC body
      this.drawProceduralBody(scene, config);
    }

    // Name tag — position above sprite
    const nameY = (config.spriteKey && scene.textures.exists(config.spriteKey))
      ? -this.visualHeight - 22
      : -80;
    const shortName = config.name.split(',')[0];
    const tag = scene.add.text(0, nameY, shortName, {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#ffe8c0',
    }).setOrigin(0.5).setAlpha(0.7);
    this.add(tag);

    // Aura glow
  this.aura = scene.add.circle(config.x, config.y - this.visualHeight * 0.52, 50, config.colors.glow, 0.08);
    this.aura.setBlendMode(Phaser.BlendModes.SCREEN);
    this.aura.setDepth(24);
    scene.tweens.add({
      targets: this.aura,
      alpha: { from: 0.04, to: 0.14 },
      scale: { from: 0.9, to: 1.15 },
      duration: 2000 + index * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Prompt bubble (E to talk)
    this.promptBubble = scene.add.container(config.x, config.y - this.visualHeight - 18);
    this.promptBubble.setDepth(60);
    const pb = scene.add.rectangle(0, 0, 100, 32, 0x0a1230, 0.85);
    pb.setStrokeStyle(1, 0xffffff, 0.08);
    const pt = scene.add.text(0, 0, '▸ E', {
      fontFamily: 'Georgia, sans-serif',
      fontSize: '16px',
      color: '#b0d8f0',
    }).setOrigin(0.5);
    this.promptBubble.add([pb, pt]);
    this.promptBubble.setVisible(false);
  }

  getCurrentLines(): DialogueLine[] {
    return this.getLinesFn ? this.getLinesFn() : this.dialogueLines;
  }

  setGetLines(fn: () => DialogueLine[]): void {
    this.getLinesFn = fn;
  }

  update(time: number): void {
    const bob = Math.sin(time * 0.0022 + this.bobPhase) * 3.5;
    const sway = Math.sin(time * 0.0013 + this.bobPhase * 1.6) * 1.5;
    this.y = this.baseY + bob;
    this.x += (sway - (this.x - this.aura.x)) * 0.06;
    this.aura.x = this.x;
    this.aura.y = this.baseY - this.visualHeight * 0.52 + bob;
    this.promptBubble.x = this.x;
    this.promptBubble.y = this.baseY - this.visualHeight - 18 + bob;
  }

  private _nearPlayer = false;

  showPrompt(): void {
    if (!this.promptBubble.visible) {
      this.promptBubble.setVisible(true);
      this.promptBubble.setAlpha(0);
      this.promptBubble.setScale(0.7);
      this.scene.tweens.add({ targets: this.promptBubble, alpha: 1, scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.easeOut' });
    }
    // Brighten aura when player is close
    if (!this._nearPlayer) {
      this._nearPlayer = true;
      this.scene.tweens.killTweensOf(this.aura);
      this.scene.tweens.add({
        targets: this.aura,
        alpha: { from: this.aura.alpha, to: 0.28 },
        scale: { from: this.aura.scaleX, to: 1.4 },
        duration: 300,
        ease: 'Sine.easeOut',
      });
    }
  }

  hidePrompt(): void {
    if (this.promptBubble.visible) {
      this.scene.tweens.add({
        targets: this.promptBubble,
        alpha: 0,
        duration: 150,
        onComplete: () => this.promptBubble.setVisible(false),
      });
    }
    // Restore aura to idle pulse
    if (this._nearPlayer) {
      this._nearPlayer = false;
      this.scene.tweens.killTweensOf(this.aura);
      this.scene.tweens.add({
        targets: this.aura,
        alpha: { from: this.aura.alpha, to: 0.08 },
        scale: { from: this.aura.scaleX, to: 1 },
        duration: 400,
        ease: 'Sine.easeIn',
        onComplete: () => {
          // Restart idle pulse
          this.scene.tweens.add({
            targets: this.aura,
            alpha: { from: 0.04, to: 0.14 },
            scale: { from: 0.9, to: 1.15 },
            duration: 2400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        },
      });
    }
  }

  destroy(fromScene?: boolean): void {
    this.aura?.destroy();
    this.promptBubble?.destroy();
    super.destroy(fromScene);
  }

  private drawProceduralBody(scene: Phaser.Scene, config: NPCConfig): void {
    const g = scene.add.graphics();

    // Ground shadow
    g.fillStyle(0x000000, 0.12);
    g.fillEllipse(0, 16, 32, 8);

    // Feet / shoes
    g.fillStyle(Phaser.Display.Color.IntegerToColor(config.colors.robe).darken(30).color, 1);
    g.fillRoundedRect(-12, 10, 9, 6, 2);
    g.fillRoundedRect(3, 10, 9, 6, 2);

    // Robe body
    g.fillStyle(config.colors.robe, 1);
    g.fillRoundedRect(-17, -28, 34, 42, 8);
    g.fillStyle(config.colors.robe, 0.5);
    g.fillRoundedRect(-13, -24, 26, 36, 6);
    g.lineStyle(1, 0xffffff, 0.08);
    g.lineBetween(0, -20, 0, 12);

    // Shoulders / collar
    g.fillStyle(Phaser.Display.Color.IntegerToColor(config.colors.robe).darken(15).color, 1);
    g.fillRoundedRect(-19, -30, 38, 8, 4);

    // Head
    g.fillStyle(config.colors.skin, 1);
    g.fillCircle(0, -42, 16);
    g.fillStyle(0xffaaaa, 0.08);
    g.fillCircle(-9, -39, 4);
    g.fillCircle(9, -39, 4);

    // Hair
    g.fillStyle(config.colors.hair, 1);
    g.fillEllipse(0, -52, 36, 22);
    g.fillStyle(config.colors.hair, 0.7);
    g.fillEllipse(-8, -46, 12, 8);
    g.fillEllipse(8, -46, 12, 8);

    // Eyes
    g.fillStyle(0x1d1d29, 1);
    g.fillCircle(-6, -42, 2.5);
    g.fillCircle(6, -42, 2.5);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(-6.5, -42.5, 1);
    g.fillCircle(5.5, -42.5, 1);

    // Mouth
    g.lineStyle(1, 0x000000, 0.15);
    g.beginPath();
    g.arc(0, -37, 3, Phaser.Math.DegToRad(10), Phaser.Math.DegToRad(170), false);
    g.strokePath();

    this.add(g);
  }
}
