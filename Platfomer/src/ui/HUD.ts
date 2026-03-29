import { GameScene } from '../scenes/GameScene';

export function buildHUD(s: GameScene) {
  s.hudContainer = s.add.container(22, 18).setScrollFactor(0).setDepth(200);

  // Background panel
  const bg = s.add.graphics();
  bg.fillStyle(0x080e20, 0.65);
  bg.fillRoundedRect(0, 0, 300, 180, 12);
  bg.lineStyle(1, 0xffffff, 0.06);
  bg.strokeRoundedRect(0, 0, 300, 180, 12);
  s.hudContainer.add(bg);

  // Title
  s.hudTitle = s.add.text(16, 10, 'REFORGED', {
    fontFamily: 'Cinzel, serif', fontSize: '22px', color: '#fff6dc', fontStyle: 'bold'
  });
  s.hudTitle.setShadow(0, 0, '#6090c0', 8, true, true);
  s.hudContainer.add(s.hudTitle);

  // Hearts
  s.hudHearts = s.add.text(16, 42, '', { fontFamily: 'Nunito, sans-serif', fontSize: '22px', color: '#ff8a9e' });
  s.hudContainer.add(s.hudHearts);

  // Objective text
  s.hudObjective = s.add.text(16, 70, '', {
    fontFamily: 'Nunito, sans-serif', fontSize: '14px', color: '#c0d8f0', wordWrap: { width: 270 }, lineSpacing: 4
  });
  s.hudContainer.add(s.hudObjective);

  // Dash indicator
  s.hudDash = s.add.text(16, 150, '', {
    fontFamily: 'Nunito, sans-serif', fontSize: '13px', color: '#90e0b0'
  });
  s.hudContainer.add(s.hudDash);

  // Area name (top center)
  s.hudArea = s.add.text(s.scale.width / 2, 24, '', {
    fontFamily: 'Cinzel, serif', fontSize: '16px', color: '#c0d0e0'
  }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0.6);
}

export function updateHUD(s: GameScene) {
  checkQuestCompletion(s);

  const hearts = '♥'.repeat(Math.max(0, s.health)) + '♡'.repeat(Math.max(0, s.maxHealth - s.health));
  s.hudHearts.setText(hearts);

  let obj = '';
  if (!s.storyStarted) obj = 'Begin the story.';
  else if (s.endingSeen) obj = '✦ You made it through the storm.';
  else if (s.portalOpened && s.stormActive) obj = '⚡ Reach the portal before the darkness takes you!';
  else if (s.questFinished && !s.portalOpened) obj = 'Speak with Veyra at the portal.';
  else if (s.portalOpened) obj = 'The portal is open. Enter.';
  else {
    obj = `Pages: ${s.questCount}/${s.questTarget}  ·  Beacons: ${s.beaconCount}/${s.beaconTarget}`;
    obj += `\nHidden memories: ${s.secretCount}/${s.secretTarget}`;
  }
  s.hudObjective.setText(obj);

  s.hudDash.setText(s.dashReady ? '⟐ Dash ready' : '⟐ Dash charging...');
  s.hudDash.setColor(s.dashReady ? '#90e0b0' : '#e0a060');

  const areaNames = ['Stardust Path', 'Shadow Terrace', 'Stairs of Memory', 'Portal Chamber'];
  const areaName = areaNames[Math.max(0, s.currentAreaIndex)] || 'Stardust Path';
  s.hudArea.setText(areaName);
  s.hudArea.x = s.scale.width / 2;
}

export function checkQuestCompletion(s: GameScene) {
  s.questFinished = s.questCount >= s.questTarget && s.beaconCount >= s.beaconTarget;
}
