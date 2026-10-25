// src/maps.js - Three distinct maps: Green Suburbs, River District, Neon Industrial Zone
// Features water & bridge collision, zero houses in roads, tiered destructibles (>= 57% destructibility)
import { MAP_CONFIGS } from './config.js';

export class GameMap {
    constructor(mapIndex = 0) {
        this.width = 4200;
        this.height = 4200;
        this.cellSize = 250;
        this.cols = Math.ceil(this.width / this.cellSize);
        this.rows = Math.ceil(this.height / this.cellSize);

        this.setMapIndex(mapIndex);
    }

    setMapIndex(index) {
        this.index = (index >= 0 && index < MAP_CONFIGS.length) ? index : 0;
        this.config = MAP_CONFIGS[this.index] || MAP_CONFIGS[0];
        this.id = this.config.id;
        this.name = this.config.name;
        this.theme = this.config.theme;
        this.surfaceTraction = this.config.surfaceTraction;

        this.generateRoads();
        this.generateWaterAndBridges();
        this.generateBuildings();
        this.generatePropsAndDestructibles();
        this.buildSpatialGrid();
    }

    generateRoads() {
        this.roads = [];

        // Main North-South Central Highway
        this.addRoad(2100, 200, 2100, 4000, 160);

        // East-West Major Crossway
        this.addRoad(300, 2100, 3900, 2100, 160);

        // North & South Outer Loops
        this.addRoad(700, 700, 3500, 700, 140);
        this.addRoad(700, 3400, 3500, 3400, 140);

        // West & East Boundary Avenues
        this.addRoad(700, 700, 700, 3400, 140);
        this.addRoad(3500, 700, 3500, 3400, 140);

        // Diagonal connector bypasses (creates high-speed drift curves)
        this.addRoad(700, 2100, 1400, 1400, 120);
        this.addRoad(1400, 1400, 2100, 1400, 120);
        this.addRoad(2100, 1400, 2800, 1400, 120);
        this.addRoad(2800, 1400, 3500, 2100, 120);

        this.addRoad(700, 2100, 1400, 2800, 120);
        this.addRoad(1400, 2800, 2100, 2800, 120);
        this.addRoad(2100, 2800, 2800, 2800, 120);
        this.addRoad(2800, 2800, 3500, 2100, 120);
    }

    addRoad(x1, y1, x2, y2, width = 140) {
        this.roads.push({
            x1, y1, x2, y2,
            width,
            halfW: width / 2,
            length: Math.hypot(x2 - x1, y2 - y1),
            angle: Math.atan2(y2 - y1, x2 - x1)
        });
    }

