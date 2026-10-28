// src/ranking.js - Underground Outlaw Driver Ranking, Reputation Points (RP), and Syndicate Leaderboards
import { storage } from './storage.js';

export const RANK_TIERS = [
    {
        id: 'E',
        tierIndex: 0,
        name: 'Street Novice',
        title: 'Rookie Getaway Wheelman',
        minRP: 0,
        maxRP: 999,
        color: '#95a5a6',
        badge: '🔰',
        rewardCash: 0,
        description: 'Fresh on the radar. The county police barely know your name.'
    },
    {
        id: 'D',
        tierIndex: 1,
        name: 'Neon Runner',
        title: 'Highway Speedster',
        minRP: 1000,
        maxRP: 2999,
        color: '#2ecc71',
        badge: '🥉',
        rewardCash: 1500,
        description: 'Known in street circles. Highway patrol has logged your plates.'
    },
    {
        id: 'C',
        tierIndex: 2,
        name: 'Highway Fugitive',
        title: 'County Evader',
        minRP: 3000,
        maxRP: 6999,
        color: '#3498db',
        badge: '🥈',
        rewardCash: 3500,
        description: 'State troopers coordinate pursuit nets. Standard cruisers struggle to catch you.'
    },
    {
        id: 'B',
        tierIndex: 3,
        name: 'Syndicate Wheelman',
        title: 'Syndicate Enforcer',
        minRP: 7000,
        maxRP: 14999,
        color: '#9b59b6',
        badge: '🥇',
        rewardCash: 7500,
        description: 'Feared underground specialist. Black interceptor squads are deployed against you.'
    },
    {
        id: 'A',
        tierIndex: 4,
        name: 'Apex Drifter',
        title: 'County Nemesis',
        minRP: 15000,
        maxRP: 29999,
        color: '#e67e22',
        badge: '💎',
        rewardCash: 15000,
        description: 'Legendary getaway driver. Roads are barricaded upon your first sighting.'
    },
    {
        id: 'S',
        tierIndex: 5,
        name: 'County Nemesis',
        title: 'Syndicate Kingpin',
        minRP: 30000,
        maxRP: 49999,
        color: '#e74c3c',
        badge: '🔥',
        rewardCash: 30000,
        description: 'An unstoppable force. State police chief Vance personally directs your pursuit.'
    },
    {
        id: 'S_PLUS',
        tierIndex: 6,
        name: 'Most Wanted Legend',
        title: 'God of the Asphalt',
        minRP: 50000,
        maxRP: Infinity,
        color: '#f1c40f',
        badge: '👑',
        rewardCash: 60000,
        description: 'Mythical underground legend. Your name is immortalized on all police dispatch boards.'
    }
];

export class RankingManager {
    constructor() {
        this.tiers = RANK_TIERS;
    }

    getTierByRP(rp = 0) {
        const safeRP = Math.max(0, Math.floor(rp));
        for (let i = this.tiers.length - 1; i >= 0; i--) {
            if (safeRP >= this.tiers[i].minRP) {
                return this.tiers[i];
            }
        }
        return this.tiers[0];
    }

    getNextTier(rp = 0) {
        const current = this.getTierByRP(rp);
        if (current.tierIndex < this.tiers.length - 1) {
            return this.tiers[current.tierIndex + 1];
        }
        return null;
    }

    getProgress(rp = 0) {
        const currentTier = this.getTierByRP(rp);
        const nextTier = this.getNextTier(rp);

        if (!nextTier) {
            return {
                currentTier,
                nextTier: null,
                pct: 100,
                currentRP: rp,
                neededRP: 0,
                rangeRP: 1
            };
        }

        const tierSpan = nextTier.minRP - currentTier.minRP;
        const progressInTier = Math.max(0, rp - currentTier.minRP);
        const pct = Math.min(100, Math.max(0, (progressInTier / tierSpan) * 100));

        return {
            currentTier,
            nextTier,
            pct: Math.round(pct),
            currentRP: rp,
            neededRP: Math.max(0, nextTier.minRP - rp),
            rangeRP: tierSpan
        };
    }

    getCurrentTierInfo(rp = null) {
        const total = rp !== null ? rp : storage.getTotalRP();
        const tier = this.getTierByRP(total);
        const progress = this.getProgress(total);
        return {
            tier,
            progress,
            totalRP: total
        };
    }

    addRP(amount = 0) {
        const prevRP = storage.getTotalRP();
        const newRP = storage.addRP(amount);
        const promo = this.checkRankPromotion(prevRP, newRP);
        return {
            ...promo,
            totalRP: newRP
        };
    }

    canClaimTierReward(tierId) {
        const targetTier = this.tiers.find(t => t.id === tierId);
        if (!targetTier || targetTier.rewardCash <= 0) return false;
        const currentTier = this.getTierByRP(storage.getTotalRP());
        if (currentTier.tierIndex < targetTier.tierIndex) return false;
        return !storage.isRankRewardClaimed(tierId);
    }

    claimTierReward(tierId) {
        if (!this.canClaimTierReward(tierId)) {
            return { success: false, reason: 'NOT_ELIGIBLE_OR_CLAIMED' };
        }
        const targetTier = this.tiers.find(t => t.id === tierId);
        const claimed = storage.claimRankReward(tierId);
        if (claimed) {
            storage.addCash(targetTier.rewardCash);
            return {
                success: true,
                reward: targetTier.rewardCash,
                tier: targetTier
            };
        }
        return { success: false, reason: 'FAILED' };
    }

