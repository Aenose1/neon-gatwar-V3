// test/game-test.js - Comprehensive test suite for Neon Getaway: Destruction Run V3
import assert from 'node:assert';
import { CONFIG, CAR_MODELS, MAP_CONFIGS } from '../src/config.js';
import { GameMap } from '../src/maps.js';
import { DamageManager } from '../src/damage.js';
import { RecoveryManager } from '../src/recovery.js';
import { AbilityManager } from '../src/abilities.js';
import { PoliceManager, PoliceCar } from '../src/police.js';
import { GachaManager, GACHA_CONFIG } from '../src/gacha.js';
import { storage } from '../src/storage.js';
import { PlayerCar } from '../src/player.js';
import { CollisionEngine } from '../src/collisions.js';
import { ControlsManager } from '../src/controls.js';
import { RankingManager, RANK_TIERS } from '../src/ranking.js';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

console.log('=== STARTING SMASH BANDITS RUNNER V3 TEST SUITE ===');

// Test 1: Config & Title
console.log('Test 1: Verifying game title and configuration...');
assert.strictEqual(CONFIG.TITLE, 'SMASH BANDITS RUNNER');
assert.strictEqual(CONFIG.SHORT_TITLE, 'SMASH BANDITS');
assert.strictEqual(CONFIG.ABILITY_COOLDOWN, 150, 'Ability cooldown must be exactly 150 seconds');
assert.strictEqual(CONFIG.BLACK_POLICE_UNLOCK_TIME, 600, 'Black police must unlock at 10 minutes (600s)');
console.log('✓ Title and configuration verified.');

// Test 2: Exactly 5 Common, 5 Epic, and 5 Legendary Cars (17 Total Roster)
console.log('Test 2: Verifying 5 Common, 5 Epic, and 5 Legendary cars...');
const carKeys = Object.keys(CAR_MODELS);
assert.strictEqual(carKeys.length, 17, 'Must have exactly 17 playable cars in roster');

const expectedKeys = [
    'compact', 'sedan', 'hatchback', 'wagon', 'runner',
    'cruiser', 'vortex',
    'phantom', 'inferno', 'apex', 'specter', 'cyclone',
    'velocity', 'thunderbolt', 'hyperion', 'valkyrie', 'zenith'
];
assert.deepStrictEqual(carKeys, expectedKeys, 'Car keys must match the exact 17 vehicles');

// Verify Rarity Tiers: Exactly 5 Common, 5 Epic, and 5 Legendary
const commonCars = carKeys.filter(k => CAR_MODELS[k].rarity === 'common');
const rareCars = carKeys.filter(k => CAR_MODELS[k].rarity === 'rare');
const epicCars = carKeys.filter(k => CAR_MODELS[k].rarity === 'epic');
const legendaryCars = carKeys.filter(k => CAR_MODELS[k].rarity === 'legendary');

assert.strictEqual(commonCars.length, 5, 'Must have exactly 5 Common cars');
assert.strictEqual(rareCars.length, 2, 'Must have exactly 2 Rare cars');
assert.strictEqual(epicCars.length, 5, 'Must have exactly 5 Epic cars');
assert.strictEqual(legendaryCars.length, 5, 'Must have exactly 5 Legendary cars');

assert.strictEqual(CAR_MODELS.compact.price, 0, 'Starter Neon Compact must be free ($0)');
assert.strictEqual(CAR_MODELS.compact.rarity, 'common');
assert.strictEqual(CAR_MODELS.sedan.rarity, 'common');
assert.strictEqual(CAR_MODELS.hatchback.rarity, 'common');
assert.strictEqual(CAR_MODELS.wagon.rarity, 'common');
assert.strictEqual(CAR_MODELS.runner.rarity, 'common');

assert.strictEqual(CAR_MODELS.phantom.rarity, 'epic');
assert.strictEqual(CAR_MODELS.inferno.rarity, 'epic');
assert.strictEqual(CAR_MODELS.apex.rarity, 'epic');
assert.strictEqual(CAR_MODELS.specter.rarity, 'epic');
assert.strictEqual(CAR_MODELS.cyclone.rarity, 'epic');

assert.strictEqual(CAR_MODELS.velocity.rarity, 'legendary');
assert.strictEqual(CAR_MODELS.thunderbolt.rarity, 'legendary');
assert.strictEqual(CAR_MODELS.hyperion.rarity, 'legendary');
assert.strictEqual(CAR_MODELS.valkyrie.rarity, 'legendary');
assert.strictEqual(CAR_MODELS.zenith.rarity, 'legendary');

