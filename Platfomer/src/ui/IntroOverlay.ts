import { GameScene } from '../scenes/GameScene';

export function buildIntro(s: GameScene) {
  s.introOverlay = s.add.container(s.scale.width / 2, s.scale.height / 2).setScrollFactor(0).setDepth(200);
  const bg = s.add.rectangle(0, 0, 880, 400, 0x060e22, 0.82).setStrokeStyle(1.5, 0xffffff, 0.06);
  const glow = s.add.ellipse(0, -120, 500, 140, 0x8090c0, 0.06).setBlendMode(Phaser.BlendModes.SCREEN);
  const title = s.add.text(0, -130, 'REFORGED', { fontFamily: 'Cinzel, serif', fontSize: '52px', color: '#fff6dc' }).setOrigin(0.5);
  title.setShadow(0, 0, '#6090c0', 22, true, true);
  const body = s.add.text(0, 0,
    'Far beyond ordinary maps lies a place\nwhere stories leave their embers while they sleep.\n\nThis time, the world is also dangerous and testing.\n\nFind the lost pages, light the beacons,\nand run if the darkness awakens behind you.',
    { fontFamily: 'Nunito, sans-serif', fontSize: '20px', color: '#d0c8e0', align: 'center', lineSpacing: 8 }
  ).setOrigin(0.5);
  const hint = s.add.text(0, -160, 'A/D = move · Space = jump · Shift = dash · E = interact', {
    fontFamily: 'Nunito', fontSize: '13px', color: '#607890'
  }).setOrigin(0.5);
  const prompt = s.add.text(0, 148, '▸ Press E or Enter to begin', { fontFamily: 'Nunito', fontSize: '18px', color: '#90c0e0' }).setOrigin(0.5);
  s.tweens.add({ targets: prompt, alpha: { from: 0.4, to: 1 }, duration: 900, yoyo: true, repeat: -1 });
  s.introOverlay.add([bg, glow, title, hint, body, prompt]);
}
