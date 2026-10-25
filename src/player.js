// src/player.js - Player vehicle physics, 2.5D rendering for 10 unique cars, drifting, water collision, and Tank mode
import { CAR_MODELS } from './config.js';
import { DamageManager } from './damage.js';
import { audio } from './audio.js';

export class PlayerCar {
    constructor(carId = 'compact', startX = 2100, startY = 3400) {
        this.damage = new DamageManager();
        this.setCarModel(carId);

        this.x = startX;
        this.y = startY;
        this.angle = -Math.PI / 2; // Facing north initially
        this.steerAngle = 0; // Front wheel visual angle

        this.speed = 0;
        this.vx = 0;
        this.vy = 0;
        this.lateralSlip = 0;
        this.isDrifting = false;

        this.isTank = false;
        this.tankTimer = 0;
        this.smokeTimer = 0;
        this.waterTimer = 0;
        this.waterSplashTimer = 0;
        this.waterHazardMessage = '';
    }

    setCarModel(carId) {
        const model = CAR_MODELS[carId] || CAR_MODELS.compact;
        this.carId = model.id;
        this.model = model;
        this.maxSpeed = model.topSpeed;
        this.boostSpeed = model.boostSpeed;
        this.accel = model.accel;
        this.turnRate = model.turnRate;
        this.width = model.width;
        this.length = model.length;
        this.driftMultiplier = model.driftMultiplier || 1.0;
        this.radius = Math.hypot(this.width, this.length) / 2.3;

        this.damage.reset(model.durability, model.armor);
    }

    get health() {
        return this.damage.health;
    }

    get maxHealth() {
        return this.damage.maxHealth;
    }

    get isWrecked() {
        return this.damage.isWrecked;
    }

