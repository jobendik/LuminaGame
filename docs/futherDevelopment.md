Lumina — Development Roadmap
Based on a full audit of the codebase against the blueprint. Organized in priority order — each phase builds on the previous and produces a demonstrable improvement.

Phase 1: Game Feel & Juice (make what exists feel great)
 ✅ Screen shake — subtle shake on landing (scales with fall distance), dash burst, ability activation
 ✅ Squash & stretch — player sprite compresses on land, stretches during jump/fall
 ✅ Dash VFX — particle trail behind player during dash, brief afterimage
 ✅ Camera zoom pulse — subtle zoom on ability activation or entering a new area
 ✅ Landing dust improvements — scale dust burst by fall speed; add small bounce to player on land
 ✅ Input buffering — buffer jump press slightly before landing (coyote time + jump buffer)
Phase 2: Color System (the GRIS soul)
 ✅ Implement desaturation shader — Phaser PostFX pipeline or ColorMatrix to start the world gray
 ✅ Color bloom on progression — saturation increases as player collects MemoryFragments
 Region palette transitions — fade between region color palettes on entering new zones
 ✅ "Wow moment" color burst — touching a key collectible triggers a full-screen color bloom outward (the hook moment from the blueprint)
Phase 3: Audio Foundation
 ✅ Find/create ambient tracks — one ambient loop per region (royalty-free or generated)
 ✅ Load audio in BootScene — integrate real audio assets into the preload pipeline
 ✅ Wire AudioSystem to events — region enter → crossfade music; landing → soft thud; dash → whoosh
 Footstep system — subtle step sounds when running, frequency tied to speed
 Layered music — base ambient + melody layer that fades in on progression
Phase 4: Wire Remaining Abilities
 ✅ Glide — bind to Space (hold while airborne); add GLIDE state to player state machine; slow fall + gentle horizontal drift; add trailing particle effect
 Heavy Form — bind to E (toggle); add HEAVY_FORM state; resist wind, break cracked platforms; darken player tint + ground-pound particle burst
 Spirit Vision — bind to Q or Tab; reveal hidden platforms/paths with a luminous glow overlay; add shimmer VFX
 Ability cooldowns/resource — optional stamina bar or cooldown timer for dash/glide
Phase 5: Level Design & World Structure
 Multi-region world — extend from single flat world to 3+ connected regions with distinct palettes and atmospheres
 Ability-gated paths — gaps needing dash, high ledges needing glide, wind zones needing heavy form, hidden paths needing spirit vision
 Revisit design — earlier areas gain new routes when abilities unlock
 Environmental hazards — wind zones that push the player, cracked floors, darkness areas
 Moving platforms — oscillating platforms, falling platforms, elevator platforms
 Tiled integration — export levels from Tiled editor for visual level design (Phaser has built-in support)
Phase 6: NPCs & Narrative
 Spawn NPCs in the world — use the existing NPC entity class; place character echoes in regions
 NPC interactions — silent presence (just standing beautifully), movement mimicry (follows nearby), environmental influence (changes weather/color when near)
 ✅ Memory Fragments — place collectible story pieces throughout the world; floating animation already works; add collection counter to UIScene
 Minimal dialogue system — short poetic lines that appear above NPCs or on screen (no dialogue tree — GRIS style)
 Trigger zones — use the existing Trigger entity to fire story events (color change, NPC appearance, music shift)
 Populate characters.ts — ready for her to fill in character names, themes, and backstories from her universe
Phase 7: UI Polish
 ✅ Dynamic ability HUD — show currently unlocked abilities with icons; highlight active ability
 ✅ Region name fade-in — display region name when entering a new area (fade in → hold → fade out)
 ✅ Collection counter — memory fragments collected / total
 Accessible controls display — keybindings overlay (toggle with F1 or ?)
 Pause menu — ESC to pause, resume, restart, or return to title
Phase 8: Her Art Integration
 Player sprite — replace placeholder rectangle with her character drawing (spritesheet: idle 4 frames, run 6 frames, jump 2 frames)
 NPC sprites — her character designs for each NPC echo
 Background art — her painted backgrounds for each parallax layer per region
 Platform tiles — stylized platform art matching each region's aesthetic
 UI elements — hand-drawn ability icons, memory fragment design
 Asset pipeline — update BootScene to load from assets/*/final/ when art is ready; keep placeholder fallback
Phase 9: Polish & Demo Package
 Intro sequence — brief animated intro (camera pan across the world before zooming to player)
 Save/load — localStorage save for progress (unlocked abilities, collected fragments, current region)
 Credits scene — "Art by [her name]" with her drawings scrolling past
 Performance — profile and optimize particle counts, texture sizes, parallax layer resolution
 Build for distribution — npm run build → deployable to itch.io or as a shareable link
 Mobile touch controls — optional virtual joystick + buttons for tablet play
Quick Wins (can be done anytime, high impact/low effort)
 Fix Player.ts / PlayerSystem.ts body config duplication (pick one location)
 ✅ Add coyote time (6-frame grace period for jumping after leaving a ledge)
 Remove unused entity imports until they're actually spawned
 ✅ Add debug toggle key (F12) to show physics bodies, state name, FPS counter
Priority for the "Wow Demo" (showing her)
The blueprint says the demo must include: parallax world, smooth character, particles, soft music, subtle color shifts, and one magical moment.

✅ Parallax world
✅ Smooth character (with squash/stretch, coyote time, jump buffer)
✅ Particles (ambient motes, landing dust, dash trail, collection bursts)
✅ Soft music (Beyond the Winding Ridge - fades in on game start)
✅ Subtle color shifts (world starts desaturated, gains color as fragments collected)
✅ One magical moment (collecting all 6 fragments triggers full-screen color bloom)

All 6 demo requirements are now met!