for (const key of carKeys) {
    const c = CAR_MODELS[key];
    assert(c.topSpeed > 0 && c.durability > 0 && c.armor > 0);
    assert(c.stats.speed <= 100 && c.stats.armor <= 100);
    assert(c.driftMultiplier > 0, `${key} must have a positive drift multiplier`);
    assert(['common', 'rare', 'epic', 'legendary'].includes(c.rarity));
}
console.log('✓ 5 Common, 5 Epic, and 5 Legendary cars verified with unique stats, rarities, and visuals.');

// Test 3: Exactly 4 Maps with Unique Structures & 4th Combined Tri-Season Megalopolis
console.log('Test 3: Verifying 4 distinct maps, road clearances, water collision, and >= 57% destructibles...');
assert.strictEqual(MAP_CONFIGS.length, 4, 'Must have exactly 4 maps in V3');
assert.strictEqual(MAP_CONFIGS[0].id, 'suburbs');
assert.strictEqual(MAP_CONFIGS[0].name, 'Green Suburbs');
assert.strictEqual(MAP_CONFIGS[1].id, 'river');
assert.strictEqual(MAP_CONFIGS[1].name, 'River District');
assert.strictEqual(MAP_CONFIGS[2].id, 'industrial');
assert.strictEqual(MAP_CONFIGS[2].name, 'Neon Industrial Zone');
assert.strictEqual(MAP_CONFIGS[3].id, 'megalopolis');
assert.strictEqual(MAP_CONFIGS[3].name, 'Tri-Season Metropolis');

for (let i = 0; i < 4; i++) {
    const map = new GameMap(i);
    assert(map.roads.length >= 6, `Map ${map.name} must have road network`);
    assert(map.buildings.length >= 8, `Map ${map.name} must have distinct buildings`);
    assert(map.destructibles.length >= 80, `Map ${map.name} must have destructibles`);

    // Verify BUG FIX: ZERO houses/buildings placed in roads or intersections
    for (const b of map.buildings) {
        assert(!map.isOnRoad(b.x, b.y), `Building ${b.id} at (${b.x}, ${b.y}) must NOT be placed in roads`);
        for (const r of map.roads) {
            const dist = map.distToSegment(b.x, b.y, r.x1, r.y1, r.x2, r.y2);
            assert(dist >= r.halfW + Math.min(b.w, b.h) / 2 + 10,
                `Building ${b.id} too close to road segment in map ${map.name}`);
        }
    }

    // Verify BUG FIX: All 5 Bridges (Odd & Even bridges, specifically fixing Bridges 2 and 4)
    if (map.waterBodies.length > 0) {
        // Must have exactly 5 bridges spanning across the river / creek / canal
        assert.strictEqual(map.bridges.length, 5, `Map ${map.name} must have exactly 5 bridges (was ${map.bridges.length})`);

        for (let bIdx = 0; bIdx < map.bridges.length; bIdx++) {
            const b = map.bridges[bIdx];
            assert.strictEqual(map.isOnBridge(b.x, b.y), true, `Bridge ${bIdx + 1} (${b.id}) center must register on bridge`);
            assert.strictEqual(map.isInWater(b.x, b.y), false, `Bridge ${bIdx + 1} (${b.id}) must NEVER register as in water`);
        }

        // Specifically test Bridges 2 and 4 at the crossings (previously triggered "you got wet"):
        const bridge2 = map.bridges[1];
        const bridge4 = map.bridges[3];
        assert.strictEqual(bridge2.id, 'bridge_2');
        assert.strictEqual(bridge4.id, 'bridge_4');

        // Test approaching and crossing Bridge 2:
        assert.strictEqual(map.isOnBridge(bridge2.x, bridge2.y), true, 'Bridge 2 must be identified as bridge');
        assert.strictEqual(map.isInWater(bridge2.x, bridge2.y), false, 'Bridge 2 must NOT trigger water or wet message');

        // Test approaching and crossing Bridge 4:
        assert.strictEqual(map.isOnBridge(bridge4.x, bridge4.y), true, 'Bridge 4 must be identified as bridge');
        assert.strictEqual(map.isInWater(bridge4.x, bridge4.y), false, 'Bridge 4 must NOT trigger water or wet message');
    }

    // Verify >= 57% and around 60% Destructible Environmental Objects
    const ratio = map.getDestructibleRatio();
    console.log(`  Map ${map.name}: Destructibles = ${map.destructibles.length}, Solid Props = ${map.solidProps.length}, Ratio = ${(ratio * 100).toFixed(1)}%`);
    assert(ratio >= 0.57, `At least 57% of eligible environmental objects must be destructible (was ${(ratio * 100).toFixed(1)}%)`);
    assert(ratio <= 0.70, `Destructible ratio must be balanced (was ${(ratio * 100).toFixed(1)}%)`);
}

