/* 台球：买球杆（星星）→ 拖动瞄准 → 下拉力度条发射，好的球杆瞄准横杠更长还能预测进球路线 */
(function () {
  'use strict';

  var PL_SAVE = 'xx3_pool_v1';
  var save = { owned: [], equipped: null, wins: 0 };
  try {
    var raw = JSON.parse(localStorage.getItem(PL_SAVE) || '{}');
    for (var k in save) if (raw[k] !== undefined) save[k] = raw[k];
  } catch (e) { /* ignore */ }
  function saveNow() {
    try { localStorage.setItem(PL_SAVE, JSON.stringify(save)); } catch (e) { /* ignore */ }
  }

  var CUES = [
    { id: 'wood', name: '木质球杆', emoji: '🪵', cost: 5, aim: 1, desc: '短横杠瞄准' },
    { id: 'alu', name: '铝合金球杆', emoji: '🔩', cost: 15, aim: 2, desc: '中横杠瞄准' },
    { id: 'carbon', name: '碳素球杆', emoji: '⚙️', cost: 30, aim: 3, desc: '长横杠 + 预测进球路线' },
    { id: 'gold', name: '金龙球杆', emoji: '🐉', cost: 50, aim: 4, desc: '超长横杠 + 清晰进球路线' }
  ];
  function cue() { return CUES.find(function (c) { return c.id === save.equipped; }) || CUES[0]; }
  function aimLen() { return [0, 70, 140, 240, 360][cue().aim] || 70; }

  /* ---------- 商店 ---------- */
  function renderShop() {
    var data = App.store.load();
    App.el('plJifenPill').textContent = '⭐ ' + (data.balance || 0);
    App.el('plJifen').textContent = data.balance || 0;
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
          : '<button class="btn btn-gold pl-cue-btn" data-buy="' + c.id + '">' + c.cost + ' 星</button>');
      box.appendChild(row);
    });
    box.querySelectorAll('[data-buy]').forEach(function (b) {
      b.addEventListener('click', function () {
        buyCue(b.getAttribute('data-buy'));
      });
    });
    box.querySelectorAll('[data-equip]').forEach(function (b) {
      b.addEventListener('click', function () {
        equipCue(b.getAttribute('data-equip'));
      });
    });
    var play = App.el('plPlayBtn');
    play.disabled = save.owned.length === 0;
    play.textContent = save.owned.length ? '🎱 开始打台球（' + cue().name + '）' : '🎱 开始打台球（先买一根球杆）';
  }

  function buyCue(id) {
    var c = CUES.find(function (x) { return x.id === id; });
    if (!c || save.owned.indexOf(id) !== -1) return false;
    var data = App.store.load();
    if ((data.balance || 0) < c.cost) { App.toast('星星不够 ' + c.cost + ' 颗，先去做题吧'); return false; }
    data.balance -= c.cost;
    App.store.save(data);
    save.owned.push(id);
    if (!save.equipped) save.equipped = id;
    saveNow();
    App.logActivity(data, '买了' + c.name);
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
    if (save.owned.length === 0) { App.toast('先买一根球杆吧'); return; }
    startGame();
  });

  /* ---------- 对局 ---------- */
  var canvas, ctx, cw, ch, dpr;
  var BALL_R = 13, BORDER = 24, POCKET_R = 18;
  var playX0, playY0, playW, playH, pockets = [];
  var balls = [], cueBall = null;
  var aimDir = { x: 1, y: 0 };
  var power = 0, moving = false, sunk = 0, totalTargets = 6;
  var over = false, running = false, stopTimer = null, rafId = null, lastTs = 0;
  var dragAim = null;

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
    sunk = 0; moving = false; power = 0; over = false;
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
    var colors = ['#f44336', '#ff9800', '#4caf50', '#2196f3', '#9c27b0', '#e91e63'];
    var apexX = playX0 + playW * 0.72, apexY = playY0 + playH / 2;
    var n = 0;
    for (var row = 0; row < 3; row++) {
      for (var j = 0; j <= row; j++) {
        n++;
        balls.push({
          x: apexX + row * (BALL_R * 2 + 1),
          y: apexY + (j - row / 2) * (BALL_R * 2 + 1),
          vx: 0, vy: 0, r: BALL_R, color: colors[n - 1], num: n,
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
      for (var s = 0; s < 2; s++) {
        if (stepPhysics(dt)) any = true;
      }
      if (!any) moving = false;
    }
    draw();
  }

  function stepPhysics(dt) {
    var moved = false;
    balls.forEach(function (b) {
      if (b.pocketed) return;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      var f = 1 - 1.8 * dt;
      b.vx *= Math.max(0, f);
      b.vy *= Math.max(0, f);
      if (Math.abs(b.vx) < 3) b.vx = 0;
      if (Math.abs(b.vy) < 3) b.vy = 0;
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
            App.toast('💥 白球掉袋啦，放回开球位');
            b.x = playX0 + playW * 0.2;
            b.y = playY0 + playH / 2;
            b.pocketed = false;
          } else {
            sunk++;
            updateHud();
            if (sunk >= totalTargets) win();
          }
        }
      });
    });
    return moved;
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

  function shoot() {
    if (moving || over || power < 3) return false;
    cueBall.vx = aimDir.x * power * 8;
    cueBall.vy = aimDir.y * power * 8;
    power = 0;
    updatePowerUI();
    moving = true;
    return true;
  }

  /* 桌面上拖动瞄准 */
  var plCanvasEl = App.el('plCanvas');
  plCanvasEl.addEventListener('pointerdown', function (e) {
    if (moving || over) return;
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

  /* 力度条：往下拉蓄力，松开发射；拉到 0 不能发射 */
  var powerEl = App.el('plPower');
  var powerDrag = null;
  powerEl.addEventListener('pointerdown', function (e) {
    if (moving || over) return;
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
        shoot();
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
    App.el('plScore').textContent = '🎱 进球 ' + sunk + '/' + totalTargets;
  }

  function win() {
    if (over) return;
    over = true;
    running = false;
    if (stopTimer) stopTimer();
    if (rafId) cancelAnimationFrame(rafId);
    save.wins += 1;
    saveNow();
    App.el('plOverTitle').textContent = '🎉 全清台！';
    App.el('plOverWins').textContent = save.wins;
    App.el('plOver').classList.remove('hidden');
    App.logActivity(App.store.load(), '台球清台，共' + save.wins + '次');
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
        App.el('plOverWins').textContent = save.wins;
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

  /* ---------- 绘制（清晰好看） ---------- */
  function draw() {
    var g = ctx;
    // 木边框
    g.fillStyle = '#8a5a2b';
    g.fillRect(0, 0, cw, ch);
    g.fillStyle = '#a9743f';
    g.fillRect(playX0 - 8, playY0 - 8, playW + 16, playH + 16);
    // 绿呢
    var felt = g.createLinearGradient(0, playY0, 0, playY0 + playH);
    felt.addColorStop(0, '#2e8b57');
    felt.addColorStop(0.5, '#1f7a45');
    felt.addColorStop(1, '#16603a');
    g.fillStyle = felt;
    g.fillRect(playX0, playY0, playW, playH);
    // 袋口
    pockets.forEach(function (pk) {
      var pg = g.createRadialGradient(pk.x, pk.y, 2, pk.x, pk.y, POCKET_R);
      pg.addColorStop(0, '#0b0b12');
      pg.addColorStop(1, '#20202e');
      g.fillStyle = pg;
      g.beginPath();
      g.arc(pk.x, pk.y, POCKET_R, 0, Math.PI * 2);
      g.fill();
    });
    // 瞄准线（横杠）：球杆越好越长；好的球杆预测被撞球的路线
    if (!moving && !over && cueBall && !cueBall.pocketed) {
      var len = aimLen();
      g.strokeStyle = 'rgba(255,255,255,0.75)';
      g.lineWidth = 2.5;
      g.setLineDash([6, 6]);
      g.beginPath();
      g.moveTo(cueBall.x + aimDir.x * (BALL_R + 4), cueBall.y + aimDir.y * (BALL_R + 4));
      g.lineTo(cueBall.x + aimDir.x * (BALL_R + 4 + len), cueBall.y + aimDir.y * (BALL_R + 4 + len));
      g.stroke();
      g.setLineDash([]);
      if (cue().aim >= 3) {
        var hit = raycast();
        if (hit.ball) {
          var hx = cueBall.x + aimDir.x * hit.t, hy = cueBall.y + aimDir.y * hit.t;
          var nx = (hit.ball.x - hx) / (Math.hypot(hit.ball.x - hx, hit.ball.y - hy) || 1);
          var ny = (hit.ball.y - hy) / (Math.hypot(hit.ball.x - hx, hit.ball.y - hy) || 1);
          g.strokeStyle = 'rgba(255,209,102,0.95)';
          g.lineWidth = 3;
          var plen = cue().aim >= 4 ? 300 : 150;
          g.beginPath();
          g.moveTo(hit.ball.x + nx * (BALL_R + 3), hit.ball.y + ny * (BALL_R + 3));
          g.lineTo(hit.ball.x + nx * (BALL_R + 3 + plen), hit.ball.y + ny * (BALL_R + 3 + plen));
          g.stroke();
          // 高亮目标球
          g.strokeStyle = 'rgba(255,255,255,0.9)';
          g.lineWidth = 2;
          g.beginPath();
          g.arc(hit.ball.x, hit.ball.y, BALL_R + 3, 0, Math.PI * 2);
          g.stroke();
        }
      }
    }
    // 球
    balls.forEach(function (b) {
      if (b.pocketed) return;
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.beginPath();
      g.ellipse(b.x + 2, b.y + 3, b.r, b.r * 0.8, 0, 0, Math.PI * 2);
      g.fill();
      var bg = g.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.2, b.x, b.y, b.r);
      bg.addColorStop(0, lighten(b.color));
      bg.addColorStop(1, b.color);
      g.fillStyle = bg;
      g.beginPath();
      g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      g.fill();
      if (b.type === 'target') {
        g.fillStyle = '#fff';
        g.beginPath();
        g.arc(b.x, b.y, b.r * 0.48, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#222';
        g.font = 'bold ' + Math.floor(b.r * 0.72) + 'px sans-serif';
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
        owned: save.owned.slice(), equipped: save.equipped, aim: cue().aim, wins: save.wins,
        balls: balls ? balls.filter(function (b) { return !b.pocketed; }).length : 0,
        cueX: cueBall ? cueBall.x : -1, cueY: cueBall ? cueBall.y : -1,
        moving: moving, power: power, sunk: sunk, over: over
      };
    },
    buyCue: buyCue,
    equipCue: equipCue,
    start: startGame,
    aim: function (x, y) {
      var d = Math.hypot(x, y) || 1;
      aimDir = { x: x / d, y: y / d };
      return true;
    },
    setPower: function (p) { power = Math.max(0, Math.min(100, p)); updatePowerUI(); return power; },
    shoot: shoot,
    sinkAll: function () {
      balls.forEach(function (b) {
        if (b.type === 'target' && !b.pocketed) {
          b.pocketed = true;
          sunk++;
        }
      });
      updateHud();
      win();
      return sunk;
    },
    forceTimeUp: function () {
      if (over) return;
      over = true;
      running = false;
      if (stopTimer) stopTimer();
      if (rafId) cancelAnimationFrame(rafId);
      App.el('plOverTitle').textContent = '⏰ 时间到！';
      App.el('plOverWins').textContent = save.wins;
      App.el('plOver').classList.remove('hidden');
    }
  };

  renderShop();
})();
