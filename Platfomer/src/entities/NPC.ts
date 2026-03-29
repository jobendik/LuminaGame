import { GameScene } from '../scenes/GameScene';
import { COLORS } from '../config';

export function buildNPCs(s: GameScene) {
  s.npcs = [];
  const data = [
    {
      x: 860, y: 582, name: 'Eira, Stardust Librarian', portrait: 'portraitEira', role: 'eira',
      colors: COLORS.npcEira,
      getLines: () => [
        'When a world is written with warmth, it remembers its creator.',
        'This time you must not only find the pages. You must also light the ancient beacons.',
        s.questFinished ? 'Everything is ready. Find Veyra at the silent portal.' : 'Gather the pages, light the beacons, and listen for hidden memories along the way.'
      ]
    },
    {
      x: 2140, y: 582, name: 'Milo, Cartographer', portrait: 'portraitMilo', role: 'milo',
      colors: COLORS.npcMilo,
      getLines: () => [
        'Some paths are built for feet. Others for timing and courage.',
        'Beware the shadow beings. They hate light and love to chase you off rhythm.',
        s.beaconCount >= s.beaconTarget ? 'The beacons are burning. The whole world feels more awake now.' : 'If a beacon flickers, stand by it and awaken it with E.'
      ]
    },
    {
      x: 3450, y: 582, name: 'Veyra, Guardian of the Silent Portal', portrait: 'portraitVeyra', role: 'veyra',
      colors: COLORS.npcVeyra,
      getLines: () => !s.questFinished ? [
        'The portal responds only when both memories and light are awakened.',
        'Three pages. Two beacons. Then it answers.'
      ] : !s.finalBlessingDone ? [
        'You have made the world whole enough for it to dare open.',
        'When I awaken the portal, what sleeps behind it awakens too.',
        'Run when the storm rises. Do not look back.'
      ] : [
        'The Archive of Light is not finished. It is finally alive.',
        s.secretCount >= s.secretTarget ? 'You found all the hidden memories too. The world will remember that.' : 'There are still hidden memories here, if you ever return.'
      ]
    }
  ];

  data.forEach((d, i) => {
    const c = s.add.container(d.x, d.y).setDepth(25);
    const g = s.add.graphics();
    // Body
    g.fillStyle(d.colors.skin as number, 1); g.fillCircle(0, -38, 14);
    g.fillStyle(d.colors.robe as number, 1); g.fillRoundedRect(-15, -24, 30, 40, 10);
    g.fillStyle(d.colors.robe as number, 0.6); g.fillRoundedRect(-12, -20, 24, 34, 8);
    g.fillStyle(d.colors.hair as number, 1); g.fillEllipse(0, -45, 30, 18);
    g.fillStyle(0x1d1d29, 1); g.fillCircle(-5, -38, 2); g.fillCircle(5, -38, 2);
    g.fillStyle(0xffffff, 0.4); g.fillCircle(-5.5, -38.5, 0.7); g.fillCircle(4.5, -38.5, 0.7);
    c.add(g);
    // Name tag
    const tag = s.add.text(0, -72, d.name.split(',')[0], {
      fontFamily: 'Cinzel, serif', fontSize: '14px', color: '#ffe8c0'
    }).setOrigin(0.5).setAlpha(0.7);
    c.add(tag);
    // Aura
    const aura = s.add.circle(d.x, d.y - 20, 50, d.colors.glow as number, 0.08)
      .setBlendMode(Phaser.BlendModes.SCREEN).setDepth(24);
    s.tweens.add({
      targets: aura, alpha: { from: 0.04, to: 0.14 }, scale: { from: 0.9, to: 1.15 },
      duration: 2000 + i * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
    s.npcs.push({ container: c, aura, data: d, baseY: d.y, bobPhase: i * 0.9 });
  });
}

export function updateNpcAnimation(s: GameScene, time: number) {
  s.npcs.forEach((npc, i) => {
    const bob = Math.sin(time * 0.0022 + npc.bobPhase) * 3.5;
    npc.container.y = npc.baseY + bob;
    npc.aura.y = npc.baseY - 20 + bob;
    npc.aura.alpha = 0.06 + Math.sin(time * 0.003 + i) * 0.035;
  });
  s.beacons.forEach((b, i) => {
    const bob = Math.sin(time * 0.002 + i) * 3;
    b.sprite.y = b.baseY + bob; b.pulse.y = b.baseY - 18 + bob;
    b.glow.y = b.baseY + bob;
    b.glow.alpha = b.active ? 0.35 + Math.sin(time * 0.004 + i) * 0.08 : 0.12 + Math.sin(time * 0.004 + i) * 0.03;
  });
}
