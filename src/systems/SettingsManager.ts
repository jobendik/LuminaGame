const SETTINGS_KEY = 'lumina-settings';

export interface GameSettings {
  masterVolume: number; // 0.0 – 1.0
  musicVolume: number;  // 0.0 – 1.0
  sfxVolume: number;    // 0.0 – 1.0
  screenShake: boolean;
}

const DEFAULTS: GameSettings = {
  masterVolume: 0.8,
  musicVolume: 0.7,
  sfxVolume: 0.8,
  screenShake: true,
};

class SettingsManagerClass {
  private settings: GameSettings;

  constructor() {
    this.settings = { ...DEFAULTS };
    this.load();
  }

  get(): GameSettings {
    return { ...this.settings };
  }

  set<K extends keyof GameSettings>(key: K, value: GameSettings[K]): void {
    this.settings[key] = value;
    this.save();
  }

  /** Effective music volume = musicVolume * masterVolume */
  get effectiveMusicVolume(): number {
    return this.settings.musicVolume * this.settings.masterVolume;
  }

  /** Effective SFX volume = sfxVolume * masterVolume */
  get effectiveSfxVolume(): number {
    return this.settings.sfxVolume * this.settings.masterVolume;
  }

  private save(): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      // fail silently
    }
  }

  private load(): void {
    try {
      const json = localStorage.getItem(SETTINGS_KEY);
      if (!json) return;
      const data = JSON.parse(json);
      if (typeof data.masterVolume === 'number') this.settings.masterVolume = data.masterVolume;
      if (typeof data.musicVolume === 'number') this.settings.musicVolume = data.musicVolume;
      if (typeof data.sfxVolume === 'number') this.settings.sfxVolume = data.sfxVolume;
      if (typeof data.screenShake === 'boolean') this.settings.screenShake = data.screenShake;
    } catch {
      // use defaults
    }
  }
}

/** Global singleton — import and use anywhere */
export const SettingsManager = new SettingsManagerClass();