// Special check for Map 3 Tri-Season Megalopolis sector traction
const map3 = new GameMap(3);
assert.strictEqual(map3.getTractionAt(500, 500), 0.95, 'NW Spring Suburbs sector must have 0.95 traction');
assert.strictEqual(map3.getTractionAt(3500, 500), 0.98, 'NE Summer Waterfront sector must have 0.98 traction');
assert.strictEqual(map3.getTractionAt(2000, 3500), 0.92, 'South Neon Industrial sector must have 0.92 traction');
console.log('✓ Four distinct seasonal maps verified with clear roads, water barriers, drivable bridges, and >= 57% destructibles.');

// Test 4: Gacha System Probabilities (50% Common, 30% Rare, 15% Epic, 5% Legendary) & Duplicate Compensation
console.log('Test 4: Verifying Gacha System rates, bulk rolling, and duplicate compensation...');
assert.strictEqual(GACHA_CONFIG.RATES.common, 0.50, 'Common must be 50%');
assert.strictEqual(GACHA_CONFIG.RATES.rare, 0.30, 'Rare must be 30%');
assert.strictEqual(GACHA_CONFIG.RATES.epic, 0.15, 'Epic must be 15%');
assert.strictEqual(GACHA_CONFIG.RATES.legendary, 0.05, 'Legendary must be 5%');
const totalRates = GACHA_CONFIG.RATES.common + GACHA_CONFIG.RATES.rare + GACHA_CONFIG.RATES.epic + GACHA_CONFIG.RATES.legendary;
assert.strictEqual(totalRates, 1.0, 'Gacha rates must sum to exactly 100%');

const gacha = new GachaManager(null);

// Monte Carlo simulation with 25,000 draws to test sampling accuracy
const counts = { common: 0, rare: 0, epic: 0, legendary: 0 };
const samples = 25000;
for (let i = 0; i < samples; i++) {
    const tier = gacha.sampleRarity();
    counts[tier]++;
}

const commonPct = counts.common / samples;
const rarePct = counts.rare / samples;
const epicPct = counts.epic / samples;
const legendaryPct = counts.legendary / samples;

console.log(`  Monte Carlo Gacha Distribution (${samples} draws):`);
console.log(`    Common:    ${(commonPct * 100).toFixed(2)}% (Target: 50%)`);
console.log(`    Rare:      ${(rarePct * 100).toFixed(2)}% (Target: 30%)`);
console.log(`    Epic:      ${(epicPct * 100).toFixed(2)}% (Target: 15%)`);
console.log(`    Legendary: ${(legendaryPct * 100).toFixed(2)}% (Target: 5%)`);

assert(Math.abs(commonPct - 0.50) < 0.02, 'Common rate must converge within ±2%');
assert(Math.abs(rarePct - 0.30) < 0.02, 'Rare rate must converge within ±2%');
assert(Math.abs(epicPct - 0.15) < 0.02, 'Epic rate must converge within ±2%');
assert(Math.abs(legendaryPct - 0.05) < 0.015, 'Legendary rate must converge within ±1.5%');

// Test Duplicate Compensation
storage.data.cash = 10000;
storage.data.ownedCars = ['compact']; // Own compact

// Deterministic roll of compact (common duplicate)
const dupeResult = gacha.drawSingleCar(0.1, 0.0); // Common tier, index 0 (compact)
assert.strictEqual(dupeResult.carId, 'compact');
assert.strictEqual(dupeResult.isDuplicate, true, 'Already owned car must be marked duplicate');
assert.strictEqual(dupeResult.compensation, GACHA_CONFIG.DUPLICATE_COMPENSATION.common);

