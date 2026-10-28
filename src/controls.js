// src/controls.js - Dual Mobile Virtual Joystick, Direct Touch Steering, and Desktop Mouse/Keyboard Controls
export class ControlsManager {
    constructor(canvas) {
        this.canvas = canvas;

        const hasWindow = typeof window !== 'undefined';
        const hasNavigator = typeof navigator !== 'undefined';
        this.isTouchDevice = (hasWindow && 'ontouchstart' in window) || (hasNavigator && navigator.maxTouchPoints > 0);

        this.hasSteerVector = false;
        this.steerAmount = 0; // -1.0 (full left) to +1.0 (full right)
        this.keySteer = 0;

        // Discrete Throttle & Braking Sources (Keyboard, Mouse, Mobile Buttons, Virtual Joystick)
        this.keyBoosting = false;
        this.mouseBoosting = false;
        this.btnBoosting = false;
        this.joyBoosting = false;

        this.keyBraking = false;
        this.btnBraking = false;
        this.joyBraking = false;

        this.keyHandbrake = false;
        this.btnDrifting = false;

        this.pauseTriggered = false;
        this.abilityTriggered = null;

        // Desktop mouse tracking
        this.mouseX = hasWindow ? window.innerWidth / 2 : 400;
        this.mouseY = hasWindow ? window.innerHeight / 2 : 300;
        this.mouseInCanvas = false;

        // Mobile Virtual Joystick (Left Thumb)
        this.defaultJoyX = 100;
        this.defaultJoyY = 450;
        this.joystick = {
            active: false,
            touchId: null,
            originX: 100,
            originY: 450,
            currentX: 100,
            currentY: 450,
            radius: 65,
            knobRadius: 28,
            normX: 0,
            normY: 0
        };

        // Mobile Direct Touch-To-Steer (Anywhere on screen like PC mouse cursor)
        this.directSteer = {
            active: false,
            touchId: null,
            x: 0,
            y: 0,
            pulse: 0
        };

        if (hasWindow && this.canvas) {
            this.initListeners();
            this.initMobileButtonListeners();
            this.updateMobileLayout();
        }
    }

    // Unified Throttling, Braking, and Handbrake Getters
    get isBoosting() {
        return this.keyBoosting || this.mouseBoosting || this.btnBoosting || this.joyBoosting;
    }

    set isBoosting(v) {
        this.keyBoosting = v;
    }

    get isBraking() {
        return this.keyBraking || this.btnBraking || this.joyBraking;
    }

    set isBraking(v) {
        this.keyBraking = v;
    }

    get isHandbrake() {
        return this.keyHandbrake || this.btnDrifting;
    }

    set isHandbrake(v) {
        this.keyHandbrake = v;
    }

