import { GameScene } from '../scenes/GameScene';

export function buildPauseMenu(s: GameScene) {
  s.pauseMenu = s.add.container(s.scale.width / 2, s.scale.height / 2).setScrollFactor(0).setDepth(300);
  const bg = s.add.rectangle(0, 0, 700, 340, 0x050d1e, 0.90).setStrokeStyle(1.5, 0xffffff, 0.08);
  const glow = s.add.ellipse(0, -90, 400, 110, 0x8090c0, 0.05).setBlendMode(Phaser.BlendModes.SCREEN);
  const title = s.add.text(0, -100, 'Pause', { fontFamily: 'Cinzel, serif', fontSize: '44px', color: '#fff6dc' }).setOrigin(0.5);
  title.setShadow(0, 0, '#6090c0', 14, true, true);
  const body = s.add.text(0, 10,
    'ESC / P = continue   ·   R = restart\n\nA/D = move  ·  Space = jump  ·  Shift = dash\nE = interact  ·  Wall-jump against walls',
    { fontFamily: 'Nunito', fontSize: '18px', color: '#b0c0d0', align: 'center', lineSpacing: 8 }
  ).setOrigin(0.5);
  const foot = s.add.text(0, 110, 'Take a breath. Move on when you are ready.', { fontFamily: 'Nunito', fontSize: '15px', color: '#607890' }).setOrigin(0.5);
  s.pauseMenu.add([bg, glow, title, body, foot]);
  s.pauseMenu.setVisible(false);
}

export function togglePause(s: GameScene) {
  if (s.endingOverlay.visible) return;
  s.pausedGame = !s.pausedGame;
  if (s.pausedGame) {
    s.physics.world.pause(); s.anims.pauseAll();
    s.pauseMenu.setAlpha(0); s.pauseMenu.setVisible(true);
    s.tweens.add({ targets: s.pauseMenu, alpha: 1, duration: 160 });
  } else {
    s.physics.world.resume(); s.anims.resumeAll();
    s.pauseMenu.setVisible(false);
  }
}
