import Phaser from 'phaser';
import { AbilityId } from '../types';
import { BaseAbility } from './Ability';
import { PHYSICS } from '../config';

export class GlideAbility extends BaseAbility {
  id = AbilityId.GLIDE;
  unlockCondition = 'chapter_3_complete';

  onActivate(player: Phaser.Physics.Arcade.Sprite): void {
    const body = player.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(-PHYSICS.GRAVITY + PHYSICS.PLAYER_GLIDE_GRAVITY);
  }

  onUpdate(_player: Phaser.Physics.Arcade.Sprite, _delta: number): void {
    // Glide continues while held
  }

  onDeactivate(player: Phaser.Physics.Arcade.Sprite): void {
    const body = player.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(0);
  }
}
