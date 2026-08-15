/* i同步学 · 美食大厨：汤包店 → 牛排店 → 汉堡店，每家 15 关解锁下一家 */
(function () {
  'use strict';

  var CHEF_SAVE = 'xx3_chef_v1';
  var UNLOCK_AT = 15;   // 过 15 关解锁下一家店

  var STORES = [
    {
      id: 'tangbao', name: '汤包店', emoji: '🥟', color: '#FFB300', bg: 'linear-gradient(135deg,#FFE0A3,#FFB84D)',
      items: [
        { emoji: '🥟', name: '汤包', t: 2000 },
        { emoji: '🥛', name: '豆浆', t: 2000 },
        { emoji: '🥖', name: '油条', t: 2000 },
        { emoji: '🥚', name: '卤蛋', t: 2000 },
        { emoji: '🥣', name: '粥', t: 2000 }
      ]
    },
    {
      id: 'niupai', name: '牛排店', emoji: '🥩', color: '#E8556D', bg: 'linear-gradient(135deg,#FFC7CE,#F08A5D)',
      items: [
        { emoji: '🥩', name: '牛排', t: 2000 },
        { emoji: '🍊', name: '橙汁', t: 2000 },
        { emoji: '🍶', name: '牛排酱', t: 2000 },
        { emoji: '🍦', name: '冰淇淋', t: 1000 }
      ]
    },
    {
      id: 'hanbao', name: '汉堡店', emoji: '🍔', color: '#3D7BFD', bg: 'linear-gradient(135deg,#BFD8FF,#6AA7FF)',
      items: [
        { emoji: '🍔', name: '汉堡', t: 2000 },
        { emoji: '🥤', name: '可乐', t: 2000 },
        { emoji: '🍟', name: '薯条', t: 2000 },
        { emoji: '🍗', name: '炸鸡块', t: 2000 },
        { emoji: '🍦', name: '冰淇淋', t: 1000 }
      ]
    }
  ];

  /* 顾客形象：不同发型/肤色/上衣，卡通人形，一眼能分清人和菜 */
  var CUSTOMERS = [
    { name: '乐乐', skin: '#FFE0BD', hair: '#4A3728', shirt: '#FF8A5C', style: 'short' },
    { name: '朵朵', skin: '#FFE8CC', hair: '#8B5A2B', shirt: '#7FB5FF', style: 'bun' },
    { name: '小虎', skin: '#F2C99B', hair: '#2F2F3A', shirt: '#55C98F', style: 'short' },
    { name: '糖糖', skin: '#FFE8D6', hair: '#C98B3D', shirt: '#F58FB0', style: 'pony' },
    { name: '大厨爷爷', skin: '#EED5B0', hair: '#B7B7C4', shirt: '#9B6BF5', style: 'cap' },
    { name: '豆豆', skin: '#FFDFB8', hair: '#5A4632', shirt: '#FFD166', style: 'curly' }
  ];

  function hairSvg(c) {
    var hair = c.hair;
    if (c.style === 'cap') {
      return '' +
        '<path d="M58 32 Q58 14 75 14 Q92 14 92 32 L92 38 L58 38 Z" fill="#ffffff" stroke="#E0D8CF" stroke-width="3"/>' +
        '<rect x="52" y="32" width="46" height="11" rx="5.5" fill="#ffffff" stroke="#E0D8CF" stroke-width="3"/>';
    }
    var base =
      '<path d="M47 54 Q47 22 75 22 Q103 22 103 54 L103 46 Q103 30 75 30 Q47 30 47 46 Z" fill="' + hair + '"/>';
    if (c.style === 'bun') {
      return base + '<circle cx="75" cy="15" r="13" fill="' + hair + '"/>';
    }
    if (c.style === 'pony') {
      return base +
        '<path d="M103 34 Q124 40 122 66 Q121 82 111 92" fill="none" stroke="' + hair + '" stroke-width="13" stroke-linecap="round"/>';
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
      /* 身体与围裙 */
      '<rect x="35" y="100" width="80" height="76" rx="20" fill="' + c.shirt + '"/>' +
      '<path d="M52 110 L75 96 L98 110 L98 170 L52 170 Z" fill="#ffffff" opacity="0.92"/>' +
      '<path d="M52 110 L75 96 L98 110" fill="none" stroke="' + c.shirt + '" stroke-width="4"/>' +
      /* 手臂（伸向餐台） */
      '<path d="M42 114 Q16 130 28 152" fill="none" stroke="' + c.shirt + '" stroke-width="14" stroke-linecap="round"/>' +
      '<path d="M108 114 Q134 130 122 152" fill="none" stroke="' + c.shirt + '" stroke-width="14" stroke-linecap="round"/>' +
      '<circle cx="28" cy="154" r="8.5" fill="' + c.skin + '"/>' +
      '<circle cx="122" cy="154" r="8.5" fill="' + c.skin + '"/>' +
      /* 头与耳朵 */
      '<ellipse cx="75" cy="56" rx="28" ry="30" fill="' + c.skin + '"/>' +
      '<circle cx="46" cy="60" r="6" fill="' + c.skin + '"/>' +
      '<circle cx="104" cy="60" r="6" fill="' + c.skin + '"/>' +
      hairSvg(c) +
      /* 五官 */
      '<path d="M58 46 Q64 41 70 46" fill="none" stroke="#6B4A2B" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M80 46 Q86 41 92 46" fill="none" stroke="#6B4A2B" stroke-width="2.6" stroke-linecap="round"/>' +
      '<circle cx="64" cy="55" r="3.4" fill="#3A3A4A"/>' +
      '<circle cx="86" cy="55" r="3.4" fill="#3A3A4A"/>' +
      '<ellipse cx="52" cy="67" rx="6" ry="4" fill="#FF9D9D" opacity="0.75"/>' +
      '<ellipse cx="98" cy="67" rx="6" ry="4" fill="#FF9D9D" opacity="0.75"/>' +
      '<path d="M66 69 Q75 78 84 69" fill="none" stroke="#A04A3A" stroke-width="3" stroke-linecap="round"/>' +
      /* 领结 */
      '<path d="M75 97 L67 107 L75 102 L83 107 Z" fill="#E8556D"/>' +
      '</svg>';
  }

  var save = { progress: { tangbao: 0, niupai: 0, hanbao: 0 }, stars: {}, awarded: {} };
  try {
    var raw = JSON.parse(localStorage.getItem(CHEF_SAVE) || '{}');
    for (var k in save) if (raw[k] !== undefined) save[k] = raw[k];
    if (!save.progress) save.progress = { tangbao: 0, niupai: 0, hanbao: 0 };
    STORES.forEach(function (s) { if (save.progress[s.id] === undefined) save.progress[s.id] = 0; });
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
    return save.progress[STORES[idx - 1].id] >= UNLOCK_AT;
  }

  function storeTotal(s) { return s.progress[s.id] || 0; }

  /* ---------- 商店选择 ---------- */
  function renderStores() {
    var list = App.el('storeList');
    list.innerHTML = '';
    STORES.forEach(function (s) {
      var ok = unlocked(s.id);
      var done = save.progress[s.id] || 0;
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'chef-store' + (ok ? '' : ' locked');
      card.style.background = ok ? s.bg : 'linear-gradient(135deg,#E8E8EF,#D5D5DE)';
      card.innerHTML =
        '<div class="chef-store-top">' +
          '<span class="chef-store-emoji">' + (ok ? s.emoji : '🔒') + '</span>' +
          '<span class="chef-store-name">' + s.name + '</span>' +
          (ok ? '<span class="chef-store-progress">' + done + ' / ' + UNLOCK_AT + ' 关</span>' : '<span class="chef-store-lock">未解锁</span>') +
        '</div>' +
        '<div class="chef-store-items">' + s.items.map(function (it) { return it.emoji; }).join(' ') + '</div>' +
        (ok
          ? '<div class="chef-store-desc">' + (done >= UNLOCK_AT ? '已解锁下一家！当前通关 ' + done + ' 关' : '再过 ' + (UNLOCK_AT - done) + ' 关解锁下一家') + '</div>'
          : '<div class="chef-store-desc">通过上一家 15 关后解锁</div>');
      if (ok) card.addEventListener('click', function () { startStore(s.id); });
      list.appendChild(card);
    });
  }

  function nextStore(id) {
    for (var i = 0; i < STORES.length - 1; i++) if (STORES[i].id === id) return STORES[i + 1];
    return null;
  }

  /* ---------- 对局 ---------- */
  var game = null;
  var timer = null;
  var makeTimer = null;

  function startStore(id) {
    var store = storeById(id);
    var level = (save.progress[id] || 0) + 1;
    if (level > 100) level = 100;
    var orders = Math.min(8, 3 + Math.floor((level - 1) / 10));
    var perOrder = Math.max(7000, 12000 - (level - 1) * 80);
    game = {
      store: store,
      level: level,
      orders: orders,
      left: orders,
      perOrder: perOrder,
      score: 0,
      mistakes: 0,
      timeouts: 0,
      lives: 3,
      current: null,
      done: false
    };
    App.el('storePanel').classList.add('hidden');
    App.el('resultPanel').classList.add('hidden');
    App.el('unlockPanel').classList.add('hidden');
    App.el('gamePanel').classList.remove('hidden');
    App.el('lvLabel').textContent = store.name + ' · 第 ' + level + ' 关';
    App.el('scoreLabel').textContent = '0 分';
    renderLives();
    nextOrder();
  }

  function nextOrder() {
    if (game.done) return;
    if (game.left <= 0) { finishLevel(true); return; }
    game.left--;
    game.current = game.store.items[Math.floor(Math.random() * game.store.items.length)];
    var customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
    App.el('customerFace').innerHTML = makeCustomerSvg(customer);
    App.el('customerName').textContent = customer.name;
    App.el('orderText').textContent = '我想吃';
    App.el('orderItem').textContent = game.current.emoji;
    App.el('orderItem').style.background = game.store.color;
    App.el('chefFeedback').textContent = '';
    renderItemBtns();
    startTimer();
  }

  function renderItemBtns() {
    var box = App.el('itemBtns');
    box.innerHTML = '';
    game.store.items.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chef-item';
      b.innerHTML = '<span class="chef-item-emoji">' + it.emoji + '</span><span class="chef-item-name">' + it.name + '</span>';
      b.dataset.name = it.name;
      b.addEventListener('click', function () { pickItem(b, it); });
      box.appendChild(b);
    });
  }

  function pickItem(btn, it) {
    if (game.done || !game.current) return;
    if (btn.classList.contains('dim')) return;
    if (it.name !== game.current.name) {
      game.mistakes++;
      game.score = Math.max(0, game.score - 5);
      btn.classList.add('dim');
      App.el('scoreLabel').textContent = game.score + ' 分';
      App.el('chefFeedback').textContent = '✗ 不是「' + it.name + '」哦，再试试';
      return;
    }
    // 制作中：冰淇淋 1 秒，其它 2 秒
    clearInterval(timer);
    clearInterval(makeTimer);
    btn.classList.add('making');
    btn.querySelector('.chef-item-name').textContent = '制作中…';
    var t0 = Date.now();
    var ms = it.t;
    makeTimer = setInterval(function () {
      var left = Math.max(0, ms - (Date.now() - t0));
      btn.style.background = 'linear-gradient(135deg,#FFF3D6,#FFE0A3)';
      if (left <= 0) {
        clearInterval(makeTimer);
        btn.classList.remove('making');
        btn.classList.add('done');
        btn.querySelector('.chef-item-name').textContent = '✓ ' + it.name + ' 出餐！';
        game.score += 10;
        App.el('scoreLabel').textContent = game.score + ' 分';
        App.el('chefFeedback').textContent = '✓ ' + it.name + ' 做好啦，顾客很开心！';
        App.el('orderItem').textContent = '😋';
        setTimeout(nextOrder, 700);
      }
    }, 100);
  }

  function startTimer() {
    clearInterval(timer);
    var t0 = Date.now();
    var fill = App.el('timerFill');
    fill.style.transition = 'none';
    fill.style.width = '100%';
    requestAnimationFrame(function () {
      fill.style.transition = 'width ' + game.perOrder + 'ms linear';
      fill.style.width = '0%';
    });
    timer = setInterval(function () {
      if (game.done) return;
      if (Date.now() - t0 >= game.perOrder) {
        clearInterval(timer);
        timeoutOrder();
      }
    }, 200);
  }

  function timeoutOrder() {
    game.timeouts++;
    game.lives--;
    renderLives();
    App.el('chefFeedback').textContent = '⏰ 顾客等太久走了…';
    if (game.lives <= 0) { finishLevel(false); return; }
    setTimeout(nextOrder, 700);
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

  function finishLevel(win) {
    if (game.done) return;
    game.done = true;
    clearInterval(timer);
    clearInterval(makeTimer);
    App.el('gamePanel').classList.add('hidden');
    App.el('resultPanel').classList.remove('hidden');

    var id = game.store.id;
    if (win) {
      var stars = game.mistakes + game.timeouts === 0 ? 3 : game.mistakes + game.timeouts <= 1 ? 2 : 1;
      var emoji = stars === 3 ? '🌟' : stars === 2 ? '🎉' : '👍';
      App.el('chefResultEmoji').textContent = emoji;
      App.el('chefResultTitle').textContent = '第 ' + game.level + ' 关过关！';
      App.el('chefResultLine').textContent = '得分 ' + game.score + ' · 获得 ' + stars + ' ⭐';
      // 记录最高进度 + 星星（每关第一次过关才发星星奖励）
      if ((save.progress[id] || 0) < game.level) {
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
        saveNow();
      }
      App.el('chefRetryBtn').textContent = '↻ 再玩第 ' + game.level + ' 关';
      App.el('chefNextBtn').style.display = '';
      // 下一关是否触发解锁
      var nxt = nextStore(id);
      if (nxt && save.progress[id] >= UNLOCK_AT && unlocked(nxt.id)) {
        App.el('chefNextBtn').style.display = 'none';
        App.el('chefResultLine').textContent += ' · 🔓 解锁了 ' + nxt.name + '！';
        setTimeout(function () { showUnlock(nxt); }, 1200);
      }
    } else {
      App.el('chefResultEmoji').textContent = '💪';
      App.el('chefResultTitle').textContent = '差一点点';
      App.el('chefResultLine').textContent = '爱心用完啦，休息一下再试第 ' + game.level + ' 关！';
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
    App.el('unlockLine').textContent = '你通过了 ' + UNLOCK_AT + ' 关，新店开张啦！快去看看有什么好吃的吧～';
    App.el('unlockGoBtn').dataset.go = store.id;
  }

  /* ---------- 事件 ---------- */
  App.el('chefRetryBtn').addEventListener('click', function () {
    startStore(game.store.id);
  });
  App.el('chefNextBtn').addEventListener('click', function () {
    startStore(game.store.id);
  });
  App.el('chefBackBtn').addEventListener('click', function (e) {
    e.preventDefault();
    App.el('resultPanel').classList.add('hidden');
    App.el('gamePanel').classList.add('hidden');
    App.el('unlockPanel').classList.add('hidden');
    App.el('storePanel').classList.remove('hidden');
    renderStores();
  });
  App.el('unlockGoBtn').addEventListener('click', function () {
    var id = App.el('unlockGoBtn').dataset.go;
    App.el('unlockPanel').classList.add('hidden');
    renderStores();
    startStore(id);
  });
  App.el('unlockStayBtn').addEventListener('click', function () {
    App.el('unlockPanel').classList.add('hidden');
    App.el('storePanel').classList.remove('hidden');
    renderStores();
  });

  App.el('chefStarPill').textContent = '⭐ ' + (App.store.load().balance || 0);
  renderStores();

  /* 调试/自动化验证接口（与台球 __pool、我的世界 __mc 一致） */
  window.__chef = {
    unlockAt: UNLOCK_AT,
    stores: STORES.map(function (s) { return s.id; }),
    state: function () {
      return {
        progress: save.progress,
        unlocked: STORES.map(function (s) { return unlocked(s.id); }),
        game: game ? {
          store: game.store.id,
          level: game.level,
          left: game.left,
          score: game.score,
          lives: game.lives,
          current: game.current ? game.current.name : null,
          done: game.done
        } : null
      };
    },
    setProgress: function (id, n) {
      save.progress[id] = n;
      saveNow();
      renderStores();
      return save.progress[id];
    },
    startStore: startStore,
    pick: function (name) {
      var btns = document.querySelectorAll('.chef-item');
      for (var i = 0; i < btns.length; i++) {
        if (btns[i].dataset.name === name) { btns[i].click(); return true; }
      }
      return false;
    },
    orderName: function () {
      return game && game.current ? game.current.name : null;
    }
  };
})();