    generateWaterAndBridges() {
        this.waterBodies = [];
        this.bridges = [];

        if (this.theme === 'river') {
            // River District: Broad winding river running across the map
            this.waterBodies.push({
                type: 'river',
                width: 140,
                halfW: 70,
                segments: [
                    { x1: 200, y1: 1750, x2: 1100, y2: 1780 },
                    { x1: 1100, y1: 1780, x2: 2100, y2: 1800 },
                    { x1: 2100, y1: 1800, x2: 3100, y2: 1770 },
                    { x1: 3100, y1: 1770, x2: 4000, y2: 1740 }
                ]
            });

            // 3 Bridges crossing the River District:
            // Bridge 1: West Avenue Bridge at (700, 1765)
            this.bridges.push({
                id: 'bridge_west',
                x: 700,
                y: 1765,
                w: 160,
                h: 180,
                halfW: 80,
                halfH: 90,
                type: 'stone'
            });

            // Bridge 2: Central Highway Bridge at (2100, 1800)
            this.bridges.push({
                id: 'bridge_central',
                x: 2100,
                y: 1800,
                w: 180,
                h: 190,
                halfW: 90,
                halfH: 95,
                type: 'suspension'
            });

            // Bridge 3: East Avenue Bridge at (3500, 1755)
            this.bridges.push({
                id: 'bridge_east',
                x: 3500,
                y: 1755,
                w: 160,
                h: 180,
                halfW: 80,
                halfH: 90,
                type: 'stone'
            });
        } else if (this.theme === 'suburbs') {
            // Green Suburbs: Scenic creek with wooden bridges in park sector
            this.waterBodies.push({
                type: 'creek',
                width: 100,
                halfW: 50,
                segments: [
                    { x1: 200, y1: 1750, x2: 1200, y2: 1780 },
                    { x1: 1200, y1: 1780, x2: 2100, y2: 1800 },
                    { x1: 2100, y1: 1800, x2: 3200, y2: 1760 },
                    { x1: 3200, y1: 1760, x2: 4000, y2: 1720 }
                ]
            });

            this.bridges.push({
                id: 'bridge_suburbs_main',
                x: 2100,
                y: 1800,
                w: 180,
                h: 150,
                halfW: 90,
                halfH: 75,
                type: 'wooden'
            });

            this.bridges.push({
                id: 'bridge_suburbs_west',
                x: 700,
                y: 1765,
                w: 160,
                h: 150,
                halfW: 80,
                halfH: 75,
                type: 'wooden'
            });

            this.bridges.push({
                id: 'bridge_suburbs_east',
                x: 3500,
                y: 1750,
                w: 160,
                h: 150,
                halfW: 80,
                halfH: 75,
                type: 'wooden'
            });
        } else if (this.theme === 'industrial') {
            // Neon Industrial: Chemical canal with heavy steel grid bridges
            this.waterBodies.push({
                type: 'canal',
                width: 110,
                halfW: 55,
                segments: [
                    { x1: 200, y1: 1750, x2: 1300, y2: 1770 },
                    { x1: 1300, y1: 1770, x2: 2100, y2: 1800 },
                    { x1: 2100, y1: 1800, x2: 2900, y2: 1780 },
                    { x1: 2900, y1: 1780, x2: 4000, y2: 1730 }
                ]
            });

            this.bridges.push({
                id: 'bridge_ind_main',
                x: 2100,
                y: 1800,
                w: 180,
                h: 160,
                halfW: 90,
                halfH: 80,
                type: 'steel'
            });

            this.bridges.push({
                id: 'bridge_ind_west',
                x: 700,
                y: 1760,
                w: 160,
                h: 160,
                halfW: 80,
                halfH: 80,
                type: 'steel'
            });

            this.bridges.push({
                id: 'bridge_ind_east',
                x: 3500,
                y: 1740,
                w: 160,
                h: 160,
                halfW: 80,
                halfH: 80,
                type: 'steel'
            });
        }
    }

