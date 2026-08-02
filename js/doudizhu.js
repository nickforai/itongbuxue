/* 斗地主游戏页面 */
(function () {
  'use strict';

  var DDZ = window.DDZ;
  var data = App.store.load();
  var NAMES = ['你', '小蓝', '小红'];
  var G = null;
  var mySelection = {};

  /* ---------- 工具 ---------- */
  function byPower(a, b) { return a.power - b.power; }

  function rankLabel(rank) {
    return rank === 'S' ? '小' : rank === 'B' ? '大' : rank;
  }

  function cardHTML(c, extra) {
    var red = c.suit === '♥' || c.suit === '♦' || c.rank === 'B';
    var cls = 'ddz-card ' + (red ? 'red' : 'black') + (c.rank === 'S' || c.rank === 'B' ? ' joker' : '');
    var suit = c.rank === 'S' || c.rank === 'B' ? '王' : c.suit;
    return '<span class="' + cls + '" ' + (extra || '') + '>' +
      '<span class="rank">' + rankLabel(c.rank) + '</span>' +
      '<span class="suit">' + suit + '</span></span>';
  }

  function playLabel(play) {
    if (!play) return '';
    var main = DDZ.POWER_RANK[play.main];
    if (play.type === DDZ.TYPE.STRAIGHT || play.type === DDZ.TYPE.PAIR_STRAIGHT) {
      var n = play.type === DDZ.TYPE.STRAIGHT ? play.len : play.len / 2;
      return DDZ.TYPE_NAME[play.type] + ' ' + n + ' 张';
    }
    if (play.type === DDZ.TYPE.ROCKET) return '王炸！';
    if (play.type === DDZ.TYPE.BOMB) return '炸弹 ' + main + '！';
    return DDZ.TYPE_NAME[play.type] + ' ' + main;
  }

  function logText(player, play) {
    if (!play) return NAMES[player] + '：不要';
    return NAMES[player] + '：' + playLabel(play);
  }

  function setStatus(msg, turn) {
    App.el('ddzStatus').textContent = msg;
    App.el('ddzTurn').textContent = turn || '';
  }

  /* ---------- 钱包与大厅 ---------- */
  function renderLobby() {
    data = App.store.load();
    App.el('chancePill').textContent = '🎮 ' + data.chances;
    App.el('jifenPill').textContent = '💰 ' + data.jifen;
    App.el('lobbyJifen').textContent = data.jifen;
    App.el('lobbyChances').textContent = data.chances;
    var redeem = App.el('redeemBtn');
    redeem.disabled = data.jifen < 5;
    redeem.textContent = data.jifen >= 5
      ? '🔄 兑换 1 次机会（-5 积分，现有 ' + data.jifen + '）'
      : '🔄 兑换 1 次机会（还差 ' + (5 - data.jifen) + ' 积分）';
    var start = App.el('startBtn');
    start.disabled = data.chances < 1;
    start.textContent = data.chances >= 1
      ? '🎮 开始游戏（还有 ' + data.chances + ' 次机会）'
      : '🎮 积分不够，先做作业赚积分吧';
  }

  App.el('redeemBtn').addEventListener('click', function () {
    data = App.store.load();
    if (App.redeemChance(data)) {
      App.logActivity(data, '兑换游戏机会');
      App.toast('兑换成功，+1 次机会！');
      renderLobby();
    } else {
      App.toast('积分还不够 5 分哦');
    }
  });

  App.el('startBtn').addEventListener('click', function () {
    data = App.store.load();
    if (!App.useChance(data)) { App.toast('没有游戏机会啦'); return; }
    renderLobby();
    newGame();
  });

  /* ---------- 开局与叫地主 ---------- */
  function newGame() {
    var d = DDZ.deal();
    G = {
      hands: d.hands,
      bottom: d.bottom,
      landlord: -1,
      lastCaller: -1,
      bidIdx: 0,
      turn: -1,
      lastPlay: null,
      lastPlayer: -1,
      lastPass: -1,
      passCount: 0,
      history: [],
      over: false
    };
    mySelection = {};
    var bidStart = Math.floor(Math.random() * 3);
    G.bidOrder = [bidStart, (bidStart + 1) % 3, (bidStart + 2) % 3];
    App.el('lobby').classList.add('hidden');
    App.el('overlay').classList.add('hidden');
    App.el('game').classList.remove('hidden');
    App.el('actionRow').classList.add('hidden');
    App.el('bidRow').classList.add('hidden');
    renderAll();
    nextBid();
  }

  function nextBid() {
    if (G.bidIdx >= 3) { finishBidding(); return; }
    var p = G.bidOrder[G.bidIdx];
    setStatus('叫地主：轮到' + NAMES[p], p === 0 ? '轮到你叫地主' : NAMES[p] + '思考中…');
    if (p === 0) {
      App.el('actionRow').classList.add('hidden');
      App.el('bidRow').classList.remove('hidden');
    } else {
      setTimeout(function () {
        if (G.over) return;
        var call = DDZ.aiBid(G.hands[p]);
        if (call) { G.lastCaller = p; App.toast(NAMES[p] + '叫地主了！'); }
        else App.toast(NAMES[p] + '不叫');
        G.bidIdx++;
        nextBid();
      }, 900);
    }
  }

  App.el('bidYes').addEventListener('click', function () {
    G.lastCaller = 0;
    G.bidIdx++;
    App.el('bidRow').classList.add('hidden');
    nextBid();
  });

  App.el('bidNo').addEventListener('click', function () {
    G.bidIdx++;
    App.el('bidRow').classList.add('hidden');
    nextBid();
  });

  function finishBidding() {
    if (G.lastCaller === -1) {
      App.toast('没人叫地主，重新发牌');
      setTimeout(newGame, 700);
      return;
    }
    G.landlord = G.lastCaller;
    G.hands[G.landlord] = G.hands[G.landlord].concat(G.bottom).sort(byPower);
    G.turn = G.landlord;
    renderAll();
    setStatus(
      G.landlord === 0 ? '你是地主！' : NAMES[G.landlord] + '是地主',
      G.landlord === 0 ? '你先出牌' : NAMES[G.landlord] + '先出牌'
    );
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
      setStatus('轮到' + NAMES[p], NAMES[p] + '思考中…');
      setTimeout(function () { if (!G.over && G.turn === p) botAct(p); }, 900);
    }
  }

  function myTurn() {
    App.el('bidRow').classList.add('hidden');
    App.el('actionRow').classList.remove('hidden');
    var needBeat = G.lastPlay && G.lastPlayer !== 0;
    setStatus(
      needBeat ? '要压过：' + playLabel(G.lastPlay) : '轮到你出牌',
      '请出牌'
    );
    App.el('btnPass').disabled = !needBeat;
  }

  function botAct(p) {
    var ctx = {
      lastPlay: G.lastPlay,
      lastPlayer: G.lastPlayer,
      myIndex: p,
      landlordIndex: G.landlord,
      counts: G.hands.map(function (h) { return h.length; })
    };
    var decision = DDZ.aiPlay(G.hands[p], ctx);
    if (!decision) applyPass(p);
    else applyPlay(p, decision.cards);
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
    setStatus(logText(p, G.lastPlay), '');
    if (G.hands[p].length === 0) { gameOver(p); return; }
    G.turn = (p + 1) % 3;
    runTurn();
  }

  function applyPass(p) {
    G.lastPass = p;
    G.passCount++;
    G.history.push({ player: p, play: null, cards: null });
    if (G.history.length > 200) G.history = G.history.slice(-200);
    setStatus(logText(p, null), '');
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
    if (mySelection[id]) delete mySelection[id];
    else mySelection[id] = true;
    btn.classList.toggle('sel', !!mySelection[id]);
  });

  function selectedCards() {
    return G.hands[0].filter(function (c) { return mySelection[c.id]; });
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
      App.el('btnPass').disabled = true;
      applyPass(0);
      return;
    }
    mySelection = {};
    hint.forEach(function (c) { mySelection[c.id] = true; });
    renderHand();
    setStatus('提示：已选好这组牌', '点「出牌」打出去');
  });

  /* ---------- 结算 ---------- */
  function gameOver(winner) {
    G.over = true;
    var landlordWon = winner === G.landlord;
    var myWon = (G.landlord === 0 && landlordWon) || (G.landlord !== 0 && !landlordWon);
    data = App.store.load();
    if (myWon) {
      data.stars.game = (data.stars.game || 0) + 1;
      data.games.won = (data.games.won || 0) + 1;
      App.store.save(data);
    }
    App.logActivity(data, '斗地主' + (myWon ? '胜利' : '失败'));

    App.el('game').classList.add('hidden');
    App.el('overEmoji').textContent = myWon ? '🎉' : '😅';
    App.el('overTitle').textContent = myWon ? '你赢了！' : '差一点，再试试！';
    App.el('overLine').textContent =
      (G.landlord === 0 ? '你是地主' : '你是农民') +
      (myWon ? ' · 奖励 1⭐' : ' · 下次加油');
    var again = App.el('overAgain');
    if (data.chances > 0) {
      again.disabled = false;
      again.textContent = '🔄 再来一局（还剩 ' + data.chances + ' 次机会）';
    } else {
      again.disabled = true;
      again.textContent = '🎮 机会用完啦，做作业赚积分吧';
    }
    App.el('overlay').classList.remove('hidden');
    renderLobby();
  }

  App.el('overAgain').addEventListener('click', function () {
    if (!App.useChance(data)) { App.toast('没有游戏机会啦'); return; }
    renderLobby();
    newGame();
  });

  App.el('overHome').addEventListener('click', function () {
    window.location.href = 'index.html';
  });
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

  function cardText(c) {
    var r = c.rank === 'S' ? '小王' : c.rank === 'B' ? '大王' : rankLabel(c.rank);
    return r + (c.suit || '');
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
          s.textContent = cardText(c);
          cards.appendChild(s);
        });
        row.appendChild(cards);
      }
      box.appendChild(row);
    });
    box.scrollTop = box.scrollHeight;
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
    });

    var p1 = G.hands[0];

    // 机器人最近出的牌
    [1, 2].forEach(function (i) {
      var box = App.el('bot' + i + 'Play');
      box.innerHTML = '';
      if (G.lastPlayer === i && G.lastPlay) {
        box.innerHTML = G.lastPlay.cards.map(cardHTML).join('');
      } else if (G.lastPass === i) {
        box.textContent = '不要';
      }
    });
  }

  function renderHand() {
    var box = App.el('myHand');
    box.innerHTML = '';
    if (!G) return;
    G.hands[0].forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ddz-card ' + (c.suit === '♥' || c.suit === '♦' || c.rank === 'B' ? 'red' : 'black') +
        (c.rank === 'S' || c.rank === 'B' ? ' joker' : '');
      b.setAttribute('data-id', c.id);
      if (mySelection[c.id]) b.classList.add('sel');
      var suit = c.rank === 'S' || c.rank === 'B' ? '王' : c.suit;
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
      bottom.innerHTML = G.bottom.map(function (c) { return cardHTML(c); }).join('');
    } else {
      bottom.innerHTML = '<span class="ddz-bottom-hint">🂠 底牌（叫完地主揭晓）</span>';
    }
  }

  renderLobby();
  App.setStarsUI();
})();
