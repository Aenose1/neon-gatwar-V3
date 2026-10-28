// src/particles.js - Multi-type particle physics, debris, skid trails, and floating arcade HUD text
export class ParticleManager {
    constructor() {
        this.particles = [];
        this.debris = [];
        this.skidMarks = [];
        this.floatingTexts = [];
        this.weatherParticles = [];
        this.maxSkidMarks = 400;
        this.maxParticles = 600;
    }

    reset() {
        this.particles = [];
        this.debris = [];
        this.skidMarks = [];
        this.floatingTexts = [];
        this.weatherParticles = [];
    }

    addSkidSegment(x1, y1, x2, y2, alpha = 0.5, color = 'rgba(25, 25, 25, 0.45)', width = 4) {
        if (this.skidMarks.length >= this.maxSkidMarks) {
            this.skidMarks.shift();
        }
        this.skidMarks.push({
            x1, y1, x2, y2,
            alpha,
            color,
            width,
            life: 1.0,
            decay: 0.04
        });
    }

    spawnTirePuff(x, y, angle, type = 'dust') {
        if (this.particles.length >= this.maxParticles) return;
        const speed = Math.random() * 30 + 10;
        const spread = (Math.random() - 0.5) * 0.8;
        const pAngle = angle + Math.PI + spread;

        let color = 'rgba(210, 185, 140, ';
        if (type === 'snow') color = 'rgba(240, 248, 255, ';
        else if (type === 'smoke') color = 'rgba(200, 200, 200, ';
        else if (type === 'grass') color = 'rgba(120, 180, 80, ';

        this.particles.push({
            x: x + (Math.random() - 0.5) * 6,
            y: y + (Math.random() - 0.5) * 6,
            vx: Math.cos(pAngle) * speed,
            vy: Math.sin(pAngle) * speed,
            size: Math.random() * 6 + 4,
            growRate: Math.random() * 8 + 6,
            life: 1.0,
            decay: Math.random() * 1.5 + 1.2,
            color,
            type: 'smoke'
        });
    }

