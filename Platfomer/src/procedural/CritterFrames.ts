import { GameScene } from '../scenes/GameScene';

export function genCritterFrames(s: GameScene) {
  const draw = (key: string, bob: number, tail: number, blink: boolean) => {
    if (s.textures.exists(key)) return;
    const g = s.add.graphics();
    g.fillStyle(0xa8e0f0, 0.25); g.fillEllipse(18, 16 + bob, 28, 20);
    g.fillStyle(0xd5f4ff, 1); g.fillEllipse(18, 16 + bob, 22, 14);
    g.fillStyle(0x8ae1ff, 1);
    g.fillTriangle(6, 16 + bob, 1 + tail, 10 + bob, 1 + tail, 22 + bob);
    g.fillTriangle(30, 16 + bob, 35 - tail, 10 + bob, 35 - tail, 22 + bob);
    if (!blink) {
      g.fillStyle(0x1e3551, 1); g.fillCircle(15, 15 + bob, 1.8); g.fillCircle(21, 15 + bob, 1.8);
      g.fillStyle(0xffffff, 0.5); g.fillCircle(14.5, 14.5 + bob, 0.6); g.fillCircle(20.5, 14.5 + bob, 0.6);
    } else {
      g.fillStyle(0x1e3551, 1); g.fillRect(13.5, 15 + bob, 3, 1); g.fillRect(19.5, 15 + bob, 3, 1);
    }
    g.generateTexture(key, 36, 32); g.destroy();
  };
  ([[0,0,false], [1,1,false], [2,2,true], [1,1,false]] as const).forEach(([a,b,c], i) => draw('critter_'+i, a as number, b as number, c as boolean));
}