    /**
     * Checks if a point is on a solid drivable bridge
     */
    isOnBridge(x, y, margin = 0) {
        for (let i = 0; i < this.bridges.length; i++) {
            const b = this.bridges[i];
            if (x >= b.x - b.halfW - margin &&
                x <= b.x + b.halfW + margin &&
                y >= b.y - b.halfH - margin &&
                y <= b.y + b.halfH + margin) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if a point is in hazardous deep water (excluding bridges)
     */
    isInWater(x, y) {
        // Bridges are safe drivable crossings
        if (this.isOnBridge(x, y)) {
            return false;
        }

        for (let b = 0; b < this.waterBodies.length; b++) {
            const body = this.waterBodies[b];
            for (let s = 0; s < body.segments.length; s++) {
                const seg = body.segments[s];
                const dist = this.distToSegment(x, y, seg.x1, seg.y1, seg.x2, seg.y2);
                if (dist <= body.halfW) {
                    return true;
                }
            }
        }
        return false;
    }

    isOnRoad(x, y, margin = 0) {
        for (let i = 0; i < this.roads.length; i++) {
            const r = this.roads[i];
            const dist = this.distToSegment(x, y, r.x1, r.y1, r.x2, r.y2);
            if (dist <= r.halfW + margin) return true;
        }
        return false;
    }

    /**
     * Strict clearance check: ensures no building or solid obstacle touches any road lane or shoulder
     */
    isClearOfRoads(x, y, requiredClearance = 80) {
        for (let i = 0; i < this.roads.length; i++) {
            const r = this.roads[i];
            const dist = this.distToSegment(x, y, r.x1, r.y1, r.x2, r.y2);
            if (dist < r.halfW + requiredClearance) {
                return false;
            }
        }
        return true;
    }

    distToSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return Math.hypot(px - x1, py - y1);

        let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;
        return Math.hypot(px - projX, py - projY);
    }

    generateBuildings() {
        this.buildings = [];

        // Carefully selected plots completely offset from all road lanes and intersections
        // Each spot is explicitly verified to keep driving routes 100% unobstructed.
        const candidateSpots = [
            // North-West Quadrant
            { x: 1200, y: 1050, w: 150, h: 120, type: 'house' },
            { x: 1600, y: 1050, w: 140, h: 110, type: 'house' },
            { x: 1050, y: 450,  w: 160, h: 110, type: 'house' },
            { x: 1550, y: 450,  w: 150, h: 110, type: 'house' },

            // North-East Quadrant
            { x: 2600, y: 1050, w: 140, h: 110, type: 'house' },
            { x: 3000, y: 1050, w: 150, h: 120, type: 'house' },
            { x: 2650, y: 450,  w: 150, h: 110, type: 'house' },
            { x: 3150, y: 450,  w: 160, h: 110, type: 'house' },

            // South-West Quadrant
            { x: 1200, y: 3100, w: 150, h: 120, type: 'house' },
            { x: 1600, y: 3100, w: 140, h: 110, type: 'house' },
            { x: 1050, y: 3750, w: 160, h: 110, type: 'house' },
            { x: 1550, y: 3750, w: 150, h: 110, type: 'house' },

            // South-East Quadrant
            { x: 2600, y: 3100, w: 140, h: 110, type: 'house' },
            { x: 3000, y: 3100, w: 150, h: 120, type: 'house' },
            { x: 2650, y: 3750, w: 150, h: 110, type: 'house' },
            { x: 3150, y: 3750, w: 160, h: 110, type: 'house' },

            // Inner Core Buffer Plots (Safe clearance from diagonals)
            { x: 1750, y: 1750, w: 120, h: 100, type: 'office' },
            { x: 2450, y: 1750, w: 120, h: 100, type: 'office' },
            { x: 1750, y: 2450, w: 120, h: 100, type: 'office' },
            { x: 2450, y: 2450, w: 120, h: 100, type: 'office' }
        ];

        let bldId = 0;
        for (const spot of candidateSpots) {
            const halfW = spot.w / 2;
            const halfH = spot.h / 2;
            const requiredClearance = Math.max(halfW, halfH) + 30;

            // Only add if guaranteed 100% off-road
            if (this.isClearOfRoads(spot.x, spot.y, requiredClearance)) {
                let themeType = spot.type;
                if (this.theme === 'industrial') {
                    themeType = (bldId % 2 === 0) ? 'warehouse' : 'factory';
                } else if (this.theme === 'river') {
                    themeType = (bldId % 2 === 0) ? 'dockhouse' : 'boathouse';
                } else {
                    themeType = (bldId % 3 === 0) ? 'suburban_villa' : 'suburban_house';
                }

                this.buildings.push({
                    id: `bld_${bldId++}`,
                    x: spot.x,
                    y: spot.y,
                    w: spot.w,
                    h: spot.h,
                    halfW,
                    halfH,
                    type: themeType
                });
            }
        }
    }

    generatePropsAndDestructibles() {
        this.destructibles = [];
        this.solidProps = []; // Indestructible solid props (counted for >= 57% ratio)
        this.trees = [];

        let destId = 0;
        let solidId = 0;

        /**
         * Add a destructible object with tiered breaking requirements and balanced coin rewards:
         * Tier 1 (Light): reqSpeed: 30, cash: 8 (5-10), score: 80
         * Tier 2 (Medium): reqSpeed: 130, cash: 16 (10-20), score: 180
         * Tier 3 (Heavy): reqSpeed: 230, cash: 28 (20-35), score: 320
         */
        const addDestructible = (type, x, y, tier = 'medium') => {
            if (!this.isClearOfRoads(x, y, 16)) return;
            if (this.isInWater(x, y)) return;

            let w = 24, h = 24, radius = 16;
            let reqSpeed = 130;
            let cash = 15;
            let score = 150;
            let hp = 20;

            if (tier === 'light') {
                reqSpeed = 30;
                cash = 8;
                score = 80;
                hp = 10;
                if (type === 'bush') { w = 22; h = 22; radius = 14; }
                else if (type === 'trashcan') { w = 18; h = 18; radius = 12; }
                else if (type === 'flowerpot') { w = 16; h = 16; radius = 10; }
                else if (type === 'sign') { w = 26; h = 12; radius = 16; }
                else if (type === 'crate') { w = 22; h = 22; radius = 14; }
            } else if (tier === 'medium') {
                reqSpeed = 130;
                cash = 16;
                score = 180;
                hp = 25;
                if (type === 'fence') { w = 44; h = 12; radius = 22; }
                else if (type === 'barrel') { w = 24; h = 24; radius = 16; }
                else if (type === 'streetlight') { w = 16; h = 16; radius = 14; }
                else if (type === 'hydrant') { w = 16; h = 16; radius = 12; }
                else if (type === 'stall') { w = 42; h = 28; radius = 24; }
                else if (type === 'haybale') { w = 28; h = 28; radius = 18; }
            } else { // heavy
                reqSpeed = 230;
                cash = 28;
                score = 320;
                hp = 60;
                if (type === 'barrier') { w = 48; h = 20; radius = 24; }
                else if (type === 'container_small') { w = 46; h = 28; radius = 26; }
                else if (type === 'shed_wood') { w = 48; h = 36; radius = 28; }
                else if (type === 'oil_tank') { w = 36; h = 36; radius = 22; }
            }

            this.destructibles.push({
                id: `dest_${destId++}`,
                type,
                tier,
                x, y,
                w, h,
                radius,
                hp,
                maxHp: hp,
                reqSpeed,
                cashReward: cash,
                scoreReward: score,
                destroyed: false,
                destroyTime: 0
            });
        };

        const addSolidProp = (type, x, y) => {
            if (!this.isClearOfRoads(x, y, 20)) return;
            if (this.isInWater(x, y)) return;

            let w = 24, h = 24, radius = 16;
            if (type === 'bollard') { w = 16; h = 16; radius = 12; }
            else if (type === 'transformer') { w = 32; h = 32; radius = 20; }
            else if (type === 'pylon') { w = 36; h = 36; radius = 22; }
            else if (type === 'monument') { w = 40; h = 40; radius = 24; }

            this.solidProps.push({
                id: `solid_${solidId++}`,
                type,
                x, y,
                w, h,
                radius
            });
        };

        // 1. Roadside Fences, Streetlights, and Barriers
        for (let i = 0; i < this.roads.length; i++) {
            const r = this.roads[i];
            const cos = Math.cos(r.angle);
            const sin = Math.sin(r.angle);
            const normalX = -sin;
            const normalY = cos;
            const offset = r.halfW + 28;

            const step = 90;
            for (let dist = 90; dist < r.length - 90; dist += step) {
                const px = r.x1 + cos * dist;
                const py = r.y1 + sin * dist;

                // Alternate between destructible and solid props targeting >= 60% destructibility
                if (this.theme === 'suburbs') {
                    addDestructible('fence', px + normalX * offset, py + normalY * offset, 'medium');
                    addDestructible('bush', px - normalX * offset, py - normalY * offset, 'light');
                    if (dist % (step * 2) === 0) {
                        addDestructible('streetlight', px + normalX * (offset + 12), py + normalY * (offset + 12), 'medium');
                        addSolidProp('transformer', px - normalX * (offset + 16), py - normalY * (offset + 16));
                    }
                } else if (this.theme === 'river') {
                    addDestructible('fence', px + normalX * offset, py + normalY * offset, 'medium');
                    addDestructible('crate', px - normalX * offset, py - normalY * offset, 'light');
                    if (dist % (step * 2) === 0) {
                        addDestructible('barrel', px + normalX * (offset + 14), py + normalY * (offset + 14), 'medium');
                        addSolidProp('bollard', px - normalX * (offset + 12), py - normalY * (offset + 12));
                    }
                } else { // industrial
                    addDestructible('barrier', px + normalX * offset, py + normalY * offset, 'heavy');
                    addDestructible('barrel', px - normalX * offset, py - normalY * offset, 'medium');
                    if (dist % (step * 2) === 0) {
                        addDestructible('container_small', px + normalX * (offset + 18), py + normalY * (offset + 18), 'heavy');
                        addSolidProp('pylon', px - normalX * (offset + 18), py - normalY * (offset + 18));
                    }
                }
            }
        }

        // 2. Intersection Signs & Hydrants
        const intersections = [
            { x: 2100, y: 700 }, { x: 2100, y: 3400 },
            { x: 700, y: 2100 }, { x: 3500, y: 2100 },
            { x: 1400, y: 1400 }, { x: 2800, y: 1400 },
            { x: 1400, y: 2800 }, { x: 2800, y: 2800 },
            { x: 2100, y: 1400 }, { x: 2100, y: 2800 },
            { x: 1400, y: 2100 }, { x: 2800, y: 2100 }
        ];

        for (const pt of intersections) {
            addDestructible('sign', pt.x + 95, pt.y + 95, 'light');
            addDestructible('sign', pt.x - 95, pt.y - 95, 'light');
            if (this.theme === 'suburbs') {
                addDestructible('hydrant', pt.x + 95, pt.y - 95, 'medium');
                addDestructible('trashcan', pt.x - 95, pt.y + 95, 'light');
            } else if (this.theme === 'river') {
                addDestructible('barrel', pt.x + 95, pt.y - 95, 'medium');
                addSolidProp('bollard', pt.x - 95, pt.y + 95);
            } else {
                addDestructible('barrier', pt.x + 95, pt.y - 95, 'heavy');
                addSolidProp('transformer', pt.x - 95, pt.y + 95);
            }
        }

        // 3. Cluster Props Around Buildings (Yard Crates, Stalls, Drums, Pylons)
        for (const b of this.buildings) {
            addDestructible('crate', b.x - b.halfW - 28, b.y, 'light');
            addDestructible('crate', b.x + b.halfW + 28, b.y, 'light');

            if (this.theme === 'suburbs') {
                addDestructible('bush', b.x, b.y - b.halfH - 24, 'light');
                addDestructible('flowerpot', b.x, b.y + b.halfH + 24, 'light');
                addSolidProp('monument', b.x - b.halfW - 40, b.y - b.halfH - 40);
            } else if (this.theme === 'river') {
                addDestructible('stall', b.x, b.y - b.halfH - 32, 'medium');
                addDestructible('barrel', b.x, b.y + b.halfH + 28, 'medium');
                addSolidProp('bollard', b.x + b.halfW + 35, b.y + b.halfH + 35);
            } else {
                addDestructible('oil_tank', b.x, b.y - b.halfH - 32, 'heavy');
                addDestructible('barrel', b.x, b.y + b.halfH + 28, 'medium');
                addSolidProp('transformer', b.x + b.halfW + 38, b.y - b.halfH - 38);
            }
        }

        // 4. Scenery Trees (Exclusively in off-road, dry zones)
        const treeCount = 240;
        for (let i = 0; i < treeCount; i++) {
            const tx = Math.random() * (this.width - 240) + 120;
            const ty = Math.random() * (this.height - 240) + 120;

            if (this.isClearOfRoads(tx, ty, 30) && !this.isInWater(tx, ty)) {
                this.trees.push({
                    x: tx,
                    y: ty,
                    size: Math.random() * 22 + 30,
                    type: this.theme
                });
            }
        }
    }

    /**
     * Percentage of eligible objects that are destructible
     */
    getDestructibleRatio() {
        const total = this.destructibles.length + this.solidProps.length;
        if (total === 0) return 1.0;
        return this.destructibles.length / total;
    }

    buildSpatialGrid() {
        this.grid = new Array(this.cols * this.rows).fill(null).map(() => []);

        for (let i = 0; i < this.destructibles.length; i++) {
            const d = this.destructibles[i];
            const col = Math.floor(d.x / this.cellSize);
            const row = Math.floor(d.y / this.cellSize);
            if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
                const cellIndex = row * this.cols + col;
                this.grid[cellIndex].push(d);
            }
        }
    }