    reset(x = 2100, y = 3400, angle = -Math.PI / 2) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.steerAngle = 0;
        this.speed = 120; // Starts rolling forward
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.isTank = false;
        this.tankTimer = 0;
        this.lateralSlip = 0;
        this.isDrifting = false;
        this.waterTimer = 0;
        this.waterSplashTimer = 0;
        this.waterHazardMessage = '';
        this.damage.reset(this.model.durability, this.model.armor);
    }

    activateTank(duration = 10) {
        this.isTank = true;
        this.tankTimer = duration;
        audio.playTankTransform();
    }

    takeCollisionDamage(obstacleId, impactSpeed) {
        return this.damage.takeCollisionDamage(obstacleId, impactSpeed, this.isTank);
    }

    update(input, map, particleManager, recoveryManager, dt) {
        this.damage.update(dt);

        if (this.isWrecked) {
            this.speed *= Math.max(0, 1 - 2 * dt);
            this.x += Math.cos(this.angle) * this.speed * dt;
            this.y += Math.sin(this.angle) * this.speed * dt;
            return;
        }

        // Tank timer countdown
        if (this.isTank) {
            this.tankTimer -= dt;
            if (this.tankTimer <= 0) {
                this.isTank = false;
            }
        }

        // ==========================================
        // WATER HAZARD DETECTION & SINKING PREVENTION
        // ==========================================
        const inWater = map ? map.isInWater(this.x, this.y) : false;
        if (inWater && !this.isTank) {
            // Rapidly decelerate vehicle when touching water
            this.speed *= Math.max(0, 1 - 7.0 * dt);
            this.waterTimer += dt;
            this.waterSplashTimer += dt;

            if (this.waterSplashTimer > 0.08) {
                this.waterSplashTimer = 0;
                if (particleManager) {
                    particleManager.spawnWaterSplash(this.x, this.y, 8);
                }
                audio.playSplash();
            }

            // If submerged or stalled in water, sink and reset to nearest road bank
            if (this.waterTimer > 0.35 || Math.abs(this.speed) < 35) {
                const safePoint = map.getNearestRoadPoint(this.x, this.y);
                this.x = safePoint.x;
                this.y = safePoint.y;
                this.speed = 110;
                this.waterTimer = 0;

                // Environmental water hazard rescue (does not reduce vehicle health)
                if (particleManager) {
                    particleManager.spawnWaterSplash(safePoint.x, safePoint.y, 18);
                    particleManager.addFloatingText('WATER HAZARD! RESET TO ROAD', safePoint.x, safePoint.y - 35, '#00d2ff', 18, true);
                }
                this.waterHazardMessage = 'WATER HAZARD! VEHICLE RECOVERED';
            }
        } else {
            this.waterTimer = 0;
        }

        // Off-road terrain check
        const isOffroad = map ? !map.isOnRoad(this.x, this.y) : false;
        const terrainFriction = isOffroad ? 0.72 : (map ? map.surfaceTraction : 1.0);

        // If recovery system is actively reversing, bypass normal drive controls
        if (recoveryManager && recoveryManager.isActive()) {
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.updateTireEffects(particleManager, map, isOffroad, dt);
            return;
        }

        // Target forward speed
        let targetSpeed = (this.isTank ? 340 : this.maxSpeed) * terrainFriction;
        if (input.isBoosting) {
            targetSpeed = (this.isTank ? 440 : this.boostSpeed) * terrainFriction;
        }

        const targetAccel = this.isTank ? 380 : this.accel;

        // Responsive Braking & Fast Reverse Movement
        if (input.isBraking) {
            // Cut forward drive immediately when player presses brake / reverse
            if (this.speed > 10) {
                // Immediate heavy braking to kill forward momentum
                this.speed = Math.max(0, this.speed - targetAccel * 4.5 * dt);
            } else {
                // Swift, noticeably fast reverse acceleration up to -240
                const maxReverseSpeed = -240;
                this.speed = Math.max(maxReverseSpeed, this.speed - targetAccel * 3.2 * dt);
            }
        } else {
            // Automatic forward cruising drive (only when not braking/reversing)
            if (this.speed < targetSpeed) {
                this.speed = Math.min(targetSpeed, this.speed + targetAccel * dt);
            } else if (this.speed > targetSpeed) {
                this.speed = Math.max(targetSpeed, this.speed - targetAccel * 1.5 * dt);
            }
        }

        // Steering input
        let steerInput = 0;
        if (input.hasSteerVector) {
            steerInput = input.steerAmount;
        } else if (input.keySteer !== 0) {
            steerInput = input.keySteer;
        }

        // Front wheels turning angle
        const targetWheelAngle = steerInput * 0.45;
        this.steerAngle += (targetWheelAngle - this.steerAngle) * Math.min(1, 14 * dt);

        // Turn rate adjusted by speed and map surface
        const currentTurnRate = (this.isTank ? 2.4 : this.turnRate) * (map ? map.surfaceTraction : 1.0);
        const speedTurnScale = Math.min(1.0, Math.abs(this.speed) / 70); // Responsive turn scaling even at lower speeds
        // In reverse (speed < 0), invert steering so the front of the car swings away cleanly
        const reverseSteerFactor = this.speed < 0 ? -1.0 : 1.0;
        const turnDelta = steerInput * currentTurnRate * speedTurnScale * dt * reverseSteerFactor;
        this.angle += turnDelta;

        // Drifting calculation with vehicle driftMultiplier
        const turnIntensity = Math.abs(steerInput);
        const isHighSpeed = Math.abs(this.speed) > 200;
        this.isDrifting = (turnIntensity > 0.42 && isHighSpeed) || input.isHandbrake;

        if (this.isDrifting && !this.isTank) {
            this.lateralSlip = Math.min(1.0, this.lateralSlip + (3.0 * this.driftMultiplier) * dt);
            audio.playDrift(0.12 * this.lateralSlip);
        } else {
            this.lateralSlip = Math.max(0, this.lateralSlip - 4.0 * dt);
        }

        // Velocity vector with lateral drift slip
        const forwardX = Math.cos(this.angle);
        const forwardY = Math.sin(this.angle);
        const normalX = -Math.sin(this.angle);
        const normalY = Math.cos(this.angle);

        const slipAmount = this.lateralSlip * 0.38 * -Math.sign(steerInput || 1);
        this.vx = (forwardX * this.speed) + (normalX * this.speed * slipAmount);
        this.vy = (forwardY * this.speed) + (normalY * this.speed * slipAmount);

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // World boundary clamp
        const worldW = map ? map.width : 4200;
        const worldH = map ? map.height : 4200;
        this.x = Math.max(50, Math.min(worldW - 50, this.x));
        this.y = Math.max(50, Math.min(worldH - 50, this.y));

        this.updateTireEffects(particleManager, map, isOffroad, dt);

        // Engine sound modulation
        const speedRatio = Math.abs(this.speed) / this.maxSpeed;
        audio.updateEngine(speedRatio, input.isBoosting);

        // Engine smoke when health is critical (<30%)
        if (this.damage.getHealthPercentage() <= 30 && !this.isTank) {
            this.smokeTimer += dt;
            if (this.smokeTimer > 0.08) {
                this.smokeTimer = 0;
                particleManager.particles.push({
                    x: this.x + Math.cos(this.angle) * 16,
                    y: this.y + Math.sin(this.angle) * 16,
                    vx: -Math.cos(this.angle) * 30 + (Math.random() - 0.5) * 20,
                    vy: -Math.sin(this.angle) * 30 + (Math.random() - 0.5) * 20,
                    size: 8,
                    growRate: 14,
                    life: 0.8,
                    decay: 1.4,
                    color: 'rgba(35, 35, 35, ',
                    type: 'smoke'
                });
            }
        }
    }

    updateTireEffects(particleManager, map, isOffroad, dt) {
        if (!particleManager) return;

        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        const halfL = this.length / 2;
        const halfW = this.width / 2;

        const rlX = this.x - cos * (halfL * 0.65) - sin * (halfW * 0.8);
        const rlY = this.y - sin * (halfL * 0.65) + cos * (halfW * 0.8);

        const rrX = this.x - cos * (halfL * 0.65) + sin * (halfW * 0.8);
        const rrY = this.y - sin * (halfL * 0.65) - cos * (halfW * 0.8);

        if (this.isDrifting || this.lateralSlip > 0.3) {
            if (this.prevRlX !== undefined) {
                const skidColor = 'rgba(20, 20, 20, 0.45)';
                particleManager.addSkidSegment(this.prevRlX, this.prevRlY, rlX, rlY, 0.4, skidColor, 4);
                particleManager.addSkidSegment(this.prevRrX, this.prevRrY, rrX, rrY, 0.4, skidColor, 4);
            }
            if (Math.random() < 0.4) {
                particleManager.spawnTirePuff(rlX, rlY, this.angle, 'smoke');
                particleManager.spawnTirePuff(rrX, rrY, this.angle, 'smoke');
            }
        }

        if (isOffroad && Math.abs(this.speed) > 100) {
            if (Math.random() < 0.5) {
                const puffType = map && map.theme === 'suburbs' ? 'grass' : (map && map.theme === 'industrial' ? 'smoke' : 'dust');
                particleManager.spawnTirePuff(rlX, rlY, this.angle, puffType);
                particleManager.spawnTirePuff(rrX, rrY, this.angle, puffType);
            }
        }

        this.prevRlX = rlX;
        this.prevRlY = rlY;
        this.prevRrX = rrX;
        this.prevRrY = rrY;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (this.isTank) {
            this.drawTank(ctx);
        } else {
            this.drawCar(ctx);
        }

        ctx.restore();
    }

    drawCar(ctx) {
        const w = this.width;
        const l = this.length;
        const halfW = w / 2;
        const halfL = l / 2;

        // 1. Drop shadow with 2.5D offset
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.roundRect(-halfL + 5, -halfW + 6, l, w, 8);
        ctx.fill();

        // 2. Rubber Tires with steering angle
        const tireW = 12;
        const tireH = 6;
        const frontTireOffset = halfL * 0.65;
        const rearTireOffset = -halfL * 0.65;

        const drawFrontTire = (yOffset) => {
            ctx.save();
            ctx.translate(frontTireOffset, yOffset);
            ctx.rotate(this.steerAngle);
            ctx.fillStyle = '#1e272e';
            ctx.fillRect(-tireW / 2, -tireH / 2, tireW, tireH);
            ctx.fillStyle = '#bdc3c7';
            ctx.fillRect(-tireW / 4, -tireH / 4, tireW / 2, tireH / 2);
            ctx.restore();
        };

        const drawRearTire = (yOffset) => {
            ctx.save();
            ctx.translate(rearTireOffset, yOffset);
            ctx.fillStyle = '#1e272e';
            ctx.fillRect(-tireW / 2, -tireH / 2, tireW, tireH);
            ctx.fillStyle = '#bdc3c7';
            ctx.fillRect(-tireW / 4, -tireH / 4, tireW / 2, tireH / 2);
            ctx.restore();
        };

        drawFrontTire(-halfW - 1);
        drawFrontTire(halfW + 1);
        drawRearTire(-halfW - 1);
        drawRearTire(halfW + 1);

        // 3. Body Chassis with Metallic Gradient
        const bodyGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
        bodyGrad.addColorStop(0, this.model.color);
        bodyGrad.addColorStop(0.5, this.lightenColor(this.model.color, 25));
        bodyGrad.addColorStop(1, this.darkenColor(this.model.color, 35));

        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        switch (this.carId) {
            case 'compact':
                ctx.roundRect(-halfL, -halfW, l, w, 6);
                break;
            case 'sedan':
                ctx.moveTo(halfL + 2, 0);
                ctx.lineTo(halfL - 2, -halfW);
                ctx.lineTo(-halfL + 4, -halfW);
                ctx.lineTo(-halfL - 2, 0);
                ctx.lineTo(-halfL + 4, halfW);
                ctx.lineTo(halfL - 2, halfW);
                ctx.closePath();
                break;
            case 'hatchback':
                ctx.roundRect(-halfL, -halfW, l, w, 4);
                break;
            case 'wagon':
                ctx.moveTo(halfL + 2, 0);
                ctx.lineTo(halfL - 2, -halfW + 1);
                ctx.lineTo(-halfL + 2, -halfW);
                ctx.lineTo(-halfL - 2, -halfW + 3);
                ctx.lineTo(-halfL - 2, halfW - 3);
                ctx.lineTo(-halfL + 2, halfW);
                ctx.lineTo(halfL - 2, halfW - 1);
                ctx.closePath();
                break;
            case 'runner':
                ctx.moveTo(halfL + 3, 0);
                ctx.lineTo(halfL - 2, -halfW + 2);
                ctx.lineTo(-halfL + 3, -halfW);
                ctx.lineTo(-halfL - 2, 0);
                ctx.lineTo(-halfL + 3, halfW);
                ctx.lineTo(halfL - 2, halfW - 2);
                ctx.closePath();
                break;
            case 'cruiser':
                ctx.roundRect(-halfL - 2, -halfW - 2, l + 4, w + 4, 3);
                break;
            case 'vortex':
                ctx.moveTo(halfL + 4, 0);
                ctx.lineTo(halfL - 2, -halfW);
                ctx.lineTo(-halfL + 2, -halfW);
                ctx.lineTo(-halfL - 3, -halfW + 4);
                ctx.lineTo(-halfL - 3, halfW - 4);
                ctx.lineTo(-halfL + 2, halfW);
                ctx.lineTo(halfL - 2, halfW);
                ctx.closePath();
                break;
            case 'phantom':
                ctx.moveTo(halfL + 5, 0);
                ctx.lineTo(halfL - 4, -halfW + 2);
                ctx.lineTo(-halfL + 6, -halfW);
                ctx.lineTo(-halfL - 2, 0);
                ctx.lineTo(-halfL + 6, halfW);
                ctx.lineTo(halfL - 4, halfW - 2);
                ctx.closePath();
                break;
            case 'inferno':
                ctx.moveTo(halfL + 6, 0);
                ctx.lineTo(halfL - 3, -halfW - 1);
                ctx.lineTo(-halfL + 4, -halfW - 1);
                ctx.lineTo(-halfL - 4, -halfW + 3);
                ctx.lineTo(-halfL - 4, halfW - 3);
                ctx.lineTo(-halfL + 4, halfW + 1);
                ctx.lineTo(halfL - 3, halfW + 1);
                ctx.closePath();
                break;
            case 'apex':
                ctx.moveTo(halfL + 7, 0);
                ctx.lineTo(halfL - 3, -halfW);
                ctx.lineTo(-halfL + 8, -halfW);
                ctx.lineTo(-halfL - 3, -halfW + 5);
                ctx.lineTo(-halfL - 3, halfW - 5);
                ctx.lineTo(-halfL + 8, halfW);
                ctx.lineTo(halfL - 3, halfW);
                ctx.closePath();
                break;
            case 'specter':
                ctx.moveTo(halfL + 6, 0);
                ctx.lineTo(halfL - 3, -halfW + 1);
                ctx.lineTo(-halfL + 5, -halfW);
                ctx.lineTo(-halfL - 4, -halfW + 4);
                ctx.lineTo(-halfL - 4, halfW - 4);
                ctx.lineTo(-halfL + 5, halfW);
                ctx.lineTo(halfL - 3, halfW - 1);
                ctx.closePath();
                break;
            case 'cyclone':
                ctx.moveTo(halfL + 7, 0);
                ctx.lineTo(halfL - 4, -halfW - 2);
                ctx.lineTo(-halfL + 6, -halfW - 2);
                ctx.lineTo(-halfL - 5, -halfW + 3);
                ctx.lineTo(-halfL - 5, halfW - 3);
                ctx.lineTo(-halfL + 6, halfW + 2);
                ctx.lineTo(halfL - 4, halfW + 2);
                ctx.closePath();
                break;
            case 'velocity':
                ctx.moveTo(halfL + 8, 0);
                ctx.lineTo(halfL - 4, -halfW + 3);
                ctx.lineTo(-halfL + 4, -halfW);
                ctx.lineTo(-halfL - 4, 0);
                ctx.lineTo(-halfL + 4, halfW);
                ctx.lineTo(halfL - 4, halfW - 3);
                ctx.closePath();
                break;
            case 'thunderbolt':
                ctx.moveTo(halfL + 10, 0);
                ctx.lineTo(halfL - 2, -halfW + 5);
                ctx.lineTo(-halfL + 5, -halfW);
                ctx.lineTo(-halfL - 5, -halfW + 6);
                ctx.lineTo(-halfL - 5, halfW - 6);
                ctx.lineTo(-halfL + 5, halfW);
                ctx.lineTo(halfL - 2, halfW - 5);
                ctx.closePath();
                break;
            case 'hyperion':
                ctx.moveTo(halfL + 9, 0);
                ctx.lineTo(halfL - 3, -halfW + 2);
                ctx.lineTo(-halfL + 5, -halfW);
                ctx.lineTo(-halfL - 6, -halfW + 5);
                ctx.lineTo(-halfL - 6, halfW - 5);
                ctx.lineTo(-halfL + 5, halfW);
                ctx.lineTo(halfL - 3, halfW - 2);
                ctx.closePath();
                break;
            case 'valkyrie':
                ctx.moveTo(halfL + 11, 0);
                ctx.lineTo(halfL - 2, -halfW + 4);
                ctx.lineTo(-halfL + 4, -halfW + 1);
                ctx.lineTo(-halfL - 7, -halfW + 6);
                ctx.lineTo(-halfL - 7, halfW - 6);
                ctx.lineTo(-halfL + 4, halfW - 1);
                ctx.lineTo(halfL - 2, halfW - 4);
                ctx.closePath();
                break;
            case 'zenith':
                ctx.moveTo(halfL + 12, 0);
                ctx.lineTo(halfL - 3, -halfW + 3);
                ctx.lineTo(-halfL + 3, -halfW - 1);
                ctx.lineTo(-halfL - 8, -halfW + 4);
                ctx.lineTo(-halfL - 8, halfW - 4);
                ctx.lineTo(-halfL + 3, halfW + 1);
                ctx.lineTo(halfL - 3, halfW - 3);
                ctx.closePath();
                break;
            default:
                ctx.roundRect(-halfL, -halfW, l, w, 6);
        }
        ctx.fill();
        ctx.stroke();

        // 4. Racing stripes / Livery
        ctx.fillStyle = this.model.stripeColor;
        ctx.fillRect(-halfL + 4, -3, l - 8, 6);

        // 5. Cabin & Glass Canopy
        const cabinX = -halfL * 0.22;
        const cabinW = l * 0.46;
        const cabinH = w * 0.66;

        ctx.fillStyle = '#111d28';
        ctx.beginPath();
        ctx.roundRect(cabinX, -cabinH / 2, cabinW, cabinH, 4);
        ctx.fill();

        const glassGrad = ctx.createLinearGradient(cabinX + cabinW, -cabinH / 2, cabinX, cabinH / 2);
        glassGrad.addColorStop(0, 'rgba(120, 220, 255, 0.7)');
        glassGrad.addColorStop(0.6, 'rgba(40, 100, 150, 0.6)');
        glassGrad.addColorStop(1, 'rgba(10, 30, 50, 0.8)');

        ctx.fillStyle = glassGrad;
        ctx.beginPath();
        ctx.moveTo(cabinX + cabinW - 2, -cabinH / 2 + 1);
        ctx.lineTo(cabinX + cabinW - 8, -cabinH / 2 + 3);
        ctx.lineTo(cabinX + cabinW - 8, cabinH / 2 - 3);
        ctx.lineTo(cabinX + cabinW - 2, cabinH / 2 - 1);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = this.darkenColor(this.model.color, 15);
        ctx.fillRect(cabinX + 4, -cabinH / 2 + 4, cabinW - 14, cabinH - 8);

        // 6. Distinct Custom Spoilers & Model Details
        ctx.fillStyle = '#1e272e';
        if (this.carId === 'cruiser') {
            // Heavy Bullbar
            ctx.fillStyle = '#747d8c';
            ctx.fillRect(halfL - 2, -halfW - 1, 4, w + 2);
            ctx.fillStyle = '#ff4757';
            ctx.fillRect(halfL * 0.2, -4, 10, 8); // Hood scoop
        } else if (this.carId === 'wagon') {
            // Metro Wagon Roof Rails and Rear Lip
            ctx.fillStyle = '#2d3436';
            ctx.fillRect(-halfL * 0.3, -halfW + 4, l * 0.5, 2);
            ctx.fillRect(-halfL * 0.3, halfW - 6, l * 0.5, 2);
            ctx.fillRect(-halfL - 3, -halfW + 2, 3, w - 4);
        } else if (this.carId === 'runner') {
            // City Runner Front Splitter & Ducktail
            ctx.fillStyle = '#1abc9c';
            ctx.fillRect(halfL - 2, -halfW + 2, 3, w - 4);
            ctx.fillStyle = '#111d28';
            ctx.fillRect(-halfL - 3, -halfW + 4, 3, w - 8);
        } else if (this.carId === 'vortex') {
            // Drift Rear Wing
            ctx.fillRect(-halfL - 5, -halfW - 2, 4, w + 4);
        } else if (this.carId === 'phantom') {
            // Dual aero fins
            ctx.fillRect(-halfL - 4, -halfW + 3, 4, 5);
            ctx.fillRect(-halfL - 4, halfW - 8, 4, 5);
        } else if (this.carId === 'inferno') {
            // Huge GT track wing
            ctx.fillStyle = '#2f3542';
            ctx.fillRect(-halfL - 7, -halfW - 4, 5, w + 8);
            ctx.fillStyle = '#ff4757';
            ctx.fillRect(-halfL - 7, -halfW - 4, 2, 4);
            ctx.fillRect(-halfL - 7, halfW, 2, 4);
        } else if (this.carId === 'apex') {
            // Championship Shark Fin & Wing
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(-halfL * 0.1, -1.5, l * 0.45, 3); // Shark Fin
            ctx.fillStyle = '#1e272e';
            ctx.fillRect(-halfL - 6, -halfW - 3, 5, w + 6);
        } else if (this.carId === 'specter') {
            // Specter GT Carbon Wing & Cyan Diffuser
            ctx.fillStyle = '#2d3436';
            ctx.fillRect(-halfL - 6, -halfW - 2, 4, w + 4);
            ctx.fillStyle = '#00d2ff';
            ctx.fillRect(-halfL - 7, -halfW + 6, 2, w - 12);
        } else if (this.carId === 'cyclone') {
            // Cyclone Turbo Extractors & Time Attack Wing
            ctx.fillStyle = '#2d3436';
            ctx.fillRect(halfL * 0.15, -halfW + 7, 8, 4);
            ctx.fillRect(halfL * 0.15, halfW - 11, 8, 4);
            ctx.fillRect(-halfL - 8, -halfW - 4, 5, w + 8);
            ctx.fillStyle = '#fab1a0';
            ctx.fillRect(-halfL - 8, -halfW - 4, 2, 5);
            ctx.fillRect(-halfL - 8, halfW - 1, 2, 5);
        } else if (this.carId === 'velocity') {
            // Hypercar Active Aero
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(-halfL - 6, -halfW - 1, 4, 6);
            ctx.fillRect(-halfL - 6, halfW - 5, 4, 6);
            ctx.fillStyle = '#ff007f';
            ctx.fillRect(-halfL - 8, -4, 4, 8);
        } else if (this.carId === 'thunderbolt') {
            // Prototype Formula Nose Wings & Giant Rear Wing
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(halfL + 4, -halfW - 3, 4, w + 6); // Front wing
            ctx.fillStyle = '#e056fd';
            ctx.fillRect(-halfL - 8, -halfW - 4, 6, w + 8); // Rear wing
        } else if (this.carId === 'hyperion') {
            // Hyperion EVO Quad Diffusers & Wing
            ctx.fillStyle = '#2d3436';
            ctx.fillRect(-halfL - 8, -halfW - 3, 5, w + 6);
            ctx.fillStyle = '#fdcb6e';
            ctx.fillRect(-halfL - 4, -halfW + 4, 3, 3);
            ctx.fillRect(-halfL - 4, halfW - 7, 3, 3);
            ctx.fillStyle = '#e17055';
            ctx.fillRect(-halfL - 9, -5, 3, 10);
        } else if (this.carId === 'valkyrie') {
            // Valkyrie Le Mans Shark Fin & Biplane Wing
            ctx.fillStyle = '#0984e3';
            ctx.fillRect(-halfL * 0.25, -2, l * 0.55, 4);
            ctx.fillStyle = '#1e272e';
            ctx.fillRect(-halfL - 9, -halfW - 5, 5, w + 10);
            ctx.fillStyle = '#55efc4';
            ctx.fillRect(-halfL - 9, -halfW - 5, 2, 4);
            ctx.fillRect(-halfL - 9, halfW + 1, 2, 4);
        } else if (this.carId === 'zenith') {
            // Zenith Stealth Winglets & Plasma Core
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(halfL + 2, -halfW - 2, 4, 5);
            ctx.fillRect(halfL + 2, halfW - 3, 4, 5);
            ctx.fillStyle = '#ff007f';
            ctx.fillRect(-halfL - 10, -halfW - 4, 6, w + 8);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-halfL - 11, -6, 3, 12);
        }

        // Headlights & Tail lights
        ctx.fillStyle = '#f5cd79';
        ctx.fillRect(halfL - 2, -halfW + 3, 3, 5);
        ctx.fillRect(halfL - 2, halfW - 8, 3, 5);

        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-halfL - 1, -halfW + 3, 2, 5);
        ctx.fillRect(-halfL - 1, halfW - 8, 2, 5);
    }

    drawTank(ctx) {
        const w = 44;
        const l = 68;
        const halfW = w / 2;
        const halfL = l / 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(-halfL + 4, -halfW + 6, l, w);

        ctx.fillStyle = '#2d3436';
        ctx.fillRect(-halfL, -halfW, l, 9);
        ctx.fillRect(-halfL, halfW - 9, l, 9);

        ctx.fillStyle = '#636e72';
        for (let x = -halfL + 4; x <= halfL - 6; x += 10) {
            ctx.fillRect(x, -halfW + 1, 6, 7);
            ctx.fillRect(x, halfW - 8, 6, 7);
        }

        const hullGrad = ctx.createLinearGradient(0, -halfW, 0, halfW);
        hullGrad.addColorStop(0, '#354f2a');
        hullGrad.addColorStop(0.5, '#4b6e3b');
        hullGrad.addColorStop(1, '#2c4223');

        ctx.fillStyle = hullGrad;
        ctx.fillRect(-halfL + 6, -halfW + 8, l - 12, w - 16);

        ctx.fillStyle = '#2d3436';
        ctx.beginPath();
        ctx.moveTo(halfL + 6, 0);
        ctx.lineTo(halfL - 2, -halfW + 4);
        ctx.lineTo(halfL - 2, halfW - 4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#3f5d32';
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#23361c';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#2d3436';
        ctx.fillRect(6, -3.5, 30, 7);
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(32, -4.5, 6, 9);
    }

    lightenColor(col, percent) {
        const num = parseInt(col.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `rgb(${R}, ${G}, ${B})`;
    }

    darkenColor(col, percent) {
        const num = parseInt(col.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `rgb(${R}, ${G}, ${B})`;
    }
}
