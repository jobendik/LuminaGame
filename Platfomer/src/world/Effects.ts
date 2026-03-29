import { GameScene } from '../scenes/GameScene';
import { CFG } from '../config';

export function buildEffects(s: GameScene) {
  s.ambientParticles = s.add.particles(0, 0, 'particleSoft', {
    x: { min: 0, max: CFG.WORLD_W }, y: { min: 30, max: CFG.GROUND_Y - 20 },
    speedX: { min: -6, max: 6 }, speedY: { min: -14, max: -4 },
    lifespan: { min: 3000, max: 7000 }, scale: { start: 0.22, end: 0.02 },
    alpha: { start: 0.22, end: 0 }, quantity: 1, frequency: 60,
    tint: [0xc8f2ff, 0xf3dbff, 0xfff4c4, 0xb6ffda], blendMode: 'SCREEN'
  }).setDepth(4);

  s.jumpParticles = s.add.particles(0, 0, 'spark', {
    emitting: false, speedX: { min: -200, max: 200 }, speedY: { min: -160, max: -30 },
    lifespan: { min: 300, max: 600 }, scale: { start: 0.7, end: 0.02 },
    alpha: { start: 1, end: 0 }, blendMode: 'SCREEN',
    tint: [0xdff8ff, 0xf5dcff, 0xffefb0, 0xb0e8ff]
  }).setDepth(35);

  s.trailParticles = s.add.particles(0, 0, 'spark', {
    emitting: false, follow: s.player, followOffset: { x: 0, y: 20 }, frequency: 28,
    speedX: { min: -10, max: 10 }, speedY: { min: 2, max: 14 },
    lifespan: { min: 200, max: 450 }, scale: { start: 0.24, end: 0.02 },
    alpha: { start: 0.3, end: 0 }, tint: [0xbdeaff, 0xeed8ff], blendMode: 'SCREEN'
  }).setDepth(35);
  s.trailParticles.stop();

  s.pageGlowParticles = s.add.particles(0, 0, 'particleSoft', {
    emitting: false, speed: { min: 14, max: 70 }, angle: { min: 0, max: 360 },
    lifespan: { min: 400, max: 900 }, scale: { start: 0.4, end: 0.02 },
    alpha: { start: 0.85, end: 0 }, tint: [0xfff4bb, 0xe9d4ff, 0xcdeeff], blendMode: 'SCREEN'
  }).setDepth(40);

  s.weatherParticles = s.add.particles(0, 0, 'particleSoft', {
    x: { min: 0, max: CFG.WORLD_W }, y: { min: -20, max: 200 },
    speedX: { min: -10, max: 16 }, speedY: { min: 16, max: 50 },
    lifespan: { min: 4000, max: 7500 }, scale: { start: 0.16, end: 0.04 },
    alpha: { start: 0.10, end: 0 }, quantity: 1, frequency: 50,
    tint: [0xd8ecff, 0xf2dfff, 0xfff2bd], blendMode: 'SCREEN'
  }).setDepth(3);

  s.portalBurst = s.add.particles(0, 0, 'spark', {
    emitting: false, speed: { min: 60, max: 200 }, angle: { min: 0, max: 360 },
    lifespan: { min: 400, max: 1300 }, scale: { start: 0.7, end: 0.02 },
    alpha: { start: 1, end: 0 }, tint: [0xbfeeff, 0xf9e2ff, 0xfff4b8], blendMode: 'SCREEN'
  }).setDepth(70);

  s.damageParticles = s.add.particles(0, 0, 'spark', {
    emitting: false, speed: { min: 70, max: 240 }, angle: { min: 0, max: 360 },
    lifespan: { min: 300, max: 800 }, scale: { start: 0.6, end: 0.02 },
    alpha: { start: 1, end: 0 }, tint: [0xff6080, 0xffa0b0, 0x80c0ff], blendMode: 'SCREEN'
  }).setDepth(75);

  s.checkpointParticles = s.add.particles(0, 0, 'spark', {
    emitting: false, speed: { min: 20, max: 100 }, angle: { min: 0, max: 360 },
    lifespan: { min: 600, max: 1200 }, scale: { start: 0.5, end: 0.05 },
    alpha: { start: 0.85, end: 0 }, tint: [0xfff0b8, 0xbfeeff, 0xdfffd4], blendMode: 'SCREEN'
  }).setDepth(55);

  s.secretParticles = s.add.particles(0, 0, 'spark', {
    emitting: false, speed: { min: 15, max: 80 }, angle: { min: 0, max: 360 },
    lifespan: { min: 500, max: 1100 }, scale: { start: 0.45, end: 0.03 },
    alpha: { start: 0.9, end: 0 }, tint: [0xbfffd9, 0xe7ffe9], blendMode: 'SCREEN'
  }).setDepth(55);
}
