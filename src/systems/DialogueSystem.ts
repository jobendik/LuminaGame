import Phaser from 'phaser';

export interface DialogueLine {
  speaker: string;
  text: string;
}

export interface PortraitColors {
  skin: number;
  robe: number;
  hair: number;
  glow: number;
}

export class DialogueSystem {
  private scene: Phaser.Scene;
  private uiScene!: Phaser.Scene;

  // UI elements (created by UIScene)
  private container!: Phaser.GameObjects.Container;
  private speakerText!: Phaser.GameObjects.Text;
  private lineText!: Phaser.GameObjects.Text;
  private continueText!: Phaser.GameObjects.Text;
  private portraitGraphics!: Phaser.GameObjects.Graphics;
  private portraitImage: Phaser.GameObjects.Image | null = null;
  private portraitImageX = 0;
  private portraitImageY = 0;

  // State
  private lines: DialogueLine[] = [];
  private currentIndex = 0;
  private isTyping = false;
  private typingEvent: Phaser.Time.TimerEvent | null = null;
  private fullText = '';
  private charIndex = 0;
  private _isOpen = false;

  private onCloseCallback: (() => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  /** Called by UIScene to hand over the UI elements */
  bindUI(
    container: Phaser.GameObjects.Container,
    speakerText: Phaser.GameObjects.Text,
    lineText: Phaser.GameObjects.Text,
    continueText: Phaser.GameObjects.Text,
    portraitGraphics: Phaser.GameObjects.Graphics,
    uiScene: Phaser.Scene,
  ): void {
    this.container = container;
    this.speakerText = speakerText;
    this.lineText = lineText;
    this.continueText = continueText;
    this.portraitGraphics = portraitGraphics;
    this.portraitImageX = portraitGraphics.x;
    this.portraitImageY = portraitGraphics.y;
    this.uiScene = uiScene;
  }

  open(lines: DialogueLine[], onClose?: () => void, portrait?: PortraitColors, portraitKey?: string): void {
    if (!this.container || lines.length === 0) return;
    this._isOpen = true;
    this.lines = lines;
    this.currentIndex = 0;
    this.onCloseCallback = onClose ?? null;

    // Remove previous portrait image if any
    if (this.portraitImage) {
      this.portraitImage.destroy();
      this.portraitImage = null;
    }

    // Use real portrait image if key is provided and texture exists
    if (portraitKey && this.uiScene.textures.exists(portraitKey)) {
      this.portraitGraphics.clear();
      this.portraitImage = this.uiScene.add.image(
        this.portraitImageX, this.portraitImageY,
        portraitKey,
      );
      // Scale to fit the portrait panel (~110px tall, keep aspect ratio)
      const targetH = 130;
      const finalScale = targetH / this.portraitImage.height;
      this.portraitImage.setOrigin(0.5, 0.5);
      this.portraitImage.setAlpha(0);
      this.portraitImage.setScale(finalScale * 0.7);
      this.container.add(this.portraitImage);
      this.uiScene.tweens.add({
        targets: this.portraitImage,
        alpha: 1,
        scaleX: finalScale,
        scaleY: finalScale,
        duration: 300,
        delay: 100,
        ease: 'Back.easeOut',
      });
    } else if (portrait) {
      // Fallback: draw procedural portrait from colors
      this.drawPortrait(portrait);
    } else {
      this.portraitGraphics.clear();
    }

    this.container.setAlpha(0);
    this.container.setScale(0.88);
    this.container.setVisible(true);
    this.uiScene.tweens.add({
      targets: this.container,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 250,
      ease: 'Back.easeOut',
    });

    this.showLine(0);
    this.scene.events.emit('play-sfx', 'sfx-dialogue-open', 0.2);
  }

  advance(): void {
    // If still typing, skip to full text
    if (this.isTyping) {
      this.typingEvent?.remove();
      this.typingEvent = null;
      this.lineText.setText(this.fullText);
      this.isTyping = false;
      return;
    }

    this.currentIndex++;
    if (this.currentIndex >= this.lines.length) {
      this.close();
      return;
    }

    this.showLine(this.currentIndex);
  }

  close(): void {
    if (this.typingEvent) {
      this.typingEvent.remove();
      this.typingEvent = null;
    }
    this.isTyping = false;
    this._isOpen = false;

    // Clean up portrait image
    if (this.portraitImage) {
      this.portraitImage.destroy();
      this.portraitImage = null;
    }

    this.uiScene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 180,
      onComplete: () => this.container.setVisible(false),
    });

