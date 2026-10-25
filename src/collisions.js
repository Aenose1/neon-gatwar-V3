// src/collisions.js - Collision detection and response engine with tiered destruction forces and solid props
import { audio } from './audio.js';

export class CollisionEngine {
    constructor() {
        this.isCollidingWithSolid = false;
    }

    handleAll(player, map, policeManager, abilityManager, particleManager, recoveryManager, scoringManager, camera) {
        if (!player || player.isWrecked) {
            this.isCollidingWithSolid = false;
            return;
        }

        this.isCollidingWithSolid = false;

        // 1. Player vs Destructibles (Tiered speed requirement)
        this.handlePlayerDestructibles(player, map, policeManager, particleManager, scoringManager, camera);

        // 2. Player vs Indestructible Solid Props (Bollards, Transformers, Pylons)
        this.handlePlayerSolidProps(player, map, particleManager, camera);

        // 3. Player vs Unbreakable Buildings
        this.handlePlayerBuildings(player, map, particleManager, camera);

        // 4. Player vs Police
        this.handlePlayerPolice(player, policeManager, particleManager, scoringManager, camera);

        // 5. Police vs Buildings & Solid Props
        this.handlePoliceBuildings(policeManager, map);
    }

    handlePlayerDestructibles(player, map, policeManager, particleManager, scoringManager, camera) {
        const nearby = map.getNearbyDestructibles(player.x, player.y, 140);
        const currentSpeed = Math.abs(player.speed);

        for (let i = 0; i < nearby.length; i++) {
            const d = nearby[i];
            if (d.destroyed) continue;

            const dist = Math.hypot(player.x - d.x, player.y - d.y);
            const minDist = player.radius + d.radius;

            if (dist < minDist) {
                // Tiered breaking threshold:
                // Heavy cars (cruiser) or tank mode or boosting lower the required speed threshold
                let threshold = d.reqSpeed || 100;
                if (player.isTank) threshold = 0;
                else if (player.carId === 'cruiser') threshold *= 0.55;

                const hasSufficientForce = currentSpeed >= threshold || player.isTank;

                if (hasSufficientForce) {
                    // Destroy object
                    d.destroyed = true;

                    // Award score, tiered cash, and combo via scoringManager
                    const rewards = scoringManager.recordDestruction(d.cashReward, d.scoreReward);

                    audio.playSmash(d.type);
                    audio.playCashChime();
                    camera.shake(player.isTank ? 9 : (d.tier === 'heavy' ? 8 : 4));

                    particleManager.spawnDebris(d.x, d.y, d.type, player.isTank ? 18 : 12);
                    particleManager.addFloatingText(`+$${rewards.cashGain}`, d.x, d.y, '#f1c40f', 18 + Math.min(10, rewards.combo * 2));

                    if (rewards.combo >= 3) {
                        particleManager.addFloatingText(`x${rewards.combo} COMBO!`, player.x, player.y - 28, '#ff4757', 20, true);
                    }

                    policeManager.addHeat(d.tier === 'heavy' ? 4 : 2);

                    // Speed penalty upon breaking (except tank or heavy cruiser)
                    if (!player.isTank && player.carId !== 'cruiser') {
                        const slowFactor = d.tier === 'heavy' ? 0.88 : (d.tier === 'medium' ? 0.94 : 0.98);
                        player.speed *= slowFactor;
                    }
                } else {
                    // Insufficient speed to break obstacle -> bounce off
                    this.isCollidingWithSolid = true;
                    const angle = Math.atan2(player.y - d.y, player.x - d.x);
                    player.x = d.x + Math.cos(angle) * minDist;
                    player.y = d.y + Math.sin(angle) * minDist;
                    player.speed *= -0.3;

                    audio.playHit();
                    camera.shake(4);
                    particleManager.spawnSparks(player.x, player.y, 8);
                    particleManager.addFloatingText('NEED MORE SPEED!', player.x, player.y - 22, '#f39c12', 14);
                }
            }
        }
    }

    handlePlayerSolidProps(player, map, particleManager, camera) {
        if (!map.solidProps) return;

        for (let i = 0; i < map.solidProps.length; i++) {
            const p = map.solidProps[i];
            const dist = Math.hypot(player.x - p.x, player.y - p.y);
            const minDist = player.radius + p.radius;

            if (dist < minDist && dist > 0) {
                this.isCollidingWithSolid = true;

                const normX = (player.x - p.x) / dist;
                const normY = (player.y - p.y) / dist;
                player.x = p.x + normX * minDist;
                player.y = p.y + normY * minDist;

                const preImpactSpeed = player.speed;
                const damageDealt = player.takeCollisionDamage(p.id, Math.abs(preImpactSpeed));

                player.speed *= -0.35;
                audio.playHit();
                camera.shake(Math.min(12, 4 + Math.abs(preImpactSpeed) * 0.02));
                particleManager.spawnSparks(player.x, player.y, 10);

                if (damageDealt > 0) {
                    particleManager.addFloatingText(`-${damageDealt} HP`, player.x, player.y - 20, '#e74c3c', 16);
                }
            }
        }
    }

