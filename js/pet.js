/* i同步学 · 宠物乐园（无限地图版）
   白胖真实小仓鼠（灰/白/黄白），身体会摇；无限大地图可放很多笼子；
   物品：大/小笼子、小房子（仓鼠喜欢在里面休息）、自动连接的透明管道
   （直/弯/十字路口自动出现）、跑轮、大小饭碗、玩耍球；
   互动：长按拖拽仓鼠、点一下推它、🍎喂食物（掉进碗或落地，仓鼠会吃）；
   养满 3 天仓鼠会生 4-5 只宝宝；🗑️删除工具可拆掉不想要的东西。 */
(function () {
  'use strict';

  var SAVE_KEY = 'xx3_pet_v1';
  var VIEW_COLS = 14;
  var VIEW_ROWS = 9;
  var MAX_HAM = 8;
  var BREED_MS = 3 * 24 * 3600 * 1000; // 3 天

  var save = { items: {}, hamsters: [], family: { start: 0, babies: [] } };
  try {
    var raw = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    if (raw.items && typeof raw.items === 'object') save.items = raw.items;
    if (Array.isArray(raw.hamsters)) save.hamsters = raw.hamsters;
    if (raw.family && typeof raw.family === 'object') save.family = raw.family;
  } catch (e) { /* ignore */ }
  if (!save.family) save.family = { start: 0, babies: [] };
  if (!save.family.start) save.family.start = Date.now();
  if (!Array.isArray(save.family.babies)) save.family.babies = [];

  function saveNow() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ }
  }

  var ITEMS = [
    { t: 'cage2', name: '大笼子', emoji: '🏠', w: 2, h: 2 },
    { t: 'cage1', name: '小笼子', emoji: '🏠', w: 1, h: 1 },
    { t: 'house', name: '小房子', emoji: '🏡', w: 2, h: 2 },
    { t: 'pipe', name: '管道', emoji: '🧪', w: 1, h: 1 },
    { t: 'wheel', name: '跑轮', emoji: '🎡', w: 1, h: 1 },
    { t: 'bowl', name: '大饭碗', emoji: '🍚', w: 1, h: 1 },
    { t: 'bowl2', name: '小饭碗', emoji: '🍚', w: 1, h: 1 },
    { t: 'ball', name: '玩耍球', emoji: '⚽', w: 1, h: 1 }
  ];
  var ITEM_BY_T = {};
  ITEMS.forEach(function (it) { ITEM_BY_T[it.t] = it; });
  ITEM_BY_T.food = { t: 'food', name: '食物', emoji: '🥜', w: 1, h: 1 };

  var HAM_COLORS = [
    { c: 'white', name: '白色仓鼠', body: '#FBF6EE', dark: '#E2D6C4', belly: '#FFFFFF' },
    { c: 'gray', name: '灰色仓鼠', body: '#C9CAD2', dark: '#A7A8B4', belly: '#F2F2F6' },
    { c: 'cream', name: '黄白仓鼠', body: '#EACB80', dark: '#D3A94F', belly: '#FFF6E0' }
  ];
  var HAM_BY_C = {};
  HAM_COLORS.forEach(function (h) { HAM_BY_C[h.c] = h; });

  var view = { x: -2, y: -1 };
  var buildMode = false;
  var feedMode = false;
  var selected = null;
  var tool = 'place'; // place | delete
  var tickTimer = null;
  var gridEl = null;
  var pan = null; // 视图平移
  var dragHam = null; // 仓鼠拖拽
  var dragGhost = null;

  function key(x, y) { return x + ',' + y; }

  /* ---------- 音效 ---------- */
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

  /* ---------- 真实白胖仓鼠 SVG ---------- */
  function hamsterSvg(h, baby) {
    var col = HAM_BY_C[h.c] || HAM_BY_C.white;
    var scale = baby ? 0.6 : 1;
    var body = col.body, dark = col.dark, belly = col.belly;
    return '' +
      '<svg viewBox="0 0 120 92" width="' + Math.round(82 * scale) + '" height="' + Math.round(63 * scale) + '">' +
      '<defs><radialGradient id="g' + h.c + '" cx="38%" cy="30%" r="85%">' +
      '<stop offset="0%" stop-color="' + body + '"/><stop offset="100%" stop-color="' + dark + '"/>' +
      '</radialGradient></defs>' +
      /* 小短尾 */
      '<ellipse cx="15" cy="58" rx="7" ry="5" fill="' + dark + '"/>' +
      /* 后腿 */
      '<ellipse cx="34" cy="82" rx="10" ry="6" fill="' + dark + '"/>' +
      '<ellipse cx="78" cy="83" rx="10" ry="6" fill="' + dark + '"/>' +
      /* 前爪 */
      '<ellipse cx="94" cy="81" rx="8" ry="5" fill="' + dark + '"/>' +
      /* 圆胖身体 */
      '<ellipse cx="58" cy="58" rx="47" ry="30" fill="url(#g' + h.c + ')"/>' +
      '<ellipse cx="55" cy="67" rx="30" ry="17" fill="' + belly + '"/>' +
      /* 头（与身体圆润融合） */
      '<ellipse cx="92" cy="34" rx="27" ry="25" fill="url(#g' + h.c + ')"/>' +
      (h.c === 'cream' ? '<ellipse cx="100" cy="39" rx="14" ry="12" fill="' + belly + '"/>' : '') +
      '<ellipse cx="98" cy="44" rx="13" ry="10" fill="' + belly + '"/>' +
      /* 小圆耳 */
      '<circle cx="81" cy="12" r="8" fill="url(#g' + h.c + ')"/>' +
      '<circle cx="81" cy="12" r="4.5" fill="#FFC0CB"/>' +
      '<circle cx="103" cy="12" r="8" fill="url(#g' + h.c + ')"/>' +
      '<circle cx="103" cy="12" r="4.5" fill="#FFC0CB"/>' +
      /* 大眼睛 */
      '<circle cx="99" cy="28" r="4.6" fill="#1F1F28"/>' +
      '<circle cx="100.6" cy="26.4" r="1.6" fill="#fff"/>' +
      /* 鼻子与嘴 */
      '<ellipse cx="114" cy="36" rx="3.4" ry="2.8" fill="#FF9BB0"/>' +
      '<path d="M114 39 Q111 43 108 42 M114 39 Q117 43 120 42" stroke="#B98B7A" stroke-width="1.3" fill="none" stroke-linecap="round"/>' +
      /* 胡须 */
      '<path d="M112 37 L122 39 M112 38 L121 43 M111 40 L119 46" stroke="#E0D9CE" stroke-width="1.2" stroke-linecap="round" fill="none"/>' +
      '</svg>';
  }

  /* ---------- 物品视觉 ---------- */
  function itemHtml(it, wx, wy) {
    var t = it.t;
    if (t === 'cage2') return '<div class="pet-cage big"></div>';
    if (t === 'cage1') return '<div class="pet-cage small"></div>';
    if (t === 'house') return '<div class="pet-house"></div>';
    if (t === 'pipe') return pipeHtml(wx, wy);
    if (t === 'wheel') return '<div class="pet-wheel"><div class="pet-wheel-ring"><span class="pet-wheel-spoke s1"></span><span class="pet-wheel-spoke s2"></span><span class="pet-wheel-spoke s3"></span><span class="pet-wheel-spoke s4"></span></div><div class="pet-wheel-stand"></div></div>';
    if (t === 'bowl' || t === 'bowl2') {
      var n = Math.max(1, it.foodN || 1);
      var seeds = '';
      for (var i = 0; i < Math.min(5, n); i++) {
        seeds += '<span class="pet-food" style="left:' + (22 + i * 15) + '%;top:' + (30 + (i % 2) * 20) + '%;"></span>';
      }
      return '<div class="pet-bowl ' + t + '"><span class="pet-bowl-shine"></span>' + seeds + '</div>';
    }
    if (t === 'ball') return '<div class="pet-ball"></div>';
    if (t === 'food') return '<div class="pet-food-ground">🥜</div>';
    return '';
  }

  function isPipe(wx, wy) {
    var it = save.items[key(wx, wy)];
    return !!(it && it.t === 'pipe');
  }

  function pipeHtml(wx, wy) {
    var up = isPipe(wx, wy - 1), down = isPipe(wx, wy + 1);
    var left = isPipe(wx - 1, wy), right = isPipe(wx + 1, wy);
    var arms = '';
    arms += '<span class="arm up" style="' + (up ? '' : 'display:none') + '"></span>';
    arms += '<span class="arm down" style="' + (down ? '' : 'display:none') + '"></span>';
    arms += '<span class="arm left" style="' + (left ? '' : 'display:none') + '"></span>';
    arms += '<span class="arm right" style="' + (right ? '' : 'display:none') + '"></span>';
    return '<div class="pet-pipe">' + arms + '<span class="hub"></span></div>';
  }

  /* ---------- 物品占用 ---------- */
  function itemAt(x, y) { return save.items[key(x, y)] || null; }

  function occupied(x, y) {
    var it0 = save.items[key(x, y)];
    if (it0 && it0.t !== 'food') return true;
    for (var k in save.items) {
      var it = save.items[k];
      if (it.t === 'food') continue;
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
      if (m.w === 2 && x >= ax && x < ax + 2 && y >= ay && y < ay + 2) { delete save.items[k]; return; }
      if (ax === x && ay === y) { delete save.items[k]; return; }
    }
  }

  function canPlace(t, x, y) {
    var m = ITEM_BY_T[t];
    for (var j = 0; j < m.h; j++) {
      for (var i = 0; i < m.w; i++) {
        if (occupied(x + i, y + j)) return false;
      }
    }
    return true;
  }

  /* ---------- 网格渲染（无限地图） ---------- */
  function renderGrid() {
    gridEl = App.el('petGrid');
    gridEl.innerHTML = '';
    for (var wy = view.y; wy < view.y + VIEW_ROWS; wy++) {
      for (var wx = view.x; wx < view.x + VIEW_COLS; wx++) {
        var cell = document.createElement('div');
        cell.className = 'pet-cell' + (buildMode ? ' editable' : '');
        cell.dataset.wx = wx;
        cell.dataset.wy = wy;
        cell.addEventListener('click', function () { onCellClick(this); });
        var it = save.items[key(wx, wy)];
        if (it) {
          var m = ITEM_BY_T[it.t];
          if (m.w === 1 || (m.w === 2 && save.items[key(wx, wy)] && wx === +key(wx, wy).split(',')[0] && wy === +key(wx, wy).split(',')[1])) {
            cell.classList.add('has-item');
            if (m.w === 2) cell.classList.add('item-2x2');
            cell.innerHTML = itemHtml(it, wx, wy);
          } else {
            cell.classList.add('occupied');
          }
        } else if (occupied(wx, wy)) {
          cell.classList.add('occupied');
        }
        save.hamsters.forEach(function (h, idx) {
          if (h.x === wx && h.y === wy) {
            var ham = document.createElement('div');
            ham.className = 'pet-hamster ' + (h.st || 'walk') + (h.face < 0 ? ' flip' : '');
            ham.innerHTML = hamsterSvg(h);
            ham.addEventListener('pointerdown', function (e) { hamPointerDown(e, idx, ham); });
            cell.appendChild(ham);
          }
        });
        save.family.babies.forEach(function (b) {
          if (b.x === wx && b.y === wy) {
            var baby = document.createElement('div');
            baby.className = 'pet-hamster baby';
            baby.innerHTML = hamsterSvg(b, true);
            cell.appendChild(baby);
          }
        });
        gridEl.appendChild(cell);
      }
    }
  }

  /* ---------- 建造 ---------- */
  function renderPalette() {
    var pal = App.el('petPalette');
    pal.innerHTML = '';
    ITEMS.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pet-pal-item' + (tool === 'place' && selected === it.t ? ' on' : '');
      b.innerHTML = '<span class="pet-pal-emoji">' + it.emoji + '</span><span>' + it.name + '</span>';
      b.addEventListener('click', function () {
        tool = 'place';
        selected = selected === it.t ? null : it.t;
        renderPalette();
      });
      pal.appendChild(b);
    });
    HAM_COLORS.forEach(function (h) {
      var keySel = 'ham:' + h.c;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pet-pal-item ham' + (tool === 'place' && selected === keySel ? ' on' : '');
      b.innerHTML = '<span class="pet-pal-ham">' + hamsterSvg({ c: h.c }) + '</span><span>' + h.name + '</span>';
      b.addEventListener('click', function () {
        tool = 'place';
        selected = selected === keySel ? null : keySel;
        renderPalette();
      });
      pal.appendChild(b);
    });
    // 删除工具
    var del = document.createElement('button');
    del.type = 'button';
    del.className = 'pet-pal-item del' + (tool === 'delete' ? ' on' : '');
    del.innerHTML = '<span class="pet-pal-emoji">🗑️</span><span>删除</span>';
    del.addEventListener('click', function () {
      tool = tool === 'delete' ? 'place' : 'delete';
      selected = null;
      renderPalette();
    });
    pal.appendChild(del);
  }

  function onCellClick(cell) {
    var wx = +cell.dataset.wx, wy = +cell.dataset.wy;
    if (feedMode && !buildMode) { dropFood(wx, wy); return; }
    if (!buildMode) return;
    if (tool === 'delete') {
      if (save.items[key(wx, wy)] || occupied(wx, wy)) {
        removeItemAt(wx, wy);
        saveNow();
        renderGrid();
        App.toast('🗑️ 拆掉啦');
      }
      return;
    }
    if (!selected) {
      if (save.items[key(wx, wy)] || occupied(wx, wy)) {
        removeItemAt(wx, wy);
        saveNow();
        renderGrid();
      }
      return;
    }
    if (selected.indexOf('ham:') === 0) {
      var c = selected.split(':')[1];
      if (save.hamsters.length >= MAX_HAM) { App.toast('仓鼠太多啦，最多 ' + MAX_HAM + ' 只'); return; }
      if (occupied(wx, wy)) { App.toast('这里放不下仓鼠'); return; }
      save.hamsters.push({ c: c, x: wx, y: wy, st: 'walk', face: 1, until: 0 });
      saveNow();
      renderGrid();
      return;
    }
    var it = ITEM_BY_T[selected];
    if (!it) return;
    if (!canPlace(it.t, wx, wy)) { App.toast('这里放不下，换个位置试试'); return; }
    save.items[key(wx, wy)] = { t: it.t };
    saveNow();
    renderGrid();
  }

  function dropFood(x, y) {
    if (buildMode) return;
    initAudio();
    var cell = document.querySelector('.pet-cell[data-wx="' + x + '"][data-wy="' + y + '"]');
    if (!cell) return;
    var r = cell.getBoundingClientRect();
    var food = document.createElement('div');
    food.className = 'pet-falling-food';
    food.textContent = ['🥜', '🌰', '🍎'][Math.floor(Math.random() * 3)];
    food.style.left = (r.left + r.width / 2) + 'px';
    food.style.top = (r.top - 120) + 'px';
    document.body.appendChild(food);
    if (food.animate) {
      food.animate(
        [{ transform: 'translateY(0) rotate(0deg)' }, { transform: 'translateY(' + (120 + r.height / 2 - 18) + 'px) rotate(200deg)' }],
        { duration: 650, easing: 'cubic-bezier(0.5, 0, 0.8, 0.4)', fill: 'forwards' }
      );
    }
    setTimeout(function () {
      food.remove();
      var it = save.items[key(x, y)];
      if (it && (it.t === 'bowl' || it.t === 'bowl2')) {
        it.foodN = (it.foodN || 0) + 1;
        saveNow();
        renderGrid();
        App.toast('🍚 食物掉进饭碗里啦！');
        return;
      }
      var h = null;
      save.hamsters.forEach(function (hh) { if (hh.x === x && hh.y === y) h = hh; });
      if (h) {
        h.st = 'eat';
        h.until = Date.now() + 2200;
        squeak();
        saveNow();
        renderGrid();
        App.toast('🐹 仓鼠吃到食物啦！');
        return;
      }
      save.items[key(x, y)] = { t: 'food' };
      saveNow();
      renderGrid();
      App.toast('🥜 食物掉到地上啦');
    }, 700);
  }

  function enterBuild() {
    buildMode = true;
    feedMode = false;
    initAudio();
    App.el('buildBtn').classList.add('hidden');
    App.el('okBtn').classList.remove('hidden');
    App.el('petPalette').classList.remove('hidden');
    App.el('petTip').textContent = '🏗️ 选一个东西点格子放置；🗑️删除可拆掉；管道会自动连接成直管/弯管/十字路口';
    App.el('petInteract').classList.add('hidden');
    App.el('feedBtn').classList.remove('on');
    renderPalette();
    renderGrid();
  }

  function exitBuild() {
    buildMode = false;
    selected = null;
    tool = 'place';
    App.el('buildBtn').classList.remove('hidden');
    App.el('okBtn').classList.add('hidden');
    App.el('petPalette').classList.add('hidden');
    App.el('petTip').textContent = '🐹 小仓鼠开始玩耍啦！长按拖拽它 · 点一下推它 · 🍎喂食物 · 拖空白移动地图';
    App.el('petInteract').classList.remove('hidden');
    renderGrid();
  }

  /* ---------- 仓鼠交互 ---------- */
  function hamPointerDown(e, idx, el) {
    if (buildMode || feedMode) return;
    e.preventDefault();
    initAudio();
    var h = save.hamsters[idx];
    var longPress = false;
    var moved = false;
    var pressTimer = setTimeout(function () {
      longPress = true;
      dragHam = { idx: idx, gx: h.x, gy: h.y };
      el.style.visibility = 'hidden';
      var ghost = document.createElement('div');
      ghost.className = 'pet-drag-ghost';
      ghost.innerHTML = hamsterSvg(h);
      document.body.appendChild(ghost);
      dragHam.ghost = ghost;
      moveGhost(e.clientX, e.clientY);
    }, 450);

    function moveGhost(cx, cy) {
      if (!dragHam || !dragHam.ghost) return;
      dragHam.ghost.style.left = (cx - 30) + 'px';
      dragHam.ghost.style.top = (cy - 26) + 'px';
      var rect = gridEl.getBoundingClientRect();
      var gx = Math.floor((cx - rect.left) / (rect.width / VIEW_COLS));
      var gy = Math.floor((cy - rect.top) / (rect.height / VIEW_ROWS));
      dragHam.gx = view.x + gx;
      dragHam.gy = view.y + gy;
    }
    function onMove(ev) {
      if (longPress && dragHam) { moved = true; moveGhost(ev.clientX, ev.clientY); }
    }
    function onUp(ev) {
      clearTimeout(pressTimer);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (dragHam) {
        if (dragHam.ghost) dragHam.ghost.remove();
        h.x = dragHam.gx;
        h.y = dragHam.gy;
        dragHam = null;
        saveNow();
        renderGrid();
        App.toast('🐹 仓鼠搬到这里啦');
        return;
      }
      if (!moved) {
        var cell = gridEl.getBoundingClientRect();
        var cw = cell.width / VIEW_COLS, ch = cell.height / VIEW_ROWS;
        var cx = (h.x - view.x) * cw + cell.left + cw / 2;
        var cy = (h.y - view.y) * ch + cell.top + ch / 2;
        var dx = ev.clientX - cx, dy = ev.clientY - cy;
        var len = Math.hypot(dx, dy) || 1;
        var oldX = h.x, oldY = h.y;
        h.x += Math.round(dx / len * 2);
        h.y += Math.round(dy / len * 2);
        h.face = dx >= 0 ? 1 : -1;
        squeak();
        saveNow();
        renderGrid();
        var newEl = document.querySelector('.pet-cell[data-wx="' + h.x + '"][data-wy="' + h.y + '"] .pet-hamster');
        if (newEl && newEl.animate) {
          var cell2 = gridEl.getBoundingClientRect();
          var offX = (oldX - h.x) * (cell2.width / VIEW_COLS);
          var offY = (oldY - h.y) * (cell2.height / VIEW_ROWS);
          newEl.animate(
            [{ transform: 'translateX(-50%) translate(' + offX + 'px,' + offY + 'px)' }, { transform: 'translateX(-50%) translate(0,0)' }],
            { duration: 280, easing: 'ease-out' }
          );
        }
        bubbleSqueak(newEl);
      }
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function bubbleSqueak(el) {
    if (!el) return;
    var bubble = document.createElement('div');
    bubble.className = 'pet-squeak';
    bubble.textContent = '吱吱！';
    el.appendChild(bubble);
    setTimeout(function () { bubble.remove(); }, 900);
  }

  /* ---------- 视图平移（拖空白） ---------- */
  function stagePointerDown(e) {
    if (buildMode) return;
    if (e.target.closest('.pet-hamster')) return;
    var startX = e.clientX, startY = e.clientY;
    var startViewX = view.x, startViewY = view.y;
    pan = { dx: 0, dy: 0, moved: false };
    function onMove(ev) {
      if (!pan) return;
      pan.dx = ev.clientX - startX;
      pan.dy = ev.clientY - startY;
      if (Math.abs(pan.dx) + Math.abs(pan.dy) > 8) pan.moved = true;
      gridEl.style.transform = 'translate(' + pan.dx + 'px,' + pan.dy + 'px)';
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (pan && pan.moved) {
        var cell = gridEl.getBoundingClientRect();
        var shiftX = Math.round(pan.dx / (cell.width / VIEW_COLS));
        var shiftY = Math.round(pan.dy / (cell.height / VIEW_ROWS));
        view.x = startViewX - shiftX;
        view.y = startViewY - shiftY;
        renderGrid();
      }
      pan = null;
      gridEl.style.transform = '';
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  /* ---------- 仓鼠 AI ---------- */
  function hamsterTick() {
    if (buildMode) return;
    maybeBreed();
    save.hamsters.forEach(function (h) {
      if (h.st !== 'walk' && h.until > Date.now()) return;
      h.st = 'walk';
      var it = itemAt(h.x, h.y);
      if (it && it.t === 'wheel') { h.st = 'wheel'; h.until = Date.now() + 2600; return; }
      if (it && (it.t === 'bowl' || it.t === 'bowl2')) { h.st = 'eat'; h.until = Date.now() + 2000; return; }
      if (it && it.t === 'food') {
        h.st = 'eat';
        h.until = Date.now() + 2200;
        delete save.items[key(h.x, h.y)];
        return;
      }
      if (it && it.t === 'house') { h.st = 'sleep'; h.until = Date.now() + 3200; return; }
      if (it && it.t === 'ball') { h.st = 'ball'; h.until = Date.now() + 1500; return; }
      var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      var d = dirs[Math.floor(Math.random() * dirs.length)];
      var nx = h.x + d[0], ny = h.y + d[1];
      if (!occupied(nx, ny)) {
        h.x = nx;
        h.y = ny;
        h.face = d[0] !== 0 ? d[0] : h.face;
      }
    });
    // 宝宝跟随妈妈
    save.family.babies.forEach(function (b) {
      var mom = null, best = 1e9;
      save.hamsters.forEach(function (h) {
        var d = Math.abs(h.x - b.x) + Math.abs(h.y - b.y);
        if (d < best) { best = d; mom = h; }
      });
      if (mom && best > 1) {
        b.x += mom.x > b.x ? 1 : mom.x < b.x ? -1 : 0;
        b.y += mom.y > b.y ? 1 : mom.y < b.y ? -1 : 0;
      }
    });
    renderGrid();
    saveNow();
  }

  function maybeBreed() {
    if (!save.hamsters.length || save.family.babies.length) return;
    if (Date.now() - save.family.start < BREED_MS) return;
    var n = 4 + Math.floor(Math.random() * 2); // 4-5 只
    for (var i = 0; i < n; i++) {
      var mom = save.hamsters[i % save.hamsters.length];
      var b = {
        c: mom.c,
        x: mom.x + (i % 2 === 0 ? 1 : -1),
        y: mom.y + (i < 2 ? 1 : -1)
      };
      save.family.babies.push(b);
    }
    saveNow();
    renderGrid();
    App.toast('🎉 仓鼠生了 ' + n + ' 只小宝宝！');
  }

  /* ---------- 默认布置（首次进入） ---------- */
  function defaultLayout() {
    if (Object.keys(save.items).length || save.hamsters.length) return;
    save.items = {
      '0,4': { t: 'house' },
      '-2,6': { t: 'cage2' },
      '3,7': { t: 'cage1' },
      '5,7': { t: 'wheel' },
      '7,7': { t: 'bowl' },
      '9,7': { t: 'bowl2' },
      '10,7': { t: 'ball' },
      '3,4': { t: 'pipe' }, '4,4': { t: 'pipe' }, '5,4': { t: 'pipe' },
      '5,5': { t: 'pipe' }, '5,6': { t: 'pipe' }
    };
    save.hamsters = [
      { c: 'white', x: 1, y: 6, st: 'walk', face: 1, until: 0 },
      { c: 'gray', x: 4, y: 6, st: 'walk', face: -1, until: 0 },
      { c: 'cream', x: 6, y: 4, st: 'walk', face: 1, until: 0 }
    ];
    save.family = { start: Date.now(), babies: [] };
    saveNow();
  }

  /* ---------- 初始化 ---------- */
  App.el('buildBtn').addEventListener('click', enterBuild);
  App.el('okBtn').addEventListener('click', exitBuild);
  App.el('feedBtn').addEventListener('click', function () {
    if (buildMode) return;
    feedMode = !feedMode;
    App.el('feedBtn').classList.toggle('on', feedMode);
    App.el('petTip').textContent = feedMode
      ? '🍎 喂食模式：点一下想放食物的位置，食物会掉进饭碗或掉到地上！'
      : '🐹 长按拖拽仓鼠 · 点一下推它 · 🍎喂食物 · 拖空白移动地图';
  });
  App.el('petStage').addEventListener('pointerdown', stagePointerDown);

  defaultLayout();
  renderGrid();
  renderPalette();
  tickTimer = setInterval(hamsterTick, 750);

  /* 调试接口 */
  window.__pet = {
    state: function () {
      return {
        build: buildMode,
        feed: feedMode,
        items: save.items,
        hamsters: save.hamsters.map(function (h) { return { c: h.c, x: h.x, y: h.y, st: h.st }; }),
        babies: save.family.babies.map(function (b) { return { c: b.c, x: b.x, y: b.y }; }),
        view: { x: view.x, y: view.y }
      };
    },
    enterBuild: enterBuild,
    exitBuild: exitBuild,
    place: function (t, x, y) {
      var it = ITEM_BY_T[t];
      if (it && canPlace(t, x, y)) { save.items[key(x, y)] = { t: t }; saveNow(); renderGrid(); return true; }
      return false;
    },
    remove: function (x, y) {
      if (save.items[key(x, y)] || occupied(x, y)) { removeItemAt(x, y); saveNow(); renderGrid(); return true; }
      return false;
    },
    addHamster: function (c, x, y) {
      if (save.hamsters.length >= MAX_HAM) return false;
      save.hamsters.push({ c: c, x: x, y: y, st: 'walk', face: 1, until: 0 });
      saveNow(); renderGrid(); return true;
    },
    panView: function (dx, dy) { view.x += dx; view.y += dy; renderGrid(); },
    breedNow: function () {
      save.family.start = Date.now() - BREED_MS - 1000;
      maybeBreed();
    },
    tick: hamsterTick
  };
})();
