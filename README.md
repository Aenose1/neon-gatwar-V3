# Smash Outlaws: Getaway Rush

> **A high-octane 2.5D arcade getaway driving game inspired by Smash Bandits Racing.**
> Smash through destructible fences, crates, barrels, and roadblocks, evade relentless highway patrol cruisers, unlock high-performance getaway vehicles, and unleash devastating special abilities!

---

## 🎮 Playable Demo & Overview

- **Genre:** Top-down / 2.5D Arcade Driving & Destruction
- **Platform:** Modern Desktop, Laptop, Tablet, and Mobile Web Browsers (zero installs, zero API keys, no backend required)
- **Engine / Stack:** HTML5, CSS3, JavaScript (ES6 Modules), HTML5 Canvas 2D, Web Audio API
- **Persistence:** LocalStorage (Cash balance, Garage ownership, High score, Settings)

---

## 🏎️ Core Gameplay & Features

### 1. Exactly 4 Purchasable Vehicles (Maximum of 4)
| Model | Type | Price | Top Speed | Accel | Handling | Durability | Description |
|---|---|---|---|---|---|---|---|
| **Rogue Bandit** | Starter Compact | **FREE ($0)** | 380 | 420 | 3.8 | 100 HP | Agile hot hatch with responsive steering and balanced getaway speed. |
| **Drift Phantom** | Street Racer | **$2,500** | 440 | 540 | 4.4 | 110 HP | Low-slung Japanese tuner with rear spoiler, high turbo revs, and razor drifting. |
| **V8 Crusher** | Muscle Car | **$6,000** | 410 | 490 | 3.2 | 190 HP | Supercharged American muscle. Reinforced chassis plows through obstacles and rams police with double impact force. |
| **Apex Hyperion** | Supercar | **$12,000** | 500 | 660 | 4.6 | 135 HP | Aerodynamic exotic wedge. Blistering top speed and surgical steering precision. |

### 2. Exactly Three Seasonal Maps
1. **Winter Wonderland (Map 0)**:
   - Snowy wilderness with frosted pine trees, icy cabins, salt barrels, and snow mounds.
   - Dynamic falling snow particles and cold ambient lighting.
   - Lower tire friction (`0.82`), extended drift glides, and white rooster-tail tire spray.
2. **Summer County (Map 1)**:
   - Sunny rural countryside with red barns, silos, farm fences, and hay bales.
   - Off-road dirt friction, dust puffs, and warm golden daylight vignette.
   - Maximum road grip (`1.0`) for fast lane-switching.
3. **Spring Valley (Map 2)**:
   - Blossoming cherry trees, scenic river waterways with wooden bridge crossings, flower pots, and garden stalls.
   - Falling cherry petal weather particles and fresh emerald spring lighting.
   - Curved winding roads designed specifically for chaining long drifts.

### 3. Exactly Three Special Abilities
1. **Titan Tank (`Key 1` / `Q` / Mobile Dock)**:
   - Temporarily transforms your car into a heavily armored tracked battle tank.
   - Duration: 10s | Cooldown: 30s.
   - Completely invulnerable; smashes through destructibles without speed loss and obliterates pursuing police cruisers on contact!
2. **Oil Slick (`Key 2` / `E` / Mobile Dock)**:
   - Deploys a dark, reflective iridescent oil puddle onto the asphalt directly behind your rear bumper.
   - Lifetime: 14s | Cooldown: 18s.
   - Pursuing police vehicles that hit the slick enter an uncontrollable 360-degree spinout and skid off-road. Does not affect the player.
3. **EMP Shockwave (`Key 3` / `R` / Mobile Dock)**:
   - Discharges a 280px radius high-voltage electrical pulse.
   - Cooldown: 22s.
   - Stuns and stalls all pursuing police vehicles in radius for 4.0 seconds with visible blue lightning arcs.

### 4. Police Pursuit System & Zero Spike Strips
- **Escalating Heat Levels (1 to 5 Stars)**: As you smash objects, maintain destruction combos, and survive longer, pursuit intensity escalates.
- **Pursuit Cruisers**: Agile black-and-white patrol cars with roof sirens.
- **Enforcer SUVs**: Heavy armored tactical interceptors that attempt to box you in and ram you off-road (spawns at Heat Level 3+).
- **NO SPIKE STRIPS**: Strictly compliant with specifications. Police rely solely on vehicular maneuvers, coordination, and pursuit pressure.

---

## 🕹️ Controls Architecture

### Desktop & Laptop Browsers (Mouse Only Steering - No Virtual Joystick)
- **Mouse Movement:** Smoothly steer the vehicle towards the cursor. Pointer angle relative to the car provides intuitive, analog steering with angular damping.
- **Right Mouse Button (Hold):** Throttle / Nitro acceleration boost. Context menu is disabled only over the active canvas.
- **Automatic Forward Drive:** The car continuously cruises forward at base speed once the run begins.
- **Keyboard Fallback (Optional):** `W` / `Up` (Throttle Boost), `S` / `Down` (Brake/Reverse), `A` / `D` or Arrows (Steer), `Space` (Handbrake Drift).
- **Abilities:** `1` or `Q` (Titan Tank), `2` or `E` (Oil Slick), `3` or `R` (EMP Shock).
- **Pause:** `Esc` or `P`.

### Mobile & Tablet Browsers (One Circular Touch Ring)
- **Circular Touch Control (Bottom-Right):** Translucent white circular outline located ~1.5 inches above the bottom-right edge. Touch and drag left/right to steer. Internal area is transparent so the road remains visible beneath.
- **Automatic Forward Drive:** No gas button required.
- **Touch Abilities (Bottom-Left):** Dedicated thumb dock for Titan Tank, Oil Slick, and EMP Shockwave.
- **Device Capability Detection:** Device input is detected dynamically via `'ontouchstart' in window || navigator.maxTouchPoints > 0`. Desktop displays zero touch buttons.

