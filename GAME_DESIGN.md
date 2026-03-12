# Haunted Arena — Game Design & Implementation Plan

Wave-survival FPS set in a toony horror graveyard. Built with React Three Fiber, Rapier physics, and Zustand.

---

## Current State

- 3 enemy types (grunt, chucker, titan) rendered as colored boxes
- Shotgun with recoil/reload/idle animations (GLTF model)
- 5 hand-tuned waves + formula scaling for 6+
- Procedural arena: fences, tombstones, trees, fog
- HTML5 Audio background music (2 tracks)
- Mobile touch controls
- Basic HUD: health bar, ammo, kills, wave indicator, crosshair

---

## Feature Plan

### 1. Buff/Pickup System

**Concept:** Enemies have a chance to drop a floating, rotating pickup on death. Pickups despawn after 30 seconds. Only one buff active at a time (new buff replaces current).

**Buff Types:**

| Buff | Visual | Effect | Duration |
|------|--------|--------|----------|
| Shield | Blue orb | Absorb next 50 damage | Until depleted |
| Damage Amp | Red orb | 2x bullet damage | 10 sec |
| Speed Boost | Green orb | 1.5x move speed | 8 sec |
| Rapid Fire | Orange orb | 2x fire rate | 8 sec |
| Health Pack | White/pink orb | Restore 40 HP | Instant |

**Drop Mechanics:**
- Base drop chance: 20% per kill
- Each kill without a drop increases chance by 5% (pity system, resets on drop)
- Buff type selected randomly with equal weight
- Max 3 pickups on the ground at once (oldest despawns if exceeded)

**Implementation:**

```
New files:
  src/game/fps/Pickup.jsx        — Pickup component (floating, rotating, glowing mesh)
  src/game/fps/PickupManager.jsx — Spawns pickups on enemy death, manages despawn timers

Store additions (useGameStore.js):
  pickups: []                    — Array of { id, type, position, spawnTime }
  activeBuff: null               — { type, remainingTime } or null
  spawnPickup(type, position)    — Add pickup to world
  collectPickup(id)              — Remove pickup, apply buff
  tickBuffs(delta)               — Decrement active buff timer each frame
```

**Pickup Visual:** Small glowing sphere with matching color, bobbing up/down (sin wave), slow rotation. Point light attached for glow. Particle trail optional (phase 2).

**Player Collection:** Distance check each frame — if player within 1.5 units of pickup, auto-collect.

---

### 2. Enemy Models

**Assets available:**
- `/models/enemies/Zombie_Basic.gltf` → grunt
- `/models/enemies/Zombie_Chucker.gltf` → chucker
- `/models/enemies/Zombie_Titan.gltf` → titan

**Implementation:**

```
Modified files:
  src/game/fps/Enemy.jsx — Replace box meshes with GLTF models via useGLTF

Steps:
  1. Load each model with useGLTF, clone scene per instance
  2. Scale models to match existing collider sizes
  3. Orient model to face movement direction (rotate toward player)
  4. Keep existing CapsuleCollider dimensions unchanged
  5. Add death animation: model scales to 0 over 0.3s before removal
  6. Add hit flash: swap material emissive to white for 0.1s on damage
```

**Model Config Update:**
```js
const ENEMY_CONFIG = {
  grunt: {
    ...existing,
    modelPath: '/models/enemies/Zombie_Basic.gltf',
    modelScale: [0.8, 0.8, 0.8],  // tune to match collider
    modelOffset: [0, 0, 0]
  },
  // ...same pattern for chucker, titan
};
```

---

### 3. Map Models (Future — Needs Assets)

**Plan:** Replace procedural tombstones, trees, and fences with GLTF models. The procedural generation logic stays (random positions, avoid center), but renders models instead of boxes/cones.

**Asset Needs:**
- 2-3 tombstone variants
- 2-3 dead tree variants
- Fence sections (straight + corner)
- Optional: ground debris, fog emitter meshes, lamp posts

