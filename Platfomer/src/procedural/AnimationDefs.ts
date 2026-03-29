import { GameScene } from '../scenes/GameScene';

export function genAnimations(s: GameScene) {
  const mk = (key: string, prefix: string, count: number, rate: number, rep: number = -1) => {
    if (!s.anims.exists(key))
      s.anims.create({ key, frames: Array.from({length:count},(_,i)=>({key:prefix+i})), frameRate: rate, repeat: rep });
  };
  mk('hero-idle', 'hero_idle_', 4, 6);
  mk('hero-run', 'hero_run_', 6, 13);
  mk('hero-jump', 'hero_jump_', 2, 7);
  mk('hero-dash', 'hero_dash_', 2, 16);
  mk('hero-hurt', 'hero_hurt_', 2, 10);
  mk('hero-wall', 'hero_wall_', 2, 8);
  mk('wraith-float', 'wraith_', 4, 8);
  mk('boss-float', 'boss_', 4, 10);
  mk('critter-hop', 'critter_', 4, 8);
}
