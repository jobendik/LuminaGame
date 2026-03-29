import { IAbility, AbilityId } from '../types';

export class AbilitySystem {
  private abilities = new Map<AbilityId, IAbility>();
  private unlockedAbilities = new Set<AbilityId>();

  register(ability: IAbility): void {
    this.abilities.set(ability.id, ability);
  }

  unlock(id: AbilityId): void {
    this.unlockedAbilities.add(id);
  }

  isUnlocked(id: AbilityId): boolean {
    return this.unlockedAbilities.has(id);
  }

  getAbility(id: AbilityId): IAbility | undefined {
    return this.abilities.get(id);
  }

  getUnlockedAbilities(): IAbility[] {
    return Array.from(this.unlockedAbilities)
      .map((id) => this.abilities.get(id))
      .filter((a): a is IAbility => a !== undefined);
  }
}
