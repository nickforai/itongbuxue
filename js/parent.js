/* 家长空间 */
(function () {
  'use strict';

  var data = App.store.load();

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function dateStr(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function render() {
    data = App.store.load();

    App.el('stTotal').textContent = App.totalStars(data);
    App.el('stStreak').textContent = App.streakDays(data.checkins);
    App.el('stYuwen').textContent = data.stars.yuwen || 0;
    App.el('stShuxue').textContent = data.stars.shuxue || 0;
    App.el('stYingyu').textContent = data.stars.yingyu || 0;
    App.el('stKexue').textContent = data.stars.kexue || 0;
    App.el('stGame').textContent = data.stars.game || 0;
    App.el('stJifen').textContent = data.jifen || 0;
    App.el('stChances').textContent = data.chances || 0;
    App.el('stGames').textContent = (data.games.won || 0) + ' / ' + (data.games.played || 0);

    /* 最近 7 天柱状图 */
    var days = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      days.push(dateStr(d));
    }
    var max = 1;
    days.forEach(function (ds) {
      if (data.stats[ds] && data.stats[ds].n > max) max = data.stats[ds].n;
    });
    var bars = App.el('weekBars');
    bars.innerHTML = '';
    days.forEach(function (ds) {
      var n = data.stats[ds] ? data.stats[ds].n : 0;
      var col = document.createElement('div');
      col.className = 'bar-col';
      col.innerHTML =
        '<div class="bar" style="height:' + Math.max(4, Math.round(n / max * 80)) + 'px"></div>' +
        '<div class="bar-label">' + ds.slice(5) + '</div>' +
        '<div class="bar-label">' + n + '</div>';
      bars.appendChild(col);
    });

    /* 错题本 */
    renderWrong('wrongShuxue', data.wrong.shuxue, function (q) {
      return q.text + ' = ' + q.answer + '（你答 ' + q.yours + '）';
    });
    renderWrong('wrongYingyu', data.wrong.yingyu, function (w) {
      return w.word + ' → ' + w.zh + '（你选 ' + w.yours + '）';
    });
    renderWrong('wrongKexue', data.wrong.kexue, function (w) {
      return w.text + '（' + w.answer + '）';
    });
  }

  function renderWrong(id, list, fmt) {
    var box = App.el(id);
    if (!list || !list.length) {
      box.textContent = '暂无';
      box.style.color = 'var(--muted)';
      return;
    }
    box.style.color = '';
    box.innerHTML = '';
    list.slice(-15).reverse().forEach(function (q) {
      var p = document.createElement('p');
      p.style.cssText = 'padding:8px 0;border-bottom:1px solid #F0F0F6;font-size:.92rem';
      p.textContent = fmt(q);
      box.appendChild(p);
    });
  }

  App.el('clearWrongBtn').addEventListener('click', function () {
    if (!window.confirm('确定清空所有错题吗？')) return;
    data.wrong = { shuxue: [], yingyu: [], kexue: [] };
    App.store.save(data);
    render();
    App.toast('错题本已清空');
  });

  App.el('exportBtn').addEventListener('click', function () {
    var text = JSON.stringify(data, null, 2);
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      App.toast('学习记录已复制到剪贴板');
    } catch (e) {
      App.toast('复制失败，已显示在控制台');
    }
    document.body.removeChild(ta);
    console.log('学习记录：\n' + text);
  });

  App.el('resetBtn').addEventListener('click', function () {
    if (!window.confirm('真的要重置所有数据吗？此操作无法恢复！')) return;
    if (!window.confirm('再确认一次：孩子的星星、打卡、错题都会清空。确定吗？')) return;
    App.store.reset();
    render();
    App.toast('已重置，一切重新开始');
  });

  render();
})();
