import { GameScene } from '../scenes/GameScene';

export function buildPlayer(s: GameScene) {
  s.player = s.physics.add.sprite(200, 460, 'hero_idle_0');
  s.player.play('hero-idle');
  s.player.setCollideWorldBounds(true);
  s.player.setDragX(900);
  s.player.setMaxVelocity(800, 1400);
  s.player.setDepth(30);
  
  const body = s.player.body as Phaser.Physics.Arcade.Body;
  body.setSize(22, 50);
  body.setOffset(21, 16);
  
  s.physics.add.collider(s.player, s.ground);
  s.physics.add.collider(s.player, s.platforms);
}
