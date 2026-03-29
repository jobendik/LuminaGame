import Phaser from 'phaser';
import { AbilityId } from '../types';
import { BaseAbility } from './Ability';

export class SpiritVisionAbility extends BaseAbility {
  id = AbilityId.SPIRIT_VISION;
  unlockCondition = 'chapter_5_complete';

  onActivate(player: Phaser.Physics.Arcade.Sprite): void {
    // Tint the world slightly to indicate vision mode
    player.scene.cameras.main.setPostPipeline([]);
    player.setTint(0xaaeeff);
  }

  onUpdate(_player: Phaser.Physics.Arcade.Sprite, _delta: number): void {
    // Vision persists while active
  }

  onDeactivate(player: Phaser.Physics.Arcade.Sprite): void {
    player.clearTint();
  }
}
