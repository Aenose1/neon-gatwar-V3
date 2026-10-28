// src/maps.js - Four distinct maps: Green Suburbs (Spring), River District (Summer), Neon Industrial Zone (Night), and Tri-Season Megalopolis (Combined)
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

    getTractionAt(x, y) {
        if (this.theme === 'megalopolis') {
            if (y >= 2100) return 0.92; // South Neon Industrial
            if (x >= 2100) return 0.98; // North-East Summer River District
            return 0.95; // North-West Spring Green Suburbs
        }
        return this.surfaceTraction;
    }

    generateRoads() {
        this.roads = [];

        if (this.index === 0) {
            // ==========================================
            // MAP 1: GREEN SUBURBS (SPRING)
            // Distinct Layout: Central Roundabout, Suburban Cul-de-Sacs, Curved Avenues
            // ==========================================
            // Central Plaza Roundabout (approximated with connected octagonal segments)
            const rcX = 2100, rcY = 2100, rR = 280;
            const sides = 8;
            for (let i = 0; i < sides; i++) {
                const a1 = (i / sides) * Math.PI * 2;
                const a2 = ((i + 1) / sides) * Math.PI * 2;
                this.addRoad(
                    rcX + Math.cos(a1) * rR, rcY + Math.sin(a1) * rR,
                    rcX + Math.cos(a2) * rR, rcY + Math.sin(a2) * rR,
                    150
                );
            }

            // 4 Radial Avenues exiting Roundabout
            this.addRoad(2100, 200, 2100, 1820, 160);  // North Avenue
            this.addRoad(2100, 2380, 2100, 4000, 160); // South Avenue
            this.addRoad(200, 2100, 1820, 2100, 160);  // West Parkway
            this.addRoad(2380, 2100, 4000, 2100, 160); // East Boulevard

            // Suburban Perimeter Outer Loops & Courts
            this.addRoad(700, 700, 3500, 700, 140);
            this.addRoad(700, 3400, 3500, 3400, 140);
            this.addRoad(700, 700, 700, 3400, 140);
            this.addRoad(3500, 700, 3500, 3400, 140);

            // Winding Cul-de-sac Loops in Neighborhoods
            this.addRoad(700, 1400, 1400, 1400, 120);
            this.addRoad(1400, 1400, 1400, 700, 120);
            this.addRoad(2800, 700, 2800, 1400, 120);
            this.addRoad(2800, 1400, 3500, 1400, 120);

            // Diagonal bypasses
            this.addRoad(700, 2100, 1035, 1765, 130);
            this.addRoad(1035, 1765, 1400, 1400, 130);
            this.addRoad(2800, 1400, 3165, 1765, 130);
            this.addRoad(3165, 1765, 3500, 2100, 130);

            this.addRoad(700, 2100, 1400, 2800, 120);
            this.addRoad(1400, 2800, 2100, 2800, 120);
            this.addRoad(2100, 2800, 2800, 2800, 120);
            this.addRoad(2800, 2800, 3500, 2100, 120);

        } else if (this.index === 1) {
            // ==========================================
            // MAP 2: RIVER DISTRICT (SUMMER)
            // Distinct Layout: Canal Network, Twin Shore Boulevards, Marina Loops
            // ==========================================
            // North Waterfront Parkway
            this.addRoad(300, 1100, 3900, 1100, 160);

            // South Dockland Avenue
            this.addRoad(300, 2500, 3900, 2500, 160);

            // Central River Crossing Arterial Highway
            this.addRoad(2100, 200, 2100, 4000, 160);

            // East & West Pier Corridors
            this.addRoad(700, 400, 700, 3800, 150);
            this.addRoad(3500, 400, 3500, 3800, 150);

            // Outer Port Perimeter
            this.addRoad(700, 400, 3500, 400, 140);
            this.addRoad(700, 3800, 3500, 3800, 140);

            // High-Speed Marina Coastal Sweepers & Bridge Connectors
            this.addRoad(700, 1100, 1035, 1765, 140);
            this.addRoad(1035, 1765, 1400, 2100, 140);
            this.addRoad(1400, 2100, 2100, 2100, 140);
            this.addRoad(2100, 2100, 2800, 2100, 140);
            this.addRoad(2800, 2100, 3165, 1765, 140);
            this.addRoad(3165, 1765, 3500, 1100, 140);

            // South Dock Shipping Loop
            this.addRoad(700, 2500, 1400, 3100, 130);
            this.addRoad(1400, 3100, 2800, 3100, 130);
            this.addRoad(2800, 3100, 3500, 2500, 130);

        } else if (this.index === 2) {
            // ==========================================
            // MAP 3: NEON INDUSTRIAL ZONE (NEON NIGHT)
            // Distinct Layout: Super-Wide 8-Lane Freight Expressway, Factory Chicanes, Rail Depot
            // ==========================================
            // 8-Lane Central Freight Drag Expressway (180px wide)
            this.addRoad(2100, 200, 2100, 4000, 180);

            // Major Trans-Industrial Arterial (180px wide)
            this.addRoad(200, 2100, 4000, 2100, 180);

            // Perimeter Freight Railway Corridors (Wide, high-traction straights)
            this.addRoad(550, 550, 3650, 550, 150);
            this.addRoad(550, 3650, 3650, 3650, 150);
            this.addRoad(550, 550, 550, 3650, 150);
            this.addRoad(3650, 550, 3650, 3650, 150);

            // Tight Warehouse Chicanes & Cargo Alleys (Technical 90-degree drift zones)
            this.addRoad(550, 1300, 1300, 1300, 130);
            this.addRoad(1300, 1300, 1300, 2100, 130);
            this.addRoad(2900, 2100, 2900, 1300, 130);
            this.addRoad(2900, 1300, 3650, 1300, 130);

            this.addRoad(550, 2900, 1300, 2900, 130);
            this.addRoad(1300, 2900, 1300, 2100, 130);
            this.addRoad(2900, 2100, 2900, 2900, 130);
            this.addRoad(2900, 2900, 3650, 2900, 130);

            // Bridge Approaches
            this.addRoad(700, 2100, 1035, 1765, 130);
            this.addRoad(1035, 1765, 1400, 1400, 130);
            this.addRoad(2800, 1400, 3165, 1765, 130);
            this.addRoad(3165, 1765, 3500, 2100, 130);

        } else {
            // ==========================================
            // MAP 4: TRI-SEASON MEGALOPOLIS (COMBINES SPRING, SUMMER & NEON NIGHT!)
            // Distinct Layout: Sector 1 (NW: Spring Suburbs), Sector 2 (NE: Summer River), Sector 3 (South: Neon Industrial)
            // Connected via the Grand Inter-Seasonal Tri-Bridge Interchange
            // ==========================================
            // Grand Central Inter-Seasonal North-South Highway (links North Suburbs/River to South Neon City)
            this.addRoad(2100, 200, 2100, 4000, 170);

            // East-West Trans-Regional Parkway
            this.addRoad(300, 2100, 3900, 2100, 170);

            // Sector 1: Spring Suburbs Northern Avenue (NW)
            this.addRoad(600, 800, 2100, 800, 140);
            this.addRoad(600, 800, 600, 2100, 140);
            this.addRoad(600, 1450, 1450, 1450, 130);
            this.addRoad(1450, 1450, 1450, 800, 130);

            // Sector 2: Summer River Coastal Boulevard (NE)
            this.addRoad(2100, 800, 3600, 800, 140);
            this.addRoad(3600, 800, 3600, 2100, 140);
            this.addRoad(2750, 800, 2750, 1450, 130);
            this.addRoad(2750, 1450, 3600, 1450, 130);

            // Sector 3: Neon Industrial South Beltway (South)
            this.addRoad(600, 3400, 3600, 3400, 160);
            this.addRoad(600, 2100, 600, 3400, 150);
            this.addRoad(3600, 2100, 3600, 3400, 150);

            // Industrial South Chicanes
            this.addRoad(1350, 2100, 1350, 2750, 130);
            this.addRoad(1350, 2750, 2100, 2750, 130);
            this.addRoad(2100, 2750, 2850, 2750, 130);
            this.addRoad(2850, 2750, 2850, 2100, 130);

            // Trans-Sector Inter-Regional Connectors (Diagonal Superhighways)
            this.addRoad(600, 2100, 1035, 1765, 140);
            this.addRoad(1035, 1765, 1450, 1450, 140);
            this.addRoad(2750, 1450, 3165, 1765, 140);
            this.addRoad(3165, 1765, 3600, 2100, 140);

            this.addRoad(600, 2100, 1350, 2750, 140);
            this.addRoad(2850, 2750, 3600, 2100, 140);
        }
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

        // River channel segments across the mid-latitude of the maps
        let channelType = 'river';
        let channelWidth = 140;
        let bridgeType = 'stone';

        if (this.index === 0) {
            channelType = 'creek';
            channelWidth = 110;
            bridgeType = 'wooden';
        } else if (this.index === 1) {
            channelType = 'river';
            channelWidth = 150;
            bridgeType = 'stone';
        } else if (this.index === 2) {
            channelType = 'canal';
            channelWidth = 120;
            bridgeType = 'steel';
        } else {
            // Megalopolis (Tri-Season)
            channelType = 'mega_channel';
            channelWidth = 140;
            bridgeType = 'composite';
        }

        this.waterBodies.push({
            type: channelType,
            width: channelWidth,
            halfW: channelWidth / 2,
            segments: [
                { x1: 200, y1: 1750, x2: 1100, y2: 1780 },
                { x1: 1100, y1: 1780, x2: 2100, y2: 1800 },
                { x1: 2100, y1: 1800, x2: 3100, y2: 1770 },
                { x1: 3100, y1: 1770, x2: 4000, y2: 1740 }
            ]
        });

        // ALL FIVE BRIDGES explicitly placed and drivable on all maps:
        // Bridge 1: West Avenue Bridge at x = 700 (or x = 600 on megalopolis)
        const b1X = (this.index === 3) ? 600 : 700;
        this.bridges.push({
            id: 'bridge_1',
            x: b1X,
            y: 1765,
            w: 180,
            h: 240,
            halfW: 90,
            halfH: 120,
            angle: 0,
            type: bridgeType
        });

        // Bridge 2: West Diagonal Connector Bridge at x = 1035 (FIXED: Never triggers wet message)
        this.bridges.push({
            id: 'bridge_2',
            x: 1035,
            y: 1765,
            w: 180,
            h: 260,
            halfW: 90,
            halfH: 130,
            angle: -Math.PI / 4,
            type: bridgeType
        });

        // Bridge 3: Central Highway Bridge at x = 2100
        this.bridges.push({
            id: 'bridge_3',
            x: 2100,
            y: 1800,
            w: 220,
            h: 260,
            halfW: 110,
            halfH: 130,
            angle: 0,
            type: (this.index === 1 || this.index === 3) ? 'suspension' : bridgeType
        });

        // Bridge 4: East Diagonal Connector Bridge at x = 3165 (FIXED: Never triggers wet message)
        this.bridges.push({
            id: 'bridge_4',
            x: 3165,
            y: 1765,
            w: 180,
            h: 260,
            halfW: 90,
            halfH: 130,
            angle: Math.PI / 4,
            type: bridgeType
        });

        // Bridge 5: East Avenue Bridge at x = 3500 (or x = 3600 on megalopolis)
        const b5X = (this.index === 3) ? 3600 : 3500;
        this.bridges.push({
            id: 'bridge_5',
            x: b5X,
            y: 1755,
            w: 180,
            h: 240,
            halfW: 90,
            halfH: 120,
            angle: 0,
            type: bridgeType
        });
    }

    isOnBridge(x, y, margin = 20) {
        for (let i = 0; i < this.bridges.length; i++) {
            const b = this.bridges[i];
            const dx = x - b.x;
            const dy = y - b.y;

            if (b.angle) {
                const cos = Math.cos(-b.angle);
                const sin = Math.sin(-b.angle);
                const lx = dx * cos - dy * sin;
                const ly = dx * sin + dy * cos;
                if (Math.abs(lx) <= b.halfW + margin && Math.abs(ly) <= b.halfH + margin) {
                    return true;
                }
            } else {
                if (Math.abs(dx) <= b.halfW + margin && Math.abs(dy) <= b.halfH + margin) {
                    return true;
                }
            }
        }
        return false;
    }

    isInWater(x, y) {
        if (this.isOnBridge(x, y, 20) || this.isOnRoad(x, y, 6)) {
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
        if (this.isOnBridge(x, y, margin)) return true;

        for (let i = 0; i < this.roads.length; i++) {
            const r = this.roads[i];
            const dist = this.distToSegment(x, y, r.x1, r.y1, r.x2, r.y2);
            if (dist <= r.halfW + margin) return true;
        }
        return false;
    }

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

        // Grid candidate spots across map quadrants (dynamically checked against all road segments)
        const spots = [];
        const xCoords = [450, 1050, 1600, 2600, 3150, 3750];
        const yCoords = [450, 1050, 1400, 2750, 3100, 3750];

        for (const sx of xCoords) {
            for (const sy of yCoords) {
                spots.push({
                    x: sx,
                    y: sy,
                    w: (sx % 200 === 0) ? 160 : 140,
                    h: (sy % 200 === 0) ? 120 : 110
                });
            }
        }

        // Additional safe interior plot points
        spots.push(
            { x: 1750, y: 1750, w: 120, h: 100 },
            { x: 2450, y: 1750, w: 120, h: 100 },
            { x: 1750, y: 2450, w: 120, h: 100 },
            { x: 2450, y: 2450, w: 120, h: 100 }
        );

        let bldId = 0;
        for (const spot of spots) {
            const halfW = spot.w / 2;
            const halfH = spot.h / 2;
            const requiredClearance = Math.max(halfW, halfH) + 30;

            if (this.isClearOfRoads(spot.x, spot.y, requiredClearance) && !this.isInWater(spot.x, spot.y)) {
                let themeType = 'house';

                if (this.index === 0) {
                    themeType = (bldId % 2 === 0) ? 'suburban_villa' : 'suburban_house';
                } else if (this.index === 1) {
                    themeType = (bldId % 2 === 0) ? 'dockhouse' : 'boathouse';
                } else if (this.index === 2) {
                    themeType = (bldId % 2 === 0) ? 'warehouse' : 'factory';
                } else {
                    // Megalopolis: Determined by sector
                    if (spot.y >= 2100) {
                        themeType = (bldId % 2 === 0) ? 'warehouse' : 'factory'; // South: Neon
                    } else if (spot.x >= 2100) {
                        themeType = (bldId % 2 === 0) ? 'dockhouse' : 'boathouse'; // NE: Summer River
                    } else {
                        themeType = (bldId % 2 === 0) ? 'suburban_villa' : 'suburban_house'; // NW: Spring Suburbs
                    }
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
        this.solidProps = [];
        this.trees = [];

        let destId = 0;
        let solidId = 0;

        const addDestructible = (type, x, y, tier = 'medium') => {
            if (!this.isClearOfRoads(x, y, 16)) return;
            if (this.isInWater(x, y)) return;

            let w = 24, h = 24, radius = 16;
            let reqSpeed = 130;
            let cash = 16;
            let score = 180;
            let hp = 25;

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
            if (!this.isClearOfRoads(x, y, 90)) return;
            if (this.isInWater(x, y)) return;

            let w = 36, h = 36, radius = 22;
            if (type === 'monument') { w = 40; h = 40; radius = 24; }
            else if (type === 'transformer') { w = 32; h = 32; radius = 20; }

            this.solidProps.push({
                id: `solid_${solidId++}`,
                type,
                x, y,
                w, h,
                radius
            });
        };

        // 1. Roadside Breakable Props: Along road shoulders
        for (let i = 0; i < this.roads.length; i++) {
            const r = this.roads[i];
            const cos = Math.cos(r.angle);
            const sin = Math.sin(r.angle);
            const normalX = -sin;
            const normalY = cos;
            const offset = r.halfW + 30;

            const step = 90;
            let stepIndex = 0;
            for (let dist = 90; dist < r.length - 90; dist += step) {
                const px = r.x1 + cos * dist;
                const py = r.y1 + sin * dist;
                const cycle = stepIndex % 5;
                stepIndex++;

                let currentTheme = this.theme;
                if (this.theme === 'megalopolis') {
                    if (py >= 2100) currentTheme = 'industrial';
                    else if (px >= 2100) currentTheme = 'river';
                    else currentTheme = 'suburbs';
                }

                if (currentTheme === 'suburbs') {
                    if (cycle === 0) {
                        addDestructible('fence', px + normalX * offset, py + normalY * offset, 'medium');
                        addDestructible('bush', px - normalX * offset, py - normalY * offset, 'light');
                    } else if (cycle === 1) {
                        addDestructible('streetlight', px + normalX * (offset + 8), py + normalY * (offset + 8), 'medium');
                    } else if (cycle === 2) {
                        addDestructible('hydrant', px - normalX * (offset + 8), py - normalY * (offset + 8), 'medium');
                    } else if (cycle === 3) {
                        addDestructible('bush', px + normalX * offset, py + normalY * offset, 'light');
                    } else {
                        addDestructible('fence', px - normalX * offset, py - normalY * offset, 'medium');
                    }
                } else if (currentTheme === 'river') {
                    if (cycle === 0) {
                        addDestructible('fence', px + normalX * offset, py + normalY * offset, 'medium');
                        addDestructible('crate', px - normalX * offset, py - normalY * offset, 'light');
                    } else if (cycle === 1) {
                        addDestructible('barrel', px + normalX * (offset + 10), py + normalY * (offset + 10), 'medium');
                    } else if (cycle === 2) {
                        addDestructible('crate', px - normalX * (offset + 10), py - normalY * (offset + 10), 'light');
                    } else if (cycle === 3) {
                        addDestructible('barrel', px + normalX * (offset + 10), py + normalY * (offset + 10), 'medium');
                    } else {
                        addDestructible('fence', px - normalX * (offset + 10), py - normalY * (offset + 10), 'medium');
                    }
                } else {
                    // industrial
                    if (cycle === 0) {
                        addDestructible('barrier', px + normalX * offset, py + normalY * offset, 'heavy');
                        addDestructible('barrel', px - normalX * offset, py - normalY * offset, 'medium');
                    } else if (cycle === 1) {
                        addDestructible('container_small', px + normalX * (offset + 12), py + normalY * (offset + 12), 'heavy');
                    } else if (cycle === 2) {
                        addDestructible('barrier', px - normalX * (offset + 12), py - normalY * (offset + 12), 'heavy');
                    } else if (cycle === 3) {
                        addDestructible('barrel', px + normalX * (offset + 12), py + normalY * (offset + 12), 'medium');
                    } else {
                        addDestructible('container_small', px - normalX * (offset + 12), py - normalY * (offset + 12), 'heavy');
                    }
                }
            }
        }

        // 2. Cluster Props Around Buildings
        for (const b of this.buildings) {
            addDestructible('crate', b.x - b.halfW - 28, b.y, 'light');
            addDestructible('crate', b.x + b.halfW + 28, b.y, 'light');

            if (b.type.includes('suburban') || b.type === 'house') {
                addDestructible('bush', b.x, b.y + b.halfH + 24, 'light');
            } else if (b.type.includes('dock') || b.type.includes('boat')) {
                addDestructible('barrel', b.x, b.y + b.halfH + 28, 'medium');
            } else {
                addDestructible('oil_tank', b.x, b.y + b.halfH + 32, 'heavy');
            }
        }

        // 3. Deep Off-Road Park Plinths (strictly >= 95px clear of all roads)
        for (let x = 200; x < this.width - 200; x += 190) {
            for (let y = 200; y < this.height - 200; y += 190) {
                if (this.isClearOfRoads(x, y, 95) && !this.isInWater(x, y)) {
                    addSolidProp('monument', x, y);
                }
            }
        }

        // 4. Scenery Trees (Exclusively off-road, dry zones)
        const treeCount = 240;
        for (let i = 0; i < treeCount; i++) {
            const tx = Math.random() * (this.width - 240) + 120;
            const ty = Math.random() * (this.height - 240) + 120;

            if (this.isClearOfRoads(tx, ty, 30) && !this.isInWater(tx, ty)) {
                let treeTheme = this.theme;
                if (this.theme === 'megalopolis') {
                    if (ty >= 2100) treeTheme = 'industrial';
                    else if (tx >= 2100) treeTheme = 'river';
                    else treeTheme = 'suburbs';
                }

                this.trees.push({
                    x: tx,
                    y: ty,
                    size: Math.random() * 22 + 30,
                    type: treeTheme
                });
            }
        }
    }

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
        if (this.theme === 'megalopolis') {
            // Draw 3 distinct seasonal sectors:
            // Sector 1: North-West (Spring Suburbs - Lush Lawn)
            ctx.fillStyle = '#70b263';
            ctx.fillRect(0, 0, 2100, 2100);

            // Sector 2: North-East (Summer River District - Sunny Lawn)
            ctx.fillStyle = '#6da044';
            ctx.fillRect(2100, 0, 2100, 2100);

            // Sector 3: South (Neon Industrial - Dark Asphalt Grid)
            ctx.fillStyle = '#1e242d';
            ctx.fillRect(0, 2100, this.width, 2100);

            // Border dividers between sectors
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 210, 255, 0.35)';
            ctx.lineWidth = 3;
            ctx.setLineDash([12, 8]);
            ctx.beginPath();
            ctx.moveTo(2100, 0); ctx.lineTo(2100, 2100);
            ctx.moveTo(0, 2100); ctx.lineTo(this.width, 2100);
            ctx.stroke();
            ctx.restore();
        } else {
            ctx.fillStyle = this.config.groundColor;
            ctx.fillRect(0, 0, this.width, this.height);
        }

        // Ground Accents
        this.drawGroundDetails(ctx, camera);

        // 2. Water Bodies
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

        // 8. Trees
        this.drawTrees(ctx, camera);
    }

    drawGroundDetails(ctx, camera) {
        ctx.save();
        ctx.fillStyle = this.config.groundAccent;

        const step = 320;
        for (let x = 120; x < this.width; x += step) {
            for (let y = 120; y < this.height; y += step) {
                if (!camera.isVisible(x, y, 120)) continue;
                ctx.beginPath();
                ctx.rect(x - 20, y - 20, 40, 40);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    drawWater(ctx, camera) {
        ctx.save();

        for (const body of this.waterBodies) {
            let bankColor = '#5d4037';
            let shallowColor = '#0288d1';
            let deepColor = '#01579b';

            if (this.theme === 'suburbs') {
                bankColor = '#4e342e';
                shallowColor = '#0288d1';
                deepColor = '#01579b';
            } else if (this.theme === 'river') {
                bankColor = '#3e2723';
                shallowColor = '#0097a7';
                deepColor = '#006064';
            } else if (this.theme === 'industrial') {
                bankColor = '#212121';
                shallowColor = '#00838f';
                deepColor = '#004d40';
            } else {
                // Megalopolis: Azure waterway with clean natural embankments
                bankColor = '#3e2723';
                shallowColor = '#00acc1';
                deepColor = '#00838f';
            }

            for (const seg of body.segments) {
                const midX = (seg.x1 + seg.x2) / 2;
                const midY = (seg.y1 + seg.y2) / 2;
                if (!camera.isVisible(midX, midY, 650)) continue;

                ctx.strokeStyle = bankColor;
                ctx.lineWidth = body.width + 24;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
                ctx.stroke();

                ctx.strokeStyle = shallowColor;
                ctx.lineWidth = body.width;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
                ctx.stroke();

                ctx.strokeStyle = deepColor;
                ctx.lineWidth = body.width * 0.65;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    drawRoads(ctx, camera) {
        ctx.save();

        const visibleRoads = [];
        for (let i = 0; i < this.roads.length; i++) {
            const r = this.roads[i];
            const midX = (r.x1 + r.x2) / 2;
            const midY = (r.y1 + r.y2) / 2;
            if (!camera.isVisible(midX, midY, r.length / 2 + 100)) continue;

            let curRoadBorder = this.config.roadBorderColor;
            let curRoadColor = this.config.roadColor;

            if (this.theme === 'megalopolis') {
                if (midY >= 2100) {
                    curRoadBorder = '#ff007f';
                    curRoadColor = '#15191f';
                } else if (midX >= 2100) {
                    curRoadBorder = '#a88a58';
                    curRoadColor = '#2b303a';
                } else {
                    curRoadBorder = '#7cb342';
                    curRoadColor = '#343a40';
                }
            }

            visibleRoads.push({ r, curRoadBorder, curRoadColor });
        }

        // PASS 1: Draw ALL road curbs / borders together first
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 0; i < visibleRoads.length; i++) {
            const { r, curRoadBorder } = visibleRoads[i];
            ctx.strokeStyle = curRoadBorder;
            ctx.lineWidth = r.width + 12;
            ctx.beginPath();
            ctx.moveTo(r.x1, r.y1);
            ctx.lineTo(r.x2, r.y2);
            ctx.stroke();
        }

        // PASS 2: Draw ALL asphalt road surfaces on top (seamlessly merging intersections)
        for (let i = 0; i < visibleRoads.length; i++) {
            const { r, curRoadColor } = visibleRoads[i];
            ctx.strokeStyle = curRoadColor;
            ctx.lineWidth = r.width;
            ctx.beginPath();
            ctx.moveTo(r.x1, r.y1);
            ctx.lineTo(r.x2, r.y2);
            ctx.stroke();
        }

        // PASS 3: Draw lane markings
        ctx.strokeStyle = this.config.roadLineColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'butt';
        ctx.setLineDash([24, 20]);
        for (let i = 0; i < visibleRoads.length; i++) {
            const { r } = visibleRoads[i];
            ctx.beginPath();
            ctx.moveTo(r.x1, r.y1);
            ctx.lineTo(r.x2, r.y2);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        ctx.restore();
    }

    drawBridges(ctx, camera) {
        ctx.save();

        for (const b of this.bridges) {
            if (!camera.isVisible(b.x, b.y, Math.max(b.w, b.h) + 60)) continue;

            ctx.save();
            ctx.translate(b.x, b.y);
            if (b.angle) ctx.rotate(b.angle);

            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.fillRect(-b.halfW + 6, -b.halfH + 6, b.w, b.h);

            // Base deck
            let deckColor = '#4a5568';
            let railColor = '#cbd5e1';

            if (b.type === 'wooden') {
                deckColor = '#8d6e63';
                railColor = '#d7ccc8';
            } else if (b.type === 'stone') {
                deckColor = '#546e7a';
                railColor = '#b0bec5';
            } else if (b.type === 'steel' || b.type === 'composite') {
                deckColor = '#2d3748';
                railColor = '#00d2ff';
            } else if (b.type === 'suspension') {
                deckColor = '#374151';
                railColor = '#f59e0b';
            }

            ctx.fillStyle = deckColor;
            ctx.fillRect(-b.halfW, -b.halfH, b.w, b.h);

            // Road lane surface across bridge deck
            ctx.fillStyle = this.config.roadColor;
            ctx.fillRect(-b.halfW + 10, -b.halfH, b.w - 20, b.h);

            // Guardrails
            ctx.fillStyle = railColor;
            ctx.fillRect(-b.halfW, -b.halfH, 10, b.h);
            ctx.fillRect(b.halfW - 10, -b.halfH, 10, b.h);

            // Center line
            ctx.strokeStyle = this.config.roadLineColor;
            ctx.lineWidth = 3;
            ctx.setLineDash([16, 14]);
            ctx.beginPath();
            ctx.moveTo(0, -b.halfH);
            ctx.lineTo(0, b.halfH);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.restore();
        }

        ctx.restore();
    }

    drawBuildings(ctx, camera) {
        ctx.save();

        for (const b of this.buildings) {
            if (!camera.isVisible(b.x, b.y, Math.max(b.w, b.h) + 40)) continue;

            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.fillRect(b.x - b.halfW + 6, b.y - b.halfH + 6, b.w, b.h);

            let roofColor = '#e74c3c';
            let wallColor = '#ecf0f1';

            if (b.type.includes('villa')) {
                roofColor = '#3498db';
                wallColor = '#ffffff';
            } else if (b.type.includes('dock') || b.type.includes('boat')) {
                roofColor = '#d35400';
                wallColor = '#bdc3c7';
            } else if (b.type.includes('warehouse')) {
                roofColor = '#2c3e50';
                wallColor = '#7f8c8d';
            } else if (b.type.includes('factory')) {
                roofColor = '#1e272e';
                wallColor = '#485460';
            }

            // Walls
            ctx.fillStyle = wallColor;
            ctx.fillRect(b.x - b.halfW, b.y - b.halfH, b.w, b.h);

            // Roof
            ctx.fillStyle = roofColor;
            ctx.fillRect(b.x - b.halfW + 6, b.y - b.halfH + 6, b.w - 12, b.h - 12);

            // Border
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 2;
            ctx.strokeRect(b.x - b.halfW, b.y - b.halfH, b.w, b.h);
        }

        ctx.restore();
    }

    drawSolidProps(ctx, camera) {
        ctx.save();
        for (const p of this.solidProps) {
            if (!camera.isVisible(p.x, p.y, p.radius + 20)) continue;

            const half = p.radius;
            // Drop shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.fillRect(p.x - half + 4, p.y - half + 4, half * 2, half * 2);

            // Solid obstacle base
            ctx.fillStyle = '#636e72';
            ctx.fillRect(p.x - half, p.y - half, half * 2, half * 2);

            // Bevel highlight
            ctx.fillStyle = '#b2bec3';
            ctx.fillRect(p.x - half + 4, p.y - half + 4, half * 2 - 8, half * 2 - 8);

            ctx.strokeStyle = '#2d3436';
            ctx.lineWidth = 2;
            ctx.strokeRect(p.x - half, p.y - half, half * 2, half * 2);
        }
        ctx.restore();
    }

    drawDestructibles(ctx, camera) {
        ctx.save();

        for (const d of this.destructibles) {
            if (d.destroyed) continue;
            if (!camera.isVisible(d.x, d.y, d.radius + 20)) continue;

            // Soft shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.beginPath();
            ctx.ellipse(d.x + 2, d.y + 2, d.radius * 0.9, d.radius * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Prop drawing based on type
            if (d.type === 'bush') {
                ctx.fillStyle = '#27ae60';
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
                ctx.fill();
            } else if (d.type === 'fence') {
                ctx.fillStyle = '#ecf0f1';
                ctx.fillRect(d.x - d.w / 2, d.y - d.h / 2, d.w, d.h);
                ctx.strokeStyle = '#bdc3c7';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(d.x - d.w / 2, d.y - d.h / 2, d.w, d.h);
            } else if (d.type === 'barrel') {
                ctx.fillStyle = '#e67e22';
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#d35400';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else if (d.type === 'crate') {
                ctx.fillStyle = '#cd6133';
                ctx.fillRect(d.x - d.w / 2, d.y - d.h / 2, d.w, d.h);
                ctx.strokeStyle = '#843b18';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(d.x - d.w / 2, d.y - d.h / 2, d.w, d.h);
            } else if (d.type === 'barrier') {
                ctx.fillStyle = '#f39c12';
                ctx.fillRect(d.x - d.w / 2, d.y - d.h / 2, d.w, d.h);
                ctx.strokeStyle = '#2c3e50';
                ctx.lineWidth = 2;
                ctx.strokeRect(d.x - d.w / 2, d.y - d.h / 2, d.w, d.h);
            } else if (d.type === 'streetlight' || d.type === 'hydrant') {
                ctx.fillStyle = (d.type === 'hydrant') ? '#e74c3c' : '#f1c40f';
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = '#95a5a6';
                ctx.fillRect(d.x - d.w / 2, d.y - d.h / 2, d.w, d.h);
            }
        }

        ctx.restore();
    }

    drawTrees(ctx, camera) {
        ctx.save();

        for (const t of this.trees) {
            if (!camera.isVisible(t.x, t.y, t.size + 20)) continue;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
            ctx.beginPath();
            ctx.ellipse(t.x + 3, t.y + 4, t.size * 0.85, t.size * 0.55, 0, 0, Math.PI * 2);
            ctx.fill();

            let crownColor = '#2e7d32';
            if (t.type === 'suburbs') crownColor = '#ff80ab'; // Cherry blossom
            else if (t.type === 'river') crownColor = '#43a047'; // Summer palm/willow
            else if (t.type === 'industrial') crownColor = '#37474f'; // Urban evergreen

            ctx.fillStyle = crownColor;
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
            ctx.fill();

            // Inner crown highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
            ctx.beginPath();
            ctx.arc(t.x - t.size * 0.25, t.y - t.size * 0.25, t.size * 0.55, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
