# NEON GETAWAY: DESTRUCTION RUN 🏎️💥

> **A high-octane 2D/2.5D browser arcade getaway driving game inspired by the mechanics and spirit of Smash Bandits Racing.**
> Smash through roadside scenery for dirty cash bounties, maintain high-speed destruction combos, manage vehicle damage, survive relentless blue and black highway patrol pursuits, unlock 10 unique getaway cars across Normal, Sports, and Racing categories via the showroom and neon Gacha system, navigate waterways and bridges, and unleash three tactical abilities with 150-second cooldowns!

---

## 🎮 Playable Demo & Overview

- **Title:** NEON GETAWAY: DESTRUCTION RUN *(configurable in `src/config.js`)*
- **Genre:** Top-down / 2.5D Arcade Driving, Destruction, Gacha & Police Pursuit
- **Platform:** Modern Desktop, Laptop, Tablet, and Mobile Web Browsers (zero installs, zero API keys, no backend required)
- **Engine / Tech Stack:** HTML5, CSS3, JavaScript (ES6 Modules), HTML5 Canvas 2D, Web Audio API
- **Persistence:** LocalStorage (Cash balance, Garage ownership, Gacha records, Selected car, High score, Settings)
- **License:** MIT License (`LICENSE`)

---

## 🏎️ 10 Playable Cars Across 3 Categories

Every car features a distinct 2.5D visual model, custom chassis contour, aerodynamic spoilers, racing stripes, tailored handling, and calibrated durability.

| Car Name | Category | Rarity | Price | Top Speed | Boost | Accel | Handling | Durability | Drift Mult | Description |
|---|---|---|---|---|---|---|---|---|---|---|
| **Neon Compact** | Normal | Common | **FREE ($0)** | 380 | 480 | 420 | 3.8 | 100 HP | 1.0x | Agile starter hot hatch with responsive steering and balanced getaway speed. Unlocked by default. |
| **Street Sedan** | Normal | Common | **$1,200** | 400 | 500 | 440 | 3.6 | 125 HP | 1.05x | Reliable 4-door getaway sedan with reinforced bumpers, stable road grip, and smooth cruising weight. |
| **Urban Hatchback** | Normal | Common | **$1,800** | 415 | 515 | 480 | 4.1 | 110 HP | 1.15x | Snappy pocket rocket with quick throttle response and tight turning radius for narrow alley escapes. |
| **Heavy Cruiser** | Normal | Rare | **$3,500** | 420 | 520 | 470 | 3.1 | 220 HP | 0.85x | Armored heavy-duty road cruiser. Unmatched durability and 2.5x ramming power against road barricades and police. |
| **Vortex GT** | Sports | Rare | **$5,500** | 450 | 560 | 550 | 4.3 | 120 HP | 1.35x | High-revving twin-cam coupe equipped with rear diffuser and tuned suspension for high-angle drifting. |
| **Phantom Coupe** | Sports | Epic | **$8,500** | 475 | 590 | 580 | 4.5 | 130 HP | 1.40x | Sleek aerodynamic sports coupe with active carbon spoilers, razor-sharp handling, and rapid corner recovery. |
| **Inferno RS** | Sports | Epic | **$11,000** | 495 | 615 | 630 | 4.4 | 140 HP | 1.30x | Aggressive widebody track monster with twin turbochargers, blistering acceleration, and explosive nitro boost. |
| **Apex Racer** | Racing | Epic | **$14,000** | 520 | 645 | 660 | 4.7 | 135 HP | 1.25x | GT championship endurance racer with massive rear wing, ground-effect aero floor, and surgical turn precision. |
| **Velocity X** | Racing | Legendary | **$18,500** | 550 | 680 | 720 | 4.8 | 145 HP | 1.45x | Ultra-light carbon fiber hypercar featuring active ground suction, rocket-grade acceleration, and hypersonic speeds. |
| **Thunderbolt Pro** | Racing | Legendary | **$25,000** | 580 | 720 | 780 | 5.0 | 155 HP | 1.50x | The pinnacle of racing engineering. Unrivaled top speed, instantaneous nitro propulsion, and maximum circuit downforce. |

---

## 🎰 Neon Car Gacha System

The in-game currency earned by smashing scenery and outrunning police can be spent in the neon-themed Gacha system (`src/gacha.js`).

### Probability Tiers (Total: Exactly 100%)
- **Common (50%):** Neon Compact, Street Sedan, Urban Hatchback
- **Rare (30%):** Heavy Cruiser, Vortex GT
- **Epic (15%):** Phantom Coupe, Inferno RS, Apex Racer
- **Legendary (5%):** Velocity X, Thunderbolt Pro

### Features & Protections
- **Single Roll:** $500 coins.
- **10-Roll Bundle:** $4,500 coins (10% bulk discount).
- **Duplicate Compensation:** When a duplicate vehicle is drawn, player is immediately reimbursed:
  - Common duplicate: **+$250 coins** (50% refund)
  - Rare duplicate: **+$800 coins**
  - Epic duplicate: **+$2,000 coins**
  - Legendary duplicate: **+$5,000 coins**
- **Anti-Spam Click Protection:** Single-flight asynchronous lock prevents race conditions or negative currency balances from rapid button clicking.
- **Client-Side Transparency:** Operates entirely within the browser without requiring external servers or APIs.

---

## 🗺️ Three Improved Maps & Gameplay Bug Fixes

