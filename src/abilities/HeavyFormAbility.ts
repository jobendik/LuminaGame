import Phaser from 'phaser';
import { AbilityId } from '../types';
import { BaseAbility } from './Ability';

export class HeavyFormAbility extends BaseAbility {
  id = AbilityId.HEAVY_FORM;
  unlockCondition = 'chapter_4_complete';

  onActivate(player: Phaser.Physics.Arcade.Sprite): void {
    const body = player.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(250);
    player.setTint(0x666688);
  }

  onUpdate(_player: Phaser.Physics.Arcade.Sprite, _delta: number): void {
    // Heavy form persists while active
  }

  onDeactivate(player: Phaser.Physics.Arcade.Sprite): void {
    const body = player.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(0);
    player.clearTint();
  }
}
