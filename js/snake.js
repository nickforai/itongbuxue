/* 贪吃蛇：滑动/方向键控制，吃苹果长长长，5 星星换 1 次机会 */
(function () {
  'use strict';

  var data = App.store.load();
  var SN_SAVE = 'xx3_snake_v1';
  var best = 0;
  try { best = JSON.parse(localStorage.getItem(SN_SAVE) || '{}').best || 0; } catch (e) { /* ignore */ }
  function saveNow() {
    try { localStorage.setItem(SN_SAVE, JSON.stringify({ best: best })); } catch (e) { /* ignore */ }
  }

  var COLS = 20, ROWS = 20;
  var canvas, ctx, cell;
  var snake, dir, nextDir, food;
  var score = 0, running = false, over = false, timeUp = false;
  var tickMs = 170, tickAcc = 0, lastTs = 0;
  var stopTimer = null, rafId = null;

  /* ---------- 大厅 ---------- */
  function renderLobby() {
    data = App.store.load();
    App.el('snJifenPill').textContent = '⭐ ' + (data.balance || 0);
    App.el('snChancePill').textContent = '🐍 ' + (data.snakeChances || 0);
    App.el('snJifen').textContent = data.balance || 0;
    App.el('snChances').textContent = data.snakeChances || 0;
    App.el('snBest').textContent = best;
    App.el('snRedeemBtn').disabled = (data.balance || 0) < 5;
    App.el('snRedeemBtn').textContent = (data.balance || 0) >= 5
      ? '🔄 兑换 1 次机会（-5 星星）'
      : '🔄 星星不够 5 颗，先去学习赚星星吧';
    App.el('snStartBtn').disabled = (data.snakeChances || 0) < 1;
    App.el('snStartBtn').textContent = (data.snakeChances || 0) >= 1
      ? '🐍 开始游戏（还有 ' + data.snakeChances + ' 次机会）'
      : '🐍 开始游戏（需要机会）';
  }

  App.el('snRedeemBtn').addEventListener('click', function () {
    data = App.store.load();
    if (App.redeemSnakeChance(data)) {
      App.logActivity(data, '兑换贪吃蛇机会');
      App.toast('兑换成功，+1 次机会！');
      renderLobby();
    } else {
      App.toast('星星还不够 5 颗哦');
    }
  });

  App.el('snStartBtn').addEventListener('click', function () {
    data = App.store.load();
    if (!App.useSnakeChance(data)) { App.toast('没有游戏机会啦'); return; }
    renderLobby();
    startGame();
  });

  /* ---------- 对局 ---------- */
  function startGame() {
    canvas = App.el('snCanvas');
    ctx = canvas.getContext('2d');
    var rect = canvas.parentElement.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    cell = Math.floor(Math.min(rect.width / COLS, rect.height / ROWS));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    tickMs = 170;
    tickAcc = 0;
    running = true;
    over = false;
    timeUp = false;
    placeFood();
    App.el('snLobby').classList.add('hidden');
    App.el('snOver').classList.add('hidden');
    App.el('snGame').classList.remove('hidden');
    updateHud();
    startTimer();
    if (rafId) cancelAnimationFrame(rafId);
    lastTs = performance.now();
    loop(lastTs);
  }

  function placeFood() {
    var tries = 0;
    do {
      food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
      tries++;
    } while (tries < 200 && snake.some(function (s) { return s.x === food.x && s.y === food.y; }));
  }

  function step() {
    dir = nextDir;
    var head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) { endGame(false); return; }
    if (snake.some(function (s) { return s.x === head.x && s.y === head.y; })) { endGame(false); return; }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score++;
      placeFood();
      tickMs = Math.max(90, 170 - Math.floor(score / 5) * 8); // 越吃越快
    } else {
      snake.pop();
    }
    updateHud();
  }

  function loop(ts) {
    if (!running) return;
    rafId = requestAnimationFrame(loop);
    var dt = Math.min((ts - lastTs) / 1000, 0.1);
    lastTs = ts;
    tickAcc += dt * 1000;
    while (tickAcc >= tickMs) {
      tickAcc -= tickMs;
      step();
      if (over) break;
    }
    draw();
  }

  function setDir(d) {
    if (!running || over) return;
    if ((d.x === -dir.x && d.y === -dir.y) || (d.x === dir.x && d.y === dir.y)) return;
    nextDir = d;
  }

  /* 方向控制：键盘 + 触摸滑动 + 方向键 */
  window.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    if (k === 'arrowup' || k === 'w') setDir({ x: 0, y: -1 });
    else if (k === 'arrowdown' || k === 's') setDir({ x: 0, y: 1 });
    else if (k === 'arrowleft' || k === 'a') setDir({ x: -1, y: 0 });
    else if (k === 'arrowright' || k === 'd') setDir({ x: 1, y: 0 });
  });

  var swX = 0, swY = 0, swId = null;
  var snCanvasEl = App.el('snCanvas');
  snCanvasEl.addEventListener('pointerdown', function (e) {
    swX = e.clientX; swY = e.clientY; swId = e.pointerId;
    snCanvasEl.setPointerCapture(e.pointerId);
  });
  snCanvasEl.addEventListener('pointerup', function (e) {
    if (swId !== e.pointerId) return;
    var dx = e.clientX - swX, dy = e.clientY - swY;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) setDir({ x: dx > 0 ? 1 : -1, y: 0 });
    else setDir({ x: 0, y: dy > 0 ? 1 : -1 });
  });

  App.el('snUp').addEventListener('pointerdown', function () { setDir({ x: 0, y: -1 }); });
  App.el('snDown').addEventListener('pointerdown', function () { setDir({ x: 0, y: 1 }); });
  App.el('snLeft').addEventListener('pointerdown', function () { setDir({ x: -1, y: 0 }); });
  App.el('snRight').addEventListener('pointerdown', function () { setDir({ x: 1, y: 0 }); });

  /* ---------- 绘制 ---------- */
  function draw() {
    var g = ctx;
    g.fillStyle = '#101a2e';
    g.fillRect(0, 0, canvas.width, canvas.height);
    // 网格
    g.strokeStyle = 'rgba(120,150,220,0.12)';
    g.lineWidth = 1;
    for (var i = 0; i <= COLS; i++) {
      g.beginPath(); g.moveTo(i * cell, 0); g.lineTo(i * cell, ROWS * cell); g.stroke();
    }
    for (var j = 0; j <= ROWS; j++) {
      g.beginPath(); g.moveTo(0, j * cell); g.lineTo(COLS * cell, j * cell); g.stroke();
    }
    // 食物（红苹果）
    var fx = food.x * cell + cell / 2, fy = food.y * cell + cell / 2;
    g.fillStyle = '#ff5252';
    g.shadowColor = '#ff5252';
    g.shadowBlur = 10;
    g.beginPath();
    g.arc(fx, fy, cell * 0.34, 0, Math.PI * 2);
    g.fill();
    g.shadowBlur = 0;
    g.strokeStyle = '#7a3b10';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(fx, fy - cell * 0.3);
    g.lineTo(fx + cell * 0.05, fy - cell * 0.48);
    g.stroke();
    // 蛇
    for (var s = snake.length - 1; s >= 0; s--) {
      var px = snake[s].x * cell, py = snake[s].y * cell;
      var grad = g.createLinearGradient(px, py, px + cell, py + cell);
      if (s === 0) {
        grad.addColorStop(0, '#7dff8a');
        grad.addColorStop(1, '#22c55e');
      } else {
        grad.addColorStop(0, '#4ade80');
        grad.addColorStop(1, '#15803d');
      }
      g.fillStyle = grad;
      g.fillRect(px + 1, py + 1, cell - 2, cell - 2);
      if (s === 0) {
        // 蛇头眼睛
        g.fillStyle = '#fff';
        var ex = px + cell * 0.28, ey = py + cell * 0.28;
        if (dir.x < 0) ex = px + cell * 0.72;
        if (dir.y < 0) ey = py + cell * 0.72;
        g.beginPath(); g.arc(ex, ey, cell * 0.09, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.arc(ex + cell * 0.24, ey, cell * 0.09, 0, Math.PI * 2); g.fill();
      }
    }
  }

  function updateHud() {
    App.el('snScore').textContent = '🍎 ' + score;
    App.el('snLen').textContent = '🐍 ' + snake.length;
  }

  /* ---------- 限时：每局 10 分钟，最后 20 秒提醒 ---------- */
  function startTimer() {
    stopTimer = App.countdown(600, 20, {
      onWarn: function () {
        App.el('snTimer').classList.add('warn');
        App.toast('⏰ 时间快到了，还剩 20 秒！');
      },
      onTick: function (left) {
        App.el('snTimer').textContent = left > 20 ? '⏰ ' + App.formatClock(left) : '⏰ 只剩 ' + left + ' 秒';
      },
      onEnd: function () {
        timeUp = true;
        endGame(true);
      }
    });
  }

  function endGame(byTime) {
    if (over) return;
    over = true;
    running = false;
    if (stopTimer) stopTimer();
    if (rafId) cancelAnimationFrame(rafId);
    if (score > best) { best = score; saveNow(); }
    App.el('snOverTitle').textContent = byTime ? '⏰ 时间到！' : '🐍 游戏结束';
    App.el('snOverScore').textContent = score;
    App.el('snOverBest').textContent = best;
    var again = App.el('snAgainBtn');
    data = App.store.load();
    if ((data.snakeChances || 0) >= 1) {
      again.textContent = '🔄 再来一局（还剩 ' + data.snakeChances + ' 次机会）';
      again.disabled = false;
    } else {
      again.textContent = '⭐ 星星不够了，先回大厅兑换';
      again.disabled = true;
    }
    App.el('snOver').classList.remove('hidden');
    App.logActivity(data, '贪吃蛇 吃到' + score + ' 个苹果');
  }

  App.el('snAgainBtn').addEventListener('click', function () {
    data = App.store.load();
    if (!App.useSnakeChance(data)) { App.toast('没有机会啦'); renderLobby(); return; }
    App.el('snOver').classList.add('hidden');
    startGame();
  });

  App.el('snHomeBtn').addEventListener('click', function () {
    App.el('snGame').classList.add('hidden');
    App.el('snOver').classList.add('hidden');
    App.el('snLobby').classList.remove('hidden');
    renderLobby();
  });

  /* ---------- 测试钩子 ---------- */
  window.__snake = {
    state: function () {
      return {
        score: score, len: snake ? snake.length : 0, running: running, over: over,
        x: snake ? snake[0].x : -1, y: snake ? snake[0].y : -1, best: best,
        food: food ? { x: food.x, y: food.y } : null
      };
    },
    start: startGame,
    setDir: setDir,
    forceStep: function () {
      if (!running || over) return false;
      step();
      return true;
    },
    spawnFoodAt: function (x, y) {
      food = { x: x, y: y };
      return true;
    },
    forceTimeUp: function () { timeUp = true; endGame(true); }
  };

  renderLobby();
})();
