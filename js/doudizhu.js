/* 斗地主 · 儿童友好版 */
(function () {
  'use strict';

  var DDZ = window.DDZ;
  var data = App.store.load();
  var NAMES = ['你', '小粉', '小蓝'];
  var SUIT_EMOJI = { '♠': '♠', '♥': '♥', '♣': '🍀', '♦': '🌸' };
  var PINK_MSGS = ['💖 让让你', '😊 加油！', '🌷 你好棒'];
  var BLUE_MSGS = ['🤪 我犯傻啦', '😴 没看见', '🍌 我输啦'];
  var G = null;

  /* ---------- 工具 ---------- */
  function byPower(a, b) { return a.power - b.power; }
  function rankLabel(r) { return r === 'S' ? '小' : r === 'B' ? '大' : r; }
  function counts() { return G.hands.map(function (h) { return h.length; }); }

  function cardHTML(c) {
    var red = c.suit === '♥' || c.suit === '♦' || c.rank === 'B';
    var suit = c.rank === 'S' || c.rank === 'B' ? '王' : SUIT_EMOJI[c.suit];
    return '<span class="ddz-card ' + (red ? 'red' : 'black') + (c.rank === 'S' || c.rank === 'B' ? ' joker' : '') + '">' +
      '<span class="rank">' + rankLabel(c.rank) + '</span><span class="suit">' + suit + '</span></span>';
  }

  function playLabel(play) {
    if (!play) return '';
    var main = DDZ.POWER_RANK[play.main];
    if (play.type === DDZ.TYPE.STRAIGHT || play.type === DDZ.TYPE.PAIR_STRAIGHT) {
      return DDZ.TYPE_NAME[play.type] + ' ' + (play.type === DDZ.TYPE.STRAIGHT ? play.len : play.len / 2) + ' 张';
    }
    if (play.type === DDZ.TYPE.ROCKET) return '王炸！';
    if (play.type === DDZ.TYPE.BOMB) return '炸弹 ' + main + '！';
    return DDZ.TYPE_NAME[play.type] + ' ' + main;
  }

  function setStatus(msg) {
    App.el('ddzStatus').textContent = msg;
    App.el('ddzTurn').textContent = '';
  }

  function botName(p) { return NAMES[p]; }

  function say(p, text) {
    var box = p === 1 ? App.el('bot1Chat') : App.el('bot2Chat');
    box.textContent = text;
    box.classList.remove('show');
    void box.offsetWidth;
    box.classList.add('show');
    setTimeout(function () { box.classList.remove('show'); }, 2600);
  }

  /* ---------- 温柔陪玩 ---------- */
  function friendlyLevel() {
    data = App.store.load();
    var ddz = data.ddz || { wins: 0, losses: 0 };
    if (ddz.losses >= 2) return 2; // 连输 2 局 → 更放水
    if (ddz.wins >= 2) return 0; // 连赢 2 局 → 认真一局
    return 1;
  }

  /* ---------- 大厅 ---------- */
  function renderLobby() {
    data = App.store.load();
    App.el('chancePill').textContent = '🎮 ' + (data.chances || 0);
    App.el('jifenPill').textContent = '⭐ ' + (data.balance || 0);
    App.el('lobbyJifen').textContent = data.balance || 0;
    App.el('lobbyChances').textContent = data.chances || 0;
    var redeem = App.el('redeemBtn');
    redeem.disabled = (data.balance || 0) < 5;
    redeem.textContent = (data.balance || 0) >= 5
      ? '🔄 兑换 1 次机会（-5 星星，现有 ' + data.balance + '）'
      : '🔄 兑换 1 次机会（还差 ' + (5 - (data.balance || 0)) + ' 颗星星）';
    var start = App.el('startBtn');
    start.disabled = (data.chances || 0) < 1;
    start.textContent = (data.chances || 0) >= 1
      ? '🎮 开始游戏（还有 ' + data.chances + ' 次机会）'
      : '🎮 星星不够，先做作业赚星星吧';
  }

  App.el('redeemBtn').addEventListener('click', function () {
    data = App.store.load();
    if (App.redeemChance(data)) {
      App.logActivity(data, '兑换斗地主机会');
      App.toast('兑换成功，+1 次机会！');
      renderLobby();
    } else {
      App.toast('星星还不够 5 颗哦');
    }
  });

  App.el('startBtn').addEventListener('click', function () {
    data = App.store.load();
    if (!App.useChance(data)) { App.toast('没有游戏机会啦'); return; }
    renderLobby();
    newGame();
  });

  /* ---------- 开局（随机地主） ---------- */
  function newGame() {
    var d = DDZ.deal();
    G = {
      hands: d.hands,
      bottom: d.bottom,
      landlord: Math.floor(Math.random() * 3),
      turn: -1,
      lastPlay: null,
      lastPlayer: -1,
      lastPass: -1,
      passCount: 0,
      history: [],
      over: false,
      auto: false
    };
    G.hands[G.landlord] = G.hands[G.landlord].concat(G.bottom).sort(byPower);
    G.turn = G.landlord;
    App.el('lobby').classList.add('hidden');
    App.el('overlay').classList.add('hidden');
    App.el('game').classList.remove('hidden');
    App.el('btnAuto').textContent = '🤖 托管';
    App.el('btnAuto').disabled = false;
    App.el('ddzRole').textContent = G.landlord === 0 ? '👑 你是地主' : '🧑‍🌾 你是农民';
    renderAll();
    setStatus(G.landlord === 0 ? '你是地主，先出牌' : botName(G.landlord) + '是地主，先出牌');
    runTurn();
  }

  /* ---------- 出牌流程 ---------- */
  function runTurn() {
    if (G.over) return;
    var p = G.turn;
    if (p === 0) {
      myTurn();
    } else {
      App.el('actionRow').classList.add('hidden');
      setStatus(botName(p) + '思考中…');
      setTimeout(function () { if (!G.over && G.turn === p) botAct(p); }, 900);
    }
  }

  function myTurn() {
    if (G.auto) {
      setStatus('🤖 托管中…');
      setTimeout(function () {
        if (G.over || G.turn !== 0) return;
        var decision = DDZ.aiPlay(G.hands[0], {
          lastPlay: G.lastPlay,
          lastPlayer: G.lastPlayer,
          myIndex: 0,
          landlordIndex: G.landlord,
          counts: counts(),
          friendly: 0
        });
        if (decision) applyPlay(0, decision.cards);
        else applyPass(0);
      }, 800);
      return;
    }
    App.el('actionRow').classList.remove('hidden');
    var needBeat = G.lastPlay && G.lastPlayer !== 0;
    setStatus(needBeat ? '要压过：' + playLabel(G.lastPlay) : '轮到你出牌');
    App.el('btnPass').disabled = !needBeat;
  }

  function botAct(p) {
    var decision = DDZ.aiPlay(G.hands[p], {
      lastPlay: G.lastPlay,
      lastPlayer: G.lastPlayer,
      myIndex: p,
      landlordIndex: G.landlord,
      counts: counts(),
      friendly: friendlyLevel()
    });
    if (!decision) {
      say(p, p === 1 ? PINK_MSGS[Math.floor(Math.random() * PINK_MSGS.length)] : BLUE_MSGS[Math.floor(Math.random() * BLUE_MSGS.length)]);
      applyPass(p);
    } else {
      say(p, p === 1 ? '💖 我出啦' : '🤪 该我啦');
      applyPlay(p, decision.cards);
    }
  }

  function applyPlay(p, cards) {
    G.hands[p] = G.hands[p].filter(function (c) { return cards.indexOf(c) === -1; });
    G.lastPlay = DDZ.analyze(cards);
    G.lastPlayer = p;
    G.lastPass = -1;
    G.passCount = 0;
    G.history.push({ player: p, play: G.lastPlay, cards: cards });
    if (G.history.length > 200) G.history = G.history.slice(-200);
    renderAll();
    flyCards();
    setStatus(botName(p) + '：' + playLabel(G.lastPlay));
    if (G.hands[p].length === 0) { gameOver(p); return; }
    G.turn = (p + 1) % 3;
    runTurn();
  }

  function applyPass(p) {
    G.lastPass = p;
    G.passCount++;
    G.history.push({ player: p, play: null, cards: null });
    if (G.history.length > 200) G.history = G.history.slice(-200);
    setStatus(botName(p) + '：不要');
    if (G.passCount >= 2) {
      G.turn = G.lastPlayer;
      G.lastPlay = null;
      G.passCount = 0;
      renderAll();
      runTurn();
    } else {
      G.turn = (p + 1) % 3;
      renderAll();
      runTurn();
    }
  }

  /* ---------- 我的操作 ---------- */
  App.el('myHand').addEventListener('click', function (e) {
    var btn = e.target.closest('.ddz-card[data-id]');
    if (!btn) return;
    var id = btn.getAttribute('data-id');
    var selected = btn.classList.toggle('sel');
    App.el('btnPlay').textContent = selected ? '出牌！' : '出牌！';
  });

  function selectedCards() {
    var out = [];
    App.el('myHand').querySelectorAll('.ddz-card.sel').forEach(function (b) {
      var id = b.getAttribute('data-id');
      out.push(G.hands[0].find(function (c) { return String(c.id) === id; }));
    });
    return out.filter(Boolean);
  }

  App.el('btnPlay').addEventListener('click', function () {
    var cards = selectedCards();
    if (!cards.length) { App.toast('先点几张牌再出'); return; }
    var play = DDZ.analyze(cards);
    if (!play) { App.toast('这几张牌不能一起出'); return; }
    if (G.lastPlay && G.lastPlayer !== 0 && !DDZ.beats(play, G.lastPlay)) {
      App.toast('要压过上家的牌哦');
      return;
    }
    applyPlay(0, cards);
  });

  App.el('btnPass').addEventListener('click', function () {
    if (!G.lastPlay || G.lastPlayer === 0) { App.toast('你是先手，必须出牌'); return; }
    applyPass(0);
  });

  App.el('btnHint').addEventListener('click', function () {
    var needBeat = G.lastPlay && G.lastPlayer !== 0;
    var hint = needBeat ? DDZ.findBeat(G.hands[0], G.lastPlay) : DDZ.chooseLead(G.hands[0]);
    if (!hint) {
      App.toast('要不起，自动不出');
      applyPass(0);
      return;
    }
    clearSelection();
    hint.forEach(function (c) {
      App.el('myHand').querySelector('[data-id="' + c.id + '"]').classList.add('sel');
    });
    setStatus('提示：已选好这组牌', '');
  });

  App.el('btnAuto').addEventListener('click', function () {
    G.auto = true;
    App.el('btnAuto').textContent = '🤖 托管中';
    App.el('btnAuto').disabled = true;
    App.toast('托管开启，AI 帮你打完这局');
    if (G.turn === 0 && !G.over) myTurn();
  });

  function clearSelection() {
    App.el('myHand').querySelectorAll('.ddz-card.sel').forEach(function (b) {
      b.classList.remove('sel');
    });
  }

  /* ---------- 结算与烟花 ---------- */
  function gameOver(winner) {
    G.over = true;
    var landlordWon = winner === G.landlord;
    var myWon = (G.landlord === 0 && landlordWon) || (G.landlord !== 0 && !landlordWon);
    data = App.store.load();
    if (!data.ddz) data.ddz = { wins: 0, losses: 0 };
    if (myWon) { data.ddz.wins++; data.ddz.losses = 0; }
    else { data.ddz.losses++; data.ddz.wins = 0; }
    App.store.save(data);
    App.logActivity(data, '斗地主' + (myWon ? '胜利' : '失败'));

    App.el('game').classList.add('hidden');
    App.el('overEmoji').textContent = myWon ? '🎉' : '😅';
    App.el('overTitle').textContent = myWon ? '你赢啦！' : '差一点，再试试！';
    App.el('overLine').textContent = (G.landlord === 0 ? '你是地主' : '你是农民') + (myWon ? ' · 太棒了！' : ' · 下次加油');
    var again = App.el('overAgain');
    data = App.store.load();
    if (data.chances > 0) {
      again.disabled = false;
      again.textContent = '🔄 再来一局（还剩 ' + data.chances + ' 次机会）';
    } else {
      again.disabled = true;
      again.textContent = '🎮 机会用完啦，做作业赚星星吧';
    }
    App.el('overlay').classList.remove('hidden');
    if (myWon) {
      fire();
      say(1, '🎉 你真棒！');
      say(2, '🌟 我也为你开心');
    } else {
      say(1, '💪 下次一定赢');
      say(2, '🥰 输赢都开心');
    }
    renderLobby();
  }

  function fire() {
    var box = App.el('fireworks');
    box.innerHTML = '';
    box.classList.remove('hidden');
    var emojis = ['🌟', '⭐', '✨', '🎆', '🎇', '💫'];
    for (var i = 0; i < 24; i++) {
      var s = document.createElement('span');
      s.textContent = emojis[i % emojis.length];
      s.style.left = (5 + Math.random() * 90) + '%';
      s.style.animationDelay = (Math.random() * 0.4) + 's';
      box.appendChild(s);
    }
    setTimeout(function () { box.classList.add('hidden'); box.innerHTML = ''; }, 3000);
  }

  App.el('overAgain').addEventListener('click', function () {
    data = App.store.load();
    if (!App.useChance(data)) { App.toast('没有游戏机会啦'); return; }
    renderLobby();
    newGame();
  });
  App.el('overHome').addEventListener('click', function () { window.location.href = 'index.html'; });
  App.el('overLobby').addEventListener('click', function () {
    App.el('overlay').classList.add('hidden');
    App.el('game').classList.add('hidden');
    App.el('lobby').classList.remove('hidden');
    renderLobby();
  });

  /* ---------- 渲染 ---------- */
  function renderAll() {
    renderBots();
    renderHand();
    renderCenter();
    renderHistory();
  }

  function renderBots() {
    [1, 2].forEach(function (i) {
      var back = App.el('bot' + i + 'Back');
      var n = G.hands[i].length;
      back.innerHTML = '';
      var shown = Math.min(n, 8);
      for (var k = 0; k < shown; k++) {
        var s = document.createElement('span');
        s.className = 'card-back';
        back.appendChild(s);
      }
      if (n > 8) {
        var label = document.createElement('span');
        label.style.cssText = 'margin-left:6px;font-weight:800';
        label.textContent = '×' + n;
        back.appendChild(label);
      }
      App.el('landlordTag' + i).classList.toggle('hidden', G.landlord !== i);
      var box = App.el('bot' + i + 'Play');
      box.innerHTML = '';
      if (G.lastPlayer === i && G.lastPlay) box.innerHTML = G.lastPlay.cards.map(cardHTML).join('');
      else if (G.lastPass === i) box.textContent = '不要';
    });
  }

  function renderHand() {
    var box = App.el('myHand');
    box.innerHTML = '';
    G.hands[0].forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ddz-card kid ' + (c.suit === '♥' || c.suit === '♦' || c.rank === 'B' ? 'red' : 'black') +
        (c.rank === 'S' || c.rank === 'B' ? ' joker' : '');
      b.setAttribute('data-id', c.id);
      var suit = c.rank === 'S' || c.rank === 'B' ? '王' : SUIT_EMOJI[c.suit];
      b.innerHTML = '<span class="rank">' + rankLabel(c.rank) + '</span><span class="suit">' + suit + '</span>';
      box.appendChild(b);
    });
    var mine = App.el('myPlay');
    mine.innerHTML = '';
    if (G.lastPlayer === 0 && G.lastPlay) mine.innerHTML = G.lastPlay.cards.map(cardHTML).join('');
    if (G.lastPass === 0) mine.textContent = '不要';
  }

  function renderCenter() {
    var bottom = App.el('bottomCards');
    bottom.innerHTML = '';
    if (G.landlord !== -1) {
      bottom.innerHTML = '底牌 ' + G.bottom.map(function (c) { return cardHTML(c); }).join('');
    }
  }

  function flyCards() {
    [App.el('myPlay'), App.el('bot1Play'), App.el('bot2Play')].forEach(function (box) {
      box.querySelectorAll('.ddz-card').forEach(function (el) {
        el.classList.add('fly');
        setTimeout(function () { el.classList.remove('fly'); }, 600);
      });
    });
  }

  function renderHistory() {
    var box = App.el('historyBox');
    box.innerHTML = '';
    G.history.forEach(function (h) {
      var row = document.createElement('div');
      row.className = 'hist-row';
      var who = document.createElement('span');
      who.className = 'hist-who' + (h.player === 0 ? ' me' : h.player === 1 ? ' b1' : ' b2');
      who.textContent = NAMES[h.player];
      row.appendChild(who);
      if (!h.play) {
        var pass = document.createElement('span');
        pass.className = 'hist-pass';
        pass.textContent = '不要';
        row.appendChild(pass);
      } else {
        var label = document.createElement('span');
        label.className = 'hist-label';
        label.textContent = playLabel(h.play);
        row.appendChild(label);
        var cards = document.createElement('span');
        cards.className = 'hist-cards';
        h.cards.forEach(function (c) {
          var s = document.createElement('span');
          var red = c.suit === '♥' || c.suit === '♦' || c.rank === 'B';
          s.className = 'hist-card ' + (red ? 'red' : 'black');
          s.textContent = rankLabel(c.rank) + (c.rank === 'S' || c.rank === 'B' ? '王' : SUIT_EMOJI[c.suit]);
          cards.appendChild(s);
        });
        row.appendChild(cards);
      }
      box.appendChild(row);
    });
    box.scrollTop = box.scrollHeight;
  }

  renderLobby();
})();
