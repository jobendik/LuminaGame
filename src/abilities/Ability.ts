import Phaser from 'phaser';
import { IAbility, AbilityId } from '../types';

export abstract class BaseAbility implements IAbility {
  abstract id: AbilityId;
  abstract unlockCondition: string;

  abstract onActivate(player: Phaser.Physics.Arcade.Sprite): void;
  abstract onUpdate(player: Phaser.Physics.Arcade.Sprite, delta: number): void;
  abstract onDeactivate(player: Phaser.Physics.Arcade.Sprite): void;
}
