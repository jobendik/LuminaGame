import Phaser from 'phaser';

export interface WindZoneConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  strength: number; // positive = push right, negative = push left
}

export class WindZone {
  private zone: Phaser.GameObjects.Zone;
  private particles: Phaser.GameObjects.Graphics[] = [];
  private scene: Phaser.Scene;
  readonly strength: number;
  private config: WindZoneConfig;
  private arrows: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene, config: WindZoneConfig) {
    this.scene = scene;
    this.config = config;
    this.strength = config.strength;

    // Physics zone for overlap detection
    this.zone = scene.add.zone(config.x, config.y, config.width, config.height);
    scene.physics.add.existing(this.zone, true);

    // Directional arrow indicators inside the zone
    const dir = config.strength > 0 ? 1 : -1;
    const arrowChar = dir > 0 ? '›' : '‹';
    const arrowCount = 3;
    for (let i = 0; i < arrowCount; i++) {
      const ax = config.x - config.width / 2 + ((i + 1) / (arrowCount + 1)) * config.width;
      const ay = config.y - 20;
      const arrow = scene.add.text(ax, ay, arrowChar, {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#aaddff',
      });
      arrow.setOrigin(0.5);
      arrow.setDepth(1);
      arrow.setAlpha(0);
      this.arrows.push(arrow);

      // Pulsing float animation
      scene.tweens.add({
        targets: arrow,
        alpha: { from: 0, to: 0.5 },
        x: ax + dir * 30,
        yoyo: true,
        repeat: -1,
        duration: 1400 + i * 200,
        ease: 'Sine.easeInOut',
        delay: i * 300,
      });
    }

    // Wind streak visuals
    for (let i = 0; i < 6; i++) {
      const streak = scene.add.graphics();
      streak.setDepth(1);
      streak.setAlpha(0);
      this.particles.push(streak);
      this.animateStreak(streak, i * 300);
    }
  }

  getZone(): Phaser.GameObjects.Zone {
    return this.zone;
  }

  private animateStreak(streak: Phaser.GameObjects.Graphics, delay: number): void {
    const cfg = this.config;
    const dir = cfg.strength > 0 ? 1 : -1;

    const animate = () => {
      const startX = dir > 0 ? cfg.x - cfg.width / 2 : cfg.x + cfg.width / 2;
      const endX = dir > 0 ? cfg.x + cfg.width / 2 : cfg.x - cfg.width / 2;
      const y = cfg.y - cfg.height / 2 + Math.random() * cfg.height;

      streak.clear();
      streak.lineStyle(1, 0xaaddff, 0.4);
      streak.lineBetween(0, 0, dir * 20, 0);
      streak.setPosition(startX, y);
      streak.setAlpha(0);

      this.scene.tweens.add({
        targets: streak,
        x: endX,
        alpha: { from: 0, to: 0.35 },
        duration: 1200 + Math.random() * 600,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          streak.setAlpha(0);
          this.scene.time.delayedCall(200 + Math.random() * 400, animate);
        },
      });
    };

    this.scene.time.delayedCall(delay, animate);
  }
}
