/* 生字：学习（笔顺/读音/学完了）+ 考一考（独立复习测验） */
(function () {
  'use strict';

  var GRADE_KEY = 'xx3_yw_grade';
  var grade = '1';
  var idx = 0;
  var writer = null;
  var data = App.store.load();
  var qz = null;
  var qzTimer = null;

  function saveGrade() {
    try { localStorage.setItem(GRADE_KEY, grade); } catch (e) { /* ignore */ }
  }

  function loadGrade() {
    try {
      var g = localStorage.getItem(GRADE_KEY);
      if (g && window.CHARS[g]) grade = g;
    } catch (e) { /* ignore */ }
  }

  function charKey(c) { return grade + '_' + c; }

  function getLearn(c) {
    var st = (data.learned && data.learned[charKey(c)]) || null;
    if (st && st.quiz && !st.done) st.done = true; // 旧数据迁移
    return st;
  }

  function renderGradeChips() {
    ['charGrades', 'quizGrades'].forEach(function (boxId) {
      var box = App.el(boxId);
      box.innerHTML = '';
      ['1', '2', '3', '4', '5', '6'].forEach(function (g) {
        var b = document.createElement('button');
        b.textContent = (g === '1' ? '一年级' : g === '2' ? '二年级' : g === '3' ? '三年级' : g === '4' ? '四年级' : g === '5' ? '五年级' : '六年级');
        if (g === grade) b.classList.add('on');
        b.addEventListener('click', function () {
          grade = g;
          saveGrade();
          data = App.store.load();
          renderGradeChips();
          renderGrid();
          App.el('charDetail').classList.add('hidden');
          App.el('charList').classList.remove('hidden');
          App.el('quizPanel').classList.add('hidden');
          App.el('quizResult').classList.add('hidden');
          App.el('quizStartPanel').classList.remove('hidden');
        });
        box.appendChild(b);
      });
    });
  }

  function renderGrid() {
    var list = window.CHARS[grade] || [];
    var grid = App.el('charGrid');
    grid.innerHTML = '';
    var learnedCount = 0;
    list.forEach(function (item, i) {
      var st = getLearn(item.c);
      if (st && st.learned) learnedCount++;
      var b = document.createElement('button');
      b.className = 'char-cell' + (st && st.learned ? ' learned' : '');
      b.innerHTML = item.c + (st && st.learned ? '<span class="char-done">✅</span>' : '');
      b.addEventListener('click', function () { openChar(i); });
      grid.appendChild(b);
    });
    App.el('learnProgress').textContent = '已学习 ' + learnedCount + ' / ' + list.length + ' 个字';
  }

  function openChar(i) {
    idx = i;
    var list = window.CHARS[grade];
    var item = list[i];
    App.el('charBig').textContent = item.c;
    App.el('charPinyin').textContent = item.p;
    App.el('charWords').innerHTML = item.w.map(function (w) {
      return '<span class="char-word">' + w + '</span>';
    }).join('');
    App.el('strokeHint').textContent = '看笔顺动画，跟着写一写';
    drawStrokes(item.c);
    markStep(item.c, 'stroke'); // ① 看笔顺：打开即看过动画
    renderLearnUI(item.c);
    App.el('charList').classList.add('hidden');
    App.el('charDetail').classList.remove('hidden');
    window.scrollTo(0, 0);
  }

  function drawStrokes(ch) {
    var box = App.el('strokeBox');
    box.innerHTML = '';
    if (typeof HanziWriter === 'undefined') {
      App.el('strokeHint').textContent = '此设备不支持笔顺动画';
      return;
    }
    writer = HanziWriter.create('strokeBox', ch, {
      width: 230,
      height: 230,
      padding: 12,
      animate: true,
      showOutline: true,
      showCharacter: false,
      strokeAnimationSpeed: 1,
      outlineColor: '#c9c9c9',
      strokeColor: '#2f6fd6',
      highlightColor: '#ffd24d',
      charDataLoader: function (targetChar, onComplete) {
        fetch('js/vendor/hanzi-data/' + encodeURIComponent(targetChar) + '.json')
          .then(function (r) { return r.json(); })
          .then(function (d) {
            App.el('strokeHint').textContent = targetChar + ' 共 ' + d.strokes.length + ' 画，看动画跟着写';
            onComplete(d);
          })
          .catch(function () {
            App.el('strokeHint').textContent = '笔顺数据加载失败';
            onComplete(null);
          });
      }
    });
    setTimeout(function () {
      if (writer) {
        try { writer.animateCharacter(); } catch (e) { /* ignore */ }
      }
    }, 1400);
  }

  /* ---------- 三步学习 ---------- */
  function markStep(c, step) {
    data = App.store.load();
    if (!data.learned) data.learned = {};
    var st = data.learned[charKey(c)] || { stroke: false, listen: false, done: false, learned: '' };
    if (st.quiz && !st.done) st.done = true;
    if (!st[step]) {
      st[step] = true;
      if (st.stroke && st.listen && st.done && !st.learned) {
        st.learned = App.todayStr();
        App.addStars(data, 'yuwen', 1);
        App.logActivity(data, '学完生字「' + c + '」');
        App.toast('🎉 学完「' + c + '」了！+1⭐');
      }
      data.learned[charKey(c)] = st;
      App.store.save(data);
      renderGrid();
      renderLearnUI(c);
    }
  }

  function renderLearnUI(c) {
    var st = getLearn(c) || { stroke: false, listen: false, done: false, learned: '' };
    var steps = [
      { k: 'stroke', label: '① 看笔顺' },
      { k: 'listen', label: '② 听读音' },
      { k: 'done', label: '③ 学完了' }
    ];
    App.el('charSteps').innerHTML = steps.map(function (s) {
      return '<span class="learn-step' + (st[s.k] ? ' on' : '') + '">' + s.label + '</span>';
    }).join('') + (st.learned ? '<span class="learn-done">✅ 已学习</span>' : '');
  }

  /* ---------- 考一考 ---------- */
  function learnedChars() {
    return (window.CHARS[grade] || []).filter(function (item) {
      var st = getLearn(item.c);
      return st && st.learned;
    });
  }

  function startQuiz() {
    var today = App.todayStr();
    var list = (window.CHARS[grade] || []).filter(function (item) {
      var st = getLearn(item.c);
      return st && st.learned && st.learned !== today; // 今天刚学的字明天才考
    });
    if (!list.length) {
      App.toast(learnedChars().length ? '今天刚学的字明天才能考，先去学更多字吧' : '还没有已学习的字，先去「学习」页学几个吧');
      return;
    }
    var picked = App.shuffle(list).slice(0, 10);
    qz = {
      list: picked,
      idx: 0,
      score: 0,
      wrong: [],
      answered: false
    };
    App.el('quizStartPanel').classList.add('hidden');
    App.el('quizResult').classList.add('hidden');
    App.el('quizPanel').classList.remove('hidden');
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    var q = qz.list[qz.idx];
    qz.answered = false;
    App.el('quizProgress').textContent = '第 ' + (qz.idx + 1) + ' / ' + qz.list.length + ' 题';
    App.el('quizScore').textContent = '答对 ' + qz.score + ' 题';
    App.el('cqPinyin').textContent = q.p;
    App.el('cqFeedback').textContent = '';
    var others = App.shuffle(window.CHARS[grade].map(function (x) { return x.c; }).filter(function (x) { return x !== q.c; })).slice(0, 3);
    var options = App.shuffle([q.c].concat(others));
    var box = App.el('cqOptions');
    box.innerHTML = '';
    options.forEach(function (ch) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = ch;
      b.addEventListener('click', function () {
        if (qz.answered) return;
        qz.answered = true;
        if (ch === q.c) {
          qz.score++;
          App.el('cqFeedback').textContent = '✓ 对啦！';
          App.toast('✓ 对啦！');
        } else {
          b.classList.add('wrongpick');
          qz.wrong.push({ char: q.c, pinyin: q.p });
          App.el('cqFeedback').textContent = '正确答案是「' + q.c + '」，已记进错题本';
          App.toast('✗ 记进错题本啦');
        }
        App.el('quizScore').textContent = '答对 ' + qz.score + ' 题';
        clearTimeout(qzTimer);
        qzTimer = setTimeout(function () {
          qz.idx++;
          if (qz.idx >= qz.list.length) showQuizResult();
          else renderQuizQuestion();
        }, 900);
      });
      box.appendChild(b);
    });
  }

  function showQuizResult() {
    var n = qz.list.length;
    var stars = qz.score === n ? 3 : qz.score >= Math.ceil(n * 0.8) ? 2 : qz.score >= Math.ceil(n * 0.6) ? 1 : 0;
    var emoji = qz.score === n ? '🏆' : qz.score >= Math.ceil(n * 0.8) ? '🎉' : '👍';
    data = App.store.load();
    App.addStars(data, 'yuwen', stars);
    qz.wrong.forEach(function (w) { data.wrong.yuwen.push(w); });
    if (data.wrong.yuwen.length > 30) data.wrong.yuwen = data.wrong.yuwen.slice(-30);
    App.store.save(data);
    App.logActivity(data, '生字考一考 ' + qz.score + '/' + n);
    App.setStarsUI();

    App.el('quizPanel').classList.add('hidden');
    App.el('quizResultEmoji').textContent = emoji;
    App.el('quizResultScore').textContent = qz.score + ' / ' + n;
    App.el('quizResultLine').textContent = '获得 ' + stars + ' ⭐';
    var wl = App.el('quizWrongList');
    wl.innerHTML = '';
    if (qz.wrong.length) {
      wl.classList.remove('hidden');
      qz.wrong.forEach(function (w) {
        var li = document.createElement('li');
        li.innerHTML = '<span>' + w.char + '（' + w.pinyin + '）</span><span class="wr-yours">记入错题本</span>';
        wl.appendChild(li);
      });
    } else {
      wl.classList.add('hidden');
    }
    App.el('quizResult').classList.remove('hidden');
  }

  App.el('learnDoneBtn').addEventListener('click', function () {
    markStep(window.CHARS[grade][idx].c, 'done'); // ③ 学完了
  });

  App.el('charSpeak').addEventListener('click', function () {
    var item = window.CHARS[grade][idx];
    App.speak(item.c + '，' + item.p + '，' + item.w.join('，'), 'zh-CN', 0.75);
    markStep(item.c, 'listen'); // ② 听读音
  });

  App.el('charPrev').addEventListener('click', function () {
    var n = window.CHARS[grade].length;
    openChar((idx - 1 + n) % n);
  });

  App.el('charNext').addEventListener('click', function () {
    openChar((idx + 1) % window.CHARS[grade].length);
  });

  var replayBtn = App.el('strokeReplay');
  if (replayBtn) {
    replayBtn.addEventListener('click', function () {
      if (writer) {
        try { writer.animateCharacter(); } catch (e) { App.toast('重写失败，请重试'); }
      }
    });
  }

  /* ---------- 页签 ---------- */
  App.el('tabLearn').addEventListener('click', function () {
    App.el('tabLearn').classList.add('on');
    App.el('tabQuiz').classList.remove('on');
    App.el('quizSection').classList.add('hidden');
    App.el('learnSection').classList.remove('hidden');
  });
  App.el('tabQuiz').addEventListener('click', function () {
    App.el('tabQuiz').classList.add('on');
    App.el('tabLearn').classList.remove('on');
    App.el('learnSection').classList.add('hidden');
    App.el('quizSection').classList.remove('hidden');
    data = App.store.load();
    renderGradeChips();
  });
  App.el('quizStartBtn').addEventListener('click', startQuiz);
  App.el('quizAgainBtn').addEventListener('click', startQuiz);
  App.el('quizBackLearnBtn').addEventListener('click', function () {
    App.el('tabLearn').click();
  });

  loadGrade();
  renderGradeChips();
  renderGrid();
  App.setStarsUI();
})();
