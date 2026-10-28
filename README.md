# SMASH BANDITS RUNNER 🏎️💥

> **A high-octane 2D/2.5D browser arcade getaway driving game inspired by the mechanics and spirit of Smash Bandits Racing.**
> Smash through roadside scenery for dirty cash bounties, maintain high-speed destruction combos, manage vehicle damage, survive relentless blue and black highway patrol pursuits, unlock 17 unique getaway cars across Common, Rare, Epic, and Legendary categories via the showroom and cinematic Gacha warp system, conquer 4 distinct seasonal maps (including the Tri-Season Megalopolis), climb the Underground Syndicate Driver Leaderboards, and unleash three tactical abilities with 150-second cooldowns!

---

## 🎮 Playable Demo & Overview

- **Title:** SMASH BANDITS RUNNER *(configurable in `src/config.js`)*
- **Short Title:** SMASH BANDITS
- **Genre:** Top-down / 2.5D Arcade Driving, Destruction, Gacha, Police Pursuit & Ranking
- **Platform:** Modern Desktop, Laptop, Tablet, and Mobile Web Browsers (touch virtual joystick & multi-touch controls, zero installs, zero API keys, no backend required)
- **Engine / Tech Stack:** HTML5, CSS3, JavaScript (ES6 Modules), HTML5 Canvas 2D, Web Audio API
- **Persistence:** LocalStorage (Cash balance, Garage ownership, Gacha records, Selected car, Total RP, Leaderboards, Claimed rewards, High score, Settings)
- **License:** MIT License (`LICENSE`)

---

## 🗺️ 4 Distinct Maps & Tri-Season Metropolis

1. **Green Suburbs (Spring):**
   - Central octagonal roundabout hub with 4 expansive boulevards.
   - Flowing residential loops, cul-de-sacs, cherry blossom trees, and wooden creek bridges.
2. **River District (Summer):**
   - Dual-waterfront canal network with North Shore Parkway and South Dockway.
   - Sweeping coastal sweepers, maritime docks, sun glints, and stone suspension bridges.
3. **Neon Industrial Zone (Night):**
   - Super-wide 8-lane Freightway, tight 90-degree warehouse chicanes, security perimeters, and steel girder bridges.
4. **Tri-Season Metropolis (Combined 4th Map):**
   - Seamlessly blends Spring Suburbs (NW), Summer Waterfront (NE), and Neon Industrial (South).
   - Dynamic road surface traction (`0.95` NW asphalt, `0.98` dry shoreline concrete, `0.92` industrial oil slick tarmac).
   - 5 distinct bridges crossing the grand metropolitan canal.
   - Dynamic blended weather system generating petals in the northwest, sun glints in the northeast, and neon sparks in the south.

---

## 🎰 Cinematic Gacha Warp Summon Animation

- 60 FPS hyperspace warp tunnel with streaking stellar dust and expanding central rift.
- Dynamic color aura telegraphing the highest rarity pulled (Silver Common, Cyan Rare, Violet Epic, Radiant Gold Legendary).
- Climax vehicle projectile silhouette burst with camera shake, blinding flash, and procedural synthesizer sound.
- Quick "⏩ SKIP" button to jump directly to cards.
- Quick "ROLL 1x AGAIN" and "ROLL 10x AGAIN" summon buttons.

---

## 🏆 Underground Syndicate Ranking System

- **7 Driver Tiers:**
  - `E` - Street Novice (0 - 999 RP)
  - `D` - Neon Runner (1,000 - 2,999 RP) — $1,500 Cash Reward
  - `C` - Highway Fugitive (3,000 - 6,999 RP) — $3,500 Cash Reward
  - `B` - Syndicate Wheelman (7,000 - 14,999 RP) — $7,500 Cash Reward
  - `A` - Apex Drifter (15,000 - 29,999 RP) — $15,000 Cash Reward
  - `S` - County Nemesis (30,000 - 49,999 RP) — $30,000 Cash Reward
  - `S+` - Most Wanted Legend (50,000+ RP) — $60,000 Cash Reward
- **Reputation Points (RP):** Earned from run score, police cars wrecked, scenery smashed, and successful escapes.
- **Dynamic Leaderboards:** 4 tabs (Most Wanted Score, Police Wreckers, Scenery Demolition, Rank Rewards) tracking your standing against 10 elite syndicate rivals.

---

## 🏎️ 17 Playable Cars (5 Common, 2 Rare, 5 Epic, 5 Legendary)

- **Common (5):** Neon Compact, Street Sedan, Urban Hatchback, Cargo Wagon, Night Runner
- **Rare (2):** Heavy Cruiser, Vortex Tuner
- **Epic (5):** Phantom Muscle, Inferno Supercar, Apex Racer, Specter GT, Cyclone Drift
- **Legendary (5):** Velocity Prototype, Thunderbolt Hypercar, Hyperion GT, Valkyrie Hypercar, Zenith Prototype

---

## 📱 Mobile Controls & Responsive Experience

- Virtual analog floating joystick with dynamic touch origin.
- Multi-touch action buttons: Boost (Nitro), Brake/Reverse, and Drift/Handbrake.
- Isolated styling in dedicated `mobile-v3.css`.

---

## 🚀 Deployment Instructions

The game requires **no backend server, database, or API keys** and can be deployed directly as static files:

### 1. Vercel
Push repository to GitHub main branch; Vercel auto-deploys static builds instantly.

### 2. Local Preview
```bash
npx serve -l 3000 .
```
Open `http://localhost:3000` in any web browser.
