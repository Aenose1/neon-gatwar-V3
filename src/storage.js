// src/storage.js - LocalStorage persistence for player progress and driver ranking
const STORAGE_KEY = 'neon_getaway_save_v1';

const DEFAULT_SAVE = {
    cash: 500, // Starter cash bonus
    ownedCars: ['compact'],
    selectedCar: 'compact',
    highScore: 0,
    selectedMap: 0,
    soundEnabled: true,
    stats: {
        totalSmashed: 0,
        totalCopsWrecked: 0,
        totalRuns: 0,
        totalCashEarned: 500,
        totalRP: 0,
        claimedRankRewards: []
    }
};

class StorageManager {
    constructor() {
        this.data = this.load();
    }

    load() {
        try {
            if (typeof localStorage === 'undefined') return { ...DEFAULT_SAVE };
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { ...DEFAULT_SAVE };
            const parsed = JSON.parse(raw);
            return {
                ...DEFAULT_SAVE,
                ...parsed,
                stats: {
                    ...DEFAULT_SAVE.stats,
                    ...(parsed.stats || {}),
                    claimedRankRewards: Array.isArray(parsed.stats?.claimedRankRewards)
                        ? parsed.stats.claimedRankRewards
                        : []
                },
                ownedCars: Array.isArray(parsed.ownedCars) && parsed.ownedCars.includes('compact') 
                    ? parsed.ownedCars 
                    : ['compact']
            };
        } catch (e) {
            console.warn('LocalStorage load failed, using defaults', e);
            return { ...DEFAULT_SAVE };
        }
    }

    save() {
        try {
            if (typeof localStorage === 'undefined') return;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('LocalStorage save failed', e);
        }
    }

    getCash() {
        return this.data.cash;
    }

    addCash(amount) {
        if (amount > 0) {
            this.data.cash += Math.floor(amount);
            this.data.stats.totalCashEarned += Math.floor(amount);
            this.save();
        }
        return this.data.cash;
    }

    deductCash(amount) {
        if (amount <= this.data.cash) {
            this.data.cash -= Math.floor(amount);
            this.save();
            return true;
        }
        return false;
    }

    isCarOwned(carId) {
        return this.data.ownedCars.includes(carId);
    }

    unlockCar(carId, cost) {
        if (this.isCarOwned(carId)) return true;
        if (this.deductCash(cost)) {
            this.data.ownedCars.push(carId);
            this.data.selectedCar = carId;
            this.save();
            return true;
        }
        return false;
    }

    getSelectedCar() {
        return this.data.selectedCar || 'compact';
    }

    setSelectedCar(carId) {
        if (this.isCarOwned(carId)) {
            this.data.selectedCar = carId;
            this.save();
            return true;
        }
        return false;
    }

    getSelectedMap() {
        return typeof this.data.selectedMap === 'number' ? this.data.selectedMap : 0;
    }

    setSelectedMap(mapIndex) {
        this.data.selectedMap = mapIndex;
        this.save();
    }

    getHighScore() {
        return this.data.highScore || 0;
    }

    updateHighScore(score) {
        if (score > this.data.highScore) {
            this.data.highScore = Math.floor(score);
            this.save();
            return true;
        }
        return false;
    }

    getTotalRP() {
        return this.data.stats.totalRP || 0;
    }

    addRP(amount) {
        if (amount > 0) {
            this.data.stats.totalRP = (this.data.stats.totalRP || 0) + Math.floor(amount);
            this.save();
        }
        return this.data.stats.totalRP;
    }

    isRankRewardClaimed(tierId) {
        return (this.data.stats.claimedRankRewards || []).includes(tierId);
    }

    claimRankReward(tierId, cashAmount) {
        if (!this.data.stats.claimedRankRewards) {
            this.data.stats.claimedRankRewards = [];
        }
        if (!this.data.stats.claimedRankRewards.includes(tierId)) {
            this.data.stats.claimedRankRewards.push(tierId);
            if (cashAmount > 0) {
                this.addCash(cashAmount);
            }
            this.save();
            return true;
        }
        return false;
    }

    isSoundEnabled() {
        return this.data.soundEnabled !== false;
    }

    setSoundEnabled(enabled) {
        this.data.soundEnabled = !!enabled;
        this.save();
    }

    recordRunEnd(smashed, copsWrecked, rpEarned = 0) {
        this.data.stats.totalRuns++;
        this.data.stats.totalSmashed += (smashed || 0);
        this.data.stats.totalCopsWrecked += (copsWrecked || 0);
        if (rpEarned > 0) {
            this.data.stats.totalRP = (this.data.stats.totalRP || 0) + Math.floor(rpEarned);
        }
        this.save();
    }
}

export const storage = new StorageManager();