    getNearbyDestructibles(x, y, radius = 160) {
        const minCol = Math.max(0, Math.floor((x - radius) / this.cellSize));
        const maxCol = Math.min(this.cols - 1, Math.floor((x + radius) / this.cellSize));
        const minRow = Math.max(0, Math.floor((y - radius) / this.cellSize));
        const maxRow = Math.min(this.rows - 1, Math.floor((y + radius) / this.cellSize));

        const nearby = [];
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                const cell = this.grid[r * this.cols + c];
                if (cell) {
                    for (let i = 0; i < cell.length; i++) {
                        nearby.push(cell[i]);
                    }
                }
            }
        }
        return nearby;
    }

    /**
     * Find nearest safe road point for vehicle recovery when submerged
     */
    getNearestRoadPoint(x, y) {
        let nearestDist = Infinity;
        let nearestX = 2100;
        let nearestY = 3400;

        for (let i = 0; i < this.roads.length; i++) {
            const r = this.roads[i];
            const dx = r.x2 - r.x1;
            const dy = r.y2 - r.y1;
            const lenSq = dx * dx + dy * dy;
            let t = ((x - r.x1) * dx + (y - r.y1) * dy) / lenSq;
            t = Math.max(0.1, Math.min(0.9, t));
            const px = r.x1 + t * dx;
            const py = r.y1 + t * dy;

            // Make sure the candidate recovery point is not submerged
            if (!this.isInWater(px, py)) {
                const d = Math.hypot(x - px, y - py);
                if (d < nearestDist) {
                    nearestDist = d;
                    nearestX = px;
                    nearestY = py;
                }
            }
        }

        return { x: nearestX, y: nearestY };
    }

    draw(ctx, camera) {
        // 1. Base Ground
        ctx.fillStyle = this.config.groundColor;
        ctx.fillRect(0, 0, this.width, this.height);

        // Ground Accents
        this.drawGroundDetails(ctx, camera);

        // 2. Water Bodies (Rivers, Creeks, Canals)
        this.drawWater(ctx, camera);

        // 3. Roads
        this.drawRoads(ctx, camera);

        // 4. Bridges
        this.drawBridges(ctx, camera);

        // 5. Buildings
        this.drawBuildings(ctx, camera);

        // 6. Solid Props
        this.drawSolidProps(ctx, camera);

        // 7. Destructibles
        this.drawDestructibles(ctx, camera);

        // 8. Environmental Trees
        this.drawTrees(ctx, camera);
    }

    drawGroundDetails(ctx, camera) {
        ctx.save();
        ctx.fillStyle = this.config.groundAccent;

        const step = 280;
        for (let x = 120; x < this.width; x += step) {
            for (let y = 120; y < this.height; y += step) {
                if (!camera.isVisible(x, y, 120)) continue;
                ctx.beginPath();
                if (this.theme === 'industrial') {
                    ctx.rect(x - 25, y - 25, 50, 50);
                } else {
                    ctx.arc(x, y, 42, 0, Math.PI * 2);
                }
                ctx.fill();
            }
        }
        ctx.restore();
    }

    drawWater(ctx, camera) {
        ctx.save();
        for (const body of this.waterBodies) {
            let waterColor = '#3a88c2';
            let foamColor = '#7bc6ff';
            if (this.theme === 'suburbs') {
                waterColor = '#4ba3e3';
                foamColor = '#b3e5fc';
            } else if (this.theme === 'industrial') {
                waterColor = '#16485b';
                foamColor = '#00f0ff';
            }

            for (const seg of body.segments) {
                const midX = (seg.x1 + seg.x2) / 2;
                const midY = (seg.y1 + seg.y2) / 2;
                if (!camera.isVisible(midX, midY, 600)) continue;

                // Riverbed bank border
                ctx.strokeStyle = this.theme === 'industrial' ? '#0b2029' : '#33691e';
                ctx.lineWidth = body.width + 24;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
                ctx.stroke();

                // Main water surface
                ctx.strokeStyle = waterColor;
                ctx.lineWidth = body.width;
                ctx.stroke();

                // Surface flow ripples / foam lines
                ctx.strokeStyle = foamColor;
                ctx.lineWidth = 4;
                ctx.setLineDash([18, 28]);
                ctx.beginPath();
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
        ctx.restore();
    }

    drawRoads(ctx, camera) {
        ctx.save();

        for (let i = 0; i < this.roads.length; i++) {
            const r = this.roads[i];
            const midX = (r.x1 + r.x2) / 2;
            const midY = (r.y1 + r.y2) / 2;
            if (!camera.isVisible(midX, midY, r.length / 2 + 100)) continue;

            // Border shoulder
            ctx.strokeStyle = this.config.roadBorderColor;
            ctx.lineWidth = r.width + 14;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(r.x1, r.y1);
            ctx.lineTo(r.x2, r.y2);
            ctx.stroke();

            // Main asphalt
            ctx.strokeStyle = this.config.roadColor;
            ctx.lineWidth = r.width;
            ctx.stroke();

            // Center lane markings
            ctx.strokeStyle = this.config.roadLineColor;
            ctx.lineWidth = 4;
            ctx.setLineDash([25, 30]);
            ctx.beginPath();
            ctx.moveTo(r.x1, r.y1);
            ctx.lineTo(r.x2, r.y2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();
    }

    drawBridges(ctx, camera) {
        ctx.save();
        for (const b of this.bridges) {
            if (!camera.isVisible(b.x, b.y, 160)) continue;

            if (b.type === 'wooden') {
                ctx.fillStyle = '#6d4c41';
                ctx.fillRect(b.x - b.halfW, b.y - b.halfH, b.w, b.h);

                ctx.fillStyle = '#4e342e';
                for (let y = b.y - b.halfH + 8; y <= b.y + b.halfH - 8; y += 16) {
                    ctx.fillRect(b.x - b.halfW, y, b.w, 4);
                }

                ctx.fillStyle = '#8d6e63';
                ctx.fillRect(b.x - b.halfW, b.y - b.halfH, 12, b.h);
                ctx.fillRect(b.x + b.halfW - 12, b.y - b.halfH, 12, b.h);
            } else if (b.type === 'steel') {
                ctx.fillStyle = '#2d3436';
                ctx.fillRect(b.x - b.halfW, b.y - b.halfH, b.w, b.h);

                ctx.strokeStyle = '#00d2ff';
                ctx.lineWidth = 3;
                ctx.strokeRect(b.x - b.halfW, b.y - b.halfH, b.w, b.h);

                ctx.strokeStyle = '#ff007f';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(b.x - b.halfW, b.y - b.halfH);
                ctx.lineTo(b.x + b.halfW, b.y + b.halfH);
                ctx.moveTo(b.x + b.halfW, b.y - b.halfH);
                ctx.lineTo(b.x - b.halfW, b.y + b.halfH);
                ctx.stroke();
            } else { // stone / suspension
                ctx.fillStyle = '#57606f';
                ctx.fillRect(b.x - b.halfW, b.y - b.halfH, b.w, b.h);

                ctx.fillStyle = '#2f3542';
                ctx.fillRect(b.x - b.halfW, b.y - b.halfH, 14, b.h);
                ctx.fillRect(b.x + b.halfW - 14, b.y - b.halfH, 14, b.h);

                ctx.strokeStyle = '#eccc68';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(b.x, b.y - b.halfH);
                ctx.lineTo(b.x, b.y + b.halfH);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    drawBuildings(ctx, camera) {
        ctx.save();
        for (const b of this.buildings) {
            if (!camera.isVisible(b.x, b.y, Math.max(b.w, b.h) + 60)) continue;

            // 2.5D building shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.fillRect(b.x - b.halfW + 12, b.y - b.halfH + 14, b.w, b.h);

            // Wall base
            let wallColor = '#dcdde1';
            let roofColor = '#e84118';

            if (this.theme === 'industrial') {
                wallColor = '#2f3640';
                roofColor = '#353b48';
            } else if (this.theme === 'river') {
                wallColor = '#718093';
                roofColor = '#273c75';
            }

            ctx.fillStyle = wallColor;
            ctx.fillRect(b.x - b.halfW, b.y - b.halfH, b.w, b.h);

            // Roof with bevel
            ctx.fillStyle = roofColor;
            ctx.fillRect(b.x - b.halfW + 8, b.y - b.halfH + 8, b.w - 16, b.h - 16);

            // Neon roof highlight / signage
            if (this.theme === 'industrial') {
                ctx.strokeStyle = '#00d2ff';
                ctx.lineWidth = 2;
                ctx.strokeRect(b.x - b.halfW + 8, b.y - b.halfH + 8, b.w - 16, b.h - 16);
            }
        }
        ctx.restore();
    }

    drawSolidProps(ctx, camera) {
        ctx.save();
        for (const p of this.solidProps) {
            if (!camera.isVisible(p.x, p.y, p.radius + 40)) continue;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(p.x + 4, p.y + 4, p.radius, 0, Math.PI * 2);
            ctx.fill();

            if (p.type === 'bollard') {
                ctx.fillStyle = '#2f3542';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ff4757';
                ctx.fillRect(p.x - 4, p.y - 4, 8, 8);
            } else if (p.type === 'transformer') {
                ctx.fillStyle = '#353b48';
                ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
                ctx.strokeStyle = '#f1c40f';
                ctx.lineWidth = 2;
                ctx.strokeRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
            } else if (p.type === 'pylon') {
                ctx.fillStyle = '#718093';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#e74c3c';
                ctx.lineWidth = 3;
                ctx.stroke();
            } else {
                ctx.fillStyle = '#747d8c';
                ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
            }
        }
        ctx.restore();
    }

    drawDestructibles(ctx, camera) {
        ctx.save();
        for (const d of this.destructibles) {
            if (d.destroyed) continue;
            if (!camera.isVisible(d.x, d.y, d.radius + 40)) continue;

            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.beginPath();
            ctx.ellipse(d.x + 3, d.y + 3, d.radius, d.radius * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();

            if (d.type === 'fence') {
                ctx.fillStyle = this.theme === 'suburbs' ? '#ffffff' : '#d35400';
                ctx.fillRect(d.x - 20, d.y - 5, 40, 10);
                ctx.fillStyle = '#7f8c8d';
                ctx.fillRect(d.x - 16, d.y - 8, 4, 16);
                ctx.fillRect(d.x + 12, d.y - 8, 4, 16);
            } else if (d.type === 'sign') {
                ctx.fillStyle = '#95a5a6';
                ctx.fillRect(d.x - 2, d.y - 2, 4, 14);
                ctx.fillStyle = '#e74c3c';
                ctx.beginPath();
                ctx.arc(d.x, d.y - 6, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(d.x - 6, d.y - 8, 12, 4);
            } else if (d.type === 'crate') {
                ctx.fillStyle = '#b9770e';
                ctx.fillRect(d.x - 10, d.y - 10, 20, 20);
                ctx.strokeStyle = '#784212';
                ctx.lineWidth = 2;
                ctx.strokeRect(d.x - 10, d.y - 10, 20, 20);
            } else if (d.type === 'barrel') {
                ctx.fillStyle = '#c0392b';
                ctx.beginPath();
                ctx.arc(d.x, d.y, 11, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#f1c40f';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else if (d.type === 'bush') {
                ctx.fillStyle = '#27ae60';
                ctx.beginPath();
                ctx.arc(d.x, d.y, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#2ecc71';
                ctx.beginPath();
                ctx.arc(d.x - 2, d.y - 2, 8, 0, Math.PI * 2);
                ctx.fill();
            } else if (d.type === 'barrier') {
                ctx.fillStyle = '#bdc3c7';
                ctx.fillRect(d.x - 20, d.y - 8, 40, 16);
                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(d.x - 12, d.y - 8, 8, 16);
                ctx.fillRect(d.x + 4, d.y - 8, 8, 16);
            } else if (d.type === 'container_small') {
                ctx.fillStyle = '#2980b9';
                ctx.fillRect(d.x - 20, d.y - 12, 40, 24);
                ctx.strokeStyle = '#1abc9c';
                ctx.lineWidth = 2;
                ctx.strokeRect(d.x - 20, d.y - 12, 40, 24);
            } else if (d.type === 'streetlight') {
                ctx.fillStyle = '#7f8c8d';
                ctx.beginPath();
                ctx.arc(d.x, d.y, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.arc(d.x, d.y, 3, 0, Math.PI * 2);
                ctx.fill();
            } else if (d.type === 'hydrant') {
                ctx.fillStyle = '#e74c3c';
                ctx.beginPath();
                ctx.arc(d.x, d.y, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#f39c12';
                ctx.fillRect(d.x - 5, d.y - 3, 10, 6);
            } else {
                ctx.fillStyle = '#d35400';
                ctx.fillRect(d.x - 8, d.y - 8, 16, 16);
            }
        }
        ctx.restore();
    }

    drawTrees(ctx, camera) {
        ctx.save();
        for (const t of this.trees) {
            if (!camera.isVisible(t.x, t.y, t.size + 40)) continue;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
            ctx.beginPath();
            ctx.ellipse(t.x + 8, t.y + 8, t.size * 0.8, t.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#4e342e';
            ctx.beginPath();
            ctx.arc(t.x, t.y, 6, 0, Math.PI * 2);
            ctx.fill();

            if (this.theme === 'suburbs') {
                ctx.fillStyle = '#f06292'; // Cherry blossom
                ctx.beginPath();
                ctx.arc(t.x, t.y - 6, t.size * 0.85, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#f8bbd0';
                ctx.beginPath();
                ctx.arc(t.x - 4, t.y - 10, t.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.theme === 'industrial') {
                ctx.fillStyle = '#1b4d3e'; // Dark conifer
                ctx.beginPath();
                ctx.arc(t.x, t.y - 6, t.size * 0.85, 0, Math.PI * 2);
                ctx.fill();
            } else { // river
                ctx.fillStyle = '#2e7d32'; // Lush willow
                ctx.beginPath();
                ctx.arc(t.x, t.y - 6, t.size * 0.85, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#4caf50';
                ctx.beginPath();
                ctx.arc(t.x - 5, t.y - 10, t.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }
}
