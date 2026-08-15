/* i同步学 · 小汤包
   循环：接单 -> 揉面(点5次) -> 包馅 -> 上蒸笼(冒白气) -> 叮 -> 端给客人 -> +500数钱
   连击：连续 3 笼后每笼 +600，飘「太棒了！」
   无失败：客人等太久只是冒 ZZZ 睡着，不会离开
   激励：5000 分解锁猪猪包皮肤；10000 分招牌升级为「超级汤包王」 */
(function () {
  'use strict';

  var SAVE_KEY = 'xx3_tangbao_v1';
  var save = { score: 0 };
  try {
    var raw = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    if (typeof raw.score === 'number') save.score = raw.score;
  } catch (e) { /* ignore */ }

  function saveNow() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ }
  }

  var STEP = { KNEAD: 'knead', FILL: 'fill', STEAM_READY: 'steam_ready', STEAMING: 'steaming', SERVE: 'serve' };
  var step = STEP.KNEAD;
  var kneadCount = 0;
  var combo = 0;
  var lastServeAt = 0;
  var open = false;
  var displayScore = save.score;
  var scoreTimer = null;
  var steamTimer = null;
  var zzzTimer = null;
  var pigUnlocked = false;   // 本次会话是否已提示过解锁
  var titleUpgraded = false;

  var SCORE_BASE = 500;
  var SCORE_COMBO = 600;
  var COMBO_AFTER = 3;        // 第 4 笼起算连击分
  var COMBO_WINDOW = 8000;    // 8 秒内连续出餐算连击
  var SKIN_AT = 5000;
  var TITLE_AT = 10000;
  var ZZZ_AFTER = 15000;      // 等 15 秒冒 ZZZ

  var CUSTOMERS = [
    { emoji: '🐰', name: '小兔' },
    { emoji: '🐻', name: '小熊' },
    { emoji: '🐱', name: '小猫' },
    { emoji: '🐶', name: '小狗' },
    { emoji: '🐷', name: '小猪' }
  ];
  var queue = [];
  var customerIdx = 0;

  /* ---------- 音效（Web Audio 合成，无需音频文件） ---------- */
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
    if (name === 'knead') tone(150, 0.09, 'sine', 0.25, 0, 105);
    else if (name === 'fill') tone(90, 0.12, 'triangle', 0.28, 0, 70);
    else if (name === 'steam') { tone(620, 0.07, 'sine', 0.12, 0); tone(720, 0.07, 'sine', 0.10, 0.13); }
    else if (name === 'ding') { tone(1568, 0.35, 'sine', 0.22, 0); tone(2093, 0.5, 'sine', 0.12, 0.06); }
    else if (name === 'coin') { tone(988, 0.07, 'square', 0.12, 0); tone(1319, 0.07, 'square', 0.12, 0.09); tone(1568, 0.14, 'square', 0.12, 0.18); }
    else if (name === 'pop') tone(880, 0.06, 'triangle', 0.15, 0, 1250);
    else if (name === 'jump') tone(520, 0.12, 'triangle', 0.12, 0, 940);
    else if (name === 'unlock') { tone(660, 0.12, 'triangle', 0.2, 0); tone(880, 0.12, 'triangle', 0.2, 0.12); tone(1320, 0.22, 'triangle', 0.2, 0.24); }
  }

  /* ---------- 渲染 ---------- */
  function renderScore() {
    App.el('tbScoreNum').textContent = displayScore.toLocaleString();
  }

  function renderSign() {
    var upgraded = save.score >= TITLE_AT;
    var text = upgraded ? '👑 超级汤包王' : '🥟 小汤包';
    App.el('tbSign').textContent = text;
    App.el('tbSign').classList.toggle('king', upgraded);
    App.el('tbOpenSign').textContent = text;
    if (upgraded && !titleUpgraded) {
      titleUpgraded = true;
      App.toast('👑 招牌升级：超级汤包王！');
    }
  }

  function renderCombo() {
    var box = App.el('tbCombo');
    if (combo >= 2) {
      box.textContent = '🔥 连击 x' + combo + (combo > COMBO_AFTER ? '（每笼 +' + SCORE_COMBO + '）' : '');
      box.classList.add('show');
    } else {
      box.textContent = '';
      box.classList.remove('show');
    }
  }

  function skin() {
    return save.score >= SKIN_AT ? 'pig' : 'normal';
  }

  function renderQueue() {
    var box = App.el('tbQueue');
    box.innerHTML = '';
    queue.forEach(function (c, i) {
      var d = document.createElement('div');
      d.className = 'tb-customer' + (i === 0 ? ' front' : '') + (c.zzz ? ' zzz' : '');
      d.dataset.idx = i;
      d.innerHTML =
        '<div class="tb-bubble"><span class="tb-bubble-text">🥟 想吃汤包</span><span class="tb-zzz">💤</span></div>' +
        '<div class="tb-face">' + c.emoji + '</div>' +
        '<div class="tb-cust-name">' + c.name + '</div>';
      d.addEventListener('click', function () { tapCustomer(d, c); });
      box.appendChild(d);
    });
  }

  function tapCustomer(d, c) {
    if (!open) return;
    sfx('jump');
    d.classList.remove('jump');
    void d.offsetWidth; // 重启动画
    d.classList.add('jump');
    var b = d.querySelector('.tb-bubble-text');
    b.textContent = '我饿了！';
    setTimeout(function () { b.textContent = '🥟 想吃汤包'; }, 900);
  }

  function renderWork() {
    var area = App.el('tbWorkArea');
    var hint = App.el('tbHint');
    area.innerHTML = '';
    if (step === STEP.KNEAD) {
      hint.textContent = '👨‍🍳 快揉面！点 5 次把面团揉圆';
      var dough = document.createElement('div');
      dough.className = 'tb-dough';
      dough.innerHTML = '<span class="tb-knead-count">' + kneadCount + ' / 5</span>';
      dough.addEventListener('click', function () { kneadTap(); });
      area.appendChild(dough);
    } else if (step === STEP.FILL) {
      hint.textContent = '🥩 面团揉圆啦，点「加肉馅」包起来！';
      var filled = document.createElement('div');
      filled.className = 'tb-dough round';
      filled.innerHTML = '<span class="tb-arrow">👇 点加肉馅</span>';
      area.appendChild(filled);
    } else if (step === STEP.STEAM_READY) {
      hint.textContent = '🔥 包子包好啦，点「上蒸笼」开始蒸！';
      var bun = document.createElement('div');
      bun.className = 'tb-bun ' + skin();
      bun.innerHTML = '<span class="tb-arrow">👇 点上蒸笼</span>';
      area.appendChild(bun);
    } else if (step === STEP.STEAMING) {
      hint.textContent = '💨 蒸笼冒白气啦，等「叮」一声就好了…';
      var steamer = document.createElement('div');
      steamer.className = 'tb-steamer';
      steamer.innerHTML =
        '<div class="tb-steam s1"></div><div class="tb-steam s2"></div><div class="tb-steam s3"></div>' +
        '<div class="tb-steamer-body"></div><div class="tb-steamer-lid"></div>';
      area.appendChild(steamer);
    } else if (step === STEP.SERVE) {
      hint.textContent = '叮！包子熟啦，点包子端给客人！';
      var ready = document.createElement('div');
      ready.className = 'tb-bun-ready ' + skin();
      ready.innerHTML = '<span class="tb-arrow">👇 端给客人</span>';
      ready.addEventListener('click', function () { serveBun(ready); });
      area.appendChild(ready);
    }
    renderButtons();
  }

  function renderButtons() {
    App.el('btnKnead').classList.toggle('active', step === STEP.KNEAD);
    App.el('btnFill').classList.toggle('active', step === STEP.FILL);
    App.el('btnSteam').classList.toggle('active', step === STEP.STEAM_READY);
  }

  /* ---------- 制作流程 ---------- */
  function kneadTap() {
    if (step !== STEP.KNEAD || !open) return;
    kneadCount++;
    sfx('knead');
    var d = document.querySelector('.tb-dough');
    if (d) {
      d.classList.remove('bump');
      void d.offsetWidth;
      d.classList.add('bump');
      d.querySelector('.tb-knead-count').textContent = kneadCount + ' / 5';
      var grow = 1 + kneadCount * 0.045;
      d.style.transform = 'scale(' + grow + ')';
    }
    if (kneadCount >= 5) {
      sfx('pop');
      step = STEP.FILL;
      renderWork();
    }
  }

  function fillTap() {
    if (step !== STEP.FILL || !open) return;
    sfx('fill');
    step = STEP.STEAM_READY;
    renderWork();
  }

  function steamTap() {
    if (step !== STEP.STEAM_READY || !open) return;
    sfx('steam');
    step = STEP.STEAMING;
    renderWork();
    clearTimeout(steamTimer);
    steamTimer = setTimeout(function () {
      sfx('ding');
      step = STEP.SERVE;
      renderWork();
    }, 2200);
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
    setTimeout(function () { finishServe(first, cRect); }, 700);
  }

  function finishServe(customerEl, cRect) {
    if (!open) return;
    // 连击
    var now = Date.now();
    combo = (now - lastServeAt <= COMBO_WINDOW) ? combo + 1 : 1;
    lastServeAt = now;
    // 连续做完 3 笼后，第 4 笼起每笼 +600
    var gain = combo > COMBO_AFTER ? SCORE_COMBO : SCORE_BASE;
    renderCombo();
    if (combo > COMBO_AFTER) {
      floatText('太棒了！', 'center', '#FF6B6B');
      sfx('unlock');
    }
    // 积分：立即入账，显示滚动
    save.score += gain;
    saveNow();
    renderSign();
    checkUnlock();
    sfx('coin');
    floatText('+' + gain, 'customer', '#FF9F1C');
    animateScoreTo(save.score);

    // 顾客开心离开
    customerEl.classList.add('leaving');
    setTimeout(function () {
      queue.shift();
      var next = CUSTOMERS[customerIdx % CUSTOMERS.length];
      customerIdx++;
      queue.push({ emoji: next.emoji, name: next.name, zzz: false, start: Date.now() });
      renderQueue();
      step = STEP.KNEAD;
      kneadCount = 0;
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
    if (save.score >= SKIN_AT && !pigUnlocked) {
      pigUnlocked = true;
      sfx('unlock');
      App.toast('🎉 解锁新皮肤：猪猪包！');
    }
  }

  /* ---------- 顾客等太久冒 ZZZ ---------- */
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

  /* ---------- 开始营业 ---------- */
  function openShop() {
    initAudio();
    open = true;
    var ov = App.el('tbOpen');
    ov.classList.add('open');
    sfx('unlock');
    queue = [];
    customerIdx = 0;
    for (var i = 0; i < 3; i++) {
      var c = CUSTOMERS[customerIdx % CUSTOMERS.length];
      customerIdx++;
      queue.push({ emoji: c.emoji, name: c.name, zzz: false, start: Date.now() });
    }
    renderQueue();
    renderWork();
    renderCombo();
    startZzzCheck();
    setTimeout(function () { ov.style.display = 'none'; }, 1100);
  }

  App.el('tbOpenBtn').addEventListener('click', openShop);
  App.el('btnKnead').addEventListener('click', kneadTap);
  App.el('btnFill').addEventListener('click', fillTap);
  App.el('btnSteam').addEventListener('click', steamTap);

  renderSign();
  renderScore();
  renderButtons();

  /* 调试/自动化验证接口 */
  window.__tb = {
    state: function () {
      return {
        open: open,
        step: step,
        kneadCount: kneadCount,
        combo: combo,
        score: save.score,
        queue: queue.map(function (c) { return { emoji: c.emoji, name: c.name, zzz: c.zzz }; }),
        skin: skin()
      };
    },
    open: openShop,
    knead: function (n) { for (var i = 0; i < (n || 1); i++) kneadTap(); },
    fill: fillTap,
    steam: steamTap,
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
    renderWork: renderWork
  };
})();
