/* 我的世界 · 方块乐园（原创体素建造 + 收集合成，Three.js） */
(function () {
  'use strict';

  var data = App.store.load();

  /* ---------- 物品定义 ---------- */
  var ITEMS = {
    grass: { name: '草方块', color: 0x66C74F, kind: 'block' },
    dirt: { name: '泥土', color: 0x8B5A2B, kind: 'block' },
    stone: { name: '石头', color: 0x9A9A9A, kind: 'block' },
    wood: { name: '木头', color: 0x7A5230, kind: 'block' },
    leaves: { name: '树叶', color: 0x2E8B2E, kind: 'block' },
    sand: { name: '沙子', color: 0xE8D98A, kind: 'block' },
    brick: { name: '砖块', color: 0xB5453A, kind: 'block' },
    glass: { name: '玻璃', color: 0xBDE9F5, kind: 'block' },
    plank: { name: '木板', color: 0xC49A5C, kind: 'block' },
    door: { name: '门', color: 0x9C6B30, kind: 'block' },
    door_open: { name: '门（开）', color: 0x7A5230, kind: 'block' },
    workbench: { name: '工作台', color: 0xC98A3D, kind: 'block' },
    stick: { name: '木棒', color: 0xC49A5C, emoji: '🥢', kind: 'material' },
    sword: { name: '宝剑', emoji: '⚔️', kind: 'tool' },
    pickaxe: { name: '稿子', emoji: '⛏️', kind: 'tool' },
    axe: { name: '斧头', emoji: '🪓', kind: 'tool' }
  };

  var HOTBAR = ['grass', 'dirt', 'stone', 'wood', 'leaves', 'sand', 'brick', 'glass', 'plank', 'door', 'workbench'];

  var RECIPES = [
    { id: 'planks', name: '木板', result: 'plank', count: 4, need: { wood: 1 } },
    { id: 'sticks', name: '木棒', result: 'stick', count: 4, need: { plank: 2 } },
    { id: 'sword', name: '宝剑', result: 'sword', count: 1, need: { plank: 2, stick: 1 } },
    { id: 'pickaxe', name: '稿子', result: 'pickaxe', count: 1, need: { plank: 3, stick: 2 } },
    { id: 'axe', name: '斧头', result: 'axe', count: 1, need: { plank: 3, stick: 2 } },
    { id: 'door', name: '门', result: 'door', count: 1, need: { plank: 4 } },
    { id: 'workbench', name: '工作台', result: 'workbench', count: 1, need: { plank: 4 } }
  ];

  var SAVE_KEY = 'xx3_mc_world_v1';
  var world = {};
  var seed = 0;
  var changes = {};
  var backpack = {};
  var equipped = null;
  var meshes = {};
  var meshList = [];
  var currentType = 'grass';
  var currentAction = 'break';

  function vkey(x, y, z) { return x + ',' + y + ',' + z; }

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function generateWorld(s) {
    var rng = mulberry32(s);
    world = {};
    var x, y, z;
    for (x = -15; x <= 15; x++) {
      for (z = -15; z <= 15; z++) {
        for (y = 0; y >= -6; y--) {
          world[vkey(x, y, z)] = y === 0 ? 'grass' : y >= -3 ? 'dirt' : 'stone';
        }
      }
    }
    for (var t = 0; t < 6; t++) {
      var tx = Math.floor(rng() * 20) - 10;
      var tz = Math.floor(rng() * 20) - 10;
      for (y = 1; y <= 4; y++) world[vkey(tx, y, tz)] = 'wood';
      for (var dy = 3; dy <= 5; dy++) {
        var r = dy === 5 ? 1 : 2;
        for (x = -r; x <= r; x++) {
          for (z = -r; z <= r; z++) {
            if (Math.abs(x) === r && Math.abs(z) === r && dy === 4) continue;
            var k = vkey(tx + x, dy, tz + z);
            if (!world[k]) world[k] = 'leaves';
          }
        }
      }
    }
  }

  function applyChanges() {
    Object.keys(changes).forEach(function (k) {
      if (changes[k] === null) delete world[k];
      else world[k] = changes[k];
    });
  }

  function loadWorld() {
    try {
      var raw = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
      seed = raw.seed || (Date.now() % 100000 + 1);
      changes = raw.changes || {};
      backpack = raw.backpack || {};
      equipped = raw.equipped || null;
    } catch (e) {
      seed = Date.now() % 100000 + 1;
      changes = {};
      backpack = {};
      equipped = null;
    }
    generateWorld(seed);
    applyChanges();
  }

  var saveTimer = null;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({ seed: seed, changes: changes, backpack: backpack, equipped: equipped }));
      } catch (e) { /* 空间满就忽略 */ }
    }, 600);
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

  /* ---------- 大厅 ---------- */
  function renderLobby() {
    data = App.store.load();
    App.el('mcChancePill').textContent = '⛏️ ' + (data.mcChances || 0);
    App.el('mcJifenPill').textContent = '💰 ' + (data.jifen || 0);
    App.el('mcLobbyJifen').textContent = data.jifen || 0;
    App.el('mcLobbyChances').textContent = data.mcChances || 0;
    var redeem = App.el('mcRedeemBtn');
    redeem.disabled = (data.jifen || 0) < 10;
    redeem.textContent = (data.jifen || 0) >= 10
      ? '🔄 兑换 1 次机会（-10 积分，现有 ' + data.jifen + '）'
      : '🔄 兑换 1 次机会（还差 ' + (10 - (data.jifen || 0)) + ' 积分）';
    var start = App.el('mcStartBtn');
    start.disabled = (data.mcChances || 0) < 1;
    start.textContent = (data.mcChances || 0) >= 1
      ? '🚀 开始建造（还有 ' + data.mcChances + ' 次机会）'
      : '🚀 积分不够 10 分，先做作业吧';
  }

  App.el('mcRedeemBtn').addEventListener('click', function () {
    data = App.store.load();
    if (App.redeemMcChance(data)) {
      App.logActivity(data, '兑换我的世界机会');
      App.toast('兑换成功，+1 次机会！');
      renderLobby();
    } else {
      App.toast('积分还不够 10 分哦');
    }
  });

  App.el('mcStartBtn').addEventListener('click', function () {
    data = App.store.load();
    if (!App.useMcChance(data)) { App.toast('没有机会啦'); return; }
    renderLobby();
    App.logActivity(data, '玩我的世界');
    startGame();
  });

  App.el('mcExit').addEventListener('click', function () {
    window.location.href = 'index.html';
  });

  /* ---------- Three.js 场景 ---------- */
  var renderer = null, scene = null, camera = null, highlight = null, raycaster = null, clock = null;
  var yaw = Math.PI, pitch = -0.25;
  var cameraEuler = null;

  function startGame() {
    App.el('mcLobby').classList.add('hidden');
    App.el('mcGame').classList.remove('hidden');
    try {
      init3D();
    } catch (e) {
      App.toast('此设备不支持 3D 游戏');
      console.error('3D init failed:', e);
      App.el('mcLobby').classList.remove('hidden');
      App.el('mcGame').classList.add('hidden');
    }
  }

  function init3D() {
    loadWorld();
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    App.el('mcGame').appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 32, 70);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 9, 13);
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
    bindControls();
    renderHotbar();
    updateLabel();
    window.addEventListener('resize', onResize);
    animate();

    // 测试钩子
    window.__mc = {
      addItem: addItem,
      craft: function (id) {
        var r = RECIPES.find(function (x) { return x.id === id; });
        return r ? craft(r) : false;
      },
      backpack: backpack,
      equipped: function () { return equipped; }
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
    if (id === 'glass') {
      return new THREE.MeshLambertMaterial({ color: b.color, transparent: true, opacity: 0.35, depthWrite: false });
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
    var mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), materialFor(id), coords.length);
    var m = new THREE.Matrix4();
    coords.forEach(function (c, i) {
      m.makeTranslation(c[0] + 0.5, c[1] + 0.5, c[2] + 0.5);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = coords.length;
    scene.add(mesh);
    meshes[id] = mesh;
    meshList.push(mesh);
  }

  function getTarget() {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    var hits = raycaster.intersectObjects(meshList, false);
    if (!hits.length) return null;
    var hit = hits[0];
    var n = hit.face.normal.clone();
    n.transformDirection(hit.object.matrixWorld);
    return { point: hit.point, normal: n };
  }

  function removeVoxel(k, type) {
    delete world[k];
    changes[k] = null;
    rebuildType(type);
  }

  function doBreak() {
    var t = getTarget();
    if (!t) return;
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
    var drop = type === 'door' || type === 'door_open' ? 'door' : type;
    var n = 1;
    if (drop === 'wood' && equipped === 'axe') n += 1;
    if (drop === 'stone' && equipped === 'pickaxe') n += 1;
    addItem(drop, n);
    renderBackpack();
    playSound('break');
    scheduleSave();
  }

  function doPlace() {
    var t = getTarget();
    if (!t) return;
    var vx = Math.floor(t.point.x + t.normal.x * 0.05);
    var vy = Math.floor(t.point.y + t.normal.y * 0.05);
    var vz = Math.floor(t.point.z + t.normal.z * 0.05);
    var k = vkey(vx, vy, vz);
    if (world[k]) return;
    if (vx < -16 || vx > 16 || vz < -16 || vz > 16 || vy > 40 || vy < -8) return;
    if (insidePlayer(vx, vy, vz)) return;

    if (currentType === 'door') {
      var top = vkey(vx, vy + 1, vz);
      if (world[top] || vy + 1 > 40 || insidePlayer(vx, vy + 1, vz)) return;
      world[k] = 'door';
      changes[k] = 'door';
      world[top] = 'door';
      changes[top] = 'door';
      rebuildType('door');
    } else {
      world[k] = currentType;
      changes[k] = currentType;
      rebuildType(currentType);
    }
    scheduleSave();
    playSound('place');
  }

  function insidePlayer(x, y, z) {
    var dx = camera.position.x - (x + 0.5);
    var dz = camera.position.z - (z + 0.5);
    var dy = camera.position.y - (y + 0.5);
    return Math.abs(dx) < 0.9 && Math.abs(dz) < 0.9 && Math.abs(dy) < 1.8;
  }

  function doUse() {
    var t = getTarget();
    if (!t) return;
    var vx = Math.floor(t.point.x - t.normal.x * 0.05);
    var vy = Math.floor(t.point.y - t.normal.y * 0.05);
    var vz = Math.floor(t.point.z - t.normal.z * 0.05);
    var k = vkey(vx, vy, vz);
    var type = world[k];
    if (type === 'workbench') {
      openCrafting();
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

  var actx = null;
  function playSound(kind) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var o = actx.createOscillator();
      var g = actx.createGain();
      o.type = 'square';
      o.frequency.value = kind === 'place' ? 260 : 150;
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

  function bindControls() {
    var game = App.el('mcGame');
    game.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.mc-ui')) return;
      if (lookPointer === null) {
        lookPointer = e.pointerId;
        lookLast = { x: e.clientX, y: e.clientY };
      }
    });
    game.addEventListener('pointermove', function (e) {
      if (e.pointerId !== lookPointer) return;
      var dx = e.clientX - lookLast.x;
      var dy = e.clientY - lookLast.y;
      lookLast = { x: e.clientX, y: e.clientY };
      yaw -= dx * 0.006;
      pitch -= dy * 0.006;
      pitch = Math.max(-1.5, Math.min(1.5, pitch));
    });
    function release(e) {
      if (e.pointerId === lookPointer) lookPointer = null;
    }
    game.addEventListener('pointerup', release);
    game.addEventListener('pointercancel', release);

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

    App.el('mcPackBtn').addEventListener('click', toggleBackpack);

    window.addEventListener('keydown', function (e) {
      keys[e.key.toLowerCase()] = true;
      if (e.key >= '1' && e.key <= '9') { currentType = HOTBAR[+e.key - 1] || currentType; renderHotbar(); updateLabel(); }
    });
    window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });
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
    var bar = App.el('mcHotbar');
    bar.innerHTML = '';
    HOTBAR.forEach(function (id) {
      var b = ITEMS[id];
      var btn = document.createElement('button');
      btn.className = 'mc-block mc-ui' + (id === currentType ? ' sel' : '');
      btn.style.background = '#' + b.color.toString(16).padStart(6, '0');
      btn.title = b.name;
      btn.addEventListener('click', function () {
        currentType = id;
        renderHotbar();
        updateLabel();
      });
      bar.appendChild(btn);
    });
  }

  function updateLabel() {
    var label = App.el('mcLabel');
    var act = currentAction === 'break' ? '⛏️ 拆方块' : currentAction === 'place' ? '🧱 放：' + ITEMS[currentType].name : '👆 使用';
    if (equipped) act += ' · 手持 ' + ITEMS[equipped].name;
    label.textContent = act;
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
      row.className = 'mc-pack-row';
      var count = backpack[id];
      var action = '';
      if (it.kind === 'tool') {
        action = equipped === id
          ? '<button class="mc-pack-act on" data-equip="' + id + '">已装备</button>'
          : '<button class="mc-pack-act" data-equip="' + id + '">装备</button>';
      }
      row.innerHTML = itemIcon(id) +
        '<span class="mc-pack-name">' + it.name + '</span>' +
        '<span class="mc-pack-count">×' + count + '</span>' + action;
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

  function animate() {
    requestAnimationFrame(animate);
    var dt = Math.min(clock.getDelta(), 0.05);
    var speed = 10, upSpeed = 7;

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
    camera.position.add(move);

    var vy = (upPressed || keys[' '] ? upSpeed : 0) - (downPressed || keys['shift'] ? upSpeed : 0);
    camera.position.y += vy * dt;
    camera.position.y = Math.max(0.6, Math.min(60, camera.position.y));
    camera.position.x = Math.max(-17, Math.min(17, camera.position.x));
    camera.position.z = Math.max(-17, Math.min(17, camera.position.z));

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
