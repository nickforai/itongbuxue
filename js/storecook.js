/* i同步学 · 美食店做菜引擎（汤包店 / 牛排店 / 汉堡店）
   循环：接单 -> 第1步(点5次) -> 第2步 -> 第3步 -> 烹饪冒气 -> 叮 -> 端给客人 -> +分
   每日限招待 10 位客人，满员打烊；连击第 4 单起 +100 加成；
   客人等太久冒 ZZZ 不会离开；积分解锁金色皮肤与招牌升级 */
(function () {
  'use strict';

  var STORE = document.body.getAttribute('data-store') || 'tangbao';

  var CONFIGS = {
    tangbao: {
      id: 'tangbao', name: '汤包店', saveKey: 'xx3_tangbao_v1',
      mode: 'craft',
      sign: '🥟 小汤包', kingSign: '👑 超级汤包王',
      base: 500, comboBonus: 600, skinAt: 5000, titleAt: 10000,
      skinName: '猪猪包', workClass: 'dough', cookClass: 'steamer',
      serveEmoji: '🥟', skinEmoji: '🐷',
      steps: [
        { btn: '🖐️', btnName: '揉面', hint: '快揉面！点 5 次把面团揉圆', onceHint: '面团揉圆啦，点「加肉馅」包起来！', doneBadge: '✅ 面团揉圆' },
        { btn: '🥩', btnName: '加肉馅', hint: '包子包好啦，点「上蒸笼」开始蒸！', onceHint: '✅ 肉馅包好啦', doneBadge: '✅ 肉馅包好' },
        { btn: '🔥', btnName: '上蒸笼', hint: '蒸笼冒白气啦，等「叮」一声就好了…' }
      ],
      cookHint: '💨 蒸笼冒白气啦，等「叮」一声就好了…',
      serveHint: '叮！包子熟啦，点包子端给客人！'
    },
    niupai: {
      id: 'niupai', name: '牛排店', saveKey: 'xx3_niupai_v1',
      mode: 'craft',
      sign: '🥩 小牛排', kingSign: '👑 超级牛排王',
      base: 600, comboBonus: 700, skinAt: 5000, titleAt: 10000,
      skinName: '黄金牛排', workClass: 'steak', cookClass: 'skillet',
      serveEmoji: '🥩', skinEmoji: '🥩',
      steps: [
        { btn: '🍳', btnName: '煎牛排', hint: '牛排下锅啦！点 5 次翻面煎熟', onceHint: '牛排煎好啦，点「加酱汁」！', doneBadge: '✅ 牛排煎熟' },
        { btn: '🫗', btnName: '加酱汁', hint: '酱汁淋好啦，点「装盘」！', onceHint: '✅ 酱汁淋好', doneBadge: '✅ 酱汁淋好' },
        { btn: '🍽️', btnName: '装盘', hint: '滋滋作响…等「叮」一声就好了！' }
      ],
      cookHint: '♨️ 煎锅冒热气啦，等「叮」一声就好了…',
      serveHint: '叮！牛排煎好啦，点牛排端给客人！'
    },
    hanbao: {
      id: 'hanbao', name: '汉堡店', saveKey: 'xx3_hanbao_v1',
      mode: 'order',
      sign: '🍔 小汉堡', kingSign: '👑 超级汉堡王',
      base: 700, comboBonus: 800, skinAt: 5000, titleAt: 10000,
      skinName: '双层巨无霸', workClass: 'patty', cookClass: 'grill',
      serveEmoji: '🍔', skinEmoji: '🍔',
      items: [
        { emoji: '🍔', name: '汉堡', t: 2000, cup: false },
        { emoji: '🍟', name: '薯条', t: 2000, cup: false },
        { emoji: '🍗', name: '炸鸡', t: 2000, cup: false },
        { emoji: '🥤', name: '可乐', t: 2000, cup: true },
        { emoji: '🍊', name: '橙汁', t: 2000, cup: true },
        { emoji: '🍦', name: '冰淇淋', t: 1000, cup: true }
      ],
      steps: [
        { btn: '🫓', btnName: '压肉饼', hint: '肉饼上烤架啦！点 5 次把它压圆', onceHint: '肉饼压好啦，点「加配菜」！', doneBadge: '✅ 肉饼压圆' },
        { btn: '🥬', btnName: '加配菜', hint: '配菜铺好啦，点「盖面包」！', onceHint: '✅ 配菜铺好', doneBadge: '✅ 配菜铺好' },
        { btn: '🍔', btnName: '盖面包', hint: '汉堡合体…等「叮」一声就好了！' }
      ],
      cookHint: '💨 烤架冒热气啦，等「叮」一声就好了…',
      serveHint: '叮！汉堡做好啦，点汉堡端给客人！'
    }
  };

  var cfg = CONFIGS[STORE] || CONFIGS.tangbao;
  var save = { score: 0, totalServed: 0, daily: {}, storeLv: 1 };
  try {
    var raw = JSON.parse(localStorage.getItem(cfg.saveKey) || '{}');
    if (typeof raw.score === 'number') save.score = raw.score;
    if (typeof raw.totalServed === 'number') save.totalServed = raw.totalServed;
    if (raw.daily && typeof raw.daily === 'object') save.daily = raw.daily;
    if (typeof raw.storeLv === 'number') save.storeLv = raw.storeLv;
  } catch (e) { /* ignore */ }

  function todayStr() {
    var d = new Date();
    var p = function (n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function servedToday() { return save.daily[todayStr()] || 0; }
  function saveNow() {
    try { localStorage.setItem(cfg.saveKey, JSON.stringify(save)); } catch (e) { /* ignore */ }
  }

  var DAILY_LIMIT = 10;
  var MAX_STORE_LV = 4;   // 店铺可升级 3 次
  var UPGRADE_COSTS = [0, 1000, 2500, 5000]; // 升到 Lv2/Lv3/Lv4 的费用
  var STEP = { TAP: 'tap', ONCE1: 'once1', ONCE2: 'once2', COOK: 'cook', SERVE: 'serve' };
  var step = STEP.TAP;
  var tapCount = 0;
  var combo = 0;
  var lastServeAt = 0;
  var open = false;
  var displayScore = save.score;
  var scoreTimer = null;
  var cookTimer = null;
  var zzzTimer = null;
  var skinUnlocked = false;
  var titleUpgraded = false;
  var closed = false;

  var COMBO_AFTER = 3;
  var COMBO_WINDOW = 8000;
  var ZZZ_AFTER = 15000;

  var CUSTOMERS = [
    { emoji: '🐰', name: '小兔' },
    { emoji: '🐻', name: '小熊' },
    { emoji: '🐱', name: '小猫' },
    { emoji: '🐶', name: '小狗' },
    { emoji: '🐷', name: '小猪' }
  ];
  var queue = [];
  var customerIdx = 0;

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* 点单模式（汉堡店）：顾客点 1-3 样，手动制作并端过去 */
  var custOrder = [];
  var tray = [];
  var traySeq = 0;
  var TRAY_MAX_ORDER = 4;

  /* ---------- 音效 ---------- */
  var audioCtx = null;
  function initAudio() {
    if (audioCtx) return;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* ignore */ }
  }
  function tone(freq, dur, type, vol, delay, slide) {
    if (!audioCtx) return;
    var t0 = audioCtx.currentTime + (delay || 0);
    var o = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }
  function sfx(name) {
    if (!audioCtx) return;
    if (name === 'tap') tone(150, 0.09, 'sine', 0.25, 0, 105);
    else if (name === 'fill') tone(90, 0.12, 'triangle', 0.28, 0, 70);
    else if (name === 'cook') { tone(620, 0.07, 'sine', 0.12, 0); tone(720, 0.07, 'sine', 0.10, 0.13); }
    else if (name === 'ding') { tone(1568, 0.35, 'sine', 0.22, 0); tone(2093, 0.5, 'sine', 0.12, 0.06); }
    else if (name === 'coin') { tone(988, 0.07, 'square', 0.12, 0); tone(1319, 0.07, 'square', 0.12, 0.09); tone(1568, 0.14, 'square', 0.12, 0.18); }
    else if (name === 'pop') tone(880, 0.06, 'triangle', 0.15, 0, 1250);
    else if (name === 'jump') tone(520, 0.12, 'triangle', 0.12, 0, 940);
    else if (name === 'unlock') { tone(660, 0.12, 'triangle', 0.2, 0); tone(880, 0.12, 'triangle', 0.2, 0.12); tone(1320, 0.22, 'triangle', 0.2, 0.24); }
  }

  /* ---------- 渲染 ---------- */
  function renderScore() {
    App.el('storeScoreNum').textContent = displayScore.toLocaleString();
    App.el('storeDaily').textContent = '👥 今日 ' + servedToday() + ' / ' + DAILY_LIMIT;
  }

  function renderSign() {
    var king = save.score >= cfg.titleAt;
    var text = king ? cfg.kingSign : cfg.sign;
    App.el('storeSign').textContent = text;
    App.el('storeSign').classList.toggle('king', king);
    App.el('storeOpenSign').textContent = text;
    if (king && !titleUpgraded) {
      titleUpgraded = true;
      App.toast('👑 招牌升级：' + cfg.kingSign + '！');
    }
  }

  function skin() {
    return save.score >= cfg.skinAt ? 'gold' : 'normal';
  }

  function storeLv() {
    return Math.max(1, Math.min(MAX_STORE_LV, save.storeLv || 1));
  }

  function baseGain() {
    return cfg.base + (storeLv() - 1) * 50;
  }

  function renderCombo() {
    var box = App.el('storeCombo');
    if (combo >= 2) {
      box.textContent = '🔥 连击 x' + combo + (combo > COMBO_AFTER ? '（每单 +' + cfg.comboBonus + '）' : '');
      box.classList.add('show');
    } else {
      box.textContent = '';
      box.classList.remove('show');
    }
  }

  function renderQueue() {
    var box = App.el('storeQueue');
    box.innerHTML = '';
    queue.forEach(function (c, i) {
      var d = document.createElement('div');
      d.className = 'tb-customer' + (i === 0 ? ' front' : '') + (c.zzz ? ' zzz' : '');
      d.innerHTML =
        '<div class="tb-bubble"><span class="tb-bubble-text">' + cfg.sign.split(' ')[1] + ' 来一份</span><span class="tb-zzz">💤</span></div>' +
        '<div class="tb-face">' + c.emoji + '</div>' +
        '<div class="tb-cust-name">' + c.name + '</div>';
      d.addEventListener('click', function () { tapCustomer(d, c); });
      box.appendChild(d);
    });
  }

  function tapCustomer(d) {
    if (!open) return;
    sfx('jump');
    d.classList.remove('jump');
    void d.offsetWidth;
    d.classList.add('jump');
    var b = d.querySelector('.tb-bubble-text');
    b.textContent = '我饿了！';
    setTimeout(function () { b.textContent = cfg.sign.split(' ')[1] + ' 来一份'; }, 900);
  }

  function renderWork() {
    var area = App.el('storeWorkArea');
    var hint = App.el('storeHint');
    area.innerHTML = '';
    if (cfg.mode === 'order') { renderOrderWork(area, hint); return; }
    if (step === STEP.TAP) {
      hint.textContent = '👨‍🍳 ' + cfg.steps[0].hint;
      var main = document.createElement('div');
      main.className = 'tb-dough ' + cfg.workClass;
      main.innerHTML = '<span class="tb-knead-count">' + tapCount + ' / 5</span>' + workEmoji();
      main.addEventListener('click', function () { tapMain(); });
      area.appendChild(main);
    } else if (step === STEP.ONCE1) {
      hint.textContent = cfg.steps[0].onceHint;
      var once1 = document.createElement('div');
      once1.className = 'tb-dough round ' + cfg.workClass + ' badge';
      once1.innerHTML = workEmoji(true) + '<span class="tb-badge">' + cfg.steps[0].doneBadge + '</span>';
      area.appendChild(once1);
    } else if (step === STEP.ONCE2) {
      hint.textContent = cfg.steps[1].onceHint;
      var once2 = document.createElement('div');
      once2.className = 'tb-dough round ' + cfg.workClass + ' badge';
      once2.innerHTML = workEmoji(true) + '<span class="tb-badge">' + cfg.steps[1].doneBadge + '</span>';
      area.appendChild(once2);
    } else if (step === STEP.COOK) {
      hint.textContent = cfg.cookHint;
      var cooker = document.createElement('div');
      cooker.className = 'tb-steamer ' + cfg.cookClass;
      cooker.innerHTML =
        '<div class="tb-steam s1"></div><div class="tb-steam s2"></div><div class="tb-steam s3"></div>' +
        '<div class="tb-steamer-body"></div><div class="tb-steamer-lid"></div>' +
        '<div class="tb-cook-content">' + workEmoji(true) + '</div>';
      area.appendChild(cooker);
    } else if (step === STEP.SERVE) {
      hint.textContent = cfg.serveHint;
      var ready = document.createElement('div');
      ready.className = 'tb-bun-ready ' + skin();
      ready.innerHTML =
        '<span class="tb-serve-emoji">' + (skin() === 'gold' ? cfg.skinEmoji : cfg.serveEmoji) + '</span>' +
        '<span class="tb-arrow">👇 端给客人</span>';
      ready.addEventListener('click', function () { serveBun(ready); });
      area.appendChild(ready);
    }
    renderButtons();
  }

  function renderOrderWork(area, hint) {
    hint.textContent = '🧾 客人点了：' + (custOrder.length ? custOrder.map(function (it) { return it.emoji + it.name; }).join(' ') : '') + '（点下面做好再点一下端过去）';
    // 出餐台
    var trayBox = document.createElement('div');
    trayBox.className = 'chef-tray';
    trayBox.addEventListener('click', function (e) {
      var del = e.target.closest('.chef-tray-discard');
      if (del) {
        var id = Number(del.getAttribute('data-id'));
        for (var i = 0; i < tray.length; i++) {
          if (tray[i].id === id) { tray.splice(i, 1); break; }
        }
        renderWork();
        e.stopPropagation();
      }
    });
    if (!tray.length) {
      trayBox.innerHTML = '<div class="chef-tray-empty">出餐台空空的，先做客人点的吧</div>';
    } else {
      tray.forEach(function (slot) {
        var cell = document.createElement('div');
        cell.className = 'chef-tray-cell ' + (slot.item.cup ? 'cup' : 'dish');
        cell.innerHTML =
          '<button type="button" class="chef-tray-discard" data-id="' + slot.id + '">✕</button>' +
          '<span class="chef-tray-emoji">' + slot.item.emoji + '</span>' +
          '<span class="chef-tray-name">' + slot.item.name + '</span>' +
          '<span class="chef-tray-type">' + (slot.item.cup ? '🥤 杯装' : '🍽️ 盘装') + '</span>';
        cell.addEventListener('click', function () { giveItem(slot); });
        trayBox.appendChild(cell);
      });
    }
    area.appendChild(trayBox);
    // 商品按钮
    var itemsBox = document.createElement('div');
    itemsBox.className = 'chef-items';
    cfg.items.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chef-item';
      b.dataset.name = it.name;
      b.innerHTML =
        '<span class="chef-item-emoji">' + it.emoji + '</span>' +
        '<span class="chef-item-name">' + it.name + '</span>' +
        '<span class="chef-item-meta">' + (it.cup ? '🥤杯' : '🍽️盘') + ' · 做 ' + (it.t / 1000) + ' 秒</span>';
      b.addEventListener('click', function () { pickItemOrder(b, it); });
      itemsBox.appendChild(b);
    });
    area.appendChild(itemsBox);
  }

  function pickItemOrder(btn, it) {
    if (!open || closed) return;
    if (!custOrder.length) { App.toast('客人还在排队，等客人来了再做吧'); return; }
    if (btn.classList.contains('making') || btn.classList.contains('done')) return;
    if (tray.length >= TRAY_MAX_ORDER) { App.toast('出餐台满了，先端给客人或点 ✕ 收回来'); return; }
    btn.classList.add('making');
    var nameEl = btn.querySelector('.chef-item-name');
    nameEl.textContent = '正在做…';
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
        tray.push({ id: ++traySeq, item: it });
        sfx('pop');
        renderWork();
        App.el('storeHint').textContent = it.name + ' 做好啦，点一下端给客人！';
      }
    }, 100);
  }

  function giveItem(slot) {
    if (!open || closed) return;
    var idx = -1;
    for (var i = 0; i < custOrder.length; i++) {
      if (custOrder[i].name === slot.item.name) { idx = i; break; }
    }
    if (idx < 0) {
      App.el('storeHint').textContent = '✗ 客人不想要「' + slot.item.name + '」，点 ✕ 收回来吧';
      return;
    }
    custOrder.splice(idx, 1);
    tray.splice(tray.indexOf(slot), 1);
    if (!custOrder.length) {
      var first = document.querySelector('.tb-customer.front');
      if (first) first.classList.add('eating');
      App.el('storeHint').textContent = '🎉 客人吃到啦，满意地走了！';
      setTimeout(function () { finishServe(first); }, 700);
    } else {
      App.el('storeHint').textContent = '✓ 端过去了！客人还想要：' + custOrder.map(function (it) { return it.emoji + it.name; }).join(' ');
      renderWork();
    }
  }

  function workEmoji(done) {
    if (cfg.workClass === 'dough') return done ? '🥟' : '🥟';
    if (cfg.workClass === 'steak') return done ? '🥩' : '🥩';
    return '🥩';
  }

  function renderButtons() {
    App.el('btn1').classList.toggle('active', step === STEP.TAP);
    App.el('btn2').classList.toggle('active', step === STEP.ONCE1);
    App.el('btn3').classList.toggle('active', step === STEP.ONCE2);
    var b1 = App.el('btn1'), b2 = App.el('btn2'), b3 = App.el('btn3');
    b1.innerHTML = cfg.steps[0].btn + '<span>' + cfg.steps[0].btnName + '</span>';
    b2.innerHTML = cfg.steps[1].btn + '<span>' + cfg.steps[1].btnName + '</span>';
    b3.innerHTML = cfg.steps[2].btn + '<span>' + cfg.steps[2].btnName + '</span>';
  }

  /* ---------- 制作流程 ---------- */
  function tapMain() {
    if (step !== STEP.TAP || !open) return;
    tapCount++;
    sfx('tap');
    var d = document.querySelector('.tb-dough.' + cfg.workClass);
    if (d) {
      d.classList.remove('bump');
      void d.offsetWidth;
      d.classList.add('bump');
      d.querySelector('.tb-knead-count').textContent = tapCount + ' / 5';
      var grow = 1 + tapCount * 0.045;
      d.style.transform = 'scale(' + grow + ')';
      d.classList.toggle('hot', tapCount >= 3);
    }
    if (tapCount >= 5) {
      sfx('pop');
      step = STEP.ONCE1;
      renderWork();
    }
  }

  function onceTap(which) {
    if (!open) return;
    if (which === 1 && step === STEP.ONCE1) {
      sfx('fill');
      step = STEP.ONCE2;
      renderWork();
    } else if (which === 2 && step === STEP.ONCE2) {
      sfx('cook');
      step = STEP.COOK;
      renderWork();
      clearTimeout(cookTimer);
      cookTimer = setTimeout(function () {
        sfx('ding');
        step = STEP.SERVE;
        renderWork();
      }, 2200);
    }
  }

  function serveBun(bunEl) {
    if (step !== STEP.SERVE || !open) return;
    var first = document.querySelector('.tb-customer.front');
    if (!first) return;
    var bRect = bunEl.getBoundingClientRect();
    var cRect = first.getBoundingClientRect();
    var dx = (cRect.left + cRect.width / 2) - (bRect.left + bRect.width / 2);
    var dy = (cRect.top + cRect.height * 0.35) - (bRect.top + bRect.height / 2);
    var fly = bunEl.cloneNode(true);
    fly.classList.add('flying');
    fly.style.position = 'fixed';
    fly.style.left = bRect.left + 'px';
    fly.style.top = bRect.top + 'px';
    fly.style.width = bRect.width + 'px';
    fly.style.height = bRect.height + 'px';
    fly.style.margin = '0';
    fly.style.animation = 'none';
    bunEl.replaceWith(fly);
    sfx('pop');
    if (fly.animate) {
      fly.animate(
        [{ transform: 'translate(0,0) scale(1)' }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0.3)', opacity: 1 }],
        { duration: 700, easing: 'ease-in', fill: 'forwards' }
      );
    }
    first.classList.add('eating');
    setTimeout(function () { finishServe(first); }, 700);
  }

  function finishServe(customerEl) {
    if (!open) return;
    var now = Date.now();
    combo = (now - lastServeAt <= COMBO_WINDOW) ? combo + 1 : 1;
    lastServeAt = now;
    var gain = combo > COMBO_AFTER ? baseGain() + 100 : baseGain();
    renderCombo();
    if (combo > COMBO_AFTER) {
      floatText('太棒了！', 'center', '#FF6B6B');
      sfx('unlock');
    }
    save.score += gain;
    save.totalServed += 1;
    var t = todayStr();
    save.daily[t] = (save.daily[t] || 0) + 1;
    saveNow();
    renderSign();
    checkUnlock();
    sfx('coin');
    floatText('+' + gain, 'customer', '#FF9F1C');
    animateScoreTo(save.score);

    customerEl.classList.add('leaving');
    setTimeout(function () {
      queue.shift();
      var next = CUSTOMERS[customerIdx % CUSTOMERS.length];
      customerIdx++;
      queue.push({ emoji: next.emoji, name: next.name, zzz: false, start: Date.now() });
      renderQueue();
      renderScore();
      if (servedToday() >= DAILY_LIMIT) {
        showClosed();
        return;
      }
      if (cfg.mode === 'order') {
        // 新客人点单：1-3 样
        var n = 1 + Math.floor(Math.random() * 3);
        custOrder = shuffle(cfg.items).slice(0, n);
        tray = [];
      } else {
        step = STEP.TAP;
        tapCount = 0;
      }
      renderWork();
    }, 700);
  }

  function floatText(text, where, color) {
    var d = document.createElement('div');
    d.className = 'tb-float';
    d.textContent = text;
    d.style.color = color || '#FF9F1C';
    if (where === 'customer') {
      var first = document.querySelector('.tb-customer.front');
      if (first) {
        var r = first.getBoundingClientRect();
        d.style.left = (r.left + r.width / 2) + 'px';
        d.style.top = r.top + 'px';
      }
    } else {
      d.style.left = '50%';
      d.style.top = '38%';
      d.style.transform = 'translateX(-50%)';
    }
    d.style.position = 'fixed';
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 1300);
  }

  function animateScoreTo(target) {
    clearInterval(scoreTimer);
    scoreTimer = setInterval(function () {
      if (displayScore >= target) {
        displayScore = target;
        renderScore();
        clearInterval(scoreTimer);
        return;
      }
      displayScore = Math.min(target, displayScore + Math.max(30, Math.round((target - displayScore) / 10)));
      renderScore();
    }, 45);
  }

  function checkUnlock() {
    if (save.score >= cfg.skinAt && !skinUnlocked) {
      skinUnlocked = true;
      sfx('unlock');
      App.toast('🎉 解锁新皮肤：' + cfg.skinName + '！');
    }
  }

  function startZzzCheck() {
    clearInterval(zzzTimer);
    zzzTimer = setInterval(function () {
      if (!open) return;
      queue.forEach(function (c) {
        if (c.start && Date.now() - c.start > ZZZ_AFTER && !c.zzz) {
          c.zzz = true;
          renderQueue();
        }
      });
    }, 1000);
  }

  /* ---------- 开门 / 打烊 ---------- */
  function showClosed() {
    open = false;
    closed = true;
    clearInterval(zzzTimer);
    App.el('storeClosed').classList.remove('hidden');
    App.el('storeClosedScore').textContent = '今天招待了 ' + DAILY_LIMIT + ' 位客人，赚了 ' + save.score.toLocaleString() + ' 分！';
    App.el('storeClosedNext').textContent = save.score >= cfg.titleAt
      ? cfg.kingSign + ' 已到手，明天继续冲！'
      : (save.score >= cfg.skinAt ? '皮肤已解锁，明天继续攒招牌分！' : '明天再来，向 ' + cfg.kingSign + ' 出发！');
  }

  function openShop() {
    initAudio();
    open = true;
    closed = false;
    var ov = App.el('storeOpen');
    ov.classList.add('open');
    sfx('unlock');
    queue = [];
    customerIdx = 0;
    for (var i = 0; i < 3; i++) {
      var c = CUSTOMERS[customerIdx % CUSTOMERS.length];
      customerIdx++;
      queue.push({ emoji: c.emoji, name: c.name, zzz: false, start: Date.now() });
    }
    if (cfg.mode === 'order') {
      var n = 1 + Math.floor(Math.random() * 3);
      custOrder = shuffle(cfg.items).slice(0, n);
      tray = [];
    }
    renderQueue();
    renderWork();
    renderCombo();
    startZzzCheck();
    setTimeout(function () { ov.style.display = 'none'; }, 1100);
  }

  document.title = cfg.sign.split(' ')[1] + ' · i同步学';
  App.el('storeOpenBtn').addEventListener('click', openShop);
  App.el('btn1').addEventListener('click', tapMain);
  App.el('btn2').addEventListener('click', function () { onceTap(1); });
  App.el('btn3').addEventListener('click', function () { onceTap(2); });
  App.el('storeClosedBtn').addEventListener('click', function () { location.href = 'foodchef.html'; });

  renderSign();
  renderScore();
  renderButtons();
  if (servedToday() >= DAILY_LIMIT) {
    // 今天已满员：不弹开门，直接显示打烊
    App.el('storeOpen').style.display = 'none';
    showClosed();
  }

  /* 调试/自动化验证接口 */
  window.__store = {
    cfg: cfg,
    state: function () {
      return {
        open: open,
        closed: closed,
        step: step,
        tapCount: tapCount,
        combo: combo,
        score: save.score,
        totalServed: save.totalServed,
        servedToday: servedToday(),
        queue: queue.map(function (c) { return { emoji: c.emoji, name: c.name, zzz: c.zzz }; }),
        skin: skin()
      };
    },
    open: openShop,
    tap: function (n) { for (var i = 0; i < (n || 1); i++) tapMain(); },
    once1: function () { onceTap(1); },
    once2: function () { onceTap(2); },
    serve: function () {
      var r = document.querySelector('.tb-bun-ready');
      if (r) r.click();
    },
    setScore: function (n) {
      save.score = n;
      saveNow();
      renderSign();
      checkUnlock();
      displayScore = n;
      renderScore();
    },
    setZzzMs: function (ms) { ZZZ_AFTER = ms; },
    setServedToday: function (n) {
      save.daily[todayStr()] = n;
      save.totalServed = Math.max(save.totalServed, n);
      saveNow();
      renderScore();
    },
    /* 点单模式接口 */
    orderNames: function () { return custOrder.map(function (it) { return it.name; }); },
    trayNames: function () { return tray.map(function (t) { return t.item.name; }); },
    pick: function (name) {
      var btns = document.querySelectorAll('.chef-item');
      for (var i = 0; i < btns.length; i++) {
        if (btns[i].dataset.name === name) { btns[i].click(); return true; }
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
    discard: function (name) {
      var btns = document.querySelectorAll('.chef-tray-discard');
      for (var i = 0; i < btns.length; i++) {
        var cell = btns[i].closest('.chef-tray-cell');
        if (cell && cell.querySelector('.chef-tray-name').textContent === name) { btns[i].click(); return true; }
      }
      return false;
    }
  };
})();
