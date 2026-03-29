import Phaser from 'phaser';

export interface QuestObjective {
  type: 'fragments' | 'beacons' | 'kills';
  current: number;
  target: number;
}

export class QuestSystem {
  private scene: Phaser.Scene;

  private fragmentCount = 0;
  private fragmentTarget: number;
  private beaconCount = 0;
  private beaconTarget: number;
  private killCount = 0;
  private _isComplete = false;

  constructor(scene: Phaser.Scene, fragmentTarget: number, beaconTarget: number) {
    this.scene = scene;
    this.fragmentTarget = fragmentTarget;
    this.beaconTarget = beaconTarget;
  }

  get isComplete(): boolean {
    return this._isComplete;
  }

  get fragments(): QuestObjective {
    return { type: 'fragments', current: this.fragmentCount, target: this.fragmentTarget };
  }

  get beacons(): QuestObjective {
    return { type: 'beacons', current: this.beaconCount, target: this.beaconTarget };
  }

  get kills(): QuestObjective {
    return { type: 'kills', current: this.killCount, target: 0 };
  }

  collectFragment(): void {
    if (this.fragmentCount >= this.fragmentTarget) return;
    this.fragmentCount++;
    this.emitProgress();
    this.checkCompletion();
  }

  activateBeacon(): void {
    if (this.beaconCount >= this.beaconTarget) return;
    this.beaconCount++;
    this.emitProgress();
    this.checkCompletion();
  }

  registerKill(): void {
    this.killCount++;
    this.scene.events.emit('enemy-killed', this.killCount);
    this.emitProgress();
  }

  restoreState(fragments: number, beacons: number, kills: number): void {
    this.fragmentCount = Math.min(fragments, this.fragmentTarget);
    this.beaconCount = Math.min(beacons, this.beaconTarget);
    this.killCount = kills;
    this.checkCompletion();
    this.emitProgress();
  }

  private emitProgress(): void {
    this.scene.events.emit('quest-progress', {
      fragments: this.fragments,
      beacons: this.beacons,
      kills: this.kills,
      isComplete: this._isComplete,
    });
  }

  private checkCompletion(): void {
    if (this._isComplete) return;
    if (
      this.fragmentCount >= this.fragmentTarget &&
      this.beaconCount >= this.beaconTarget
    ) {
      this._isComplete = true;
      this.scene.events.emit('quest-complete');
    }
  }
}
