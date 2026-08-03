/* =========================================================================
   AGE OF AGENTS — a tiny classic RTS easter egg
   Villagers gather, buildings train, bots fight, a wonder wins the game.
   Trigger: click the hero photo 10 times.
   ========================================================================= */
(function () {
    'use strict';

    /* ------------------------------------------------------------ config */

    const LABS = {
        openbrain: { name: 'OpenBrain', color: '#3E6ECF', dark: '#2A4B92', trim: '#8FB0EA', perk: 'compute', perkText: 'GPU mines yield +20% Compute' },
        deepcent:  { name: 'DeepCent',  color: '#C43B2E', dark: '#8C2419', trim: '#E89A90', perk: 'data',    perkText: 'Data farms yield +20% Data' },
        frontier:  { name: 'Frontier',  color: '#2E8B57', dark: '#1C5C38', trim: '#8CCBA8', perk: 'hardware',perkText: 'Salvage yards yield +20% Hardware' }
    };

    const TW = 64, TH = 32;      // iso tile
    const MAP = 30;
    const CARRY = 10;            // villager carry capacity
    const GATHER_TICK = 0.55;    // seconds per resource unit gathered
    const WONDER_TIME = 60;      // hold the AGI Lab this long to win

    const UNIT_DEFS = {
        engineer: { name: 'Engineer', cost: { data: 50 },               hp: 25,  speed: 2.0, pop: 1, train: 7,  icon: '👷' },
        bot:      { name: 'Combat Bot', cost: { data: 40, compute: 30 }, hp: 55,  speed: 2.4, pop: 1, train: 9,  icon: '🤖', atk: 7, range: 1.0, aggro: 5 }
    };

    const BLD_DEFS = {
        hq:         { name: 'Headquarters', cost: {},                                    hp: 650, r: 1.7, build: 0,  pop: 5, icon: '🏛' },
        office:     { name: 'Office',       cost: { hardware: 30 },                     hp: 160, r: 1.0, build: 7,  pop: 5, icon: '⌂', desc: '+5 population' },
        datacenter: { name: 'Datacenter',   cost: { hardware: 150 },                    hp: 380, r: 1.5, build: 16, icon: '🖥', desc: 'Trains Combat Bots' },
        agilab:     { name: 'AGI Lab',      cost: { hardware: 250, data: 150, compute: 200 }, hp: 900, r: 1.7, build: 25, icon: '🧠', desc: 'Wonder — survive 60s to win' }
    };

    const RES_META = {
        hardware: { label: 'Hardware', icon: '⚙', node: 'salvage', color: '#8a6f4d' },
        data:     { label: 'Data',     icon: '▤', node: 'farm',    color: '#4d9ab8' },
        compute:  { label: 'Compute',  icon: '⚡', node: 'mine',    color: '#c9a227' }
    };

    let G = null;

    /* --------------------------------------------------------------- CSS */
    /* Chrome follows the website: cream paper, ink text, terracotta accent,
       and Arial typography. */

    const CSS = `
    #aoa-overlay{position:fixed;inset:0;z-index:99999;background:#141210;color:#33291F;
        font-family:Arial,sans-serif;user-select:none;-webkit-user-select:none}
    #aoa-overlay *{box-sizing:border-box;margin:0;padding:0}
    #aoa-canvas{position:absolute;inset:0;width:100%;height:100%;cursor:default;image-rendering:pixelated}
    .pxi{width:13px;height:13px;image-rendering:pixelated;vertical-align:-2px}
    .pface{width:52px;height:52px;image-rendering:pixelated}

    .aoa-topbar{position:absolute;top:12px;left:12px;right:12px;height:52px;display:flex;align-items:center;gap:10px;
        padding:0 10px 0 20px;background:#FBF6EC;border:1px solid #D9CBB2;border-radius:8px;
        box-shadow:0 3px 14px rgba(0,0,0,.4);font-size:13px;z-index:5}
    .aoa-res{display:flex;align-items:center;gap:8px;padding:6px 14px;background:#F6EFE1;border:1px solid #E0D2B8;
        border-radius:6px;white-space:nowrap;box-shadow:inset 0 1px 0 rgba(255,255,255,.6)}
    .aoa-res .ic{display:flex;align-items:center}
    .aoa-res b{font-weight:700;min-width:42px;text-align:right;font-size:13px;font-variant-numeric:tabular-nums;letter-spacing:.02em}
    .aoa-pop{margin-left:2px}
    .aoa-pop.full b{color:#B75434}
    .aoa-wordmark{font-family:Arial,sans-serif;font-style:italic;font-size:19px;letter-spacing:.01em;
        margin-right:14px;color:#33291F;white-space:nowrap}
    .aoa-spacer{flex:1}
    .aoa-timer{font-size:12px;color:#6E6152;margin-right:10px;padding:6px 12px;border:1px dashed #D9CBB2;
        border-radius:6px;font-variant-numeric:tabular-nums}
    .aoa-close{background:#55473A;border:none;color:#FBF6EC;font-family:inherit;font-size:11.5px;letter-spacing:.06em;
        padding:8px 18px;cursor:pointer;border-radius:999px;transition:background .15s ease}
    .aoa-close:hover{background:#B75434}

    .aoa-bottombar{position:absolute;left:12px;bottom:12px;width:560px;min-height:128px;display:flex;gap:12px;
        padding:12px;background:#FBF6EC;border:1px solid #D9CBB2;border-radius:8px;
        box-shadow:0 3px 14px rgba(0,0,0,.4);z-index:5}
    .aoa-portrait{width:96px;min-width:96px;border:1px solid #E0D2B8;border-radius:6px;background:#F6EFE1;
        display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:8px 6px;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.6)}
    .aoa-portrait .face{font-size:30px;line-height:1}
    .aoa-portrait small{font-size:10px;color:#33291F;text-align:center;line-height:1.35;letter-spacing:.03em}
    .aoa-portrait .hpbar{width:68px;height:6px;background:#DACBB0;border-radius:3px;overflow:hidden}
    .aoa-portrait .hpbar i{display:block;height:100%;background:#2E8B57;border-radius:3px}
    .aoa-cmdgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;flex:1;align-content:start}
    .aoa-cmd{background:#F6EFE1;border:1px solid #E0D2B8;border-radius:6px;color:#33291F;font-family:inherit;
        font-size:10.5px;padding:8px 9px 7px;cursor:pointer;text-align:left;line-height:1.5;min-height:52px;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.6);transition:border-color .12s ease,background .12s ease}
    .aoa-cmd:hover:not(:disabled){border-color:#B75434;background:#FBF6EC}
    .aoa-cmd:disabled{opacity:.42;cursor:default}
    .aoa-cmd b{display:block;font-size:11.5px;margin-bottom:3px;letter-spacing:.01em}
    .aoa-cmd .cost{display:block;color:#6E6152;font-size:10px;letter-spacing:.03em}
    .aoa-cmd .cost .pxi{margin-right:2px}
    .aoa-cmd.danger{border-color:#B75434}
    .aoa-hintline{grid-column:1/-1;font-size:10.5px;color:#6E6152;line-height:1.7;padding:4px 2px 0;align-self:center}
    .aoa-queue{grid-column:1/-1;display:flex;align-items:center;gap:10px;font-size:10.5px;color:#6E6152;padding-top:2px}
    .aoa-queue .bar{flex:1;height:8px;background:#DACBB0;border-radius:4px;overflow:hidden}
    .aoa-queue .bar i{display:block;height:100%;background:#B75434;border-radius:4px;transition:width .2s linear}

    .aoa-mmwrap{position:absolute;right:12px;bottom:12px;padding:9px;background:#FBF6EC;border:1px solid #D9CBB2;
        border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.35);z-index:5}
    .aoa-minimap{display:block;border:1px solid #C9B896;border-radius:4px;background:#1a2416;cursor:pointer}

    .aoa-toast{position:absolute;top:78px;left:50%;transform:translateX(-50%);background:#FBF6EC;color:#33291F;
        border:1px solid #D9CBB2;border-left:4px solid #B75434;border-radius:6px;padding:9px 18px;font-size:12.5px;
        z-index:8;max-width:70%;text-align:center;box-shadow:0 3px 12px rgba(0,0,0,.3);animation:aoaT .25s ease}
    @keyframes aoaT{from{opacity:0;transform:translate(-50%,-8px)}to{opacity:1;transform:translate(-50%,0)}}
    .aoa-wonderbanner{position:absolute;top:78px;left:50%;transform:translateX(-50%);z-index:7;
        background:#55473A;color:#FBF6EC;border-radius:999px;padding:8px 22px;font-size:12.5px;
        box-shadow:0 3px 12px rgba(0,0,0,.35)}
    .aoa-wonderbanner b{color:#F5C97B}

    .aoa-screen{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:20;
        background:radial-gradient(ellipse at 50% 35%, #2b2620 0%, #141210 75%)}
    .aoa-panel{max-width:720px;width:92%;text-align:center;padding:44px 44px 34px;background:#FBF6EC;
        border:1px solid #D9CBB2;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,.5);max-height:90vh;overflow:auto}
    .aoa-panel h1{font-family:Arial,sans-serif;font-style:italic;font-weight:500;font-size:46px;
        letter-spacing:-.01em;color:#33291F;margin-bottom:6px}
    .aoa-panel h2{font-size:11px;font-weight:400;letter-spacing:.22em;text-transform:uppercase;color:#B75434;
        margin-bottom:14px}
    .aoa-panel h2::after{content:"";display:block;width:56px;height:1px;background:#D9CBB2;margin:16px auto 0}
    .aoa-panel p{font-size:12.5px;line-height:1.85;color:#6E6152;margin-bottom:26px;text-align:center;
        max-width:560px;margin-left:auto;margin-right:auto}
    .aoa-panel p .pxi{margin:0 1px;vertical-align:-2px}
    .aoa-labs{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-bottom:24px}
    .aoa-lab{flex:1;min-width:180px;border:1px solid #E0D2B8;background:#F6EFE1;border-radius:8px;padding:20px 14px 16px;
        cursor:pointer;transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease;position:relative}
    .aoa-lab:hover{transform:translateY(-3px);border-color:#B75434;box-shadow:0 8px 20px rgba(51,41,31,.15)}
    .aoa-lab .sw{width:64px;height:56px;margin:0 auto 12px;image-rendering:pixelated;display:block}
    .aoa-lab .dot{position:absolute;top:12px;right:12px;width:10px;height:10px;border-radius:2px;
        border:1px solid rgba(51,41,31,.25)}
    .aoa-lab b{display:block;font-family:Arial,sans-serif;font-size:20px;font-weight:500;color:#33291F;margin-bottom:6px}
    .aoa-lab span{font-size:10px;color:#6E6152;line-height:1.55;display:block;letter-spacing:.02em}
    .aoa-lab .pick{display:inline-block;margin-top:12px;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;
        color:#B75434}
    .aoa-panel .keys{font-size:10px;color:#9C8F7D;line-height:2;letter-spacing:.03em;border-top:1px dashed #D9CBB2;
        padding-top:16px;margin-top:4px}
    .aoa-endstats{font-size:12.5px;line-height:2.1;color:#33291F;margin-bottom:20px}
    .aoa-btnrow{display:flex;gap:10px;justify-content:center}
    .aoa-pill{background:#55473A;border:none;color:#FBF6EC;font-family:inherit;font-size:12.5px;
        padding:11px 26px;cursor:pointer;border-radius:999px}
    .aoa-pill:hover{background:#B75434}
    .aoa-pill.ghost{background:none;border:1px solid #C9B896;color:#33291F}
    .aoa-pill.ghost:hover{border-color:#B75434;color:#B75434}
    `;

    /* ------------------------------------------------------------ helpers */

    function el(tag, cls, html) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html != null) e.innerHTML = html;
        return e;
    }
    const iso = (gx, gy) => ({ x: (gx - gy) * TW / 2, y: (gx + gy) * TH / 2 });
    const dist = (a, b) => Math.hypot(a.gx - b.gx, a.gy - b.gy);
    function tRand(x, y, s) {
        const n = Math.sin(x * 127.1 + y * 311.7 + (s || 0) * 74.7) * 43758.5453;
        return n - Math.floor(n);
    }
    const fmtCost = c => Object.keys(c).map(k => `${iconTag(k)} ${c[k]}`).join(' &nbsp;') || '—';
    const canAfford = (p, c) => Object.keys(c).every(k => p.res[k] >= c[k]);
    const pay = (p, c) => { Object.keys(c).forEach(k => p.res[k] -= c[k]); };

    /* ------------------------------------------------------------ map gen */

    function makeMap() {
        const nodes = [];
        const addTrees = (cx, cy, n) => { // salvage stacks double as "trees" visually? no — separate kinds
            for (let i = 0; i < n; i++) {
                const a = tRand(cx, cy, i) * 6.28, r = 0.8 + tRand(cx, cy, i + 40) * 2.2;
                nodes.push({ kind: 'salvage', res: 'hardware', gx: cx + Math.cos(a) * r, gy: cy + Math.sin(a) * r, amt: 90, max: 90 });
            }
        };
        const addMine = (cx, cy, n) => {
            for (let i = 0; i < n; i++)
                nodes.push({ kind: 'mine', res: 'compute', gx: cx + (tRand(cx, cy, i) - 0.5) * 2.4, gy: cy + (tRand(cx, cy, i + 9) - 0.5) * 2.4, amt: 180, max: 180 });
        };
        const addFarm = (cx, cy, n) => {
            for (let i = 0; i < n; i++)
                nodes.push({ kind: 'farm', res: 'data', gx: cx + (tRand(cx, cy, i + 3) - 0.5) * 2.8, gy: cy + (tRand(cx, cy, i + 7) - 0.5) * 2.8, amt: 140, max: 140 });
        };

        // per-base resources (mirrored)
        addTrees(9, 3, 7);   addTrees(3, 9, 6);
        addMine(11, 7, 3);   addFarm(7, 11, 3);
        addTrees(MAP - 10, MAP - 4, 7); addTrees(MAP - 4, MAP - 10, 6);
        addMine(MAP - 12, MAP - 8, 3);  addFarm(MAP - 8, MAP - 12, 3);
        // contested middle
        const c = MAP / 2;
        addMine(c, c - 5, 3); addMine(c, c + 5, 3);
        addFarm(c - 5, c, 3); addFarm(c + 5, c, 3);
        addTrees(c, c, 5);

        // decorative ground details baked per tile
        return { nodes, spots: [{ gx: 5, gy: 5 }, { gx: MAP - 6, gy: MAP - 6 }] };
    }

    /* -------------------------------------------------------- game state */

    function newGame(labKey) {
        const map = makeMap();
        const enemyKey = labKey === 'deepcent' ? 'openbrain' : 'deepcent';
        const g = {
            t: 0, over: false, speed: 1,
            nodes: map.nodes,
            units: [], buildings: [], fx: [],
            players: [
                { id: 0, lab: labKey,  res: { hardware: 200, data: 150, compute: 100 }, ai: false, milestone: 0 },
                { id: 1, lab: enemyKey, res: { hardware: 200, data: 150, compute: 100 }, ai: true, aiT: 0, wave: 0, nextWave: 100 }
            ],
            sel: [], placing: null, cam: { x: 0, y: 0 },
            fogSeen: new Uint8Array(MAP * MAP),
            fogVis: new Uint8Array(MAP * MAP),
            toasts: [], attackCd: 0,
            stats: [{ gathered: 0, trained: 0, lost: 0 }, { gathered: 0, trained: 0, lost: 0 }]
        };
        g.ground = buildGround();
        map.spots.forEach((s, pid) => {
            addBuilding(g, pid, 'hq', s.gx, s.gy, true);
            for (let i = 0; i < 3; i++) addUnit(g, pid, 'engineer', s.gx + 2 + i * 0.7, s.gy + 2.4);
        });
        const hq = g.buildings[0];
        const p0 = iso(hq.gx, hq.gy);
        g.cam.x = p0.x; g.cam.y = p0.y;
        return g;
    }

    let UID = 1;
    function addUnit(g, owner, type, gx, gy) {
        const d = UNIT_DEFS[type];
        const u = { id: UID++, owner, type, gx, gy, hp: d.hp, maxHp: d.hp, state: 'idle',
            tx: gx, ty: gy, carry: 0, carryRes: null, node: null, target: null, buildTarget: null,
            gatherT: 0, atkT: 0, anim: Math.random() * 10, dir: 1 };
        g.units.push(u);
        return u;
    }
    function addBuilding(g, owner, type, gx, gy, instant) {
        const d = BLD_DEFS[type];
        const b = { id: UID++, owner, type, gx, gy, r: d.r,
            hp: instant ? d.hp : Math.max(1, d.hp * 0.08), maxHp: d.hp,
            done: !!instant, buildLeft: instant ? 0 : d.build,
            queue: [], queueT: 0, wonderT: type === 'agilab' ? WONDER_TIME : 0, rally: null };
        g.buildings.push(b);
        return b;
    }

    function popUsed(g, pid) { return g.units.filter(u => u.owner === pid).length + g.buildings.filter(b => b.owner === pid && b.done).reduce((s, b) => s + b.queue.length, 0); }
    function popCap(g, pid) { return g.buildings.filter(b => b.owner === pid && b.done && BLD_DEFS[b.type].pop).reduce((s, b) => s + BLD_DEFS[b.type].pop, 0); }

    function toast(g, msg) {
        g.toasts.push({ msg, until: g.t + 4 });
        if (g.toasts.length > 3) g.toasts.shift();
    }

    /* ------------------------------------------------------- unit orders */

    function orderGather(u, node) { u.state = 'gather'; u.node = node; u.target = null; u.buildTarget = null; }
    function orderMove(u, gx, gy) { u.state = 'move'; u.tx = gx; u.ty = gy; u.node = null; u.target = null; u.buildTarget = null; }
    function orderAttack(u, t) { u.state = 'attack'; u.target = t; u.node = null; u.buildTarget = null; }
    function orderBuild(u, b) { if (u.type !== 'engineer') return; u.state = 'build'; u.buildTarget = b; u.node = null; u.target = null; }

    function nearestDropoff(g, u) {
        let best = null, bd = 1e9;
        for (const b of g.buildings) {
            if (b.owner !== u.owner || !b.done || (b.type !== 'hq' && b.type !== 'datacenter')) continue;
            const d = dist(u, b);
            if (d < bd) { bd = d; best = b; }
        }
        return best;
    }
    function retargetNode(g, u, res, near) {
        let best = null, bd = 1e9;
        for (const n of g.nodes) {
            if (n.res !== res || n.amt <= 0) continue;
            const d = dist(near, n);
            if (d < bd && d < 9) { bd = d; best = n; }
        }
        return best;
    }
    function moveToward(u, tx, ty, dt, speed) {
        const dx = tx - u.gx, dy = ty - u.gy, d = Math.hypot(dx, dy);
        if (d < 0.06) return true;
        const s = Math.min(d, speed * dt);
        u.gx += dx / d * s; u.gy += dy / d * s;
        u.dir = (dx - dy) >= 0 ? 1 : -1;
        u.anim += dt * 9;
        return false;
    }

    /* --------------------------------------------------------- simulation */

    function tickUnit(g, u, dt) {
        const def = UNIT_DEFS[u.type];
        const p = g.players[u.owner];

        // bots auto-acquire
        if (u.type === 'bot' && (u.state === 'idle' || (u.state === 'move' && !u.forced))) {
            let best = null, bd = def.aggro;
            for (const e of g.units) if (e.owner !== u.owner && e.hp > 0) { const d = dist(u, e); if (d < bd) { bd = d; best = e; } }
            if (!best) for (const b of g.buildings) if (b.owner !== u.owner) { const d = dist(u, b); if (d < bd) { bd = d; best = b; } }
            if (best) orderAttack(u, best);
        }

        switch (u.state) {
            case 'move':
                if (moveToward(u, u.tx, u.ty, dt, def.speed)) { u.state = 'idle'; u.forced = false; }
                break;

            case 'gather': {
                const n = u.node;
                if (!n || n.amt <= 0) {
                    const nn = retargetNode(g, u, u.carryRes || (n && n.res) || 'hardware', u);
                    if (nn) { u.node = nn; } else if (u.carry > 0) { u.state = 'return'; } else { u.state = 'idle'; }
                    break;
                }
                if (dist(u, n) > 0.55) { moveToward(u, n.gx, n.gy, dt, def.speed); break; }
                u.carryRes = n.res;
                u.gatherT += dt;
                if (u.gatherT >= GATHER_TICK) {
                    u.gatherT = 0;
                    const bonus = LABS[p.lab].perk === n.res ? 1.2 : 1;
                    const take = Math.min(1 * bonus, n.amt);
                    n.amt -= 1;
                    u.carry += take;
                    if (u.carry >= CARRY) u.state = 'return';
                }
                break;
            }

            case 'return': {
                const b = nearestDropoff(g, u);
                if (!b) { u.state = 'idle'; break; }
                if (dist(u, b) > b.r + 0.4) { moveToward(u, b.gx, b.gy, dt, def.speed); break; }
                p.res[u.carryRes] += Math.round(u.carry);
                g.stats[u.owner].gathered += Math.round(u.carry);
                u.carry = 0;
                if (u.node && u.node.amt > 0) u.state = 'gather';
                else {
                    const nn = retargetNode(g, u, u.carryRes, u);
                    if (nn) { u.node = nn; u.state = 'gather'; } else u.state = 'idle';
                }
                break;
            }

            case 'build': {
                const b = u.buildTarget;
                if (!b || b.done || b.hp <= 0) { u.state = 'idle'; break; }
                if (dist(u, b) > b.r + 0.5) { moveToward(u, b.gx, b.gy, dt, def.speed); break; }
                u.anim += dt * 6;
                b.buildLeft -= dt;
                b.hp = Math.min(b.maxHp, b.hp + b.maxHp * dt / BLD_DEFS[b.type].build);
                if (b.buildLeft <= 0) {
                    b.done = true; b.hp = b.maxHp;
                    if (u.owner === 0) toast(g, `${BLD_DEFS[b.type].name} complete`);
                    if (b.type === 'agilab') toast(g, `${LABS[g.players[b.owner].lab].name} has begun the AGI training run!`);
                    u.state = 'idle';
                }
                break;
            }

            case 'attack': {
                const t = u.target;
                if (!t || t.hp <= 0) { u.state = 'idle'; u.target = null; break; }
                const range = (t.r || 0.3) + (def.range || 0.5);
                if (dist(u, t) > range) { moveToward(u, t.gx, t.gy, dt, def.speed); break; }
                u.atkT -= dt;
                if (u.atkT <= 0) {
                    u.atkT = 1.0;
                    t.hp -= def.atk || 3;
                    g.fx.push({ kind: 'hit', gx: t.gx, gy: t.gy, t: 0.25 });
                    if (t.owner === 0 && g.attackCd <= 0) { toast(g, 'Under attack!'); g.attackCd = 12; }
                }
                break;
            }
        }
    }

    function tickBuilding(g, b, dt) {
        if (!b.done) return;
        // training queue
        if (b.queue.length) {
            b.queueT -= dt;
            if (b.queueT <= 0) {
                const type = b.queue.shift();
                const spawn = addUnit(g, b.owner, type, b.gx + b.r + 0.4, b.gy + b.r + 0.4);
                g.stats[b.owner].trained++;
                if (b.rally) {
                    const n = g.nodes.find(n => n === b.rally && n.amt > 0);
                    if (n && type === 'engineer') orderGather(spawn, n);
                    else orderMove(spawn, b.rally.gx || b.rally[0], b.rally.gy || b.rally[1]);
                }
                if (b.queue.length) b.queueT = UNIT_DEFS[b.queue[0]].train;
            }
        }
        // wonder countdown
        if (b.type === 'agilab' && b.done && b.hp > 0) {
            b.wonderT -= dt;
            if (b.wonderT <= 0 && !g.over) endGame(g, b.owner === 0, b.owner === 0 ? 'Your AGI training run completed. The future is yours.' : `${LABS[g.players[b.owner].lab].name}'s training run completed first.`);
        }
    }

    function queueUnit(g, b, type) {
        const p = g.players[b.owner], d = UNIT_DEFS[type];
        if (!canAfford(p, d.cost)) { if (b.owner === 0) toast(g, `Not enough resources — needs ${fmtCost(d.cost)}`); return; }
        if (popUsed(g, b.owner) + 1 > popCap(g, b.owner)) { if (b.owner === 0) toast(g, 'Population cap reached — build an Office'); return; }
        pay(p, d.cost);
        if (!b.queue.length) b.queueT = d.train;
        b.queue.push(type);
    }

    function cleanup(g) {
        for (const u of g.units) if (u.hp <= 0) { g.stats[u.owner].lost++; }
        g.units = g.units.filter(u => u.hp > 0);
        for (const b of g.buildings) {
            if (b.hp <= 0) {
                g.fx.push({ kind: 'boom', gx: b.gx, gy: b.gy, t: 0.8 });
                if (b.type === 'hq' && !g.over)
                    endGame(g, b.owner !== 0, b.owner !== 0 ? 'Enemy headquarters destroyed!' : 'Your headquarters has fallen.');
                if (b.type === 'agilab' && b.done && b.owner !== 0) toast(g, 'Enemy AGI Lab destroyed!');
            }
        }
        g.buildings = g.buildings.filter(b => b.hp > 0);
        g.sel = g.sel.filter(s => s.hp > 0);
        g.nodes = g.nodes.filter(n => n.amt > 0 || n.kind === 'farm'); // farms leave stubble? keep simple: remove
    }

    /* ---------------------------------------------------------- enemy AI */

    function tickAI(g, dt) {
        const p = g.players[1];
        p.aiT -= dt;
        if (p.aiT > 0) return;
        p.aiT = 2;

        const myUnits = g.units.filter(u => u.owner === 1);
        const engs = myUnits.filter(u => u.type === 'engineer');
        const bots = myUnits.filter(u => u.type === 'bot');
        const blds = g.buildings.filter(b => b.owner === 1);
        const hq = blds.find(b => b.type === 'hq');
        if (!hq) return;

        // keep engineers busy, balanced across resources
        const want = ['hardware', 'data', 'compute', 'hardware', 'data', 'compute', 'hardware'];
        engs.forEach((u, i) => {
            if (u.state === 'idle') {
                const n = retargetNode(g, u, want[i % want.length], hq) || retargetNode(g, u, 'hardware', hq) || retargetNode(g, u, 'data', hq);
                if (n) orderGather(u, n);
            }
        });

        // train engineers up to 7
        if (engs.length < 7 && hq.queue.length < 2) queueUnit(g, hq, 'engineer');

        // office if near pop cap
        if (popUsed(g, 1) >= popCap(g, 1) - 1 && p.res.hardware >= 30 && !blds.some(b => b.type === 'office' && !b.done)) {
            const b = addBuilding(g, 1, 'office', hq.gx + 2 + tRand(g.t, 1, 1) * 3, hq.gy - 2.5);
            pay(p, BLD_DEFS.office.cost);
            const e = engs.find(u => u.state === 'idle' || u.state === 'gather');
            if (e) orderBuild(e, b);
        }

        // datacenter
        if (g.t > 55 && !blds.some(b => b.type === 'datacenter') && p.res.hardware >= 150) {
            const b = addBuilding(g, 1, 'datacenter', hq.gx - 3, hq.gy + 2.5);
            pay(p, BLD_DEFS.datacenter.cost);
            const e = engs[0]; if (e) orderBuild(e, b);
        }

        // bots
        const dc = blds.find(b => b.type === 'datacenter' && b.done);
        if (dc && bots.length < 6 && dc.queue.length < 2) queueUnit(g, dc, 'bot');

        // attack waves
        if (g.t > p.nextWave && bots.length >= 3) {
            p.nextWave = g.t + 85;
            const targets = g.buildings.filter(b => b.owner === 0);
            const t = targets[Math.floor(tRand(g.t, 5, 2) * targets.length)] || null;
            if (t) bots.forEach(u => orderAttack(u, t));
        }

        // wonder when rich
        if (g.t > 150 && !blds.some(b => b.type === 'agilab') && canAfford(p, BLD_DEFS.agilab.cost)) {
            const b = addBuilding(g, 1, 'agilab', hq.gx + 3, hq.gy + 3);
            pay(p, BLD_DEFS.agilab.cost);
            const e = engs.slice(0, 2); e.forEach(u => orderBuild(u, b));
            toast(g, `${LABS[p.lab].name} is constructing an AGI Lab!`);
        }
    }

    /* ---------------------------------------------------------------- fog */

    function updateFog(g) {
        g.fogVis.fill(0);
        const reveal = (gx, gy, r) => {
            const r2 = r * r;
            for (let y = Math.max(0, gy - r | 0); y <= Math.min(MAP - 1, gy + r | 0); y++)
                for (let x = Math.max(0, gx - r | 0); x <= Math.min(MAP - 1, gx + r | 0); x++)
                    if ((x - gx) * (x - gx) + (y - gy) * (y - gy) <= r2) { g.fogVis[y * MAP + x] = 1; g.fogSeen[y * MAP + x] = 1; }
        };
        for (const u of g.units) if (u.owner === 0) reveal(u.gx, u.gy, 5);
        for (const b of g.buildings) if (b.owner === 0) reveal(b.gx, b.gy, 7);
    }

    function endGame(g, won, why) {
        g.over = true;
        g.result = { won, why };
    }

    /* ============================================================ RENDER */
    /* True pixel-sprite renderer: every unit, building and resource node is
       pre-rendered onto a tiny offscreen canvas (1 cell = 1 pixel) and
       blitted at 2x with image smoothing disabled — chunky 90s sprites
       with dithered shading, not vector shapes. */

    const Z = 2;

    function diamond(ctx, x, y, w, h) {
        ctx.beginPath();
        ctx.moveTo(x, y - h / 2);
        ctx.lineTo(x + w / 2, y);
        ctx.lineTo(x, y + h / 2);
        ctx.lineTo(x - w / 2, y);
        ctx.closePath();
    }

    /* ---------- low-res pixel helpers ---------- */

    function pxCanvas(w, h) {
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        return { cv, c: cv.getContext('2d') };
    }
    function dith(c, x, y, w, h, base, shade, amt, seed) {
        c.fillStyle = base; c.fillRect(x, y, w, h);
        c.fillStyle = shade;
        for (let py = y; py < y + h; py++)
            for (let px = x; px < x + w; px++)
                if (tRand(px, py, seed) < amt) c.fillRect(px, py, 1, 1);
    }
    function oRect(c, x, y, w, h, col) {
        c.fillStyle = col || PAL.k;
        c.fillRect(x, y, w, 1); c.fillRect(x, y + h - 1, w, 1);
        c.fillRect(x, y, 1, h); c.fillRect(x + w - 1, y, 1, h);
    }

    const PAL = { k: '#1a1410', h: '#e5b83a', f: '#e8c39e', d: '#3a3226', m: '#6e6a5e', M: '#9a968a',
        e: '#ff5a3c', w: '#8a6f4d', W: '#b59a6e', s: '#7d745f', S: '#a99f88', r: '#b75434', R: '#d4744e',
        g: '#f5e2b0', y: '#e5c14f', b: '#7cc4e8', B: '#2b4a63', G: '#7cfc9b', c: '#fbf6ec', t: '#c9b892', T: '#b3a17a' };

    function mapSprite(rows, extra) {
        const h = rows.length, w = rows[0].length;
        const { cv, c } = pxCanvas(w, h);
        for (let y = 0; y < h; y++)
            for (let x = 0; x < w; x++) {
                const ch = rows[y][x];
                if (ch === '.' || ch === ' ') continue;
                c.fillStyle = (extra && extra[ch]) || PAL[ch];
                c.fillRect(x, y, 1, 1);
            }
        return cv;
    }

    /* ---------- hand-drawn pixel maps ---------- */

    const ENG_TOP = [
        '....hhhh....',
        '...hhhhhh...',
        '..hhhhhhhh..',
        '...ffffff...',
        '...fkffkf...',
        '...ffffff...',
        '..kPPPPPPk..',
        '.kPPPPPPPPk.',
        '.fPPPPPPPPf.',
        '.kPPPPPPPPk.',
        '..QQQQQQQQ..',
        '..kkkkkkkk..'
    ];
    const ENG_F0 = ENG_TOP.concat([
        '..ddd..ddd..',
        '..ddd..ddd..',
        '..ddd..ddd..',
        '..kkk..kkk..'
    ]);
    const ENG_F1 = ENG_TOP.concat([
        '...ddddd....',
        '...ddd.ddd..',
        '..ddd...ddd.',
        '..kkk...kkk.'
    ]);

    const BOT_MAP = [
        '..............',
        '...kkkkkkkk...',
        '..kMMMMMMMMk..',
        '..kMeeeeeeMk..',
        '..kMMMMMMMMk..',
        '..kPPPPPPPPk..',
        '.kmPPPPPPPPmk.',
        '.kmPPPPPPPPmk.',
        '.kmPPPPPPPPmk.',
        '..kQQQQQQQQk..',
        '...kkkkkkkk...',
        '..kddddddddk..',
        '.kdkddkddkddk.',
        '.kdkddkddkddk.',
        '..kkkkkkkkkk..'
    ];

    const CRATE = ['kkkkkk', 'kWWWWk', 'kWwwWk', 'kwWWwk', 'kwwwwk', 'kkkkkk'];
    const HAMMER = ['..MMM..', '..MMM..', '..kkk..', '...w...', '...w...', '...w...', '...w...'];

    const FLAG_MAP = [
        '..k.............',
        '..krrrrrrrrr....',
        '..krrRRrrrrrr...',
        '..krrrrrrrrr....',
        '..krrrrrrr......',
        '..krrrr.........',
        '..k.............',
        '..k.............',
        '..k.............',
        '..k.............',
        '..k.............',
        '..k.............',
        '..k.............',
        '..k.............',
        '.kkk............',
        '................'
    ];

    const IC_GEAR = [
        '..m..m..m.',
        '.mmmmmmmm.',
        '..mMMMMm..',
        '.mMM..MMm.',
        '.mM....Mm.',
        '.mM....Mm.',
        '.mMM..MMm.',
        '..mMMMMm..',
        '.mmmmmmmm.',
        '..m..m..m.'
    ];
    const IC_CHIP = [
        '..kkkkkk..',
        '.kBBBBBBk.',
        'kkBbbbBBkk',
        '.kBBBBBBk.',
        'kkBBbbbBkk',
        '.kBBBBBBk.',
        'kkBbBbBBkk',
        '.kBBBBBBk.',
        '..kkkkkk..',
        '..........'
    ];
    const IC_BOLT = [
        '.....yy...',
        '....yyy...',
        '...yyy....',
        '..yyyy....',
        '.yyyyyyy..',
        '....yyy...',
        '...yyy....',
        '..yyy.....',
        '..yy......',
        '..y.......'
    ];
    const IC_POP = [
        '....rr....',
        '...rrrr...',
        '..rrrrrr..',
        '.rrrrrrrr.',
        'rrrrrrrrrr',
        '.kccccccck',
        '.kccccccck',
        '.kccddccck',
        '.kccddccck',
        '.kkkkkkkkk'
    ];

    /* ---------- procedural building sprites (dithered pixel art) ---------- */

    function buildHQ(P) {
        const { cv, c } = pxCanvas(64, 54);
        dith(c, 4, 42, 56, 10, PAL.s, '#665e4c', .3, 1); oRect(c, 4, 42, 56, 10);
        c.fillStyle = PAL.S; c.fillRect(26, 46, 12, 6); oRect(c, 26, 46, 12, 6);
        dith(c, 10, 22, 44, 20, PAL.t, PAL.T, .3, 2); oRect(c, 10, 22, 44, 20);
        c.fillStyle = PAL.w;
        c.fillRect(10, 22, 2, 20); c.fillRect(52, 22, 2, 20); c.fillRect(31, 22, 2, 20); c.fillRect(10, 30, 44, 1);
        c.fillStyle = '#33261a'; c.fillRect(28, 32, 8, 10); oRect(c, 28, 32, 8, 10);
        c.fillStyle = PAL.g; c.fillRect(16, 26, 6, 5); oRect(c, 16, 26, 6, 5);
        c.fillStyle = PAL.g; c.fillRect(42, 26, 6, 5); oRect(c, 42, 26, 6, 5);
        for (let i = 0; i < 14; i++) {
            const wRow = 16 + i * 3.2 | 0;
            dith(c, 32 - wRow / 2 | 0, 8 + i, wRow, 1, i % 3 === 2 ? '#a34a2e' : PAL.r, PAL.R, .18, 3 + i);
        }
        c.fillStyle = PAL.k; c.fillRect(3, 22, 58, 1);
        c.fillStyle = PAL.R; c.fillRect(28, 7, 8, 2);
        c.fillStyle = PAL.w; c.fillRect(6, 10, 2, 32);
        c.fillStyle = P; c.fillRect(8, 11, 10, 7); oRect(c, 8, 11, 10, 7);
        return cv;
    }

    function buildOffice(P) {
        const { cv, c } = pxCanvas(36, 30);
        dith(c, 6, 14, 24, 14, PAL.t, PAL.T, .3, 15); oRect(c, 6, 14, 24, 14);
        c.fillStyle = PAL.w; c.fillRect(6, 14, 1, 14); c.fillRect(29, 14, 1, 14); c.fillRect(6, 20, 24, 1);
        for (let i = 0; i < 10; i++) {
            const wRow = 8 + i * 2.6 | 0;
            dith(c, 18 - wRow / 2 | 0, 4 + i, wRow, 1, i % 3 === 2 ? '#a34a2e' : PAL.r, PAL.R, .18, 16 + i);
        }
        c.fillStyle = PAL.k; c.fillRect(4, 14, 28, 1);
        c.fillStyle = '#33261a'; c.fillRect(15, 20, 6, 8); oRect(c, 15, 20, 6, 8);
        c.fillStyle = PAL.g; c.fillRect(9, 17, 4, 4); oRect(c, 9, 17, 4, 4);
        c.fillStyle = PAL.g; c.fillRect(23, 17, 4, 4); oRect(c, 23, 17, 4, 4);
        c.fillStyle = P; c.fillRect(16, 1, 4, 3);
        return cv;
    }

    const DC_LEDS = [[8, 18], [14, 18], [20, 18], [26, 18], [32, 18], [38, 18],
                     [8, 23], [14, 23], [20, 23], [26, 23], [32, 23], [38, 23]];

    function buildDC(P) {
        const { cv, c } = pxCanvas(60, 34);
        dith(c, 4, 13, 52, 17, '#4a4a44', '#3c3c36', .3, 5); oRect(c, 4, 13, 52, 17);
        dith(c, 2, 8, 56, 5, '#5c5c54', '#4e4e46', .25, 6); oRect(c, 2, 8, 56, 5);
        c.fillStyle = P; c.fillRect(3, 9, 54, 2);
        for (let i = 0; i < 4; i++) {
            c.fillStyle = PAL.m; c.fillRect(8 + i * 13, 3, 8, 5); oRect(c, 8 + i * 13, 3, 8, 5);
        }
        c.fillStyle = '#22301f';
        DC_LEDS.forEach(p => c.fillRect(p[0], p[1], 2, 2));
        c.fillStyle = '#2b2b26'; c.fillRect(46, 20, 7, 10); oRect(c, 46, 20, 7, 10);
        c.fillStyle = '#1f1f1b'; c.fillRect(5, 28, 50, 2);
        return cv;
    }

    const AGI_ORB = { x: 28, y: 9 };

    function buildAGI(P) {
        const { cv, c } = pxCanvas(56, 58);
        dith(c, 4, 44, 48, 12, '#b5a889', '#9c8f70', .3, 17); oRect(c, 4, 44, 48, 12);
        dith(c, 10, 32, 36, 12, '#c4b694', '#a89a78', .3, 18); oRect(c, 10, 32, 36, 12);
        dith(c, 18, 20, 20, 12, P, 'rgba(0,0,0,.25)', .3, 19); oRect(c, 18, 20, 20, 12);
        c.fillStyle = '#8f8367'; c.fillRect(24, 44, 8, 12); oRect(c, 24, 44, 8, 12);
        c.fillStyle = '#8f8367'; c.fillRect(25, 32, 6, 12); oRect(c, 25, 32, 6, 12);
        c.fillStyle = PAL.S; c.fillRect(26, 14, 4, 6); oRect(c, 26, 14, 4, 6);
        c.fillStyle = '#bfe4ff'; c.fillRect(26, 7, 5, 5); c.fillRect(25, 8, 7, 3);
        c.fillStyle = '#eaf6ff'; c.fillRect(27, 8, 2, 2);
        return cv;
    }

    function buildScaffold() {
        const { cv, c } = pxCanvas(48, 38);
        dith(c, 6, 30, 36, 6, '#7a6a4a', '#665735', .35, 20); oRect(c, 6, 30, 36, 6);
        c.fillStyle = PAL.w;
        c.fillRect(8, 6, 3, 26); c.fillRect(37, 6, 3, 26); c.fillRect(21, 2, 3, 30);
        c.fillRect(6, 14, 36, 2); c.fillRect(6, 24, 36, 2);
        for (let i = 0; i < 12; i++) c.fillRect(10 + i * 2, 28 - i, 2, 2);
        c.fillStyle = PAL.W; c.fillRect(6, 4, 36, 3); oRect(c, 6, 4, 36, 3);
        return cv;
    }

    function buildSalvage() {
        const { cv, c } = pxCanvas(28, 26);
        dith(c, 3, 10, 22, 14, PAL.w, '#6f5a3e', .3, 9); oRect(c, 3, 10, 22, 14);
        c.fillStyle = PAL.d;
        for (let i = 0; i < 3; i++) c.fillRect(6, 13 + i * 4, 16, 2);
        dith(c, 7, 3, 14, 8, PAL.W, '#98805a', .3, 10); oRect(c, 7, 3, 14, 8);
        c.fillStyle = PAL.d; c.fillRect(9, 6, 10, 2);
        c.fillStyle = PAL.y; c.fillRect(20, 14, 2, 2);
        c.fillStyle = PAL.G; c.fillRect(20, 18, 2, 2);
        return cv;
    }

    function buildMine(chips) {
        const { cv, c } = pxCanvas(32, 20);
        dith(c, 3, 9, 14, 10, '#6b665c', '#575349', .35, 11); oRect(c, 3, 9, 14, 10);
        dith(c, 12, 3, 14, 16, '#7a7468', '#635e52', .35, 12); oRect(c, 12, 3, 14, 16);
        dith(c, 23, 10, 7, 9, '#6b665c', '#575349', .35, 13); oRect(c, 23, 10, 7, 9);
        const spots = [[7, 12], [17, 7], [25, 13], [14, 14]];
        for (let i = 0; i < chips; i++) {
            c.fillStyle = '#f5d76b'; c.fillRect(spots[i][0], spots[i][1], 3, 3);
            c.fillStyle = '#fff3bd'; c.fillRect(spots[i][0], spots[i][1], 1, 1);
        }
        return cv;
    }

    const FARM_CELLS = [[14, 8], [24, 12], [18, 14], [28, 8]];

    function buildFarm() {
        const w = 40, h = 20;
        const { cv, c } = pxCanvas(w, h);
        for (let y = 0; y < h; y++) {
            const half = (y < h / 2 ? y + 1 : h - y) * (w / h);
            const x0 = Math.round(w / 2 - half), x1 = Math.round(w / 2 + half);
            for (let x = x0; x < x1; x++) {
                const edge = x === x0 || x === x1 - 1 || y === 0 || y === h - 1;
                c.fillStyle = edge ? '#142838' : (tRand(x, y, 14) < 0.3 ? '#1c3549' : '#24435e');
                c.fillRect(x, y, 1, 1);
            }
        }
        c.fillStyle = '#5fa8cc';
        c.fillRect(12, 6, 6, 1); c.fillRect(22, 6, 8, 1); c.fillRect(8, 10, 8, 1);
        c.fillRect(20, 10, 10, 1); c.fillRect(12, 14, 7, 1); c.fillRect(23, 14, 5, 1);
        c.fillStyle = '#7cc4e8';
        FARM_CELLS.forEach(p => c.fillRect(p[0], p[1], 2, 2));
        return cv;
    }

    /* ---------- sprite cache ---------- */

    let SPR = null, ICONS = {}, PORT = {};

    function ensureSprites() {
        if (SPR) return;
        SPR = { eng: {}, bot: {}, hq: {}, office: {}, dc: {}, agi: {} };
        for (const k of Object.keys(LABS)) {
            const P = LABS[k].color, Q = LABS[k].dark;
            const ex = { P, Q };
            SPR.eng[k] = [mapSprite(ENG_F0, ex), mapSprite(ENG_F1, ex)];
            SPR.bot[k] = mapSprite(BOT_MAP, ex);
            SPR.hq[k] = buildHQ(P);
            SPR.office[k] = buildOffice(P);
            SPR.dc[k] = buildDC(P);
            SPR.agi[k] = buildAGI(P);
        }
        SPR.crate = mapSprite(CRATE);
        SPR.hammer = mapSprite(HAMMER);
        SPR.flag = mapSprite(FLAG_MAP);
        SPR.salvage = buildSalvage();
        SPR.mineFull = buildMine(4);
        SPR.mineLow = buildMine(2);
        SPR.farm = buildFarm();
        SPR.scaffold = buildScaffold();
        ICONS.hardware = mapSprite(IC_GEAR).toDataURL();
        ICONS.data = mapSprite(IC_CHIP).toDataURL();
        ICONS.compute = mapSprite(IC_BOLT).toDataURL();
        ICONS.pop = mapSprite(IC_POP).toDataURL();
    }

    function iconTag(k) { return `<img class="pxi" src="${ICONS[k]}" alt="${k}">`; }
    function portTag(name) { return `<img class="pface" src="${PORT[name] || ''}" alt="">`; }

    function portFrom(cv) {
        const { cv: o, c } = pxCanvas(48, 48);
        c.imageSmoothingEnabled = false;
        const s = Math.max(1, Math.floor(Math.min(44 / cv.width, 44 / cv.height)));
        c.drawImage(cv, (48 - cv.width * s) / 2 | 0, (48 - cv.height * s) / 2 | 0, cv.width * s, cv.height * s);
        return o.toDataURL();
    }
    function rebuildPortraits(labKey) {
        PORT.engineer = portFrom(SPR.eng[labKey][0]);
        PORT.bot = portFrom(SPR.bot[labKey]);
        PORT.hq = portFrom(SPR.hq[labKey]);
        PORT.office = portFrom(SPR.office[labKey]);
        PORT.datacenter = portFrom(SPR.dc[labKey]);
        PORT.agilab = portFrom(SPR.agi[labKey]);
        PORT.map = portFrom(SPR.flag);
    }

    /* ---------- pre-rendered pixel terrain ---------- */

    function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
    const GRASS = ['#4e7a35', '#557f3a', '#47702f', '#5b8340'].map(hex2rgb);
    const GRASS_SH = ['#3f662a', '#456d2f', '#3a5c26', '#4c7034'].map(hex2rgb);
    const DRY = hex2rgb('#8a8148'), DRY_SH = hex2rgb('#78703c');

    function buildGround() {
        const gw = MAP * TW / Z, gh = MAP * TH / Z + TH / Z;
        const { cv, c } = pxCanvas(gw, gh);
        const img = c.createImageData(gw, gh);
        const d = img.data;
        const tw = TW / Z, th = TH / Z;
        const OX = MAP * TW / 2 / Z;
        for (let gy = 0; gy < MAP; gy++) for (let gx = 0; gx < MAP; gx++) {
            const p = iso(gx + 0.5, gy + 0.5);
            const cx0 = p.x / Z + OX, cy0 = p.y / Z;
            const r = tRand(gx, gy, 1);
            const dry = r > 0.87;
            const vi = (r * 4) | 0;
            const base = dry ? DRY : GRASS[vi], shade = dry ? DRY_SH : GRASS_SH[vi];
            for (let dy = -th / 2; dy < th / 2; dy++) {
                const span = (th / 2 - Math.abs(dy + 0.5)) * (tw / th);
                const x0 = Math.round(cx0 - span), x1 = Math.round(cx0 + span);
                const py = Math.floor(cy0 + dy);
                if (py < 0 || py >= gh) continue;
                for (let x = Math.max(0, x0); x < Math.min(gw, x1); x++) {
                    const col = tRand(x, py, 2) < 0.22 ? shade : base;
                    const i = (py * gw + x) * 4;
                    d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
                }
            }
        }
        c.putImageData(img, 0, 0);
        // grass tufts + pebbles on top
        for (let gy = 0; gy < MAP; gy++) for (let gx = 0; gx < MAP; gx++) {
            const p = iso(gx + 0.5, gy + 0.5);
            const cx0 = p.x / Z + OX, cy0 = p.y / Z;
            const r = tRand(gx, gy, 1);
            if (r <= 0.87 && tRand(gx, gy, 7) > 0.8) {
                c.fillStyle = '#2f5220';
                const tx = (cx0 + (tRand(gx, gy, 8) - .5) * 14) | 0, ty = (cy0 + (tRand(gx, gy, 9) - .5) * 5) | 0;
                c.fillRect(tx, ty, 2, 1); c.fillRect(tx + 1, ty - 1, 1, 1);
            }
            if (r > 0.87 && tRand(gx, gy, 6) > .6) { c.fillStyle = '#6a6234'; c.fillRect(cx0 | 0, cy0 | 0, 2, 2); }
        }
        return cv;
    }

    function drawTerrain(ctx, g, W, H) {
        const cx = W / 2 - g.cam.x, cy = H / 2 - g.cam.y;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(g.ground, Math.round(cx - MAP * TW / 2), Math.round(cy), g.ground.width * Z, g.ground.height * Z);
        for (let gy = 0; gy < MAP; gy++) for (let gx = 0; gx < MAP; gx++) {
            const seen = g.fogSeen[gy * MAP + gx], vis = g.fogVis[gy * MAP + gx];
            if (seen && vis) continue;
            const p = iso(gx + 0.5, gy + 0.5);
            const sx = p.x + cx, sy = p.y + cy;
            if (sx < -TW || sx > W + TW || sy < -TH || sy > H + TH) continue;
            ctx.fillStyle = seen ? 'rgba(10,12,10,.45)' : '#141210';
            diamond(ctx, sx, sy, TW + 2, TH + 2);
            ctx.fill();
        }
    }

    /* ---------- sprite blitting ---------- */

    function blit(ctx, cv, x, y, opts) {
        const w = cv.width * Z, h = cv.height * Z;
        if (opts && opts.flip) {
            ctx.save(); ctx.translate(Math.round(x), 0); ctx.scale(-1, 1);
            ctx.drawImage(cv, Math.round(-w / 2), Math.round(y - h), w, h);
            ctx.restore();
        } else {
            ctx.drawImage(cv, Math.round(x - w / 2), Math.round(y - h), w, h);
        }
    }
    function pxShadow(ctx, x, y, w) {
        ctx.fillStyle = 'rgba(10,8,5,.32)';
        ctx.fillRect(Math.round(x - w / 2), Math.round(y - 2), w, 3);
        ctx.fillRect(Math.round(x - w / 2) + 2, Math.round(y + 1), Math.max(2, w - 4), 2);
    }

    function drawSalvage(ctx, x, y, n) { pxShadow(ctx, x, y + 3, 40); blit(ctx, SPR.salvage, x, y + 8); }
    function drawMine(ctx, x, y, n) { pxShadow(ctx, x, y + 3, 48); blit(ctx, n.amt / n.max > 0.5 ? SPR.mineFull : SPR.mineLow, x, y + 8); }
    function drawFarm(ctx, x, y, n) {
        blit(ctx, SPR.farm, x, y + SPR.farm.height * Z / 2);
        if (Math.sin(performance.now() / 400 + x * 0.1) > 0) {
            ctx.fillStyle = '#9fdcff';
            const left = Math.round(x - SPR.farm.width * Z / 2), top = Math.round(y - SPR.farm.height * Z / 2);
            FARM_CELLS.forEach(p => ctx.fillRect(left + p[0] * Z, top + p[1] * Z, 4, 4));
        }
    }

    function drawEngineer(ctx, x, y, u) {
        const lab = G.players[u.owner].lab;
        const moving = u.state === 'move' || u.state === 'gather' || u.state === 'return' || u.state === 'build';
        const fr = SPR.eng[lab][moving ? ((u.anim * 1.6 | 0) % 2) : 0];
        pxShadow(ctx, x, y + 2, 16);
        blit(ctx, fr, x, y + 4, { flip: u.dir < 0 });
        if (u.carry > 0) {
            blit(ctx, SPR.crate, x + 9 * u.dir, y - 8);
            ctx.fillStyle = RES_META[u.carryRes] ? RES_META[u.carryRes].color : '#888';
            ctx.fillRect(Math.round(x + 9 * u.dir - 2), Math.round(y - 16), 4, 4);
        }
        if (u.state === 'build' || (u.state === 'gather' && u.node && dist(u, u.node) <= 0.6)) {
            const up = Math.sin(u.anim * 1.5) > 0;
            blit(ctx, SPR.hammer, x + 11 * u.dir, y - (up ? 22 : 14), { flip: u.dir < 0 });
        }
    }

    function drawBot(ctx, x, y, u) {
        const lab = G.players[u.owner].lab;
        pxShadow(ctx, x, y + 2, 20);
        const dy = (u.state === 'move' || u.state === 'attack') && ((u.anim * 3 | 0) % 2) ? -1 : 0;
        blit(ctx, SPR.bot[lab], x, y + 4 + dy, { flip: u.dir < 0 });
        if (u.state === 'attack' && u.atkT > 0.8) {
            ctx.fillStyle = '#ffd47a';
            ctx.fillRect(Math.round(x + 15 * u.dir), Math.round(y - 14), 4, 4);
            ctx.fillStyle = '#fff2c0';
            ctx.fillRect(Math.round(x + 15 * u.dir) + 1, Math.round(y - 13), 2, 2);
        }
    }

    function drawBuildingSprite(ctx, x, y, b, g) {
        const key = g.players[b.owner].lab;
        const baseY = y + b.r * TH * 0.45;
        if (!b.done) { blit(ctx, SPR.scaffold, x, baseY); return; }
        const cv = b.type === 'hq' ? SPR.hq[key]
            : b.type === 'office' ? SPR.office[key]
            : b.type === 'datacenter' ? SPR.dc[key]
            : SPR.agi[key];
        pxShadow(ctx, x, baseY - 1, Math.round(cv.width * Z * 0.85));
        blit(ctx, cv, x, baseY);
        const left = Math.round(x - cv.width * Z / 2), top = Math.round(baseY - cv.height * Z);
        if (b.type === 'datacenter') {
            const t = performance.now() / 160;
            DC_LEDS.forEach((p, i) => {
                const on = Math.sin(t + i * 1.3) > 0.1;
                ctx.fillStyle = on ? (i % 2 ? '#f0c040' : '#7CFC9B') : '#22301f';
                ctx.fillRect(left + p[0] * Z, top + p[1] * Z, 4, 4);
            });
        } else if (b.type === 'agilab') {
            const pl = 0.5 + 0.5 * Math.sin(performance.now() / 300);
            ctx.fillStyle = `rgba(160,215,255,${0.25 + pl * 0.3})`;
            ctx.fillRect(left + (AGI_ORB.x - 4) * Z, top + (AGI_ORB.y - 4) * Z, 18, 18);
            ctx.fillStyle = '#eaf6ff';
            ctx.fillRect(left + (AGI_ORB.x - 1) * Z, top + (AGI_ORB.y - 1) * Z, 6, 6);
            if (b.done && b.wonderT < WONDER_TIME) {
                ctx.strokeStyle = '#B75434'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(x, top + AGI_ORB.y * Z, 20, -Math.PI / 2, -Math.PI / 2 + (1 - b.wonderT / WONDER_TIME) * 6.283); ctx.stroke();
            }
        }
    }

    function drawHpBar(ctx, x, y, w, frac) {
        ctx.fillStyle = 'rgba(20,15,10,.7)'; ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, 5);
        ctx.fillStyle = frac > 0.55 ? '#57a05f' : frac > 0.25 ? '#d0a03a' : '#c04a35';
        ctx.fillRect(x - w / 2, y, w * frac, 3);
    }

    function render(ctx, g, W, H, hover) {
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#141210';
        ctx.fillRect(0, 0, W, H);
        drawTerrain(ctx, g, W, H);

        const cx = W / 2 - g.cam.x, cy = H / 2 - g.cam.y;
        const items = [];
        for (const n of g.nodes) items.push({ z: n.gx + n.gy, kind: 'node', o: n });
        for (const b of g.buildings) items.push({ z: b.gx + b.gy + b.r, kind: 'bld', o: b });
        for (const u of g.units) items.push({ z: u.gx + u.gy, kind: 'unit', o: u });
        items.sort((a, b2) => a.z - b2.z);

        const visible = o => {
            const ix = o.gx | 0, iy = o.gy | 0;
            if (ix < 0 || iy < 0 || ix >= MAP || iy >= MAP) return false;
            return g.fogVis[iy * MAP + ix] || (g.fogSeen[iy * MAP + ix] && o.kind !== 'unit');
        };

        for (const it of items) {
            const o = it.o;
            const ix = Math.max(0, Math.min(MAP - 1, o.gx | 0)), iy = Math.max(0, Math.min(MAP - 1, o.gy | 0));
            const vis = g.fogVis[iy * MAP + ix], seen = g.fogSeen[iy * MAP + ix];
            if (it.kind === 'unit' && !vis && o.owner !== 0) continue;
            if (!seen) continue;
            const p = iso(o.gx, o.gy);
            const x = p.x + cx, y = p.y + cy;
            if (x < -80 || x > W + 80 || y < -90 || y > H + 60) continue;
            ctx.globalAlpha = (it.kind !== 'unit' && !vis) ? 0.55 : 1;

            // selection ellipse
            if (g.sel.includes(o)) {
                ctx.strokeStyle = '#FBF6EC'; ctx.lineWidth = 1.6;
                ctx.beginPath(); ctx.ellipse(x, y + 2, (o.r ? o.r * 26 : 9), (o.r ? o.r * 12 : 4.5), 0, 0, 6.29); ctx.stroke();
            }

            if (it.kind === 'node') {
                if (o.kind === 'salvage') drawSalvage(ctx, x, y, o);
                else if (o.kind === 'farm') drawFarm(ctx, x, y, o);
                else drawMine(ctx, x, y, o);
            } else if (it.kind === 'bld') {
                drawBuildingSprite(ctx, x, y, o, g);
                if (o.hp < o.maxHp) drawHpBar(ctx, x, y - 52 * (o.r / 1.7) - 4, 40, o.hp / o.maxHp);
            } else {
                const lab = LABS[g.players[o.owner].lab];
                if (o.type === 'engineer') drawEngineer(ctx, x, y, o, lab.color);
                else drawBot(ctx, x, y, o, lab.color);
                if (o.hp < o.maxHp) drawHpBar(ctx, x, y - 24, 18, o.hp / o.maxHp);
            }
            if (it.kind !== 'unit' && !vis) ctx.globalAlpha = 1;
        }

        // effects
        for (const f of g.fx) {
            const p = iso(f.gx, f.gy); const x = p.x + cx, y = p.y + cy;
            if (f.kind === 'hit') {
                ctx.strokeStyle = `rgba(255,220,120,${f.t * 3})`; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(x - 5, y - 14); ctx.lineTo(x + 5, y - 22); ctx.moveTo(x + 5, y - 14); ctx.lineTo(x - 5, y - 22); ctx.stroke();
            } else if (f.kind === 'boom') {
                ctx.fillStyle = `rgba(200,90,40,${f.t})`;
                ctx.beginPath(); ctx.arc(x, y - 8, (0.8 - f.t) * 46, 0, 6.29); ctx.fill();
            } else if (f.kind === 'flag') {
                ctx.strokeStyle = `rgba(251,246,236,${f.t * 1.6})`; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.ellipse(x, y, 14 * (1 - f.t) + 4, 7 * (1 - f.t) + 2, 0, 0, 6.29); ctx.stroke();
            }
        }

        // building placement ghost
        if (g.placing && hover) {
            const d = BLD_DEFS[g.placing];
            const p = iso(hover.gx, hover.gy);
            const x = p.x + cx, y = p.y + cy;
            const ok = placementOk(g, g.placing, hover.gx, hover.gy);
            ctx.globalAlpha = 0.55;
            drawBuildingSprite(ctx, x, y, { type: g.placing, owner: 0, r: d.r, done: true, hp: d.hp, maxHp: d.hp, wonderT: WONDER_TIME }, g);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = ok ? 'rgba(140,220,140,.9)' : 'rgba(220,90,70,.9)'; ctx.lineWidth = 2;
            diamond(ctx, x, y, TW * d.r * 1.6, TH * d.r * 1.6); ctx.stroke();
        }

        // drag box
        if (g.drag && g.drag.active) {
            ctx.strokeStyle = '#FBF6EC'; ctx.lineWidth = 1;
            ctx.setLineDash([4, 3]);
            ctx.strokeRect(g.drag.x0, g.drag.y0, g.drag.x1 - g.drag.x0, g.drag.y1 - g.drag.y0);
            ctx.setLineDash([]);
        }
    }

    function placementOk(g, type, gx, gy) {
        const r = BLD_DEFS[type].r;
        if (gx - r < 0 || gy - r < 0 || gx + r > MAP || gy + r > MAP) return false;
        for (const b of g.buildings) if (dist({ gx, gy }, b) < r + b.r + 0.6) return false;
        for (const n of g.nodes) if (dist({ gx, gy }, n) < r + 0.9) return false;
        return true;
    }

    function renderMinimap(mm, g) {
        const ctx = mm.getContext('2d');
        const S = mm.width;
        ctx.fillStyle = '#10160e'; ctx.fillRect(0, 0, S, S);
        const k = S / MAP;
        for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
            if (!g.fogSeen[y * MAP + x]) continue;
            ctx.fillStyle = g.fogVis[y * MAP + x] ? '#3c5a2e' : '#28371f';
            ctx.fillRect(x * k, y * k, k + 0.5, k + 0.5);
        }
        for (const n of g.nodes) {
            const ix = n.gx | 0, iy = n.gy | 0;
            if (ix < 0 || iy < 0 || ix >= MAP || iy >= MAP || !g.fogSeen[iy * MAP + ix]) continue;
            ctx.fillStyle = RES_META[n.res].color;
            ctx.fillRect(n.gx * k - 1, n.gy * k - 1, 2.5, 2.5);
        }
        for (const b of g.buildings) {
            const ix = b.gx | 0, iy = b.gy | 0;
            if (b.owner !== 0 && (ix < 0 || iy < 0 || ix >= MAP || iy >= MAP || !g.fogSeen[iy * MAP + ix])) continue;
            ctx.fillStyle = LABS[g.players[b.owner].lab].color;
            ctx.fillRect(b.gx * k - 2, b.gy * k - 2, 4.5, 4.5);
        }
        for (const u of g.units) {
            const ix = u.gx | 0, iy = u.gy | 0;
            if (u.owner !== 0 && (ix < 0 || iy < 0 || ix >= MAP || iy >= MAP || !g.fogVis[iy * MAP + ix])) continue;
            ctx.fillStyle = LABS[g.players[u.owner].lab].color;
            ctx.fillRect(u.gx * k - 1, u.gy * k - 1, 2.5, 2.5);
        }
        // camera viewport
        const cvs = document.getElementById('aoa-canvas');
        if (cvs) {
            const wG = cvs.width / TW, hG = cvs.height / TH; // rough iso extents
            const cgx = (g.cam.x / (TW / 2) + g.cam.y / (TH / 2)) / 2;
            const cgy = (g.cam.y / (TH / 2) - g.cam.x / (TW / 2)) / 2;
            ctx.strokeStyle = 'rgba(251,246,236,.85)'; ctx.lineWidth = 1;
            ctx.strokeRect((cgx - wG / 4) * k, (cgy - hG / 4) * k, wG / 2 * k, hG / 2 * k);
        }
    }

    /* ================================================================ UI */

    let root = null, canvas = null, ctx2d = null, mmCanvas = null;
    let raf = 0, lastT = 0, keys = {}, mouse = { x: 0, y: 0, inside: false };

    function buildOverlay() {
        root = el('div');
        root.id = 'aoa-overlay';
        const style = el('style'); style.textContent = CSS;
        root.appendChild(style);
        document.body.appendChild(root);
        document.body.style.overflow = 'hidden';
        showTitle();
    }

    function showTitle() {
        root.querySelectorAll('.aoa-screen,#aoa-canvas,.aoa-topbar,.aoa-bottombar,.aoa-mmwrap,.aoa-toast,.aoa-wonderbanner').forEach(e => e.remove());
        const scr = el('div', 'aoa-screen');
        const labBtns = Object.keys(LABS).map(k => `
            <div class="aoa-lab" data-lab="${k}">
                <span class="dot" style="background:${LABS[k].color}"></span>
                <img class="sw" src="${SPR.hq[k].toDataURL()}" alt="">
                <b>${LABS[k].name}</b>
                <span>${LABS[k].perkText}</span>
                <span class="pick">Play as ${LABS[k].name} →</span>
            </div>`).join('');
        scr.appendChild(el('div', 'aoa-panel', `
            <h1>Age of Agents</h1>
            <h2>A Tiny RTS &mdash; hidden somewhere on this site</h2>
            <p>Three AI labs race to complete the first AGI training run. Gather <b>${iconTag('hardware')} Hardware</b>,
            <b>${iconTag('data')} Data</b> and <b>${iconTag('compute')} Compute</b>, grow your team of engineers, defend your lab &mdash;
            and either destroy the rival's headquarters or finish your AGI Lab and keep it standing for 60 seconds.</p>
            <div class="aoa-labs">${labBtns}</div>
            <div class="keys">
                left-drag select &middot; right-click to move / gather / attack &middot; arrows or edge-scroll to pan<br>
                H = go to HQ &middot; Esc = cancel / quit &middot; click minimap to jump
            </div>`));
        scr.querySelectorAll('.aoa-lab').forEach(b => b.addEventListener('click', () => startMatch(b.dataset.lab)));
        root.appendChild(scr);
    }

    function showEnd(g) {
        const scr = el('div', 'aoa-screen');
        const s = g.stats[0];
        const mins = Math.floor(g.t / 60), secs = Math.floor(g.t % 60);
        scr.appendChild(el('div', 'aoa-panel', `
            <h1>${g.result.won ? 'Victory' : 'Defeat'}</h1>
            <h2>${g.result.why}</h2>
            <div class="aoa-endstats">
                match time — ${mins}:${String(secs).padStart(2, '0')}<br>
                resources gathered — ${s.gathered} &middot; units trained — ${s.trained} &middot; units lost — ${s.lost}
            </div>
            <div class="aoa-btnrow">
                <button class="aoa-pill" id="aoa-again">Play again</button>
                <button class="aoa-pill ghost" id="aoa-quit">Back to the website</button>
            </div>`));
        root.appendChild(scr);
        scr.querySelector('#aoa-again').addEventListener('click', () => { scr.remove(); showTitle(); });
        scr.querySelector('#aoa-quit').addEventListener('click', close);
    }

    /* --------------------------------------------------------- match HUD */

    let hud = {};

    function startMatch(labKey) {
        root.querySelectorAll('.aoa-screen').forEach(e => e.remove());
        ensureSprites();
        rebuildPortraits(labKey);
        G = newGame(labKey);

        canvas = el('canvas'); canvas.id = 'aoa-canvas';
        root.appendChild(canvas);
        ctx2d = canvas.getContext('2d');
        resize();

        const top = el('div', 'aoa-topbar');
        top.innerHTML = `
            <span class="aoa-wordmark">Age of Agents</span>
            <div class="aoa-res"><span class="ic">${iconTag('hardware')}</span><b id="aoa-r-hardware">0</b></div>
            <div class="aoa-res"><span class="ic">${iconTag('data')}</span><b id="aoa-r-data">0</b></div>
            <div class="aoa-res"><span class="ic">${iconTag('compute')}</span><b id="aoa-r-compute">0</b></div>
            <div class="aoa-res aoa-pop"><span class="ic">${iconTag('pop')}</span><b id="aoa-r-pop">0/0</b></div>
            <span class="aoa-spacer"></span>
            <span class="aoa-timer" id="aoa-timer">0:00</span>
            <button class="aoa-close" id="aoa-x">Quit ✕</button>`;
        root.appendChild(top);
        top.querySelector('#aoa-x').addEventListener('click', close);

        const bottom = el('div', 'aoa-bottombar');
        bottom.innerHTML = `
            <div class="aoa-portrait" id="aoa-portrait"><div class="face"></div><small>Nothing selected</small></div>
            <div class="aoa-cmdgrid" id="aoa-cmds"></div>`;
        root.appendChild(bottom);

        const mmw = el('div', 'aoa-mmwrap');
        mmCanvas = el('canvas', 'aoa-minimap');
        mmCanvas.width = 150; mmCanvas.height = 150;
        mmw.appendChild(mmCanvas);
        root.appendChild(mmw);
        mmCanvas.addEventListener('mousedown', e => {
            const r = mmCanvas.getBoundingClientRect();
            const gx = (e.clientX - r.left) / r.width * MAP, gy = (e.clientY - r.top) / r.height * MAP;
            const p = iso(gx, gy); G.cam.x = p.x; G.cam.y = p.y;
        });

        hud = { top, bottom };
        bindInput();
        lastT = performance.now();
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
    }

    function resize() {
        if (!canvas) return;
        canvas.width = root.clientWidth;
        canvas.height = root.clientHeight;
    }

    /* ------------------------------------------------------ command card */

    function refreshHud(g) {
        ['hardware', 'data', 'compute'].forEach(k => {
            const e = document.getElementById('aoa-r-' + k);
            if (e) e.textContent = Math.floor(g.players[0].res[k]);
        });
        const popE = document.getElementById('aoa-r-pop');
        const used = popUsed(g, 0), cap = popCap(g, 0);
        if (popE) { popE.textContent = used + '/' + cap; popE.parentElement.classList.toggle('full', used >= cap); }
        const tm = document.getElementById('aoa-timer');
        if (tm) tm.textContent = Math.floor(g.t / 60) + ':' + String(Math.floor(g.t % 60)).padStart(2, '0');

        // wonder banners
        let banner = root.querySelector('.aoa-wonderbanner');
        const wonders = g.buildings.filter(b => b.type === 'agilab' && b.done);
        if (wonders.length) {
            const w = wonders.sort((a, b) => a.wonderT - b.wonderT)[0];
            const who = w.owner === 0 ? 'Your' : LABS[g.players[w.owner].lab].name + "'s";
            if (!banner) { banner = el('div', 'aoa-wonderbanner'); root.appendChild(banner); }
            banner.innerHTML = `${who} AGI training run — <b>${Math.ceil(w.wonderT)}s</b> remaining`;
        } else if (banner) banner.remove();

        renderCommandCard(g);
    }

    let lastCardKey = '';
    function renderCommandCard(g) {
        const sel = g.sel;
        const portrait = document.getElementById('aoa-portrait');
        const grid = document.getElementById('aoa-cmds');
        if (!portrait || !grid) return;

        const first = sel[0];
        let key = g.placing ? 'placing:' + g.placing : sel.map(s => s.id + ':' + Math.ceil(s.hp) + ':' + (s.queue ? s.queue.length : '')).join(',');
        const q = first && first.queue && first.queue.length ? Math.round(first.queueT * 10) : '';
        key += '|' + q + '|' + Object.values(g.players[0].res).map(v => Math.floor(v / 10)).join(',');
        if (key === lastCardKey) return;
        lastCardKey = key;

        if (g.placing) {
            portrait.innerHTML = `${portTag(g.placing)}<small>${BLD_DEFS[g.placing].name}</small>`;
            grid.innerHTML = `<div class="aoa-hintline">Click the map to place the ${BLD_DEFS[g.placing].name} — green outline means valid. Esc cancels.</div>`;
            return;
        }
        if (!first) {
            portrait.innerHTML = `${portTag('map')}<small>Nothing selected</small>`;
            grid.innerHTML = `<div class="aoa-hintline">Left-drag to select units. Right-click sends engineers to gather (salvage ${iconTag('hardware')}, data fields ${iconTag('data')}, GPU mines ${iconTag('compute')}), bots to attack.</div>`;
            return;
        }

        const p = g.players[0];
        const btn = (label, cost, hint, action, disabled) =>
            `<button class="aoa-cmd" data-a="${action}" ${disabled ? 'disabled' : ''}><b>${label}</b><span class="cost">${cost}</span>${hint ? `<span class="cost">${hint}</span>` : ''}</button>`;

        let html = '';
        if (first.type === 'engineer') {
            const n = sel.filter(s => s.type === 'engineer').length;
            portrait.innerHTML = `${portTag('engineer')}<small>Engineer${n > 1 ? ' ×' + n : ''}</small>
                <div class="hpbar"><i style="width:${first.hp / first.maxHp * 100}%"></i></div>`;
            html += btn('Office', fmtCost(BLD_DEFS.office.cost), '+5 population', 'place:office', !canAfford(p, BLD_DEFS.office.cost));
            html += btn('Datacenter', fmtCost(BLD_DEFS.datacenter.cost), 'trains bots', 'place:datacenter', !canAfford(p, BLD_DEFS.datacenter.cost));
            html += btn('AGI Lab', fmtCost(BLD_DEFS.agilab.cost), 'wonder', 'place:agilab', !canAfford(p, BLD_DEFS.agilab.cost));
            html += `<div class="aoa-hintline">Right-click a resource to gather. Engineers carry ${CARRY} per trip back to the HQ.</div>`;
        } else if (first.type === 'bot') {
            const n = sel.filter(s => s.type === 'bot').length;
            portrait.innerHTML = `${portTag('bot')}<small>Combat Bot${n > 1 ? ' ×' + n : ''}</small>
                <div class="hpbar"><i style="width:${first.hp / first.maxHp * 100}%"></i></div>`;
            html += `<div class="aoa-hintline">Right-click an enemy to attack, or the ground to move. Bots auto-engage nearby enemies.</div>`;
        } else if (first.maxHp) { // building
            const d = BLD_DEFS[first.type];
            portrait.innerHTML = `${portTag(first.type)}<small>${d.name}</small>
                <div class="hpbar"><i style="width:${first.hp / first.maxHp * 100}%"></i></div>`;
            if (!first.done) {
                html += `<div class="aoa-hintline">Under construction — right-click with engineers selected to help build.</div>`;
            } else if (first.type === 'hq') {
                const dEng = UNIT_DEFS.engineer;
                html += btn('Train Engineer', fmtCost(dEng.cost), '', 'train:engineer', !canAfford(p, dEng.cost));
            } else if (first.type === 'datacenter') {
                const dBot = UNIT_DEFS.bot;
                html += btn('Train Combat Bot', fmtCost(dBot.cost), '', 'train:bot', !canAfford(p, dBot.cost));
            } else if (first.type === 'agilab' && first.done) {
                html += `<div class="aoa-hintline">Training run in progress — defend this building!</div>`;
            }
            if (first.queue && first.queue.length) {
                const d0 = UNIT_DEFS[first.queue[0]];
                const frac = 1 - first.queueT / d0.train;
                html += `<div class="aoa-queue"><span>${d0.name} ×${first.queue.length}</span><div class="bar"><i style="width:${frac * 100}%"></i></div></div>`;
            }
        }
        grid.innerHTML = html;
        grid.querySelectorAll('.aoa-cmd').forEach(b => b.addEventListener('click', () => {
            const [verb, arg] = b.dataset.a.split(':');
            if (verb === 'train') { const bld = g.sel.find(s => s.queue); if (bld) queueUnit(g, bld, arg); }
            else if (verb === 'place') { g.placing = arg; }
            lastCardKey = '';
        }));
    }

    /* --------------------------------------------------------------- input */

    function screenToWorld(g, sx, sy) {
        const wx = sx - canvas.width / 2 + g.cam.x;
        const wy = sy - canvas.height / 2 + g.cam.y;
        return { gx: (wx / (TW / 2) + wy / (TH / 2)) / 2, gy: (wy / (TH / 2) - wx / (TW / 2)) / 2 };
    }

    function pickAt(g, sx, sy) {
        // pick topmost object near the cursor (screen-space)
        const cx = canvas.width / 2 - g.cam.x, cy = canvas.height / 2 - g.cam.y;
        let best = null, bd = 1e9;
        const test = (o, ry, rr) => {
            const p = iso(o.gx, o.gy);
            const dx = sx - (p.x + cx), dy = sy - (p.y + cy - ry);
            const d = Math.hypot(dx, dy * 1.6);
            if (d < rr && d < bd) { bd = d; best = o; }
        };
        for (const u of g.units) test(u, 10, 16);
        for (const b of g.buildings) test(b, 20 * b.r, 30 * b.r);
        for (const n of g.nodes) test(n, 8, 20);
        return best;
    }

    let inputBound = false;
    function bindInput() {
        if (inputBound) return;
        inputBound = true;

        window.addEventListener('resize', resize);
        window.addEventListener('keydown', onKey);
        window.addEventListener('keyup', e => { keys[e.key] = false; });

        canvas.addEventListener('contextmenu', e => e.preventDefault());
        canvas.addEventListener('mousemove', e => {
            const r = canvas.getBoundingClientRect();
            mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.inside = true;
            if (G && G.drag && G.drag.active) { G.drag.x1 = mouse.x; G.drag.y1 = mouse.y; }
        });
        canvas.addEventListener('mouseleave', () => { mouse.inside = false; });

        canvas.addEventListener('mousedown', e => {
            if (!G || G.over) return;
            if (e.button === 0) {
                if (G.placing) {
                    const w = screenToWorld(G, mouse.x, mouse.y);
                    tryPlace(G, w.gx, w.gy);
                    return;
                }
                G.drag = { active: true, x0: mouse.x, y0: mouse.y, x1: mouse.x, y1: mouse.y };
            } else if (e.button === 2) {
                if (G.placing) { G.placing = null; lastCardKey = ''; return; }
                rightClick(G);
            }
        });
        canvas.addEventListener('mouseup', e => {
            if (!G || e.button !== 0 || !G.drag) return;
            const d = G.drag; G.drag = null;
            const w = Math.abs(d.x1 - d.x0), h = Math.abs(d.y1 - d.y0);
            if (w < 6 && h < 6) { // click select
                const o = pickAt(G, mouse.x, mouse.y);
                G.sel = (o && (o.owner === 0)) ? [o] : [];
            } else { // box select own units
                const x0 = Math.min(d.x0, d.x1), x1 = Math.max(d.x0, d.x1);
                const y0 = Math.min(d.y0, d.y1), y1 = Math.max(d.y0, d.y1);
                const cx = canvas.width / 2 - G.cam.x, cy = canvas.height / 2 - G.cam.y;
                G.sel = G.units.filter(u => {
                    if (u.owner !== 0) return false;
                    const p = iso(u.gx, u.gy);
                    const sx = p.x + cx, sy = p.y + cy - 8;
                    return sx >= x0 && sx <= x1 && sy >= y0 && sy <= y1;
                });
            }
            lastCardKey = '';
        });
    }

    function tryPlace(g, gx, gy) {
        const type = g.placing;
        if (!placementOk(g, type, gx, gy)) { toast(g, 'Cannot build there'); return; }
        const p = g.players[0];
        if (!canAfford(p, BLD_DEFS[type].cost)) { toast(g, `Not enough resources — needs ${fmtCost(BLD_DEFS[type].cost)}`); g.placing = null; return; }
        pay(p, BLD_DEFS[type].cost);
        const b = addBuilding(g, 0, type, gx, gy);
        g.placing = null;
        const engs = g.sel.filter(s => s.type === 'engineer');
        (engs.length ? engs : g.units.filter(u => u.owner === 0 && u.type === 'engineer').slice(0, 1))
            .forEach(u => orderBuild(u, b));
        lastCardKey = '';
    }

    function rightClick(g) {
        const sel = g.sel.filter(s => s.type && UNIT_DEFS[s.type]); // units only
        if (!sel.length) return;
        const o = pickAt(g, mouse.x, mouse.y);
        const w = screenToWorld(g, mouse.x, mouse.y);
        if (o && o.res && o.amt > 0) { // resource node
            sel.forEach(u => { if (u.type === 'engineer') orderGather(u, o); else orderMove(u, o.gx, o.gy); });
            g.fx.push({ kind: 'flag', gx: o.gx, gy: o.gy, t: 0.5 });
        } else if (o && o.owner === 1) {
            sel.forEach(u => orderAttack(u, o));
            g.fx.push({ kind: 'flag', gx: o.gx, gy: o.gy, t: 0.5 });
        } else if (o && o.owner === 0 && o.maxHp && !o.done) { // help construct
            sel.forEach(u => { if (u.type === 'engineer') orderBuild(u, o); });
        } else {
            sel.forEach((u, i) => { orderMove(u, w.gx + (i % 3) * 0.5, w.gy + ((i / 3) | 0) * 0.5); u.forced = u.type === 'bot'; });
            g.fx.push({ kind: 'flag', gx: w.gx, gy: w.gy, t: 0.5 });
        }
    }

    function onKey(e) {
        keys[e.key] = true;
        if (!root) return;
        if (e.key === 'Escape') {
            if (G && G.placing) { G.placing = null; lastCardKey = ''; return; }
            close();
        }
        if (!G || G.over) return;
        if (e.key === 'h' || e.key === 'H') {
            const hq = G.buildings.find(b => b.owner === 0 && b.type === 'hq');
            if (hq) { const p = iso(hq.gx, hq.gy); G.cam.x = p.x; G.cam.y = p.y; G.sel = [hq]; lastCardKey = ''; }
        }
    }

    /* ------------------------------------------------------------- loop */

    function loop(now) {
        raf = requestAnimationFrame(loop);
        const dt = Math.min(0.05, (now - lastT) / 1000);
        lastT = now;
        if (!G) return;

        if (!G.over) {
            G.t += dt;
            G.attackCd -= dt;
            for (const u of G.units) tickUnit(G, u, dt);
            for (const b of G.buildings) tickBuilding(G, b, dt);
            tickAI(G, dt);
            cleanup(G);
            updateFog(G);
            for (const f of G.fx) f.t -= dt;
            G.fx = G.fx.filter(f => f.t > 0);
            G.toasts = G.toasts.filter(t => t.until > G.t);

            // camera pan: keys + edge scroll
            const pan = 520 * dt;
            if (keys.ArrowLeft || keys.a) G.cam.x -= pan;
            if (keys.ArrowRight || keys.d) G.cam.x += pan;
            if (keys.ArrowUp || keys.w) G.cam.y -= pan;
            if (keys.ArrowDown || keys.s) G.cam.y += pan;
            if (mouse.inside) {
                const M = 18;
                if (mouse.x < M) G.cam.x -= pan;
                if (mouse.x > canvas.width - M) G.cam.x += pan;
                if (mouse.y < M) G.cam.y -= pan;
                if (mouse.y > canvas.height - M) G.cam.y += pan;
            }
            const lim = iso(MAP, MAP);
            G.cam.x = Math.max(-lim.x, Math.min(lim.x, G.cam.x));
            G.cam.y = Math.max(0, Math.min(lim.y, G.cam.y));
        }

        const hover = mouse.inside ? screenToWorld(G, mouse.x, mouse.y) : null;
        render(ctx2d, G, canvas.width, canvas.height, hover);
        renderMinimap(mmCanvas, G);
        refreshHud(G);

        // toasts
        root.querySelectorAll('.aoa-toast').forEach(e => e.remove());
        G.toasts.forEach((t, i) => {
            const e = el('div', 'aoa-toast', t.msg);
            e.style.top = (78 + i * 46) + 'px';
            root.appendChild(e);
        });

        if (G.over && !G.endShown) {
            G.endShown = true;
            setTimeout(() => { if (root && G && G.over) showEnd(G); }, 900);
        }
    }

    /* -------------------------------------------------------- public API */

    function open() {
        if (root) return;
        ensureSprites();
        buildOverlay();
    }
    function close() {
        cancelAnimationFrame(raf);
        raf = 0; G = null;
        window.removeEventListener('resize', resize);
        window.removeEventListener('keydown', onKey);
        inputBound = false;
        if (root) { root.remove(); root = null; }
        canvas = null; ctx2d = null; mmCanvas = null;
        document.body.style.overflow = '';
    }

    window.AgentsRTS = { open, close };
})();
