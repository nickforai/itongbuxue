/* 生字：读音、组词、笔顺动画 + 三步学习标记（看笔顺/听读音/认一认） */
(function () {
  'use strict';

  var GRADE_KEY = 'xx3_yw_grade';
  var grade = '1';
  var idx = 0;
  var writer = null;
  var data = App.store.load();

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
    return (data.learned && data.learned[charKey(c)]) || null;
  }

  function renderGrades() {
    var box = App.el('charGrades');
    box.innerHTML = '';
    ['1', '2', '3', '4', '5', '6'].forEach(function (g) {
      var b = document.createElement('button');
      b.textContent = (g === '1' ? '一年级' : g === '2' ? '二年级' : g === '3' ? '三年级' : g === '4' ? '四年级' : g === '5' ? '五年级' : '六年级');
      if (g === grade) b.classList.add('on');
      b.addEventListener('click', function () {
        grade = g;
        saveGrade();
        data = App.store.load();
        renderGrades();
        renderGrid();
        App.el('charDetail').classList.add('hidden');
        App.el('charList').classList.remove('hidden');
      });
      box.appendChild(b);
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
    App.el('learnProgress').textContent = '已学会 ' + learnedCount + ' / ' + list.length + ' 个字';
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
    renderQuiz(item.c);
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
    var st = data.learned[charKey(c)] || { stroke: false, listen: false, quiz: false, learned: '' };
    if (!st[step]) {
      st[step] = true;
      if (st.stroke && st.listen && st.quiz && !st.learned) {
        st.learned = App.todayStr();
        App.addStars(data, 'yuwen', 1);
        App.logActivity(data, '学会生字「' + c + '」');
        App.toast('🎉 学会「' + c + '」了！+1⭐');
      }
      data.learned[charKey(c)] = st;
      App.store.save(data);
      renderGrid();
      renderLearnUI(c);
    }
  }

  function renderLearnUI(c) {
    var st = getLearn(c) || { stroke: false, listen: false, quiz: false, learned: '' };
    var steps = [
      { k: 'stroke', label: '① 看笔顺' },
      { k: 'listen', label: '② 听读音' },
      { k: 'quiz', label: '③ 认一认' }
    ];
    App.el('charSteps').innerHTML = steps.map(function (s) {
      return '<span class="learn-step' + (st[s.k] ? ' on' : '') + '">' + s.label + '</span>';
    }).join('') + (st.learned ? '<span class="learn-done">✅ 已学会</span>' : '');
  }

  function renderQuiz(c) {
    var list = window.CHARS[grade];
    var others = App.shuffle(list.map(function (x) { return x.c; }).filter(function (x) { return x !== c; })).slice(0, 3);
    var options = App.shuffle([c].concat(others));
    App.el('cqPinyin').textContent = window.CHARS[grade].find(function (x) { return x.c === c; }).p;
    var box = App.el('cqOptions');
    box.innerHTML = '';
    options.forEach(function (ch) {
      var b = document.createElement('button');
      b.textContent = ch;
      b.addEventListener('click', function () {
        if (ch === c) {
          markStep(c, 'quiz');
          renderQuiz(c);
          App.toast('✓ 认对了！');
        } else {
          b.classList.add('wrongpick');
          App.toast('再想想，是哪一个字？');
          setTimeout(function () { b.classList.remove('wrongpick'); }, 500);
        }
      });
      box.appendChild(b);
    });
  }

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

  loadGrade();
  renderGrades();
  renderGrid();
  App.setStarsUI();
})();
