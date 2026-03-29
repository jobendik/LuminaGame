import { GameScene } from '../scenes/GameScene';
import { genTextures } from './TextureGenerator';
import { genHeroFrames } from './HeroFrames';
import { genWraithFrames } from './WraithFrames';
import { genCritterFrames } from './CritterFrames';
import { genAnimations } from './AnimationDefs';

export function buildProceduralAssets(s: GameScene) {
  genTextures(s);
  genHeroFrames(s);
  genWraithFrames(s);
  genCritterFrames(s);
  genAnimations(s);
}
