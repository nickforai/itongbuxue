/* 我的世界 · 方块乐园（生存模式 v1：生命/饥饿/昼夜/怪物/战斗/床，Three.js） */
(function () {
  'use strict';

  var data = App.store.load();

  /* ---------- 物品定义 ---------- */
  var ITEMS = {
    grass: { name: '草方块', color: 0x66C74F, emoji: '🌱', kind: 'block' },
    dirt: { name: '泥土', color: 0x8B5A2B, emoji: '🟫', kind: 'block' },
    stone: { name: '石头', color: 0x9A9A9A, emoji: '🪨', kind: 'block' },
    wood: { name: '木头', color: 0x7A5230, emoji: '🪵', kind: 'block' },
    leaves: { name: '树叶', color: 0x2E8B2E, emoji: '🍃', kind: 'block' },
    sand: { name: '沙子', color: 0xE8D98A, emoji: '🏖️', kind: 'block' },
    brick: { name: '砖块', color: 0xB5453A, emoji: '🧱', kind: 'block' },
    glass: { name: '玻璃', color: 0xBDE9F5, emoji: '🪟', kind: 'block' },
    plank: { name: '木板', color: 0xC49A5C, emoji: '🟨', kind: 'block' },
    door: { name: '门', color: 0x9C6B30, emoji: '🚪', kind: 'block' },
    door_open: { name: '门（开）', color: 0x7A5230, emoji: '🚪', kind: 'block' },
    workbench: { name: '工作台', color: 0xC98A3D, emoji: '🛠️', kind: 'block' },
    bed: { name: '床', color: 0xE8508A, emoji: '🛏️', kind: 'block' },
    furnace: { name: '熔炉', color: 0x777777, emoji: '🔥', kind: 'block' },
    water: { name: '水', color: 0x3D9BE9, emoji: '💧', kind: 'block' },
    water_flow: { name: '流动的水', color: 0x4FB3E8, emoji: '💧', kind: 'block' },
    lava: { name: '岩浆', color: 0xF26D21, emoji: '🌋', kind: 'block' },
    lava_flow: { name: '流动的岩浆', color: 0xD9501E, emoji: '🌋', kind: 'block' },
    obsidian: { name: '黑曜石', color: 0x2A2A3A, emoji: '🪨', kind: 'block' },
    fence: { name: '栅栏', color: 0x8B5A2B, emoji: '🚧', kind: 'block' },
    fence_gate: { name: '栅栏门', color: 0x7A5230, emoji: '🚪', kind: 'block' },
    fence_gate_open: { name: '栅栏门（开）', color: 0x6E4520, emoji: '🚪', kind: 'block' },
    chest: { name: '箱子', color: 0xA9743F, emoji: '📦', kind: 'block' },
    coal_ore: { name: '煤矿石', color: 0x3A3A3A, emoji: '⬛', kind: 'block' },
    iron_ore: { name: '铁矿石', color: 0xB87333, emoji: '🟠', kind: 'block' },
    gold_ore: { name: '金矿石', color: 0xF2C94C, emoji: '🪙', kind: 'block' },
    diamond_ore: { name: '钻石矿石', color: 0x66E0E8, emoji: '💎', kind: 'block' },
    stick: { name: '木棒', color: 0xC49A5C, emoji: '🥢', kind: 'material' },
    wool: { name: '羊毛', color: 0xF5F5F5, emoji: '🐑', kind: 'material' },
    coal: { name: '煤', color: 0x2C2C2C, emoji: '⬛', kind: 'material' },
    raw_iron: { name: '粗铁', color: 0xB87333, emoji: '🟠', kind: 'material' },
    iron_ingot: { name: '铁锭', color: 0xD9D9E3, emoji: '🔩', kind: 'material' },
    gold: { name: '金', color: 0xF2C94C, emoji: '🪙', kind: 'material' },
    diamond: { name: '钻石', color: 0x66E0E8, emoji: '💎', kind: 'material' },
    arrow: { name: '箭', color: 0x8B5A2B, emoji: '➶', kind: 'material' },
    bow: { name: '弓', color: 0xA9743F, emoji: '🏹', kind: 'tool' },
    apple: { name: '苹果', emoji: '🍎', kind: 'food', value: 3 },
    raw_meat: { name: '生肉', emoji: '🍖', kind: 'food', value: 4 },
    cooked_meat: { name: '烤肉', emoji: '🥩', kind: 'food', value: 6 },
    sword: { name: '宝剑', emoji: '⚔️', kind: 'tool' },
    pickaxe: { name: '稿子', emoji: '⛏️', kind: 'tool' },
    axe: { name: '斧头', emoji: '🪓', kind: 'tool' },
    iron_sword: { name: '铁剑', emoji: '⚔️', kind: 'tool' },
    iron_pickaxe: { name: '铁镐', emoji: '⛏️', kind: 'tool' },
    iron_armor: { name: '铁甲', emoji: '🛡️', kind: 'armor', defense: 1 },
    diamond_armor: { name: '钻石甲', emoji: '🛡️', kind: 'armor', defense: 2 },
    bucket: { name: '铁桶', color: 0xC0C0C8, emoji: '🪣', kind: 'tool' },
    water_bucket: { name: '水桶', color: 0x3D9BE9, emoji: '🪣', kind: 'tool' },
    lava_bucket: { name: '岩浆桶', color: 0xF26D21, emoji: '🪣', kind: 'tool' },
    cannon: { name: '大炮', color: 0x3A3A4A, emoji: '💣', kind: 'tool' },
    cannonball: { name: '炮弹', color: 0x2C2C2C, emoji: '⚫', kind: 'material' },
    net: { name: '网', color: 0x4A4A5A, emoji: '🥅', kind: 'tool' },
    net_pig: { name: '网中的猪', color: 0xF4A7B9, emoji: '🐷', kind: 'tool' },
    net_cow: { name: '网中的牛', color: 0x8B5A2B, emoji: '🐮', kind: 'tool' },
    net_sheep: { name: '网中的羊', color: 0xFFFFFF, emoji: '🐑', kind: 'tool' }
  };

  var HOTBAR_FUNC = ['workbench', 'furnace', 'door', 'fence_gate', 'bed', 'water', 'lava'];
  var HOTBAR_MAT = ['grass', 'dirt', 'stone', 'plank', 'wood', 'fence', 'leaves', 'sand', 'brick', 'glass'];
  var HOTBAR = HOTBAR_FUNC.concat(HOTBAR_MAT);

  var RECIPES = [
    { id: 'planks', name: '木板', result: 'plank', count: 4, need: { wood: 1 } },
    { id: 'sticks', name: '木棒', result: 'stick', count: 4, need: { plank: 2 } },
    { id: 'sword', name: '宝剑', result: 'sword', count: 1, need: { plank: 2, stick: 1 } },
    { id: 'pickaxe', name: '稿子', result: 'pickaxe', count: 1, need: { plank: 3, stick: 2 } },
    { id: 'axe', name: '斧头', result: 'axe', count: 1, need: { plank: 3, stick: 2 } },
    { id: 'door', name: '门', result: 'door', count: 1, need: { plank: 4 } },
    { id: 'workbench', name: '工作台', result: 'workbench', count: 1, need: { plank: 4 } },
    { id: 'bed', name: '床', result: 'bed', count: 1, need: { wool: 3, plank: 3 } },
    { id: 'furnace', name: '熔炉', result: 'furnace', count: 1, need: { stone: 8 } },
    { id: 'iron_sword', name: '铁剑', result: 'iron_sword', count: 1, need: { iron_ingot: 2, stick: 1 } },
    { id: 'iron_pickaxe', name: '铁镐', result: 'iron_pickaxe', count: 1, need: { iron_ingot: 3, stick: 2 } },
    { id: 'iron_armor', name: '铁甲', result: 'iron_armor', count: 1, need: { iron_ingot: 4 } },
    { id: 'diamond_armor', name: '钻石甲', result: 'diamond_armor', count: 1, need: { diamond: 4 } },
    { id: 'bucket', name: '铁桶', result: 'bucket', count: 1, need: { iron_ingot: 3 } },
    { id: 'cannon', name: '大炮', result: 'cannon', count: 1, need: { iron_ingot: 20 } },
    { id: 'cannonball', name: '炮弹', result: 'cannonball', count: 1, need: { iron_ingot: 2 } },
    { id: 'fence', name: '栅栏', result: 'fence', count: 1, need: { plank: 1 } },
    { id: 'fence_gate', name: '栅栏门', result: 'fence_gate', count: 1, need: { plank: 2 } }
  ];

  var SMELT_RECIPES = [
    { id: 'smelt_iron', name: '炼铁锭', input: 'raw_iron', fuel: 'coal', result: 'iron_ingot', count: 1 },
    { id: 'smelt_meat', name: '烤肉', input: 'raw_meat', fuel: 'coal', result: 'cooked_meat', count: 1 }
  ];

  var TRADES = [
    { id: 't_diamond_ingot', name: '钻石换铁锭', give: { diamond: 1 }, get: { iron_ingot: 9 } },
    { id: 't_plank_arrow', name: '木板换箭', give: { plank: 3 }, get: { arrow: 64 } },
    { id: 't_plank_bow', name: '木板换弓', give: { plank: 3 }, get: { bow: 1 } },
    { id: 't_plank_meat', name: '木板换肉', give: { plank: 10 }, get: { raw_meat: 2 } },
    { id: 't_meat_bow', name: '肉换弓', give: { raw_meat: 1 }, get: { bow: 2 } },
    { id: 't_meat_plank', name: '肉换木板', give: { raw_meat: 1 }, get: { plank: 6 } },
    { id: 't_ingot_cannon', name: '铁锭换大炮', give: { iron_ingot: 20 }, get: { cannon: 1 } },
    { id: 't_ingot_cannonball', name: '铁锭换炮弹', give: { iron_ingot: 2 }, get: { cannonball: 1 } },
    { id: 't_wood_net', name: '木头换网', give: { wood: 3 }, get: { net: 1 } },
    { id: 't_plank_fence', name: '木板换栅栏', give: { plank: 1 }, get: { fence: 1 } },
    { id: 't_plank_fencegate', name: '木板换栅栏门', give: { plank: 2 }, get: { fence_gate: 1 } }
  ];

  var SAVE_KEY = 'xx3_mc_world_v1';
  var MC_BACKUP_KEY = 'xx3_mc_world_v1_backup';
  var world = {};
  var seed = 0;
  var changes = {};
  var backpack = {};
  var equipped = null;
  var armor = null;
  var chestContents = {};
  var freshChests = false;
  var fluidLevel = {};
  var fluidQueue = [];
  var fluidTimer = 0;
  var meshes = {};
  var meshList = [];
  var currentType = 'grass';
  var currentAction = 'break';

  /* ---------- 生存状态 ---------- */
  var mode = 'creative'; // creative | survival
  var hp = 10, hunger = 10;
  var time = 0.15;
  var DAY_LEN = 240;
  var nightAmt = 0;
  var onGround = false, vy = 0, fallStart = null;
  var invulnUntil = 0;
  var spawnPoint = null, bedPoint = null;
  var mobs = [];
  var mobGroups = [];

  function vkey(x, y, z) { return x + ',' + y + ',' + z; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function isSolid(x, y, z) {
    var b = world[vkey(x, y, z)];
    return !!b && b !== 'water' && b !== 'water_flow' && b !== 'lava' && b !== 'lava_flow';
  }

  function isWaterFluid(t) { return t === 'water' || t === 'water_flow'; }
  function isLavaFluid(t) { return t === 'lava' || t === 'lava_flow'; }
  function isFluid(t) { return isWaterFluid(t) || isLavaFluid(t); }
  function flowOf(t) { return isWaterFluid(t) ? 'water_flow' : 'lava_flow'; }

  var FLUID_MAX = { water: 3, lava: 2 };

  function activateFluid(k) {
    if (fluidQueue.indexOf(k) === -1) fluidQueue.push(k);
  }

  function setFluid(k, type, level) {
    world[k] = type;
    changes[k] = type;
    fluidLevel[k] = level;
    rebuildType(type);
    activateFluid(k);
  }

  function convertFluid(k) {
    var t = world[k];
    if (!isFluid(t)) return;
    var target = isLavaFluid(t) ? 'obsidian' : 'stone';
    delete fluidLevel[k];
    world[k] = target;
    changes[k] = target;
    rebuildType(target);
    playSound('place');
  }

  function checkFluidNeighbors(k) {
    var p = k.split(',').map(Number);
    var dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    for (var i = 0; i < dirs.length; i++) {
      var nk = vkey(p[0] + dirs[i][0], p[1] + dirs[i][1], p[2] + dirs[i][2]);
      if (isFluid(world[nk]) && isWaterFluid(world[k]) !== isWaterFluid(world[nk])) {
        convertFluid(nk);
      }
    }
  }

  function updateFluids(dt) {
    fluidTimer += dt;
    if (fluidTimer < 0.5) return;
    fluidTimer = 0;
    var processed = 0;
    while (fluidQueue.length && processed < 60) {
      var k = fluidQueue.shift();
      processed++;
      var t = world[k];
      if (!isFluid(t)) continue;
      var level = fluidLevel[k] || 0;
      var maxLevel = FLUID_MAX[isWaterFluid(t) ? 'water' : 'lava'];
      if (level >= maxLevel) continue;
      var p = k.split(',').map(Number);
      var below = vkey(p[0], p[1] - 1, p[2]);
      var bt = world[below];
      if (!bt || isFluid(bt)) {
        if (!bt) {
          setFluid(below, flowOf(t), level + 1);
          continue;
        }
        if (isWaterFluid(t) !== isWaterFluid(bt)) { convertFluid(below); continue; }
      }
      // 水平扩散（下方要有支撑）
      var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var i = 0; i < dirs.length && processed < 60; i++) {
        var nk = vkey(p[0] + dirs[i][0], p[1], p[2] + dirs[i][1]);
        if (!world[nk]) {
          var belowN = vkey(p[0] + dirs[i][0], p[1] - 1, p[2] + dirs[i][1]);
          if (world[belowN] && !isFluid(world[belowN])) {
            setFluid(nk, flowOf(t), level + 1);
            processed++;
          }
        } else if (isFluid(world[nk]) && isWaterFluid(t) !== isWaterFluid(world[nk])) {
          convertFluid(nk);
        }
      }
    }
  }

  function groundY(x, z) {
    for (var y = 40; y >= -8; y--) {
      if (isSolid(Math.floor(x), y, Math.floor(z))) return y + 1;
    }
    return 1;
  }

  var BOUND = 68; // 地图范围扩大 5 倍

  function heightAt(x, z) {
    return Math.max(-2, Math.round(
      1.8 * Math.sin(x * 0.25) * Math.cos(z * 0.3) +
      1.1 * Math.cos(x * 0.11 + z * 0.17) +
      0.6 * Math.sin((x + z) * 0.07)
    ));
  }

  function setVillageBlock(x, y, z, type) {
    var k = vkey(x, y, z);
    if (!world[k]) world[k] = type;
  }

  var CHEST_POOL = ['apple', 'raw_meat', 'cooked_meat', 'water', 'coal', 'raw_iron', 'iron_ingot', 'gold', 'stick', 'wool', 'plank'];

  function genChestItems() {
    var n = 3 + Math.floor(Math.random() * 4);
    var items = [];
    for (var i = 0; i < n; i++) items.push(CHEST_POOL[Math.floor(Math.random() * CHEST_POOL.length)]);
    return items;
  }

  /* 全村箱子刷新：随机物品 + 总共保证 10-20 颗钻石 */
  function genVillageLoot() {
    var keys = Object.keys(world).filter(function (k) { return world[k] === 'chest'; });
    keys.forEach(function (k) { chestContents[k] = genChestItems(); });
    var diamonds = 10 + Math.floor(Math.random() * 11); // 10-20
    for (var i = 0; i < diamonds; i++) {
      var k = keys[Math.floor(Math.random() * keys.length)];
      chestContents[k].push('diamond');
    }
  }

  function buildHouse(x0, z0, gy, rng) {
    var w = 5, d = 4, x, z, y;
    for (x = 0; x < w; x++) for (z = 0; z < d; z++) setVillageBlock(x0 + x, gy, z0 + z, 'plank');
    for (y = gy + 1; y <= gy + 2; y++) {
      for (x = 0; x < w; x++) {
        for (z = 0; z < d; z++) {
          if (x === 0 || x === w - 1 || z === 0 || z === d - 1) {
            if (z === 0 && x === 2 && y === gy + 1) continue; // 门洞
            setVillageBlock(x0 + x, y, z0 + z, 'plank');
          }
        }
      }
    }
    for (x = 0; x < w; x++) for (z = 0; z < d; z++) setVillageBlock(x0 + x, gy + 3, z0 + z, 'wood');
    // 箱子：优先放后角，被占则换屋内其他格子
    var spots = [[3, 2], [1, 1], [2, 1], [3, 1], [1, 2], [2, 2]];
    for (var s = 0; s < spots.length; s++) {
      var chestKey = vkey(x0 + spots[s][0], gy + 1, z0 + spots[s][1]);
      if (!world[chestKey]) {
        world[chestKey] = 'chest';
        break;
      }
    }
  }

  function generateVillage(rng) {
    var vx = 16, vz = -16;
    [[0, 0], [7, 2], [-7, 3], [2, 7], [-3, -7], [8, -5], [-8, 6], [6, -8]].forEach(function (hh) {
      var bx = vx + hh[0], bz = vz + hh[1];
      var gy = Math.max(0, heightAt(bx, bz));
      buildHouse(bx, bz, gy, rng);
    });
  }

  function generateWorld(s) {
    var rng = mulberry32(s);
    world = {};
    chestContents = {};
    var x, y, z;
    for (x = -BOUND; x <= BOUND; x++) {
      for (z = -BOUND; z <= BOUND; z++) {
        var h = heightAt(x, z);
        for (y = h; y >= h - 7; y--) {
          world[vkey(x, y, z)] = y === h ? 'grass' : y >= h - 3 ? 'dirt' : 'stone';
        }
        for (y = h + 1; y <= 0; y++) {
          world[vkey(x, y, z)] = 'water';
        }
      }
    }
    // 洞穴
    for (var c = 0; c < 12; c++) {
      var cx = Math.floor(rng() * 54) - 27;
      var cz = Math.floor(rng() * 54) - 27;
      var cy = -2 - Math.floor(rng() * 6);
      var clen = 6 + Math.floor(rng() * 8);
      var cdx = rng() * 2 - 1, cdz = rng() * 2 - 1;
      for (var i = 0; i < clen; i++) {
        var px = Math.floor(cx + cdx * i);
        var pz = Math.floor(cz + cdz * i);
        var py = cy + Math.floor(Math.sin(i * 0.6) * 2);
        for (var ox = 0; ox < 2; ox++) {
          for (var oz = 0; oz < 2; oz++) {
            var ck = vkey(px + ox, py, pz + oz);
            if (world[ck] === 'stone' || world[ck] === 'dirt') delete world[ck];
          }
        }
      }
    }
    // 树
    for (var t = 0; t < 30; t++) {
      var tx = Math.floor(rng() * (BOUND * 2 - 4)) - (BOUND - 2);
      var tz = Math.floor(rng() * (BOUND * 2 - 4)) - (BOUND - 2);
      var th = heightAt(tx, tz);
      if (th < 0) continue;
      for (y = th + 1; y <= th + 4; y++) world[vkey(tx, y, tz)] = 'wood';
      for (var dy = th + 3; dy <= th + 5; dy++) {
        var r = dy === th + 5 ? 1 : 2;
        for (x = -r; x <= r; x++) {
          for (z = -r; z <= r; z++) {
            if (Math.abs(x) === r && Math.abs(z) === r && dy === th + 4) continue;
            var lk = vkey(tx + x, dy, tz + z);
            if (!world[lk]) world[lk] = 'leaves';
          }
        }
      }
    }
    // 矿脉：煤/铁/金/钻石
    [
      { type: 'coal_ore', count: 60, y0: -1, y1: -5 },
      { type: 'iron_ore', count: 45, y0: -3, y1: -6 },
      { type: 'gold_ore', count: 25, y0: -4, y1: -7 },
      { type: 'diamond_ore', count: 18, y0: -6, y1: -8 }
    ].forEach(function (ore) {
      for (var v = 0; v < ore.count; v++) {
        var ox2 = Math.floor(rng() * (BOUND * 2 - 4)) - (BOUND - 2);
        var oz2 = Math.floor(rng() * (BOUND * 2 - 4)) - (BOUND - 2);
        var span = Math.abs(ore.y1 - ore.y0) + 1;
        var oy2 = ore.y0 - Math.floor(rng() * span);
        var vein = 2 + Math.floor(rng() * 2);
        var vdx = Math.floor(rng() * 3) - 1;
        var vdz = Math.floor(rng() * 3) - 1;
        for (var b = 0; b < vein; b++) {
          var ok = vkey(ox2 + vdx * b, oy2, oz2 + vdz * b);
          if (world[ok] === 'stone') world[ok] = ore.type;
        }
      }
    });
    generateVillage(rng);
    genVillageLoot();
  }

  function applyChanges() {
    Object.keys(changes).forEach(function (k) {
      if (changes[k] === null) delete world[k];
      else world[k] = changes[k];
    });
  }

  function loadWorld() {
    freshChests = false;
    try {
      var raw = JSON.parse(localStorage.getItem(SAVE_KEY) || localStorage.getItem(MC_BACKUP_KEY) || '{}');
      seed = raw.seed || (Date.now() % 100000 + 1);
      changes = raw.changes || {};
      backpack = raw.backpack || {};
      equipped = raw.equipped || null;
      armor = raw.armor || null;
      mode = raw.mode || 'creative';
    } catch (e) {
      seed = Date.now() % 100000 + 1;
      changes = {};
      backpack = {};
      equipped = null;
      armor = null;
      mode = 'creative';
    }
    generateWorld(seed);
    applyChanges();
    // 箱子每日刷新：同一天保留拿取进度，新的一天重新装满
    try {
      var st = JSON.parse(localStorage.getItem(SAVE_KEY) || localStorage.getItem(MC_BACKUP_KEY) || '{}');
      if (st.chestDate === App.todayStr()) {
        if (st.chestState) {
          Object.keys(st.chestState).forEach(function (k) { chestContents[k] = st.chestState[k]; });
        }
      } else {
        freshChests = true;
      }
    } catch (e) { /* ignore */ }
  }

  function saveNow() {
    try {
      var json = JSON.stringify({
        seed: seed, changes: changes, backpack: backpack, equipped: equipped, armor: armor,
        chestState: chestContents, chestDate: App.todayStr(), mode: mode
      });
      localStorage.setItem(SAVE_KEY, json);
      localStorage.setItem(MC_BACKUP_KEY, json); // 自动备份
    } catch (e) { /* 空间满就忽略 */ }
  }

  var saveTimer = null;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 600);
  }

  /* ---------- 背包与合成 ---------- */
  function addItem(id, n) {
    backpack[id] = (backpack[id] || 0) + n;
    scheduleSave();
  }

  function canCraft(recipe) {
    return Object.keys(recipe.need).every(function (id) {
      return (backpack[id] || 0) >= recipe.need[id];
    });
  }

  function craft(recipe) {
    if (!canCraft(recipe)) { App.toast('材料不够哦'); return false; }
    Object.keys(recipe.need).forEach(function (id) {
      backpack[id] -= recipe.need[id];
      if (backpack[id] <= 0) delete backpack[id];
    });
    backpack[recipe.result] = (backpack[recipe.result] || 0) + recipe.count;
    scheduleSave();
    renderBackpack();
    renderCrafting();
    App.toast('合成成功：' + ITEMS[recipe.result].name + ' ×' + recipe.count + '！');
    return true;
  }

  function smelt(recipe) {
    if ((backpack[recipe.input] || 0) < 1 || (backpack[recipe.fuel] || 0) < 1) {
      App.toast('需要 ' + ITEMS[recipe.input].name + ' 和 ' + ITEMS[recipe.fuel].name);
      return false;
    }
    backpack[recipe.input] -= 1;
    backpack[recipe.fuel] -= 1;
    if (backpack[recipe.input] <= 0) delete backpack[recipe.input];
    if (backpack[recipe.fuel] <= 0) delete backpack[recipe.fuel];
    backpack[recipe.result] = (backpack[recipe.result] || 0) + recipe.count;
    scheduleSave();
    renderBackpack();
    renderSmelt();
    App.toast('烧炼成功：' + ITEMS[recipe.result].name + ' ×' + recipe.count + '！');
    return true;
  }

  function canAfford(give) {
    return Object.keys(give).every(function (id) {
      return (backpack[id] || 0) >= give[id];
    });
  }

  function trade(t) {
    if (!canAfford(t.give)) { App.toast('材料不够哦'); return false; }
    Object.keys(t.give).forEach(function (id) {
      backpack[id] -= t.give[id];
      if (backpack[id] <= 0) delete backpack[id];
    });
    Object.keys(t.get).forEach(function (id) {
      backpack[id] = (backpack[id] || 0) + t.get[id];
    });
    scheduleSave();
    renderBackpack();
    renderTrade();
    App.toast('交换成功：' + Object.keys(t.get).map(function (id) {
      return ITEMS[id].name + '×' + t.get[id];
    }).join('、') + '！');
    return true;
  }

  function eatItem(id) {
    var it = ITEMS[id];
    if (!it || it.kind !== 'food') return;
    if (hunger >= 10) { App.toast('肚子饱饱的，吃不下啦'); return; }
    if ((backpack[id] || 0) < 1) return;
    backpack[id] -= 1;
    if (backpack[id] <= 0) delete backpack[id];
    hunger = Math.min(10, hunger + it.value);
    scheduleSave();
    updateHud();
    renderBackpack();
    App.toast('吃了' + it.name + '，🍗+' + it.value + '！');
    playSound('eat');
  }

  /* ---------- 大厅（模式选择 + 星星兑换） ---------- */
  function getSavedMode() {
    try {
      var raw = JSON.parse(localStorage.getItem(SAVE_KEY) || localStorage.getItem(MC_BACKUP_KEY) || '{}');
      return raw.mode || 'creative';
    } catch (e) { return 'creative'; }
  }

  function renderLobby() {
    data = App.store.load();
    App.el('mcChancePill').textContent = '⛏️ ' + (data.mcChances || 0);
    App.el('mcJifenPill').textContent = '⭐ ' + (data.balance || 0);
    App.el('mcLobbyJifen').textContent = data.balance || 0;
    App.el('mcLobbyChances').textContent = data.mcChances || 0;
    var redeem = App.el('mcRedeemBtn');
    redeem.disabled = (data.balance || 0) < 10;
    redeem.textContent = (data.balance || 0) >= 10
      ? '🔄 兑换 1 次机会（-10 星星，现有 ' + data.balance + '）'
      : '🔄 兑换 1 次机会（还差 ' + (10 - (data.balance || 0)) + ' 颗星星）';
    var start = App.el('mcStartBtn');
    start.disabled = (data.mcChances || 0) < 1;
    start.textContent = (data.mcChances || 0) >= 1
      ? '🚀 开始游戏（还有 ' + data.mcChances + ' 次机会）'
      : '🚀 星星不够 10 颗，先做作业吧';

    mode = getSavedMode();
    renderModeButtons();
  }

  function renderModeButtons() {
    var c = App.el('mcModeCreative');
    var s = App.el('mcModeSurvival');
    c.classList.toggle('on', mode === 'creative');
    s.classList.toggle('on', mode === 'survival');
  }

  App.el('mcModeCreative').addEventListener('click', function () { mode = 'creative'; renderModeButtons(); App.toast('创造模式：无限方块、自由飞行'); });
  App.el('mcModeSurvival').addEventListener('click', function () { mode = 'survival'; renderModeButtons(); App.toast('生存模式：砍树挖矿、天黑小心怪物'); });

  App.el('mcRedeemBtn').addEventListener('click', function () {
    data = App.store.load();
    if (App.redeemMcChance(data)) {
      App.logActivity(data, '兑换我的世界机会');
      App.toast('兑换成功，+1 次机会！');
      renderLobby();
    } else {
      App.toast('星星还不够 10 颗哦');
    }
  });

  App.el('mcStartBtn').addEventListener('click', function () {
    data = App.store.load();
    if (!App.useMcChance(data)) { App.toast('没有机会啦'); return; }
    App.logActivity(data, '玩我的世界（' + (mode === 'survival' ? '生存' : '创造') + '）');
    startGame();
  });

  App.el('mcExit').addEventListener('click', function () {
    window.location.href = 'index.html';
  });

  /* ---------- 限时：每局 10 分钟，最后 20 秒提醒 ---------- */
  function startTimer() {
    stopTimer = App.countdown(600, 20, {
      onWarn: function () {
        App.el('mcTimer').classList.add('warn');
        App.toast('⏰ 时间还剩 20 秒，抓紧时间哦！');
      },
      onTick: function (left) {
        App.el('mcTimer').textContent = left > 20 ? '⏰ ' + App.formatClock(left) : '⏰ 只剩 ' + left + ' 秒';
      },
      onEnd: timeUp
    });
  }

  function timeUp() {
    if (stopTimer) stopTimer();
    saveNow();
    App.el('mcTimeUp').classList.remove('hidden');
  }

  App.el('mcTimeHome').addEventListener('click', function () { window.location.href = 'index.html'; });
  App.el('mcTimeLobby').addEventListener('click', function () { window.location.href = 'minecraft.html'; });

  /* ---------- Three.js 场景 ---------- */
  var renderer = null, scene = null, camera = null, highlight = null, raycaster = null, clock = null;
  var yaw = Math.PI, pitch = -0.45;
  var cameraEuler = null;

  function startGame() {
    var chosenMode = mode;
    paintMode = false;
    if (stopTimer) stopTimer();
    App.el('mcLobby').classList.add('hidden');
    App.el('mcGame').classList.remove('hidden');
    App.el('mcUp').textContent = chosenMode === 'survival' ? '⤒' : '▲';
    App.el('mcDown').classList.toggle('hidden', chosenMode === 'survival');
    App.el('mcPaintBtn').classList.toggle('hidden', chosenMode !== 'creative');
    App.el('mcPaintBtn').classList.remove('on');
    try {
      init3D(chosenMode);
      startTimer();
    } catch (e) {
      App.toast('此设备不支持 3D 游戏');
      console.error('3D init failed:', e);
      App.el('mcLobby').classList.remove('hidden');
      App.el('mcGame').classList.add('hidden');
    }
  }

  function init3D(chosenMode) {
    loadWorld();
    mode = chosenMode || mode;
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    App.el('mcGame').appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 32, 70);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    var startY = mode === 'survival' ? groundY(0, 8) + 1.7 : 9;
    camera.position.set(0, startY, 8);
    spawnPoint = { x: 0, y: groundY(0, 8), z: 8 };
    cameraEuler = new THREE.Euler(0, 0, 0, 'YXZ');

    scene.add(new THREE.AmbientLight(0xffffff, 0.68));
    var sun = new THREE.DirectionalLight(0xffffff, 0.72);
    sun.position.set(30, 60, 20);
    scene.add(sun);

    buildMeshes();

    highlight = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02)),
      new THREE.LineBasicMaterial({ color: 0x141414, transparent: true, opacity: 0.85 })
    );
    highlight.visible = false;
    scene.add(highlight);

    raycaster = new THREE.Raycaster();
    clock = new THREE.Clock();

    hp = 10; hunger = 10; time = 0.15; vy = 0; onGround = false; fallStart = null;
    bedPoint = null;
    spawnSheep(3);
    spawnVillagers(5);
    spawnPigs(2);
    spawnCows(1);
    spawnFish(3);
    if (freshChests) {
      topUpAnimals();
      App.toast('🌅 新的一天，箱子和动物都刷新了！');
    }

    bindControls();
    renderHotbar();
    updateLabel();
    updateHud();
    window.addEventListener('resize', onResize);
    animate();

    window.__mc = {
      addItem: addItem,
      craft: function (id) {
        var r = RECIPES.find(function (x) { return x.id === id; });
        return r ? craft(r) : false;
      },
      smelt: function (id) {
        var r = SMELT_RECIPES.find(function (x) { return x.id === id; });
        return r ? smelt(r) : false;
      },
      trade: function (id) {
        var t = TRADES.find(function (x) { return x.id === id; });
        return t ? trade(t) : false;
      },
      openTrade: openTrade,
      backpack: backpack,
      mode: function () { return mode; },
      mobs: function () { return mobs.length; },
      hostiles: function () { return mobs.filter(function (m) { return m.type === 'zombie' || m.type === 'skeleton'; }).length; },
      setTime: function (t) { time = t; },
      selectItem: selectItem,
      dropItem: dropItem,
      currentType: function () { return currentType; },
      ores: function () {
        return Object.keys(world).filter(function (k) { return world[k] === 'coal_ore' || world[k] === 'iron_ore'; }).length;
      },
      placeAt: placeItemAt,
      blockAt: function (x, y, z) { return world[vkey(x, y, z)] || null; },
      villagers: function () { return mobs.filter(function (m) { return m.type === 'villager'; }).length; },
      waterCount: function () { return Object.keys(world).filter(function (k) { return world[k] === 'water'; }).length; },
      chestCount: function () { return Object.keys(world).filter(function (k) { return world[k] === 'chest'; }).length; },
      findChest: function () {
        return Object.keys(world).find(function (k) { return world[k] === 'chest'; }) || null;
      },
      chestAt: function (key) { return (chestContents[key] || []).slice(); },
      chestDiamonds: function () {
        var total = 0;
        Object.keys(chestContents).forEach(function (k) {
          (chestContents[k] || []).forEach(function (id) { if (id === 'diamond') total++; });
        });
        return total;
      },
      takeChest: function (key, idx) { currentChestKey = key; takeChestItem(idx); },
      armor: function () { return armor; },
      isNight: function () { return isNight(); },
      oreCount: function (type) {
        return Object.keys(world).filter(function (k) { return world[k] === type; }).length;
      },
      forceSpawnHostile: function () {
        var ang = rnd(0, Math.PI * 2);
        var rad = rnd(16, 26);
        var mx = clamp(Math.round(camera.position.x + Math.cos(ang) * rad), -BOUND, BOUND);
        var mz = clamp(Math.round(camera.position.z + Math.sin(ang) * rad), -BOUND, BOUND);
        var gy = groundY(mx, mz);
        if (gy <= 32) addMob(Math.random() < 0.5 ? 'zombie' : 'skeleton', mx, gy, mz);
      },
      forceTimeUp: timeUp,
      sheepLying: function () {
        return mobs.filter(function (m) { return m.type === 'sheep'; }).every(function (m) { return !!m.lying; });
      },
      animalCount: function (type) {
        return mobs.filter(function (m) { return m.type === type; }).length;
      },
      dropMeat: function (type) {
        var before = backpack.raw_meat || 0;
        mobDrops({ type: type });
        return (backpack.raw_meat || 0) - before;
      },
      bounds: function () { return BOUND; },
      shoot: shootProjectile,
      explodeAt: explodeAt,
      removeItem: function (id, n) {
        backpack[id] = (backpack[id] || 0) - n;
        if (backpack[id] <= 0) delete backpack[id];
        scheduleSave();
      },
      catchFirst: function (type) {
        var mob = mobs.find(function (m) { return m.type === type; });
        if (!mob || (backpack.net || 0) < 1) return false;
        tryCatchAnimal(mob);
        return true;
      },
      releaseNet: function (type) {
        releaseAnimal('net_' + type);
      },
      paintAction: paintAction,
      paintPlaceAt: function (x, y, z) { return putBlock(currentType, x, y, z); },
      eraseVoxel: eraseVoxel,
      setPaint: function (v) {
        paintMode = !!v;
        App.el('mcPaintBtn').classList.toggle('on', paintMode);
        updateLabel();
      },
      pos: function () {
        return { x: camera.position.x, y: camera.position.y, z: camera.position.z };
      },
      targetInfo: function () {
        var t = getTarget();
        return t ? { p: [t.point.x, t.point.y, t.point.z], n: [t.normal.x, t.normal.y, t.normal.z] } : null;
      },
      dir: function () {
        var v = new THREE.Vector3();
        camera.getWorldDirection(v);
        return v.toArray();
      },
      rayHits: function () {
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        return raycaster.intersectObjects(meshList, false).length;
      },
      use: function () {
        doUse();
      },
      lookAt: function (x, y, z) {
        var dx = x - camera.position.x;
        var dy = y - camera.position.y;
        var dz = z - camera.position.z;
        yaw = Math.atan2(-dx, -dz);
        pitch = Math.atan2(dy, Math.hypot(dx, dz));
      }
    };
  }

  function onResize() {
    if (!renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function materialFor(id) {
    var b = ITEMS[id];
    if (id === 'glass' || id === 'water' || id === 'water_flow') {
      return new THREE.MeshLambertMaterial({ color: b.color, transparent: true, opacity: id === 'glass' ? 0.35 : 0.55, depthWrite: false });
    }
    return new THREE.MeshLambertMaterial({ color: b.color });
  }

  function buildMeshes() {
    meshList.forEach(function (m) { scene.remove(m); });
    meshes = {};
    meshList = [];
    Object.keys(ITEMS).forEach(function (id) {
      if (ITEMS[id].kind === 'block') rebuildType(id);
    });
  }

  function rebuildType(id) {
    if (meshes[id]) {
      scene.remove(meshes[id]);
      meshList = meshList.filter(function (m) { return m !== meshes[id]; });
      delete meshes[id];
    }
    if (!ITEMS[id] || ITEMS[id].kind !== 'block') return;
    var coords = [];
    Object.keys(world).forEach(function (k) {
      if (world[k] === id) {
        var p = k.split(',');
        coords.push([+p[0], +p[1], +p[2]]);
      }
    });
    if (!coords.length) return;
    var geom = new THREE.BoxGeometry(1, 1, 1);
    var useRot = false;
    if (id === 'fence') geom = new THREE.BoxGeometry(0.2, 1, 0.2);
    else if (id === 'door_open' || id === 'fence_gate_open') { geom = new THREE.BoxGeometry(1, 1, 0.18); useRot = true; }
    var mesh = new THREE.InstancedMesh(geom, materialFor(id), coords.length);
    var m = new THREE.Matrix4();
    coords.forEach(function (c, i) {
      if (useRot) {
        m.makeRotationY(Math.PI / 2);
        m.setPosition(c[0] + 0.5, c[1] + 0.5, c[2] + 0.5);
      } else {
        m.makeTranslation(c[0] + 0.5, c[1] + 0.5, c[2] + 0.5);
      }
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = coords.length;
    scene.add(mesh);
    meshes[id] = mesh;
    meshList.push(mesh);
  }

  function getTarget() {
    return getTargetAt(window.innerWidth / 2, window.innerHeight / 2);
  }

  function getTargetAt(cx, cy) {
    var ndcX = (cx / window.innerWidth) * 2 - 1;
    var ndcY = -(cy / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    var hits = raycaster.intersectObjects(meshList, false);
    if (!hits.length) return null;
    var hit = hits[0];
    var n = hit.face.normal.clone();
    n.transformDirection(hit.object.matrixWorld);
    return { point: hit.point, normal: n };
  }

  function hitMobAt(cx, cy) {
    var ndcX = (cx / window.innerWidth) * 2 - 1;
    var ndcY = -(cy / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    var hits = raycaster.intersectObjects(mobGroups, true);
    for (var i = 0; i < hits.length; i++) {
      var mob = hits[i].object.userData.mob;
      if (mob) return mob;
    }
    return null;
  }

  /* ---------- 网：抓动物 / 放动物 ---------- */
  function tryCatchAnimal(mob) {
    if (mob.type !== 'pig' && mob.type !== 'cow' && mob.type !== 'sheep') {
      App.toast('只能用网抓猪、牛、羊');
      return;
    }
    if ((backpack.net || 0) < 1) { App.toast('没有网，找村民用 3 个木头换'); return; }
    backpack.net -= 1;
    if (backpack.net <= 0) delete backpack.net;
    backpack['net_' + mob.type] = (backpack['net_' + mob.type] || 0) + 1;
    removeMob(mob);
    scheduleSave(); renderBackpack(); updateLabel(); playSound('place');
    App.toast('抓住了' + ITEMS['net_' + mob.type].name.replace('网中的', '') + '！');
  }

  function releaseAnimal(filledId) {
    var type = filledId.replace('net_', '');
    if ((backpack[filledId] || 0) < 1) return;
    var t = getTarget();
    var x, z;
    if (t) {
      x = Math.floor(t.point.x + t.normal.x * 0.5);
      z = Math.floor(t.point.z + t.normal.z * 0.5);
    } else {
      var dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      x = Math.floor(camera.position.x + dir.x * 3);
      z = Math.floor(camera.position.z + dir.z * 3);
    }
    backpack[filledId] -= 1;
    if (backpack[filledId] <= 0) delete backpack[filledId];
    backpack.net = (backpack.net || 0) + 1;
    addMob(type, x, groundY(x, z), z);
    scheduleSave(); renderBackpack(); updateLabel(); playSound('place');
    App.toast('放出了' + ITEMS[filledId].name.replace('网中的', '') + '！');
  }

  function removeVoxel(k, type) {
    delete world[k];
    changes[k] = null;
    rebuildType(type);
  }

  function doBreak() { var t = getTarget(); if (t) breakAt(t); }

  function breakAt(t) {
    var vx = Math.floor(t.point.x - t.normal.x * 0.05);
    var vy = Math.floor(t.point.y - t.normal.y * 0.05);
    var vz = Math.floor(t.point.z - t.normal.z * 0.05);
    var k = vkey(vx, vy, vz);
    if (!world[k]) return;
    var type = world[k];
    removeVoxel(k, type);
    if (type === 'door' || type === 'door_open') {
      var below = vkey(vx, vy - 1, vz);
      var above = vkey(vx, vy + 1, vz);
      if (world[below] === type) removeVoxel(below, type);
      if (world[above] === type) removeVoxel(above, type);
    }
    var drop = type === 'door' || type === 'door_open' ? 'door' : type === 'water_flow' ? 'water' : type === 'lava_flow' ? 'lava' : type;
    if (isFluid(type)) delete fluidLevel[k];
    var needPick = type === 'stone' || type === 'coal_ore' || type === 'iron_ore' || type === 'gold_ore' || type === 'diamond_ore';
    if (needPick && equipped !== 'pickaxe' && equipped !== 'iron_pickaxe') {
      App.toast('没有稿子，挖不出石头/矿石');
    } else if (type === 'diamond_ore' && equipped !== 'iron_pickaxe') {
      App.toast('钻石要用铁镐才能挖');
    } else {
      if (type === 'coal_ore') drop = 'coal';
      else if (type === 'iron_ore') drop = 'raw_iron';
      else if (type === 'gold_ore') drop = 'gold';
      else if (type === 'diamond_ore') drop = 'diamond';
      var n = 1;
      if ((drop === 'raw_iron' || drop === 'gold' || drop === 'diamond') && equipped === 'iron_pickaxe') n += 1;
      if (drop === 'stone' && (equipped === 'pickaxe' || equipped === 'iron_pickaxe')) n += 1;
      if (drop === 'wood' && equipped === 'axe') n += 1;
      addItem(drop, n);
    }
    renderBackpack();
    playSound('break');
    scheduleSave();
  }

  function insidePlayer(x, y, z) {
    var dx = camera.position.x - (x + 0.5);
    var dz = camera.position.z - (z + 0.5);
    var dy = camera.position.y - (y + 0.5);
    return Math.abs(dx) < 0.9 && Math.abs(dz) < 0.9 && Math.abs(dy) < 1.8;
  }

  function doPlace() { var t = getTarget(); if (t) placeAtTarget(t); }

  function placeAtTarget(t) {
    var vx = Math.floor(t.point.x + t.normal.x * 0.05);
    var vy = Math.floor(t.point.y + t.normal.y * 0.05);
    var vz = Math.floor(t.point.z + t.normal.z * 0.05);
    var k = vkey(vx, vy, vz);
    if (world[k]) return;
    if (vx < -BOUND - 1 || vx > BOUND + 1 || vz < -BOUND - 1 || vz > BOUND + 1 || vy > 40 || vy < -8) return;
    if (insidePlayer(vx, vy, vz)) return;
    putBlock(currentType, vx, vy, vz);
  }

  /* 手指点到哪，放到哪 */
  function tapPlace(cx, cy) {
    var mv = hitMobAt(cx, cy);
    if (mv) {
      if (mv.type === 'villager') { openTrade(); return; }
      if (equipped === 'net') { tryCatchAnimal(mv); return; }
      if (equipped === 'net_pig' || equipped === 'net_cow' || equipped === 'net_sheep') { releaseAnimal(equipped); return; }
    }
    var t = getTargetAt(cx, cy);
    if (!t) return;
    currentAction = 'place';
    updateLabel();
    placeAtTarget(t);
  }

  /* 画笔：往上拖 = 放置，往回拖 = 删除 */
  function paintAction(cx, cy, totalY) {
    if (!totalY) return false;
    var t = getTargetAt(cx, cy);
    if (!t) return false;
    if (totalY < 0) {
      var px = Math.floor(t.point.x + t.normal.x * 0.05);
      var py = Math.floor(t.point.y + t.normal.y * 0.05);
      var pz = Math.floor(t.point.z + t.normal.z * 0.05);
      return putBlock(currentType, px, py, pz);
    } else {
      return eraseAt(t);
    }
  }

  function eraseVoxel(x, y, z) {
    var k = vkey(x, y, z);
    var type = world[k];
    if (!type) return false;
    if (isFluid(type)) delete fluidLevel[k];
    removeVoxel(k, type);
    var drop = type === 'door' || type === 'door_open' ? 'door' : type === 'water_flow' ? 'water' : type === 'lava_flow' ? 'lava' : type;
    if (drop === 'coal_ore') drop = 'coal';
    else if (drop === 'iron_ore') drop = 'raw_iron';
    else if (drop === 'gold_ore') drop = 'gold';
    else if (drop === 'diamond_ore') drop = 'diamond';
    addItem(drop, 1);
    scheduleSave();
    return true;
  }

  function eraseAt(t) {
    var vx = Math.floor(t.point.x - t.normal.x * 0.05);
    var vy = Math.floor(t.point.y - t.normal.y * 0.05);
    var vz = Math.floor(t.point.z - t.normal.z * 0.05);
    return eraseVoxel(vx, vy, vz);
  }

  function putBlock(type, vx, vy, vz) {
    var k = vkey(vx, vy, vz);
    if (world[k]) return false;
    if (type === 'door') {
      var top = vkey(vx, vy + 1, vz);
      if (world[top] || vy + 1 > 40 || insidePlayer(vx, vy + 1, vz)) return false;
      world[k] = 'door';
      changes[k] = 'door';
      world[top] = 'door';
      changes[top] = 'door';
      rebuildType('door');
    } else {
      world[k] = type;
      changes[k] = type;
      rebuildType(type);
    }
    if (isWaterFluid(type) || isLavaFluid(type)) {
      fluidLevel[k] = 0;
      activateFluid(k);
      checkFluidNeighbors(k);
    }
    scheduleSave();
    playSound('place');
    return true;
  }

  /* 从背包拿出物品放到指定位置（消耗 1 个） */
  function placeItemAt(id, x, y, z) {
    if ((backpack[id] || 0) < 1) { App.toast('背包里没有这个'); return false; }
    if (!ITEMS[id] || ITEMS[id].kind !== 'block') { App.toast('这个不能放出来'); return false; }
    if (world[vkey(x, y, z)]) return false;
    if (x < -BOUND - 1 || x > BOUND + 1 || z < -BOUND - 1 || z > BOUND + 1 || y > 40 || y < -8) return false;
    if (insidePlayer(x, y, z)) return false;
    if (!putBlock(id, x, y, z)) return false;
    backpack[id] -= 1;
    if (backpack[id] <= 0) delete backpack[id];
    scheduleSave();
    renderBackpack();
    return true;
  }

  function placeFromBackpack(id) {
    var t = getTarget();
    if (!t) return false;
    var vx = Math.floor(t.point.x + t.normal.x * 0.05);
    var vy = Math.floor(t.point.y + t.normal.y * 0.05);
    var vz = Math.floor(t.point.z + t.normal.z * 0.05);
    return placeItemAt(id, vx, vy, vz);
  }

  function doUse() {
    if (equipped === 'bow' || equipped === 'cannon') {
      shootProjectile(equipped === 'bow' ? 'arrow' : 'cannonball');
      return;
    }
    if (equipped === 'bucket' || equipped === 'water_bucket' || equipped === 'lava_bucket') {
      doBucketUse();
      return;
    }
    if (equipped === 'net') {
      var mv = hitMobAt(window.innerWidth / 2, window.innerHeight / 2);
      if (mv) { tryCatchAnimal(mv); return; }
      App.toast('对准动物点「使用」就能抓');
      return;
    }
    if (equipped === 'net_pig' || equipped === 'net_cow' || equipped === 'net_sheep') {
      releaseAnimal(equipped);
      return;
    }
    var mv2 = hitMobAt(window.innerWidth / 2, window.innerHeight / 2);
    if (mv2 && mv2.type === 'villager') {
      openTrade();
      return;
    }
    var t = getTarget();
    if (!t) return;
    var vx = Math.floor(t.point.x - t.normal.x * 0.05);
    var vy = Math.floor(t.point.y - t.normal.y * 0.05);
    var vz = Math.floor(t.point.z - t.normal.z * 0.05);
    var k = vkey(vx, vy, vz);
    var type = world[k];
    if (type === 'workbench') { openCrafting(); return; }
    if (type === 'furnace') { openSmelt(); return; }
    if (type === 'chest') { openChest(k); return; }
    if (type === 'bed') {
      if (mode !== 'survival') { App.toast('创造模式不用睡觉哦'); return; }
      if (!isNight()) { App.toast('现在睡不着，天黑再睡吧'); return; }
      sleepInBed(vx, vy, vz);
      return;
    }
    if (type === 'fence_gate' || type === 'fence_gate_open') {
      var ng = type === 'fence_gate' ? 'fence_gate_open' : 'fence_gate';
      world[k] = ng;
      changes[k] = ng;
      rebuildType('fence_gate');
      rebuildType('fence_gate_open');
      scheduleSave();
      playSound('place');
      return;
    }
    if (type === 'door' || type === 'door_open') {
      var newType = type === 'door' ? 'door_open' : 'door';
      var keys = [k];
      var below = vkey(vx, vy - 1, vz);
      var above = vkey(vx, vy + 1, vz);
      if (world[below] === type) keys.push(below);
      if (world[above] === type) keys.push(above);
      keys.forEach(function (kk) {
        world[kk] = newType;
        changes[kk] = newType;
      });
      rebuildType('door');
      rebuildType('door_open');
      scheduleSave();
      playSound('place');
      return;
    }
    App.toast('这个方块不能用哦');
  }

  function sleepInBed(x, y, z) {
    bedPoint = { x: x, y: y, z: z };
    time = 0.02; // 清晨
    clearHostiles();
    scheduleSave();
    App.toast('🌅 睡了一觉，天亮了！重生点已设在这张床');
  }

  function isNight() { return nightAmt > 0.5; }

  /* ---------- 怪物 ---------- */
  function spawnSheep(n) {
    for (var i = 0; i < n; i++) {
      var x = Math.floor(rnd(-BOUND + 3, BOUND - 3));
      var z = Math.floor(rnd(-BOUND + 3, BOUND - 3));
      addMob('sheep', x, groundY(x, z), z);
    }
  }

  function spawnVillagers(n) {
    for (var i = 0; i < n; i++) {
      var x = Math.floor(16 + rnd(-6, 6));
      var z = Math.floor(-16 + rnd(-6, 6));
      addMob('villager', x, groundY(x, z), z);
    }
  }

  function spawnPigs(n) {
    for (var i = 0; i < n; i++) {
      var x = Math.floor(rnd(-BOUND + 3, BOUND - 3));
      var z = Math.floor(rnd(-BOUND + 3, BOUND - 3));
      addMob('pig', x, groundY(x, z), z);
    }
  }

  function spawnCows(n) {
    for (var i = 0; i < n; i++) {
      var x = Math.floor(rnd(-BOUND + 3, BOUND - 3));
      var z = Math.floor(rnd(-BOUND + 3, BOUND - 3));
      addMob('cow', x, groundY(x, z), z);
    }
  }

  function waterSpot() {
    for (var x = -BOUND + 4; x <= BOUND - 4; x += 6) {
      for (var z = -BOUND + 4; z <= BOUND - 4; z += 6) {
        for (var y = 8; y >= -5; y--) {
          var t = world[vkey(x, y, z)];
          if (t === 'water' || t === 'water_flow') return { x: x, y: y + 0.4, z: z };
        }
      }
    }
    return null;
  }

  function spawnFish(n) {
    for (var i = 0; i < n; i++) {
      var s = waterSpot();
      if (!s) continue;
      addMob('fish', s.x, s.y, s.z);
    }
  }

  function spawnToTarget(type, min) {
    var cur = mobs.filter(function (m) { return m.type === type; }).length;
    var need = min - cur;
    if (need <= 0) return;
    if (type === 'fish') spawnFish(need);
    else {
      for (var i = 0; i < need; i++) {
        var x = Math.floor(rnd(-BOUND + 3, BOUND - 3));
        var z = Math.floor(rnd(-BOUND + 3, BOUND - 3));
        addMob(type, x, groundY(x, z), z);
      }
    }
  }

  /* 每日刷新：把动物补齐到固定数量（和箱子同一个"新的一天"逻辑） */
  function topUpAnimals() {
    [['sheep', 3], ['pig', 2], ['cow', 1], ['fish', 3]].forEach(function (spec) {
      spawnToTarget(spec[0], spec[1]);
    });
  }

  function addMob(type, x, y, z) {
    var mob = {
      type: type,
      pos: { x: x, y: y, z: z },
      hp: type === 'zombie' ? 6 : type === 'skeleton' ? 5 : type === 'cow' ? 6 : type === 'pig' ? 4 : type === 'fish' ? 2 : 3,
      speed: type === 'sheep' || type === 'villager' || type === 'pig' || type === 'cow' ? 1.4 : 2.4,
      lying: type === 'sheep',
      dir: null,
      wanderUntil: 0,
      nextAtk: 0,
      flashUntil: 0
    };
    var bodyColor = type === 'zombie' ? 0x4CAF50 : type === 'skeleton' ? 0xE8E8E8 : type === 'villager' ? 0x6B8E4E : type === 'pig' ? 0xF4A7B9 : type === 'cow' ? 0x8B5A2B : 0xFFFFFF;
    var headColor = type === 'zombie' ? 0x2E7D32 : type === 'skeleton' ? 0xD5D5D5 : type === 'villager' ? 0xF0C8A0 : type === 'pig' ? 0xE98CA6 : type === 'cow' ? 0x6E4520 : 0xFFF3D0;
    var group = new THREE.Group();
    var body, head;
    if (type === 'sheep') {
      // 趴着的羊：横躺的身体 + 四条腿 + 头
      body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.9), new THREE.MeshLambertMaterial({ color: 0xFFFFFF }));
      body.position.y = 0.4;
      head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), new THREE.MeshLambertMaterial({ color: 0xFFF3D0 }));
      head.position.set(0, 0.46, 0.62);
      [[-0.18, -0.3], [0.18, -0.3], [-0.18, 0.3], [0.18, 0.3]].forEach(function (p) {
        var leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.12), new THREE.MeshLambertMaterial({ color: 0xE0E0E0 }));
        leg.position.set(p[0], 0.16, p[1]);
        group.add(leg);
      });
    } else if (type === 'pig' || type === 'cow') {
      // 四脚站立的猪/牛
      var scale = type === 'cow' ? 1.2 : 1;
      body = new THREE.Mesh(new THREE.BoxGeometry(0.55 * scale, 0.5 * scale, 0.95 * scale), new THREE.MeshLambertMaterial({ color: bodyColor }));
      body.position.y = 0.62 * scale;
      head = new THREE.Mesh(new THREE.BoxGeometry(0.38 * scale, 0.38 * scale, 0.38 * scale), new THREE.MeshLambertMaterial({ color: headColor }));
      head.position.set(0, 0.75 * scale, 0.62 * scale);
      [[-0.18, -0.32], [0.18, -0.32], [-0.18, 0.32], [0.18, 0.32]].forEach(function (p) {
        var leg = new THREE.Mesh(new THREE.BoxGeometry(0.12 * scale, 0.4 * scale, 0.12 * scale), new THREE.MeshLambertMaterial({ color: 0xE0D8D0 }));
        leg.position.set(p[0] * scale, 0.2 * scale, p[1] * scale);
        group.add(leg);
      });
      if (type === 'cow') {
        [[-0.2, 0], [0.2, 0]].forEach(function (p) {
          var horn = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.13), new THREE.MeshLambertMaterial({ color: 0xF5F0E6 }));
          horn.position.set(p[0], 0.94, 0.62);
          group.add(horn);
        });
      }
    } else if (type === 'fish') {
      // 水里的鱼：身体 + 尾巴
      body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.65), new THREE.MeshLambertMaterial({ color: 0xF4A03A }));
      body.position.y = 0;
      head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.18), new THREE.MeshLambertMaterial({ color: 0xE07B2A }));
      head.position.set(0, 0, -0.4);
      group.scale.set(0.9, 0.9, 0.9);
    } else {
      body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.85, 0.4), new THREE.MeshLambertMaterial({ color: bodyColor }));
      body.position.y = 0.7;
      head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), new THREE.MeshLambertMaterial({ color: headColor }));
      head.position.y = 1.55;
    }
    body.userData.mob = mob;
    head.userData.mob = mob;
    group.add(body);
    group.add(head);
    group.position.set(x, y, z);
    group.userData.mob = mob;
    scene.add(group);
    mob.group = group;
    mob.parts = [body, head];
    mobs.push(mob);
    mobGroups.push(group);
  }

  function removeMob(mob) {
    scene.remove(mob.group);
    var i = mobs.indexOf(mob);
    if (i !== -1) mobs.splice(i, 1);
    var j = mobGroups.indexOf(mob.group);
    if (j !== -1) mobGroups.splice(j, 1);
  }

  function clearHostiles() {
    mobs.slice().forEach(function (m) {
      if (m.type === 'zombie' || m.type === 'skeleton') removeMob(m);
    });
  }

  function flashMob(mob) {
    mob.parts.forEach(function (p) {
      p.material.emissive = new THREE.Color(0xff3333);
    });
    mob.flashUntil = Date.now() + 180;
  }

  function mobDrops(mob) {
    var drops = [];
    if (mob.type === 'zombie') {
      if (Math.random() < 0.4) drops.push(['raw_meat', 1]);
      if (Math.random() < 0.25) drops.push(['apple', 1]);
    } else if (mob.type === 'skeleton') {
      if (Math.random() < 0.4) drops.push(['stick', 1]);
    } else if (mob.type === 'pig') {
      drops.push(['raw_meat', 2]); // 猪掉 2 肉
    } else if (mob.type === 'cow') {
      drops.push(['raw_meat', 5]); // 牛掉 5 肉
    } else if (mob.type === 'fish') {
      drops.push(['raw_meat', 1]); // 一条鱼 = 1 块肉
    } else {
      drops.push(['wool', 1 + (Math.random() < 0.5 ? 1 : 0)]);
      drops.push(['raw_meat', 1]); // 羊掉肉
    }
    drops.forEach(function (d) { addItem(d[0], d[1]); });
    renderBackpack();
    if (drops.length) {
      App.toast('掉落：' + drops.map(function (d) { return ITEMS[d[0]].name + '×' + d[1]; }).join('、'));
    }
  }

  function doAttack() {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    var hits = raycaster.intersectObjects(mobGroups, true);
    if (!hits.length) return;
    var mob = hits[0].object.userData.mob;
    if (!mob) return;
    if (mob.type === 'villager') { App.toast('村民是好朋友，不能打哦'); return; }
    var d = Math.hypot(mob.pos.x - camera.position.x, mob.pos.z - camera.position.z);
    if (d > 8) return;
    var dmg = equipped === 'iron_sword' ? 6 : equipped === 'sword' ? 4 : 2;
    damageMob(mob, dmg);
  }

  function damageMob(mob, dmg) {
    mob.hp -= dmg;
    flashMob(mob);
    var dx = mob.pos.x - camera.position.x;
    var dz = mob.pos.z - camera.position.z;
    var len = Math.hypot(dx, dz) || 1;
    mob.pos.x += dx / len * 0.9;
    mob.pos.z += dz / len * 0.9;
    playSound('hit');
    if (mob.hp <= 0) {
      mobDrops(mob);
      removeMob(mob);
      App.toast(mob.type === 'sheep' ? '小羊回家了 🐑' : '怪物消灭了！');
    }
  }

  /* ---------- 铁桶：装水/岩浆、倒水/岩浆 ---------- */
  function doBucketUse() {
    var t = getTarget();
    if (!t) return;
    var vx = Math.floor(t.point.x - t.normal.x * 0.05);
    var vy = Math.floor(t.point.y - t.normal.y * 0.05);
    var vz = Math.floor(t.point.z - t.normal.z * 0.05);
    var k = vkey(vx, vy, vz);
    var type = world[k];

    if (equipped === 'bucket') {
      if (isWaterFluid(type)) { collectFluid(k, 'water_bucket'); return; }
      if (isLavaFluid(type)) { collectFluid(k, 'lava_bucket'); return; }
      App.toast('对准水或岩浆，用铁桶装');
      return;
    }

    var isWater = equipped === 'water_bucket';
    if (isWater && isLavaFluid(type)) {
      convertFluid(k); // 水倒在岩浆上 → 黑曜石
      equipped = 'bucket';
      scheduleSave(); renderBackpack(); updateLabel();
      App.toast('岩浆变成了黑曜石！');
      return;
    }
    if (!isWater && isWaterFluid(type)) {
      delete fluidLevel[k];
      world[k] = 'stone';
      changes[k] = 'stone';
      rebuildType('stone'); // 岩浆盖在水上 → 石头
      equipped = 'bucket';
      scheduleSave(); renderBackpack(); updateLabel(); playSound('place');
      App.toast('水变成了石头！');
      return;
    }
    // 倒到相邻空格
    var px = Math.floor(t.point.x + t.normal.x * 0.05);
    var py = Math.floor(t.point.y + t.normal.y * 0.05);
    var pz = Math.floor(t.point.z + t.normal.z * 0.05);
    var placed = putBlock(isWater ? 'water' : 'lava', px, py, pz);
    if (placed) {
      equipped = 'bucket';
      scheduleSave(); renderBackpack(); updateLabel();
      App.toast(isWater ? '倒出了一桶水 💧' : '倒出了岩浆 🌋');
    } else {
      App.toast('这里放不下');
    }
  }

  function collectFluid(k, filledId) {
    var type = world[k];
    delete fluidLevel[k];
    removeVoxel(k, type);
    backpack.bucket = (backpack.bucket || 0) - 1;
    if (backpack.bucket <= 0) delete backpack.bucket;
    backpack[filledId] = (backpack[filledId] || 0) + 1;
    equipped = filledId;
    scheduleSave(); renderBackpack(); updateLabel(); playSound('place');
    App.toast(filledId === 'water_bucket' ? '装了一桶水 💧' : '装了一桶岩浆 🌋');
  }

  /* ---------- 弓箭与大炮 ---------- */
  var projectiles = [];

  function shootProjectile(kind) {
    var ammo = kind === 'arrow' ? 'arrow' : 'cannonball';
    if ((backpack[ammo] || 0) < 1) {
      App.toast(kind === 'arrow' ? '没有可用的箭' : '没有可用的炮弹');
      return;
    }
    backpack[ammo] -= 1;
    if (backpack[ammo] <= 0) delete backpack[ammo];
    scheduleSave();
    renderBackpack();
    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    var mesh = kind === 'arrow'
      ? new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 6), new THREE.MeshLambertMaterial({ color: 0x8B5A2B }))
      : new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), new THREE.MeshLambertMaterial({ color: 0x2C2C2C }));
    mesh.position.copy(camera.position).addScaledVector(dir, 0.5);
    scene.add(mesh);
    projectiles.push({ kind: kind, mesh: mesh, dir: dir.clone(), speed: kind === 'arrow' ? 34 : 26, ttl: 4 });
    playSound('shoot');
  }

  function updateProjectiles(dt) {
    if (!projectiles.length) return;
    for (var i = projectiles.length - 1; i >= 0; i--) {
      var p = projectiles[i];
      var step = p.speed * dt;
      raycaster.set(p.mesh.position, p.dir);
      raycaster.far = step;
      var blockHits = raycaster.intersectObjects(meshList, false);
      var mobHits = raycaster.intersectObjects(mobGroups, true);
      var hitMob = null;
      if (mobHits.length && (!blockHits.length || mobHits[0].distance <= blockHits[0].distance)) {
        hitMob = mobHits[0].object.userData.mob;
      }
      if (hitMob) {
        if (hitMob.type !== 'villager') {
          damageMob(hitMob, 6); // 弓箭与大炮同样有伤害
        }
        removeProjectile(i);
      } else if (blockHits.length) {
        if (p.kind === 'cannonball') explodeAt(blockHits[0].point);
        removeProjectile(i);
      } else {
        p.mesh.position.addScaledVector(p.dir, step);
        p.ttl -= dt;
        if (p.ttl <= 0 || p.mesh.position.distanceTo(camera.position) > 80) removeProjectile(i);
      }
    }
  }

  function removeProjectile(i) {
    var p = projectiles[i];
    scene.remove(p.mesh);
    projectiles.splice(i, 1);
  }

  function explodeAt(point) {
    var cx = Math.floor(point.x), cy = Math.floor(point.y), cz = Math.floor(point.z);
    for (var dx = -1; dx <= 1; dx++) {
      for (var dy = -1; dy <= 1; dy++) {
        for (var dz = -1; dz <= 1; dz++) {
          var k = vkey(cx + dx, cy + dy, cz + dz);
          var type = world[k];
          if (!type || isFluid(type)) continue;
          removeVoxel(k, type);
          var drop = type === 'door' || type === 'door_open' ? 'door' : type === 'water_flow' ? 'water' : type === 'lava_flow' ? 'lava' : type;
          if (drop === 'coal_ore') drop = 'coal';
          else if (drop === 'iron_ore') drop = 'raw_iron';
          else if (drop === 'gold_ore') drop = 'gold';
          else if (drop === 'diamond_ore') drop = 'diamond';
          addItem(drop, 1);
        }
      }
    }
    renderBackpack();
    scheduleSave();
    playSound('hit');
    App.toast('💥 轰！');
  }

  /* ---------- 生存数值 ---------- */
  function damagePlayer(hearts) {
    if (mode !== 'survival') return;
    var now = Date.now();
    if (now < invulnUntil) return;
    if (armor) hearts = Math.max(0, hearts - ITEMS[armor].defense);
    if (hearts <= 0) return;
    hp -= hearts;
    invulnUntil = now + 1000;
    updateHud();
    var flash = App.el('mcFlash');
    flash.classList.remove('show');
    void flash.offsetWidth;
    flash.classList.add('show');
    setTimeout(function () { flash.classList.remove('show'); }, 300);
    playSound('hurt');
    if (hp <= 0) die();
  }

  function die() {
    hp = 0;
    updateHud();
    App.el('mcDeath').classList.remove('hidden');
    setTimeout(function () {
      respawn();
      App.el('mcDeath').classList.add('hidden');
    }, 1800);
  }

  function respawn() {
    var p = bedPoint || spawnPoint;
    camera.position.set(p.x + 0.5, groundY(p.x + 0.5, p.z + 0.5) + 1.7, p.z + 0.5);
    hp = 10;
    hunger = 10;
    vy = 0;
    updateHud();
    App.toast(bedPoint ? '你回到了床边' : '你回到了出生点');
  }

  /* ---------- 声音 ---------- */
  var actx = null;
  function playSound(kind) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var o = actx.createOscillator();
      var g = actx.createGain();
      var freq = kind === 'place' ? 260 : kind === 'break' ? 150 : kind === 'eat' ? 400 : kind === 'hit' ? 200 : 320;
      o.type = 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.06, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.12);
      o.connect(g);
      g.connect(actx.destination);
      o.start();
      o.stop(actx.currentTime + 0.12);
    } catch (e) { /* ignore */ }
  }

  /* ---------- 控制 ---------- */
  var joyVec = { x: 0, y: 0 };
  var lookPointer = null, lookLast = { x: 0, y: 0 };
  var upPressed = false, downPressed = false;
  var keys = {};
  var touches = {};
  var mineTimers = {};
  var paintMode = false;
  var lastPaint = 0;
  var stopTimer = null;

  function bindControls() {
    var game = App.el('mcGame');
    // iOS 手势拦截：禁止捏合缩放页面
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (ev) {
      document.addEventListener(ev, function (e) { e.preventDefault(); }, false);
    });
    game.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.mc-ui')) return;
      if (paintMode) {
        touches[e.pointerId] = { x: e.clientX, y: e.clientY, lastY: e.clientY, totalY: 0, moved: false, mode: 'paint' };
        return;
      }
      var t = { x: e.clientX, y: e.clientY, t0: Date.now(), mode: 'pending', timer: null };
      touches[e.pointerId] = t;
      t.timer = setTimeout(function () {
        var cur = touches[e.pointerId];
        if (cur && cur.mode === 'pending') {
          cur.mode = 'mine';
          currentAction = 'break';
          updateLabel();
          startMining(e.pointerId, cur.x, cur.y);
        }
      }, 360);
    });
    game.addEventListener('pointermove', function (e) {
      var t = touches[e.pointerId];
      if (!t) return;
      if (t.mode === 'paint') {
        var dy = e.clientY - t.lastY;
        t.lastY = e.clientY;
        if (Math.abs(e.clientX - t.x) + Math.abs(dy) > 8) t.moved = true;
        t.totalY += dy;
        var now = Date.now();
        if (now - lastPaint > 90) {
          lastPaint = now;
          paintAction(e.clientX, e.clientY, t.totalY);
        }
        return;
      }
      if (t.mode === 'pending') {
        if (Math.hypot(e.clientX - t.x, e.clientY - t.y) > 12) {
          clearTimeout(t.timer);
          t.mode = 'look';
          lookPointer = e.pointerId;
          lookLast = { x: e.clientX, y: e.clientY };
        }
      } else if (t.mode === 'look' && e.pointerId === lookPointer) {
        var dx = e.clientX - lookLast.x;
        var dy = e.clientY - lookLast.y;
        lookLast = { x: e.clientX, y: e.clientY };
        yaw -= dx * 0.006;
        pitch -= dy * 0.006;
        pitch = clamp(pitch, -1.5, 1.5);
      }
    });
    function endTouch(e) {
      var t = touches[e.pointerId];
      if (!t) return;
      clearTimeout(t.timer);
      if (t.mode === 'pending') {
        tapPlace(e.clientX, e.clientY); // 短按 = 放置
      } else if (t.mode === 'paint') {
        if (!t.moved) tapPlace(e.clientX, e.clientY);
      } else if (t.mode === 'mine') {
        stopMining(e.pointerId);
      } else if (t.mode === 'look' && e.pointerId === lookPointer) {
        lookPointer = null;
      }
      delete touches[e.pointerId];
    }
    game.addEventListener('pointerup', endTouch);
    game.addEventListener('pointercancel', endTouch);

    var joy = App.el('mcJoy');
    var knob = App.el('mcJoyKnob');
    var joyActive = false, joyCx = 0, joyCy = 0;
    function updateJoy(e) {
      var dx = e.clientX - joyCx;
      var dy = e.clientY - joyCy;
      var max = 48, len = Math.hypot(dx, dy);
      if (len > max) { dx = dx / len * max; dy = dy / len * max; }
      joyVec = { x: dx / max, y: dy / max };
      knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    }
    joy.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      joy.setPointerCapture(e.pointerId);
      joyActive = true;
      joyCx = e.clientX;
      joyCy = e.clientY;
      updateJoy(e);
    });
    joy.addEventListener('pointermove', function (e) { if (joyActive) updateJoy(e); });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      joy.addEventListener(ev, function () {
        joyActive = false;
        joyVec = { x: 0, y: 0 };
        knob.style.transform = 'translate(0,0)';
      });
    });

    var upBtn = App.el('mcUp');
    var downBtn = App.el('mcDown');
    upBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); upPressed = true; });
    upBtn.addEventListener('pointerup', function () { upPressed = false; });
    upBtn.addEventListener('pointercancel', function () { upPressed = false; });
    downBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); downPressed = true; });
    downBtn.addEventListener('pointerup', function () { downPressed = false; });
    downBtn.addEventListener('pointercancel', function () { downPressed = false; });

    holdAction(App.el('mcBreak'), function () { currentAction = 'break'; updateLabel(); doBreak(); });
    holdAction(App.el('mcPlace'), function () { currentAction = 'place'; updateLabel(); doPlace(); });
    App.el('mcUse').addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      currentAction = 'use';
      updateLabel();
      doUse();
    });
    App.el('mcAttack').addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      doAttack();
    });
    App.el('mcPaintBtn').addEventListener('click', function () {
      paintMode = !paintMode;
      App.el('mcPaintBtn').classList.toggle('on', paintMode);
      updateLabel();
      App.toast(paintMode ? '🖌️ 画笔：往上拖放方块，往回拖删方块' : '已退出画笔模式');
    });

    window.addEventListener('keydown', function (e) {
      keys[e.key.toLowerCase()] = true;
      if (e.key >= '1' && e.key <= '9') { currentType = HOTBAR[+e.key - 1] || currentType; renderHotbar(); updateLabel(); }
      if (e.key === 'f' || e.key === 'F') doAttack();
    });
    window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });
  }

  function startMining(pointerId, cx, cy) {
    var once = function () {
      var t = getTargetAt(cx, cy);
      if (t) breakAt(t);
    };
    once();
    mineTimers[pointerId] = setInterval(once, 260);
  }

  function stopMining(pointerId) {
    if (mineTimers[pointerId]) {
      clearInterval(mineTimers[pointerId]);
      delete mineTimers[pointerId];
    }
  }

  function holdAction(btn, fn) {
    var t = null;
    btn.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      fn();
      t = setInterval(fn, 220);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
      btn.addEventListener(ev, function () { clearInterval(t); t = null; });
    });
  }

  function renderHotbar() {
    var funcRow = App.el('mcHotbarFunc');
    var matRow = App.el('mcHotbarMat');
    funcRow.innerHTML = '';
    matRow.innerHTML = '';
    function blockBtn(id) {
      var b = ITEMS[id];
      var btn = document.createElement('button');
      btn.className = 'mc-block mc-ui' + (id === currentType ? ' sel' : '');
      btn.style.background = 'rgba(255,255,255,0.14)';
      btn.textContent = b.emoji || '';
      btn.title = b.name;
      btn.addEventListener('click', function () {
        currentType = id;
        renderHotbar();
        updateLabel();
      });
      return btn;
    }
    var funcLabel = document.createElement('span');
    funcLabel.className = 'mc-hotbar-label';
    funcLabel.textContent = '⚙️ 功能';
    funcRow.appendChild(funcLabel);
    var pack = document.createElement('button');
    pack.className = 'mc-pack-btn mc-ui';
    pack.id = 'mcPackBtn';
    pack.title = '背包';
    pack.textContent = '🎒';
    pack.addEventListener('click', toggleBackpack);
    funcRow.appendChild(pack);
    HOTBAR_FUNC.forEach(function (id) { funcRow.appendChild(blockBtn(id)); });
    var matLabel = document.createElement('span');
    matLabel.className = 'mc-hotbar-label';
    matLabel.textContent = '🧱 方块';
    matRow.appendChild(matLabel);
    HOTBAR_MAT.forEach(function (id) { matRow.appendChild(blockBtn(id)); });
  }

  function selectItem(id) {
    if (!ITEMS[id] || ITEMS[id].kind !== 'block') { App.toast('这个不是方块'); return; }
    currentType = id;
    renderHotbar();
    updateLabel();
    App.toast('已选中：' + ITEMS[id].name);
  }

  function dropItem(id) {
    var it = ITEMS[id];
    if (!it) return;
    if (it.kind === 'tool') {
      equipped = equipped === id ? null : id;
      scheduleSave();
      renderBackpack();
      updateLabel();
      App.toast(equipped ? '已装备 ' + ITEMS[equipped].name : '已收起工具');
    } else if (it.kind === 'armor') {
      armor = armor === id ? null : id;
      scheduleSave();
      renderBackpack();
      updateLabel();
      App.toast(armor ? '已穿戴 ' + ITEMS[armor].name + '（减伤）' : '已脱下护甲');
    } else if (it.kind === 'food') {
      eatItem(id);
    } else if (it.kind === 'block') {
      if (placeFromBackpack(id)) App.toast('已把 ' + it.name + ' 放出来了');
      else App.toast('这里放不下，换个位置试试');
    } else {
      App.toast('这个物品不能拿出来');
    }
  }

  function updateLabel() {
    var label = App.el('mcLabel');
    var act = currentAction === 'break' ? '⛏️ 拆' : currentAction === 'place' ? '🧱 放：' + ITEMS[currentType].name : '👆 使用';
    if (mode === 'survival') act += ' · 生存';
    if (paintMode) act += ' · 🖌️画笔';
    if (equipped) act += ' · 手持 ' + ITEMS[equipped].name;
    if (equipped === 'bow' || equipped === 'cannon') act += '（点👆发射）';
    if (equipped === 'bucket' || equipped === 'water_bucket' || equipped === 'lava_bucket') act += '（点👆使用）';
    if (armor) act += ' · 🛡️ ' + ITEMS[armor].name;
    label.textContent = act;
  }

  function updateHud() {
    App.el('mcHearts').textContent = '❤️'.repeat(Math.max(0, Math.round(hp))) + '🖤'.repeat(10 - Math.max(0, Math.round(hp)));
    App.el('mcHunger').textContent = '🍗'.repeat(Math.max(0, Math.round(hunger))) + '🤍'.repeat(10 - Math.max(0, Math.round(hunger)));
  }

  /* ---------- 背包与合成界面 ---------- */
  function itemIcon(id) {
    var it = ITEMS[id];
    if (it.emoji) return '<span class="mc-item-emoji">' + it.emoji + '</span>';
    return '<span class="mc-item-swatch" style="background:#' + it.color.toString(16).padStart(6, '0') + '"></span>';
  }

  function renderBackpack() {
    var box = App.el('mcBackpackList');
    box.innerHTML = '';
    var ids = Object.keys(backpack).filter(function (id) { return backpack[id] > 0; });
    if (!ids.length) {
      box.innerHTML = '<div style="color:var(--muted)">背包空空的，去砍树收集材料吧！🪓</div>';
      return;
    }
    ids.sort().forEach(function (id) {
      var it = ITEMS[id];
      var row = document.createElement('div');
      row.className = 'mc-pack-row' + (it.kind === 'block' ? ' draggable' : '');
      row.setAttribute('data-drag', id);
      var action = '';
      if (it.kind === 'tool') {
        action = equipped === id
          ? '<button class="mc-pack-act on" data-equip="' + id + '">已装备</button>'
          : '<button class="mc-pack-act" data-equip="' + id + '">装备</button>';
      } else if (it.kind === 'armor') {
        action = armor === id
          ? '<button class="mc-pack-act on" data-armor="' + id + '">已穿戴</button>'
          : '<button class="mc-pack-act" data-armor="' + id + '">穿戴</button>';
      } else if (it.kind === 'food') {
        action = '<button class="mc-pack-act" data-eat="' + id + '">吃</button>';
      }
      row.innerHTML = itemIcon(id) +
        '<span class="mc-pack-name">' + it.name + '</span>' +
        '<span class="mc-pack-count">×' + backpack[id] + '</span>' + action;
      box.appendChild(row);
    });
    box.querySelectorAll('[data-equip]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-equip');
        equipped = equipped === id ? null : id;
        scheduleSave();
        renderBackpack();
        updateLabel();
        App.toast(equipped ? '已装备 ' + ITEMS[equipped].name : '已收起工具');
      });
    });
    box.querySelectorAll('[data-eat]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        eatItem(btn.getAttribute('data-eat'));
      });
    });
    box.querySelectorAll('[data-armor]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-armor');
        armor = armor === id ? null : id;
        scheduleSave();
        renderBackpack();
        updateLabel();
        App.toast(armor ? '已穿戴 ' + ITEMS[armor].name + '（减伤）' : '已脱下护甲');
      });
    });
    box.querySelectorAll('[data-drag]').forEach(bindDragRow);
  }

  function bindDragRow(row) {
    var id = row.getAttribute('data-drag');
    var timer = null, dragging = false, moved = false, sx = 0, sy = 0;
    var ghost = null;
    function startDrag(e) {
      dragging = true;
      row.classList.add('dragging');
      ghost = document.createElement('div');
      ghost.className = 'mc-drag-ghost';
      ghost.innerHTML = itemIcon(id);
      ghost.style.left = e.clientX + 'px';
      ghost.style.top = e.clientY + 'px';
      document.body.appendChild(ghost);
    }
    function endDrag(e) {
      clearTimeout(timer);
      if (dragging) {
        if (ghost) ghost.remove();
        row.classList.remove('dragging');
        var bar = App.el('mcHotbarWrap');
        var r = bar.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          selectItem(id);
        } else {
          dropItem(id);
        }
        dragging = false;
      }
    }
    function cancelDrag() {
      clearTimeout(timer);
      if (dragging && ghost) ghost.remove();
      row.classList.remove('dragging');
      dragging = false;
    }
    row.addEventListener('pointerdown', function (e) {
      sx = e.clientX; sy = e.clientY; moved = false;
      timer = setTimeout(function () {
        if (!moved) {
          row.setPointerCapture(e.pointerId);
          startDrag(e);
        }
      }, 320);
    });
    row.addEventListener('pointermove', function (e) {
      if (Math.hypot(e.clientX - sx, e.clientY - sy) > 12) moved = true;
      if (dragging && ghost) {
        ghost.style.left = e.clientX + 'px';
        ghost.style.top = e.clientY + 'px';
      }
    });
    row.addEventListener('pointerup', function (e) {
      if (dragging) endDrag(e);
      else clearTimeout(timer);
    });
    row.addEventListener('pointercancel', cancelDrag);
  }

  function toggleBackpack() {
    closeOverlays();
    App.el('mcBackpack').classList.toggle('hidden');
    renderBackpack();
  }

  function openCrafting() {
    closeOverlays();
    App.el('mcCraftPanel').classList.remove('hidden');
    renderCrafting();
  }

  function closeOverlays() {
    App.el('mcBackpack').classList.add('hidden');
    App.el('mcCraftPanel').classList.add('hidden');
    App.el('mcSmeltPanel').classList.add('hidden');
    App.el('mcChestPanel').classList.add('hidden');
    App.el('mcTradePanel').classList.add('hidden');
  }

  function renderCrafting() {
    var box = App.el('mcRecipeList');
    box.innerHTML = '';
    RECIPES.forEach(function (r) {
      var row = document.createElement('div');
      row.className = 'mc-recipe';
      var needHtml = Object.keys(r.need).map(function (id) {
        return itemIcon(id) + '<span>' + ITEMS[id].name + '×' + r.need[id] + '</span>';
      }).join('<span class="mc-recipe-plus">+</span>');
      var ok = canCraft(r);
      row.innerHTML =
        '<div class="mc-recipe-left">' + needHtml + '</div>' +
        '<div class="mc-recipe-arrow">→</div>' +
        '<div class="mc-recipe-result">' + itemIcon(r.result) + '<span>' + ITEMS[r.result].name + '×' + r.count + '</span></div>' +
        '<button class="mc-recipe-btn' + (ok ? '' : ' off') + '" data-recipe="' + r.id + '"' + (ok ? '' : ' disabled') + '>合成</button>';
      box.appendChild(row);
    });
    box.querySelectorAll('[data-recipe]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var r = RECIPES.find(function (x) { return x.id === btn.getAttribute('data-recipe'); });
        if (r) craft(r);
      });
    });
  }

  App.el('mcPackClose').addEventListener('click', function () { App.el('mcBackpack').classList.add('hidden'); });
  App.el('mcCraftClose').addEventListener('click', function () { App.el('mcCraftPanel').classList.add('hidden'); });
  App.el('mcSmeltClose').addEventListener('click', function () { App.el('mcSmeltPanel').classList.add('hidden'); });

  function openSmelt() {
    closeOverlays();
    App.el('mcSmeltPanel').classList.remove('hidden');
    renderSmelt();
  }

  function renderSmelt() {
    var box = App.el('mcSmeltList');
    box.innerHTML = '';
    SMELT_RECIPES.forEach(function (r) {
      var row = document.createElement('div');
      row.className = 'mc-recipe';
      var ok = (backpack[r.input] || 0) >= 1 && (backpack[r.fuel] || 0) >= 1;
      row.innerHTML =
        '<div class="mc-recipe-left">' + itemIcon(r.input) + '<span>' + ITEMS[r.input].name + '×1</span>' +
        '<span class="mc-recipe-plus">+</span>' + itemIcon(r.fuel) + '<span>煤×1</span></div>' +
        '<div class="mc-recipe-arrow">→</div>' +
        '<div class="mc-recipe-result">' + itemIcon(r.result) + '<span>' + ITEMS[r.result].name + '×' + r.count + '</span></div>' +
        '<button class="mc-recipe-btn' + (ok ? '' : ' off') + '" data-smelt="' + r.id + '"' + (ok ? '' : ' disabled') + '>烧炼</button>';
      box.appendChild(row);
    });
    box.querySelectorAll('[data-smelt]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var r = SMELT_RECIPES.find(function (x) { return x.id === btn.getAttribute('data-smelt'); });
        if (r) smelt(r);
      });
    });
  }

  /* ---------- 箱子 ---------- */
  var currentChestKey = null;

  function openChest(key) {
    closeOverlays();
    currentChestKey = key;
    App.el('mcChestPanel').classList.remove('hidden');
    renderChest();
  }

  function renderChest() {
    var box = App.el('mcChestList');
    box.innerHTML = '';
    var items = chestContents[currentChestKey] || [];
    if (!items.length) {
      box.innerHTML = '<div style="color:var(--muted);text-align:center">箱子空空的 📭</div>';
      return;
    }
    items.forEach(function (id, idx) {
      var row = document.createElement('div');
      row.className = 'mc-pack-row';
      row.innerHTML = itemIcon(id) +
        '<span class="mc-pack-name">' + ITEMS[id].name + '</span>' +
        '<span class="mc-pack-count">×1</span>' +
        '<button class="mc-pack-act" data-chest="' + idx + '">拿走</button>';
      box.appendChild(row);
    });
    box.querySelectorAll('[data-chest]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        takeChestItem(+btn.getAttribute('data-chest'));
      });
    });
  }

  function takeChestItem(idx) {
    var items = chestContents[currentChestKey] || [];
    if (idx < 0 || idx >= items.length) return;
    var id = items.splice(idx, 1)[0];
    addItem(id, 1);
    scheduleSave();
    renderChest();
    renderBackpack();
    App.toast('拿到：' + ITEMS[id].name + ' ×1');
  }

  App.el('mcChestClose').addEventListener('click', function () { App.el('mcChestPanel').classList.add('hidden'); });

  /* ---------- 村民交换 ---------- */
  function openTrade() {
    closeOverlays();
    App.el('mcTradePanel').classList.remove('hidden');
    renderTrade();
  }

  function renderTrade() {
    var box = App.el('mcTradeList');
    box.innerHTML = '';
    TRADES.forEach(function (t) {
      var row = document.createElement('div');
      row.className = 'mc-recipe';
      var giveHtml = Object.keys(t.give).map(function (id) {
        return itemIcon(id) + '<span>' + ITEMS[id].name + '×' + t.give[id] + '</span>';
      }).join('<span class="mc-recipe-plus">+</span>');
      var getHtml = Object.keys(t.get).map(function (id) {
        return itemIcon(id) + '<span>' + ITEMS[id].name + '×' + t.get[id] + '</span>';
      }).join('<span class="mc-recipe-plus">+</span>');
      var ok = canAfford(t.give);
      row.innerHTML =
        '<div class="mc-recipe-left">' + giveHtml + '</div>' +
        '<div class="mc-recipe-arrow">→</div>' +
        '<div class="mc-recipe-result">' + getHtml + '</div>' +
        '<button class="mc-recipe-btn' + (ok ? '' : ' off') + '" data-trade="' + t.id + '"' + (ok ? '' : ' disabled') + '>交换</button>';
      box.appendChild(row);
    });
    box.querySelectorAll('[data-trade]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var t = TRADES.find(function (x) { return x.id === btn.getAttribute('data-trade'); });
        if (t) trade(t);
      });
    });
  }

  App.el('mcTradeClose').addEventListener('click', function () { App.el('mcTradePanel').classList.add('hidden'); });

  /* ---------- 主循环 ---------- */
  function updateDayNight(dt) {
    time += dt / DAY_LEN;
    if (time >= 1) time -= 1;
    var t = time;
    var na = 1;
    if (t >= 0.06 && t <= 0.78) na = 0;
    else if (t > 0.78 && t < 0.86) na = (t - 0.78) / 0.08;
    else if (t > 0 && t < 0.06) na = 1 - t / 0.06;
    var wasNight = isNight();
    nightAmt = clamp(na, 0, 1);
    if (wasNight && !isNight()) {
      clearHostiles();
      App.toast('🌞 天亮了，怪物消失了');
    }
    var dayColor = new THREE.Color(0x87CEEB);
    var nightColor = new THREE.Color(0x0B1026);
    scene.background.copy(dayColor).lerp(nightColor, nightAmt);
    scene.fog.color.copy(scene.background);
    scene.children.forEach(function (c) {
      if (c.isAmbientLight) c.intensity = 0.68 - nightAmt * 0.52;
      if (c.isDirectionalLight) c.intensity = 0.72 - nightAmt * 0.62;
    });
    var icon = App.el('mcDayNight');
    var isN = isNight();
    icon.textContent = isN ? '🌙 夜晚' : '🌞 白天';
  }

  function updateMobs(dt) {
    var now = Date.now();
    // 夜晚生成怪物
    if (isNight()) {
      var hostile = mobs.filter(function (m) { return m.type === 'zombie' || m.type === 'skeleton'; }).length;
      if (hostile < 4 && Math.random() < dt * 0.6) {
        var ang = rnd(0, Math.PI * 2);
        var rad = rnd(16, 26);
        var mx = clamp(Math.round(camera.position.x + Math.cos(ang) * rad), -BOUND, BOUND);
        var mz = clamp(Math.round(camera.position.z + Math.sin(ang) * rad), -BOUND, BOUND);
        var gy = groundY(mx, mz);
        if (gy <= 32) addMob(Math.random() < 0.5 ? 'zombie' : 'skeleton', mx, gy, mz);
      }
    } else {
      // 白天补充动物（羊/猪/牛保持一定数量）
      [['sheep', 3], ['pig', 2], ['cow', 1], ['fish', 3]].forEach(function (spec) {
        if (Math.random() < dt * 0.08) spawnToTarget(spec[0], spec[1]);
      });
    }

    for (var i = mobs.length - 1; i >= 0; i--) {
      var m = mobs[i];
      if (m.type === 'fish') {
        // 鱼待在水里，轻轻浮动
        m.group.position.set(m.pos.x, m.pos.y + Math.sin(now * 0.002 + m.pos.x * 0.7) * 0.08, m.pos.z);
        if (m.flashUntil && now > m.flashUntil) {
          m.flashUntil = 0;
          m.parts.forEach(function (p) { p.material.emissive = new THREE.Color(0x000000); });
        }
        continue;
      }
      if (m.type === 'sheep' || m.type === 'villager' || m.type === 'pig' || m.type === 'cow') {
        if (!m.wanderUntil || now > m.wanderUntil) {
          m.wanderUntil = now + rnd(1500, 3500);
          if (Math.random() < 0.7) {
            var a = rnd(0, Math.PI * 2);
            m.dir = { x: Math.cos(a), z: Math.sin(a) };
          } else {
            m.dir = null;
          }
        }
      } else {
        if (!isNight()) { removeMob(m); continue; }
        var dx = camera.position.x - m.pos.x;
        var dz = camera.position.z - m.pos.z;
        var d = Math.hypot(dx, dz);
        if (d > 0.5) {
          m.dir = { x: dx / d, z: dz / d };
          m.pos.x += m.dir.x * m.speed * dt;
          m.pos.z += m.dir.z * m.speed * dt;
          m.pos.x = clamp(m.pos.x, -BOUND, BOUND);
          m.pos.z = clamp(m.pos.z, -BOUND, BOUND);
        }
        if (d < 1.5 && Math.abs(camera.position.y - (m.pos.y + 1.3)) < 2 && now > m.nextAtk) {
          damagePlayer(1);
          m.nextAtk = now + 1200;
        }
      }
      if (m.dir) {
        m.pos.y = groundY(m.pos.x, m.pos.z);
        m.group.position.set(m.pos.x, m.pos.y, m.pos.z);
        m.group.rotation.y = Math.atan2(m.dir.x, m.dir.z);
      } else {
        m.pos.y = groundY(m.pos.x, m.pos.z);
        m.group.position.set(m.pos.x, m.pos.y, m.pos.z);
      }
      if (m.flashUntil && now > m.flashUntil) {
        m.flashUntil = 0;
        m.parts.forEach(function (p) { p.material.emissive = new THREE.Color(0x000000); });
      }
      // 只清理离玩家太远的夜间怪物，家畜保留
      if ((m.type === 'zombie' || m.type === 'skeleton') && Math.hypot(m.pos.x - camera.position.x, m.pos.z - camera.position.z) > 42) removeMob(m);
    }
  }

  function updatePhysics(dt) {
    updateFluids(dt);
    var speed = mode === 'survival' ? 7 : 10;
    var forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    var right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
    var move = new THREE.Vector3();
    move.addScaledVector(forward, -joyVec.y);
    move.addScaledVector(right, joyVec.x);
    if (keys['w'] || keys['arrowup']) move.addScaledVector(forward, 1);
    if (keys['s'] || keys['arrowdown']) move.addScaledVector(forward, -1);
    if (keys['a'] || keys['arrowleft']) move.addScaledVector(right, -1);
    if (keys['d'] || keys['arrowright']) move.addScaledVector(right, 1);
    if (move.lengthSq() > 0) move.normalize().multiplyScalar(speed * dt);

    if (mode === 'creative') {
      camera.position.add(move);
      var vy2 = (upPressed || keys[' '] ? 7 : 0) - (downPressed || keys['shift'] ? 7 : 0);
      camera.position.y += vy2 * dt;
      camera.position.y = clamp(camera.position.y, 0.6, 60);
    } else {
      // 岩浆烫伤
      var feetBlock = world[vkey(Math.floor(camera.position.x), Math.floor(camera.position.y - 1.6), Math.floor(camera.position.z))];
      if (isLavaFluid(feetBlock)) damagePlayer(1);
      // 水平碰撞
      if (!collides(camera.position.x + move.x, camera.position.y, camera.position.z)) camera.position.x += move.x;
      if (!collides(camera.position.x, camera.position.y, camera.position.z + move.z)) camera.position.z += move.z;
      // 重力与落地
      var feet = camera.position.y - 1.6;
      var below = Math.floor(feet - 0.001);
      var grounded = vy <= 0 && isSolid(Math.round(camera.position.x), below, Math.round(camera.position.z));
      if (grounded) {
        if (!onGround) {
          onGround = true;
          if (fallStart !== null) {
            var dist = fallStart - feet;
            if (dist > 4) damagePlayer(Math.max(1, Math.floor((dist - 4) / 2)));
            fallStart = null;
          }
        }
        camera.position.y = below + 1 + 1.6;
        vy = 0;
        var jump = upPressed || keys[' '];
        if (jump) { vy = 8.2; onGround = false; fallStart = camera.position.y - 1.6; }
      } else {
        if (onGround) { fallStart = feet; onGround = false; }
        vy -= 22 * dt;
        if (vy < -34) vy = -34;
        camera.position.y += vy * dt;
        if (camera.position.y < 1.7) { camera.position.y = 1.7; vy = 0; }
      }
      // 生存数值
      hunger -= dt / 45;
      if (hunger <= 0) { hunger = 0; hp -= dt * 0.18; }
      if (hunger >= 9 && hp < 10) hp += dt * 0.08;
      hp = clamp(hp, 0, 10);
      hunger = clamp(hunger, 0, 10);
      if (hp <= 0) die();
    }
      camera.position.x = clamp(camera.position.x, -BOUND - 1, BOUND + 1);
      camera.position.z = clamp(camera.position.z, -BOUND - 1, BOUND + 1);
    updateHud();
  }

  function collides(x, eye, z) {
    var half = 0.32;
    var y0 = Math.floor(eye - 1.6);
    var y1 = Math.floor(eye - 0.1);
    var x0 = Math.floor(x - half), x1 = Math.floor(x + half);
    var z0 = Math.floor(z - half), z1 = Math.floor(z + half);
    for (var yy = y0; yy <= y1; yy++) {
      for (var xx = x0; xx <= x1; xx++) {
        for (var zz = z0; zz <= z1; zz++) {
          if (isSolid(xx, yy, zz)) return true;
        }
      }
    }
    return false;
  }

  function animate() {
    requestAnimationFrame(animate);
    var dt = Math.min(clock.getDelta(), 0.05);
    updateDayNight(dt);
    updatePhysics(dt);
    updateMobs(dt);
    updateProjectiles(dt);

    cameraEuler.set(pitch, yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(cameraEuler);

    var t = getTarget();
    if (t) {
      var sign = currentAction === 'break' ? -1 : 1;
      var nx = Math.floor(t.point.x + t.normal.x * 0.05 * sign);
      var ny = Math.floor(t.point.y + t.normal.y * 0.05 * sign);
      var nz = Math.floor(t.point.z + t.normal.z * 0.05 * sign);
      if (currentAction === 'place' && world[vkey(nx, ny, nz)]) {
        highlight.visible = false;
      } else {
        highlight.position.set(nx + 0.5, ny + 0.5, nz + 0.5);
        highlight.visible = true;
      }
    } else {
      highlight.visible = false;
    }

    renderer.render(scene, camera);
  }

  renderLobby();
})();
