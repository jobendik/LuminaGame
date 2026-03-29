import Phaser from 'phaser';
import { AbilityId } from '../types';
import { BaseAbility } from './Ability';
import { PHYSICS } from '../config';

export class DashAbility extends BaseAbility {
  id = AbilityId.DASH;
  unlockCondition = 'chapter_2_complete';

  onActivate(player: Phaser.Physics.Arcade.Sprite): void {
    const body = player.body as Phaser.Physics.Arcade.Body;
    const dir = player.flipX ? -1 : 1;
    body.setVelocityX(PHYSICS.PLAYER_DASH_VELOCITY * dir);
    body.setVelocityY(0);
    body.setAllowGravity(false);
  }

  onUpdate(_player: Phaser.Physics.Arcade.Sprite, _delta: number): void {
    // Dash duration is managed by PlayerSystem
  }

  onDeactivate(player: Phaser.Physics.Arcade.Sprite): void {
    const body = player.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
  }
}
