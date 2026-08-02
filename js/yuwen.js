/* 语文：古诗点读 + 录音背诵评分 */
(function () {
  'use strict';

  var data = App.store.load();
  var idx = 0;
  var today = App.todayStr();

  var rec = null;
  var recording = false;
  var recFinal = '';

  function doneToday(poemId) {
    return data.awarded.poems[poemId] === today;
  }

  function renderList() {
    var list = App.el('poemList');
    list.innerHTML = '';
    window.Poems.forEach(function (p, i) {
      var item = document.createElement('button');
      item.className = 'poem-list-item';
      item.innerHTML =
        '<div class="pi-emoji">📜</div>' +
        '<div><div class="pi-title">' + (i + 1) + '. ' + p.title + '</div>' +
        '<div class="pi-author">' + p.author + '</div></div>' +
        (doneToday(p.id) ? '<div class="pi-done">✅</div>' : '');
      item.addEventListener('click', function () { openPoem(i); });
      list.appendChild(item);
    });
  }

  function openPoem(i) {
    stopRec();
    idx = i;
    data = App.store.load();
    renderDetail();
    App.el('listScreen').classList.add('hidden');
    App.el('detailScreen').classList.remove('hidden');
    window.scrollTo(0, 0);
  }

  function renderDetail() {
    var p = window.Poems[idx];
    App.el('poemTitle').textContent = '《' + p.title + '》';
    App.el('poemAuthor').textContent = p.author;
    App.el('poemLines').innerHTML = p.lines.map(function (l) {
      return '<div>' + l + '</div>';
    }).join('');

    var btn = App.el('reciteBtn');
    if (doneToday(p.id)) {
      btn.textContent = '✅ 今天背过了，明天再背吧！';
      btn.disabled = true;
    } else {
      btn.textContent = '✅ 我会背了 +1⭐';
      btn.disabled = false;
    }
    resetRecBtn();
    App.el('recResult').classList.add('hidden');
    App.el('recLive').textContent = '';
  }

  App.el('readBtn').addEventListener('click', function () {
    App.speak(window.poemText(window.Poems[idx]), 'zh-CN', 0.85);
  });

  App.el('reciteBtn').addEventListener('click', function () {
    var p = window.Poems[idx];
    if (doneToday(p.id)) return;
    data.awarded.poems[p.id] = today;
    App.addStars(data, 'yuwen', 1);
    App.logActivity(data, '背诗《' + p.title + '》');
    App.setStarsUI();
    renderDetail();
    renderList();
    App.toast('《' + p.title + '》背得真棒，+1⭐！');
  });

  App.el('prevBtn').addEventListener('click', function () {
    stopRec();
    idx = (idx - 1 + window.Poems.length) % window.Poems.length;
    data = App.store.load();
    renderDetail();
  });

  App.el('nextBtn').addEventListener('click', function () {
    stopRec();
    idx = (idx + 1) % window.Poems.length;
    data = App.store.load();
    renderDetail();
  });

  /* ---------- 录音背诵 ---------- */
  function targetText(p) {
    return p.lines.join('');
  }

  function resetRecBtn() {
    var btn = App.el('recBtn');
    btn.textContent = '🎤 开始录音';
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

  function startRec() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { App.toast('此设备不支持录音识别'); return; }
    App.stopSpeak();
    try {
      rec = new SR();
      rec.lang = 'zh-CN';
      rec.continuous = true;
      rec.interimResults = true;
      recFinal = '';
      recording = true;
      App.el('recBtn').textContent = '⏹ 停止录音';
      App.el('recBtn').classList.add('recording');
      App.el('recLive').textContent = '🎙️ 正在听…请大声朗读这首诗';
      App.el('recResult').classList.add('hidden');

      rec.onresult = function (e) {
        var interim = '';
        for (var i = e.resultIndex; i < e.results.length; i++) {
          var t = e.results[i][0].transcript;
          if (e.results[i].isFinal) recFinal += t;
          else interim += t;
        }
        App.el('recLive').textContent = (recFinal + interim) || '🎙️ 正在听…';
      };
      rec.onerror = function (e) {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          App.toast('请允许使用麦克风才能录音');
        } else if (e.error === 'no-speech') {
          App.toast('没有听清，再试一次');
        } else {
          App.toast('识别出错：' + e.error);
        }
        recording = false;
        resetRecBtn();
      };
      rec.onend = function () {
        if (recording) finishRec();
      };
      rec.start();
    } catch (err) {
      recording = false;
      resetRecBtn();
      App.toast('无法开始录音，请重试');
    }
  }

  function stopAndFinish() {
    if (!rec) return;
    // 中间状态：告诉孩子正在算分
    var btn = App.el('recBtn');
    btn.textContent = '⏳ 正在计算得分中…';
    btn.disabled = true;
    try { rec.stop(); } catch (e) { finishRec(); }
  }

  function finishRec() {
    recording = false;
    resetRecBtn();
    var p = window.Poems[idx];
    var text = recFinal;
    App.el('recLive').textContent = text || '（没有识别到内容，再试一次）';
    if (!text) {
      App.el('recResult').classList.remove('hidden');
      App.el('recResult').innerHTML = '<div class="rr-score">没有识别到内容</div><div>请靠近麦克风大声朗读</div>';
      updateJifenPill();
      return;
    }
    var score = App.reciteScore(targetText(p), text);
    showReciteResult(p, score);
  }

  function updateJifenPill() {
    data = App.store.load();
    var pill = App.el('jifenPill');
    if (pill) pill.textContent = '💰 ' + (data.jifen || 0);
  }

  function showReciteResult(p, score) {
    var box = App.el('recResult');
    box.classList.remove('hidden');
    var pass = score.points > 0;
    var html = '<div class="rr-score">准确率 ' + score.accuracy + '%' + (pass ? ' ✅' : ' ❌') + '</div>';
    html += '<div>' + (pass ? '通过啦！' : '没有通过，要 ≥60% 才能得积分哦') + '</div>';

    data = App.store.load();
    if (!data.awarded.recite) data.awarded.recite = {};
    var key = 'p_' + p.id;
    var rec2 = data.awarded.recite[key];
    if (!rec2 || rec2.date !== today) rec2 = { date: today, best: 0, points: 0 };
    if (score.accuracy > rec2.best) {
      rec2.best = score.accuracy;
      var diff = score.points - rec2.points;
      if (diff > 0) {
        rec2.points = score.points;
        App.addJifen(data, diff);
        App.logActivity(data, '背诵《' + p.title + '》准确率' + score.accuracy + '%');
        html += '<div class="rr-gain">🎉 积分 +' + diff + '，现在一共 ' + (data.jifen || 0) + ' 分</div>';
      } else {
        html += '<div class="rr-gain dim">刷新了今天的最好成绩（积分档位不变）</div>';
      }
      data.awarded.recite[key] = rec2;
      App.store.save(data);
    } else {
      html += '<div class="rr-gain dim">今天这首诗的最好成绩是 ' + rec2.best + '%，再练练能拿更多积分</div>';
    }
    box.innerHTML = html;
    updateJifenPill();
  }

  App.el('recBtn').addEventListener('click', function () {
    if (recording) stopAndFinish();
    else startRec();
  });

  renderList();
  App.setStarsUI();
  updateJifenPill();
})();
