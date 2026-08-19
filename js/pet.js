/* i同步学 · 宠物乐园
   养小仓鼠：自己布置大/小笼子、透明管道、跑轮、大小饭盒、玩耍球；
   🖌️ 画笔进建造模式，✅ OK 退出；仓鼠在笼子与管道间自由活动。 */
(function () {
  'use strict';

  var SAVE_KEY = 'xx3_pet_v1';
  var GW = 12;
  var GH = 8;
  var MAX_HAM = 8;

  var save = { items: {}, hamsters: [] };
  try {
    var raw = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    if (raw.items && typeof raw.items === 'object') save.items = raw.items;
    if (Array.isArray(raw.hamsters)) save.hamsters = raw.hamsters;
  } catch (e) { /* ignore */ }

  function saveNow() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ }
  }

  var ITEMS = [
    { t: 'cage2', name: '大笼子', emoji: '🏠', w: 2, h: 2 },
    { t: 'cage1', name: '小笼子', emoji: '🏠', w: 1, h: 1 },
    { t: 'pipe', name: '透明管道', emoji: '🧪', w: 1, h: 1 },
    { t: 'wheel', name: '跑轮', emoji: '🎡', w: 1, h: 1 },
    { t: 'bowl', name: '大饭盒', emoji: '🍚', w: 1, h: 1 },
    { t: 'bowl2', name: '小饭盒', emoji: '🍚', w: 1, h: 1 },
    { t: 'ball', name: '玩耍球', emoji: '⚽', w: 1, h: 1 }
  ];
  var ITEM_BY_T = {};
  ITEMS.forEach(function (it) { ITEM_BY_T[it.t] = it; });

  var HAM_COLORS = [
    { c: 'gray', name: '灰色仓鼠', body: '#B9BAC4', belly: '#EFEFF4', face: '#B9BAC4' },
    { c: 'white', name: '白色仓鼠', body: '#F7F3EA', belly: '#FFFFFF', face: '#F7F3EA' },
    { c: 'cream', name: '黄白仓鼠', body: '#E7C878', belly: '#FFF6E0', face: '#FFF6E0' }
  ];
  var HAM_BY_C = {};
  HAM_COLORS.forEach(function (h) { HAM_BY_C[h.c] = h; });

  var buildMode = false;
  var selected = null; // 物品 t 或仓鼠色 'ham:gray'
  var tickTimer = null;
  var gridEl = null;
  var cells = [];

  /* ---------- 音效：仓鼠吱吱 ---------- */
  var audioCtx = null;
  function initAudio() {
    if (audioCtx) return;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* ignore */ }
  }
  function squeak() {
    if (!audioCtx) return;
    var t0 = audioCtx.currentTime;
    [2600, 3100, 2700].forEach(function (f, i) {
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, t0 + i * 0.09);
      g.gain.setValueAtTime(0.0001, t0 + i * 0.09);
      g.gain.exponentialRampToValueAtTime(0.08, t0 + i * 0.09 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.09 + 0.08);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(t0 + i * 0.09);
      o.stop(t0 + i * 0.09 + 0.1);
    });
  }

  /* ---------- 仓鼠 SVG ---------- */
  function hamsterSvg(h) {
    var col = HAM_BY_C[h.c] || HAM_BY_C.gray;
    var body = col.body, belly = col.belly, face = col.face;
    return '' +
      '<svg viewBox="0 0 110 74" class="ham-body">' +
      /* 尾巴 */
      '<ellipse cx="14" cy="46" rx="9" ry="6" fill="' + body + '"/>' +
      /* 后腿 */
      '<ellipse cx="30" cy="62" rx="9" ry="5" fill="' + body + '"/>' +
      '<ellipse cx="62" cy="63" rx="9" ry="5" fill="' + body + '"/>' +
      /* 身体 */
      '<ellipse cx="52" cy="46" rx="36" ry="21" fill="' + body + '"/>' +
      '<ellipse cx="46" cy="53" rx="24" ry="12" fill="' + belly + '"/>' +
      /* 前腿 */
      '<ellipse cx="76" cy="60" rx="7" ry="4" fill="' + body + '"/>' +
      /* 头 */
      '<ellipse cx="86" cy="32" rx="20" ry="17" fill="' + body + '"/>' +
      (h.c === 'cream' ? '<ellipse cx="90" cy="35" rx="11" ry="9" fill="' + face + '"/>' : '') +
      /* 耳朵 */
      '<ellipse cx="78" cy="15" rx="8" ry="10" fill="' + body + '"/>' +
      '<ellipse cx="78" cy="15" rx="4.5" ry="6.5" fill="#FFB9C8"/>' +
      '<ellipse cx="94" cy="16" rx="8" ry="10" fill="' + body + '"/>' +
      '<ellipse cx="94" cy="16" rx="4.5" ry="6.5" fill="#FFB9C8"/>' +
      /* 眼睛 */
      '<circle cx="90" cy="28" r="3.4" fill="#26262E"/>' +
      '<circle cx="90.8" cy="26.8" r="1.1" fill="#fff"/>' +
      /* 鼻子 */
      '<circle cx="102" cy="34" r="2.8" fill="#FF9BB0"/>' +
      /* 胡须 */
      '<path d="M102 36 L112 39 M102 37 L111 43 M100 37 L109 45" stroke="#C9C4BC" stroke-width="1.4" stroke-linecap="round" fill="none"/>' +
      '</svg>';
  }

  /* ---------- 物品视觉 ---------- */
  function itemHtml(t) {
    if (t === 'cage2') return '<div class="pet-cage big"></div>';
    if (t === 'cage1') return '<div class="pet-cage small"></div>';
    if (t === 'pipe') return '<div class="pet-pipe"></div>';
    if (t === 'wheel') return '<div class="pet-wheel"><div class="pet-wheel-ring"><span class="pet-wheel-spoke s1"></span><span class="pet-wheel-spoke s2"></span><span class="pet-wheel-spoke s3"></span><span class="pet-wheel-spoke s4"></span></div><div class="pet-wheel-stand"></div></div>';
    if (t === 'bowl' || t === 'bowl2') return '<div class="pet-bowl ' + t + '"><span class="pet-food"></span><span class="pet-food f2"></span></div>';
    if (t === 'ball') return '<div class="pet-ball"></div>';
    return '';
  }

  /* ---------- 网格 ---------- */
  function key(x, y) { return x + ',' + y; }

  function itemAt(x, y) {
    var k = key(x, y);
    return save.items[k] || null;
  }

  function occupied(x, y) {
    // 检查该格是否被任何物品占用（含大笼子从格）
    if (save.items[key(x, y)]) return true;
    for (var k in save.items) {
      var it = save.items[k];
      var m = ITEM_BY_T[it.t];
      var p = k.split(',');
      var ax = +p[0], ay = +p[1];
      if (m.w === 2 && x >= ax && x < ax + 2 && y >= ay && y < ay + 2) return true;
    }
    return false;
  }

  function removeItemAt(x, y) {
    for (var k in save.items) {
      var it = save.items[k];
      var m = ITEM_BY_T[it.t];
      var p = k.split(',');
      var ax = +p[0], ay = +p[1];
      if (m.w === 2 && x >= ax && x < ax + 2 && y >= ay && y < ay + 2) {
        delete save.items[k];
        return;
      }
      if (ax === x && ay === y) { delete save.items[k]; return; }
    }
  }

  function canPlace(t, x, y) {
    var m = ITEM_BY_T[t];
    for (var j = 0; j < m.h; j++) {
      for (var i = 0; i < m.w; i++) {
        var nx = x + i, ny = y + j;
        if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) return false;
        if (occupied(nx, ny)) return false;
      }
    }
    return true;
  }

  function renderGrid() {
    gridEl = App.el('petGrid');
    gridEl.innerHTML = '';
    cells = [];
    for (var y = 0; y < GH; y++) {
      for (var x = 0; x < GW; x++) {
        var cell = document.createElement('div');
        cell.className = 'pet-cell' + (buildMode ? ' editable' : '');
        cell.dataset.x = x;
        cell.dataset.y = y;
        cell.addEventListener('click', function () { onCellClick(this); });
        // 物品视觉
        var it = save.items[key(x, y)];
        if (it) {
          var m = ITEM_BY_T[it.t];
          if (m.w === 1 || (m.w === 2 && x === +key(x, y).split(',')[0] && y === +key(x, y).split(',')[1])) {
            cell.classList.add('has-item');
            if (m.w === 2) cell.classList.add('item-2x2');
            cell.innerHTML = itemHtml(it.t);
          } else {
            cell.classList.add('occupied');
          }
        } else if (occupied(x, y)) {
          cell.classList.add('occupied');
        }
        // 仓鼠
        save.hamsters.forEach(function (h, idx) {
          if (h.x === x && h.y === y) {
            var ham = document.createElement('div');
            ham.className = 'pet-hamster ' + (h.st || 'walk') + (h.face < 0 ? ' flip' : '');
            ham.dataset.hidx = idx;
            ham.innerHTML = hamsterSvg(h);
            ham.addEventListener('click', function (e) {
              e.stopPropagation();
              tapHamster(idx, ham);
            });
            cell.appendChild(ham);
          }
        });
        gridEl.appendChild(cell);
        cells.push(cell);
      }
    }
  }

  function tapHamster(idx, el) {
    initAudio();
    squeak();
    el.classList.remove('jump');
    void el.offsetWidth;
    el.classList.add('jump');
    var bubble = document.createElement('div');
    bubble.className = 'pet-squeak';
    bubble.textContent = '吱吱！';
    el.appendChild(bubble);
    setTimeout(function () { bubble.remove(); }, 900);
  }

  /* ---------- 建造 ---------- */
  function renderPalette() {
    var pal = App.el('petPalette');
    pal.innerHTML = '';
    ITEMS.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pet-pal-item' + (selected === it.t ? ' on' : '');
      b.innerHTML = '<span class="pet-pal-emoji">' + it.emoji + '</span><span>' + it.name + '</span>';
      b.addEventListener('click', function () {
        selected = selected === it.t ? null : it.t;
        renderPalette();
      });
      pal.appendChild(b);
    });
    HAM_COLORS.forEach(function (h) {
      var keySel = 'ham:' + h.c;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pet-pal-item ham' + (selected === keySel ? ' on' : '');
      b.innerHTML = '<span class="pet-pal-ham">' + hamsterSvg({ c: h.c }) + '</span><span>' + h.name + '</span>';
      b.addEventListener('click', function () {
        selected = selected === keySel ? null : keySel;
        renderPalette();
      });
      pal.appendChild(b);
    });
  }

  function onCellClick(cell) {
    if (!buildMode) return;
    var x = +cell.dataset.x, y = +cell.dataset.y;
    if (!selected) {
      // 没有选中物品时，点已有物品删除
      if (save.items[key(x, y)] || occupied(x, y)) {
        removeItemAt(x, y);
        saveNow();
        renderGrid();
      }
      return;
    }
    if (selected.indexOf('ham:') === 0) {
      var c = selected.split(':')[1];
      if (save.hamsters.length >= MAX_HAM) { App.toast('仓鼠太多啦，最多 ' + MAX_HAM + ' 只'); return; }
      if (occupied(x, y)) { App.toast('这里放不下仓鼠'); return; }
      save.hamsters.push({ c: c, x: x, y: y, st: 'walk', face: 1, until: 0 });
      saveNow();
      renderGrid();
      return;
    }
    var it = ITEM_BY_T[selected];
    if (!it) return;
    if (!canPlace(it.t, x, y)) { App.toast('这里放不下，换个位置试试'); return; }
    save.items[key(x, y)] = { t: it.t };
    saveNow();
    renderGrid();
  }

  function enterBuild() {
    buildMode = true;
    initAudio();
    App.el('buildBtn').classList.add('hidden');
    App.el('okBtn').classList.remove('hidden');
    App.el('petPalette').classList.remove('hidden');
    App.el('petTip').textContent = '🏗️ 选一个东西，点格子放置；再点已放的可以拆掉。布置好点「✅ OK」';
    renderPalette();
    renderGrid();
  }

  function exitBuild() {
    buildMode = false;
    selected = null;
    App.el('buildBtn').classList.remove('hidden');
    App.el('okBtn').classList.add('hidden');
    App.el('petPalette').classList.add('hidden');
    App.el('petTip').textContent = '🐹 小仓鼠开始玩耍啦！点仓鼠它会吱吱叫～';
    renderGrid();
  }

  /* ---------- 仓鼠 AI ---------- */
  function hamsterTick() {
    if (buildMode) return;
    save.hamsters.forEach(function (h) {
      if (h.st !== 'walk' && h.until > Date.now()) return;
      h.st = 'walk';
      var it = itemAt(h.x, h.y);
      if (it && it.t === 'wheel') {
        h.st = 'wheel';
        h.until = Date.now() + 2600;
        return;
      }
      if (it && (it.t === 'bowl' || it.t === 'bowl2')) {
        h.st = 'eat';
        h.until = Date.now() + 2000;
        return;
      }
      if (it && it.t === 'ball') {
        h.st = 'ball';
        h.until = Date.now() + 1500;
        return;
      }
      // 随机走动
      var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      var d = dirs[Math.floor(Math.random() * dirs.length)];
      var nx = h.x + d[0], ny = h.y + d[1];
      if (nx >= 0 && ny >= 0 && nx < GW && ny < GH && !occupied(nx, ny)) {
        h.x = nx;
        h.y = ny;
        h.face = d[0] !== 0 ? d[0] : h.face;
      }
    });
    renderGrid();
    saveNow();
  }

  /* ---------- 默认布置（首次进入） ---------- */
  function defaultLayout() {
    if (Object.keys(save.items).length || save.hamsters.length) return;
    save.items = {
      '1,5': { t: 'cage2' },   // 下层大笼子
      '5,6': { t: 'cage1' },   // 小笼子
      '7,6': { t: 'wheel' },
      '9,6': { t: 'bowl' },
      '3,7': { t: 'bowl2' },
      '2,0': { t: 'cage2' },   // 上层大笼子
      '5,0': { t: 'pipe' },    // 垂直管道通往上层
      '5,1': { t: 'pipe' },
      '5,2': { t: 'pipe' },
      '5,3': { t: 'pipe' },
      '5,4': { t: 'pipe' },
      '8,1': { t: 'ball' }
    };
    save.hamsters = [
      { c: 'gray', x: 2, y: 6, st: 'walk', face: 1, until: 0 },
      { c: 'white', x: 5, y: 6, st: 'walk', face: -1, until: 0 },
      { c: 'cream', x: 4, y: 1, st: 'walk', face: 1, until: 0 }
    ];
    saveNow();
  }

  /* ---------- 初始化 ---------- */
  App.el('buildBtn').addEventListener('click', enterBuild);
  App.el('okBtn').addEventListener('click', exitBuild);

  defaultLayout();
  renderGrid();
  renderPalette();
  tickTimer = setInterval(hamsterTick, 750);

  /* 调试接口 */
  window.__pet = {
    state: function () {
      return {
        build: buildMode,
        items: save.items,
        hamsters: save.hamsters.map(function (h) { return { c: h.c, x: h.x, y: h.y, st: h.st }; })
      };
    },
    enterBuild: enterBuild,
    exitBuild: exitBuild,
    place: function (t, x, y) {
      var it = ITEM_BY_T[t];
      if (it && canPlace(t, x, y)) { save.items[key(x, y)] = { t: t }; saveNow(); renderGrid(); return true; }
      return false;
    },
    addHamster: function (c, x, y) {
      if (save.hamsters.length >= MAX_HAM) return false;
      save.hamsters.push({ c: c, x: x, y: y, st: 'walk', face: 1, until: 0 });
      saveNow(); renderGrid(); return true;
    },
    tick: hamsterTick
  };
})();