    handlePlayerBuildings(player, map, particleManager, camera) {
        for (let i = 0; i < map.buildings.length; i++) {
            const b = map.buildings[i];
            const halfW = b.halfW + player.radius;
            const halfH = b.halfH + player.radius;

            const dx = player.x - b.x;
            const dy = player.y - b.y;

            if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
                this.isCollidingWithSolid = true;

                const overlapX = halfW - Math.abs(dx);
                const overlapY = halfH - Math.abs(dy);

                if (overlapX < overlapY) {
                    player.x += Math.sign(dx) * overlapX;
                } else {
                    player.y += Math.sign(dy) * overlapY;
                }

                // Substantial impact damage based on collision speed
                const preImpactSpeed = player.speed;
                const damageDealt = player.takeCollisionDamage(b.id, preImpactSpeed);

                player.speed *= -0.4; // Bounce response
                audio.playHit();
                camera.shake(Math.min(18, 6 + Math.abs(preImpactSpeed) * 0.025));
                particleManager.spawnSparks(player.x, player.y, 14);

                if (damageDealt > 0) {
                    particleManager.addFloatingText(`-${damageDealt} HP`, player.x, player.y - 20, '#e74c3c', 16);
                }
            }
        }
    }

    handlePlayerPolice(player, policeManager, particleManager, scoringManager, camera) {
        for (let i = 0; i < policeManager.policeCars.length; i++) {
            const cop = policeManager.policeCars[i];
            if (cop.isWrecked) continue;

            const dx = cop.x - player.x;
            const dy = cop.y - player.y;
            const dist = Math.hypot(dx, dy);
            const minDist = player.radius + cop.radius;

            if (dist < minDist && dist > 0) {
                const normX = dx / dist;
                const normY = dy / dist;

                if (player.isTank) {
                    // Tank obliterates police car instantly
                    cop.takeDamage(999);
                    const reward = cop.type === 'black' ? 1000 : 500;
                    scoringManager.addDirectCash(reward);
                    scoringManager.addDirectScore(2500);

                    camera.shake(18);
                    particleManager.spawnExplosion(cop.x, cop.y);
                    particleManager.addFloatingText(`COP CRUSHED! +$${reward}`, cop.x, cop.y, '#2ecc71', 22, true);
                    audio.playPoliceWreck();
                } else {
                    // Mutual bounce physics
                    const relSpeed = Math.abs(player.speed - cop.speed);
                    const pushDist = (minDist - dist) / 2;

                    player.x -= normX * pushDist;
                    player.y -= normY * pushDist;
                    cop.x += normX * pushDist;
                    cop.y += normY * pushDist;

                    const ramMultiplier = player.carId === 'cruiser' ? 2.5 : 1.0;
                    const damageToCop = Math.max(15, (relSpeed * 0.12) * ramMultiplier);
                    const damageToPlayer = player.takeCollisionDamage(`cop_${i}`, relSpeed * 0.6);

                    cop.takeDamage(damageToCop);

                    if (cop.isWrecked) {
                        const reward = cop.type === 'black' ? 1000 : 500;
                        scoringManager.addDirectCash(reward);
                        scoringManager.addDirectScore(2000);
                    }

                    audio.playHit();
                    camera.shake(8);
                    particleManager.spawnSparks((player.x + cop.x) / 2, (player.y + cop.y) / 2, 10);
                }
            }
        }
    }

    handlePoliceBuildings(policeManager, map) {
        for (let i = 0; i < policeManager.policeCars.length; i++) {
            const cop = policeManager.policeCars[i];
            if (cop.isWrecked) continue;

            for (let j = 0; j < map.buildings.length; j++) {
                const b = map.buildings[j];
                const halfW = b.halfW + cop.radius;
                const halfH = b.halfH + cop.radius;
                const dx = cop.x - b.x;
                const dy = cop.y - b.y;

                if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
                    const overlapX = halfW - Math.abs(dx);
                    const overlapY = halfH - Math.abs(dy);
                    if (overlapX < overlapY) {
                        cop.x += Math.sign(dx) * overlapX;
                    } else {
                        cop.y += Math.sign(dy) * overlapY;
                    }
                    cop.speed *= -0.3;
                    cop.takeDamage(20);
                }
            }
        }
    }
}
