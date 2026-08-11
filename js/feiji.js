/* 飞机大战：滑动开始战斗 · 打敌机赚金币 · 战机升级 · 挂机收益 */
(function () {
  'use strict';

  var data = App.store.load();
  var FJ_SAVE = 'xx3_feiji_v1';

  /* ---------- 战机图鉴（抽卡池） ---------- */
  var PLANES = [
    { id: 'blue', name: '小蓝鹰', emoji: '🔵', rarity: 0, color: '#48c6ef', dmg: 0, rate: 0, coins: 1 },
    { id: 'purple', name: '紫电', emoji: '🟣', rarity: 1, color: '#b06ef5', dmg: 1, rate: 1, coins: 1 },
    { id: 'red', name: '烈焰号', emoji: '🔴', rarity: 1, color: '#ff5d5d', dmg: 2, rate: 0, coins: 1 },
    { id: 'gold', name: '黄金战机', emoji: '🟡', rarity: 2, color: '#ffd166', dmg: 1, rate: 1, coins: 3 },
    { id: 'diamond', name: '钻石战机', emoji: '💎', rarity: 3, color: '#7df9ff', dmg: 1, rate: 1, coins: 2 },
    { id: 'rainbow', name: '彩虹号', emoji: '🌈', rarity: 3, color: '#ff9ff3', dmg: 2, rate: 2, coins: 2 }
  ];
  var RARITY_NAME = ['普通', '稀有', '史诗', '传说'];
  var RARITY_COLOR = ['#c9d2ff', '#7dd3fc', '#c4b5fd', '#ffd166'];
  var DUP_REFUND = [200, 800, 2000, 5000];
  function plane() { return PLANES.find(function (p) { return p.id === save.equipped; }) || PLANES[0]; }

  /* ---------- 游戏存档（金币/等级/挂机） ---------- */
  var save = {
    coins: 0,
    planeLv: 1,
    bulletLv: 1,
    best: 0,
    lastPlayAt: Date.now(),
    hangar: {},
    equipped: 'blue'
  };
  try {
    var raw = JSON.parse(localStorage.getItem(FJ_SAVE) || '{}');
    for (var k in save) if (raw[k] !== undefined) save[k] = raw[k];
  } catch (e) { /* ignore */ }
  function saveNow() {
    try { localStorage.setItem(FJ_SAVE, JSON.stringify(save)); } catch (e) { /* ignore */ }
  }

  function idleRate() { return 6 + (save.planeLv - 1) * 4; } // 挂机金币/分钟
  function planeCost() { return 80 * save.planeLv; }
  function bulletCost() { return 50 * save.bulletLv; }

  /* 挂机收益：离开期间的每分钟金币，回来时结算 */
  function collectIdle() {
    var now = Date.now();
    var mins = Math.max(0, Math.floor((now - (save.lastPlayAt || now)) / 60000));
    var gain = Math.min(mins * idleRate(), 9999);
    if (gain > 0) {
      save.coins += gain;
      save.lastPlayAt = now;
      saveNow();
      if (gain > 0) App.toast('⏱️ 挂机收益 +' + gain + ' 金币！');
    } else {
      save.lastPlayAt = now;
      saveNow();
    }
    return gain;
  }

  /* ---------- 大厅 ---------- */
  function renderLobby() {
    data = App.store.load();
    App.el('fjJifenPill').textContent = '⭐ ' + (data.balance || 0);
    App.el('fjChancePill').textContent = '✈️ ' + (data.feijiChances || 0);
    App.el('fjJifen').textContent = data.balance || 0;
    App.el('fjChances').textContent = data.feijiChances || 0;
    App.el('fjCoins').textContent = save.coins;
    App.el('fjIdle').textContent = '⏱️ 挂机收益：+' + idleRate() + ' 金币/分钟';
    App.el('fjPlaneLv').textContent = 'LV.' + save.planeLv;
    App.el('fjBulletLv').textContent = 'LV.' + save.bulletLv;
    App.el('fjPlaneDesc').textContent = '更快火力 · 挂机 +' + idleRate() + '/分钟';
    App.el('fjBulletDesc').textContent = '伤害 ' + (1 + save.bulletLv) + ' · 射速更快';
    App.el('fjPlaneBtn').textContent = '升级（' + planeCost() + ' 金币）';
    App.el('fjBulletBtn').textContent = '升级（' + bulletCost() + ' 金币）';
    App.el('fjPlaneBtn').disabled = save.coins < planeCost();
    App.el('fjBulletBtn').disabled = save.coins < bulletCost();
    var redeem = App.el('fjRedeemBtn');
    redeem.disabled = (data.balance || 0) < 10;
    redeem.textContent = (data.balance || 0) >= 10
      ? '🔄 兑换 1 次机会（-10 星星）'
      : '🔄 星星不够 10 颗，先去学习赚星星吧';
    var start = App.el('fjStartBtn');
    start.disabled = (data.feijiChances || 0) < 1;
    start.textContent = (data.feijiChances || 0) >= 1
      ? '🚀 滑动开始战斗（还有 ' + data.feijiChances + ' 次机会）'
      : '🚀 滑动开始战斗（需要机会）';
    App.el('fjDrawBtn').textContent = '单抽（500 金币）';
    App.el('fjDrawTenBtn').textContent = '十连抽（4500 金币）';
    App.el('fjDrawBtn').disabled = save.coins < 500;
    App.el('fjDrawTenBtn').disabled = save.coins < 4500;
    var cur = plane();
    App.el('fjDeploy').textContent = '出战：' + cur.emoji + ' ' + cur.name;
    var hangarBox = App.el('fjHangar');
    hangarBox.innerHTML = '';
    PLANES.forEach(function (p) {
      var owned = save.hangar[p.id] || 0;
      var row = document.createElement('div');
      row.className = 'fj-hangar-row' + (save.equipped === p.id ? ' on' : '');
      row.innerHTML =
        '<span>' + p.emoji + ' ' + p.name + '</span>' +
        '<span class="fj-rarity" style="color:' + RARITY_COLOR[p.rarity] + '">' + RARITY_NAME[p.rarity] + (owned ? ' ×' + owned : '') + '</span>' +
        (owned
          ? '<button class="fj-btn fj-equip-btn" data-equip="' + p.id + '">' + (save.equipped === p.id ? '已出战' : '装备') + '</button>'
          : '<span class="fj-lock">未获得</span>');
      hangarBox.appendChild(row);
    });
    hangarBox.querySelectorAll('[data-equip]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        equipPlane(btn.getAttribute('data-equip'));
      });
    });
  }

  function showDrawResult(text) {
    App.el('fjDrawResult').innerHTML = text;
  }

  /* ---------- 抽战机 ---------- */
  function gachaDraw() {
    var r = Math.random();
    var tier = r < 0.5 ? 0 : r < 0.8 ? 1 : r < 0.95 ? 2 : 3;
    var pool = PLANES.filter(function (p) { return p.rarity === tier; });
    var p = pool[Math.floor(Math.random() * pool.length)];
    if (!save.hangar[p.id]) {
      save.hangar[p.id] = 1;
      saveNow();
      return { plane: p, dup: false };
    }
    save.hangar[p.id] += 1;
    var refund = DUP_REFUND[p.rarity];
    save.coins += refund;
    saveNow();
    return { plane: p, dup: true, refund: refund };
  }

  function gachaTen() {
    var list = [];
    for (var i = 0; i < 10; i++) {
      if (i === 9) {
        // 保底：第 10 抽至少史诗
        var tier2 = 2 + (Math.random() < 0.3 ? 1 : 0);
        var pool2 = PLANES.filter(function (p) { return p.rarity === tier2; });
        var p2 = pool2[Math.floor(Math.random() * pool2.length)];
        if (!save.hangar[p2.id]) { save.hangar[p2.id] = 1; list.push({ plane: p2, dup: false }); }
        else { save.hangar[p2.id] += 1; save.coins += DUP_REFUND[tier2]; list.push({ plane: p2, dup: true, refund: DUP_REFUND[tier2] }); }
      } else {
        list.push(gachaDraw());
      }
    }
    saveNow();
    return list;
  }

  function equipPlane(id) {
    if (!save.hangar[id]) { App.toast('还没抽到这架战机'); return false; }
    save.equipped = id;
    saveNow();
    renderLobby();
    App.toast('✈️ ' + PLANES.find(function (p) { return p.id === id; }).name + ' 出战！');
    return true;
  }

  App.el('fjDrawBtn').addEventListener('click', function () {
    if (save.coins < 500) { App.toast('金币不够'); return; }
    save.coins -= 500;
    var r = gachaDraw();
    saveNow();
    renderLobby();
    showDrawResult(
      (r.dup ? '重复获得 ' : '🎉 获得 ') + r.plane.emoji + ' ' + r.plane.name +
      ' <span style="color:' + RARITY_COLOR[r.plane.rarity] + '">[' + RARITY_NAME[r.plane.rarity] + ']</span>' +
      (r.dup ? '，转成 ' + r.refund + ' 金币' : '')
    );
  });

  App.el('fjDrawTenBtn').addEventListener('click', function () {
    if (save.coins < 4500) { App.toast('金币不够'); return; }
    save.coins -= 4500;
    var list = gachaTen();
    saveNow();
    renderLobby();
    var html = list.map(function (r) {
      return r.plane.emoji + ' ' + r.plane.name + '<span style="color:' + RARITY_COLOR[r.plane.rarity] + '">[' + RARITY_NAME[r.plane.rarity] + ']</span>' + (r.dup ? '(重复+' + r.refund + ')' : '');
    }).join('　');
    showDrawResult('🎉 十连抽：' + html);
  });

  App.el('fjRedeemBtn').addEventListener('click', function () {
    data = App.store.load();
    if (App.redeemFeijiChance(data)) {
      App.logActivity(data, '兑换飞机大战机会');
      App.toast('兑换成功，+1 次机会！');
      renderLobby();
    } else {
      App.toast('星星还不够 10 颗哦');
    }
  });

  App.el('fjPlaneBtn').addEventListener('click', function () {
    var c = planeCost();
    if (save.coins < c) { App.toast('金币不够'); return; }
    save.coins -= c;
    save.planeLv += 1;
    saveNow();
    renderLobby();
    App.toast('✈️ 战机升到 LV.' + save.planeLv + '！挂机收益提升');
  });

  App.el('fjBulletBtn').addEventListener('click', function () {
    var c = bulletCost();
    if (save.coins < c) { App.toast('金币不够'); return; }
    save.coins -= c;
    save.bulletLv += 1;
    saveNow();
    renderLobby();
    App.toast('🔫 子弹升到 LV.' + save.bulletLv + '！');
  });

  /* 滑动开始战斗：按住向上滑（或直接点一下）开始 */
  var fjStartBtn = App.el('fjStartBtn');
  var swipeY = 0;
  fjStartBtn.addEventListener('pointerdown', function (e) {
    swipeY = e.clientY;
    fjStartBtn.setPointerCapture(e.pointerId);
  });
  fjStartBtn.addEventListener('pointerup', function (e) {
    var moved = swipeY - e.clientY;
    if (moved >= 50 || Math.abs(moved) < 12) tryStart();
  });

  function tryStart() {
    data = App.store.load();
    if (!App.useFeijiChance(data)) { App.toast('没有游戏机会啦，去大厅兑换'); return; }
    save.lastPlayAt = Date.now();
    saveNow();
    renderLobby();
    startGame();
  }

  /* ---------- 战斗 ---------- */
  var canvas, ctx, cw, ch, dpr;
  var running = false, gameOver = false;
  var player, bullets, enemies, enemyBullets, parts, stars;
  var score = 0, sessCoins = 0, lives = 5;
  var fireCooldown = 0, spawnCooldown = 0, invulnUntil = 0, timeUp = false;
  var lastTs = 0, stopTimer = null, rafId = null;

  function startGame() {
    canvas = App.el('fjCanvas');
    ctx = canvas.getContext('2d');
    App.el('fjLobby').classList.add('hidden');
    App.el('fjOver').classList.add('hidden');
    App.el('fjGame').classList.remove('hidden');
    resize();
    score = 0; sessCoins = 0; lives = 5;
    running = true; gameOver = false; timeUp = false;
    player = { x: cw / 2, y: ch - 110, w: 52, h: 58, hp: 5 };
    bullets = []; enemies = []; enemyBullets = []; parts = [];
    stars = [];
    for (var i = 0; i < 70; i++) {
      stars.push({ x: Math.random() * cw, y: Math.random() * ch, s: Math.random() * 1.6 + 0.4, v: Math.random() * 40 + 10 });
    }
    fireCooldown = 0; spawnCooldown = 0.6; invulnUntil = 0;
    App.el('fjBlackHoleBtn').classList.toggle('hidden', plane().id !== 'rainbow');
    blackHole.active = false;
    blackHole.readyAt = 0;
    updateHud();
    startTimer();
    if (rafId) cancelAnimationFrame(rafId);
    lastTs = performance.now();
    loop(lastTs);
  }

  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = Math.max(300, Math.floor(rect.width));
    ch = Math.max(360, Math.floor(rect.height));
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', function () { if (running) resize(); });

  function updateHud() {
    App.el('fjScore').textContent = '🏆 ' + score;
    App.el('fjCoinsHud').textContent = '🪙 ' + sessCoins;
    App.el('fjLives').textContent = '❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(5 - Math.max(0, lives));
  }

  function bulletDamage() { return 1 + save.bulletLv + plane().dmg; }
  function fireInterval() { return Math.max(0.13, 0.42 - (save.bulletLv + plane().rate) * 0.05); }
  function coinMult() { return plane().coins; }
  function laserDps() { return 90 + save.bulletLv * 25 + plane().dmg * 30; }

  /* 激光：按住伸缩键发射，松开收回 */
  var laser = { active: false, len: 0, width: 36 };
  var blackHole = { active: false, t: 0, readyAt: 0, x: 0, y: 0 };
  App.el('fjLaserBtn').addEventListener('pointerdown', function (e) {
    e.preventDefault();
    laser.active = true;
  });
  App.el('fjLaserBtn').addEventListener('pointerup', function () { laser.active = false; });
  App.el('fjLaserBtn').addEventListener('pointercancel', function () { laser.active = false; });
  App.el('fjBlackHoleBtn').addEventListener('pointerdown', function (e) {
    e.preventDefault();
    if (plane().id !== 'rainbow') return;
    if (Date.now() < blackHole.readyAt) { App.toast('🕳️ 黑洞还在冷却中…'); return; }
    blackHole.active = true;
    blackHole.t = 0;
    blackHole.readyAt = Date.now() + 8000;
    blackHole.x = cw / 2;
    blackHole.y = ch / 2;
    App.toast('🕳️ 黑洞！吞噬一切！');
  });

  function loop(ts) {
    if (!running) return;
    rafId = requestAnimationFrame(loop);
    var dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    update(dt);
    draw();
  }

  function update(dt) {
    // 星空
    stars.forEach(function (s) {
      s.y += s.v * dt;
      if (s.y > ch) { s.y = -2; s.x = Math.random() * cw; }
    });
    // 自动开火（钻石战机一发三钻，黄金战机单发金弹）
    fireCooldown -= dt;
    if (fireCooldown <= 0) {
      fireCooldown = fireInterval();
      var pid = plane().id;
      if (pid === 'diamond') {
        var ddmg = bulletDamage();
        bullets.push({ x: player.x, y: player.y - 28, vx: 0, vy: -620, w: 7, h: 7, dmg: ddmg, kind: 'dia' });
        bullets.push({ x: player.x - 12, y: player.y - 24, vx: -70, vy: -600, w: 7, h: 7, dmg: ddmg, kind: 'dia' });
        bullets.push({ x: player.x + 12, y: player.y - 24, vx: 70, vy: -600, w: 7, h: 7, dmg: ddmg, kind: 'dia' });
      } else {
        var kind = pid === 'gold' ? 'gold' : 'norm';
        var bw = pid === 'gold' ? 10 : 6;
        var bh = pid === 'gold' ? 20 : 16;
        bullets.push({ x: player.x, y: player.y - 30, vx: 0, vy: -620, w: bw, h: bh, dmg: bulletDamage(), kind: kind });
        if (save.bulletLv >= 3) bullets.push({ x: player.x - 16, y: player.y - 24, vx: 0, vy: -620, w: 5, h: 13, dmg: 1, kind: kind });
        if (save.bulletLv >= 5) bullets.push({ x: player.x + 16, y: player.y - 24, vx: 0, vy: -620, w: 5, h: 13, dmg: 1, kind: kind });
      }
    }
    // 敌机生成
    spawnCooldown -= dt;
    if (spawnCooldown <= 0) {
      spawnCooldown = Math.max(0.35, 0.9 - Math.floor(score / 300) * 0.08);
      spawnEnemy();
    }
    // 子弹
    for (var i = bullets.length - 1; i >= 0; i--) {
      var b = bullets[i];
      b.y += b.vy * dt;
      b.x += (b.vx || 0) * dt;
      if (b.y < -20) bullets.splice(i, 1);
    }
    // 敌机
    for (var j = enemies.length - 1; j >= 0; j--) {
      var e = enemies[j];
      e.y += e.vy * dt;
      if (e.y > ch + 40) { enemies.splice(j, 1); continue; }
      // 子弹打敌机
      for (var bi = bullets.length - 1; bi >= 0; bi--) {
        var bl = bullets[bi];
        if (bl.x > e.x - e.w / 2 && bl.x < e.x + e.w / 2 && bl.y > e.y - e.h / 2 && bl.y < e.y + e.h / 2) {
          e.hp -= bl.dmg;
          bullets.splice(bi, 1);
          spawnPart(bl.x, bl.y, '#ffd166', 4);
          if (e.hp <= 0) {
            destroyEnemy(j);
          }
          break;
        }
      }
    }
    // 激光：伸缩 + 伤害
    var laserTarget = laser.active ? player.y : 0;
    laser.len += (laserTarget - laser.len) * Math.min(1, dt * 9);
    if (laser.len > 24) {
      var rainbowLaser = plane().id === 'rainbow'; // 彩虹号激光摧毁一切
      for (var li = enemies.length - 1; li >= 0; li--) {
        var le = enemies[li];
        if (le.y > player.y - 30) continue;
        if (!rainbowLaser && Math.abs(le.x - player.x) >= (le.w / 2) + laser.width / 2) continue;
        le.hp -= laserDps() * dt;
        le.flash = 0.08;
        if (le.hp <= 0) destroyEnemy(li);
      }
    }
    // 彩虹号黑洞：吞噬一切
    if (blackHole.active) {
      blackHole.t += dt;
      if (blackHole.t >= 0.55) {
        blackHole.active = false;
        for (var hi = enemies.length - 1; hi >= 0; hi--) {
          explode(enemies[hi].x, enemies[hi].y, enemies[hi].color);
          destroyEnemy(hi);
        }
      }
    }
    // 敌机撞玩家
    if (Date.now() > invulnUntil) {
      for (var k = enemies.length - 1; k >= 0; k--) {
        var en = enemies[k];
        if (Math.abs(en.x - player.x) < (en.w + player.w) / 2 - 4 && Math.abs(en.y - player.y) < (en.h + player.h) / 2 - 4) {
          enemies.splice(k, 1);
          explode(en.x, en.y, '#ff6b6b');
          hitPlayer();
        }
      }
    }
    // 粒子
    for (var p = parts.length - 1; p >= 0; p--) {
      var pt = parts[p];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) parts.splice(p, 1);
    }
    if (lives <= 0) endGame(false);
  }

  function destroyEnemy(idx) {
    var e = enemies[idx];
    enemies.splice(idx, 1);
    explode(e.x, e.y, e.color);
    score += e.score;
    sessCoins += e.coins * coinMult();
    save.coins += e.coins * coinMult();
    saveNow();
    updateHud();
  }

  function spawnEnemy(type) {
    var r = type || Math.random();
    var e;
    if (r < 0.6) e = { x: 20 + Math.random() * (cw - 40), y: -40, w: 34, h: 30, hp: 1, maxHp: 1, vy: 110 + Math.random() * 40, score: 10, coins: 100, color: '#ef476f' };
    else if (r < 0.9) e = { x: 20 + Math.random() * (cw - 40), y: -40, w: 46, h: 40, hp: 3, maxHp: 3, vy: 80 + Math.random() * 30, score: 30, coins: 300, color: '#ff8c42' };
    else e = { x: 20 + Math.random() * (cw - 40), y: -50, w: 62, h: 54, hp: 8, maxHp: 8, vy: 55 + Math.random() * 20, score: 80, coins: 800, color: '#9b5de5' };
    enemies.push(e);
  }

  function hitPlayer() {
    lives -= 1;
    invulnUntil = Date.now() + 1200;
    updateHud();
    App.toast('💥 被撞到了！');
    if (lives <= 0) endGame(false);
  }

  function spawnPart(x, y, color, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 40 + Math.random() * 120;
      parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.35 + Math.random() * 0.3, color: color, r: 2 + Math.random() * 3 });
    }
  }

  function explode(x, y, color) {
    spawnPart(x, y, color, 18);
    spawnPart(x, y, '#ffffff', 6);
  }

  /* ---------- 绘制 ---------- */
  function draw() {
    var g = ctx;
    var grad = g.createLinearGradient(0, 0, 0, ch);
    grad.addColorStop(0, '#141a4a');
    grad.addColorStop(0.55, '#232b6e');
    grad.addColorStop(1, '#3d2f86');
    g.fillStyle = grad;
    g.fillRect(0, 0, cw, ch);
    stars.forEach(function (s) {
      g.globalAlpha = 0.35 + s.s * 0.2;
      g.fillStyle = '#dfe6ff';
      g.fillRect(s.x, s.y, s.s, s.s);
    });
    g.globalAlpha = 1;
    bullets.forEach(function (b) {
      if (b.kind === 'dia') {
        g.fillStyle = '#7df9ff';
        g.shadowColor = '#7df9ff';
        g.shadowBlur = 12;
        g.save();
        g.translate(b.x, b.y);
        g.rotate(Math.PI / 4);
        g.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        g.restore();
      } else {
        g.fillStyle = b.kind === 'gold' ? '#ffdf8a' : '#ffd166';
        g.shadowColor = '#ffd166';
        g.shadowBlur = b.kind === 'gold' ? 14 : 8;
        g.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
      }
    });
    g.shadowBlur = 0;
    enemies.forEach(function (e) {
      drawPlane(e.x, e.y, e.w, e.h, e.color, true);
      if (e.hp < e.maxHp) {
        g.fillStyle = '#ffffff55';
        g.fillRect(e.x - e.w / 2, e.y - e.h / 2 - 8, e.w, 4);
        g.fillStyle = '#7dff8a';
        g.fillRect(e.x - e.w / 2, e.y - e.h / 2 - 8, e.w * (e.hp / e.maxHp), 4);
      }
      if (e.flash > 0) {
        g.globalAlpha = Math.min(1, e.flash * 8);
        g.fillStyle = '#ffffff';
        g.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
        g.globalAlpha = 1;
      }
    });
    // 激光：从机头向上伸缩的发光光束
    if (laser.len > 4) {
      var lg = g.createLinearGradient(0, player.y, 0, player.y - laser.len);
      lg.addColorStop(0, 'rgba(125,249,255,0.95)');
      lg.addColorStop(1, 'rgba(64,156,255,0.15)');
      g.fillStyle = lg;
      g.shadowColor = '#7df9ff';
      g.shadowBlur = 18;
      g.fillRect(player.x - laser.width / 2, player.y - laser.len, laser.width, laser.len);
      g.shadowBlur = 0;
      g.fillStyle = 'rgba(255,255,255,0.85)';
      g.fillRect(player.x - 3, player.y - laser.len, 6, laser.len);
    }
    // 黑洞：旋转吞噬特效
    if (blackHole.active) {
      var bp = Math.min(1, blackHole.t / 0.55);
      var br = 24 + bp * cw * 0.45;
      var bg = g.createRadialGradient(blackHole.x, blackHole.y, 0, blackHole.x, blackHole.y, br);
      bg.addColorStop(0, 'rgba(0,0,0,0.95)');
      bg.addColorStop(0.55, 'rgba(76,29,149,0.85)');
      bg.addColorStop(1, 'rgba(76,29,149,0)');
      g.fillStyle = bg;
      g.beginPath();
      g.arc(blackHole.x, blackHole.y, br, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = 'rgba(196,181,253,0.9)';
      g.lineWidth = 3;
      g.beginPath();
      g.arc(blackHole.x, blackHole.y, br * 0.55, 0, Math.PI * 2);
      g.stroke();
    }
    if (Date.now() < invulnUntil && Math.floor(Date.now() / 100) % 2 === 0) g.globalAlpha = 0.4;
    drawPlayerPlane(plane(), player.x, player.y, player.w + 8, player.h + 8);
    g.globalAlpha = 1;
    parts.forEach(function (pt) {
      g.globalAlpha = Math.max(0, pt.life);
      g.fillStyle = pt.color;
      g.fillRect(pt.x - pt.r / 2, pt.y - pt.r / 2, pt.r, pt.r);
    });
    g.globalAlpha = 1;
  }

  function drawPlane(x, y, w, h, color, enemy) {
    var g = ctx;
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(x, enemy ? y + h / 2 : y - h / 2);
    g.lineTo(x - w / 2, enemy ? y - h / 2 : y + h / 2);
    g.lineTo(x, enemy ? y - h / 2 + 8 : y + h / 2 - 8);
    g.lineTo(x + w / 2, enemy ? y - h / 2 : y + h / 2);
    g.closePath();
    g.fill();
    g.fillStyle = enemy ? '#1a1030' : '#ffd166';
    g.beginPath();
    g.arc(x, y, w * 0.16, 0, Math.PI * 2);
    g.fill();
  }

  /* 玩家战机：每种机型有专属造型（机头朝上） */
  function drawPlayerPlane(p, x, y, w, h) {
    var g = ctx;
    var t = performance.now() / 1000;
    g.save();
    g.translate(x, y);
    // 引擎尾焰（所有机型通用，烈焰号更旺）
    var flameLen = 14 + Math.sin(t * 22) * 6 + (p.id === 'red' ? 12 : 0);
    var fg = g.createLinearGradient(0, h * 0.32, 0, h * 0.32 + flameLen);
    fg.addColorStop(0, 'rgba(255,225,130,0.95)');
    fg.addColorStop(1, 'rgba(255,110,30,0)');
    g.fillStyle = fg;
    g.shadowColor = '#ffb347';
    g.shadowBlur = 14;
    g.beginPath();
    g.moveTo(-w * 0.07, h * 0.32);
    g.quadraticCurveTo(-w * 0.22, h * 0.32 + flameLen * 0.6, 0, h * 0.32 + flameLen);
    g.quadraticCurveTo(w * 0.22, h * 0.32 + flameLen * 0.6, w * 0.07, h * 0.32);
    g.fill();
    g.shadowBlur = 0;

    if (p.id === 'blue') drawBlue(x, y, w, h, t);
    else if (p.id === 'purple') drawPurple(x, y, w, h, t);
    else if (p.id === 'red') drawRed(x, y, w, h, t);
    else if (p.id === 'gold') drawGold(x, y, w, h, t);
    else if (p.id === 'diamond') drawDiamond(x, y, w, h, t);
    else drawRainbow(x, y, w, h, t);
    g.restore();
  }

  /* 小蓝鹰：流线型三角翼战斗机 */
  function drawBlue(x, y, w, h, t) {
    var g = ctx;
    g.fillStyle = '#3fa9f5';
    g.shadowColor = '#48c6ef';
    g.shadowBlur = 10;
    g.beginPath();
    g.moveTo(0, -h * 0.5);
    g.lineTo(-w * 0.16, -h * 0.12);
    g.lineTo(-w * 0.5, h * 0.18);
    g.lineTo(-w * 0.3, h * 0.26);
    g.lineTo(-w * 0.12, h * 0.2);
    g.lineTo(-w * 0.05, h * 0.34);
    g.lineTo(w * 0.05, h * 0.34);
    g.lineTo(w * 0.12, h * 0.2);
    g.lineTo(w * 0.3, h * 0.26);
    g.lineTo(w * 0.5, h * 0.18);
    g.lineTo(w * 0.16, -h * 0.12);
    g.closePath();
    g.fill();
    g.shadowBlur = 0;
    g.fillStyle = '#9edcff';
    g.beginPath();
    g.ellipse(0, -h * 0.02, w * 0.1, h * 0.2, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#0e4d8f';
    g.beginPath();
    g.ellipse(0, -h * 0.1, w * 0.05, h * 0.1, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#bde8ff';
    g.beginPath();
    g.moveTo(0, -h * 0.5);
    g.lineTo(-w * 0.05, -h * 0.25);
    g.lineTo(w * 0.05, -h * 0.25);
    g.closePath();
    g.fill();
  }

  /* 紫电：前掠翼未来战机 */
  function drawPurple(x, y, w, h, t) {
    var g = ctx;
    g.fillStyle = '#8a4ff0';
    g.shadowColor = '#b06ef5';
    g.shadowBlur = 12;
    g.beginPath();
    g.moveTo(0, -h * 0.5);
    g.lineTo(-w * 0.14, -h * 0.05);
    g.lineTo(-w * 0.48, h * 0.3);
    g.lineTo(-w * 0.16, h * 0.2);
    g.lineTo(0, h * 0.36);
    g.lineTo(w * 0.16, h * 0.2);
    g.lineTo(w * 0.48, h * 0.3);
    g.lineTo(w * 0.14, -h * 0.05);
    g.closePath();
    g.fill();
    g.shadowBlur = 0;
    g.strokeStyle = '#d9b3ff';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-w * 0.48, h * 0.3);
    g.lineTo(-w * 0.14, -h * 0.05);
    g.lineTo(0, -h * 0.5);
    g.moveTo(w * 0.48, h * 0.3);
    g.lineTo(w * 0.14, -h * 0.05);
    g.stroke();
    g.fillStyle = '#fff';
    g.beginPath();
    g.moveTo(0, -h * 0.5);
    g.lineTo(-w * 0.08, -h * 0.1);
    g.lineTo(w * 0.08, -h * 0.1);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(217,179,255,0.85)';
    g.beginPath();
    g.ellipse(0, h * 0.12, w * 0.05, h * 0.1, 0, 0, Math.PI * 2);
    g.fill();
  }

  /* 烈焰号：双引擎红色战斗机 */
  function drawRed(x, y, w, h, t) {
    var g = ctx;
    g.fillStyle = '#e23b3b';
    g.shadowColor = '#ff5d5d';
    g.shadowBlur = 10;
    g.beginPath();
    g.moveTo(0, -h * 0.5);
    g.lineTo(-w * 0.12, -h * 0.15);
    g.lineTo(-w * 0.42, h * 0.05);
    g.lineTo(-w * 0.34, h * 0.18);
    g.lineTo(-w * 0.12, h * 0.1);
    g.lineTo(0, h * 0.28);
    g.lineTo(w * 0.12, h * 0.1);
    g.lineTo(w * 0.34, h * 0.18);
    g.lineTo(w * 0.42, h * 0.05);
    g.lineTo(w * 0.12, -h * 0.15);
    g.closePath();
    g.fill();
    g.shadowBlur = 0;
    // 双引擎喷口
    g.fillStyle = '#3a3a4a';
    g.fillRect(-w * 0.26, h * 0.12, w * 0.1, h * 0.1);
    g.fillRect(w * 0.16, h * 0.12, w * 0.1, h * 0.1);
    g.fillStyle = '#ffd166';
    g.beginPath();
    g.ellipse(0, -h * 0.12, w * 0.06, h * 0.11, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#ffb3b3';
    g.beginPath();
    g.moveTo(0, -h * 0.5);
    g.lineTo(-w * 0.06, -h * 0.2);
    g.lineTo(w * 0.06, -h * 0.2);
    g.closePath();
    g.fill();
  }

  /* 黄金战机：圆润豪华金机 */
  function drawGold(x, y, w, h, t) {
    var g = ctx;
    var gg = g.createLinearGradient(0, -h * 0.5, 0, h * 0.4);
    gg.addColorStop(0, '#ffe08a');
    gg.addColorStop(0.5, '#f5b942');
    gg.addColorStop(1, '#c77f1d');
    g.fillStyle = gg;
    g.shadowColor = '#ffd166';
    g.shadowBlur = 12;
    g.beginPath();
    g.moveTo(0, -h * 0.5);
    g.quadraticCurveTo(-w * 0.18, -h * 0.05, -w * 0.46, h * 0.22);
    g.quadraticCurveTo(-w * 0.2, h * 0.28, 0, h * 0.36);
    g.quadraticCurveTo(w * 0.2, h * 0.28, w * 0.46, h * 0.22);
    g.quadraticCurveTo(w * 0.18, -h * 0.05, 0, -h * 0.5);
    g.fill();
    g.shadowBlur = 0;
    g.strokeStyle = 'rgba(255,255,255,0.6)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-w * 0.1, -h * 0.35);
    g.lineTo(-w * 0.24, h * 0.12);
    g.moveTo(w * 0.1, -h * 0.35);
    g.lineTo(w * 0.24, h * 0.12);
    g.stroke();
    g.fillStyle = '#8a5a12';
    g.beginPath();
    g.ellipse(0, -h * 0.05, w * 0.08, h * 0.16, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#fff3cf';
    g.beginPath();
    g.ellipse(0, -h * 0.16, w * 0.03, h * 0.07, 0, 0, Math.PI * 2);
    g.fill();
  }

  /* 钻石战机：水晶棱面造型 */
  function drawDiamond(x, y, w, h, t) {
    var g = ctx;
    var dg = g.createLinearGradient(0, -h * 0.5, 0, h * 0.4);
    dg.addColorStop(0, '#ffffff');
    dg.addColorStop(0.5, '#7df9ff');
    dg.addColorStop(1, '#2fb8d8');
    g.fillStyle = dg;
    g.shadowColor = '#7df9ff';
    g.shadowBlur = 14;
    g.beginPath();
    g.moveTo(0, -h * 0.5);
    g.lineTo(-w * 0.3, -h * 0.05);
    g.lineTo(-w * 0.14, h * 0.3);
    g.lineTo(0, h * 0.16);
    g.lineTo(w * 0.14, h * 0.3);
    g.lineTo(w * 0.3, -h * 0.05);
    g.closePath();
    g.fill();
    g.shadowBlur = 0;
    g.strokeStyle = 'rgba(255,255,255,0.85)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(0, -h * 0.5);
    g.lineTo(0, h * 0.16);
    g.moveTo(-w * 0.3, -h * 0.05);
    g.lineTo(w * 0.14, h * 0.3);
    g.moveTo(w * 0.3, -h * 0.05);
    g.lineTo(-w * 0.14, h * 0.3);
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.beginPath();
    g.moveTo(0, -h * 0.5);
    g.lineTo(-w * 0.07, -h * 0.2);
    g.lineTo(w * 0.07, -h * 0.2);
    g.closePath();
    g.fill();
  }

  /* 彩虹号：圆滚滚的可爱小飞机 */
  function drawRainbow(x, y, w, h, t) {
    var g = ctx;
    // 主翼
    g.fillStyle = '#ff9ff3';
    g.shadowColor = '#ff9ff3';
    g.shadowBlur = 10;
    g.beginPath();
    g.moveTo(0, -h * 0.3);
    g.quadraticCurveTo(-w * 0.5, -h * 0.1, -w * 0.42, h * 0.22);
    g.quadraticCurveTo(-w * 0.18, h * 0.26, 0, h * 0.16);
    g.quadraticCurveTo(w * 0.18, h * 0.26, w * 0.42, h * 0.22);
    g.quadraticCurveTo(w * 0.5, -h * 0.1, 0, -h * 0.3);
    g.fill();
    g.shadowBlur = 0;
    // 圆润机身
    g.fillStyle = '#ffc4f2';
    g.beginPath();
    g.ellipse(0, 0, w * 0.2, h * 0.34, 0, 0, Math.PI * 2);
    g.fill();
    // 泡泡座舱
    g.fillStyle = '#7dd3fc';
    g.beginPath();
    g.arc(0, -h * 0.14, w * 0.1, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.8)';
    g.beginPath();
    g.arc(-w * 0.035, -h * 0.17, w * 0.03, 0, Math.PI * 2);
    g.fill();
    // 尾翼
    g.fillStyle = '#ff9ff3';
    g.beginPath();
    g.moveTo(0, h * 0.16);
    g.lineTo(-w * 0.2, h * 0.34);
    g.lineTo(w * 0.2, h * 0.34);
    g.closePath();
    g.fill();
  }

  /* ---------- 玩家拖动 ---------- */
  var fjCanvasEl = App.el('fjCanvas');
  var dragId = null;
  fjCanvasEl.addEventListener('pointerdown', function (e) {
    dragId = e.pointerId;
    fjCanvasEl.setPointerCapture(e.pointerId);
  });
  fjCanvasEl.addEventListener('pointermove', function (e) {
    if (dragId === e.pointerId && player) {
      player.x = e.offsetX !== undefined ? e.offsetX : e.clientX;
      player.y = e.offsetY !== undefined ? e.offsetY : e.clientY;
      player.x = Math.max(player.w / 2, Math.min(cw - player.w / 2, player.x));
      player.y = Math.max(player.h / 2 + 40, Math.min(ch - player.h / 2 - 10, player.y));
    }
  });
  fjCanvasEl.addEventListener('pointerup', function () { dragId = null; });
  fjCanvasEl.addEventListener('pointercancel', function () { dragId = null; });

  /* ---------- 限时：每局 10 分钟，最后 20 秒提醒 ---------- */
  function startTimer() {
    stopTimer = App.countdown(600, 20, {
      onWarn: function () {
        App.el('fjTimer').classList.add('warn');
        App.toast('⏰ 时间快到了，还剩 20 秒！');
      },
      onTick: function (left) {
        App.el('fjTimer').textContent = left > 20 ? '⏰ ' + App.formatClock(left) : '⏰ 只剩 ' + left + ' 秒';
      },
      onEnd: function () {
        timeUp = true;
        endGame(true);
      }
    });
  }

  function endGame(byTime) {
    if (gameOver) return;
    gameOver = true;
    running = false;
    if (stopTimer) stopTimer();
    if (rafId) cancelAnimationFrame(rafId);
    save.lastPlayAt = Date.now();
    if (score > save.best) save.best = score;
    saveNow();
    App.el('fjOverTitle').textContent = byTime ? '⏰ 时间到！' : '🛬 战斗结束';
    App.el('fjOverScore').textContent = score;
    App.el('fjOverCoins').textContent = '+' + sessCoins;
    var again = App.el('fjAgainBtn');
    data = App.store.load();
    if ((data.feijiChances || 0) >= 1) {
      again.textContent = '🔄 再来一局（还剩 ' + data.feijiChances + ' 次机会）';
      again.disabled = false;
    } else {
      again.textContent = '⭐ 星星不够了，先回大厅兑换';
      again.disabled = true;
    }
    App.el('fjOver').classList.remove('hidden');
    App.logActivity(data, '飞机大战 得分' + score + ' 金币+' + sessCoins);
  }

  App.el('fjAgainBtn').addEventListener('click', function () {
    data = App.store.load();
    if (!App.useFeijiChance(data)) { App.toast('没有机会啦'); renderLobby(); return; }
    App.el('fjOver').classList.add('hidden');
    startGame();
  });

  App.el('fjHomeBtn').addEventListener('click', function () {
    App.el('fjGame').classList.add('hidden');
    App.el('fjOver').classList.add('hidden');
    App.el('fjLobby').classList.remove('hidden');
    renderLobby();
  });

  /* ---------- 测试钩子 ---------- */
  window.__feiji = {
    state: function () {
      return {
        coins: save.coins, planeLv: save.planeLv, bulletLv: save.bulletLv,
        running: running, score: score, lives: lives, sessCoins: sessCoins,
        enemies: enemies ? enemies.length : 0, bullets: bullets ? bullets.length : 0, best: save.best,
        equipped: save.equipped, hangar: Object.keys(save.hangar || {}).length,
        laserActive: laser.active, laserLen: laser.len, blackHoleActive: blackHole.active
      };
    },
    givePlane: function (id) {
      save.hangar[id] = (save.hangar[id] || 0) + 1;
      saveNow();
      renderLobby();
      return true;
    },
    bulletKinds: function () {
      return bullets ? bullets.map(function (b) { return b.kind || 'norm'; }) : [];
    },
    clearBullets: function () { bullets = []; return true; },
    blackHole: function () {
      if (plane().id !== 'rainbow') return false;
      blackHole.active = true;
      blackHole.t = 0;
      blackHole.x = cw / 2;
      blackHole.y = ch / 2;
      return true;
    },
    start: startGame,
    spawnEnemy: spawnEnemy,
    spawnEnemyOnPlayer: function () {
      spawnEnemy(0.1);
      var e = enemies[enemies.length - 1];
      e.x = player.x;
      e.y = player.y - 150;
      return true;
    },
    hitPlayer: hitPlayer,
    laserOn: function () { laser.active = true; },
    laserOff: function () { laser.active = false; },
    drawFree: function () {
      var r = gachaDraw();
      renderLobby();
      return { id: r.plane.id, name: r.plane.name, dup: r.dup, hangar: Object.keys(save.hangar || {}).length };
    },
    equipPlane: equipPlane,
    killFirstEnemy: function () {
      if (!enemies.length) spawnEnemy(0.1);
      destroyEnemy(0);
      return { score: score, sessCoins: sessCoins, coins: save.coins, mult: coinMult() };
    },
    forceTimeUp: function () { timeUp = true; endGame(true); },
    setSave: function (o) {
      for (var k in o) save[k] = o[k];
      saveNow();
      renderLobby();
    },
    collectIdle: collectIdle,
    idleRate: idleRate,
    upgradePlane: function () {
      if (save.coins < planeCost()) return false;
      save.coins -= planeCost();
      save.planeLv += 1;
      saveNow();
      renderLobby();
      return true;
    },
    upgradeBullet: function () {
      if (save.coins < bulletCost()) return false;
      save.coins -= bulletCost();
      save.bulletLv += 1;
      saveNow();
      renderLobby();
      return true;
    }
  };

  collectIdle();
  renderLobby();
})();