    spawnDebris(x, y, type = 'wood', count = 12) {
        const colors = {
            wood: ['#8d6e63', '#6d4c41', '#a1887f', '#d7ccc8'],
            metal: ['#90a4ae', '#b0bec5', '#cfd8dc', '#eceff1'],
            brick: ['#d32f2f', '#c62828', '#b71c1c', '#e57373'],
            stone: ['#78909c', '#607d8b', '#546e7a', '#90a4ae'],
            foliage: ['#388e3c', '#2e7d32', '#4caf50', '#81c784'],
            glass: ['#80deea', '#4dd0e1', '#b2ebf2', '#ffffff']
        }[type] || ['#90a4ae', '#b0bec5'];

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 240 + 80;
            const size = Math.random() * 5 + 3;

            this.debris.push({
                x,
                y,
                z: Math.random() * 8 + 4,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                vz: Math.random() * 180 + 100,
                w: size,
                h: size * (Math.random() * 0.8 + 0.6),
                rot: Math.random() * Math.PI * 2,
                vrot: (Math.random() - 0.5) * 12,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1.0,
                decay: Math.random() * 0.8 + 0.6
            });
        }
    }

    spawnSparks(x, y, count = 10, color = '#f1c40f') {
        if (this.particles.length >= this.maxParticles) return;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 220 + 60;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 4 + 2,
                growRate: -1.5,
                life: 1.0,
                decay: Math.random() * 2.5 + 2.0,
                color,
                type: 'spark'
            });
        }
    }

    spawnEmpWave(x, y, radius = 280) {
        return this.spawnEMPShockwave(x, y, radius);
    }

    spawnExplosion(x, y, radius = 50) {
        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 260 + 60;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 8 + 4,
                growRate: -2,
                life: 1.0,
                decay: Math.random() * 1.5 + 1.0,
                color: Math.random() > 0.4 ? '#ff9900' : '#ff3300',
                type: 'spark'
            });
        }

        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 120 + 20;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 14 + 10,
                growRate: 15,
                life: 1.0,
                decay: Math.random() * 0.9 + 0.8,
                color: 'rgba(60, 60, 60, ',
                type: 'smoke'
            });
        }

        this.particles.push({
            x,
            y,
            size: 10,
            targetSize: radius * 2.2,
            life: 1.0,
            decay: 2.5,
            color: 'rgba(255, 170, 0, ',
            type: 'shockwave'
        });
    }

    spawnEMPShockwave(x, y, radius = 280) {
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 320 + 100;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 5 + 3,
                growRate: 0,
                life: 1.0,
                decay: Math.random() * 2.0 + 1.2,
                color: '#00e5ff',
                type: 'spark'
            });
        }

        this.particles.push({
            x,
            y,
            size: 20,
            targetSize: radius,
            life: 1.0,
            decay: 2.0,
            color: 'rgba(0, 229, 255, ',
            type: 'shockwave'
        });
    }

    spawnNitroFlame(x, y, angle) {
        if (this.particles.length >= this.maxParticles) return;
        const spread = (Math.random() - 0.5) * 0.3;
        const pAngle = angle + Math.PI + spread;
        const speed = Math.random() * 90 + 70;

        const isCyan = Math.random() > 0.3;
        this.particles.push({
            x: x + (Math.random() - 0.5) * 4,
            y: y + (Math.random() - 0.5) * 4,
            vx: Math.cos(pAngle) * speed,
            vy: Math.sin(pAngle) * speed,
            size: Math.random() * 6 + 4,
            growRate: -4,
            life: 1.0,
            decay: Math.random() * 3.5 + 2.5,
            color: isCyan ? '#00e5ff' : '#ff007f',
            type: 'spark'
        });
    }

    spawnWaterSplash(x, y, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 120 + 30;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 6 + 3,
                growRate: 4,
                life: 1.0,
                decay: Math.random() * 1.8 + 1.2,
                color: 'rgba(160, 230, 255, ',
                type: 'smoke'
            });
        }
    }

    addFloatingText(text, x, y, color = '#ffd700', size = 18, isCritical = false) {
        this.floatingTexts.push({
            text,
            x,
            y,
            vy: -40,
            life: 1.0,
            decay: isCritical ? 0.7 : 1.1,
            color,
            size,
            scale: isCritical ? 1.4 : 1.0
        });
    }

    initWeather(type, count = 130, worldW = 4200, worldH = 4200) {
        this.weatherParticles = [];
        if (!type || type === 'none') return;

        for (let i = 0; i < count; i++) {
            let pType = type;
            const px = Math.random() * worldW;
            const py = Math.random() * worldH;

            if (type === 'blended') {
                if (py >= 2100) {
                    pType = 'neon_spark';
                } else if (px >= 2100) {
                    pType = 'sun_glint';
                } else {
                    pType = 'petal';
                }
            }

            this.weatherParticles.push({
                x: px,
                y: py,
                vx: pType === 'neon_spark' ? (Math.random() * 40 - 20) : (Math.random() * 60 + 30),
                vy: pType === 'neon_spark' ? -(Math.random() * 50 + 20) : (Math.random() * 40 + 20),
                size: pType === 'neon_spark' ? (Math.random() * 2.5 + 1) : (Math.random() * 4 + 3),
                rot: Math.random() * Math.PI * 2,
                vrot: (Math.random() - 0.5) * 4,
                type: pType,
                alpha: Math.random() * 0.5 + 0.4
            });
        }
    }

    update(dt) {
        for (let i = this.skidMarks.length - 1; i >= 0; i--) {
            const sm = this.skidMarks[i];
            sm.life -= sm.decay * dt;
            if (sm.life <= 0) {
                this.skidMarks.splice(i, 1);
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= p.decay * dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            if (p.type === 'shockwave') {
                p.size += (p.targetSize - p.size) * (8 * dt);
            } else {
                p.x += (p.vx || 0) * dt;
                p.y += (p.vy || 0) * dt;
                p.size += (p.growRate || 0) * dt;
                if (p.size < 0) p.size = 0;
            }
        }

        const gravity = 420;
        for (let i = this.debris.length - 1; i >= 0; i--) {
            const d = this.debris[i];
            d.life -= d.decay * dt;
            if (d.life <= 0) {
                this.debris.splice(i, 1);
                continue;
            }

            d.x += d.vx * dt;
            d.y += d.vy * dt;
            d.rot += d.vrot * dt;

            d.z += d.vz * dt;
            d.vz -= gravity * dt;

            if (d.z <= 0) {
                d.z = 0;
                d.vz = -d.vz * 0.45;
                d.vx *= 0.65;
                d.vy *= 0.65;
                d.vrot *= 0.65;
            }
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.life -= ft.decay * dt;
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
                continue;
            }
            ft.y += ft.vy * dt;
        }

        for (let i = 0; i < this.weatherParticles.length; i++) {
            const wp = this.weatherParticles[i];
            wp.x += wp.vx * dt;
            wp.y += wp.vy * dt;
            wp.rot += wp.vrot * dt;

            if (wp.y > 4200) wp.y = 0;
            if (wp.y < 0) wp.y = 4200;
            if (wp.x > 4200) wp.x = 0;
            if (wp.x < 0) wp.x = 4200;
        }
    }

    drawSkids(ctx, camera) {
        ctx.save();
        for (let i = 0; i < this.skidMarks.length; i++) {
            const sm = this.skidMarks[i];
            if (!camera.isVisible(sm.x1, sm.y1, 60)) continue;

            ctx.beginPath();
            ctx.moveTo(sm.x1, sm.y1);
            ctx.lineTo(sm.x2, sm.y2);
            ctx.strokeStyle = sm.color;
            ctx.globalAlpha = sm.alpha * sm.life;
            ctx.lineWidth = sm.width;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
        ctx.restore();
    }

    drawWorldParticles(ctx, camera) {
        ctx.save();

        for (let i = 0; i < this.debris.length; i++) {
            const d = this.debris[i];
            if (!camera.isVisible(d.x, d.y, 40)) continue;

            ctx.save();
            ctx.globalAlpha = Math.min(1.0, d.life * 1.5);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.beginPath();
            ctx.ellipse(d.x + 3, d.y + 3, d.w * 0.7, d.h * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.translate(d.x, d.y - d.z);
            ctx.rotate(d.rot);
            ctx.fillStyle = d.color;
            ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);

            ctx.restore();
        }

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (!camera.isVisible(p.x, p.y, p.size + 20)) continue;

            ctx.save();
            if (p.type === 'smoke') {
                ctx.fillStyle = `${p.color}${p.life * 0.65})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'spark') {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'shockwave') {
                ctx.strokeStyle = `${p.color}${p.life})`;
                ctx.lineWidth = 6 * p.life;
                ctx.shadowColor = '#00e5ff';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }

        for (let i = 0; i < this.weatherParticles.length; i++) {
            const wp = this.weatherParticles[i];
            if (!camera.isVisible(wp.x, wp.y, 20)) continue;

            ctx.save();
            ctx.globalAlpha = wp.alpha;

            if (wp.type === 'snow') {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(wp.x, wp.y, wp.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (wp.type === 'petal') {
                ctx.translate(wp.x, wp.y);
                ctx.rotate(wp.rot);
                ctx.fillStyle = '#ff9ebb';
                ctx.beginPath();
                ctx.ellipse(0, 0, wp.size * 1.5, wp.size * 0.8, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (wp.type === 'neon_spark') {
                ctx.translate(wp.x, wp.y);
                ctx.fillStyle = '#ff007f';
                ctx.shadowColor = '#00d2ff';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(0, 0, wp.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (wp.type === 'sun_glint') {
                ctx.translate(wp.x, wp.y);
                ctx.fillStyle = '#f1c40f';
                ctx.shadowColor = '#f39c12';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(0, 0, wp.size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        ctx.restore();
    }

    drawFloatingTexts(ctx, camera) {
        if (this.floatingTexts.length === 0) return;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < this.floatingTexts.length; i++) {
            const ft = this.floatingTexts[i];
            if (!camera.isVisible(ft.x, ft.y, 80)) continue;

            ctx.save();
            ctx.globalAlpha = Math.min(1.0, ft.life * 1.3);
            const scale = ft.scale + (1.0 - ft.life) * 0.3;
            ctx.translate(ft.x, ft.y);
            ctx.scale(scale, scale);

            ctx.font = `900 ${ft.size}px 'Arial Black', Impact, sans-serif`;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillText(ft.text, 2, 2);

            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, 0, 0);

            ctx.restore();
        }
        ctx.restore();
    }
}
