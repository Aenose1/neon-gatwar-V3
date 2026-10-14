// test/game-test.js - Comprehensive test suite for game logic, math, vehicles, maps, and abilities
import assert from 'node:assert';
import { CAR_MODELS } from '../js/car.js';
import { MAP_CONFIGS, GameMap } from '../js/map.js';
import { AbilityManager } from '../js/abilities.js';
import { PoliceManager, PoliceCar } from '../js/police.js';

console.log('--- STARTING SMASH OUTLAWS TEST SUITE ---');

// Test 1: Exactly 4 car models
console.log('Test 1: Verifying car models...');
const carKeys = Object.keys(CAR_MODELS);
assert.strictEqual(carKeys.length, 4, 'Must have exactly 4 car models');
assert.deepStrictEqual(carKeys, ['compact', 'street', 'muscle', 'super'], 'Car keys must match expected four models');

// Verify prices and stats
assert.strictEqual(CAR_MODELS.compact.price, 0, 'Starter Compact must be free');
assert.strictEqual(CAR_MODELS.street.price, 2500, 'Street Racer price must be $2,500');
assert.strictEqual(CAR_MODELS.muscle.price, 6000, 'Muscle Car price must be $6,000');
assert.strictEqual(CAR_MODELS.super.price, 12000, 'Supercar price must be $12,000');

for (const key of carKeys) {
    const c = CAR_MODELS[key];
    assert(c.topSpeed > 0, `${key} topSpeed must be positive`);
    assert(c.accel > 0, `${key} accel must be positive`);
    assert(c.turnRate > 0, `${key} turnRate must be positive`);
    assert(c.durability > 0, `${key} durability must be positive`);
    assert(c.stats.speed > 0 && c.stats.speed <= 100, `${key} speed stat must be between 1-100`);
    assert(c.stats.accel > 0 && c.stats.accel <= 100, `${key} accel stat must be between 1-100`);
    assert(c.stats.handling > 0 && c.stats.handling <= 100, `${key} handling stat must be between 1-100`);
    assert(c.stats.armor > 0 && c.stats.armor <= 100, `${key} armor stat must be between 1-100`);
}
console.log('✓ Car models verified: Exactly 4 cars with distinct stats and prices.');

// Test 2: Exactly 3 seasonal maps
console.log('Test 2: Verifying seasonal maps...');
assert.strictEqual(MAP_CONFIGS.length, 3, 'Must have exactly 3 maps');
assert.strictEqual(MAP_CONFIGS[0].id, 'winter', 'Map 1 must be Winter Wonderland');
assert.strictEqual(MAP_CONFIGS[1].id, 'summer', 'Map 2 must be Summer County');
assert.strictEqual(MAP_CONFIGS[2].id, 'spring', 'Map 3 must be Spring Valley');

// Verify map themes and road networks
for (let i = 0; i < 3; i++) {
    const map = new GameMap(i);
    assert(map.roads.length > 5, `Map ${i} must have active road network`);
    assert(map.destructibles.length > 50, `Map ${i} must have destructible scenery`);
    assert(map.buildings.length > 5, `Map ${i} must have buildings`);
    assert(map.surfaceTraction > 0.5 && map.surfaceTraction <= 1.0, `Map ${i} must have valid surface traction`);
    assert(map.isOnRoad(2100, 2000), `Central intersection must be on road in Map ${i}`);
    assert(!map.isOnRoad(100, 100), `Outer forest coordinate must be off-road in Map ${i}`);
}
console.log('✓ Maps verified: Winter Wonderland, Summer County, Spring Valley.');

// Test 3: Exactly 3 abilities (Tank, Oil Slick, EMP)
console.log('Test 3: Verifying special abilities...');
const abilityManager = new AbilityManager();
const abilityKeys = Object.keys(abilityManager.abilities);
assert.strictEqual(abilityKeys.length, 3, 'Must have exactly 3 special abilities');
assert.deepStrictEqual(abilityKeys, ['tank', 'oil', 'emp'], 'Abilities must be tank, oil, and emp');
assert.strictEqual(abilityManager.abilities.tank.duration, 10, 'Tank duration must be 10s');
assert.strictEqual(abilityManager.abilities.tank.cooldown, 30, 'Tank cooldown must be 30s');
assert.strictEqual(abilityManager.abilities.oil.cooldown, 18, 'Oil slick cooldown must be 18s');
assert.strictEqual(abilityManager.abilities.emp.cooldown, 22, 'EMP cooldown must be 22s');
console.log('✓ Abilities verified: Exactly 3 abilities with accurate durations and cooldowns.');

// Test 4: Police pursuit escalation and NO SPIKE STRIPS
console.log('Test 4: Verifying police pursuit mechanics...');
const policeManager = new PoliceManager();
assert.strictEqual(policeManager.heatLevel, 1, 'Initial heat level must be 1');

// Test heat progression
policeManager.addHeat(150);
assert.strictEqual(policeManager.heatLevel, 2, 'Heat must advance to Level 2');
policeManager.addHeat(400);
assert(policeManager.heatLevel <= 5, 'Heat level must cap at 5 stars');

// Check police car types
const cruiser = new PoliceCar('cruiser', 100, 100);
const enforcer = new PoliceCar('enforcer', 100, 100);
assert.strictEqual(cruiser.armor, 1.0);
assert.strictEqual(enforcer.armor, 1.6);
assert(cruiser.maxSpeed > enforcer.maxSpeed, 'Cruiser should be faster than heavy Enforcer SUV');

// Verify ABSOLUTELY NO SPIKE STRIPS in code
const codeToCheck = JSON.stringify(policeManager) + JSON.stringify(cruiser) + JSON.stringify(abilityManager);
assert(!codeToCheck.toLowerCase().includes('spike'), 'Zero spike strips must exist in police logic');
console.log('✓ Police pursuit verified: Heat escalation works, and ZERO spike strips exist.');

// Test 5: Police disruption mechanics (EMP Stun & Oil Spinout)
console.log('Test 5: Verifying ability disruption of police...');
cruiser.applyStun(4.0);
assert.strictEqual(cruiser.isStunned, true, 'Cruiser must be stunned by EMP');
assert.strictEqual(cruiser.stunTimer, 4.0, 'Stun duration must be 4 seconds');

enforcer.applySpinout(2.5);
assert.strictEqual(enforcer.isSpinning, true, 'Enforcer must be spinning from oil slick');
assert.strictEqual(enforcer.spinTimer, 2.5, 'Spinout duration must be 2.5 seconds');
console.log('✓ Disruption verified: Police stunned and spun out correctly.');

console.log('--- ALL SMASH OUTLAWS TESTS PASSED PERFECTLY! ---');