**Implementation approach:**
```
Modified files:
  src/game/fps/Arena.jsx — Swap box/cone geometry for useGLTF models

Steps:
  1. Source toony horror GLTF assets (Kenney, Quaternius, Sketchfab CC0)
  2. Place in /public/models/environment/
  3. Load with useGLTF, use Instances for repeated props (performance)
  4. Keep RigidBody colliders as simple boxes (don't use mesh colliders)
  5. Add variation: random Y rotation, slight random scale (0.9-1.1x)
```

**Deferred until assets are sourced.**

---

### 4. Audio System (Web Audio API)

**Replace HTML5 Audio with Web Audio API for spatial sound and SFX.**

**Architecture:**
```
New files:
  src/audio/AudioEngine.js    — Singleton: AudioContext, listener, master gain
  src/audio/SoundBank.js      — Preloads & caches AudioBuffers from URLs
  src/audio/useGameAudio.js   — Hook: plays sounds in response to game events

Modified files:
  src/ui/context/AudioContext.jsx — Rewire to use AudioEngine for music
  src/game/fps/Gun.jsx            — Trigger fire/reload sounds
  src/game/fps/Enemy.jsx          — Trigger hit/death/attack sounds
  src/game/fps/Player.jsx         — Trigger footstep sounds
  src/game/fps/Pickup.jsx         — Trigger collect sound
```

**Sound List:**

| Sound | Trigger | Spatial? |
|-------|---------|----------|
| Shotgun fire | Player shoots | No (always centered) |
| Shotgun reload | Reload starts | No |
| Shotgun empty click | Shoot with 0 ammo | No |
| Bullet impact | Bullet hits enemy | Yes (enemy pos) |
| Enemy death | Enemy killed | Yes (enemy pos) |
| Enemy grunt/growl | Enemy attacks | Yes (enemy pos) |
| Chucker throw | Projectile spawned | Yes (enemy pos) |
| Titan slam | Titan wind-up completes | Yes (enemy pos) |
| Player hurt | Player takes damage | No |
| Pickup collect | Buff collected | No |
| Buff expire | Active buff ends | No |
| Footsteps | Player moving | No |
| Wave horn | Wave intro starts | No |
| Ambient loop | Always during gameplay | No |

**Spatial Audio:**
- Set AudioContext listener to camera position/orientation each frame
- Enemy sounds use PannerNode with position matching enemy world position
- Distance model: inverse, refDistance: 5, maxDistance: 40

**Music:**
- Background tracks continue through Web Audio API (MediaElementSource or decoded buffers)
- Crossfade between tracks
- Duck music volume during wave intro horn

**Asset Needs:** Source or generate SFX (freesound.org, sfxr/jsfxr for retro sounds). Place in `/public/sfx/`.

---

### 5. UI Improvements

```
Modified files:
  src/ui/fps/FpsHud.jsx — All HUD changes below
```

**Buff Indicator:**
- Bottom-center, above health/ammo bars
- Icon + remaining time bar for active buff
- Color matches buff type
- Pulse animation when about to expire (<2 sec)

**Ammo Visualization:**
- Replace "8 / 12" text with 12 individual bullet icons
- Spent bullets dim/fade, remaining bullets bright
- Low ammo (<3): remaining bullets pulse red

**Damage Direction Indicator:**
- When player takes damage, show red arc on screen edge indicating direction
- Fade out over 0.5s
- Multiple simultaneous indicators for multiple sources

**Kill Feed:**
- Top-left, shows last 3 kills with enemy type
- "+10 GRUNT" / "+25 CHUCKER" etc.
- Fades out after 2 seconds
- Slides in from left with animation

**Wave Banner:**
- "WAVE X IMMINENT" gets animated entrance (scale up from 0)
- Enemy count preview: "5 Grunts, 2 Chuckers incoming"
- Progress bar during wave showing enemies remaining

**Improved Game Over:**
- Stats expand: accuracy (shotsFired vs kills), time survived, highest wave
- Add high score tracking (localStorage)

---

### 6. Juice / Game Feel

