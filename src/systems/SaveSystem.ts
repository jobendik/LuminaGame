const SAVE_KEY = 'lumina-save';

export interface SaveData {
  checkpointIndex: number;
  collectedFragments: string[];
  activatedBeacons: number;
  killCount: number;
  timestamp: number;
}

export class SaveSystem {
  static save(data: SaveData): void {
    const json = JSON.stringify(data);
    try {
      localStorage.setItem(SAVE_KEY, json);
    } catch {
      // localStorage may be unavailable or full — fail silently
    }
  }

  static load(): SaveData | null {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      if (!json) return null;
      const data = JSON.parse(json) as SaveData;
      // Basic validation
      if (
        typeof data.checkpointIndex !== 'number' ||
        !Array.isArray(data.collectedFragments) ||
        typeof data.activatedBeacons !== 'number' ||
        typeof data.killCount !== 'number'
      ) {
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  static clear(): void {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // fail silently
    }
  }

  static hasSave(): boolean {
    try {
      return localStorage.getItem(SAVE_KEY) !== null;
    } catch {
      return false;
    }
  }
}