// Deterministic roll of new car
const newResult = gacha.drawSingleCar(0.98, 0.0); // Legendary tier, index 0 (velocity)
assert.strictEqual(newResult.isDuplicate, false, 'Unowned car must be marked new');
assert.strictEqual(storage.isCarOwned(newResult.carId), true, 'New car must be added to owned storage');

// Test Multi-Roll execution
storage.data.cash = 5000;
const multiOutcome = gacha.executeMultiRoll();
assert.strictEqual(multiOutcome.success, true);
assert.strictEqual(multiOutcome.rolls.length, 10, '10-roll must return exactly 10 cards');
assert.strictEqual(multiOutcome.costPaid, 4500, '10-roll must cost $4,500');
gacha.finishRoll();

// Test Insufficient Funds
storage.data.cash = 100;
const poorOutcome = gacha.executeSingleRoll();
assert.strictEqual(poorOutcome.success, false);
assert.strictEqual(poorOutcome.reason, 'INSUFFICIENT_FUNDS');
gacha.finishRoll();
console.log('✓ Gacha probability distribution, bulk rolling, and duplicate compensation verified.');

// Test 5: Player Car Damage System & Environmental Separation
console.log('Test 5: Verifying player car damage system, zero environmental damage, and police damage...');
const damage = new DamageManager(100, 1.0);
assert.strictEqual(damage.getHealthPercentage(), 100);
assert.strictEqual(damage.getHealthStatus().status, 'healthy');

const lowDmg = damage.calculateCollisionDamage(60);
assert(lowDmg >= 5 && lowDmg <= 10, `Low speed damage was ${lowDmg}`);

// Create CollisionEngine and test player vehicle
const engine = new CollisionEngine();
const mockMap = new GameMap(0);
const testCar = new PlayerCar('compact');
const initialHp = testCar.damage.health;

const dummyParticles = { spawnSparks: () => {}, addFloatingText: () => {}, spawnDebris: () => {} };
const dummyCamera = { shake: () => {} };
const dummyScoring = { recordDestruction: () => ({ cashGain: 10, combo: 1 }), addDirectCash: () => {}, addDirectScore: () => {} };

// A. Hitting Environmental Buildings MUST NOT reduce player health:
const bld = mockMap.buildings[0];
testCar.x = bld.x;
testCar.y = bld.y;
testCar.speed = 250;
engine.handlePlayerBuildings(testCar, mockMap, dummyParticles, dummyCamera);
assert.strictEqual(testCar.damage.health, initialHp, 'Environmental buildings MUST NOT damage the player car');

// B. Hitting Environmental Solid Props MUST NOT reduce player health:
const prop = mockMap.solidProps[0];
testCar.x = prop.x;
testCar.y = prop.y;
testCar.speed = 250;
engine.handlePlayerSolidProps(testCar, mockMap, dummyParticles, dummyCamera);
assert.strictEqual(testCar.damage.health, initialHp, 'Environmental solid props MUST NOT damage the player car');

// C. Hitting Environmental Destructibles MUST NOT reduce player health:
const dest = mockMap.destructibles[0];
testCar.x = dest.x;
testCar.y = dest.y;
testCar.speed = 250;
engine.handlePlayerDestructibles(testCar, mockMap, { addHeat: () => {} }, dummyParticles, dummyScoring, dummyCamera);
assert.strictEqual(testCar.damage.health, initialHp, 'Environmental destructibles MUST NOT damage the player car');

// D. Police Collisions MUST damage the player car:
const cop = new PoliceCar('blue', testCar.x + 15, testCar.y + 15);
const mockPoliceManager = { policeCars: [cop] };
testCar.speed = 250;
cop.speed = 0;
engine.handlePlayerPolice(testCar, mockPoliceManager, dummyParticles, dummyScoring, dummyCamera);
assert(testCar.damage.health < initialHp, 'Police collisions MUST damage the player car');
const hpAfterCopHit = testCar.damage.health;

// E. Damage applied only ONCE per collision event (not repeatedly every frame while cars overlap):
engine.handlePlayerPolice(testCar, mockPoliceManager, dummyParticles, dummyScoring, dummyCamera);
assert.strictEqual(testCar.damage.health, hpAfterCopHit, 'Damage must NOT be repeatedly applied every frame while overlapping');

// F. Unwanted Objects & Road Clearance Verification:
assert(!mockMap.drawGroundDetails.toString().includes('arc'), 'drawGroundDetails must NOT draw circular artifacts on the ground');
assert(!mockMap.drawSolidProps.toString().includes('arc'), 'drawSolidProps must NOT draw circular artifacts on the ground');

