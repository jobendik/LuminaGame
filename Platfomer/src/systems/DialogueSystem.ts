import { GameScene } from '../scenes/GameScene';
import { unlockPortal } from '../entities/Portal';
import { playChime } from './AudioSystem';

export function buildDialogueUI(s: GameScene) {
  s.dialogue = s.add.container(s.scale.width / 2, s.scale.height - 200).setScrollFactor(0).setDepth(210);
  const box = s.add.rectangle(0, 0, 820, 200, 0x0a1230, 0.92).setStrokeStyle(1.5, 0xffffff, 0.08);
  const light = s.add.ellipse(-90, -60, 320, 100, 0xcde7ff, 0.06).setBlendMode(Phaser.BlendModes.SCREEN);
  const pf = s.add.circle(-332, -6, 44, 0x1a2840, 0.95).setStrokeStyle(2, 0xffffff, 0.1);
  const portrait = s.add.image(-332, -6, 'portraitEira').setScale(0.95);
  const speaker = s.add.text(-260, -62, '', { fontFamily: 'Cinzel, serif', fontSize: '18px', fontStyle: 'bold', color: '#ffefc5' });
  const line = s.add.text(-260, -22, '', {
    fontFamily: 'Nunito, sans-serif', fontSize: '20px', color: '#f0ecff',
    wordWrap: { width: 560 }, lineSpacing: 6
  });
  const cont = s.add.text(260, 60, '▸ Press E', { fontFamily: 'Nunito, sans-serif', fontSize: '15px', color: '#80c0e0' });
  s.dialogue.add([box, light, pf, portrait, speaker, line, cont]);
  s.dialogue.setVisible(false);
  s.dialoguePortrait = portrait; s.dialogueSpeaker = speaker;
  s.dialogueLine = line; s.dialogueContinue = cont;

  // Prompt bubble
  s.promptBubble = s.add.container(0, 0).setDepth(60);
  const pb = s.add.rectangle(0, 0, 100, 32, 0x0a1230, 0.85).setStrokeStyle(1, 0xffffff, 0.08);
  // @ts-ignore
  if (pb.setRounded) pb.setRounded(8);
  const pt = s.add.text(0, 0, '▸ E', { fontFamily: 'Nunito', fontSize: '16px', color: '#b0d8f0' }).setOrigin(0.5);
  s.promptBubble.add([pb, pt]); s.promptBubble.setVisible(false);
}

export function openDialogue(s: GameScene, npc: any) {
  if (!npc?.data) return;
  s.activeNpc = npc; s.inDialog = true; s.currentDialogLine = 0;
  const lines = npc.data.getLines();
  s.dialoguePortrait.setTexture(npc.data.portrait);
  s.dialogueSpeaker.setText(npc.data.name);
  s.dialogueContinue.setText(lines.length > 1 ? '▸ Press E for next' : '▸ Press E to close');
  s.dialogue.setAlpha(0); s.dialogue.y = s.scale.height - 200;
  s.dialogue.setVisible(true);
  s.tweens.add({ targets: s.dialogue, alpha: 1, duration: 200 });

  startTyping(s, lines[0] || '');
}

export function advanceDialogue(s: GameScene) {
  if (s.dialogueIsTyping) {
    if (s.dialogueTypingEvent) s.dialogueTypingEvent.remove();
    s.dialogueLine.setText(s.dialogueFullText);
    s.dialogueIsTyping = false;
    return;
  }

  if (!s.activeNpc?.data) { closeDialogue(s); return; }
  const lines = s.activeNpc.data.getLines();
  s.currentDialogLine++;
  if (s.currentDialogLine >= lines.length) {
    const role = s.activeNpc.data.role;
    closeDialogue(s);
    if (role === 'veyra' && s.questFinished && !s.finalBlessingDone) unlockPortal(s);
    return;
  }
  
  s.dialogueContinue.setText(s.currentDialogLine < lines.length - 1 ? '▸ Press E for next' : '▸ Press E to close');
  
  // Use a quick fade-in for the text object itself just as an intro, then type
  s.dialogueLine.setAlpha(0);
  s.tweens.add({ targets: s.dialogueLine, alpha: 1, duration: 140 });
  startTyping(s, lines[s.currentDialogLine]);
}

export function closeDialogue(s: GameScene) {
  if (s.dialogueTypingEvent) s.dialogueTypingEvent.remove();
  s.dialogueIsTyping = false;
  s.inDialog = false; s.activeNpc = null; s.currentDialogLine = 0;
  s.tweens.add({ targets: s.dialogue, alpha: 0, duration: 180, onComplete: () => s.dialogue.setVisible(false) });
}

function startTyping(s: GameScene, text: string) {
  if (s.dialogueTypingEvent) s.dialogueTypingEvent.remove();
  s.dialogueFullText = text;
  s.dialogueCharIndex = 0;
  s.dialogueIsTyping = true;
  s.dialogueLine.setText('');

  s.dialogueTypingEvent = s.time.addEvent({
    delay: 25,
    repeat: text.length - 1,
    callback: () => {
      s.dialogueCharIndex++;
      s.dialogueLine.setText(s.dialogueFullText.substring(0, s.dialogueCharIndex));
      if (s.dialogueCharIndex >= s.dialogueFullText.length) {
        s.dialogueIsTyping = false;
      } else if (s.dialogueCharIndex % 4 === 0) {
        // Soft blip for typing
        playChime(s, 600, 700, 0.003);
      }
    }
  });
}
