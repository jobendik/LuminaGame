import { GameScene } from '../scenes/GameScene';

export function buildToastLayer(s: GameScene) {
  s.toastLayer = s.add.container(s.scale.width / 2, 80).setScrollFactor(0).setDepth(240);
}

export function showToast(s: GameScene, text: string, color: string = '#ffffff') {
  const box = s.add.rectangle(0, 0, Math.min(800, 120 + text.length * 5.5), 42, 0x080e20, 0.82);
  box.setStrokeStyle(1, 0xffffff, 0.05);
  const label = s.add.text(0, 0, text, { fontFamily: 'Nunito, sans-serif', fontSize: '17px', color }).setOrigin(0.5);
  const group = s.add.container(0, 0, [box, label]);
  s.toastLayer.add(group);
  group.y = 0; group.alpha = 0;
  s.tweens.add({ targets: group, alpha: 1, y: -16, duration: 180, yoyo: true, hold: 1400, onComplete: () => group.destroy() });
}