### 1. Fix: Houses in the Middle of Roads
- **Zero House Obstacles:** Every building, house, and warehouse across all 3 maps is guaranteed to be placed safely outside road lanes, shoulders, and intersections (`distToSegment >= r.halfW + Math.min(b.w, b.h) / 2 + 10`).
- Tested with automated road collision scans to ensure driving routes remain 100% clear.

### 2. Fix: Water Hazard & Bridge Collision
- **Water Barriers:** Cars cannot drive across rivers, creeks, or canals.
- **Water Penalty:** Entering water hazards causes severe deceleration (`7.0 * dt`), spawns animated water splashes, and plays authentic water splash audio synthesizer effects.
- **Auto-Recovery from Water:** Stalling in deep water resets the vehicle safely to the nearest dry road bank with 15 water collision damage and HUD notification `WATER HAZARD! VEHICLE RECOVERED`.
- **Drivable Bridges:** Bridges across waterways feature full structural collision bypass (`map.isOnBridge(x, y)`), enabling fast crossings.

### Map Roster:
1. **Green Suburbs (Map 0):**
   - Lush neighborhood with suburban avenues, front-yard fences, blossoming cherry trees, hydrants, streetlights, and trash cans.
2. **River District (Map 1):**
   - Waterfront canals, scenic waterways, stone and suspension bridges, shipping docks, cargo barrels, and deep river traps.
3. **Neon Industrial Zone (Map 2):**
   - High-voltage freight complex with warehouses, stacked shipping containers, neon road markings, oil drums, and heavy concrete barricades.

---

## 💥 Destructible Scenery & Economy Balancing (>= 57% Destructible)

Every map contains hundreds of eligible environmental props, with **at least 57% (measured at 82%–84%)** being fully destructible.

### Tiered Breaking Thresholds & Rewards
- **Light Tier (Speed >= 30 MPH):**
  - Props: Wooden crates, road signs, bushes, flowerpots, trash cans.
  - Reward: **+$8 cash**, +80 score.
  - Breaks easily on any slight contact.
- **Medium Tier (Speed >= 130 MPH):**
  - Props: Picket fences, streetlights, fire hydrants, oil barrels, market stalls, haybales.
  - Reward: **+$16 cash**, +180 score.
  - Requires moderate cruising speed; low-speed collisions bounce off and spark.
- **Heavy Tier (Speed >= 230 MPH or Tank / Cruiser):**
  - Props: Concrete road barriers, small shipping containers, wooden sheds, oil storage tanks.
  - Reward: **+$28 cash**, +320 score.
  - Requires high speed, nitro boost, Heavy Cruiser, or Titan Tank.
- **Indestructible Solid Props:**
  - Steel bollards, power transformers, stone monuments, and industrial pylons. Solid collision bounce, dealing impact damage.
- **Anti-Farming Protection:** Destroyed objects stay destroyed for the duration of the getaway run, preventing repeat farming.

---

## 🚨 Police Pursuit & 10-Minute Escalation (Zero Spike Strips)

- **Standard Blue Cruisers:** Active from the start with sirens and dynamic pursuit maneuvers.
- **Black Advanced Interceptors:** Deploy at **10 minutes (600 seconds)** of active gameplay with enhanced ramming force, higher top speed, and red/amber lightbars.
- **Zero Spike Strips:** Strictly no spike strips anywhere in the game.
- **Auto-Reverse Recovery:** Automatically reverses if pinned against a wall or obstacle for ~2 seconds.

---

## ⚡ Tactical Abilities (150-Second Cooldowns)

Each ability operates on an independent 150-second (2m 30s) timer:
1. **Titan Tank (`1` / `Q`):** Armored battle tank with crushing ramming power (10s duration).
2. **Oil Slick (`2` / `E`):** Deploys slick that sends chasing police into spinouts (14s duration).
3. **Electric Shock (`3` / `R`):** EMP shockwave stunning all police within 280px radius (4s stun).

---

## 🛠️ Testing & Verification

Run the automated Node.js test suite:

```bash
# Direct test execution
node test/game-test.js

# Or via npm
npm test
```

### Automated Verifications:
- ✅ **10 Cars:** 4 Normal, 3 Sports, 3 Racing with unique stats and rarities.
- ✅ **3 Maps:** Green Suburbs, River District, Neon Industrial Zone.
- ✅ **Zero Houses on Roads:** All buildings verified off road lanes and intersections.
- ✅ **Water & Bridges:** Water blocks driving while bridges permit crossing.
- ✅ **Destructible Ratio:** Every map achieves $\ge 57\%$ destructibility (actual: 82.8%–83.4%).
- ✅ **Gacha Monte Carlo Test:** 25,000 draws verify 50% Common, 30% Rare, 15% Epic, 5% Legendary rates.
- ✅ **Duplicate Compensation:** Verified for all tiers.
- ✅ **Police Escalation:** 10-minute deployment verified with zero spike strips.
- ✅ **150s Ability Cooldowns:** Verified independent execution and cooldown pause.

---

## 🚀 Deployment Instructions

The game requires **no backend server, database, or API keys** and can be deployed directly as static files:

### 1. GitHub Pages
1. Push repository to GitHub.
2. In Repository Settings → Pages, select `Branch: master`, folder `/ (root)`.
3. Save; the public URL will be live in seconds.

### 2. Vercel
1. Install Vercel CLI or import the GitHub repository in the Vercel Dashboard.
2. Deploy as a static project without build command.

### 3. Local Preview
```bash
# Using Python
python -m http.server 8000

# Using npx serve
npx serve -l 3000 .
```
Open `http://localhost:8000` or `http://localhost:3000` in any web browser.