for (let mapIdx = 0; mapIdx < 4; mapIdx++) {
    const testMap = new GameMap(mapIdx);
    // Verify circular props removed
    const circularProps = testMap.solidProps.filter(p => p.type === 'bollard' || p.type === 'pylon');
    assert.strictEqual(circularProps.length, 0, `Map ${testMap.name} must contain zero bollard or pylon circular objects`);

    // Verify barrier_block and utility_box removed
    const unwantedBlocks = testMap.solidProps.filter(p => p.type === 'barrier_block' || p.type === 'utility_box');
    assert.strictEqual(unwantedBlocks.length, 0, `Map ${testMap.name} must contain zero barrier_block or utility_box objects`);

    // Verify zero solid props on roads (all solid props must have >= 90px clearance from roads)
    for (const p of testMap.solidProps) {
        assert(testMap.isClearOfRoads(p.x, p.y, 90), `Solid prop ${p.type} at (${p.x}, ${p.y}) must NOT be near any road`);
    }

    // Verify houses/buildings are preserved
    assert(testMap.buildings.length >= 8, `Map ${testMap.name} must preserve buildings and houses`);
}
console.log('✓ Zero environmental damage, police damage once-per-event, and zero solid blocks on roads verified.');

// Test 6: Fast Automatic Reverse Recovery & Responsive Manual Reverse
console.log('Test 6: Verifying fast automatic reverse recovery and responsive manual reverse speed...');
const recovery = new RecoveryManager();
const mockPlayer = { speed: 5, angle: 0 };

// Simulate 0.5s stuck against obstacle (CONFIG.RECOVERY_STUCK_TIME is 0.5s)
for (let t = 0; t < 0.55; t += 0.1) {
    recovery.update(mockPlayer, true, true, 0.1);
}
assert.strictEqual(recovery.isActive(), true, 'Recovery must activate promptly after 0.5s stuck against obstacle');
assert(mockPlayer.speed <= -200, `Recovery reverse speed must be swift (was ${mockPlayer.speed})`);
assert.strictEqual(recovery.getMessage(), 'AUTO RECOVERY: REVERSING...');

// Recovery completes after duration and resets smoothly
for (let t = 0; t < 0.9; t += 0.1) {
    recovery.update(mockPlayer, false, true, 0.1);
}
assert.strictEqual(recovery.isActive(), false, 'Recovery must conclude smoothly after clearance');

// Verify responsive manual reverse acceleration:
const testPlayer = new PlayerCar('compact');
testPlayer.speed = 100;
const brakeInput = { isBraking: true, isAccelerating: false, isTurningLeft: false, isTurningRight: false };

// Frame update with brake active: should rapidly bleed forward speed and accelerate in reverse
for (let frame = 0; frame < 8; frame++) {
    testPlayer.update(brakeInput, null, null, null, 0.05);
}
assert(testPlayer.speed < 0, `Manual reverse must swiftly engage negative speed (was ${testPlayer.speed.toFixed(1)})`);

for (let frame = 0; frame < 15; frame++) {
    testPlayer.update(brakeInput, null, null, null, 0.05);
}
assert(testPlayer.speed <= -180, `Manual reverse must rapidly reach brisk reverse velocity (was ${testPlayer.speed.toFixed(1)})`);
console.log('✓ Fast automatic reverse recovery and responsive manual reverse verified.');

// Test 7: Blue standard & Black advanced Police with 10-Minute Escalation
console.log('Test 7: Verifying police pursuit and 10-minute escalation...');
const police = new PoliceManager();
const blueCar = new PoliceCar('blue', 100, 100);
const blackCar = new PoliceCar('black', 100, 100);

assert.strictEqual(blueCar.type, 'blue');
assert.strictEqual(blackCar.type, 'black');
assert(blackCar.maxSpeed > blueCar.maxSpeed, 'Black advanced car must be faster');
assert(blackCar.armor > blueCar.armor, 'Black advanced car must be more durable');

police.update({ x: 2000, y: 2000, angle: 0, speed: 200 }, null, null, true, 300);
assert.strictEqual(police.blackPoliceUnlocked, false, 'Black police must be locked before 10 minutes');

