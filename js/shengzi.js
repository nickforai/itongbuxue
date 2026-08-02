/* 生字：读音、组词、笔顺动画 */
(function () {
  'use strict';

  var GRADE_KEY = 'xx3_yw_grade';
  var grade = '1';
  var idx = 0;
  var writer = null;

  function saveGrade() {
    try { localStorage.setItem(GRADE_KEY, grade); } catch (e) { /* ignore */ }
  }

  function loadGrade() {
    try {
      var g = localStorage.getItem(GRADE_KEY);
      if (g && window.CHARS[g]) grade = g;
    } catch (e) { /* ignore */ }
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
    list.forEach(function (item, i) {
      var b = document.createElement('button');
      b.className = 'char-cell';
      b.textContent = item.c;
      b.addEventListener('click', function () { openChar(i); });
      grid.appendChild(b);
    });
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
          .then(function (data) {
            App.el('strokeHint').textContent = targetChar + ' 共 ' + data.strokes.length + ' 画，看动画跟着写';
            onComplete(data);
          })
          .catch(function () {
            App.el('strokeHint').textContent = '笔顺数据加载失败';
            onComplete(null);
          });
      }
    });
    // 自动重播一遍，确保孩子能看到动画
    setTimeout(function () {
      if (writer) {
        try { writer.animateCharacter(); } catch (e) { /* ignore */ }
      }
    }, 1400);
  }

  App.el('charSpeak').addEventListener('click', function () {
    var item = window.CHARS[grade][idx];
    App.speak(item.c + '，' + item.p + '，' + item.w.join('，'), 'zh-CN', 0.75);
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