**Screen Shake:**
```
New file:
  src/game/fps/useScreenShake.js — Hook that offsets camera position/rotation

Triggers:
  - Player fires: small shake (intensity 0.02, duration 0.1s)
  - Player takes damage: medium shake (intensity 0.05, duration 0.2s)
  - Titan slam: large shake (intensity 0.08, duration 0.3s)
  - Enemy death nearby: tiny shake (intensity 0.01, duration 0.05s)

Implementation:
  - Additive camera offset (position + rotation)
  - Perlin noise or random dampened sine for natural feel
  - Decay over duration with ease-out
  - Applied in Player.jsx useFrame after camera sync
```

**Damage Vignette:**
```
Modified file:
  src/ui/fps/FpsHud.jsx — Add overlay div

Effect:
  - Full-screen red radial gradient overlay
  - Opacity spikes on damage (0.4), fades to 0 over 0.5s
  - Intensity scales with damage amount
  - Persistent low-opacity pulse when health < 25
```

**Muzzle Flash:**
```
Modified file:
  src/game/fps/GunModel.jsx — Add point light + sprite at barrel

Effect:
  - PointLight (orange, intensity 5) at barrel tip
  - Enabled for 1 frame on shot, then off
  - Sprite with additive blending for flash texture (or simple sphere)
```

**Enemy Hit Feedback:**
```
Modified file:
  src/game/fps/Enemy.jsx

Effects:
  - White emissive flash for 0.1s on hit (material.emissive)
  - Knockback impulse away from bullet direction
  - Scale squash on hit (compress Y, expand X/Z) for 0.15s
```

**Enemy Death Effect:**
```
Options (pick one or combine):
  A. Shrink + fade: scale to 0 over 0.3s with opacity fade
  B. Ragdoll: disable AI, add random impulse, remove after 2s
  C. Particle burst: spawn 10-20 small cubes that scatter and fade

Recommendation: Option A for simplicity, add C as enhancement.
```

**Bullet Trails:**
```
Modified file:
  src/game/fps/Bullets.jsx

Effect:
  - Short line/trail behind each bullet (2-3 past positions)
  - Orange/yellow color matching bullet, fading opacity
  - Can use BufferGeometry lines or thin stretched meshes
```

**Chucker Projectile Visual:**
```
Modified file:
  src/game/fps/Enemy.jsx — ChuckerProjectiles component

Effect:
  - Currently empty placeholder — render actual meshes
  - Green/purple glowing sphere per projectile
  - PointLight attached for eerie glow
  - Particle trail behind projectile
```

---

## Implementation Order

| # | Feature | Files | Effort |
|---|---------|-------|--------|
| 1 | Enemy models | Enemy.jsx | S |
| 2 | Damage vignette + low health pulse | FpsHud.jsx | S |
| 3 | Screen shake | useScreenShake.js, Player.jsx | S |
| 4 | Muzzle flash | GunModel.jsx | S |
| 5 | Enemy hit flash + death animation | Enemy.jsx | S |
| 6 | Chucker projectile visuals | Enemy.jsx | S |
| 7 | Buff/pickup system | Pickup.jsx, PickupManager.jsx, useGameStore.js | M |
| 8 | Buff HUD indicator | FpsHud.jsx | S |
| 9 | Audio engine + SFX | AudioEngine.js, SoundBank.js, useGameAudio.js | M |
| 10 | Spatial enemy audio | Enemy.jsx, useGameAudio.js | S |
| 11 | UI improvements (kill feed, ammo vis, damage direction) | FpsHud.jsx | M |
| 12 | Bullet trails | Bullets.jsx | S |
| 13 | Map models | Arena.jsx | M (blocked on assets) |

**S = small (< 1 session), M = medium (1-2 sessions)**

Start with items 1-6 (immediate visual impact, all small), then 7-8 (buff system), then 9-10 (audio), then 11-12 (polish).

---

## Technical Notes

- **Performance:** Enemy models need `useGLTF.preload()` calls. Use `clone()` on scene for each instance to avoid shared material state. Consider InstancedMesh if enemy counts get high (20+).
- **Audio resume:** Web Audio API requires user gesture to start. Resume AudioContext on first click/touch (already have pointer lock click as trigger).
- **Buff stacking:** Deliberately no stacking — simpler to reason about, avoids OP combos. New buff replaces old.
- **Screen shake:** Must not affect physics body position, only camera offset. Reset offset each frame before applying shake.
