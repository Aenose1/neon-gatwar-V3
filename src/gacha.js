// src/gacha.js - Neon Gacha System with verified probabilities, card reveal animations, and duplicate compensation
import { CAR_MODELS } from './config.js';
import { storage } from './storage.js';
import { audio } from './audio.js';

export const GACHA_CONFIG = {
    SINGLE_COST: 500,
    MULTI_COST: 4500, // 10 rolls with 10% bulk discount
    MULTI_ROLL_COUNT: 10,
    RATES: {
        common: 0.50,     // 50%
        rare: 0.30,       // 30%
        epic: 0.15,       // 15%
        legendary: 0.05   // 5%
    },
    DUPLICATE_COMPENSATION: {
        common: 250,      // 50% refund
        rare: 800,        // Solid refund
        epic: 2000,       // High refund
        legendary: 5000   // Huge payout
    },
    RARITY_COLORS: {
        common: '#a4b0be',
        rare: '#00d2ff',
        epic: '#a55eea',
        legendary: '#f1c40f'
    },
    RARITY_GLOWS: {
        common: 'rgba(164, 176, 190, 0.4)',
        rare: 'rgba(0, 210, 255, 0.65)',
        epic: 'rgba(165, 94, 234, 0.8)',
        legendary: 'rgba(241, 196, 15, 0.95)'
    }
};

export class GachaManager {
    constructor(game) {
        this.game = game;
        this.isRolling = false;
        this.initPools();
    }

    initPools() {
        this.pools = {
            common: [],
            rare: [],
            epic: [],
            legendary: []
        };

        for (const [id, car] of Object.entries(CAR_MODELS)) {
            const rarity = car.rarity || 'common';
            if (this.pools[rarity]) {
                this.pools[rarity].push(id);
            }
        }
    }

    /**
     * Pick a rarity tier strictly following GACHA_CONFIG.RATES (50%, 30%, 15%, 5%)
     */
    sampleRarity(randomVal = Math.random()) {
        const rates = GACHA_CONFIG.RATES;
        if (randomVal < rates.common) {
            return 'common';
        } else if (randomVal < rates.common + rates.rare) {
            return 'rare';
        } else if (randomVal < rates.common + rates.rare + rates.epic) {
            return 'epic';
        } else {
            return 'legendary';
        }
    }

    /**
     * Rolls one random car from the configured pool according to weighted probabilities.
     * Handles duplicate compensation or new vehicle unlock.
     */
    drawSingleCar(randomRarityVal = Math.random(), randomCarVal = Math.random()) {
        const rarity = this.sampleRarity(randomRarityVal);
        const pool = this.pools[rarity];
        const carIndex = Math.floor(randomCarVal * pool.length);
        const carId = pool[carIndex];
        const car = CAR_MODELS[carId];

        const alreadyOwned = storage.isCarOwned(carId);
        let compensation = 0;

        if (alreadyOwned) {
            compensation = GACHA_CONFIG.DUPLICATE_COMPENSATION[rarity] || 250;
            storage.addCash(compensation);
        } else {
            storage.data.ownedCars.push(carId);
            storage.save();
        }

        return {
            carId,
            car,
            rarity,
            isDuplicate: alreadyOwned,
            compensation,
            color: GACHA_CONFIG.RARITY_COLORS[rarity],
            glow: GACHA_CONFIG.RARITY_GLOWS[rarity]
        };
    }

    canAffordSingle() {
        return storage.getCash() >= GACHA_CONFIG.SINGLE_COST;
    }

    canAffordMulti() {
        return storage.getCash() >= GACHA_CONFIG.MULTI_COST;
    }

    executeSingleRoll() {
        if (this.isRolling) {
            return { success: false, reason: 'ROLL_IN_PROGRESS' };
        }
        if (!this.canAffordSingle()) {
            return { success: false, reason: 'INSUFFICIENT_FUNDS', cost: GACHA_CONFIG.SINGLE_COST };
        }

        this.isRolling = true;
        clearTimeout(this.rollTimeout);
        this.rollTimeout = setTimeout(() => { this.isRolling = false; }, 4000);

        const deducted = storage.deductCash(GACHA_CONFIG.SINGLE_COST);
        if (!deducted) {
            this.isRolling = false;
            return { success: false, reason: 'INSUFFICIENT_FUNDS' };
        }

        const result = this.drawSingleCar();
        return {
            success: true,
            rolls: [result],
            costPaid: GACHA_CONFIG.SINGLE_COST,
            remainingCash: storage.getCash()
        };
    }

    executeMultiRoll() {
        if (this.isRolling) {
            return { success: false, reason: 'ROLL_IN_PROGRESS' };
        }
        if (!this.canAffordMulti()) {
            return { success: false, reason: 'INSUFFICIENT_FUNDS', cost: GACHA_CONFIG.MULTI_COST };
        }

        this.isRolling = true;
        clearTimeout(this.rollTimeout);
        this.rollTimeout = setTimeout(() => { this.isRolling = false; }, 4000);

        const deducted = storage.deductCash(GACHA_CONFIG.MULTI_COST);
        if (!deducted) {
            this.isRolling = false;
            return { success: false, reason: 'INSUFFICIENT_FUNDS' };
        }

        const results = [];
        for (let i = 0; i < GACHA_CONFIG.MULTI_ROLL_COUNT; i++) {
            results.push(this.drawSingleCar());
        }

        return {
            success: true,
            rolls: results,
            costPaid: GACHA_CONFIG.MULTI_COST,
            remainingCash: storage.getCash()
        };
    }

    finishRoll() {
        clearTimeout(this.rollTimeout);
        this.isRolling = false;
    }
}
