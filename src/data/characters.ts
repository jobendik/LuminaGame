import { NPCConfig } from '../entities/NPC';

export const NPC_CONFIGS: NPCConfig[] = [
  {
    x: 800,
    y: 688,
    name: 'Eira, Stardust Librarian',
    colors: { skin: 0xf5d6c0, robe: 0x3b5998, hair: 0xc9a468, glow: 0x88aaee },
    spriteKey: 'npc1-sprite',
    portraitKey: 'npc1-portrait',
    lines: [
      { speaker: 'Eira', text: 'When a world is written with warmth, it remembers its creator.' },
      { speaker: 'Eira', text: 'Gather the memory fragments scattered through these plains. They hold the light this world has lost.' },
      { speaker: 'Eira', text: 'Be cautious of the wraiths. They feed on forgotten memories.' },
      { speaker: 'Eira', text: 'Each fragment you collect will unlock abilities dormant within you. One fragment awakens the Dash.' },
      { speaker: 'Eira', text: 'The beacons once lit the way for travellers. Now they slumber, waiting for someone to reignite them.' },
      { speaker: 'Eira', text: 'I have read of a place called the Echo Forest, where sounds linger longer than they should.' },
      { speaker: 'Eira', text: 'If you listen carefully in the Sunken Ruins, you can hear water whispering old names.' },
    ],
  },
  {
    x: 4600,
    y: 688,
    name: 'Milo, Cartographer',
    colors: { skin: 0xe8c8a0, robe: 0x6b4e37, hair: 0x5c3a1e, glow: 0xddaa66 },
    spriteKey: 'npc3-sprite',
    portraitKey: 'npc3-portrait',
    lines: [
      { speaker: 'Milo', text: 'Some paths are built for feet. Others for timing and courage.' },
      { speaker: 'Milo', text: 'Beware the shadow beings. They hate light and love to chase you off rhythm.' },
      { speaker: 'Milo', text: 'If you find higher platforms, the view from up there is worth the climb.' },
      { speaker: 'Milo', text: 'I mapped five regions here: the Silent Plains, Echo Forest, Sunken Ruins, Sky Fracture, and Core Veil.' },
      { speaker: 'Milo', text: 'Wind zones in the Sky Fracture will carry you if you know how to ride them. Heavy Form resists the gusts.' },
      { speaker: 'Milo', text: 'Press M to open your minimap. It shows where fragments and enemies are.' },
      { speaker: 'Milo', text: 'Some platforms only appear when you see with spirit eyes. Press V if you have the gift.' },
    ],
  },
  {
    x: 10000,
    y: 688,
    name: 'Veyra, Guardian of the Silent Portal',
    colors: { skin: 0xd4c0e0, robe: 0x4a3060, hair: 0x9070b0, glow: 0xbb88dd },
    spriteKey: 'npc2-sprite',
    portraitKey: 'npc2-portrait',
    lines: [
      { speaker: 'Veyra', text: 'The portal responds only when both memories and light are awakened.' },
      { speaker: 'Veyra', text: 'Collect all the fragments. Then the way forward will open.' },
      { speaker: 'Veyra', text: 'Beyond the portal lies the Nightmaw — a being of pure shadow. You must be ready.' },
      { speaker: 'Veyra', text: 'The crawlers grow agitated when you draw near. Strike quickly, before they swarm.' },
      { speaker: 'Veyra', text: 'Wraiths have learned new tricks. Watch for their shadow orbs and evasive spirals.' },
    ],
  },
];
