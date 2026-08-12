/* 台球（8球）：15颗球+白球，机器人对手，赢一局+1000游戏积分，积分买球杆，好杆命中率更高 */
(function () {
  'use strict';

  var PL_SAVE = 'xx3_pool_v1';
  var save = { owned: [], equipped: null, points: 1000, wins: 0 };
  try {
    var raw = JSON.parse(localStorage.getItem(PL_SAVE) || '{}');
    for (var k in save) if (raw[k] !== undefined) save[k] = raw[k];
  } catch (e) { /* ignore */ }
  function saveNow() {
    try { localStorage.setItem(PL_SAVE, JSON.stringify(save)); } catch (e) { /* ignore */ }
  }

  /* 球杆：越贵命中率越高（瞄准横杠越长、出杆越准） */
  var CUES = [
    { id: 'wood', name: '木质球杆', emoji: '🪵', cost: 1000, aim: 1, acc: 0.030, desc: '短横杠 · 命中率一般' },
    { id: 'alu', name: '铝合金球杆', emoji: '🔩', cost: 3000, aim: 2, acc: 0.022, desc: '中横杠 · 命中率较好' },
    { id: 'carbon', name: '碳素球杆', emoji: '⚙️', cost: 5000, aim: 3, acc: 0.014, desc: '长横杠 · 命中率高' },
    { id: 'gold', name: '金龙球杆', emoji: '🐉', cost: 10000, aim: 4, acc: 0.005, desc: '超长横杠 · 命中率极高' }
  ];
  function cue() { return CUES.find(function (c) { return c.id === save.equipped; }) || CUES[0]; }
  function aimLen() { return [0, 90, 170, 260, 380][cue().aim] || 90; }

  /* ---------- 商店（游戏积分买球杆） ---------- */
  function renderShop() {
    App.el('plJifenPill').textContent = '🎮 ' + save.points;
    App.el('plJifen').textContent = save.points;
    App.el('plWins').textContent = save.wins;
    var box = App.el('plCueList');
    box.innerHTML = '';
    CUES.forEach(function (c) {
      var owned = save.owned.indexOf(c.id) !== -1;
      var row = document.createElement('div');
      row.className = 'pl-cue-row' + (save.equipped === c.id ? ' on' : '');
      row.innerHTML =
        '<span class="pl-cue-emoji">' + c.emoji + '</span>' +
        '<div class="pl-cue-info"><div>' + c.name + ' <span class="pl-aim">横杠' + c.aim + '</span></div>' +
        '<div class="pl-cue-desc">' + c.desc + '</div></div>' +
        (owned
          ? '<button class="btn pl-cue-btn" data-equip="' + c.id + '">' + (save.equipped === c.id ? '使用中' : '装备') + '</button>'
          : '<button class="btn btn-gold pl-cue-btn" data-buy="' + c.id + '">' + c.cost + ' 积分</button>');
      box.appendChild(row);
    });
    box.querySelectorAll('[data-buy]').forEach(function (b) {
      b.addEventListener('click', function () { buyCue(b.getAttribute('data-buy')); });
    });
    box.querySelectorAll('[data-equip]').forEach(function (b) {
      b.addEventListener('click', function () { equipCue(b.getAttribute('data-equip')); });
    });
    var play = App.el('plPlayBtn');
    play.disabled = save.owned.length === 0;
    play.textContent = save.owned.length ? '🎱 开始打台球（' + cue().name + '）' : '🎱 开始打台球（先用积分买一根球杆）';
  }

  function buyCue(id) {
    var c = CUES.find(function (x) { return x.id === id; });
    if (!c || save.owned.indexOf(id) !== -1) return false;
    if (save.points < c.cost) { App.toast('游戏积分不够 ' + c.cost + '，打赢一局 +1000 积分'); return false; }
    save.points -= c.cost;
    save.owned.push(id);
    if (!save.equipped) save.equipped = id;
    saveNow();
    renderShop();
    App.toast('✅ 买到了 ' + c.name + '！');
    return true;
  }

  function equipCue(id) {
    if (save.owned.indexOf(id) === -1) return false;
    save.equipped = id;
    saveNow();
    renderShop();
    App.toast('🎱 使用 ' + CUES.find(function (c) { return c.id === id; }).name);
    return true;
  }

  App.el('plPlayBtn').addEventListener('click', function () {
    if (save.owned.length === 0) { App.toast('先用积分买一根球杆吧'); return; }
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
    var dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    if (moving) {
      var any = false;
      for (var s = 0; s < 2; s++) if (stepPhysics(dt)) any = true;
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
      // 进了自己的球，继续打
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
      robotTimer = setTimeout(robotTurn, 900);
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
    power = 0;
    updatePowerUI();
    pottedThisShot = [];
    scratchThisShot = false;
    moving = true;
    return true;
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

  /* ---------- 绘制 ---------- */
  function draw() {
    var g = ctx;
    g.fillStyle = '#8a5a2b';
    g.fillRect(0, 0, cw, ch);
    g.fillStyle = '#a9743f';
    g.fillRect(playX0 - 8, playY0 - 8, playW + 16, playH + 16);
    var felt = g.createLinearGradient(0, playY0, 0, playY0 + playH);
    felt.addColorStop(0, '#2e8b57');
    felt.addColorStop(0.5, '#1f7a45');
    felt.addColorStop(1, '#16603a');
    g.fillStyle = felt;
    g.fillRect(playX0, playY0, playW, playH);
    pockets.forEach(function (pk) {
      var pg = g.createRadialGradient(pk.x, pk.y, 2, pk.x, pk.y, POCKET_R);
      pg.addColorStop(0, '#0b0b12');
      pg.addColorStop(1, '#20202e');
      g.fillStyle = pg;
      g.beginPath();
      g.arc(pk.x, pk.y, POCKET_R, 0, Math.PI * 2);
      g.fill();
    });
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
      var bg = g.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.2, b.x, b.y, b.r);
      bg.addColorStop(0, b.color === '#ffffff' ? '#ffffff' : lighten(b.color));
      bg.addColorStop(1, b.color);
      g.fillStyle = bg;
      g.beginPath();
      g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      g.fill();
      if (b.group === 'stripe') {
        g.save();
        g.beginPath();
        g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        g.clip();
        g.fillStyle = '#ffffff';
        g.fillRect(b.x - b.r, b.y - b.r * 0.42, b.r * 2, b.r * 0.84);
        g.restore();
      }
      if (b.num > 0) {
        g.fillStyle = '#fff';
        g.beginPath();
        g.arc(b.x, b.y, b.r * 0.44, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#222';
        g.font = 'bold ' + Math.floor(b.r * 0.68) + 'px sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(b.num, b.x, b.y + 1);
      }
    });
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
        owned: save.owned.slice(), equipped: save.equipped, aim: cue().aim, points: save.points, wins: save.wins,
        balls: balls ? balls.filter(function (b) { return !b.pocketed; }).length : 0,
        cueX: cueBall ? cueBall.x : -1, cueY: cueBall ? cueBall.y : -1,
        moving: moving, power: power, playerTurn: playerTurn, winner: winner, over: over
      };
    },
    buyCue: buyCue,
    equipCue: equipCue,
    setPoints: function (n) { save.points = n; saveNow(); renderShop(); return save.points; },
    start: startGame,
    aim: function (x, y) {
      var d = Math.hypot(x, y) || 1;
      aimDir = { x: x / d, y: y / d };
      return true;
    },
    setPower: function (p) { power = Math.max(0, Math.min(100, p)); updatePowerUI(); return power; },
    shoot: fireShot,
    robotShoot: robotTurn,
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