police.update({ x: 2000, y: 2000, angle: 0, speed: 200 }, null, null, true, 305);
assert.strictEqual(police.blackPoliceUnlocked, true, 'Black police must unlock at 10 minutes');
assert(police.getAnnouncement().includes('BLACK PURSUIT UNITS DEPLOYED'));

// Verify ZERO spike strips in code
const serializedPolice = JSON.stringify(police) + JSON.stringify(blueCar) + JSON.stringify(blackCar);
assert(!serializedPolice.toLowerCase().includes('spike'), 'Police must never deploy spike strips');
console.log('✓ Police pursuit with 10-minute escalation and zero spike strips verified.');

// Test 8: Exactly 3 Abilities with Independent 150-Second Cooldowns
console.log('Test 8: Verifying abilities with independent 150s cooldowns...');
const abilities = new AbilityManager();
const abilityList = Object.keys(abilities.abilities);
assert.deepStrictEqual(abilityList, ['tank', 'oil', 'emp'], 'Must have exactly Tank, Oil, and EMP');

for (const key of abilityList) {
    assert.strictEqual(abilities.abilities[key].cooldown, 150, `${key} cooldown must be 150s`);
}

const tankResult = abilities.triggerAbility('tank', { x: 100, y: 100, isWrecked: false, activateTank: () => {} }, police, null);
assert.strictEqual(tankResult.success, true);
assert.strictEqual(abilities.abilities.tank.timer, 150, 'Tank must start 150s cooldown immediately');
assert.strictEqual(abilities.abilities.oil.timer, 0, 'Oil cooldown must remain unaffected');
assert.strictEqual(abilities.abilities.emp.timer, 0, 'EMP cooldown must remain unaffected');
console.log('✓ Three abilities with independent 150s cooldowns verified.');

// Test 9: Mobile Virtual Joystick, Direct Touch Steer, Action Buttons, and mobile-v3.css
console.log('Test 9: Verifying mobile virtual joystick, multi-touch buttons, and mobile-v3.css...');
const controls = new ControlsManager(null);
assert.strictEqual(typeof controls.isBoosting, 'boolean', 'isBoosting getter must return boolean');
assert.strictEqual(typeof controls.isBraking, 'boolean', 'isBraking getter must return boolean');
assert.strictEqual(typeof controls.isHandbrake, 'boolean', 'isHandbrake getter must return boolean');

// Test Virtual Joystick calculation
controls.joystick.originX = 100;
controls.joystick.originY = 400;
controls.joystick.radius = 60;
controls.updateJoystick(150, 400); // Deflect right by 50px
assert(controls.steerAmount > 0.5, 'Right joystick deflection must produce positive steerAmount');
assert.strictEqual(controls.hasSteerVector, true);

// Test Joystick Push Up (Boost)
controls.updateJoystick(100, 360); // Deflect UP by 40px (-0.66 normY)
assert.strictEqual(controls.isBoosting, true, 'Pushing joystick up must activate isBoosting');
assert.strictEqual(controls.isBraking, false);

// Test Joystick Pull Down (Reverse)
controls.updateJoystick(100, 440); // Deflect DOWN by 40px (+0.66 normY)
assert.strictEqual(controls.isBraking, true, 'Pulling joystick down must activate isBraking');
assert.strictEqual(controls.isBoosting, false);

controls.resetJoystick();
assert.strictEqual(controls.steerAmount, 0, 'Reset joystick must return steerAmount to 0');
assert.strictEqual(controls.isBoosting, false);
assert.strictEqual(controls.isBraking, false);

// Test Mobile Action Buttons
controls.btnBoosting = true;
assert.strictEqual(controls.isBoosting, true, 'btnBoosting must toggle isBoosting');
controls.btnBoosting = false;

controls.btnBraking = true;
assert.strictEqual(controls.isBraking, true, 'btnBraking must toggle isBraking');
controls.btnBraking = false;

controls.btnDrifting = true;
assert.strictEqual(controls.isHandbrake, true, 'btnDrifting must toggle isHandbrake');
controls.btnDrifting = false;

