export enum PlayerState {
  IDLE = 'IDLE',
  RUN = 'RUN',
  JUMP = 'JUMP',
  FALL = 'FALL',
  DASH = 'DASH',
  GLIDE = 'GLIDE',
  WALL_SLIDE = 'WALL_SLIDE',
  HEAVY_FORM = 'HEAVY_FORM',
  HURT = 'HURT',
  DEAD = 'DEAD',
  ATTACK = 'ATTACK',
  BLAST = 'BLAST',
}

export enum AbilityId {
  JUMP = 'jump',
  DASH = 'dash',
  GLIDE = 'glide',
  HEAVY_FORM = 'heavy_form',
  SPIRIT_VISION = 'spirit_vision',
  ATTACK = 'attack',
  BLAST = 'blast',
}

export enum RegionId {
  SILENT_PLAINS = 'silent_plains',
  ECHO_FOREST = 'echo_forest',
  SUNKEN_RUINS = 'sunken_ruins',
  SKY_FRACTURE = 'sky_fracture',
  CORE_VEIL = 'core_veil',
}

export interface IAbility {
  id: AbilityId;
  unlockCondition: string;
  onActivate(player: Phaser.Physics.Arcade.Sprite): void;
  onUpdate(player: Phaser.Physics.Arcade.Sprite, delta: number): void;
  onDeactivate(player: Phaser.Physics.Arcade.Sprite): void;
}

export interface IRegionData {
  id: RegionId;
  name: string;
  palette: {
    primary: number;
    secondary: number;
    accent: number;
    background: number;
  };
  mechanicModifier?: string;
  soundscape: string;
}

export interface ICharacterData {
  name: string;
  visualTheme: string;
  emotionalTheme: string;
  interactionType: 'silent' | 'movement' | 'environmental' | 'text';
}

export interface ICheckpointData {
  x: number;
  y: number;
  id: string;
}
