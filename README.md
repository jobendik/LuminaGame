# Lumina

> *A world waiting to be colored.*

**Lumina** is a 2D narrative exploration platformer inspired by *GRIS* and *Genshin Impact*, built with [Phaser 3](https://phaser.io/), TypeScript, and Vite. Explore a fractured world across five atmospheric regions, uncover memory fragments, light ancient beacons, and face the Nightmaw in a cinematic boss encounter.

---

## Features

### Exploration & World
- **5 distinct regions** — Silent Plains, Echo Forest, Sunken Ruins, Sky Fracture, and Core Veil — each with unique color palettes, environmental particles, and mechanic modifiers
- **Dynamic parallax backgrounds** with velocity modulation during dashes
- **Smooth region transitions** with accent color blooms and banners
- **Environmental hazards** — wind zones, water pools with altered gravity, crumbling platforms, and a closing storm wall
- **Hidden platforms** revealed through Spirit Vision
- **Memory Fragments** and **Beacons** to collect and light

### Combat
- **2-hit melee combo** with animated slash overlays, hit-stop, and floating damage numbers
- **Ranged blast** with projectile trails and impact VFX
- **Enemy types** — patrolling Crawlers with agitated chase AI and floating Wraiths with shadow orbs, lunge attacks, and spiral-dive patterns
- **Boss fight** — The Nightmaw with armor/health phases, telegraph warnings, AoE ground markers, and a cinematic death sequence

### Abilities
- **Dash** — with afterimage ghost sprites, cooldown flash, and particle trail
- **Glide** — with trailing particles and reduced fall speed
- **Wall Slide / Wall Jump** — dust trails and burst VFX
- **Heavy Form** — increased weight, wind resistance, ground crack effects
- **Spirit Vision** — reveals hidden paths with blue aura, screen vignette, and "SPIRIT MODE" overlay

### Visual Polish
- Squash/stretch on jump, landing dust with camera shake
- Screen flashes on damage, collection, and ability toggles
- Enemy spawn fade-ins and death time-freezes
- Checkpoint activation golden particle bursts
- NPC proximity glow pulses and breathing sway
- Beacon lighting ceremonies with fountain particles and world reactions
- Storm lightning bolts, wind particles, and proximity warning vignette
- Boss armor break slow-motion with zoom pulse

### UI & Menus
- **Main Menu** — ambient particles, pulsing title glow, typewriter subtitle reveal
- **Pause Menu** — settings with animated navigation, ambient dots, fade in/out
- **HUD** — health orbs, combo counter, dash cooldown arc, blast charge indicator, minimap
- **Dialogue System** — typewriter text reveal with per-character SFX, portrait scale-in, speaker colors
- **Ending Overlay** — staggered stat reveals, rank scale bounce, camera flash
- **Intro & Ability Tutorial** overlays with staged text reveals

### Audio
- Region-based ambient music with crossfade transitions
- Echo reverb SFX in the Echo Forest region
- Contextual SFX for all actions — attacks, dashes, jumps, landings, collections, dialogue, UI navigation, ability toggles

### Systems
- **Save System** — auto-saves to localStorage on checkpoints and fragment collection
- **Settings Manager** — master/music/SFX volume and screen shake toggle, persisted
- **Quest System** — fragment/beacon/kill tracking with progression gating
- **Color System** — world saturation increases as you restore light
- **Ability Unlock Progression** — abilities unlock as fragments are collected

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- npm

### Install & Run
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
npm run preview
```

### Type Check
```bash
npx tsc --noEmit
```

---

## Controls

| Key | Action |
|-----|--------|
| `A` / `D` or `←` / `→` | Move |
| `W` or `↑` | Jump |
| `SHIFT` | Dash (air OK) |
| `SPACE` (hold in air) | Glide |
| `J` | Melee attack (2-hit combo) |
| `K` | Ranged blast (needs charges) |
| `H` | Toggle Heavy Form |
| `V` | Toggle Spirit Vision |
| `E` | Interact / advance dialogue |
| `ESC` / `P` | Pause |
| `M` | Toggle minimap |

---

## Project Structure

```
src/
├── main.ts              # Entry point
├── config.ts            # Game constants & asset keys
├── scenes/              # Phaser scenes
│   ├── BootScene.ts     # Asset loading & placeholder generation
│   ├── MainMenuScene.ts # Title screen
│   ├── GameScene.ts     # Core gameplay
│   ├── UIScene.ts       # HUD overlay
│   └── DawnScene.ts     # Post-game cinematic
├── systems/             # Core game systems
│   ├── PlayerSystem.ts  # Input, state machine, physics
│   ├── CombatSystem.ts  # Health, damage, healing
│   ├── AbilitySystem.ts # Ability management
│   ├── BossSystem.ts    # Boss AI & state machine
│   ├── CameraSystem.ts  # Follow, shake, zoom
│   ├── ParallaxSystem.ts# Multi-layer scrolling
│   ├── ParticleSystem.ts# All particle effects
│   ├── ColorSystem.ts   # World saturation
│   ├── AudioSystem.ts   # Music & SFX
│   ├── DialogueSystem.ts# NPC dialogue UI
│   ├── StormSystem.ts   # Storm wall mechanics
│   ├── CheckpointSystem.ts
│   ├── QuestSystem.ts
│   ├── SaveSystem.ts
│   └── SettingsManager.ts
├── entities/            # Game objects
│   ├── Player.ts
│   ├── Enemy.ts         # Wraith enemy
│   ├── Crawler.ts       # Crawler enemy
│   ├── NPC.ts
│   ├── Beacon.ts
│   ├── Platform.ts
│   ├── MovingPlatform.ts
│   ├── HiddenPlatform.ts
│   ├── MemoryFragment.ts
│   ├── RestBench.ts
│   ├── BossDoor.ts
│   └── Trigger.ts
├── abilities/           # Modular abilities
│   ├── Ability.ts
│   ├── DashAbility.ts
│   ├── GlideAbility.ts
│   ├── HeavyFormAbility.ts
│   ├── JumpAbility.ts
│   └── SpiritVisionAbility.ts
├── ui/                  # UI overlays
│   ├── PauseMenu.ts
│   ├── IntroOverlay.ts
│   ├── EndingOverlay.ts
│   └── ToastSystem.ts
├── data/                # Data-driven configs
│   ├── regions.ts       # 5 regions with palettes & modifiers
│   └── characters.ts    # NPC definitions
├── types/
│   └── index.ts         # Shared enums & interfaces
└── utils/
    ├── StateMachine.ts
    ├── math.ts
    └── sfx.ts
```

### Assets
- `assets/*/placeholder/` — temporary placeholders (auto-generated by BootScene)
- `assets/*/final/` — final art assets
- `public/` — static files served by Vite

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| [Phaser](https://phaser.io/) | 3.90 | Game engine (Arcade Physics) |
| [TypeScript](https://www.typescriptlang.org/) | 5.4 | Type safety |
| [Vite](https://vitejs.dev/) | 5.4 | Build tool & dev server |

---

## License

This project is private and not licensed for redistribution.
