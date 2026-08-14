/* i同步学 · 错题重练：四科错题统一复习，答对自动移出错题本 */
(function () {
  'use strict';

  var data = App.store.load();
  var queue = [];      // 本轮要练的错题
  var idx = 0;
  var score = 0;
  var answered = false;
  var mathInput = '';

  var SUBJECTS = [
    { key: 'shuxue', name: '数学口算', emoji: '🔢' },
    { key: 'yingyu', name: '英语单词', emoji: '🔤' },
    { key: 'yuwen', name: '语文生字', emoji: '📖' },
    { key: 'kexue', name: '科学问答', emoji: '🔬' }
  ];

  function sig(type, q) {
    if (type === 'shuxue') return q.text + '|' + q.answer + '|' + q.yours;
    if (type === 'yingyu') return q.word + '|' + q.yours;
    if (type === 'yuwen') return q.char + '|' + q.pinyin;
    if (type === 'kexue') return q.text + '|' + q.yours;
    return '';
  }

  function renderSummary() {
    var total = 0;
    var html = '';
    SUBJECTS.forEach(function (s) {
      var n = (data.wrong[s.key] || []).length;
      total += n;
      html += '<div class="wrong-sum-row">' + s.emoji + ' ' + s.name + ' <b>' + n + '</b> 道</div>';
    });
    App.el('wrongSummary').innerHTML = total > 0
      ? html + '<p class="muted-note">共 <b>' + total + '</b> 道错题等着你，答对一道就少一道！</p>'
      : '<p style="color:var(--ok);font-weight:700">🎉 错题本空空如也，太棒啦！</p>';
    var btn = App.el('startBtn');
    btn.disabled = total === 0;
    btn.textContent = total > 0 ? '✏️ 开始重练（' + total + ' 题）' : '✏️ 开始重练';
    App.el('starPill').textContent = '⭐ ' + (data.balance || 0);
  }

  function allZhWords() {
    return (window.WordBank && window.WordBank.all || []).map(function (w) { return w.zh; });
  }

  function allChars() {
    var out = [];
    if (window.CHARS) {
      Object.keys(window.CHARS).forEach(function (g) {
        (window.CHARS[g] || []).forEach(function (c) { out.push(c.c); });
      });
    }
    return out;
  }

  function allScienceOptions() {
    var out = [];
    if (window.Science) {
      window.Science.topics.forEach(function (t) {
        t.questions.forEach(function (q) { out = out.concat(q.options); });
      });
    }
    return out;
  }

  function buildQueue() {
    var qs = [];
    SUBJECTS.forEach(function (s) {
      (data.wrong[s.key] || []).forEach(function (q) {
        if (!sig(s.key, q)) return;
        qs.push({ type: s.key, q: q });
      });
    });
    return App.shuffle(qs).slice(0, 20);
  }

  function renderQuestion() {
    var item = queue[idx];
    answered = false;
    mathInput = '';
    App.el('redoProgress').textContent = '第 ' + (idx + 1) + ' / ' + queue.length + ' 题';
    App.el('redoScore').textContent = '答对 ' + score + ' 题';
    App.el('redoFeedback').textContent = '';

    var qText = App.el('redoQText');
    var optBox = App.el('redoOptions');
    var pad = App.el('redoPad');
    optBox.innerHTML = '';
    pad.classList.add('hidden');

    if (item.type === 'shuxue') {
      qText.textContent = item.q.text + ' = ?';
      qText.style.fontSize = '2.2rem';
      pad.classList.remove('hidden');
    } else if (item.type === 'yingyu') {
      qText.textContent = '🔤 ' + item.q.word + '\n它的意思是？';
      qText.style.fontSize = '1.6rem';
      var zhPool = allZhWords().filter(function (z) { return z !== item.q.zh; });
      var opts = App.shuffle(zhPool).slice(0, 3).concat([item.q.zh]);
      renderOptions(opts, item.q.zh);
    } else if (item.type === 'yuwen') {
      qText.textContent = '📖 拼音「' + item.q.pinyin + '」，选出正确的字';
      qText.style.fontSize = '1.6rem';
      var charPool = allChars().filter(function (c) { return c !== item.q.char; });
      var cOpts = App.shuffle(charPool).slice(0, 3).concat([item.q.char]);
      renderOptions(cOpts, item.q.char);
    } else if (item.type === 'kexue') {
      qText.textContent = '🔬 ' + item.q.text;
      qText.style.fontSize = '1.35rem';
      var ansPool = allScienceOptions()
        .concat((data.wrong.kexue || []).map(function (w) { return w.answer; }))
        .filter(function (a) { return a !== item.q.answer; });
      var kOpts = App.shuffle(ansPool).slice(0, 3).concat([item.q.answer]);
      renderOptions(kOpts, item.q.answer);
    }
  }

  function renderOptions(opts, correct) {
    var box = App.el('redoOptions');
    App.shuffle(opts).forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = o;
      b.addEventListener('click', function () { pick(b, o, correct); });
      box.appendChild(b);
    });
  }

  function pick(btn, choice, correct) {
    if (answered) return;
    answered = true;
    var fb = App.el('redoFeedback');
    var btns = App.el('redoOptions').querySelectorAll('button');
    if (choice === correct) {
      score++;
      btn.classList.add('correct');
      fb.textContent = '✓ 对啦！这道题从错题本消失啦！';
      removeWrong(queue[idx]);
    } else {
      btn.classList.add('wrongpick');
      btns.forEach(function (b) { if (b.textContent === correct) b.classList.add('correct'); else b.classList.add('dim'); });
      fb.textContent = '✗ 正确答案是「' + correct + '」，再复习一下吧';
    }
    setTimeout(next, 950);
  }

  function removeWrong(item) {
    var list = data.wrong[item.type] || [];
    var s = sig(item.type, item.q);
    for (var i = 0; i < list.length; i++) {
      if (sig(item.type, list[i]) === s) {
        list.splice(i, 1);
        break;
      }
    }
    data.wrong[item.type] = list;
    App.store.save(data);
  }

  function next() {
    idx++;
    if (idx >= queue.length) { showResult(); return; }
    renderQuestion();
  }

  function showResult() {
    var total = queue.length;
    var reward = score === total ? 3 : 2;
    var emoji = score === total ? '🏆' : score >= Math.ceil(total * 0.8) ? '🎉' : '👍';

    data = App.store.load();
    var today = App.todayStr();
    if (!data.awarded.quizzes) data.awarded.quizzes = {};
    var rec = data.awarded.quizzes.redo;
    if (rec === true) rec = { date: today, best: total, points: 3 };
    else if (!rec || rec.date !== today) rec = { date: today, best: 0, points: 0 };
    var diff = 0;
    if (rec.points === 0) {
      diff = reward;
      rec.points = reward;
      rec.best = score;
      App.addStars(data, 'redo', diff);
    } else if (score > rec.best) {
      rec.best = score;
    }
    data.awarded.quizzes.redo = rec;
    App.addTask(data);
    App.logActivity(data, '错题重练 ' + score + '/' + total);
    App.store.save(data);

    App.el('quizPanel').classList.add('hidden');
    App.el('resultPanel').classList.remove('hidden');
    App.el('redoEmoji').textContent = emoji;
    App.el('redoScoreBig').textContent = score + ' / ' + total;
    App.el('redoResultLine').textContent = diff > 0
      ? '🎉 星星 +' + diff + ' · 答对的题已移出错题本'
      : '今天已经领过奖励，继续加油巩固！';
    App.setStarsUI();
  }

  /* 数学数字键盘 */
  App.el('redoPad').addEventListener('click', function (e) {
    var k = e.target.getAttribute && e.target.getAttribute('data-k');
    if (!k || answered) return;
    if (k === 'del') {
      mathInput = mathInput.slice(0, -1);
    } else if (k === 'ok') {
      submitMath();
      return;
    } else {
      mathInput = (mathInput + k).slice(0, 6);
    }
    updateMathDisplay();
  });

  function updateMathDisplay() {
    var disp = App.el('redoQText');
    var q = queue[idx].q;
    disp.textContent = q.text + ' = ' + (mathInput || '?');
  }

  function submitMath() {
    if (!mathInput) { App.toast('先按数字输入答案哦'); return; }
    var q = queue[idx].q;
    var user = parseInt(mathInput, 10);
    var right = user === q.answer;
    answered = true;
    var fb = App.el('redoFeedback');
    var disp = App.el('redoQText');
    if (right) {
      score++;
      disp.textContent = '✓ ' + q.text + ' = ' + q.answer;
      fb.textContent = '✓ 对啦！这道题从错题本消失啦！';
      removeWrong(queue[idx]);
    } else {
      disp.textContent = '✗ ' + q.text + ' = ' + q.answer + '（你答 ' + user + '）';
      fb.textContent = '✗ 再想想，正确答案是 ' + q.answer;
    }
    setTimeout(next, 1000);
  }

  App.el('startBtn').addEventListener('click', function () {
    data = App.store.load();
    queue = buildQueue();
    if (!queue.length) { App.toast('没有错题可练啦'); return; }
    idx = 0;
    score = 0;
    App.el('startPanel').classList.add('hidden');
    App.el('resultPanel').classList.add('hidden');
    App.el('quizPanel').classList.remove('hidden');
    renderQuestion();
  });

  App.el('redoAgainBtn').addEventListener('click', function () {
    data = App.store.load();
    queue = buildQueue();
    if (!queue.length) {
      App.toast('错题本清空啦，太棒了！');
      App.el('resultPanel').classList.add('hidden');
      App.el('startPanel').classList.remove('hidden');
      renderSummary();
      return;
    }
    idx = 0;
    score = 0;
    App.el('resultPanel').classList.add('hidden');
    App.el('quizPanel').classList.remove('hidden');
    renderQuestion();
  });

  renderSummary();
})();