    initListeners() {
        window.addEventListener('resize', () => {
            this.updateMobileLayout();
        });

        // ==========================================
        // 1. DESKTOP MOUSE CONTROLS (Steer toward cursor)
        // ==========================================
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            this.mouseInCanvas = true;
        });

        this.canvas.addEventListener('mouseenter', () => {
            this.mouseInCanvas = true;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.mouseInCanvas = false;
        });

        // Right mouse button holds Nitro / Throttle Boost
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 2) {
                this.mouseBoosting = true;
                e.preventDefault();
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 2) {
                this.mouseBoosting = false;
            }
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // ==========================================
        // 2. KEYBOARD CONTROLS (WASD, Arrows, Space, Abilities)
        // ==========================================
        window.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            const code = e.code;

            if (code === 'KeyW' || code === 'ArrowUp') {
                this.keyBoosting = true;
            } else if (code === 'KeyS' || code === 'ArrowDown') {
                this.keyBraking = true;
            } else if (code === 'KeyA' || code === 'ArrowLeft') {
                this.keySteer = -1;
            } else if (code === 'KeyD' || code === 'ArrowRight') {
                this.keySteer = 1;
            } else if (code === 'Space') {
                this.keyHandbrake = true;
            } else if (code === 'KeyP' || code === 'Escape') {
                this.pauseTriggered = true;
            } else if (code === 'Digit1' || code === 'KeyQ') {
                this.abilityTriggered = 'tank';
            } else if (code === 'Digit2' || code === 'KeyE') {
                this.abilityTriggered = 'oil';
            } else if (code === 'Digit3' || code === 'KeyR') {
                this.abilityTriggered = 'emp';
            }
        });

        window.addEventListener('keyup', (e) => {
            const code = e.code;
            if (code === 'KeyW' || code === 'ArrowUp') {
                this.keyBoosting = false;
            } else if (code === 'KeyS' || code === 'ArrowDown') {
                this.keyBraking = false;
            } else if (code === 'KeyA' || code === 'ArrowLeft') {
                if (this.keySteer === -1) this.keySteer = 0;
            } else if (code === 'KeyD' || code === 'ArrowRight') {
                if (this.keySteer === 1) this.keySteer = 0;
            } else if (code === 'Space') {
                this.keyHandbrake = false;
            }
        });

        // ==========================================
        // 3. MOBILE MULTI-TOUCH CONTROLS (Canvas Listeners)
        // ==========================================
        this.initTouchCanvasListeners();
    }

    initTouchCanvasListeners() {
        const markTouchActive = () => {
            if (!this.isTouchDevice) {
                this.isTouchDevice = true;
            }
            if (typeof document !== 'undefined' && document.body) {
                document.body.classList.add('touch-active-mode');
            }
        };

        const handleTouchStart = (e) => {
            markTouchActive();
            const rect = this.canvas.getBoundingClientRect();

            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                const tx = t.clientX - rect.left;
                const ty = t.clientY - rect.top;

                // Left 55% of screen or bottom-left zone: Virtual Joystick
                const isLeftZone = (tx < rect.width * 0.55);
                const isActionButtonZone = (tx > rect.width * 0.65 && ty > rect.height * 0.55);

                if (isLeftZone && this.joystick.touchId === null) {
                    this.joystick.active = true;
                    this.joystick.touchId = t.identifier;
                    this.joystick.originX = tx;
                    this.joystick.originY = ty;
                    this.joystick.currentX = tx;
                    this.joystick.currentY = ty;
                    this.updateJoystick(tx, ty);
                    e.preventDefault();
                } else if (!isActionButtonZone && this.directSteer.touchId === null) {
                    // Direct touch to steer towards point (PC mouse equivalent on mobile)
                    this.directSteer.active = true;
                    this.directSteer.touchId = t.identifier;
                    this.directSteer.x = tx;
                    this.directSteer.y = ty;
                    this.directSteer.pulse = 1.0;
                    e.preventDefault();
                }
            }
        };

        const handleTouchMove = (e) => {
            const rect = this.canvas.getBoundingClientRect();

            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                const tx = t.clientX - rect.left;
                const ty = t.clientY - rect.top;

                if (t.identifier === this.joystick.touchId) {
                    this.updateJoystick(tx, ty);
                    e.preventDefault();
                } else if (t.identifier === this.directSteer.touchId) {
                    this.directSteer.x = tx;
                    this.directSteer.y = ty;
                    e.preventDefault();
                }
            }
        };

        const handleTouchEnd = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];

                if (t.identifier === this.joystick.touchId) {
                    this.resetJoystick();
                }
                if (t.identifier === this.directSteer.touchId) {
                    this.resetDirectSteer();
                }
            }
        };

        this.canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
        this.canvas.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    }

    initMobileButtonListeners() {
        if (typeof document === 'undefined') return;

        // Auto-detect touch on any DOM interaction
        window.addEventListener('touchstart', () => {
            if (!this.isTouchDevice) {
                this.isTouchDevice = true;
            }
            if (document.body) {
                document.body.classList.add('touch-active-mode');
            }
        }, { once: true, passive: true });

        // Helper to bind robust multi-touch hold events to on-screen arcade buttons
        const bindHoldButton = (btnId, onStart, onEnd) => {
            const btn = document.getElementById(btnId);
            if (!btn) return;

            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                btn.classList.add('touch-active');
                onStart();
            }, { passive: false });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                btn.classList.remove('touch-active');
                onEnd();
            }, { passive: false });

            btn.addEventListener('touchcancel', (e) => {
                btn.classList.remove('touch-active');
                onEnd();
            }, { passive: true });

            // Also support mouse clicks on these buttons for testing on desktop
            btn.addEventListener('mousedown', (e) => {
                btn.classList.add('touch-active');
                onStart();
            });

            btn.addEventListener('mouseup', () => {
                btn.classList.remove('touch-active');
                onEnd();
            });

            btn.addEventListener('mouseleave', () => {
                btn.classList.remove('touch-active');
                onEnd();
            });
        };

        // Right-Thumb Mobile Buttons: Boost, Reverse, Drift
        bindHoldButton('btn-touch-boost', () => { this.btnBoosting = true; }, () => { this.btnBoosting = false; });
        bindHoldButton('btn-touch-brake', () => { this.btnBraking = true; }, () => { this.btnBraking = false; });
        bindHoldButton('btn-touch-drift', () => { this.btnDrifting = true; }, () => { this.btnDrifting = false; });

        // Immediate Touch Triggers for Abilities
        const bindAbilityTouch = (btnId, abilityName) => {
            const btn = document.getElementById(btnId);
            if (!btn) return;
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.abilityTriggered = abilityName;
            }, { passive: false });
        };

        bindAbilityTouch('btn-ability-tank', 'tank');
        bindAbilityTouch('btn-ability-oil', 'oil');
        bindAbilityTouch('btn-ability-emp', 'emp');
    }

    updateMobileLayout() {
        if (!this.canvas) return;
        const w = this.canvas.width || (typeof window !== 'undefined' ? window.innerWidth : 800);
        const h = this.canvas.height || (typeof window !== 'undefined' ? window.innerHeight : 600);

        this.defaultJoyX = Math.max(80, Math.min(130, w * 0.16));
        this.defaultJoyY = h - Math.max(90, Math.min(140, h * 0.22));

        if (!this.joystick.active) {
            this.joystick.originX = this.defaultJoyX;
            this.joystick.originY = this.defaultJoyY;
            this.joystick.currentX = this.defaultJoyX;
            this.joystick.currentY = this.defaultJoyY;
        }

        // Dynamically scale joystick size based on screen dimensions
        this.joystick.radius = Math.max(52, Math.min(74, Math.min(w, h) * 0.14));
        this.joystick.knobRadius = Math.round(this.joystick.radius * 0.44);
    }

    updateJoystick(touchX, touchY) {
        const dx = touchX - this.joystick.originX;
        const dy = touchY - this.joystick.originY;
        const dist = Math.hypot(dx, dy);
        const maxR = this.joystick.radius;

        if (dist > maxR) {
            this.joystick.currentX = this.joystick.originX + (dx / dist) * maxR;
            this.joystick.currentY = this.joystick.originY + (dy / dist) * maxR;
        } else {
            this.joystick.currentX = touchX;
            this.joystick.currentY = touchY;
        }

        this.joystick.normX = Math.max(-1.0, Math.min(1.0, (this.joystick.currentX - this.joystick.originX) / maxR));
        this.joystick.normY = Math.max(-1.0, Math.min(1.0, (this.joystick.currentY - this.joystick.originY) / maxR));

        // Horizontal steering with 7% deadzone and progressive curve
        let steerVal = 0;
        if (Math.abs(this.joystick.normX) > 0.07) {
            const sign = Math.sign(this.joystick.normX);
            const magnitude = (Math.abs(this.joystick.normX) - 0.07) / 0.93;
            steerVal = sign * Math.pow(magnitude, 1.15);
        }

        this.steerAmount = steerVal;
        this.hasSteerVector = true;

        // Vertical Joystick gestures: Push UP to Boost, Pull DOWN to Reverse
        if (this.joystick.normY < -0.32) {
            this.joyBoosting = true;
            this.joyBraking = false;
        } else if (this.joystick.normY > 0.32) {
            this.joyBraking = true;
            this.joyBoosting = false;
        } else {
            this.joyBoosting = false;
            this.joyBraking = false;
        }
    }

    resetJoystick() {
        this.joystick.active = false;
        this.joystick.touchId = null;
        this.joystick.normX = 0;
        this.joystick.normY = 0;
        this.joystick.currentX = this.joystick.originX;
        this.joystick.currentY = this.joystick.originY;
        this.joyBoosting = false;
        this.joyBraking = false;
        this.hasSteerVector = false;
        this.steerAmount = 0;
    }

    resetDirectSteer() {
        this.directSteer.active = false;
        this.directSteer.touchId = null;
        this.hasSteerVector = false;
    }

    update(player, camera) {
        // 1. Mobile Virtual Joystick Active
        if (this.joystick.active) {
            // Already computed dynamically in updateJoystick
            return;
        }

        // 2. Mobile Direct Touch-To-Steer (Steer toward finger position anywhere on screen)
        if (this.directSteer.active && player && camera) {
            const playerScreen = camera.worldToScreen(player.x, player.y);
            const dx = this.directSteer.x - playerScreen.x;
            const dy = this.directSteer.y - playerScreen.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 30) {
                const pointerAngle = Math.atan2(dy, dx);
                let angleDiff = pointerAngle - player.angle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                const targetSteer = Math.max(-1.0, Math.min(1.0, angleDiff / 0.95));
                this.steerAmount += (targetSteer - this.steerAmount) * 0.28;
                this.hasSteerVector = true;
            } else {
                this.steerAmount *= 0.8;
            }
            return;
        }

        // 3. Desktop Mouse Steering Logic (Smooth pointer tracking)
        if (player && camera && this.mouseInCanvas && !this.joystick.active && !this.directSteer.active) {
            const playerScreen = camera.worldToScreen(player.x, player.y);
            const dx = this.mouseX - playerScreen.x;
            const dy = this.mouseY - playerScreen.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 35) {
                const pointerAngle = Math.atan2(dy, dx);
                let angleDiff = pointerAngle - player.angle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                const targetSteer = Math.max(-1.0, Math.min(1.0, angleDiff / 1.0));
                this.steerAmount += (targetSteer - this.steerAmount) * 0.25;
                this.hasSteerVector = true;
            } else {
                this.steerAmount *= 0.8;
                if (Math.abs(this.steerAmount) < 0.02) {
                    this.steerAmount = 0;
                    this.hasSteerVector = false;
                }
            }
        } else if (!this.hasSteerVector && this.keySteer === 0) {
            // Natural recentering
            this.steerAmount *= 0.8;
            if (Math.abs(this.steerAmount) < 0.02) this.steerAmount = 0;
        }
    }

    // High-performance Canvas 2D Mobile Visuals: Neon Virtual Joystick & Reticle
    drawMobileControls(ctx) {
        if (!ctx) return;

        const isMobileActive = this.isTouchDevice ||
            (typeof document !== 'undefined' && document.body && document.body.classList.contains('touch-active-mode'));

        if (!isMobileActive && !this.joystick.active && !this.directSteer.active) {
            return;
        }

        ctx.save();

        // 1. Draw Active Virtual Joystick
        if (this.joystick.active) {
            const { originX, originY, currentX, currentY, radius, knobRadius, normY } = this.joystick;

            // Outer Base Ring Glow
            ctx.beginPath();
            ctx.arc(originX, originY, radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 210, 255, 0.16)';
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#00d2ff';
            ctx.shadowColor = '#00d2ff';
            ctx.shadowBlur = 14;
            ctx.stroke();

            // Inner reference circle
            ctx.beginPath();
            ctx.arc(originX, originY, radius * 0.45, 0, Math.PI * 2);
            ctx.lineWidth = 1.2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.stroke();

            // Directional crosshair ticks
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(0, 210, 255, 0.6)';
            // North (Boost hint)
            ctx.beginPath();
            ctx.moveTo(originX, originY - radius + 3);
            ctx.lineTo(originX, originY - radius + 11);
            // South (Reverse hint)
            ctx.moveTo(originX, originY + radius - 11);
            ctx.lineTo(originX, originY + radius - 3);
            // West (Left)
            ctx.moveTo(originX - radius + 3, originY);
            ctx.lineTo(originX - radius + 11, originY);
            // East (Right)
            ctx.moveTo(originX + radius - 11, originY);
            ctx.lineTo(originX + radius - 3, originY);
            ctx.stroke();

            // Connecting stem from center to knob
            ctx.beginPath();
            ctx.moveTo(originX, originY);
            ctx.lineTo(currentX, currentY);
            ctx.lineWidth = 4;
            ctx.strokeStyle = normY < -0.32 ? '#00ffff' : (normY > 0.32 ? '#ff4757' : 'rgba(0, 210, 255, 0.55)');
            ctx.stroke();

            // Glowing Thumb Knob
            const knobGrad = ctx.createRadialGradient(
                currentX - knobRadius * 0.3,
                currentY - knobRadius * 0.3,
                knobRadius * 0.1,
                currentX,
                currentY,
                knobRadius
            );

            if (normY < -0.32) {
                // Boost state: intense cyan/white
                knobGrad.addColorStop(0, '#ffffff');
                knobGrad.addColorStop(0.5, '#00ffff');
                knobGrad.addColorStop(1, '#0088cc');
                ctx.shadowColor = '#00ffff';
            } else if (normY > 0.32) {
                // Reverse state: intense amber/red
                knobGrad.addColorStop(0, '#ffffff');
                knobGrad.addColorStop(0.5, '#ff4757');
                knobGrad.addColorStop(1, '#c0392b');
                ctx.shadowColor = '#ff4757';
            } else {
                // Normal state: cyber cyan
                knobGrad.addColorStop(0, '#ffffff');
                knobGrad.addColorStop(0.5, '#00d2ff');
                knobGrad.addColorStop(1, '#0984e3');
                ctx.shadowColor = '#00d2ff';
            }

            ctx.beginPath();
            ctx.arc(currentX, currentY, knobRadius, 0, Math.PI * 2);
            ctx.fillStyle = knobGrad;
            ctx.shadowBlur = 18;
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

        } else if (isMobileActive) {
            // Resting / Standby Joystick Guide on Bottom-Left
            const jx = this.defaultJoyX;
            const jy = this.defaultJoyY;
            const r = this.joystick.radius;

            ctx.beginPath();
            ctx.arc(jx, jy, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 210, 255, 0.06)';
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = 'rgba(0, 210, 255, 0.35)';
            ctx.stroke();
            ctx.setLineDash([]);

            // Center resting thumb pad
            ctx.beginPath();
            ctx.arc(jx, jy, 16, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 210, 255, 0.25)';
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(0, 210, 255, 0.6)';
            ctx.stroke();
        }

        // 2. Direct Touch-To-Steer Reticle
        if (this.directSteer.active) {
            const sx = this.directSteer.x;
            const sy = this.directSteer.y;

            ctx.beginPath();
            ctx.arc(sx, sy, 22, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#00d2ff';
            ctx.shadowColor = '#00d2ff';
            ctx.shadowBlur = 12;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(sx, sy, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }

        ctx.restore();
    }
}
