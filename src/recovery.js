// src/recovery.js - Automatic reverse recovery system for stuck situations
import { CONFIG } from './config.js';

export class RecoveryManager {
    constructor() {
        this.stuckTimer = 0;
        this.isRecovering = false;
        this.recoveryTimer = 0;
        this.recoveryCooldownTimer = 0;
        this.recoveryTurnDirection = 1;
        this.message = '';
        this.messageTimer = 0;
    }

    reset() {
        this.stuckTimer = 0;
        this.isRecovering = false;
        this.recoveryTimer = 0;
        this.recoveryCooldownTimer = 0;
        this.message = '';
        this.messageTimer = 0;
    }

    /**
     * Updates stuck state detection and automatic reverse execution
     * @param {Object} player - The player vehicle
     * @param {boolean} isPressingSolid - True if colliding with an immovable obstacle
     * @param {boolean} isAttemptingMove - True if accelerating or normal forward drive is active
     * @param {number} dt - Delta time
     */
    update(player, isPressingSolid, isAttemptingMove, dt) {
        // Cooldown timer decay
        if (this.recoveryCooldownTimer > 0) {
            this.recoveryCooldownTimer -= dt;
        }

        // Message display timer
        if (this.messageTimer > 0) {
            this.messageTimer -= dt;
            if (this.messageTimer <= 0) {
                this.message = '';
            }
        }

        // 1. If currently in active auto-reverse recovery
        if (this.isRecovering) {
            this.recoveryTimer -= dt;

            // Apply brisk reverse velocity (-240) and active clearance steering offset
            const reverseSpeed = -240;
            player.speed = reverseSpeed;
            player.angle += this.recoveryTurnDirection * 1.5 * dt;

            // Stop reversing once timer completes or clearance is achieved
            if (this.recoveryTimer <= 0 || (!isPressingSolid && this.recoveryTimer < CONFIG.RECOVERY_DURATION * 0.4)) {
                this.isRecovering = false;
                this.stuckTimer = 0;
                this.recoveryCooldownTimer = CONFIG.RECOVERY_COOLDOWN;
                player.speed = 60; // Resume forward momentum smoothly
            }
            return;
        }

        // 2. Check for genuine stuck condition
        // Safeguards:
        // - Must be pressing against a solid obstacle
        // - Player must be attempting forward movement
        // - Actual movement must remain small
        // - If player is already reversing manually (player.speed < 0), do not trigger auto recovery
        const isBlocked = isPressingSolid && isAttemptingMove && player.speed >= -10 && player.speed < CONFIG.RECOVERY_VELOCITY_EPSILON;

        if (isBlocked && this.recoveryCooldownTimer <= 0) {
            this.stuckTimer += dt;

            // Trigger quickly after 0.5s stuck
            if (this.stuckTimer >= CONFIG.RECOVERY_STUCK_TIME) {
                this.activateRecovery(player);
            }
        } else {
            // Gradually decay stuck timer if moving or free
            this.stuckTimer = Math.max(0, this.stuckTimer - dt * 3.0);
        }
    }

    activateRecovery(player) {
        this.isRecovering = true;
        this.recoveryTimer = CONFIG.RECOVERY_DURATION;
        this.recoveryTurnDirection = Math.random() > 0.5 ? 1 : -1;
        this.message = 'AUTO RECOVERY: REVERSING...';
        this.messageTimer = CONFIG.RECOVERY_DURATION + 0.6;
    }

    isActive() {
        return this.isRecovering;
    }

    getMessage() {
        return this.message;
    }
}