    this.onCloseCallback?.();
    this.onCloseCallback = null;
    this.scene.events.emit('dialogue-closed');
  }

  private showLine(index: number): void {
    const line = this.lines[index];
    this.speakerText.setText(line.speaker);
    this.continueText.setText(
      index < this.lines.length - 1 ? '▸ Press E for next' : '▸ Press E to close',
    );

    // Start typewriter
    this.fullText = line.text;
    this.charIndex = 0;
    this.isTyping = true;
    this.lineText.setText('');

    // Quick fade for new line
    this.lineText.setAlpha(0);
    this.uiScene.tweens.add({ targets: this.lineText, alpha: 1, duration: 120 });

    this.typingEvent = this.uiScene.time.addEvent({
      delay: 25,
      repeat: line.text.length - 1,
      callback: () => {
        this.charIndex++;
        this.lineText.setText(this.fullText.substring(0, this.charIndex));
        // Typewriter click on every 2nd non-space character
        const ch = this.fullText[this.charIndex - 1];
        if (ch && ch !== ' ' && this.charIndex % 2 === 0) {
          this.scene.events.emit('play-sfx', 'sfx-dialogue-open', 0.04);
        }
        if (this.charIndex >= this.fullText.length) {
          this.isTyping = false;
        }
      },
    });
  }

  private drawPortrait(colors: PortraitColors): void {
    const g = this.portraitGraphics;
    g.clear();

    // Portrait is drawn at (0,0) relative to its container position
    const cx = 0;
    const cy = 0;

    // Background glow
    g.fillStyle(colors.glow, 0.12);
    g.fillCircle(cx, cy - 4, 42);

    // Robe / shoulders
    g.fillStyle(colors.robe, 1);
    g.fillRoundedRect(cx - 28, cy + 12, 56, 32, 8);
    // Robe inner shading
    const robeColor = Phaser.Display.Color.IntegerToColor(colors.robe);
    g.fillStyle(robeColor.darken(20).color, 0.6);
    g.fillRoundedRect(cx - 22, cy + 18, 44, 24, 6);
    // Collar highlight
    g.fillStyle(robeColor.lighten(15).color, 0.5);
    g.fillRoundedRect(cx - 12, cy + 10, 24, 8, 3);

    // Neck
    g.fillStyle(colors.skin, 1);
    g.fillRect(cx - 5, cy + 6, 10, 10);

    // Head
    g.fillStyle(colors.skin, 1);
    g.fillCircle(cx, cy - 8, 22);
    // Cheek blush
    g.fillStyle(0xffaaaa, 0.08);
    g.fillCircle(cx - 12, cy - 4, 6);
    g.fillCircle(cx + 12, cy - 4, 6);

    // Hair — main volume
    g.fillStyle(colors.hair, 1);
    g.fillEllipse(cx, cy - 22, 50, 28);
    // Hair side wisps
    g.fillStyle(colors.hair, 0.8);
    g.fillEllipse(cx - 18, cy - 10, 14, 20);
    g.fillEllipse(cx + 18, cy - 10, 14, 20);

    // Eyes
    g.fillStyle(0xffffff, 0.9);
    g.fillEllipse(cx - 8, cy - 8, 8, 6);
    g.fillEllipse(cx + 8, cy - 8, 8, 6);
    // Iris
    g.fillStyle(colors.glow, 0.8);
    g.fillCircle(cx - 8, cy - 8, 2.5);
    g.fillCircle(cx + 8, cy - 8, 2.5);
    // Pupil
    g.fillStyle(0x1d1d29, 1);
    g.fillCircle(cx - 8, cy - 8, 1.5);
    g.fillCircle(cx + 8, cy - 8, 1.5);
    // Eye highlights
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(cx - 9, cy - 9, 1);
    g.fillCircle(cx + 7, cy - 9, 1);

    // Subtle mouth
    g.lineStyle(1, 0x000000, 0.12);
    g.beginPath();
    g.arc(cx, cy + 2, 4, Phaser.Math.DegToRad(10), Phaser.Math.DegToRad(170), false);
    g.strokePath();
  }
}
