/* 贪吃蛇：滑动/方向键控制，苹果/披萨/汉堡/炸鸡桶，10 个机器人陪你玩，5 星星换 1 次机会 */
(function () {
  'use strict';

  var data = App.store.load();
  var SN_SAVE = 'xx3_snake_v1';
  var best = 0;
  try { best = JSON.parse(localStorage.getItem(SN_SAVE) || '{}').best || 0; } catch (e) { /* ignore */ }
  function saveNow() {
    try { localStorage.setItem(SN_SAVE, JSON.stringify({ best: best })); } catch (e) { /* ignore */ }
  }

  var COLS = 24, ROWS = 24;
  var canvas, ctx, cell;
  var snake, dir, nextDir, foods, robots;
  var score = 0, running = false, over = false, timeUp = false;
  var tickMs = 170, tickAcc = 0, lastTs = 0;
  var stopTimer = null, rafId = null;

  /* ---------- 食物：苹果最低，披萨=苹果2倍，汉堡=披萨的量，炸鸡桶=汉堡20倍 ---------- */
  var FOOD_TYPES = {
    apple: { name: '苹果', emoji: '🍎', value: 1, w: 62 },
    pizza: { name: '披萨', emoji: '🍕', value: 2, w: 26 },
    burger: { name: '汉堡', emoji: '🍔', value: 2, w: 11 },
    bucket: { name: '炸鸡桶', emoji: '🍗', value: 40, w: 1 }
  };
  var FOOD_ORDER = ['apple', 'pizza', 'burger', 'bucket'];
  var TARGET_FOODS = 4;
  var TARGET_ROBOTS = 10;
  var ROBOT_COLORS = ['#ff9ff3', '#feca57', '#48dbfb', '#ff6b6b', '#a29bfe', '#1dd1a1', '#fd79a8', '#fdcb6e', '#74b9ff', '#e17055'];

  function pickFoodType() {
    var r = Math.random() * 100;
    if (r < 62) return 'apple';
    if (r < 88) return 'pizza';
    if (r < 99) return 'burger';
    return 'bucket';
  }

  function emptyCells() {
    var taken = {};
    [snake].concat(robots).forEach(function (s) {
      (s.body || []).forEach(function (p) { taken[p.x + ',' + p.y] = true; });
    });
    foods.forEach(function (f) { taken[f.x + ',' + f.y] = true; });
    var cells = [];
    for (var x = 0; x < COLS; x++) {
      for (var y = 0; y < ROWS; y++) if (!taken[x + ',' + y]) cells.push({ x: x, y: y });
    }
    return cells;
  }

  function spawnFood(type) {
    var cells = emptyCells();
    if (!cells.length) return;
    var c = cells[Math.floor(Math.random() * cells.length)];
    foods.push({ x: c.x, y: c.y, type: type || pickFoodType() });
  }

  function ensureFoods() {
    while (foods.length < TARGET_FOODS) spawnFood();
  }

  function eatFoodAt(x, y) {
    for (var i = 0; i < foods.length; i++) {
      if (foods[i].x === x && foods[i].y === y) {
        var f = foods[i];
        foods.splice(i, 1);
        ensureFoods();
        return f;
      }
    }
    return null;
  }

  /* ---------- 机器人蛇 ---------- */
  function makeRobot() {
    var body = [];
    var tries = 0;
    var dx = 0, dy = 0;
    function bodyOk(b) {
      for (var i = 0; i < b.length; i++) {
        if (b[i].x < 0 || b[i].x >= COLS || b[i].y < 0 || b[i].y >= ROWS) return false;
        if (occupied(b[i].x, b[i].y)) return false;
      }
      return true;
    }
    do {
      var edge = Math.floor(Math.random() * 4);
      var x, y;
      if (edge === 0) { x = 0; y = 2 + Math.floor(Math.random() * (ROWS - 4)); dx = 1; dy = 0; }
      else if (edge === 1) { x = COLS - 1; y = 2 + Math.floor(Math.random() * (ROWS - 4)); dx = -1; dy = 0; }
      else if (edge === 2) { x = 2 + Math.floor(Math.random() * (COLS - 4)); y = 0; dx = 0; dy = 1; }
      else { x = 2 + Math.floor(Math.random() * (COLS - 4)); y = ROWS - 1; dx = 0; dy = -1; }
      body = [];
      for (var i = 0; i < 3; i++) body.push({ x: x + dx * i, y: y + dy * i });
      tries++;
    } while (tries < 200 && !bodyOk(body));
    return { body: body, dir: { x: dx, y: dy }, color: ROBOT_COLORS[Math.floor(Math.random() * ROBOT_COLORS.length)], respawnAt: 0 };
  }

  /* 是否被任何蛇身占据（忽略每条蛇的尾巴，因为尾巴每步会移走） */
  function occupied(nx, ny) {
    var snakes = [snake].concat(robots.map(function (r) { return r.body; }));
    for (var i = 0; i < snakes.length; i++) {
      var b = snakes[i];
      if (!b.length) continue;
      for (var j = 0; j < b.length - 1; j++) {
        if (b[j].x === nx && b[j].y === ny) return true;
      }
    }
    return false;
  }

  function nearestFoodDist(x, y) {
    var bd = 1e9;
    foods.forEach(function (f) {
      var d = Math.abs(f.x - x) + Math.abs(f.y - y);
      if (d < bd) bd = d;
    });
    return bd;
  }

  function robotStep(r) {
    if (r.respawnAt) return;
    var opts = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
    var valid = [];
    for (var i = 0; i < opts.length; i++) {
      var d = opts[i];
      if (d.x === -r.dir.x && d.y === -r.dir.y) continue;
      var nx = r.body[0].x + d.x, ny = r.body[0].y + d.y;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      if (occupied(nx, ny, r.body)) continue;
      valid.push({ d: d, nx: nx, ny: ny });
    }
    if (!valid.length) { r.body = []; r.respawnAt = Date.now() + 2000; return; }
    var best = valid[0], bd = 1e9;
    valid.forEach(function (v) {
      var dd = nearestFoodDist(v.nx, v.ny);
      if (dd < bd) { bd = dd; best = v; }
    });
    r.dir = best.d;
    r.body.unshift({ x: best.nx, y: best.ny });
    var ate = eatFoodAt(best.nx, best.ny);
    if (!ate) r.body.pop();
  }

  function resetRobots() {
    robots = [];
    for (var i = 0; i < TARGET_ROBOTS; i++) robots.push(makeRobot());
  }

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
    App.el('snLobby').classList.add('hidden');
    App.el('snOver').classList.add('hidden');
    App.el('snGame').classList.remove('hidden');
    var rect = canvas.parentElement.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw2 = Math.max(300, Math.floor(rect.width));
    var ch2 = Math.max(360, Math.floor(rect.height));
    canvas.width = cw2 * dpr;
    canvas.height = ch2 * dpr;
    canvas.style.width = cw2 + 'px';
    canvas.style.height = ch2 + 'px';
    cell = Math.floor(Math.min(cw2 / COLS, ch2 / ROWS));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    foods = [];
    resetRobots();
    ensureFoods();
    score = 0;
    tickMs = 170;
    tickAcc = 0;
    running = true;
    over = false;
    timeUp = false;
    updateHud();
    startTimer();
    if (rafId) cancelAnimationFrame(rafId);
    lastTs = performance.now();
    loop(lastTs);
  }

  function step() {
    dir = nextDir;
    var head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) { endGame(false); return; }
    if (occupied(head.x, head.y, snake)) { endGame(false); return; }
    snake.unshift(head);
    var ate = eatFoodAt(head.x, head.y);
    if (ate) {
      score += FOOD_TYPES[ate.type].value;
      tickMs = Math.max(90, 170 - Math.floor(score / 5) * 8); // 越吃越快
    } else {
      snake.pop();
    }
    // 机器人也走一步
    robots.forEach(robotStep);
    // 机器人重生
    robots.forEach(function (r) {
      if (r.respawnAt && Date.now() > r.respawnAt) {
        var nr = makeRobot();
        r.body = nr.body;
        r.dir = nr.dir;
        r.respawnAt = 0;
      }
    });
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
    // 食物：苹果/披萨/汉堡/炸鸡桶（emoji 清晰好看）
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = Math.floor(cell * 0.78) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    foods.forEach(function (f) {
      var fx = f.x * cell + cell / 2, fy = f.y * cell + cell / 2 + cell * 0.06;
      g.fillText(FOOD_TYPES[f.type].emoji, fx, fy);
    });
    // 机器人蛇
    robots.forEach(function (r) {
      if (!r.body.length) return;
      for (var rb = r.body.length - 1; rb >= 0; rb--) {
        var rp = r.body[rb];
        g.fillStyle = rb === 0 ? lighten(r.color) : r.color;
        g.fillRect(rp.x * cell + 1, rp.y * cell + 1, cell - 2, cell - 2);
      }
      // 机器人眼睛
      var rh = r.body[0];
      g.fillStyle = '#fff';
      var rex = rh.x * cell + cell * 0.3, rey = rh.y * cell + cell * 0.3;
      if (r.dir.x < 0) rex = rh.x * cell + cell * 0.7;
      if (r.dir.y < 0) rey = rh.y * cell + cell * 0.7;
      g.beginPath(); g.arc(rex, rey, cell * 0.08, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(rex + cell * 0.22, rey, cell * 0.08, 0, Math.PI * 2); g.fill();
    });
    // 玩家蛇
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

  function lighten(hex) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, (n >> 16) + 60), g2 = Math.min(255, ((n >> 8) & 255) + 60), b = Math.min(255, (n & 255) + 60);
    return 'rgb(' + r + ',' + g2 + ',' + b + ')';
  }

  function updateHud() {
    var alive = robots.filter(function (r) { return r.body.length; }).length;
    App.el('snScore').textContent = '🏆 ' + score;
    App.el('snLen').textContent = '🐍 ' + snake.length;
    App.el('snRobots').textContent = '🤖 ' + alive;
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
        foods: foods ? foods.map(function (f) { return f.type; }) : [],
        robots: robots ? robots.filter(function (r) { return r.body.length; }).length : 0,
        robotHeads: robots ? robots.map(function (r) { return r.body.length ? [r.body[0].x, r.body[0].y] : null; }) : []
      };
    },
    start: startGame,
    setDir: setDir,
    forceStep: function () {
      if (!running || over) return false;
      step();
      return true;
    },
    spawnFoodAt: function (x, y, type) {
      foods = [{ x: x, y: y, type: type || 'apple' }];
      return true;
    },
    setRobots: function (n) {
      TARGET_ROBOTS = n;
      resetRobots();
      return true;
    },
    robotCount: function () {
      return robots ? robots.filter(function (r) { return r.body.length; }).length : 0;
    },
    forceTimeUp: function () { timeUp = true; endGame(true); }
  };

  renderLobby();
})();
