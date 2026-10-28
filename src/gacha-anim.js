// src/gacha-anim.js - Cinematic Hyperspace Warp and Neon Summoning Animation
import { audio } from './audio.js';

export class GachaAnimator {
    constructor() {
        this.overlayEl = null;
        this.canvas = null;
        this.ctx = null;
        this.animating = false;
        this.animFrameId = null;
        this.onCompleteCallback = null;
        this.stars = [];
        this.numStars = 220;

        this.initDOM();
    }

    initDOM() {
        if (typeof document === 'undefined') return;

        this.overlayEl = document.getElementById('gacha-warp-overlay');
        this.canvas = document.getElementById('gacha-warp-canvas');
        this.skipBtn = document.getElementById('btn-gacha-skip');

        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
        }

        if (this.skipBtn) {
            this.skipBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.skip();
            });
        }
    }

    resizeCanvas() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    initStars() {
        this.stars = [];
        const w = this.canvas.width;
        const h = this.canvas.height;
        for (let i = 0; i < this.numStars; i++) {
            this.stars.push({
                x: (Math.random() - 0.5) * w * 2,
                y: (Math.random() - 0.5) * h * 2,
                z: Math.random() * 1000 + 1,
                size: Math.random() * 2 + 1,
                rot: Math.random() * Math.PI * 2
            });
        }
    }

    play(bestRarity = 'common', onComplete) {
        if (!this.canvas || !this.overlayEl) {
            if (onComplete) onComplete();
            return;
        }

        this.onCompleteCallback = onComplete;
        this.resizeCanvas();
        this.initStars();
        this.animating = true;
        this.overlayEl.classList.remove('hidden');

        audio.playGachaWarp();

        const startTime = performance.now();
        const duration = 2500; // 2.5 seconds cinematic pull

        const colors = {
            common: { core: '#ffffff', beam: '#cbd5e1', glow: 'rgba(255, 255, 255, 0.8)' },
            rare: { core: '#00d2ff', beam: '#0984e3', glow: 'rgba(0, 210, 255, 0.9)' },
            epic: { core: '#e056fd', beam: '#a55eea', glow: 'rgba(224, 86, 253, 0.95)' },
            legendary: { core: '#f1c40f', beam: '#ff9900', glow: 'rgba(241, 196, 15, 1.0)' }
        }[bestRarity] || { core: '#00d2ff', beam: '#ffffff', glow: 'rgba(0, 210, 255, 0.8)' };

        const frame = (now) => {
            if (!this.animating) return;

            const elapsed = now - startTime;
            const progress = Math.min(1.0, elapsed / duration);

            this.render(progress, colors, bestRarity);

            if (progress >= 1.0) {
                this.complete();
            } else {
                this.animFrameId = requestAnimationFrame(frame);
            }
        };

        this.animFrameId = requestAnimationFrame(frame);
    }

    render(p, colors, rarity) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        // Dark background with dynamic warp tint
        ctx.fillStyle = `rgba(8, 12, 20, ${0.35 + p * 0.4})`;
        ctx.fillRect(0, 0, w, h);

        // 1. Streaking Warp Stars Tunnel (speed escalates exponentially with progress)
        const warpSpeed = 12 + Math.pow(p, 2.2) * 90;
        ctx.save();
        for (let i = 0; i < this.stars.length; i++) {
            const s = this.stars[i];
            s.z -= warpSpeed;
            if (s.z <= 0) {
                s.z = 1000;
                s.x = (Math.random() - 0.5) * w * 2;
                s.y = (Math.random() - 0.5) * h * 2;
            }

            const k = 400 / s.z;
            const px = s.x * k + cx;
            const py = s.y * k + cy;

            if (px >= 0 && px <= w && py >= 0 && py <= h) {
                const prevK = 400 / (s.z + warpSpeed * 1.5);
                const prevX = s.x * prevK + cx;
                const prevY = s.y * prevK + cy;

                ctx.strokeStyle = p > 0.5 ? colors.beam : '#ffffff';
                ctx.lineWidth = Math.min(6, (1 - s.z / 1000) * 4 + 1);
                ctx.beginPath();
                ctx.moveTo(prevX, prevY);
                ctx.lineTo(px, py);
                ctx.stroke();
            }
        }
        ctx.restore();

        // 2. Swirling Central Singularity / Neon Rift
        const riftSize = 40 + Math.sin(p * Math.PI * 4) * 20 + Math.pow(p, 1.8) * 160;
        const pulseGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, riftSize);
        pulseGrad.addColorStop(0, '#ffffff');
        pulseGrad.addColorStop(0.3, colors.core);
        pulseGrad.addColorStop(0.7, colors.beam);
        pulseGrad.addColorStop(1, 'transparent');

        ctx.save();
        ctx.fillStyle = pulseGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, riftSize, 0, Math.PI * 2);
        ctx.fill();

        // Swirling neon energy rings
        ctx.lineWidth = 3;
        ctx.strokeStyle = colors.core;
        ctx.shadowColor = colors.core;
        ctx.shadowBlur = 25;
        const numRings = 4;
        for (let r = 0; r < numRings; r++) {
            const rot = p * 12 + (r * Math.PI) / numRings;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rot);
            ctx.beginPath();
            ctx.ellipse(0, 0, riftSize * 0.85, riftSize * 0.35, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();

        // 3. Climax: Glowing Summon Capsule / Outlaw Vehicle Silhouette (Emerges at p >= 0.65)
        if (p >= 0.65) {
            const launchP = (p - 0.65) / 0.35; // 0.0 to 1.0
            const carScale = Math.pow(launchP, 2.5) * 4.0;
            const carAlpha = Math.min(1.0, launchP * 2.0);

            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(carScale, carScale);
            ctx.globalAlpha = carAlpha;

            // Vehicle silhouette flare
            ctx.fillStyle = colors.core;
            ctx.shadowColor = colors.core;
            ctx.shadowBlur = 35;

            // Sleek aerodynamic sports silhouette
            ctx.beginPath();
            ctx.moveTo(0, -35);
            ctx.lineTo(16, -15);
            ctx.lineTo(18, 25);
            ctx.lineTo(12, 35);
            ctx.lineTo(-12, 35);
            ctx.lineTo(-18, 25);
            ctx.lineTo(-16, -15);
            ctx.closePath();
            ctx.fill();

            // Headlight beams shooting outward
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-10, -30);
            ctx.lineTo(-25, -90);
            ctx.moveTo(10, -30);
            ctx.lineTo(25, -90);
            ctx.stroke();

            ctx.restore();
        }

        // 4. Climax Blinding Supernova Flash (p >= 0.92)
        if (p >= 0.92) {
            const flashP = (p - 0.92) / 0.08;
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1.0, flashP * 1.5)})`;
            ctx.fillRect(0, 0, w, h);
        }

        // On-screen summon status text
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '900 1.4rem sans-serif';
        ctx.fillStyle = colors.core;
        ctx.shadowColor = colors.core;
        ctx.shadowBlur = 15;
        let summonText = 'INITIATING NEON HYPER-SUMMON...';
        if (p > 0.4) summonText = `WARPING THROUGH DIMENSIONAL RIFT [${rarity.toUpperCase()}]`;
        if (p > 0.8) summonText = 'OUTLAW VEHICLE MATERIALIZING!';
        ctx.fillText(summonText, cx, h - 80);
        ctx.restore();
    }

    skip() {
        if (!this.animating) return;
        this.complete();
    }

    complete() {
        if (!this.animating) return;
        this.animating = false;

        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }

        audio.playGachaBurst();

        if (this.overlayEl) {
            this.overlayEl.classList.add('hidden');
        }

        if (this.onCompleteCallback) {
            const cb = this.onCompleteCallback;
            this.onCompleteCallback = null;
            cb();
        }
    }
}

export const gachaAnimator = new GachaAnimator();
