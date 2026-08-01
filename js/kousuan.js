/* 数学口算 */
(function () {
  'use strict';

  var data = App.store.load();
  var QUESTION_COUNT = 10;
  var wrongCache = {}; // 题目文本 -> 已收录，避免重复

  data.wrong.shuxue.forEach(function (q) { wrongCache[q.text] = true; });

  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  function makeSet(gen) {
    var qs = [];
    var guard = 0;
    while (qs.length < QUESTION_COUNT && guard < 500) {
      guard++;
      var q = gen();
      if (qs.some(function (x) { return x.text === q.text; })) continue;
      qs.push(q);
    }
    return qs;
  }

  /* 难度生成器 */
  function genL1() {
    var mode = rnd(0, 2);
    if (mode === 0) { // 不退位减法
      var a = rnd(2, 20), b = rnd(1, Math.min(a, 10));
      return { text: a + ' - ' + b, answer: a - b };
    }
    if (mode === 1) { // 进位加法
      var a1 = rnd(1, 9), b1 = rnd(1, 9);
      return { text: a1 + ' + ' + b1, answer: a1 + b1 };
    }
    var a2 = rnd(2, 9), b2 = rnd(2, 9); // 乘法口诀
    return { text: a2 + ' × ' + b2, answer: a2 * b2 };
  }

  function genL2() {
    var mode = rnd(0, 3);
    if (mode === 0) { var a = rnd(12, 99), b = rnd(1, 9); return { text: a + ' + ' + b, answer: a + b }; }
    if (mode === 1) { var c = rnd(12, 99), d = rnd(1, Math.min(9, c - 10)); return { text: c + ' - ' + d, answer: c - d }; }
    if (mode === 2) { var e = rnd(12, 89), f = rnd(1, 3) * 10; return { text: e + ' + ' + f, answer: e + f }; }
    var g = rnd(21, 99), h = rnd(1, 4) * 10;
    return { text: g + ' - ' + h, answer: g - h };
  }

  function genL3() {
    var mode = rnd(0, 2);
    if (mode === 0) { var a = rnd(2, 9), b = rnd(11, 99); return { text: a + ' × ' + b, answer: a * b }; }
    if (mode === 1) { var c = rnd(2, 9), d = rnd(1, 9) * 10; return { text: c + ' × ' + d, answer: c * d }; }
    var e = rnd(1, 9) * 10, f = rnd(1, 9) * 10;
    return { text: e + ' + ' + f, answer: e + f };
  }

  function genL4() {
    var mode = rnd(0, 4);
    if (mode === 0) { var a = rnd(120, 980), b = rnd(10, Math.min(90, a - 20)); return { text: a + ' - ' + b, answer: a - b }; }
    if (mode === 1) { var c = rnd(10, 89) * 10, d = rnd(1, 9) * 10; return { text: c + ' + ' + d, answer: c + d }; }
    if (mode === 2) { var e = rnd(12, 98), f = rnd(2, 9); return { text: e + ' × ' + f, answer: e * f }; }
    if (mode === 3) { var g = rnd(2, 9), h = rnd(2, 9); return { text: (g * h) + ' ÷ ' + g, answer: h }; }
    var j = rnd(2, 9), k = rnd(2, 9) * 10;
    return { text: (j * k) + ' ÷ ' + j, answer: k };
  }

  var LEVELS = [
    { id: 1, name: '入门', emoji: '🌱', desc: '20以内加减\n乘法口诀', gen: genL1 },
    { id: 2, name: '进阶', emoji: '🌿', desc: '两位数加减\n一位数/整十', gen: genL2 },
    { id: 3, name: '挑战', emoji: '🌳', desc: '多位数乘一位数\n整十数加减', gen: genL3 },
    { id: 4, name: '高手', emoji: '🏆', desc: '三位数加减\n乘除口算', gen: genL4 }
  ];

  var state = null;

  function wrongCount(levelId) {
    var map = {};
    data.wrong.shuxue.forEach(function (q) { map[q.level] = (map[q.level] || 0) + 1; });
    return map[levelId] || 0;
  }

  function renderLevels() {
    var grid = App.el('levelGrid');
    grid.innerHTML = '';
    LEVELS.forEach(function (lv) {
      var card = document.createElement('button');
      card.className = 'level-card';
      var wc = wrongCount(lv.id);
      card.innerHTML =
        '<div class="lv-emoji">' + lv.emoji + '</div>' +
        '<div class="lv-name">' + lv.name + '</div>' +
        '<div class="lv-desc">' + lv.desc.replace('\n', '<br>') + '</div>' +
        (wc > 0 ? '<div class="lv-wrong">📕 错题 ' + wc + ' 道待复习</div>' : '');
      card.addEventListener('click', function () { startGame(lv); });
      grid.appendChild(card);
    });
  }

  function startGame(lv) {
    data = App.store.load();
    state = {
      level: lv,
      questions: makeSet(lv.gen),
      index: 0,
      input: '',
      wrong: [],
      score: 0,
      start: Date.now(),
      locked: false
    };
    App.el('levelLabel').textContent = '难度：' + lv.name;
    App.el('levelScreen').classList.add('hidden');
    App.el('resultScreen').classList.add('hidden');
    App.el('gameScreen').classList.remove('hidden');
    renderQuestion();
  }

  function renderQuestion() {
    var q = state.questions[state.index];
    state.input = '';
    state.locked = false;
    App.el('questionText').textContent = q.text;
    App.el('progressLabel').textContent = '第 ' + (state.index + 1) + ' / ' + state.questions.length + ' 题';
    renderDots();
    renderAnswer();
  }

  function renderDots() {
    var dots = App.el('dots');
    dots.innerHTML = '';
    state.questions.forEach(function (_, i) {
      var dot = document.createElement('span');
      dot.className = 'dot' + (i < state.index || (i === state.index && state.input.length > 0) ? ' on' : '');
      dots.appendChild(dot);
    });
  }

  function renderAnswer() {
    var disp = App.el('answerDisplay');
    disp.textContent = state.input || '?';
    disp.classList.remove('right', 'wrong');
    renderDots();
  }

  function submitAnswer() {
    if (state.locked) return;
    if (!state.input) { App.toast('先按数字输入答案哦'); return; }

    var q = state.questions[state.index];
    var user = parseInt(state.input, 10);
    var right = user === q.answer;
    state.locked = true;
    var disp = App.el('answerDisplay');

    if (right) {
      state.score++;
      disp.textContent = '✓ ' + q.answer;
      disp.classList.add('right');
    } else {
      disp.textContent = '✗ ' + q.answer;
      disp.classList.add('wrong');
      var entry = { level: state.level.id, text: q.text, answer: q.answer, yours: user };
      state.wrong.push(entry);
      if (!wrongCache[q.text]) {
        wrongCache[q.text] = true;
        data.wrong.shuxue.push(entry);
        if (data.wrong.shuxue.length > 30) data.wrong.shuxue.shift();
        App.store.save(data);
      }
    }

    setTimeout(function () {
      state.index++;
      if (state.index >= state.questions.length) {
        showResult();
      } else {
        renderQuestion();
      }
    }, 750);
  }

  function showResult() {
    var score = state.score;
    var stars = score >= 10 ? 3 : score >= 8 ? 2 : score >= 5 ? 1 : 0;
    var emoji = score === 10 ? '🏆' : score >= 8 ? '🎉' : score >= 5 ? '👍' : '💪';
    var elapsed = Math.round((Date.now() - state.start) / 1000);
    var min = Math.floor(elapsed / 60), sec = elapsed % 60;

    App.addStars(data, 'shuxue', stars);
    App.logActivity(data, '口算 ' + state.level.name + ' ' + score + '/10');
    App.setStarsUI();

    App.el('gameScreen').classList.add('hidden');
    App.el('resultEmoji').textContent = emoji;
    App.el('resultScore').textContent = score + ' / 10';
    App.el('resultLine').textContent = '用时 ' + min + ' 分 ' + sec + ' 秒 · 获得 ' + stars + ' ⭐';

    var wl = App.el('wrongList');
    wl.innerHTML = '';
    if (state.wrong.length) {
      wl.classList.remove('hidden');
      var title = document.createElement('li');
      title.style.background = 'transparent';
      title.innerHTML = '<span>📕 错题（已收进错题本）</span><span></span>';
      wl.appendChild(title);
      state.wrong.forEach(function (q) {
        var li = document.createElement('li');
        li.innerHTML = '<span>' + q.text + ' = <span class="wr-ans">' + q.answer + '</span></span>' +
          '<span class="wr-yours">你答 ' + q.yours + '</span>';
        wl.appendChild(li);
      });
    } else {
      wl.classList.add('hidden');
    }

    App.el('resultScreen').classList.remove('hidden');
  }

  function buildKeypad() {
    var pad = App.el('keypad');
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];
    pad.innerHTML = '';
    keys.forEach(function (k) {
      var b = document.createElement('button');
      b.textContent = k;
      if (k === '⌫') b.className = 'pad-del';
      if (k === '✓') { b.className = 'pad-ok'; b.textContent = '确 定'; }
      b.addEventListener('click', function () {
        if (k === '⌫') { state.input = state.input.slice(0, -1); renderAnswer(); }
        else if (k === '✓') { submitAnswer(); }
        else {
          if (state.input.length >= 4) { App.toast('答案最多 4 位数'); return; }
          state.input += k;
          renderAnswer();
        }
      });
      pad.appendChild(b);
    });
  }

  App.el('againBtn').addEventListener('click', function () {
    startGame(state.level);
  });
  App.el('changeLevelBtn').addEventListener('click', function () {
    data = App.store.load();
    App.el('gameScreen').classList.add('hidden');
    App.el('resultScreen').classList.add('hidden');
    App.el('levelScreen').classList.remove('hidden');
    renderLevels();
  });
  App.el('homeBtn').addEventListener('click', function () {
    window.location.href = 'index.html';
  });

  renderLevels();
  buildKeypad();
  App.setStarsUI();
})();
