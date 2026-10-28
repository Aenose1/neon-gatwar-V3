// src/game.js - Master game coordinator, state machine, Gacha system, ranking, and update/render loops
import { CONFIG } from './config.js';
import { storage } from './storage.js';
import { audio } from './audio.js';
import { ranking } from './ranking.js';
import { gachaAnimator } from './gacha-anim.js';
import { Camera } from './camera.js';
import { PlayerCar } from './player.js';
import { GameMap } from './maps.js';
import { PoliceManager } from './police.js';
import { AbilityManager } from './abilities.js';
import { ParticleManager } from './particles.js';
import { RecoveryManager } from './recovery.js';
import { ScoringManager } from './scoring.js';
import { CollisionEngine } from './collisions.js';
import { ControlsManager } from './controls.js';
import { GarageManager } from './garage.js';
import { GachaManager, GACHA_CONFIG } from './gacha.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.state = 'MENU';
        this.lastTime = performance.now();
        this.gameOverTimer = 0;
        this.activeRankTab = 'score';

        // Subsystems
        this.map = new GameMap(storage.getSelectedMap());
        this.player = new PlayerCar(storage.getSelectedCar(), this.map.config.spawnX, this.map.config.spawnY);
        this.camera = new Camera(window.innerWidth, window.innerHeight, this.map.width, this.map.height);
        this.particles = new ParticleManager();
        this.police = new PoliceManager();
        this.abilities = new AbilityManager();
        this.recovery = new RecoveryManager();
        this.scoring = new ScoringManager();
        this.collisions = new CollisionEngine();
        this.controls = new ControlsManager(this.canvas);
        this.garage = new GarageManager(this);
        this.gacha = new GachaManager(this);

        this.initWindow();
        this.initDOM();

        // Start animation loop
        requestAnimationFrame((t) => this.loop(t));
    }

    initWindow() {
        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.canvas.width = window.innerWidth * dpr;
            this.canvas.height = window.innerHeight * dpr;
            this.ctx.resetTransform();
            this.ctx.scale(dpr, dpr);
            this.camera.resize(window.innerWidth, window.innerHeight);
            this.controls.updateMobileLayout();
        };

        window.addEventListener('resize', resize);
        resize();
    }

    initDOM() {
        // UI Screens
        this.mainMenuEl = document.getElementById('main-menu');
        this.mapSelectEl = document.getElementById('map-select-screen');
        this.hudEl = document.getElementById('gameplay-hud');
        this.pauseModalEl = document.getElementById('pause-modal');
        this.gameOverEl = document.getElementById('game-over-screen');
        this.storyModalEl = document.getElementById('story-modal');
        this.gachaScreenEl = document.getElementById('gacha-screen');
        this.gachaRevealModalEl = document.getElementById('gacha-reveal-modal');
        this.rankingModalEl = document.getElementById('ranking-modal');

        // Top Bar Badges
        this.menuRankBadgeEl = document.getElementById('menu-ranking-badge');
        this.menuRankIconEl = document.getElementById('menu-rank-icon');
        this.menuRankNameEl = document.getElementById('menu-rank-name');

        // HUD Elements
        this.hudCashEl = document.getElementById('hud-cash');
        this.hudScoreEl = document.getElementById('hud-score');
        this.hudComboEl = document.getElementById('hud-combo');
        this.hudComboTextEl = document.getElementById('hud-combo-text');
        this.hudHeatStarsEl = document.getElementById('hud-heat-stars');
        this.hudHealthFillEl = document.getElementById('hud-health-fill');
        this.hudHealthPctEl = document.getElementById('hud-health-pct');
        this.hudSpeedEl = document.getElementById('hud-speed');
        this.hudNotificationEl = document.getElementById('hud-notification-banner');

        // Gacha Elements
        this.gachaCashEl = document.getElementById('gacha-cash-display');
        this.gachaFeedbackEl = document.getElementById('gacha-status-feedback');
        this.gachaCardsContainer = document.getElementById('gacha-cards-container');
        this.gachaSummaryText = document.getElementById('gacha-summary-text');

        // Ability Buttons in HUD
        this.btnTank = document.getElementById('btn-ability-tank');
        this.btnOil = document.getElementById('btn-ability-oil');
        this.btnEmp = document.getElementById('btn-ability-emp');

        this.bindEvents();
        this.showMainMenu();
    }

    bindEvents() {
        // Main Menu
        document.getElementById('btn-play')?.addEventListener('click', () => {
            audio.ensureContext();
            this.showMapSelect();
        });

        document.getElementById('btn-ranking')?.addEventListener('click', () => {
            audio.ensureContext();
            this.showRankingModal();
        });

        this.menuRankBadgeEl?.addEventListener('click', () => {
            audio.ensureContext();
            this.showRankingModal();
        });

        document.getElementById('btn-close-ranking')?.addEventListener('click', () => {
            this.rankingModalEl?.classList.add('hidden');
        });

        // Ranking Tabs
        document.querySelectorAll('.rank-tab-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.rank-tab-btn').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeRankTab = btn.dataset.tab;
                this.renderRankingTabContent();
            });
        });

        document.getElementById('btn-gacha')?.addEventListener('click', () => {
            audio.ensureContext();
            this.showGacha();
        });

        document.getElementById('btn-garage-gacha')?.addEventListener('click', () => {
            audio.ensureContext();
            this.showGacha();
        });

        document.getElementById('btn-garage')?.addEventListener('click', () => {
            audio.ensureContext();
            this.showGarage();
        });

        document.getElementById('btn-story')?.addEventListener('click', () => {
            this.storyModalEl.classList.remove('hidden');
        });

        document.getElementById('btn-close-story')?.addEventListener('click', () => {
            this.storyModalEl.classList.add('hidden');
        });

        document.getElementById('btn-sound-toggle')?.addEventListener('click', () => {
            audio.ensureContext();
            audio.toggleSound();
            this.updateSoundIcons();
        });

        // Map Selection (4 distinct maps)
        document.querySelectorAll('.map-card').forEach((card) => {
            card.addEventListener('click', () => {
                const mapIdx = parseInt(card.dataset.mapIndex, 10);
                this.selectMapAndStart(mapIdx);
            });
        });

        document.getElementById('btn-map-back')?.addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('btn-garage-back')?.addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('btn-gacha-back')?.addEventListener('click', () => {
            this.showMainMenu();
        });

        // Gacha Rolling Triggers
        document.getElementById('btn-gacha-roll-1')?.addEventListener('click', () => {
            audio.ensureContext();
            this.handleGachaRoll(1);
        });

        document.getElementById('btn-gacha-roll-10')?.addEventListener('click', () => {
            audio.ensureContext();
            this.handleGachaRoll(10);
        });

        document.getElementById('btn-gacha-again-1')?.addEventListener('click', () => {
            audio.ensureContext();
            this.closeGachaReveal();
            this.handleGachaRoll(1);
        });

        document.getElementById('btn-gacha-again-10')?.addEventListener('click', () => {
            audio.ensureContext();
            this.closeGachaReveal();
            this.handleGachaRoll(10);
        });

        document.getElementById('btn-gacha-reveal-close')?.addEventListener('click', () => {
            this.closeGachaReveal();
        });

        // Pause Modal
        document.getElementById('btn-pause-hud')?.addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('btn-resume')?.addEventListener('click', () => {
            this.togglePause();
        });

        document.getElementById('btn-restart-pause')?.addEventListener('click', () => {
            this.pauseModalEl.classList.add('hidden');
            this.startRun();
        });

        document.getElementById('btn-menu-pause')?.addEventListener('click', () => {
            this.pauseModalEl.classList.add('hidden');
            this.endRunToMenu();
        });

        // Game Over
        document.getElementById('btn-gameover-restart')?.addEventListener('click', () => {
            this.gameOverEl.classList.add('hidden');
            this.startRun();
        });

        document.getElementById('btn-gameover-rank')?.addEventListener('click', () => {
            this.showRankingModal();
        });

        document.getElementById('btn-gameover-garage')?.addEventListener('click', () => {
            this.gameOverEl.classList.add('hidden');
            this.showGarage();
        });

        document.getElementById('btn-gameover-menu')?.addEventListener('click', () => {
            this.gameOverEl.classList.add('hidden');
            this.showMainMenu();
        });

        // Ability Click/Touch Triggers
        const setupAbilityTrigger = (btnEl, abilityName) => {
            if (!btnEl) return;
            btnEl.addEventListener('click', (e) => {
                e.preventDefault();
                this.triggerAbility(abilityName);
            });
            btnEl.addEventListener('touchstart', (e) => {
                e.preventDefault();
                audio.ensureContext();
                this.triggerAbility(abilityName);
            }, { passive: false });
        };

        setupAbilityTrigger(this.btnTank, 'tank');
        setupAbilityTrigger(this.btnOil, 'oil');
        setupAbilityTrigger(this.btnEmp, 'emp');

        // Global audio unlock on first mobile touch
        window.addEventListener('touchstart', () => {
            audio.ensureContext();
        }, { once: true, passive: true });
    }

    updateSoundIcons() {
        const isEnabled = audio.enabled;
        document.querySelectorAll('.sound-state-icon').forEach((el) => {
            el.textContent = isEnabled ? '🔊' : '🔇';
        });
    }

    updateAllCashDisplays() {
        const cash = storage.getCash();
        const formatted = `$${cash.toLocaleString()}`;
        const menuEl = document.getElementById('menu-cash-display');
        const garageEl = document.getElementById('garage-cash-display');
        const gachaEl = document.getElementById('gacha-cash-display');

        if (menuEl) menuEl.textContent = formatted;
        if (garageEl) garageEl.textContent = formatted;
        if (gachaEl) gachaEl.textContent = formatted;

        this.updateRankingUI();
    }

    updateRankingUI() {
        const rp = storage.getTotalRP();
        const tier = ranking.getTierByRP(rp);

        if (this.menuRankIconEl) this.menuRankIconEl.textContent = tier.badge;
        if (this.menuRankNameEl) this.menuRankNameEl.textContent = tier.name.toUpperCase();
        if (this.menuRankBadgeEl) {
            this.menuRankBadgeEl.style.borderColor = tier.color;
            this.menuRankBadgeEl.style.color = tier.color;
        }
    }

    showRankingModal() {
        if (!this.rankingModalEl) return;

        const rp = storage.getTotalRP();
        const tier = ranking.getTierByRP(rp);
        const progress = ranking.getProgress(rp);

        // Update Driver License Card
        const iconEl = document.getElementById('license-badge-icon');
        const nameEl = document.getElementById('license-rank-name');
        const rpEl = document.getElementById('license-rp-val');
        const progressNeededEl = document.getElementById('rank-progress-needed');
        const progressPctEl = document.getElementById('rank-progress-pct');
        const progressBarFillEl = document.getElementById('rank-progress-bar-fill');

        if (iconEl) iconEl.textContent = tier.badge;
        if (nameEl) {
            nameEl.textContent = `TIER ${tier.id}: ${tier.name.toUpperCase()}`;
            nameEl.style.color = tier.color;
        }
        if (rpEl) rpEl.textContent = `${rp.toLocaleString()} RP`;

        if (progress.nextTier) {
            if (progressNeededEl) {
                progressNeededEl.textContent = `${progress.neededRP.toLocaleString()} RP to Tier ${progress.nextTier.id}: ${progress.nextTier.name}`;
            }
            if (progressPctEl) progressPctEl.textContent = `${progress.pct}%`;
            if (progressBarFillEl) progressBarFillEl.style.width = `${progress.pct}%`;
        } else {
            if (progressNeededEl) progressNeededEl.textContent = 'MAX RANK ACHIEVED - SYNDICATE LEGEND';
            if (progressPctEl) progressPctEl.textContent = '100%';
            if (progressBarFillEl) progressBarFillEl.style.width = '100%';
        }

        this.renderRankingTabContent();
        this.rankingModalEl.classList.remove('hidden');
    }

    renderRankingTabContent() {
        const lbContainer = document.getElementById('ranking-leaderboard-container');
        const rewardsContainer = document.getElementById('ranking-rewards-container');
        if (!lbContainer || !rewardsContainer) return;

        if (this.activeRankTab === 'rewards') {
            lbContainer.classList.add('hidden');
            rewardsContainer.classList.remove('hidden');
            this.renderRankRewardsList(rewardsContainer);
        } else {
            rewardsContainer.classList.add('hidden');
            lbContainer.classList.remove('hidden');
            this.renderLeaderboardTable(lbContainer, this.activeRankTab);
        }
    }

    renderLeaderboardTable(container, category) {
        const playerStats = {
            highScore: storage.getHighScore(),
            totalRP: storage.getTotalRP(),
            totalCopsWrecked: storage.data.stats?.totalCopsWrecked || 0,
            totalSmashed: storage.data.stats?.totalSmashed || 0,
            selectedCarName: this.player?.model?.name || 'Active Ride'
        };

        const list = ranking.getLeaderboard(category, playerStats);

        let metricHeader = 'BEST SCORE';
        if (category === 'cops') metricHeader = 'COPS WRECKED';
        else if (category === 'destruction') metricHeader = 'OBJECTS SMASHED';
        else if (category === 'rank') metricHeader = 'REPUTATION (RP)';

        let html = `
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th style="width: 50px;">#</th>
                        <th>OUTLAW DRIVER</th>
                        <th>VEHICLE</th>
                        <th>TIER</th>
                        <th style="text-align: right;">${metricHeader}</th>
                    </tr>
                </thead>
                <tbody>
        `;

        list.forEach((item) => {
            const isPlayer = item.isPlayer;
            const rowClass = isPlayer ? 'lb-row-player' : '';
            const tierObj = ranking.tiers.find((t) => t.id === item.tier) || ranking.tiers[0];

            let metricVal = item.score.toLocaleString();
            if (category === 'cops') metricVal = `${item.cops} COPS`;
            else if (category === 'destruction') metricVal = `${item.smashed} SMASHED`;
            else if (category === 'rank') metricVal = `${item.rp.toLocaleString()} RP`;

            html += `
                <tr class="${rowClass}">
                    <td><strong>${item.rankPosition <= 3 ? ['🥇', '🥈', '🥉'][item.rankPosition - 1] : item.rankPosition}</strong></td>
                    <td>${isPlayer ? '⭐ ' : ''}${item.name}</td>
                    <td style="color: #a0aec0;">${item.car}</td>
                    <td><span class="lb-rank-badge" style="color: ${tierObj.color};">${tierObj.badge} ${tierObj.id}</span></td>
                    <td style="text-align: right; font-weight: 800;">${metricVal}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    renderRankRewardsList(container) {
        const totalRP = storage.getTotalRP();
        let html = '';

        ranking.tiers.forEach((tier) => {
            if (tier.rewardCash <= 0) return;

            const isUnlocked = totalRP >= tier.minRP;
            const isClaimed = storage.isRankRewardClaimed(tier.id);

            html += `
                <div class="rank-reward-card ${isClaimed ? 'rank-reward-claimed' : ''}">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.5rem;">${tier.badge}</span>
                        <div>
                            <div style="font-weight: 800; color: ${tier.color};">Tier ${tier.id}: ${tier.name}</div>
                            <div style="font-size: 0.72rem; color: #a0aec0;">Required: ${tier.minRP.toLocaleString()} RP • Reward: +$${tier.rewardCash.toLocaleString()}</div>
                        </div>
                    </div>
                    <div>
                        ${isClaimed 
                            ? '<span style="font-size: 0.75rem; color: #2ecc71; font-weight: 800;">✓ CLAIMED</span>'
                            : isUnlocked 
                                ? `<button class="btn-arcade btn-primary btn-claim-reward" data-tier="${tier.id}" data-cash="${tier.rewardCash}" style="padding: 4px 12px; font-size: 0.78rem;">CLAIM</button>`
                                : `<span style="font-size: 0.72rem; color: #718093; font-weight: 700;">LOCKED</span>`}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        container.querySelectorAll('.btn-claim-reward').forEach((btn) => {
            btn.addEventListener('click', () => {
                const tierId = btn.dataset.tier;
                const cash = parseInt(btn.dataset.cash, 10);
                if (storage.claimRankReward(tierId, cash)) {
                    audio.playCashChime();
                    this.updateAllCashDisplays();
                    this.renderRankRewardsList(container);
                }
            });
        });
    }

    showMainMenu() {
        this.hideAllScreens();
        this.mainMenuEl.classList.remove('hidden');

        this.updateAllCashDisplays();
        document.getElementById('menu-highscore-display').textContent = storage.getHighScore().toLocaleString();

        this.player.setCarModel(storage.getSelectedCar());
        this.state = 'MENU';
    }

    showMapSelect() {
        this.hideAllScreens();
        this.mapSelectEl.classList.remove('hidden');
        this.updateAllCashDisplays();
    }

    showGarage() {
        this.hideAllScreens();
        this.garage.screenEl.classList.remove('hidden');
        this.garage.initShowroom();
        this.updateAllCashDisplays();
        this.state = 'GARAGE';
    }

    showGacha() {
        this.hideAllScreens();
        this.gachaScreenEl.classList.remove('hidden');
        this.updateAllCashDisplays();
        if (this.gachaFeedbackEl) this.gachaFeedbackEl.textContent = '';
        this.state = 'GACHA';
    }

    handleGachaRoll(count = 1) {
        if (!this.gacha) return;

        let outcome = null;
        if (count === 1) {
            outcome = this.gacha.executeSingleRoll();
        } else {
            outcome = this.gacha.executeMultiRoll();
        }

        if (!outcome.success) {
            if (this.gachaFeedbackEl) {
                if (outcome.reason === 'INSUFFICIENT_FUNDS') {
                    this.gachaFeedbackEl.textContent = `Insufficient funds! Need $${outcome.cost || (count === 1 ? 500 : 4500)}`;
                } else {
                    this.gachaFeedbackEl.textContent = 'Roll currently in progress...';
                }
            }
            return;
        }

        this.updateAllCashDisplays();

        // Identify highest rarity in roll
        let bestRarity = 'common';
        const rarityWeights = { common: 1, rare: 2, epic: 3, legendary: 4 };
        outcome.rolls.forEach((r) => {
            if (rarityWeights[r.rarity] > rarityWeights[bestRarity]) {
                bestRarity = r.rarity;
            }
        });

        // Trigger the cinematic hyperspace warp summon animation!
        gachaAnimator.play(bestRarity, () => {
            this.showGachaReveal(outcome.rolls);
        });
    }

    showGachaReveal(rolls) {
        if (!this.gachaCardsContainer) return;
        this.gachaCardsContainer.innerHTML = '';

        let totalRefund = 0;
        let newCarCount = 0;
        let bestRarity = 'common';
        const rarityWeights = { common: 1, rare: 2, epic: 3, legendary: 4 };

        rolls.forEach((item, index) => {
            if (rarityWeights[item.rarity] > rarityWeights[bestRarity]) {
                bestRarity = item.rarity;
            }

            if (item.isDuplicate) {
                totalRefund += item.compensation;
            } else {
                newCarCount++;
            }

            const card = document.createElement('div');
            card.className = 'gacha-card-item';
            card.style.borderColor = item.color;
            card.style.boxShadow = `0 0 18px ${item.glow}`;
            card.style.animationDelay = `${index * 0.08}s`;

            card.innerHTML = `
                <div class="rarity-badge badge-${item.rarity}">${item.rarity.toUpperCase()}</div>
                <div class="gacha-card-name">${item.car.name}</div>
                <div style="font-size: 0.68rem; color: #a0aec0;">${item.car.category.toUpperCase()}</div>
                <div style="font-size: 0.65rem; color: #00d2ff; font-weight: 700;">SPD: ${item.car.stats?.speed || 70} • HND: ${item.car.stats?.handling || 70}</div>
                ${item.isDuplicate 
                    ? `<div class="gacha-card-comp">DUPE REFUND: +$${item.compensation}</div>` 
                    : `<div style="font-size: 0.72rem; color: #2ecc71; font-weight: 800;">★ NEW UNLOCK!</div>`}
            `;
            this.gachaCardsContainer.appendChild(card);
        });

        audio.playGachaReveal(bestRarity);

        if (this.gachaSummaryText) {
            let summary = '';
            if (newCarCount > 0) summary += `Unlocked ${newCarCount} New Vehicle${newCarCount > 1 ? 's' : ''}! `;
            if (totalRefund > 0) summary += `Duplicate Cash Refund: +$${totalRefund.toLocaleString()}`;
            this.gachaSummaryText.textContent = summary;
        }

        this.gachaRevealModalEl.classList.remove('hidden');
        this.updateAllCashDisplays();
    }

    closeGachaReveal() {
        this.gachaRevealModalEl.classList.add('hidden');
        this.gacha.finishRoll();
        this.updateAllCashDisplays();
    }

    selectMapAndStart(mapIndex) {
        storage.setSelectedMap(mapIndex);
        this.hideAllScreens();
        this.hudEl.classList.remove('hidden');
        this.startRun(mapIndex);
    }

    startRun(mapIndex = null) {
        if (mapIndex !== null) {
            this.map.setMapIndex(mapIndex);
        } else {
            this.map.setMapIndex(storage.getSelectedMap());
        }

        const selectedCarId = storage.getSelectedCar();
        this.player.setCarModel(selectedCarId);
        this.player.reset(this.map.config.spawnX, this.map.config.spawnY, -Math.PI / 2);

        this.camera.x = this.player.x;
        this.camera.y = this.player.y;

        this.particles.reset();
        this.particles.initWeather(this.map.config.weather, 140, this.map.width, this.map.height);
        this.police.reset();
        this.abilities.reset();
        this.recovery.reset();
        this.scoring.reset();

        this.gameOverTimer = 0;

        audio.ensureContext();
        audio.startEngine();

        this.state = 'PLAYING';
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            this.pauseModalEl.classList.remove('hidden');
            audio.stopEngine();
            audio.setSiren(false);
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.pauseModalEl.classList.add('hidden');
            audio.startEngine();
        }
    }

    endRunToMenu() {
        this.state = 'MENU';
        audio.stopEngine();
        audio.setSiren(false);
        this.showMainMenu();
    }

    triggerAbility(id) {
        if (this.state !== 'PLAYING') return;

        const result = this.abilities.triggerAbility(id, this.player, this.police, this.particles);
        if (!result.success && result.reason) {
            this.particles.addFloatingText(result.reason, this.player.x, this.player.y - 25, '#ff4757', 16);
        }
    }

    loop(currentTime) {
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
        this.lastTime = currentTime;

        this.update(dt);
        this.render(dt);

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        if (this.state === 'GARAGE') {
            this.garage.renderTurntable(dt);
            return;
        }

        if (this.state !== 'PLAYING') return;

        // Check Pause Hotkey
        if (this.controls.pauseTriggered) {
            this.controls.pauseTriggered = false;
            this.togglePause();
            return;
        }

        // Check Ability Hotkeys
        if (this.controls.abilityTriggered) {
            this.triggerAbility(this.controls.abilityTriggered);
            this.controls.abilityTriggered = null;
        }

        const isPlaying = (this.state === 'PLAYING');

        // 1. Controls & Player Updates
        this.controls.update(this.player, this.camera);
        this.player.update(this.controls, this.map, this.particles, this.recovery, dt);
        this.camera.update(this.player, dt);

        // 2. Subsystems
        this.police.update(this.player, this.map, this.particles, isPlaying, dt);
        this.abilities.update(this.player, this.police, this.particles, isPlaying, dt);
        this.scoring.update(this.player.speed, dt);
        this.particles.update(dt);

        // 3. Collision Resolution
        this.collisions.handleAll(
            this.player,
            this.map,
            this.police,
            this.abilities,
            this.particles,
            this.recovery,
            this.scoring,
            this.camera
        );

        // 4. Automatic Reverse Recovery System
        const isAttemptingMove = !this.controls.isBraking;
        this.recovery.update(this.player, this.collisions.isCollidingWithSolid, isAttemptingMove, dt);

        // 5. Update HUD
        this.updateHud();

        // 6. Check Vehicle Health Zero / Game Over
        if (this.player.isWrecked) {
            this.gameOverTimer += dt;
            if (this.gameOverTimer === dt) {
                this.particles.spawnExplosion(this.player.x, this.player.y);
                this.camera.shake(20);
                audio.playPoliceWreck();
                audio.stopEngine();
                audio.setSiren(false);
            }

            if (this.gameOverTimer >= 1.6) {
                storage.addCash(this.scoring.runCash);
                const isNewHigh = storage.updateHighScore(this.scoring.score);

                // Calculate Run RP & Check Promotion
                const rpBreakdown = ranking.calculateRunRP(
                    this.scoring.score,
                    this.scoring.smashedCount,
                    this.police.totalWrecked,
                    false
                );
                const prevRP = storage.getTotalRP();
                const nextRP = prevRP + rpBreakdown.totalRP;
                const promo = ranking.checkRankPromotion(prevRP, nextRP);

                storage.recordRunEnd(this.scoring.smashedCount, this.police.totalWrecked, rpBreakdown.totalRP);

                if (promo.promoted && promo.rewardCash > 0) {
                    storage.addCash(promo.rewardCash);
                }

                this.showGameOver({
                    score: this.scoring.score,
                    runCash: this.scoring.runCash,
                    smashedCount: this.scoring.smashedCount,
                    copsWrecked: this.police.totalWrecked,
                    highScore: storage.getHighScore(),
                    isNewHigh,
                    rpEarned: rpBreakdown.totalRP,
                    promotion: promo
                });
            }
        }
    }

    updateHud() {
        if (this.hudCashEl) this.hudCashEl.textContent = `$${this.scoring.runCash.toLocaleString()}`;
        if (this.hudScoreEl) this.hudScoreEl.textContent = Math.floor(this.scoring.score).toLocaleString();

        // Speedometer
        if (this.hudSpeedEl) {
            const mph = Math.floor(Math.abs(this.player.speed) * 0.28);
            this.hudSpeedEl.textContent = `${mph} MPH`;
        }

        // CAR DAMAGE / VEHICLE HEALTH BAR
        const healthPct = this.player.damage.getHealthPercentage();
        const healthStatus = this.player.damage.getHealthStatus();

        if (this.hudHealthFillEl) {
            this.hudHealthFillEl.style.width = `${healthPct}%`;
            this.hudHealthFillEl.style.backgroundColor = healthStatus.color;
        }

        if (this.hudHealthPctEl) {
            this.hudHealthPctEl.textContent = `${Math.round(healthPct)}%`;
            this.hudHealthPctEl.style.color = healthStatus.color;
        }

        // COMBO BADGE
        if (this.hudComboEl && this.hudComboTextEl) {
            if (this.scoring.comboMultiplier > 1) {
                this.hudComboTextEl.textContent = `x${this.scoring.comboMultiplier} COMBO!`;
                this.hudComboEl.classList.remove('hidden');
            } else {
                this.hudComboEl.classList.add('hidden');
            }
        }

        // HEAT STARS
        if (this.hudHeatStarsEl) {
            const heatLevel = this.police.heatLevel;
            const stars = this.hudHeatStarsEl.querySelectorAll('span');
            stars.forEach((star, idx) => {
                if (idx < heatLevel) {
                    star.className = 'star-active';
                    star.textContent = '★';
                } else {
                    star.className = 'star-inactive';
                    star.textContent = '☆';
                }
            });
        }

        // ABILITY BUTTONS
        this.updateAbilityButton(this.btnTank, this.abilities.abilities.tank);
        this.updateAbilityButton(this.btnOil, this.abilities.abilities.oil);
        this.updateAbilityButton(this.btnEmp, this.abilities.abilities.emp);

        // NOTIFICATION BANNER
        if (this.hudNotificationEl) {
            const recoveryMsg = this.recovery.getMessage();
            const policeMsg = this.police.getAnnouncement();
            const waterMsg = this.player.waterHazardMessage;

            const activeMsg = waterMsg || recoveryMsg || policeMsg;
            if (activeMsg) {
                this.hudNotificationEl.textContent = activeMsg;
                this.hudNotificationEl.classList.remove('hidden');
            } else {
                this.hudNotificationEl.classList.add('hidden');
            }
        }

        if (this.player.waterHazardMessage) {
            setTimeout(() => {
                this.player.waterHazardMessage = '';
            }, 1600);
        }
    }

    updateAbilityButton(btnEl, ability) {
        if (!btnEl || !ability) return;

        const cdOverlay = btnEl.querySelector('.cd-overlay');
        const cdText = btnEl.querySelector('.cd-text');

        if (ability.active) {
            btnEl.classList.add('active');
            btnEl.classList.remove('ready');
            if (cdOverlay) cdOverlay.style.height = '0%';
            if (cdText) cdText.textContent = 'ACTIVE';
        } else if (ability.timer > 0) {
            btnEl.classList.remove('active');
            btnEl.classList.remove('ready');
            const pct = (ability.timer / ability.cooldown) * 100;
            if (cdOverlay) cdOverlay.style.height = `${pct}%`;

            const mins = Math.floor(ability.timer / 60);
            const secs = Math.ceil(ability.timer % 60);
            if (cdText) {
                cdText.textContent = mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
            }
        } else {
            btnEl.classList.remove('active');
            btnEl.classList.add('ready');
            if (cdOverlay) cdOverlay.style.height = '0%';
            if (cdText) cdText.textContent = 'READY';
        }
    }

    showGameOver(stats) {
        this.hudEl.classList.add('hidden');
        this.gameOverEl.classList.remove('hidden');

        document.getElementById('go-final-score').textContent = Math.floor(stats.score).toLocaleString();
        document.getElementById('go-run-cash').textContent = `+$${stats.runCash.toLocaleString()}`;
        document.getElementById('go-smashed-count').textContent = stats.smashedCount;
        document.getElementById('go-cops-wrecked').textContent = stats.copsWrecked;
        document.getElementById('go-best-score').textContent = stats.highScore.toLocaleString();

        const badge = document.getElementById('go-new-record-badge');
        if (badge) {
            if (stats.isNewHigh) badge.classList.remove('hidden');
            else badge.classList.add('hidden');
        }

        // Display RP Earned & Rank Promotion
        const rpEl = document.getElementById('go-run-rp');
        if (rpEl) rpEl.textContent = `+${(stats.rpEarned || 0).toLocaleString()} RP`;

        const rankupNoticeEl = document.getElementById('go-rankup-notice');
        if (rankupNoticeEl) {
            if (stats.promotion && stats.promotion.promoted) {
                rankupNoticeEl.textContent = `🎉 PROMOTED TO ${stats.promotion.newTier.name.toUpperCase()}! (+$${stats.promotion.rewardCash.toLocaleString()})`;
                rankupNoticeEl.classList.remove('hidden');
                audio.playRankUp();
            } else {
                rankupNoticeEl.classList.add('hidden');
            }
        }

        audio.playGameOver();
        this.state = 'GAMEOVER';
        this.updateAllCashDisplays();
    }

    hideAllScreens() {
        this.mainMenuEl?.classList.add('hidden');
        this.mapSelectEl?.classList.add('hidden');
        this.garage.screenEl?.classList.add('hidden');
        this.gachaScreenEl?.classList.add('hidden');
        this.gachaRevealModalEl?.classList.add('hidden');
        this.rankingModalEl?.classList.add('hidden');
        this.hudEl?.classList.add('hidden');
        this.pauseModalEl?.classList.add('hidden');
        this.gameOverEl?.classList.add('hidden');
    }

    render(dt) {
        if (this.state !== 'PLAYING' && this.state !== 'PAUSED') {
            this.renderMenuBackground(dt);
            return;
        }

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Camera matrix transform
        this.camera.apply(ctx);

        // 2. Terrain & roads
        this.map.draw(ctx, this.camera);

        // 3. Skid marks
        this.particles.drawSkids(ctx, this.camera);

        // 4. Oil slicks
        this.abilities.draw(ctx, this.camera);

        // 5. Police pursuit cars
        this.police.draw(ctx, this.camera);

        // 6. Player car
        this.player.draw(ctx);

        // 7. Debris, smoke, sparks, weather
        this.particles.drawWorldParticles(ctx, this.camera);

        // 8. Floating text
        this.particles.drawFloatingTexts(ctx, this.camera);

        // 9. Restore matrix
        this.camera.restore(ctx);

        // 10. Ambient lighting
        ctx.save();
        ctx.fillStyle = this.map.config.ambientColor;
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

        // 11. Mobile touch steering control
        this.controls.drawMobileControls(ctx);

        ctx.restore();
    }

    renderMenuBackground(dt) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.camera.x = 2100 + Math.sin(performance.now() * 0.0003) * 350;
        this.camera.y = 2100 + Math.cos(performance.now() * 0.0003) * 350;

        this.camera.apply(ctx);
        this.map.draw(ctx, this.camera);
        this.camera.restore(ctx);

        ctx.save();
        ctx.fillStyle = 'rgba(10, 16, 26, 0.72)';
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.restore();
    }
}
