/* 台球（8球）：15颗球+白球，机器人对手，赢一局+1000游戏积分，球杆工厂升级，岩浆球桌 */
(function () {
  'use strict';

  var PL_SAVE = 'xx3_pool_v1';
  var save = { level: 0, points: 10, wins: 0, table: false };
  try {
    var raw = JSON.parse(localStorage.getItem(PL_SAVE) || '{}');
    for (var k in save) if (raw[k] !== undefined) save[k] = raw[k];
    // 旧版迁移：老存档按已买球杆数量换算工厂等级
    if (raw.owned && raw.owned.length && !raw.level) {
      save.level = Math.min(10, 1 + raw.owned.length);
    }
    // 新版迁移：球杆扩展到 100 级后，把老等级调回中低阶继续爬
    if (raw.level) save.level = Math.min(15, raw.level);
  } catch (e) { /* ignore */ }
  function saveNow() {
    try { localStorage.setItem(PL_SAVE, JSON.stringify(save)); } catch (e) { /* ignore */ }
  }

  /* 球杆工厂：10 积分换树枝木棍，每升一级多 5 积分（上限 60），共 100 级，金龙至尊球杆是顶级 */
  var MAX_LEVEL = 100;
  var CUE_NAMES = ['树枝木棍', '硬木球杆', '竹节球杆', '铁皮球杆', '合金球杆', '碳素球杆', '星火球杆', '月光球杆', '曜石球杆', '秘银球杆'];
  var CUE_EMOJI = ['🪵', '🥢', '🎋', '🔩', '🔩', '⚙️', '✨', '🌙', '🪨', '🥈'];
  var DRAGON_NAMES = ['蓝龙', '红龙', '黄龙', '绿龙', '青龙', '紫龙', '银龙', '白龙', '黑龙', '天龙'];
  var DRAGON_COLORS = ['#48b0ff', '#ff5d5d', '#ffd166', '#4ade80', '#22c55e', '#b06ef5', '#c0c0c8', '#f5f5f5', '#3a3a4a', '#67e8f9'];
  function cueName(L) {
    if (L >= MAX_LEVEL) return '金龙至尊球杆';
    if (L <= 10) return CUE_NAMES[L - 1];
    var i = L - 11;
    return DRAGON_NAMES[i % 10] + (Math.floor(i / 10) + 1) + '代球杆';
  }
  function cueEmoji(L) {
    if (L >= MAX_LEVEL) return '🐉';
    if (L <= 10) return CUE_EMOJI[L - 1];
    return '🐲';
  }
  function levelCost(L) { return Math.min(60, 10 + (L - 1) * 5); } // 第 L 级的价格
  function cue() {
    var L = save.level || 1;
    var nm = cueName(L);
    return {
      level: L,
      name: nm,
      emoji: cueEmoji(L),
      cost: levelCost(L),
      aim: Math.min(4, Math.ceil(L / 25)),
      acc: Math.max(0.005, 0.030 - (L - 1) * (0.025 / 99)),
      dragon: nm.indexOf('龙') !== -1,
      dragonColor: L >= MAX_LEVEL ? '#f2c94c' : DRAGON_COLORS[(DRAGON_NAMES.indexOf(nm.replace(/[0-9]+代球杆/, '')) + 10) % 10]
    };
  }
  function aimLen() { return [0, 80, 150, 240, 340][cue().aim] || 80; }

  /* ---------- 球杆工厂 + 球桌商店 ---------- */
  function renderShop() {
    App.el('plJifenPill').textContent = '🎮 ' + save.points;
    App.el('plJifen').textContent = save.points;
    App.el('plWins').textContent = save.wins;
    var c = cue();
    if (save.level < 1) {
      App.el('plCueCurrent').innerHTML = '🪵 还没有球杆，先花 10 积分兑换树枝木棍';
      App.el('plCueBarFill').style.width = '0%';
      App.el('plProgress').textContent = 'Lv.0 / ' + MAX_LEVEL;
      App.el('plUpgradeBtn').disabled = save.points < 10;
      App.el('plUpgradeBtn').textContent = '🪵 兑换树枝木棍（10 积分）';
      App.el('plPlayBtn').disabled = true;
      App.el('plPlayBtn').textContent = '🎱 开始打台球（先兑换球杆）';
      return;
    }
    App.el('plCueCurrent').innerHTML = c.emoji + ' ' + c.name + ' <span class="pl-aim">横杠' + c.aim + ' · 命中率' + Math.round((1 - c.acc / 0.03) * 100) + '%</span>';
    App.el('plCueBarFill').style.width = Math.round((c.level / MAX_LEVEL) * 100) + '%';
    App.el('plProgress').textContent = 'Lv.' + c.level + ' / ' + MAX_LEVEL;
    var up = App.el('plUpgradeBtn');
    if (c.level >= MAX_LEVEL) {
      up.disabled = true;
      up.textContent = '🌟 已升到顶级';
    } else {
      var next = CUE_NAMES[c.level];
      up.disabled = save.points < levelCost(c.level + 1);
      up.textContent = '升级到 ' + next + '（' + levelCost(c.level + 1) + ' 积分）';
    }
    var tb = App.el('plTableBtn');
    if (save.table) {
      tb.disabled = true;
      tb.textContent = '🌋 已兑换岩浆球桌';
    } else {
      tb.disabled = save.points < 100;
      tb.textContent = save.points >= 100 ? '🌋 100 积分兑换岩浆球桌' : '🌋 100 积分兑换岩浆球桌（积分不够）';
    }
    var inv = App.el('plInvestBtn');
    inv.disabled = save.points < 1000;
    inv.textContent = save.points >= 1000 ? '💸 投资：花 1000 积分，得 10,000 积分' : '💸 投资：花 1000 积分，得 10,000 积分（积分不够）';
    var play = App.el('plPlayBtn');
    play.disabled = false;
    play.textContent = '🎱 开始打台球（' + c.emoji + ' ' + c.name + '）';
  }

  function upgradeCue() {
    if (save.level >= MAX_LEVEL) return false;
    var cost = levelCost(save.level + 1);
    if (save.points < cost) { App.toast('积分不够 ' + cost + '，打赢一局 +1000 积分'); return false; }
    save.points -= cost;
    save.level += 1;
    saveNow();
    renderShop();
    App.toast('🎱 ' + (save.level === 1 ? '兑换了 ' : '升级到 ') + cue().name + '！');
    return true;
  }

  function buyTable() {
    if (save.table) return false;
    if (save.points < 100) { App.toast('积分不够 100，打赢一局 +1000 积分'); return false; }
    save.points -= 100;
    save.table = true;
    saveNow();
    renderShop();
    App.toast('🌋 兑换了岩浆球桌！');
    return true;
  }

  function investPoints() {
    if (save.points < 1000) { App.toast('积分不够 1000'); return false; }
    save.points -= 1000;
    save.points += 10000;
    saveNow();
    renderShop();
    App.toast('💸 投资成功！积分 +10,000');
    return true;
  }

  App.el('plUpgradeBtn').addEventListener('click', upgradeCue);
  App.el('plTableBtn').addEventListener('click', buyTable);
  App.el('plInvestBtn').addEventListener('click', investPoints);
  App.el('plPlayBtn').addEventListener('click', function () {
    startGame();
  });

  /* ---------- 对局 ---------- */
  var canvas, ctx, cw, ch, dpr;
  var BALL_R = 13, BORDER = 24, POCKET_R = 18;
  var playX0, playY0, playW, playH, pockets = [];
  var balls = [], cueBall = null;
  var aimDir = { x: 1, y: 0 };
  var power = 0, moving = false, over = false, running = false;
  var playerTurn = true;
  var groups = { player: null, robot: null };
  var pottedThisShot = [], scratchThisShot = false;
  var winner = null, robotTimer = null;
  var stopTimer = null, rafId = null, lastTs = 0, dragAim = null;
  var cracks = [];
  var dragonBalls = []; // 金龙至尊球杆召唤的龙珠 {x,y,vx,vy,pocket,phase,t}
  var fast = false; // 加速：机器人更快、球滚得更快
  var PALETTE = ['#ef4444', '#ff9800', '#ffd166', '#4caf50', '#2196f3', '#9c27b0', '#e91e63'];

  function startGame() {
    canvas = App.el('plCanvas');
    ctx = canvas.getContext('2d');
    App.el('plShop').classList.add('hidden');
    App.el('plOver').classList.add('hidden');
    App.el('plGame').classList.remove('hidden');
    var rect = canvas.parentElement.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = Math.max(340, Math.floor(rect.width));
    ch = Math.max(420, Math.floor(rect.height));
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    playX0 = BORDER; playY0 = BORDER;
    playW = cw - BORDER * 2;
    playH = ch - BORDER * 2;
    pockets = [
      { x: playX0, y: playY0 }, { x: playX0 + playW, y: playY0 },
      { x: playX0, y: playY0 + playH }, { x: playX0 + playW, y: playY0 + playH },
      { x: playX0 + playW / 2, y: playY0 }, { x: playX0 + playW / 2, y: playY0 + playH }
    ];
    resetBalls();
    dragonBalls = [];
    fast = false;
    App.el('plFastBtn').textContent = '⚡ 加速';
    cracks = [];
    if (save.table) {
      for (var ci = 0; ci < 9; ci++) {
        var pts = [];
        var cx = playX0 + Math.random() * playW;
        var cy = playY0 + Math.random() * playH;
        pts.push({ x: cx, y: cy });
        var seg = 4 + Math.floor(Math.random() * 3);
        for (var si = 0; si < seg; si++) {
          cx += (Math.random() * 2 - 1) * 55;
          cy += (Math.random() * 2 - 1) * 55;
          cx = Math.max(playX0 + 8, Math.min(playX0 + playW - 8, cx));
          cy = Math.max(playY0 + 8, Math.min(playY0 + playH - 8, cy));
          pts.push({ x: cx, y: cy });
        }
        cracks.push(pts);
      }
    }
    playerTurn = true;
    groups = { player: null, robot: null };
    winner = null;
    moving = false; power = 0; over = false;
    running = true;
    aimDir = { x: 1, y: 0 };
    updateHud();
    updatePowerUI();
    startTimer();
    if (rafId) cancelAnimationFrame(rafId);
    lastTs = performance.now();
    loop(lastTs);
  }

  function resetBalls() {
    balls = [];
    // 15 颗球：1-7 实色，8 黑，9-15 花色；8 号放三角阵中心
    var nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    var apexX = playX0 + playW * 0.72, apexY = playY0 + playH / 2;
    var idx = 0;
    for (var row = 0; row < 5; row++) {
      for (var j = 0; j <= row; j++) {
        var n = nums[idx++];
        var group = n === 8 ? 'eight' : n <= 7 ? 'solid' : 'stripe';
        var col = n === 8 ? '#1a1a24' : PALETTE[(n - 1) % 7];
        balls.push({
          x: apexX + row * (BALL_R * 2 + 1),
          y: apexY + (j - row / 2) * (BALL_R * 2 + 1),
          vx: 0, vy: 0, r: BALL_R, color: col, num: n, group: group,
          type: 'target', pocketed: false
        });
      }
    }
    cueBall = { x: playX0 + playW * 0.2, y: playY0 + playH / 2, vx: 0, vy: 0, r: BALL_R, color: '#ffffff', num: 0, type: 'cue', pocketed: false };
    balls.push(cueBall);
  }

  function loop(ts) {
    if (!running) return;
    rafId = requestAnimationFrame(loop);
    var spd = fast ? 3 : 1;
    var dt = Math.min((ts - lastTs) / 1000 * spd, 0.05 * spd);
    lastTs = ts;
    if (moving) {
      var any = false;
      for (var s = 0; s < 2; s++) if (stepPhysics(dt)) any = true;
      if (updateDragonBalls(dt)) any = true;
      if (!any) {
        moving = false;
        evaluateShot();
      }
    }
    draw();
  }

  function stepPhysics(dt) {
    var moved = false;
    balls.forEach(function (b) {
      if (b.pocketed) return;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      var f = 1 - 0.9 * dt; // 慢慢滚动、逐渐减速
      b.vx *= Math.max(0, f);
      b.vy *= Math.max(0, f);
      if (Math.abs(b.vx) < 1.2) b.vx = 0; // 滚不动了才停
      if (Math.abs(b.vy) < 1.2) b.vy = 0;
      if (b.vx || b.vy) moved = true;
      if (b.x - b.r < playX0) { b.x = playX0 + b.r; b.vx = Math.abs(b.vx) * 0.8; }
      if (b.x + b.r > playX0 + playW) { b.x = playX0 + playW - b.r; b.vx = -Math.abs(b.vx) * 0.8; }
      if (b.y - b.r < playY0) { b.y = playY0 + b.r; b.vy = Math.abs(b.vy) * 0.8; }
      if (b.y + b.r > playY0 + playH) { b.y = playY0 + playH - b.r; b.vy = -Math.abs(b.vy) * 0.8; }
    });
    for (var i = 0; i < balls.length; i++) {
      for (var j = i + 1; j < balls.length; j++) {
        var a = balls[i], b2 = balls[j];
        if (a.pocketed || b2.pocketed) continue;
        var dx = b2.x - a.x, dy = b2.y - a.y;
        var d = Math.hypot(dx, dy);
        if (d < a.r + b2.r && d > 0.001) {
          var nx = dx / d, ny = dy / d;
          var ov = (a.r + b2.r - d) / 2;
          a.x -= nx * ov; a.y -= ny * ov;
          b2.x += nx * ov; b2.y += ny * ov;
          var vn1 = a.vx * nx + a.vy * ny;
          var vn2 = b2.vx * nx + b2.vy * ny;
          if (vn1 - vn2 > 0) {
            a.vx += (vn2 - vn1) * nx; a.vy += (vn2 - vn1) * ny;
            b2.vx += (vn1 - vn2) * nx; b2.vy += (vn1 - vn2) * ny;
          }
        }
      }
    }
    pockets.forEach(function (pk) {
      balls.forEach(function (b) {
        if (b.pocketed) return;
        if (Math.hypot(b.x - pk.x, b.y - pk.y) < POCKET_R + b.r * 0.45) {
          b.pocketed = true;
          b.vx = 0; b.vy = 0;
          if (b.type === 'cue') {
            scratchThisShot = true;
            b.x = playX0 + playW * 0.2;
            b.y = playY0 + playH / 2;
            b.pocketed = false;
          } else {
            pottedThisShot.push(b);
          }
        }
      });
    });
    return moved;
  }

  /* 一杆结束后的判定：定组、进自己球继续、黑8胜负、换人 */
  function evaluateShot() {
    if (over) return;
    var shooter = playerTurn ? 'player' : 'robot';
    if (!groups.player && !groups.robot && pottedThisShot.length) {
      var g0 = pottedThisShot[0].group;
      groups[shooter] = g0;
      groups[shooter === 'player' ? 'robot' : 'player'] = g0 === 'solid' ? 'stripe' : 'solid';
    }
    var own = groups[shooter];
    var eight = pottedThisShot.some(function (b) { return b.num === 8; });
    if (eight) {
      if (own && groupsCleared(own)) { declareWin(shooter); return; }
      declareWin(shooter === 'player' ? 'robot' : 'player');
      return;
    }
    var pottedOwn = pottedThisShot.some(function (b) { return b.group === own; });
    if (pottedOwn && !scratchThisShot) {
      // 进了自己的球，继续打（机器人继续时要重新安排出杆）
      if (!playerTurn && !over) {
        if (robotTimer) clearTimeout(robotTimer);
        robotTimer = setTimeout(robotTurn, fast ? 120 : 450);
      }
    } else {
      switchTurn();
    }
    pottedThisShot = [];
    scratchThisShot = false;
    updateHud();
  }

  function groupsCleared(g) {
    return balls.filter(function (b) { return b.group === g && !b.pocketed; }).length === 0;
  }

  function switchTurn() {
    pottedThisShot = [];
    scratchThisShot = false;
    playerTurn = !playerTurn;
    updateHud();
    if (!playerTurn && !over) {
      App.toast('🤖 轮到机器人');
      if (robotTimer) clearTimeout(robotTimer);
      robotTimer = setTimeout(robotTurn, fast ? 120 : 450);
    }
  }

  function declareWin(who) {
    if (over) return;
    over = true;
    winner = who;
    running = false;
    if (stopTimer) stopTimer();
    if (rafId) cancelAnimationFrame(rafId);
    if (who === 'player') {
      save.points += 1000;
      save.wins += 1;
      saveNow();
      App.el('plOverTitle').textContent = '🎉 你赢了！+1000 积分';
    } else {
      App.el('plOverTitle').textContent = '🤖 机器人赢了';
    }
    App.el('plOverWins').textContent = save.points + ' 积分 · 胜 ' + save.wins + ' 场';
    App.el('plOver').classList.remove('hidden');
    App.logActivity(App.store.load(), '台球' + (who === 'player' ? '胜' : '负') + '，积分' + save.points);
  }

  /* ---------- 机器人 ---------- */
  function raycastDir(dx, dy) {
    var bestT = 1e9, bestBall = null;
    balls.forEach(function (b) {
      if (b.pocketed || b.type === 'cue') return;
      var ox = b.x - cueBall.x, oy = b.y - cueBall.y;
      var proj = ox * dx + oy * dy;
      if (proj < 0) return;
      var perp2 = ox * ox + oy * oy - proj * proj;
      var rr = BALL_R * 2;
      if (perp2 > rr * rr) return;
      var t = proj - Math.sqrt(Math.max(0, rr * rr - perp2));
      if (t < bestT) { bestT = t; bestBall = b; }
    });
    return { t: bestT, ball: bestBall };
  }

  function pickRobotTarget() {
    var own = groups.robot;
    var candidates = [];
    if (own && groupsCleared(own)) {
      var e8 = balls.find(function (b) { return b.num === 8 && !b.pocketed; });
      if (e8) candidates.push(e8);
    } else {
      candidates = balls.filter(function (b) {
        if (b.pocketed || b.type === 'cue' || b.num === 8) return false;
        return own ? b.group === own : true;
      });
    }
    // 优先选“能直接打到、不会被其它球挡住”的目标
    var best = null, bd = 1e9;
    candidates.forEach(function (b) {
      var d = Math.hypot(b.x - cueBall.x, b.y - cueBall.y);
      if (d < 1e-6) return;
      var dx = (b.x - cueBall.x) / d, dy = (b.y - cueBall.y) / d;
      var hit = raycastDir(dx, dy);
      if (hit.ball && hit.ball !== b) return; // 路线被挡住
      if (d < bd) { bd = d; best = b; }
    });
    if (!best) {
      // 没有完全畅通的路线，选最近的球（机器人偶尔会打不进）
      var fallback = null, fd = 1e9;
      candidates.forEach(function (b) {
        var d = Math.hypot(b.x - cueBall.x, b.y - cueBall.y);
        if (d < fd) { fd = d; fallback = b; }
      });
      best = fallback;
    }
    return best;
  }

  function robotTurn() {
    if (over || playerTurn || moving) return;
    var target = pickRobotTarget();
    if (!target) { switchTurn(); return; }
    var dx = target.x - cueBall.x, dy = target.y - cueBall.y;
    var d = Math.hypot(dx, dy) || 1;
    var ang = Math.atan2(dy, dx);
    ang += (0.006 + d * 0.00002) * (Math.random() * 2 - 1); // 准度好一些，但留一点误差，玩家胜率略高
    aimDir = { x: Math.cos(ang), y: Math.sin(ang) };
    var p = Math.max(20, Math.min(88, 28 + d * 0.12 + (Math.random() * 12 - 6)));
    power = p;
    updatePowerUI();
    fireShot();
  }

  /* ---------- 瞄准与发射 ---------- */
  function raycast() {
    var bestT = 1e9, bestBall = null;
    balls.forEach(function (b) {
      if (b.pocketed || b.type === 'cue') return;
      var ox = b.x - cueBall.x, oy = b.y - cueBall.y;
      var proj = ox * aimDir.x + oy * aimDir.y;
      if (proj < 0) return;
      var perp2 = ox * ox + oy * oy - proj * proj;
      var rr = BALL_R * 2;
      if (perp2 > rr * rr) return;
      var t = proj - Math.sqrt(Math.max(0, rr * rr - perp2));
      if (t < bestT) { bestT = t; bestBall = b; }
    });
    return { t: bestT, ball: bestBall };
  }

  function fireShot() {
    if (moving || over || power < 3) return false;
    var ang = Math.atan2(aimDir.y, aimDir.x) + (Math.random() * 2 - 1) * cue().acc; // 球杆越好越准
    cueBall.vx = Math.cos(ang) * power * 5;
    cueBall.vy = Math.sin(ang) * power * 5;
    if (cue().level >= MAX_LEVEL && playerTurn) summonDragonBalls(); // 金龙至尊：玩家击球召唤 7 颗龙珠
    power = 0;
    updatePowerUI();
    pottedThisShot = [];
    scratchThisShot = false;
    moving = true;
    return true;
  }

  /* 金龙至尊球杆：召唤 7 颗龙珠，乱飞之后百分百滚进洞里 */
  function summonDragonBalls() {
    dragonBalls = [];
    for (var i = 0; i < 7; i++) {
      var tries = 0;
      var x, y, ok;
      do {
        ok = true;
        x = playX0 + BALL_R + Math.random() * (playW - BALL_R * 2);
        y = playY0 + BALL_R + Math.random() * (playH - BALL_R * 2);
        for (var j = 0; j < balls.length; j++) {
          if (!balls[j].pocketed && Math.hypot(x - balls[j].x, y - balls[j].y) < BALL_R * 3) { ok = false; break; }
        }
        for (var k = 0; k < dragonBalls.length; k++) {
          if (Math.hypot(x - dragonBalls[k].x, y - dragonBalls[k].y) < BALL_R * 3) { ok = false; break; }
        }
        tries++;
      } while (!ok && tries < 60);
      var pk = pockets[Math.floor(Math.random() * pockets.length)];
      var a = Math.random() * Math.PI * 2;
      dragonBalls.push({ x: x, y: y, vx: Math.cos(a) * 130, vy: Math.sin(a) * 130, pocket: pk, phase: 0, t: 0, potted: false });
    }
    App.toast('🐉 召唤 7 颗龙珠！');
  }

  function updateDragonBalls(dt) {
    if (!dragonBalls.length) return false;
    var any = false;
    for (var i = dragonBalls.length - 1; i >= 0; i--) {
      var d = dragonBalls[i];
      d.t += dt;
      d.phase = Math.min(1, d.t / 1.1); // 1.1 秒后开始滚向洞口
      if (d.phase < 1) {
        // 乱飞乱窜
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.vx *= Math.max(0, 1 - 2.2 * dt);
        d.vy *= Math.max(0, 1 - 2.2 * dt);
        if (d.x < playX0 + BALL_R) { d.x = playX0 + BALL_R; d.vx = Math.abs(d.vx); }
        if (d.x > playX0 + playW - BALL_R) { d.x = playX0 + playW - BALL_R; d.vx = -Math.abs(d.vx); }
        if (d.y < playY0 + BALL_R) { d.y = playY0 + BALL_R; d.vy = Math.abs(d.vy); }
        if (d.y > playY0 + playH - BALL_R) { d.y = playY0 + playH - BALL_R; d.vy = -Math.abs(d.vy); }
        any = true;
      } else {
        // 百分百滚进洞
        var dx = d.pocket.x - d.x, dy = d.pocket.y - d.y;
        var dist = Math.hypot(dx, dy);
        if (dist < POCKET_R + BALL_R * 0.5) {
          dragonBalls.splice(i, 1);
          save.points += 50;
          saveNow();
          App.toast('💥 龙珠进洞！+50 积分');
          if (App.el('plPointsHud')) updateHud();
        } else {
          var sp = 240;
          d.x += (dx / dist) * sp * dt;
          d.y += (dy / dist) * sp * dt;
          any = true;
        }
      }
    }
    return any;
  }

  var plCanvasEl = App.el('plCanvas');
  plCanvasEl.addEventListener('pointerdown', function (e) {
    if (moving || over || !playerTurn) return;
    dragAim = { id: e.pointerId };
    plCanvasEl.setPointerCapture(e.pointerId);
    setAim(e);
  });
  plCanvasEl.addEventListener('pointermove', function (e) {
    if (dragAim && dragAim.id === e.pointerId) setAim(e);
  });
  plCanvasEl.addEventListener('pointerup', function () { dragAim = null; });
  function setAim(e) {
    var r = canvas.getBoundingClientRect();
    var mx = e.clientX - r.left, my = e.clientY - r.top;
    var dx = mx - cueBall.x, dy = my - cueBall.y;
    var d = Math.hypot(dx, dy);
    if (d > 4) aimDir = { x: dx / d, y: dy / d };
  }

  var powerEl = App.el('plPower');
  var powerDrag = null;
  powerEl.addEventListener('pointerdown', function (e) {
    if (moving || over || !playerTurn) return;
    powerDrag = { id: e.pointerId, rect: powerEl.getBoundingClientRect() };
    powerEl.setPointerCapture(e.pointerId);
    setPowerFromY(e.clientY);
  });
  powerEl.addEventListener('pointermove', function (e) {
    if (powerDrag && powerDrag.id === e.pointerId) setPowerFromY(e.clientY);
  });
  powerEl.addEventListener('pointerup', function (e) {
    if (powerDrag && powerDrag.id === e.pointerId) {
      if (power >= 3) {
        fireShot();
      } else {
        App.toast('力度为 0，不能发射，往下拉一点');
      }
      power = 0;
      updatePowerUI();
    }
    powerDrag = null;
  });
  powerEl.addEventListener('pointercancel', function () { powerDrag = null; power = 0; updatePowerUI(); });
  function setPowerFromY(y) {
    if (!powerDrag) return;
    var h = powerDrag.rect.height || 1;
    power = Math.round(Math.max(0, Math.min(1, (y - powerDrag.rect.top) / h)) * 100);
    updatePowerUI();
  }

  function updatePowerUI() {
    App.el('plPowerFill').style.height = power + '%';
    App.el('plPowerFill').style.background = power >= 80 ? 'linear-gradient(#ff5252,#ff9800)' : 'linear-gradient(#4caf50,#ffd166)';
  }

  function updateHud() {
    var solids = balls.filter(function (b) { return b.group === 'solid' && !b.pocketed; }).length;
    var stripes = balls.filter(function (b) { return b.group === 'stripe' && !b.pocketed; }).length;
    App.el('plTurn').textContent = playerTurn ? '🎯 轮到你' : '🤖 机器人思考中…';
    App.el('plScore').textContent = '🔴' + solids + ' · 🔵' + stripes + ' · ⚫' + (balls.some(function (b) { return b.num === 8 && !b.pocketed; }) ? 1 : 0);
    App.el('plPointsHud').textContent = '🎮 ' + save.points;
  }

  function startTimer() {
    stopTimer = App.countdown(600, 20, {
      onWarn: function () {
        App.el('plTimer').classList.add('warn');
        App.toast('⏰ 时间快到了，还剩 20 秒！');
      },
      onTick: function (left) {
        App.el('plTimer').textContent = left > 20 ? '⏰ ' + App.formatClock(left) : '⏰ 只剩 ' + left + ' 秒';
      },
      onEnd: function () {
        if (over) return;
        over = true;
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
        App.el('plOverTitle').textContent = '⏰ 时间到！';
        App.el('plOverWins').textContent = save.points + ' 积分 · 胜 ' + save.wins + ' 场';
        App.el('plOver').classList.remove('hidden');
      }
    });
  }

  App.el('plAgainBtn').addEventListener('click', function () {
    App.el('plOver').classList.add('hidden');
    startGame();
  });
  App.el('plHomeBtn').addEventListener('click', function () {
    App.el('plGame').classList.add('hidden');
    App.el('plOver').classList.add('hidden');
    App.el('plShop').classList.remove('hidden');
    renderShop();
  });

  App.el('plFastBtn').addEventListener('click', function () {
    fast = !fast;
    App.el('plFastBtn').textContent = fast ? '⚡ 加速中' : '⚡ 加速';
    App.el('plFastBtn').classList.toggle('on', fast);
    App.toast(fast ? '⚡ 机器人加快，球也滚得更快' : '恢复正常速度');
  });

  /* ---------- 绘制 ---------- */
  function draw() {
    var g = ctx;
    var lava = save.table && playerTurn; // 岩浆球桌只在玩家回合显示
    g.fillStyle = lava ? '#241f2e' : '#8a5a2b';
    g.fillRect(0, 0, cw, ch);
    g.fillStyle = lava ? '#3a3145' : '#a9743f';
    g.fillRect(playX0 - 8, playY0 - 8, playW + 16, playH + 16);
    if (lava) {
      var rock = g.createLinearGradient(0, playY0, 0, playY0 + playH);
      rock.addColorStop(0, '#3b3247');
      rock.addColorStop(0.5, '#2c2538');
      rock.addColorStop(1, '#1f1a2b');
      g.fillStyle = rock;
    } else {
      var felt = g.createLinearGradient(0, playY0, 0, playY0 + playH);
      felt.addColorStop(0, '#2e8b57');
      felt.addColorStop(0.5, '#1f7a45');
      felt.addColorStop(1, '#16603a');
      g.fillStyle = felt;
    }
    g.fillRect(playX0, playY0, playW, playH);
    // 岩浆桌的发光裂痕
    if (lava) {
      cracks.forEach(function (pts) {
        g.strokeStyle = '#ff6b2c';
        g.lineWidth = 2.5;
        g.shadowColor = '#ff8c2e';
        g.shadowBlur = 12;
        g.beginPath();
        g.moveTo(pts[0].x, pts[0].y);
        for (var ci = 1; ci < pts.length; ci++) g.lineTo(pts[ci].x, pts[ci].y);
        g.stroke();
        g.shadowBlur = 0;
      });
    }
    pockets.forEach(function (pk) {
      var pg = g.createRadialGradient(pk.x, pk.y, 2, pk.x, pk.y, POCKET_R);
      pg.addColorStop(0, '#0b0b12');
      pg.addColorStop(1, '#20202e');
      g.fillStyle = pg;
      g.beginPath();
      g.arc(pk.x, pk.y, POCKET_R, 0, Math.PI * 2);
      g.fill();
    });
    // 球杆：轮到玩家时显示打台球的棍子
    if (!moving && !over && playerTurn && cueBall && !cueBall.pocketed) {
      var stickLen = Math.min(playW * 0.42, 320);
      var tailX = cueBall.x - aimDir.x * (BALL_R + 8 + stickLen);
      var tailY = cueBall.y - aimDir.y * (BALL_R + 8 + stickLen);
      var tipX = cueBall.x - aimDir.x * (BALL_R + 2);
      var tipY = cueBall.y - aimDir.y * (BALL_R + 2);
      if (cue().level >= MAX_LEVEL) {
        // 金龙至尊球杆：整根球杆就是一条金色神龙
        drawGoldenDragonCue(tipX, tipY, tailX, tailY);
      } else {
        g.strokeStyle = '#5a3a1e';
        g.lineWidth = 11;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(tailX, tailY);
        g.lineTo(tipX, tipY);
        g.stroke();
        g.strokeStyle = '#d9b36a';
        g.lineWidth = 7;
        g.beginPath();
        g.moveTo(tailX, tailY);
        g.lineTo(tipX, tipY);
        g.stroke();
        g.strokeStyle = '#fff8e7';
        g.lineWidth = 5;
        g.beginPath();
        g.moveTo(cueBall.x - aimDir.x * (BALL_R + 2 + 34), cueBall.y - aimDir.y * (BALL_R + 2 + 34));
        g.lineTo(tipX, tipY);
        g.stroke();
        g.lineCap = 'butt';
        // 龙系球杆：杆头是龙
        if (cue().dragon) {
          g.save();
          g.translate(tipX, tipY);
          g.rotate(Math.atan2(aimDir.y, aimDir.x));
          var dc = cue().dragonColor;
          g.fillStyle = dc;
          g.beginPath(); g.arc(0, 0, 7, 0, Math.PI * 2); g.fill();
          g.beginPath(); g.moveTo(6, -2); g.lineTo(13, 0); g.lineTo(6, 2); g.closePath(); g.fill();
          g.beginPath(); g.moveTo(-3, -6); g.lineTo(-7, -13); g.lineTo(0, -8); g.closePath(); g.fill();
          g.beginPath(); g.moveTo(3, -6); g.lineTo(7, -13); g.lineTo(0, -8); g.closePath(); g.fill();
          g.fillStyle = '#fff';
          g.beginPath(); g.arc(-2, 0, 1.5, 0, Math.PI * 2); g.fill();
          g.beginPath(); g.arc(2, 0, 1.5, 0, Math.PI * 2); g.fill();
          g.restore();
        }
      }
    }
    // 瞄准辅助线：白球方向 + 预测被撞球路线（参考台球游戏）
    if (!moving && !over && playerTurn && cueBall && !cueBall.pocketed) {
      var len = aimLen();
      g.strokeStyle = 'rgba(255,255,255,0.8)';
      g.lineWidth = 2.5;
      g.setLineDash([6, 6]);
      g.beginPath();
      g.moveTo(cueBall.x + aimDir.x * (BALL_R + 4), cueBall.y + aimDir.y * (BALL_R + 4));
      g.lineTo(cueBall.x + aimDir.x * (BALL_R + 4 + len), cueBall.y + aimDir.y * (BALL_R + 4 + len));
      g.stroke();
      g.setLineDash([]);
      var hit = raycast();
      if (hit.ball) {
        var hx = cueBall.x + aimDir.x * hit.t, hy = cueBall.y + aimDir.y * hit.t;
        var nx = (hit.ball.x - hx) / (Math.hypot(hit.ball.x - hx, hit.ball.y - hy) || 1);
        var ny = (hit.ball.y - hy) / (Math.hypot(hit.ball.x - hx, hit.ball.y - hy) || 1);
        g.strokeStyle = 'rgba(255,209,102,0.95)';
        g.lineWidth = 3;
        var plen = cue().aim >= 4 ? 320 : cue().aim >= 2 ? 180 : 90;
        g.beginPath();
        g.moveTo(hit.ball.x + nx * (BALL_R + 3), hit.ball.y + ny * (BALL_R + 3));
        g.lineTo(hit.ball.x + nx * (BALL_R + 3 + plen), hit.ball.y + ny * (BALL_R + 3 + plen));
        g.stroke();
        g.strokeStyle = 'rgba(255,255,255,0.95)';
        g.lineWidth = 2;
        g.beginPath();
        g.arc(hit.ball.x, hit.ball.y, BALL_R + 3, 0, Math.PI * 2);
        g.stroke();
      }
    }
    balls.forEach(function (b) {
      if (b.pocketed) return;
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.beginPath();
      g.ellipse(b.x + 2, b.y + 3, b.r, b.r * 0.8, 0, 0, Math.PI * 2);
      g.fill();
      var bg;
      if (lava) {
        bg = g.createRadialGradient(b.x, b.y, b.r * 0.1, b.x, b.y, b.r);
        bg.addColorStop(0, '#ffb066');
        bg.addColorStop(0.45, '#c74e1a');
        bg.addColorStop(1, '#4a1d0d');
      } else {
        bg = g.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.2, b.x, b.y, b.r);
        bg.addColorStop(0, b.color === '#ffffff' ? '#ffffff' : lighten(b.color));
        bg.addColorStop(1, b.color);
      }
      g.fillStyle = bg;
      g.beginPath();
      g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      g.fill();
      if (lava && b.num > 0) {
        // 岩浆球上的裂痕（按球号固定，不闪烁）
        g.save();
        g.beginPath();
        g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        g.clip();
        g.strokeStyle = 'rgba(45,12,4,0.95)';
        g.lineWidth = 1.4;
        var s1 = seeded(b.num), s2 = seeded(b.num + 31);
        var ax = b.x + (s1 - 0.5) * b.r * 1.2, ay = b.y + (s2 - 0.5) * b.r * 1.2;
        for (var ci = 0; ci < 2; ci++) {
          var ang = (s1 * 3.1 + ci * 2.2 + s2) * Math.PI;
          g.beginPath();
          g.moveTo(ax, ay);
          g.lineTo(ax + Math.cos(ang) * b.r * 1.3, ay + Math.sin(ang) * b.r * 1.3);
          g.stroke();
        }
        g.restore();
      }
      if (b.group === 'stripe' && !lava) {
        g.save();
        g.beginPath();
        g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        g.clip();
        g.fillStyle = '#ffffff';
        g.fillRect(b.x - b.r, b.y - b.r * 0.42, b.r * 2, b.r * 0.84);
        g.restore();
      }
      if (b.num > 0) {
        g.fillStyle = lava ? '#ffe0b3' : '#fff';
        g.beginPath();
        g.arc(b.x, b.y, b.r * 0.44, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = lava ? '#5a1d08' : '#222';
        g.font = 'bold ' + Math.floor(b.r * 0.68) + 'px sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(b.num, b.x, b.y + 1);
      }
    });
    // 金龙至尊召唤的龙珠
    dragonBalls.forEach(function (d) {
      var dg2 = g.createRadialGradient(d.x, d.y, 1, d.x, d.y, BALL_R);
      dg2.addColorStop(0, '#fff7d6');
      dg2.addColorStop(0.5, '#ffd166');
      dg2.addColorStop(1, '#c77f1d');
      g.fillStyle = dg2;
      g.shadowColor = '#ffd166';
      g.shadowBlur = 14;
      g.beginPath();
      g.arc(d.x, d.y, BALL_R * 0.85, 0, Math.PI * 2);
      g.fill();
      g.shadowBlur = 0;
    });
  }

  function seeded(n) {
    var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  /* 金龙至尊球杆：整根球杆是一条精致金色神龙 */
  function drawGoldenDragonCue(tipX, tipY, tailX, tailY) {
    var g = ctx;
    var len = Math.hypot(tipX - tailX, tipY - tailY) || 1;
    var ang = Math.atan2(tipY - tailY, tipX - tailX);
    g.save();
    g.translate(tipX, tipY);
    g.rotate(ang);
    // 龙身中心线（局部坐标：x 从 0（龙头）到 -len（龙尾），上下波浪）
    var segs = 44;
    var pts = [];
    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      pts.push({ x: -t * len, y: Math.sin(t * Math.PI * 3) * len * 0.045 * Math.sin(t * Math.PI), t: t });
    }
    function bodyStroke(widths, style) {
      g.strokeStyle = style;
      g.lineCap = 'round';
      for (var j = 0; j < pts.length - 1; j++) {
        g.lineWidth = widths(pts[j].t);
        g.beginPath();
        g.moveTo(pts[j].x, pts[j].y);
        g.lineTo(pts[j + 1].x, pts[j + 1].y);
        g.stroke();
      }
    }
    // 深金描边 → 金色身体（头粗尾细）
    bodyStroke(function (t) { return 7 + (1 - t) * 15; }, 'rgba(110,64,8,0.9)');
    var grad = g.createLinearGradient(0, 0, -len, 0);
    grad.addColorStop(0, '#fff3bd');
    grad.addColorStop(0.25, '#ffd700');
    grad.addColorStop(0.7, '#e6b422');
    grad.addColorStop(1, '#b8860b');
    g.shadowColor = '#ffd700';
    g.shadowBlur = 9;
    bodyStroke(function (t) { return 5 + (1 - t) * 13; }, grad);
    g.shadowBlur = 0;
    // 鳞片：交错两排小弧
    g.strokeStyle = 'rgba(122,72,10,0.55)';
    g.lineWidth = 1.3;
    for (var s = 2; s < pts.length - 1; s += 2) {
      var p = pts[s];
      var rad = 2.6 + p.t * 3;
      g.beginPath(); g.arc(p.x, p.y - rad * 0.5, rad, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
      g.beginPath(); g.arc(p.x - 2, p.y + rad * 0.35, rad * 0.8, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    }
    // 金色背鳍（火焰状）
    g.fillStyle = 'rgba(255,216,96,0.9)';
    for (var f = 3; f < pts.length - 3; f += 3) {
      var fp = pts[f];
      var h = 8 + (1 - fp.t) * 8;
      g.beginPath();
      g.moveTo(fp.x - 2, fp.y - 2);
      g.quadraticCurveTo(fp.x + 2, fp.y - h, fp.x + 6, fp.y - 4);
      g.quadraticCurveTo(fp.x + 3, fp.y - h * 0.55, fp.x + 3, fp.y - 1);
      g.closePath();
      g.fill();
    }
    // 龙爪/腹鳍
    g.strokeStyle = '#e6b422';
    g.lineWidth = 2;
    for (var c = 4; c < pts.length - 2; c += 5) {
      var cp = pts[c];
      g.beginPath(); g.moveTo(cp.x, cp.y + 2); g.quadraticCurveTo(cp.x - 3, cp.y + 9, cp.x - 7, cp.y + 11); g.stroke();
      g.beginPath(); g.moveTo(cp.x + 2, cp.y + 2); g.quadraticCurveTo(cp.x, cp.y + 10, cp.x - 4, cp.y + 13); g.stroke();
    }
    // 龙尾：卷曲 + 火焰
    var tt = pts[pts.length - 1];
    g.strokeStyle = '#e6b422';
    g.lineWidth = 5;
    g.beginPath();
    g.arc(tt.x - 6, tt.y, 11, Math.PI * 0.15, Math.PI * 1.7);
    g.stroke();
    g.fillStyle = '#ff8c2e';
    g.shadowColor = '#ff8c2e';
    g.shadowBlur = 10;
    g.beginPath();
    g.moveTo(tt.x - 20, tt.y - 3);
    g.quadraticCurveTo(tt.x - 30, tt.y, tt.x - 20, tt.y + 3);
    g.quadraticCurveTo(tt.x - 24, tt.y, tt.x - 20, tt.y - 3);
    g.fill();
    g.shadowBlur = 0;
    // 龙头：侧面朝球，精致细节
    g.fillStyle = '#ffd700';
    g.shadowColor = '#ffd700';
    g.shadowBlur = 10;
    g.beginPath(); g.ellipse(8, -2, 9, 8, 0, 0, Math.PI * 2); g.fill();
    g.shadowBlur = 0;
    g.fillStyle = '#ffe98a';
    g.beginPath();
    g.moveTo(4, -6);
    g.quadraticCurveTo(16, -9, 25, -4);
    g.quadraticCurveTo(27, -1, 24, 1);
    g.quadraticCurveTo(14, 4, 5, 1);
    g.closePath();
    g.fill();
    g.fillStyle = '#8a5a12';
    g.beginPath(); g.arc(21, -3, 1.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f5c542';
    g.beginPath();
    g.moveTo(3, 2);
    g.quadraticCurveTo(12, 9, 20, 5);
    g.quadraticCurveTo(15, 11, 5, 8);
    g.closePath();
    g.fill();
    g.strokeStyle = '#7a4a0c';
    g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(8, 1); g.quadraticCurveTo(16, 3, 23, 1); g.stroke();
    // 口中火焰
    g.fillStyle = '#ff6b35';
    g.beginPath();
    g.moveTo(21, 1);
    g.quadraticCurveTo(30, -3, 35, 1);
    g.quadraticCurveTo(30, 5, 23, 3);
    g.closePath();
    g.fill();
    // 眼睛
    g.fillStyle = '#fff';
    g.beginPath(); g.ellipse(9, -4, 3.4, 2.8, -0.25, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#7a1f0c';
    g.beginPath(); g.arc(10, -4, 1.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(9.2, -4.9, 0.7, 0, Math.PI * 2); g.fill();
    // 龙角（分叉）
    g.strokeStyle = '#c99a2e';
    g.lineWidth = 3;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(4, -8); g.quadraticCurveTo(0, -18, -7, -23); g.stroke();
    g.beginPath(); g.moveTo(-1, -16); g.quadraticCurveTo(-6, -21, -12, -20); g.stroke();
    // 耳鳍
    g.fillStyle = '#f5c542';
    g.beginPath();
    g.moveTo(0, -8);
    g.quadraticCurveTo(-6, -15, -12, -10);
    g.quadraticCurveTo(-7, -4, 0, -3);
    g.closePath();
    g.fill();
    // 鬃毛
    g.strokeStyle = 'rgba(255,214,90,0.95)';
    g.lineWidth = 2.4;
    for (var m = 0; m < 4; m++) {
      var my = -7 + m * 3;
      g.beginPath();
      g.moveTo(-4, my);
      g.quadraticCurveTo(-18, my - 5, -30, my + (m % 2 ? -4 : 5));
      g.stroke();
    }
    // 龙须
    g.strokeStyle = 'rgba(255,240,200,0.95)';
    g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(18, -3); g.quadraticCurveTo(28, -11, 35, -13); g.stroke();
    g.beginPath(); g.moveTo(18, 3); g.quadraticCurveTo(30, 9, 39, 6); g.stroke();
    g.restore();
  }

  function lighten(hex) {
    if (hex === '#ffffff') return '#ffffff';
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, (n >> 16) + 90), g2 = Math.min(255, ((n >> 8) & 255) + 90), b = Math.min(255, (n & 255) + 90);
    return 'rgb(' + r + ',' + g2 + ',' + b + ')';
  }

  /* ---------- 测试钩子 ---------- */
  window.__pool = {
    state: function () {
      return {
        level: save.level, aim: cue().aim, points: save.points, wins: save.wins, table: save.table,
        balls: balls ? balls.filter(function (b) { return !b.pocketed; }).length : 0,
        cueX: cueBall ? cueBall.x : -1, cueY: cueBall ? cueBall.y : -1,
        dragonBalls: dragonBalls ? dragonBalls.length : 0,
        moving: moving, power: power, playerTurn: playerTurn, winner: winner, over: over, fast: fast
      };
    },
    setFast: function (v) { fast = !!v; App.el('plFastBtn').textContent = fast ? '⚡ 加速中' : '⚡ 加速'; App.el('plFastBtn').classList.toggle('on', fast); return fast; },
    upgradeCue: upgradeCue,
    buyTable: buyTable,
    invest: investPoints,
    setPoints: function (n) { save.points = n; saveNow(); renderShop(); return save.points; },
    setLevel: function (n) { save.level = Math.max(0, Math.min(MAX_LEVEL, n)); saveNow(); renderShop(); return save.level; },
    start: startGame,
    aim: function (x, y) {
      var d = Math.hypot(x, y) || 1;
      aimDir = { x: x / d, y: y / d };
      return true;
    },
    setPower: function (p) { power = Math.max(0, Math.min(100, p)); updatePowerUI(); return power; },
    shoot: fireShot,
    robotShoot: robotTurn,
    simulateRobotPot: function () {
      if (playerTurn || over) return false;
      var target = balls.find(function (b) { return !b.pocketed && b.type === 'target' && b.num !== 8; });
      if (!target) return false;
      target.pocketed = true;
      pottedThisShot.push(target);
      scratchThisShot = false;
      evaluateShot();
      return true;
    },
    sinkBall: function (num) {
      var b = balls.find(function (x) { return x.num === num && !x.pocketed; });
      if (!b) return false;
      b.pocketed = true;
      return true;
    },
    forceWin: function () { declareWin('player'); return save.points; },
    forceTimeUp: function () {
      if (over) return;
      over = true;
      running = false;
      if (stopTimer) stopTimer();
      if (rafId) cancelAnimationFrame(rafId);
      App.el('plOverTitle').textContent = '⏰ 时间到！';
      App.el('plOverWins').textContent = save.points + ' 积分 · 胜 ' + save.wins + ' 场';
      App.el('plOver').classList.remove('hidden');
    }
  };

  renderShop();
})();
