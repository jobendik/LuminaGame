import Phaser from 'phaser';
import { CAMERA } from '../config';
import { lerp } from '../utils/math';

export class CameraSystem {
  private scene: Phaser.Scene;
  private target: Phaser.Physics.Arcade.Sprite | null = null;
  private offsetX = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setTarget(target: Phaser.Physics.Arcade.Sprite): void {
    this.target = target;
    this.scene.cameras.main.startFollow(target, false, CAMERA.LERP, CAMERA.LERP);
    this.scene.cameras.main.setDeadzone(40, CAMERA.VERTICAL_DEADZONE);
  }

  setBounds(width: number, height: number): void {
    this.scene.cameras.main.setBounds(0, 0, width, height);
  }

  /** Subtle screen shake — intensity scales with force */
  shake(intensity = 0.005, duration = 100): void {
    this.scene.cameras.main.shake(duration, intensity);
  }

  /** Quick zoom pulse — subtle camera "punch" */
  zoomPulse(amount = 0.02, duration = 200): void {
    const cam = this.scene.cameras.main;
    const baseZoom = cam.zoom;
    this.scene.tweens.add({
      targets: cam,
      zoom: baseZoom + amount,
      duration: duration / 2,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }

  update(): void {
    if (!this.target) return;

    const body = this.target.body as Phaser.Physics.Arcade.Body;
    const targetOffset =
      body.velocity.x > 10
        ? CAMERA.LOOK_AHEAD
        : body.velocity.x < -10
          ? -CAMERA.LOOK_AHEAD
          : 0;

    this.offsetX = lerp(this.offsetX, targetOffset, 0.05);
    this.scene.cameras.main.setFollowOffset(-this.offsetX, 0);
  }
}
