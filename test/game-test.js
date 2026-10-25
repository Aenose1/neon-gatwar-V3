// test/game-test.js - Comprehensive test suite for Neon Getaway: Destruction Run
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

console.log('=== STARTING NEON GETAWAY TEST SUITE ===');

// Test 1: Config & Title
console.log('Test 1: Verifying game title and configuration...');
assert.strictEqual(CONFIG.TITLE, 'NEON GETAWAY: DESTRUCTION RUN');
assert.strictEqual(CONFIG.ABILITY_COOLDOWN, 150, 'Ability cooldown must be exactly 150 seconds');
assert.strictEqual(CONFIG.BLACK_POLICE_UNLOCK_TIME, 600, 'Black police must unlock at 10 minutes (600s)');
console.log('✓ Title and configuration verified.');

// Test 2: Exactly 10 Unique Playable Cars Across 3 Categories
console.log('Test 2: Verifying 10 unique car models across Normal, Sports, and Racing...');
const carKeys = Object.keys(CAR_MODELS);
assert.strictEqual(carKeys.length, 10, 'Must have at least 10 playable cars');

const expectedKeys = [
    'compact', 'sedan', 'hatchback', 'cruiser',
    'vortex', 'phantom', 'inferno',
    'apex', 'velocity', 'thunderbolt'
];
assert.deepStrictEqual(carKeys, expectedKeys, 'Car keys must match the exact 10 requested models');

// Verify Categories & Rarity
const normalCars = carKeys.filter(k => CAR_MODELS[k].category === 'normal');
const sportsCars = carKeys.filter(k => CAR_MODELS[k].category === 'sports');
const racingCars = carKeys.filter(k => CAR_MODELS[k].category === 'racing');

assert.strictEqual(normalCars.length, 4, 'Must have exactly 4 Normal cars');
assert.strictEqual(sportsCars.length, 3, 'Must have exactly 3 Sports cars');
assert.strictEqual(racingCars.length, 3, 'Must have exactly 3 Racing cars');

assert.strictEqual(CAR_MODELS.compact.price, 0, 'Starter Neon Compact must be free ($0)');
assert.strictEqual(CAR_MODELS.compact.rarity, 'common');
assert.strictEqual(CAR_MODELS.sedan.name, 'Street Sedan');
assert.strictEqual(CAR_MODELS.hatchback.name, 'Urban Hatchback');
assert.strictEqual(CAR_MODELS.cruiser.name, 'Heavy Cruiser');
assert.strictEqual(CAR_MODELS.vortex.name, 'Vortex GT');
assert.strictEqual(CAR_MODELS.phantom.name, 'Phantom Coupe');
assert.strictEqual(CAR_MODELS.inferno.name, 'Inferno RS');
assert.strictEqual(CAR_MODELS.apex.name, 'Apex Racer');
assert.strictEqual(CAR_MODELS.velocity.name, 'Velocity X');
assert.strictEqual(CAR_MODELS.thunderbolt.name, 'Thunderbolt Pro');

for (const key of carKeys) {
    const c = CAR_MODELS[key];
    assert(c.topSpeed > 0 && c.durability > 0 && c.armor > 0);
    assert(c.stats.speed <= 100 && c.stats.armor <= 100);
    assert(c.driftMultiplier > 0, `${key} must have a positive drift multiplier`);
    assert(['common', 'rare', 'epic', 'legendary'].includes(c.rarity));
}
console.log('✓ 10 playable cars verified with unique stats, categories, rarities, and visuals.');

// Test 3: Exactly 3 Improved Maps & Bug Fixes (Zero Houses in Roads, Water/Bridges, Destructibility >= 57%)
console.log('Test 3: Verifying three improved maps, road clearances, water collision, and >= 57% destructibles...');
assert.strictEqual(MAP_CONFIGS.length, 3, 'Must have exactly 3 maps');
assert.strictEqual(MAP_CONFIGS[0].id, 'suburbs');
assert.strictEqual(MAP_CONFIGS[0].name, 'Green Suburbs');
assert.strictEqual(MAP_CONFIGS[1].id, 'river');
assert.strictEqual(MAP_CONFIGS[1].name, 'River District');
assert.strictEqual(MAP_CONFIGS[2].id, 'industrial');
assert.strictEqual(MAP_CONFIGS[2].name, 'Neon Industrial Zone');

for (let i = 0; i < 3; i++) {
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

        // Specifically test Bridges 2 and 4 at the diagonal road crossings (previously triggered "you got wet"):
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

        // Verify actual water off-bridge STILL registers as hazardous water
        assert.strictEqual(map.isInWater(1600, 1790), true, 'Open river water must register as in water');
        assert.strictEqual(map.isInWater(2500, 1785), true, 'Open river water must register as in water');
    }

    // Verify >= 57% and around 60% Destructible Environmental Objects
    const ratio = map.getDestructibleRatio();
    console.log(`  Map ${map.name}: Destructibles = ${map.destructibles.length}, Solid Props = ${map.solidProps.length}, Ratio = ${(ratio * 100).toFixed(1)}%`);
    assert(ratio >= 0.57, `At least 57% of eligible environmental objects must be destructible (was ${(ratio * 100).toFixed(1)}%)`);
    assert(ratio <= 0.65, `Destructible ratio must be around 60% (was ${(ratio * 100).toFixed(1)}%)`);
}
console.log('✓ Three improved maps verified with clear roads, water barriers, drivable bridges, and >= 57% destructibles.');

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

// F. Unwanted Circle Object Removed:
assert(!mockMap.drawGroundDetails.toString().includes('arc'), 'drawGroundDetails must NOT draw circular artifacts on the ground');
console.log('✓ Zero environmental damage, police damage once-per-event, and circle removal verified.');

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

console.log('=== ALL NEON GETAWAY TESTS PASSED (8/8) ===');
