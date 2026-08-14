/* 阅读：分级内容、语音播放、AI 逐字匹配评分 */
(function () {
  'use strict';

  var GRADE_KEY = 'xx3_yw_grade';
  var grade = '1';
  var idx = 0;
  var data = App.store.load();
  var today = App.todayStr();

  var rec = null;
  var recording = false;
  var computing = false;
  var recFinal = '';
  var recInterim = '';
  var expected = [];
  var spans = [];

  function loadGrade() {
    try {
      var g = localStorage.getItem(GRADE_KEY);
      if (g && window.READINGS[g]) grade = g;
    } catch (e) { /* ignore */ }
  }

  function saveGrade() {
    try { localStorage.setItem(GRADE_KEY, grade); } catch (e) { /* ignore */ }
  }

  function doneToday(id) {
    var r = data.awarded.reading && data.awarded.reading['r_' + id];
    return !!(r && r.date === today && r.points > 0);
  }

  function renderGrades() {
    var box = App.el('rdGrades');
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
        renderList();
        App.el('rdDetail').classList.add('hidden');
        App.el('rdList').classList.remove('hidden');
      });
      box.appendChild(b);
    });
  }

  function renderList() {
    var box = App.el('rdListBox');
    box.innerHTML = '';
    (window.READINGS[grade] || []).forEach(function (p, i) {
      var item = document.createElement('button');
      item.className = 'science-item';
      item.innerHTML =
        '<div class="si-emoji">📖</div>' +
        '<div><div class="si-title">' + p.title + '</div>' +
        '<div class="si-done" style="font-weight:500;color:var(--muted);font-size:.8rem">' + p.text.length + ' 字</div></div>' +
        (doneToday(p.id) ? '<div class="si-done">✅</div>' : '');
      item.addEventListener('click', function () { openPassage(i); });
      box.appendChild(item);
    });
  }

  function currentPassage() {
    return window.READINGS[grade][idx];
  }

  function openPassage(i) {
    stopRec();
    idx = i;
    data = App.store.load();
    var p = currentPassage();
    App.el('rdTitle').textContent = p.title;
    renderText();
    resetRecBtn();
    App.el('rdLive').textContent = '';
    App.el('rdResult').classList.add('hidden');
    App.el('rdList').classList.add('hidden');
    App.el('rdDetail').classList.remove('hidden');
    window.scrollTo(0, 0);
  }

  function norm(s) { return (s || '').replace(/[^\u4e00-\u9fff]/g, ''); }

  function renderText() {
    var text = currentPassage().text;
    expected = norm(text).split('');
    var box = App.el('rdText');
    box.innerHTML = '';
    spans = [];
    var ei = 0;
    text.split('').forEach(function (ch) {
      var s = document.createElement('span');
      s.textContent = ch;
      if (/[\u4e00-\u9fff]/.test(ch)) {
        s.dataset.i = ei;
        spans.push({ el: s, i: ei });
        ei++;
      } else {
        s.className = 'rd-punct';
      }
      box.appendChild(s);
    });
  }

  /* 最长公共子序列对齐：返回 expected 中被匹配到的下标 */
  function alignLCS(a, b) {
    var m = a.length, n = b.length;
    if (!m || !n) return [];
    var dp = [];
    for (var i = 0; i <= m; i++) dp.push(new Array(n + 1).fill(0));
    for (i = m - 1; i >= 0; i--) {
      for (var j = n - 1; j >= 0; j--) {
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    var out = [];
    i = 0; j = 0;
    while (i < m && j < n) {
      if (a[i] === b[j]) { out.push(i); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
      else j++;
    }
    return out;
  }

  function renderMatch() {
    var R = norm(recFinal + recInterim).split('');
    var matched = alignLCS(expected, R);
    var set = {};
    matched.forEach(function (i) { set[i] = true; });
    var progress = matched.length ? matched[matched.length - 1] : -1;
    spans.forEach(function (sp) {
      sp.el.classList.toggle('rd-ok', !!set[sp.i]);
      sp.el.classList.toggle('rd-err', !set[sp.i] && sp.i <= progress);
      sp.el.classList.toggle('rd-pending', !set[sp.i] && sp.i > progress);
    });
  }

  function resetRecBtn() {
    var btn = App.el('rdRec');
    btn.textContent = '🎤 开始阅读';
    btn.classList.remove('recording');
    btn.disabled = false;
  }

  function stopRec() {
    recording = false;
    if (rec) {
      try { rec.onend = null; rec.stop(); } catch (e) { /* ignore */ }
      rec = null;
    }
    resetRecBtn();
  }

  function startRead() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { App.toast('此设备不支持语音识别'); return; }
    if (!window.isSecureContext) {
      App.toast('语音识别需要安全连接：请用 https 网址打开i同步学');
      return;
    }
    App.stopSpeak();
    try {
      computing = false;
      rec = new SR();
      rec.lang = 'zh-CN';
      rec.continuous = true;
      rec.interimResults = true;
      recFinal = '';
      recInterim = '';
      recording = true;
      App.el('rdRec').textContent = '⏹ 停止阅读';
      App.el('rdRec').classList.add('recording');
      App.el('rdLive').textContent = '🎙️ 开始朗读，读对的字会变绿，读错的会标红';
      App.el('rdResult').classList.add('hidden');
      renderMatch();

      rec.onresult = function (e) {
        var interim = '';
        for (var i = e.resultIndex; i < e.results.length; i++) {
          var t = e.results[i][0].transcript;
          if (e.results[i].isFinal) recFinal += t;
          else interim += t;
        }
        recInterim = interim;
        App.el('rdLive').textContent = (recFinal + interim) || '🎙️ 正在听…';
        renderMatch();
      };
      rec.onerror = function (e) {
        var err = e.error || 'unknown';
        if (err === 'aborted') return;
        if (computing) return;
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          App.toast('麦克风权限被拒绝：在 Safari 地址栏左侧点「权限」允许麦克风');
        } else if (err === 'no-speech') {
          App.toast('没有听清，请靠近麦克风大声读');
        } else if (err === 'network') {
          App.toast('语音识别需要网络，请检查网络后重试');
        } else {
          App.toast('识别出错：' + err + '，请重试');
        }
        recording = false;
        if (!computing) resetRecBtn();
      };
      rec.onend = function () {
        if (recording) finishRead();
      };
      rec.start();
    } catch (err) {
      recording = false;
      resetRecBtn();
      App.toast('无法开始语音识别，请重试');
    }
  }

  function stopRead() {
    if (!rec || computing) return;
    computing = true;
    recording = false;
    var btn = App.el('rdRec');
    btn.textContent = '⏳ 正在计算得分中…';
    btn.disabled = true;
    try { rec.stop(); } catch (e) { /* ignore */ }
    setTimeout(function () {
      computing = false;
      finishRead();
    }, 700);
  }

  function finishRead() {
    recording = false;
    resetRecBtn();
    var p = currentPassage();
    var text = recFinal;
    App.el('rdLive').textContent = text || '（没有识别到内容，再试一次）';
    var matched = alignLCS(expected, norm(text).split(''));
    var set = {};
    matched.forEach(function (i) { set[i] = true; });
    spans.forEach(function (sp) {
      sp.el.classList.toggle('rd-ok', !!set[sp.i]);
      sp.el.classList.toggle('rd-err', !set[sp.i]);
    });
    if (!text) {
      App.el('rdResult').classList.remove('hidden');
      App.el('rdResult').innerHTML = '<div class="rr-score">没有识别到内容</div><div>请靠近麦克风大声朗读</div>';
      return;
    }
    var score = App.reciteScore(p.text, text);
    showResult(p, score);
  }

  function showResult(p, score) {
    var box = App.el('rdResult');
    box.classList.remove('hidden');
    var pass = score.points > 0;
    var html = '<div class="rr-score">准确率 ' + score.accuracy + '%' + (pass ? ' ✅' : ' ❌') + '</div>';
    html += '<div>' + (pass ? '读得很棒！' : '没有通过，要 ≥60% 才能得星星哦') + '</div>';

    data = App.store.load();
    if (!data.awarded.reading) data.awarded.reading = {};
    var key = 'r_' + p.id;
    var rec2 = data.awarded.reading[key];
    if (!rec2 || rec2.date !== today) rec2 = { date: today, best: 0, points: 0 };
    if (score.accuracy > rec2.best) {
      rec2.best = score.accuracy;
      var diff = score.points - rec2.points;
      if (diff > 0) {
        rec2.points = score.points;
        App.addStars(data, 'yuwen', diff);
        App.logActivity(data, '阅读《' + p.title + '》准确率' + score.accuracy + '%');
        html += '<div class="rr-gain">🎉 星星 +' + diff + '，现在一共 ' + (data.balance || 0) + ' 颗</div>';
      } else {
        html += '<div class="rr-gain dim">刷新了今天的最好成绩（星星档位不变）</div>';
      }
      data.awarded.reading[key] = rec2;
      App.store.save(data);
    } else {
      html += '<div class="rr-gain dim">今天这篇的最好成绩是 ' + rec2.best + '%，再练练能拿更多星星</div>';
    }
    box.innerHTML = html;
    App.setStarsUI();
    renderList();
  }

  App.el('rdPlay').addEventListener('click', function () {
    App.speak(currentPassage().text, 'zh-CN', 0.95);
  });

  App.el('rdRec').addEventListener('click', function () {
    if (recording) stopRead();
    else startRead();
  });

  loadGrade();
  renderGrades();
  renderList();
  App.setStarsUI();
})();
