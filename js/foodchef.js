/* i同步学 · 美食大厨
   顾客最多点 3 样；盘装/杯装餐具匹配；做好后端给客人，没点会提示；
   每样食材可升级 3 次（4 级），等级越高分越高；每位客人耐心 2 分钟；
   汤包店 → 牛排店 → 汉堡店，店越高级基础分越高，各 15 关解锁下一家。 */
(function () {
  'use strict';

  var CHEF_SAVE = 'xx3_chef_v1';
  var UNLOCK_AT = 15;      // 过 15 关解锁下一家店
  var PATIENCE_MS = 120000; // 每位客人最多等 2 分钟
  var TRAY_MAX = 4;        // 出餐台最多 4 个位置（盘子/杯子）
  var MAX_LV = 4;          // 每样食材升级 3 次 = 4 级
  var MAX_STORE_LV = 4;    // 厨房可升级 3 次
  var UP_COSTS = [0, 1000, 2500, 5000]; // 升到 Lv2/3/4 的费用

  var STORES = [
    {
      id: 'tangbao', name: '汤包店', emoji: '🥟', base: 10, costK: 0.5,
      color: '#FFB300', bg: 'linear-gradient(135deg,#FFE0A3,#FFB84D)',
      items: [
        { emoji: '🥟', name: '汤包', t: 2000, cup: false },
        { emoji: '🥛', name: '豆浆', t: 2000, cup: true },
        { emoji: '🥖', name: '油条', t: 2000, cup: false },
        { emoji: '🥚', name: '卤蛋', t: 2000, cup: false },
        { emoji: '🥣', name: '粥', t: 2000, cup: true }
      ]
    },
    {
      id: 'niupai', name: '牛排店', emoji: '🥩', base: 20, costK: 1,
      color: '#E8556D', bg: 'linear-gradient(135deg,#FFC7CE,#F08A5D)',
      items: [
        { emoji: '🥩', name: '牛排', t: 2000, cup: false },
        { emoji: '🍊', name: '橙汁', t: 2000, cup: true },
        { emoji: '🍶', name: '牛排酱', t: 2000, cup: true },
        { emoji: '🍦', name: '冰淇淋', t: 1000, cup: true }
      ]
    },
    {
      id: 'hanbao', name: '汉堡店', emoji: '🍔', base: 30, costK: 2,
      color: '#3D7BFD', bg: 'linear-gradient(135deg,#BFD8FF,#6AA7FF)',
      items: [
        { emoji: '🍔', name: '汉堡', t: 2000, cup: false },
        { emoji: '🥤', name: '可乐', t: 2000, cup: true },
        { emoji: '🍟', name: '薯条', t: 2000, cup: false },
        { emoji: '🍗', name: '炸鸡块', t: 2000, cup: false },
        { emoji: '🍦', name: '冰淇淋', t: 1000, cup: true }
      ]
    }
  ];

  /* 顾客形象：不同发型/肤色/上衣的卡通人 */
  var CUSTOMERS = [
    { name: '乐乐', skin: '#FFE0BD', hair: '#4A3728', shirt: '#FF8A5C', style: 'short' },
    { name: '朵朵', skin: '#FFE8CC', hair: '#8B5A2B', shirt: '#7FB5FF', style: 'bun' },
    { name: '小虎', skin: '#F2C99B', hair: '#2F2F3A', shirt: '#55C98F', style: 'short' },
    { name: '糖糖', skin: '#FFE8D6', hair: '#C98B3D', shirt: '#F58FB0', style: 'pony' },
    { name: '大厨爷爷', skin: '#EED5B0', hair: '#B7B7C4', shirt: '#9B6BF5', style: 'cap' },
    { name: '豆豆', skin: '#FFDFB8', hair: '#5A4632', shirt: '#FFD166', style: 'curly' }
  ];

  var save = {
    progress: { tangbao: 0, niupai: 0, hanbao: 0 },
    stars: {}, awarded: {},
    points: { tangbao: 0, niupai: 0, hanbao: 0 },
    foodLv: {}
  };
  try {
    var raw = JSON.parse(localStorage.getItem(CHEF_SAVE) || '{}');
    for (var k in save) if (raw[k] !== undefined) save[k] = raw[k];
    if (!save.progress) save.progress = { tangbao: 0, niupai: 0, hanbao: 0 };
    if (!save.points) save.points = { tangbao: 0, niupai: 0, hanbao: 0 };
    if (!save.foodLv) save.foodLv = {};
    STORES.forEach(function (s) {
      if (save.progress[s.id] === undefined) save.progress[s.id] = 0;
      if (save.points[s.id] === undefined) save.points[s.id] = 0;
    });
  } catch (e) { /* ignore */ }

  function saveNow() {
    try { localStorage.setItem(CHEF_SAVE, JSON.stringify(save)); } catch (e) { /* ignore */ }
  }

  function storeById(id) {
    for (var i = 0; i < STORES.length; i++) if (STORES[i].id === id) return STORES[i];
    return STORES[0];
  }

  function unlocked(id) {
    if (id === 'tangbao') return true;
    var idx = -1;
    for (var i = 0; i < STORES.length; i++) if (STORES[i].id === id) idx = i;
    if (idx <= 0) return false;
    var prev = STORES[idx - 1].id;
    return Math.max(save.progress[prev] || 0, servedOf(prev)) >= UNLOCK_AT;
  }

  function servedOf(id) {
    try {
      var key = id === 'tangbao' ? 'xx3_tangbao_v1' : id === 'niupai' ? 'xx3_niupai_v1' : 'xx3_hanbao_v1';
      var raw = JSON.parse(localStorage.getItem(key) || '{}');
      return raw.totalServed || 0;
    } catch (e) { return 0; }
  }

  function scoreOf(id) {
    try {
      var key = id === 'tangbao' ? 'xx3_tangbao_v1' : id === 'niupai' ? 'xx3_niupai_v1' : 'xx3_hanbao_v1';
      var raw = JSON.parse(localStorage.getItem(key) || '{}');
      return raw.score || 0;
    } catch (e) { return 0; }
  }

  function cookSaveOf(id) {
    var key = id === 'tangbao' ? 'xx3_tangbao_v1' : id === 'niupai' ? 'xx3_niupai_v1' : 'xx3_hanbao_v1';
    try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) { return {}; }
  }

  function writeCookSave(id, obj) {
    var key = id === 'tangbao' ? 'xx3_tangbao_v1' : id === 'niupai' ? 'xx3_niupai_v1' : 'xx3_hanbao_v1';
    try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) { /* ignore */ }
  }

  function cookBase(id) {
    return id === 'tangbao' ? 500 : id === 'niupai' ? 600 : 700;
  }

  function foodLevel(storeId, itemName) {
    var lv = save.foodLv[storeId + ':' + itemName] || 1;
    return Math.max(1, Math.min(MAX_LV, lv));
  }

  function itemScore(store, item) {
    var lv = foodLevel(store.id, item.name);
    return Math.round(store.base * (1 + (lv - 1) * 0.5));
  }

  function upgradeCost(store, fromLv) {
    var steps = [50, 150, 400];
    return Math.round(store.costK * steps[fromLv - 1]);
  }

  function hairSvg(c) {
    var hair = c.hair;
    if (c.style === 'cap') {
      return '' +
        '<path d="M58 32 Q58 14 75 14 Q92 14 92 32 L92 38 L58 38 Z" fill="#ffffff" stroke="#E0D8CF" stroke-width="3"/>' +
        '<rect x="52" y="32" width="46" height="11" rx="5.5" fill="#ffffff" stroke="#E0D8CF" stroke-width="3"/>';
    }
    var base =
      '<path d="M47 54 Q47 22 75 22 Q103 22 103 54 L103 46 Q103 30 75 30 Q47 30 47 46 Z" fill="' + hair + '"/>';
    if (c.style === 'bun') return base + '<circle cx="75" cy="15" r="13" fill="' + hair + '"/>';
    if (c.style === 'pony') {
      return base + '<path d="M103 34 Q124 40 122 66 Q121 82 111 92" fill="none" stroke="' + hair + '" stroke-width="13" stroke-linecap="round"/>';
    }
    if (c.style === 'curly') {
      return base +
        '<circle cx="58" cy="24" r="9" fill="' + hair + '"/>' +
        '<circle cx="75" cy="18" r="10" fill="' + hair + '"/>' +
        '<circle cx="92" cy="24" r="9" fill="' + hair + '"/>';
    }
    return base;
  }

  function makeCustomerSvg(c, size) {
    var s = size || 150;
    var h = Math.round(s * 180 / 150);
    return '' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 180" width="' + s + '" height="' + h + '" aria-label="' + c.name + '">' +
      '<rect x="35" y="100" width="80" height="76" rx="20" fill="' + c.shirt + '"/>' +
      '<path d="M52 110 L75 96 L98 110 L98 170 L52 170 Z" fill="#ffffff" opacity="0.92"/>' +
      '<path d="M52 110 L75 96 L98 110" fill="none" stroke="' + c.shirt + '" stroke-width="4"/>' +
      '<path d="M42 114 Q16 130 28 152" fill="none" stroke="' + c.shirt + '" stroke-width="14" stroke-linecap="round"/>' +
      '<path d="M108 114 Q134 130 122 152" fill="none" stroke="' + c.shirt + '" stroke-width="14" stroke-linecap="round"/>' +
      '<circle cx="28" cy="154" r="8.5" fill="' + c.skin + '"/>' +
      '<circle cx="122" cy="154" r="8.5" fill="' + c.skin + '"/>' +
      '<ellipse cx="75" cy="56" rx="28" ry="30" fill="' + c.skin + '"/>' +
      '<circle cx="46" cy="60" r="6" fill="' + c.skin + '"/>' +
      '<circle cx="104" cy="60" r="6" fill="' + c.skin + '"/>' +
      hairSvg(c) +
      '<path d="M58 46 Q64 41 70 46" fill="none" stroke="#6B4A2B" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M80 46 Q86 41 92 46" fill="none" stroke="#6B4A2B" stroke-width="2.6" stroke-linecap="round"/>' +
      '<circle cx="64" cy="55" r="3.4" fill="#3A3A4A"/>' +
      '<circle cx="86" cy="55" r="3.4" fill="#3A3A4A"/>' +
      '<ellipse cx="52" cy="67" rx="6" ry="4" fill="#FF9D9D" opacity="0.75"/>' +
      '<ellipse cx="98" cy="67" rx="6" ry="4" fill="#FF9D9D" opacity="0.75"/>' +
      '<path d="M66 69 Q75 78 84 69" fill="none" stroke="#A04A3A" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M75 97 L67 107 L75 102 L83 107 Z" fill="#E8556D"/>' +
      '</svg>';
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------- 商店选择 ---------- */
  function renderStores() {
    var list = App.el('storeList');
    list.innerHTML = '';
    STORES.forEach(function (s) {
      var ok = unlocked(s.id);
      var done = save.progress[s.id] || 0;
      var served = servedOf(s.id);
      var shown = Math.max(done, served);
      var pts = scoreOf(s.id);
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'chef-store' + (ok ? '' : ' locked');
      card.style.background = ok ? s.bg : 'linear-gradient(135deg,#E8E8EF,#D5D5DE)';
      card.innerHTML =
        '<div class="chef-store-top">' +
          '<span class="chef-store-emoji">' + (ok ? s.emoji : '🔒') + '</span>' +
          '<span class="chef-store-name">' + s.name + '</span>' +
          (ok
            ? '<span class="chef-store-progress">' + shown + ' / ' + UNLOCK_AT + ' 位</span>'
            : '<span class="chef-store-lock">未解锁</span>') +
        '</div>' +
        '<div class="chef-store-items">' + s.items.map(function (it) { return it.emoji; }).join(' ') + '</div>' +
        (ok
          ? '<div class="chef-store-desc">' + (shown >= UNLOCK_AT ? '已解锁下一家！已招待 ' + shown + ' 位客人' : '再招待 ' + (UNLOCK_AT - shown) + ' 位客人解锁下一家') + ' · 每单 ' + cookBase(s.id) + ' 分起</div>'
          : '<div class="chef-store-desc">招待上一家 15 位客人后解锁</div>');
      if (ok) card.addEventListener('click', function () { openStoreHome(s.id); });
      list.appendChild(card);
    });
  }

  function nextStore(id) {
    for (var i = 0; i < STORES.length - 1; i++) if (STORES[i].id === id) return STORES[i + 1];
    return null;
  }

  /* ---------- 店主页 ---------- */
  function openStoreHome(id) {
    var store = storeById(id);
    App.el('storePanel').classList.add('hidden');
    App.el('gamePanel').classList.add('hidden');
    App.el('resultPanel').classList.add('hidden');
    App.el('unlockPanel').classList.add('hidden');
    App.el('storeHome').classList.remove('hidden');
    App.el('storeTitle').textContent = store.emoji + ' ' + store.name;
    renderStoreHome(store);
  }

  function renderStoreHome(store) {
    App.el('storePts').textContent = '💰 ' + scoreOf(store.id).toLocaleString() + ' 分';
    var done = save.progress[store.id] || 0;
    var served = servedOf(store.id);
    var lv = Math.max(1, Math.min(MAX_STORE_LV, cookSaveOf(store.id).storeLv || 1));
    App.el('storeProgress').textContent = '已招待 ' + Math.max(done, served) + ' 位客人 · 厨房 Lv.' + lv + ' · 每单 ' + (cookBase(store.id) + (lv - 1) * 50) + ' 分起 · 每天最多 10 位客人';
    App.el('upgradePanel').classList.add('hidden');
  }

  /* ---------- 升级厨房（店铺升级，每级每单 +50 分） ---------- */
  function renderUpgrade(store) {
    var s = cookSaveOf(store.id);
    var lv = Math.max(1, Math.min(MAX_STORE_LV, s.storeLv || 1));
    var pts = s.score || 0;
    App.el('upgradeDesc').textContent = '店铺 Lv.' + lv + ' / Lv.' + MAX_STORE_LV + ' · 当前每单 ' + (cookBase(store.id) + (lv - 1) * 50) + ' 分，升一级每单 +50 分（连击同步 +100）';
    var list = App.el('upgradeList');
    list.innerHTML = '';
    if (lv >= MAX_STORE_LV) {
      list.innerHTML =
        '<div class="chef-upgrade-row"><span class="chef-upgrade-item">🌟 厨房已满级</span>' +
        '<span class="chef-upgrade-score">每单 ' + (cookBase(store.id) + (MAX_STORE_LV - 1) * 50) + ' 分</span></div>';
      return;
    }
    var cost = UP_COSTS[lv];
    var row = document.createElement('div');
    row.className = 'chef-upgrade-row';
    row.innerHTML =
      '<span class="chef-upgrade-item">🏪 升级到 Lv.' + (lv + 1) + '</span>' +
      '<span class="chef-upgrade-score">每单 ' + (cookBase(store.id) + lv * 50) + ' 分 · 需 ' + cost + ' 分</span>';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-gold chef-upgrade-btn';
    btn.textContent = pts >= cost ? '升级' : '积分不够';
    btn.disabled = pts < cost;
    btn.addEventListener('click', function () {
      var s2 = cookSaveOf(store.id);
      if ((s2.score || 0) < cost) { App.toast('积分不够，多招待几位客人吧'); return; }
      s2.score -= cost;
      s2.storeLv = Math.min(MAX_STORE_LV, (s2.storeLv || 1) + 1);
      writeCookSave(store.id, s2);
      renderUpgrade(store);
      renderStoreHome(store);
      App.toast('厨房升级到 Lv.' + s2.storeLv + '，每单多赚 50 分！');
    });
    row.appendChild(btn);
    list.appendChild(row);
  }

  /* ---------- 对局 ---------- */
  var game = null;
  var timer = null;

  function startStore(id) {
    var store = storeById(id);
    var level = Math.min(100, (save.progress[id] || 0) + 1);
    var customers = Math.min(5, 2 + Math.floor((level - 1) / 8));
    game = {
      store: store,
      level: level,
      customers: customers,
      idx: 0,
      order: [],
      tray: [],
      score: 0,
      mistakes: 0,
      timeouts: 0,
      lives: 3,
      patienceEnd: 0,
      done: false
    };
    App.el('storeHome').classList.add('hidden');
    App.el('resultPanel').classList.add('hidden');
    App.el('unlockPanel').classList.add('hidden');
    App.el('gamePanel').classList.remove('hidden');
    App.el('lvLabel').textContent = store.name + ' · 第 ' + level + ' 关（' + customers + ' 位客人）';
    App.el('scoreLabel').textContent = '0 分';
    renderLives();
    renderItemBtns();
    nextCustomer();
  }

  function nextCustomer() {
    if (game.done) return;
    if (game.idx >= game.customers) { finishLevel(true); return; }
    game.idx++;
    // 每位客人最多点 3 样
    var n = 1 + Math.floor(Math.random() * 3);
    game.order = shuffle(game.store.items).slice(0, n);
    var customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
    game.customer = customer;
    App.el('customerFace').innerHTML = makeCustomerSvg(customer);
    App.el('customerName').textContent = customer.name;
    renderOrder();
    startPatience();
    App.el('chefFeedback').textContent = '客人来了，快看看他想吃什么！';
  }

  function renderOrder() {
    var box = App.el('orderList');
    box.innerHTML = '';
    game.order.forEach(function (it, i) {
      var li = document.createElement('div');
      li.className = 'chef-order-line';
      li.dataset.name = it.name;
      li.innerHTML =
        '<span class="chef-order-emoji">' + it.emoji + '</span>' +
        '<span class="chef-order-name">' + it.name + '</span>' +
        (it.cup ? '<span class="chef-cup-tag">🥤 杯装</span>' : '<span class="chef-dish-tag">🍽️ 盘装</span>') +
        '<span class="chef-order-check">·</span>';
      box.appendChild(li);
    });
  }

  function markOrderDone(name) {
    var lines = App.el('orderList').querySelectorAll('.chef-order-line');
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].dataset.name === name) {
        lines[i].classList.add('done');
        lines[i].querySelector('.chef-order-check').textContent = '✓';
        break;
      }
    }
  }

  function startPatience() {
    clearInterval(timer);
    game.patienceEnd = Date.now() + PATIENCE_MS;
    var fill = App.el('timerFill');
    fill.style.transition = 'none';
    fill.style.width = '100%';
    requestAnimationFrame(function () {
      fill.style.transition = 'width ' + PATIENCE_MS + 'ms linear';
      fill.style.width = '0%';
    });
    timer = setInterval(function () {
      if (game.done) return;
      if (Date.now() >= game.patienceEnd) {
        clearInterval(timer);
        timeoutCustomer();
      }
    }, 250);
  }

  function timeoutCustomer() {
    game.timeouts++;
    game.lives--;
    renderLives();
    App.el('chefFeedback').textContent = '⏰ 客人等不及走了…';
    game.order = [];
    App.el('orderList').innerHTML = '';
    clearTray();
    if (game.lives <= 0) { finishLevel(false); return; }
    setTimeout(nextCustomer, 800);
  }

  function renderLives() {
    var box = App.el('livesBox');
    box.textContent = '';
    for (var i = 0; i < 3; i++) {
      var s = document.createElement('span');
      s.textContent = i < game.lives ? '❤️' : '🖤';
      box.appendChild(s);
    }
  }

  /* ---------- 出餐台 ---------- */
  function renderTray() {
    var box = App.el('tray');
    box.innerHTML = '';
    if (!game.tray.length) {
      box.innerHTML = '<div class="chef-tray-empty">出餐台空空的，先去做点吃的吧</div>';
      return;
    }
    game.tray.forEach(function (slot) {
      var cell = document.createElement('div');
      cell.className = 'chef-tray-cell ' + (slot.item.cup ? 'cup' : 'dish');
      cell.innerHTML =
        '<button type="button" class="chef-tray-discard" data-name="' + slot.item.name + '">✕</button>' +
        '<span class="chef-tray-emoji">' + slot.item.emoji + '</span>' +
        '<span class="chef-tray-name">' + slot.item.name + '</span>' +
        '<span class="chef-tray-type">' + (slot.item.cup ? '🥤 杯装' : '🍽️ 盘装') + '</span>';
      cell.addEventListener('click', function () { giveFood(slot); });
      box.appendChild(cell);
    });
  }

  function clearTray() {
    game.tray = [];
    renderTray();
  }

  function addToTray(item) {
    if (game.done || !game.order.length) return;
    if (game.tray.length >= TRAY_MAX) {
      App.toast('出餐台满了，先端给客人或点 ✕ 丢掉');
      return;
    }
    game.tray.push({ item: item });
    renderTray();
  }

  function giveFood(slot) {
    if (game.done) return;
    var idx = -1;
    for (var i = 0; i < game.order.length; i++) {
      if (game.order[i].name === slot.item.name) { idx = i; break; }
    }
    if (idx < 0) {
      game.mistakes++;
      App.el('chefFeedback').textContent = '✗ 客人不想要「' + slot.item.name + '」，点 ✕ 收回来吧';
      return;
    }
    var pts = itemScore(game.store, slot.item);
    game.score += pts;
    game.order.splice(idx, 1);
    game.tray.splice(game.tray.indexOf(slot), 1);
    App.el('scoreLabel').textContent = game.score + ' 分';
    renderTray();
    markOrderDone(slot.item.name);
    App.el('chefFeedback').textContent = '✓ 客人吃到 ' + slot.item.name + ' 啦，+ ' + pts + ' 分！';
    if (!game.order.length) {
      clearInterval(timer);
      App.el('chefFeedback').textContent = '🎉 ' + game.customer.name + ' 满意地走了！';
      setTimeout(nextCustomer, 900);
    }
  }

  /* ---------- 制作 ---------- */
  function pickItem(btn, it) {
    if (game.done || !game.order.length) return;
    if (btn.classList.contains('making') || btn.classList.contains('done')) return;
    if (game.tray.length >= TRAY_MAX) {
      App.toast('出餐台满了，先端给客人或点 ✕ 丢掉');
      return;
    }
    btn.classList.add('making');
    var nameEl = btn.querySelector('.chef-item-name');
    nameEl.textContent = it.cup ? '正在装杯…' : '正在做…';
    var t0 = Date.now();
    var ms = it.t;
    var iv = setInterval(function () {
      if (Date.now() - t0 >= ms) {
        clearInterval(iv);
        btn.classList.remove('making');
        btn.classList.add('done');
        nameEl.textContent = '✓ ' + it.name;
        setTimeout(function () {
          btn.classList.remove('done');
          nameEl.textContent = it.name;
        }, 900);
        addToTray(it);
        App.el('chefFeedback').textContent = it.name + ' 做好啦，端给客人吧！';
      }
    }, 100);
  }

  function renderItemBtns() {
    var box = App.el('itemBtns');
    box.innerHTML = '';
    game.store.items.forEach(function (it) {
      var lv = foodLevel(game.store.id, it.name);
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chef-item';
      b.innerHTML =
        '<span class="chef-item-emoji">' + it.emoji + '</span>' +
        '<span class="chef-item-name">' + it.name + '</span>' +
        '<span class="chef-item-meta">' + (it.cup ? '🥤杯' : '🍽️盘') + ' · Lv.' + lv + ' · ' + itemScore(game.store, it) + '分</span>';
      b.addEventListener('click', function () { pickItem(b, it); });
      box.appendChild(b);
    });
  }

  /* ---------- 过关结算 ---------- */
  function finishLevel(win) {
    if (game.done) return;
    game.done = true;
    clearInterval(timer);
    App.el('gamePanel').classList.add('hidden');
    App.el('resultPanel').classList.remove('hidden');
    var id = game.store.id;
    if (win) {
      var stars = game.mistakes + game.timeouts === 0 ? 3 : game.mistakes + game.timeouts <= 1 ? 2 : 1;
      var emoji = stars === 3 ? '🌟' : stars === 2 ? '🎉' : '👍';
      App.el('chefResultEmoji').textContent = emoji;
      App.el('chefResultTitle').textContent = '第 ' + game.level + ' 关过关！';
      save.points[id] = (save.points[id] || 0) + game.score;
      App.el('chefResultLine').textContent = '本关得分 ' + game.score + ' · 厨房积分 +' + game.score + ' · ' + stars + ' ⭐';
      var isNew = (save.progress[id] || 0) < game.level;
      if (isNew) {
        save.progress[id] = game.level;
        var key = id + ':' + game.level;
        if (!save.awarded) save.awarded = {};
        if (!save.awarded[key]) {
          save.awarded[key] = true;
          var data = App.store.load();
          App.addStars(data, 'chef', stars);
          App.addTask(data);
          App.logActivity(data, '美食大厨 ' + game.store.name + ' 第' + game.level + '关');
          App.setStarsUI();
        }
      }
      saveNow();
      App.el('chefRetryBtn').textContent = '↻ 再玩第 ' + game.level + ' 关';
      App.el('chefNextBtn').style.display = '';
      var nxt = nextStore(id);
      if (nxt && save.progress[id] >= UNLOCK_AT && unlocked(nxt.id)) {
        App.el('chefNextBtn').style.display = 'none';
        App.el('chefResultLine').textContent += ' · 🔓 解锁了 ' + nxt.name + '！';
        setTimeout(function () { showUnlock(nxt); }, 1200);
      }
    } else {
      App.el('chefResultEmoji').textContent = '💪';
      App.el('chefResultTitle').textContent = '差一点点';
      App.el('chefResultLine').textContent = '客人都走光啦，休息一下再试第 ' + game.level + ' 关！';
      App.el('chefRetryBtn').textContent = '↻ 再试一次';
      App.el('chefNextBtn').style.display = 'none';
    }
    App.el('chefStarPill').textContent = '⭐ ' + (App.store.load().balance || 0);
  }

  function showUnlock(store) {
    App.el('resultPanel').classList.add('hidden');
    App.el('unlockPanel').classList.remove('hidden');
    App.el('unlockEmoji').textContent = store.emoji;
    App.el('unlockTitle').textContent = '🔓 解锁 ' + store.name + '！';
    App.el('unlockLine').textContent = '你通过了 ' + UNLOCK_AT + ' 关，新店开张啦！新店每道菜分更高，去看看吧～';
    App.el('unlockGoBtn').dataset.go = store.id;
  }

  /* ---------- 事件 ---------- */
  App.el('startCookBtn').addEventListener('click', function () {
    var id = App.el('storeTitle').textContent.split(' ')[1] || 'tangbao';
    for (var i = 0; i < STORES.length; i++) if (STORES[i].name === id) { id = STORES[i].id; break; }
    // 三家店统一使用做菜玩法（揉面/煎牛排/做汉堡）
    var page = id === 'niupai' ? 'niupai.html' : id === 'hanbao' ? 'hanbao.html' : 'tangbao.html';
    location.href = page;
  });

  App.el('upgradeBtn').addEventListener('click', function () {
    var panel = App.el('upgradePanel');
    var id = App.el('storeTitle').textContent.split(' ')[1] || 'tangbao';
    for (var j = 0; j < STORES.length; j++) if (STORES[j].name === id) { id = STORES[j].id; break; }
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) renderUpgrade(storeById(id));
  });
  App.el('tray').addEventListener('click', function (e) {
    var del = e.target.closest('.chef-tray-discard');
    if (del) {
      var name = del.getAttribute('data-name');
      for (var i = 0; i < game.tray.length; i++) {
        if (game.tray[i].item.name === name) {
          game.tray.splice(i, 1);
          break;
        }
      }
      renderTray();
      App.el('chefFeedback').textContent = '把 ' + name + ' 收起来了';
      e.stopPropagation();
      return;
    }
  });
  App.el('chefRetryBtn').addEventListener('click', function () { startStore(game.store.id); });
  App.el('chefNextBtn').addEventListener('click', function () { startStore(game.store.id); });
  App.el('chefBackBtn').addEventListener('click', function () {
    App.el('resultPanel').classList.add('hidden');
    App.el('gamePanel').classList.add('hidden');
    App.el('unlockPanel').classList.add('hidden');
    App.el('storeHome').classList.add('hidden');
    App.el('storePanel').classList.remove('hidden');
    renderStores();
  });
  App.el('unlockGoBtn').addEventListener('click', function () {
    var id = App.el('unlockGoBtn').dataset.go;
    App.el('unlockPanel').classList.add('hidden');
    renderStores();
    openStoreHome(id);
  });
  App.el('unlockStayBtn').addEventListener('click', function () {
    App.el('unlockPanel').classList.add('hidden');
    App.el('storeHome').classList.remove('hidden');
    App.el('storePanel').classList.add('hidden');
    renderStores();
  });

  App.el('chefStarPill').textContent = '⭐ ' + (App.store.load().balance || 0);
  renderStores();

  /* ---------- 调试/自动化验证接口 ---------- */
  window.__chef = {
    unlockAt: UNLOCK_AT,
    stores: STORES.map(function (s) { return s.id; }),
    state: function () {
      return {
        progress: save.progress,
        unlocked: STORES.map(function (s) { return unlocked(s.id); }),
        points: save.points,
        game: game ? {
          store: game.store.id,
          level: game.level,
          customers: game.customers,
          idx: game.idx,
          order: game.order.map(function (it) { return it.name; }),
          tray: game.tray.map(function (t) { return t.item.name; }),
          score: game.score,
          lives: game.lives,
          done: game.done
        } : null
      };
    },
    setProgress: function (id, n) { save.progress[id] = n; saveNow(); renderStores(); return save.progress[id]; },
    setPoints: function (id, n) { save.points[id] = n; saveNow(); renderStores(); return save.points[id]; },
    foodLv: function (storeId, itemName) { return foodLevel(storeId, itemName); },
    setFoodLv: function (storeId, itemName, lv) {
      save.foodLv[storeId + ':' + itemName] = Math.max(1, Math.min(MAX_LV, lv));
      saveNow();
      return save.foodLv[storeId + ':' + itemName];
    },
    upgradeCost: function (storeId, itemName) {
      var store = storeById(storeId);
      return upgradeCost(store, foodLevel(storeId, itemName));
    },
    openStoreHome: openStoreHome,
    startStore: startStore,
    pick: function (name) {
      var btns = document.querySelectorAll('.chef-item');
      for (var i = 0; i < btns.length; i++) {
        if (btns[i].querySelector('.chef-item-name').textContent === name) { btns[i].click(); return true; }
      }
      return false;
    },
    give: function (name) {
      var cells = document.querySelectorAll('.chef-tray-cell');
      for (var i = 0; i < cells.length; i++) {
        if (cells[i].querySelector('.chef-tray-name').textContent === name) { cells[i].click(); return true; }
      }
      return false;
    },
    orderNames: function () {
      return game ? game.order.map(function (it) { return it.name; }) : [];
    },
    trayNames: function () {
      return game ? game.tray.map(function (t) { return t.item.name; }) : [];
    },
    finishOrder: function () {
      // 测试辅助：直接跳过当前顾客等待，加速过关
      if (game && game.order.length) {
        game.order.forEach(function (it) {
          if (!App.el('orderList').querySelector('.chef-order-line.done')) { }
        });
      }
    }
  };
})();
