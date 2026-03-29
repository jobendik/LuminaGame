import { GameScene } from '../scenes/GameScene';

export function buildEndingOverlay(s: GameScene) {
  s.endingOverlay = s.add.container(s.scale.width / 2, s.scale.height / 2).setScrollFactor(0).setDepth(260);
  const ebg = s.add.rectangle(0, 0, 960, 440, 0x050d1e, 0.88).setStrokeStyle(1.5, 0xffffff, 0.08);
  const eglow = s.add.ellipse(0, -100, 560, 140, 0xc0d8f0, 0.06).setBlendMode(Phaser.BlendModes.SCREEN);
  const etitle = s.add.text(0, -130, 'A new page begins', { fontFamily: 'Cinzel, serif', fontSize: '42px', color: '#fff6dc' }).setOrigin(0.5);
  etitle.setShadow(0, 0, '#6090c0', 18, true, true);
  const ebody = s.add.text(0, 16, '', {
    fontFamily: 'Nunito, sans-serif', fontSize: '19px', color: '#e0d8f0', align: 'center', lineSpacing: 8
  }).setOrigin(0.5);
  const efoot = s.add.text(0, 164, 'E = close  ·  R = restart', { fontFamily: 'Nunito', fontSize: '16px', color: '#80a0c0' }).setOrigin(0.5);
  s.endingOverlay.add([ebg, eglow, etitle, ebody, efoot]);
  s.endingOverlay.setVisible(false);
  s.endingBody = ebody;
}
