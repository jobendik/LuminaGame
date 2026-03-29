import Phaser from 'phaser';
import { AbilityId } from '../types';
import { BaseAbility } from './Ability';
import { PHYSICS } from '../config';

export class JumpAbility extends BaseAbility {
  id = AbilityId.JUMP;
  unlockCondition = 'default';

  onActivate(player: Phaser.Physics.Arcade.Sprite): void {
    const body = player.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(PHYSICS.PLAYER_JUMP_VELOCITY);
  }

  onUpdate(_player: Phaser.Physics.Arcade.Sprite, _delta: number): void {
    // Jump is instant — no continuous update needed
  }

  onDeactivate(_player: Phaser.Physics.Arcade.Sprite): void {
    // No cleanup needed
  }
}
