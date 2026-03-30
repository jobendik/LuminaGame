import Phaser from 'phaser';
import { WORLD_RENDER } from '../config';

export function createPlatforms(
  scene: Phaser.Scene,
  textureKey: string,
  platformData: Array<{ x: number; y: number; scaleX?: number; scaleY?: number }>
): Phaser.Physics.Arcade.StaticGroup {
  const group = scene.physics.add.staticGroup();
  const resolvedTextureKey = textureKey === 'platform' && scene.textures.exists(WORLD_RENDER.PLATFORM.REAL_TEXTURE_KEY)
    ? WORLD_RENDER.PLATFORM.REAL_TEXTURE_KEY
    : textureKey;

  for (const data of platformData) {
    const platform = group.create(data.x, data.y, resolvedTextureKey) as Phaser.Physics.Arcade.Sprite;
    const scaleX = data.scaleX ?? 1;
    const scaleY = data.scaleY ?? 1;
    platform.setDisplaySize(
      WORLD_RENDER.PLATFORM.WIDTH * scaleX,
      WORLD_RENDER.PLATFORM.HEIGHT * scaleY,
    );
    platform.setDepth(2);
    platform.refreshBody();
  }

  return group;
}
