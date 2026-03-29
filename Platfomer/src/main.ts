import Phaser from 'phaser';
import { CFG, COLORS } from './config';
import { GameScene } from './scenes/GameScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: CFG.W,
  height: CFG.H,
  backgroundColor: COLORS.bg,
  physics: { 
    default: 'arcade', 
    arcade: { 
      gravity: { y: CFG.GRAVITY, x: 0 }, 
      debug: false 
    } 
  },
  scale: { 
    mode: Phaser.Scale.RESIZE, 
    autoCenter: Phaser.Scale.CENTER_BOTH 
  },
  scene: [GameScene],
  render: { antialias: true, pixelArt: false }
});