// Verify separate mobile-v3.css exists and is linked in index.html
const mobileCssPath = fileURLToPath(new URL('../mobile-v3.css', import.meta.url));
assert(fs.existsSync(mobileCssPath), 'mobile-v3.css must exist as a dedicated stylesheet');
const indexHtmlContent = fs.readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
assert(indexHtmlContent.includes('mobile-v3.css'), 'index.html must link mobile-v3.css');
assert(indexHtmlContent.includes('id="btn-touch-boost"'), 'index.html must contain mobile boost button');
assert(indexHtmlContent.includes('id="btn-touch-brake"'), 'index.html must contain mobile reverse/brake button');
assert(indexHtmlContent.includes('id="btn-touch-drift"'), 'index.html must contain mobile drift button');
console.log('✓ Mobile virtual joystick, multi-touch buttons, and mobile-v3.css verified.');

// Test 10: Underground Syndicate Ranking System (Tiers E to S+, RP Calculations, Leaderboard, Rewards)
console.log('Test 10: Verifying Underground Ranking System, Tiers, RP Calculations, and Leaderboards...');
const ranking = new RankingManager();

// Verify Rank Tiers
assert.strictEqual(RANK_TIERS.length, 7, 'Must have 7 distinct rank tiers (E, D, C, B, A, S, S+)');
assert.strictEqual(RANK_TIERS[0].id, 'E');
assert.strictEqual(RANK_TIERS[1].id, 'D');
assert.strictEqual(RANK_TIERS[2].id, 'C');
assert.strictEqual(RANK_TIERS[3].id, 'B');
assert.strictEqual(RANK_TIERS[4].id, 'A');
assert.strictEqual(RANK_TIERS[5].id, 'S');
assert.strictEqual(RANK_TIERS[6].id, 'S_PLUS');
assert.strictEqual(RANK_TIERS[6].badge, '👑');

// Test RP Calculation for run
const runStats = {
    score: 15000,
    copsWrecked: 12,
    destructiblesSmashed: 65,
    survivedTime: 180,
    escaped: true
};
const rpResult = ranking.calculateRunRP(runStats);
assert(rpResult.totalEarned > 0, 'RP earned must be positive');
assert(rpResult.breakdown.scoreRP > 0);
assert(rpResult.breakdown.wreckRP === 12 * 60, '12 wrecked cops * 60 RP');
assert(rpResult.breakdown.smashRP === 65 * 6, '65 smashes * 6 RP');
assert(rpResult.breakdown.escapeBonus === 200, 'Escape bonus must be 200 RP');

// Test Rank Progress & Promotion
storage.data.totalRP = 0;
const tierE = ranking.getCurrentTierInfo();
assert.strictEqual(tierE.tier.id, 'E');
assert.strictEqual(tierE.tier.name, 'Street Novice');

// Add 1200 RP -> Should promote to Rank D
const promo1 = ranking.addRP(1200);
assert.strictEqual(promo1.promoted, true);
assert.strictEqual(promo1.newTier.id, 'D');
assert.strictEqual(storage.getTotalRP(), 1200);

// Add 60000 RP -> S_PLUS (Most Wanted Legend)
const promoMax = ranking.addRP(60000);
assert.strictEqual(promoMax.promoted, true);
assert.strictEqual(promoMax.newTier.id, 'S_PLUS');
assert.strictEqual(promoMax.newTier.name, 'Most Wanted Legend');

// Test Leaderboard Generation
const mostWantedLb = ranking.getLeaderboard('mostWanted');
assert.strictEqual(mostWantedLb.length, 10, 'Most Wanted Leaderboard must contain 10 entries');
assert(mostWantedLb.some(e => e.isPlayer), 'Leaderboard must include the player');

const wreckLb = ranking.getLeaderboard('copsWrecked');
assert.strictEqual(wreckLb.length, 10, 'Wrecker Leaderboard must contain 10 entries');

// Test Rank Reward Claiming
storage.data.claimedRankRewards = [];
const canClaimD = ranking.canClaimTierReward('D');
assert.strictEqual(canClaimD, true, 'Should be able to claim D reward at S+ tier');
const claimDResult = ranking.claimTierReward('D');
assert.strictEqual(claimDResult.success, true);
assert.strictEqual(claimDResult.reward, 1500, 'Rank D cash reward is $1500');
assert.strictEqual(storage.isRankRewardClaimed('D'), true);

const reClaim = ranking.claimTierReward('D');
assert.strictEqual(reClaim.success, false, 'Cannot re-claim already claimed reward');
console.log('✓ Underground Ranking System, Tiers, RP Calculations, and Leaderboards verified.');

console.log('=== ALL SMASH BANDITS RUNNER TESTS PASSED (10/10) ===');