---

## 📐 Academic Computer Graphics Documentation

This project fulfills core principles of 2D/2.5D Computer Graphics:

| Graphics Principle | Implementation Function / File | Description |
|---|---|---|
| **2D Output Primitives** | `js/car.js` (`drawCar`), `js/map.js` (`drawRoads`, `drawBuildings`), `js/particles.js` | Uses Canvas 2D rasterization primitives (`fillRect`, `roundRect`, `arc`, `ellipse`, `lineTo`, `bezierCurveTo`). |
| **Matrix Transformations** | `js/camera.js` (`apply`, `restore`), `js/car.js` (`draw`), `js/ui.js` (`renderGarageTurntable`) | Implements canvas coordinate stack (`ctx.save()`, `ctx.translate()`, `ctx.rotate()`, `ctx.scale()`, `ctx.restore()`) for local-to-world and world-to-screen transforms. |
| **Real-Time Animation** | `js/game.js` (`loop`) | Driven by `window.requestAnimationFrame` with delta-time (`dt`) clamping to prevent physics tunneling or spiral-of-death. |
| **Smooth Rendering & Interpolation** | `js/camera.js` (`update`), `js/car.js` (`update`) | Exponential lerp smoothing for camera follow, wheel turn angle (`steerAngle`), and lateral drift slip. |
| **Color, Shading & Gradients** | `js/car.js` (`drawCar`), `js/abilities.js` (`draw`), `js/map.js` (`drawRiver`), `js/ui.js` | Uses linear gradients for metallic vehicle specular reflection, radial gradients for glowing headlights and EMP rings, and translucent drop shadows for pseudo-3D elevation. |
| **Follow Camera & Projection** | `js/camera.js` (`Camera`) | Implements an oriented follow camera with dynamic lookahead vector, screen-shake impulse decay, and screen-to-world / world-to-screen coordinate inversion. |
| **Spatial Partitioning Collision** | `js/map.js` (`buildSpatialGrid`, `getNearbyDestructibles`), `js/game.js` (`handleCollisions`) | Uses uniform grid spatial partitioning ($250 \times 250$ px cells) for $O(1)$ collision lookups against 1,000+ destructibles at 60 FPS. |
| **Particle Physics Simulation** | `js/particles.js` (`ParticleManager`) | Simulates 3D parabolic trajectory with gravity, ground bounce coefficients, angular velocity rotation, and alpha dissipation for wood splinters, sparks, smoke, and weather. |
| **Input Coordinate Mapping** | `js/input.js` (`update`, `updateTouchSteer`) | Maps screen pointer coordinates to relative directional vectors, normalized angular deltas, and deadzone filtering. |
| **Floating HUD Text** | `js/particles.js` (`drawFloatingTexts`) | Renders animated floating score/cash indicators with scale bounce and vertical drift. |

---

## 🚀 Local Run & Setup Instructions

### Option 1: Direct Browser Launch
Open `index.html` directly in any modern browser via a local server (required for ES6 module support).

### Option 2: Python Built-in Server
```bash
# Navigate to the project directory
cd smash-outlaws

# Run Python HTTP server
python -m http.server 8080

# Open in browser
http://localhost:8080
```

### Option 3: Node / npm
```bash
# Run automated test suite
npm test

# Run local development server
npm start
# or
npx serve -l 3000 .
```

---

## 🌐 Public Deployment Guide

Because the project is built on zero-dependency standard HTML5, CSS3, and ES6 JavaScript, it can be deployed to any static host in seconds:

### Deploy to GitHub Pages
1. Push this directory to a GitHub repository.
2. In GitHub, go to **Settings > Pages**.
3. Under **Build and deployment**, select **Source: Deploy from a branch**.
4. Choose the `main` branch and `/ (root)` folder, then click **Save**.
5. Your game will be live at `https://<username>.github.io/<repo-name>/`.

### Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`.
2. Run `vercel` in the project root.
3. Select defaults; deployment completes in ~10 seconds.

### Deploy to Netlify
1. Drag and drop the `smash-outlaws` directory into [Netlify Drop](https://app.netlify.com/drop).
2. Instant static site published!

---

## 🧪 Testing & Verification Checklist

- [x] Game starts cleanly and renders at display refresh rate.
- [x] Mouse movement smoothly guides vehicle steering on desktop.
- [x] Right mouse button triggers acceleration/throttle boost.
- [x] Zero touch buttons or steering circles appear on desktop.
- [x] Mobile browsers display exactly one circular touch steering ring (bottom-right).
- [x] Touch-and-drag steering works on mobile with automatic recentering.
- [x] Automatic forward driving functions without requiring a constant button hold.
- [x] Objects (fences, crates, barrels, signs, hay bales, stalls, flower pots, rocks) smash with debris and sound.
- [x] Cash rewards update immediately and persist in LocalStorage across page reloads.
- [x] Exactly 4 purchasable cars in garage; purchasing deducts the correct balance.
- [x] All 3 seasonal maps (Winter, Summer, Spring) load with distinct terrain, handling, and scenery.
- [x] Titan Tank, Oil Slick, and EMP Shockwave activate and disrupt police.
- [x] Police pursuit escalates from Heat 1 to Heat 5 with cruisers and enforcers.
- [x] Zero spike strips exist anywhere in the game.
- [x] Pause, restart, and menu transitions work seamlessly.
- [x] Fully responsive across desktop widescreen, tablet, and mobile portrait/landscape.
- [x] Test suite passes with exit code 0 (`npm test`).

---

*Smash Outlaws: Getaway Rush is an original game created for pair-programming and Computer Graphics education.*
