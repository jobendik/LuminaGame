import { GameScene } from '../scenes/GameScene';
import { updateHUD } from '../ui/HUD';
import { ensureAudio } from './AudioSystem';
import { advanceDialogue, openDialogue } from './DialogueSystem';
import { activateBeacon } from './QuestSystem';
import { showPortalMoment, completeGame } from '../entities/Portal';
import { togglePause } from '../ui/PauseMenu';

export function bindKeys(s: GameScene) {
  s.cursors = s.input.keyboard!.createCursorKeys();
  s.keys = s.input.keyboard!.addKeys({
    left: Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D,
    up: Phaser.Input.Keyboard.KeyCodes.W,
    dash: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    interact: Phaser.Input.Keyboard.KeyCodes.E,
    enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
    pause: Phaser.Input.Keyboard.KeyCodes.P,
    restart: Phaser.Input.Keyboard.KeyCodes.R
  });

  const interact = () => handleInteract(s);
  s.input.keyboard!.on('keydown-E', interact);
  s.input.keyboard!.on('keydown-ENTER', interact);
  s.input.keyboard!.on('keydown-SPACE', () => { if (s.inDialog) handleInteract(s); });
  s.input.keyboard!.on('keydown-ESC', () => { if (s.storyStarted) togglePause(s); });
  s.input.keyboard!.on('keydown-P', () => { if (s.storyStarted) togglePause(s); });
  s.input.keyboard!.on('keydown-R', () => window.location.reload());
}

export function handleInteract(s: GameScene) {
  if (s.pausedGame) return;
  ensureAudio(s);

  if (!s.storyStarted) {
    s.storyStarted = true;
    s.tweens.add({ targets: s.introOverlay, alpha: 0, y: s.scale.height / 2 - 30, duration: 500, onComplete: () => s.introOverlay.setVisible(false) });
    updateHUD(s); return;
  }
  if (s.endingOverlay.visible) { s.endingOverlay.setVisible(false); return; }
  if (s.inDialog) { advanceDialogue(s); return; }
  if (s.nearBeacon && !s.nearBeacon.active) { activateBeacon(s, s.nearBeacon); return; }
  if (s.nearNpc) { openDialogue(s, s.nearNpc); return; }
  if (s.portalOpened && Phaser.Math.Distance.Between(s.player.x, s.player.y, 4800, 500) < 130) {
    s.stormActive ? completeGame(s) : showPortalMoment(s);
  }
}
