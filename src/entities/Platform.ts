import Phaser from 'phaser';

export function createPlatforms(
  scene: Phaser.Scene,
  textureKey: string,
  platformData: Array<{ x: number; y: number; scaleX?: number; scaleY?: number }>
): Phaser.Physics.Arcade.StaticGroup {
  const group = scene.physics.add.staticGroup();

  for (const data of platformData) {
    const platform = group.create(data.x, data.y, textureKey) as Phaser.Physics.Arcade.Sprite;
    if (data.scaleX) platform.setScale(data.scaleX, data.scaleY ?? 1);
    platform.refreshBody();
  }

  return group;
}
