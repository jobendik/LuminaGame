import Phaser from 'phaser';
import { SettingsManager } from './SettingsManager';

export class AudioSystem {
  private scene: Phaser.Scene;
  private currentTrack: Phaser.Sound.BaseSound | null = null;
  private currentTrackKey: string | null = null;
  private baseTrackVolume = 0.35;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    scene.events.on('settings-changed', () => this.applyVolume());
  }

  create(): void {
    // Audio will auto-play when playTrack is called
  }

  playTrack(key: string, config?: Phaser.Types.Sound.SoundConfig): void {
    // Don't restart the same track
    if (this.currentTrackKey === key && this.currentTrack) return;

    if (this.currentTrack) {
      // Crossfade: fade out old track while fading in new one
      const oldTrack = this.currentTrack;
      this.scene.tweens.add({
        targets: oldTrack,
        volume: 0,
        duration: 1500,
        ease: 'Sine.easeOut',
        onComplete: () => {
          oldTrack.stop();
          oldTrack.destroy();
        },
      });
    }

    this.currentTrack = null;
    this.currentTrackKey = null;

    if (this.scene.cache.audio.exists(key)) {
      this.baseTrackVolume = config?.volume ?? 0.35;
      this.currentTrack = this.scene.sound.add(key, {
        loop: true,
        ...config,
        volume: 0, // start silent for fade-in
      });
      this.currentTrack.play();
      this.currentTrackKey = key;

      // Fade in over 2 seconds to settings-adjusted volume
      this.scene.tweens.add({
        targets: this.currentTrack,
        volume: this.baseTrackVolume * SettingsManager.effectiveMusicVolume,
        duration: 2000,
        ease: 'Sine.easeIn',
      });
    }
  }

  stopTrack(fadeDuration = 1000): void {
    if (!this.currentTrack) return;
    const track = this.currentTrack;
    this.scene.tweens.add({
      targets: track,
      volume: 0,
      duration: fadeDuration,
      onComplete: () => {
        track.stop();
        track.destroy();
      },
    });
    this.currentTrack = null;
    this.currentTrackKey = null;
  }

  playSFX(key: string, volume = 0.3): void {
    if (this.scene.cache.audio.exists(key)) {
      this.scene.sound.play(key, { volume: volume * SettingsManager.effectiveSfxVolume });
    }
  }

  /** Play SFX with echo (delayed quiet repeat) — used in Echo Forest region */
  playSFXWithEcho(key: string, volume = 0.3): void {
    this.playSFX(key, volume);
    this.scene.time.delayedCall(220, () => {
      this.playSFX(key, volume * 0.35);
    });
    this.scene.time.delayedCall(450, () => {
      this.playSFX(key, volume * 0.15);
    });
  }

  private applyVolume(): void {
    if (this.currentTrack && 'volume' in this.currentTrack) {
      (this.currentTrack as Phaser.Sound.WebAudioSound).setVolume(
        this.baseTrackVolume * SettingsManager.effectiveMusicVolume,
      );
    }
  }
}