    /**
     * Calculates RP awarded at the conclusion of a getaway run.
     * Supports both positional parameters and options object.
     */
    calculateRunRP(score = 0, smashedCount = 0, copsWrecked = 0, isEscaped = false) {
        if (typeof score === 'object' && score !== null) {
            const stats = score;
            score = stats.score || 0;
            smashedCount = stats.destructiblesSmashed || stats.smashedCount || stats.smashed || 0;
            copsWrecked = stats.copsWrecked || stats.cops || 0;
            isEscaped = !!(stats.escaped || stats.isEscaped);
        }

        const scoreRP = Math.floor(score / 50);
        const smashRP = smashedCount * 6;
        const copsRP = copsWrecked * 60;
        const escapeRP = isEscaped ? 200 : 0;
        const total = Math.max(10, scoreRP + smashRP + copsRP + escapeRP);

        return {
            scoreRP,
            smashRP,
            copsRP,
            escapeRP,
            totalRP: total,
            totalEarned: total,
            breakdown: {
                scoreRP,
                smashRP,
                wreckRP: copsRP,
                copsRP,
                escapeBonus: escapeRP
            }
        };
    }

    /**
     * Checks if moving from prevRP to newRP triggers a rank promotion
     */
    checkRankPromotion(prevRP = 0, newRP = 0) {
        const oldTier = this.getTierByRP(prevRP);
        const newTier = this.getTierByRP(newRP);

        if (newTier.tierIndex > oldTier.tierIndex) {
            return {
                promoted: true,
                oldTier,
                newTier,
                rewardCash: newTier.rewardCash
            };
        }

        return {
            promoted: false,
            oldTier,
            newTier,
            rewardCash: 0
        };
    }

    /**
     * Generates a realistic underground syndicate leaderboard and places the player dynamically
     */
    getLeaderboard(category = 'mostWanted', playerStats = null) {
        if (!playerStats) {
            playerStats = {
                highScore: storage.getHighScore(),
                totalCopsWrecked: storage.data.stats?.copsWrecked || 0,
                totalSmashed: storage.data.stats?.destructiblesSmashed || 0,
                totalRP: storage.getTotalRP(),
                selectedCarName: storage.getSelectedCar()
            };
        }

        const rivals = [
            { name: 'Valkyrie_99', car: 'Valkyrie Hypercar', score: 94500, cops: 68, smashed: 420, rp: 58200, tier: 'S_PLUS' },
            { name: 'Ghost_Shift', car: 'Zenith Hypercar', score: 82000, cops: 54, smashed: 360, rp: 49500, tier: 'S' },
            { name: 'Apex_Vance', car: 'Hyperion GT', score: 68400, cops: 42, smashed: 310, rp: 39800, tier: 'S' },
            { name: 'CyberPhantom', car: 'Specter GT', score: 54200, cops: 35, smashed: 275, rp: 28400, tier: 'A' },
            { name: 'Redline_King', car: 'Inferno Supercar', score: 41800, cops: 28, smashed: 230, rp: 19600, tier: 'A' },
            { name: 'Chrome_Rider', car: 'Velocity Prototype', score: 32600, cops: 22, smashed: 195, rp: 14200, tier: 'B' },
            { name: 'Turbo_Fox', car: 'Vortex Tuner', score: 24500, cops: 17, smashed: 160, rp: 9800, tier: 'B' },
            { name: 'Shadow_Drift', car: 'Phantom Muscle', score: 17800, cops: 12, smashed: 135, rp: 6200, tier: 'C' },
            { name: 'Outlaw_Byte', car: 'Cruiser SUV', score: 11200, cops: 8, smashed: 95, rp: 3800, tier: 'C' },
            { name: 'Neon_Rookie', car: 'Neon Compact', score: 5400, cops: 4, smashed: 60, rp: 1500, tier: 'D' }
        ];

        const playerRP = playerStats.totalRP || 0;
        const playerTier = this.getTierByRP(playerRP);

        const playerEntry = {
            name: 'YOU (Wheelman)',
            car: playerStats.selectedCarName || 'Active Ride',
            score: playerStats.highScore || 0,
            cops: playerStats.totalCopsWrecked || 0,
            smashed: playerStats.totalSmashed || 0,
            rp: playerRP,
            tier: playerTier.id,
            isPlayer: true
        };

        const list = [...rivals, playerEntry];

        if (category === 'cops' || category === 'copsWrecked') {
            list.sort((a, b) => b.cops - a.cops);
        } else if (category === 'destruction' || category === 'demolition') {
            list.sort((a, b) => b.smashed - a.smashed);
        } else if (category === 'rank' || category === 'rewards') {
            list.sort((a, b) => b.rp - a.rp);
        } else {
            // default: mostWanted / score
            list.sort((a, b) => b.score - a.score);
        }

        const mapped = list.map((item, index) => ({
            ...item,
            rankPosition: index + 1
        }));

        const playerIdx = mapped.findIndex(item => item.isPlayer);
        if (playerIdx < 10) {
            return mapped.slice(0, 10);
        } else {
            // Keep 10 entries total: top 9 rivals + player entry
            return [...mapped.slice(0, 9), mapped[playerIdx]];
        }
    }
}

export const ranking = new RankingManager();
