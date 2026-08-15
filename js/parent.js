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

    App.el('stTodayTime').textContent = App.fmtDuration((data.timelog && data.timelog[App.todayStr()]) || 0);
    var weekSec = 0;
    for (var wi = 0; wi < 7; wi++) {
      var wd = new Date();
      wd.setDate(wd.getDate() - wi);
      weekSec += (data.timelog && data.timelog[dateStr(wd)]) || 0;
    }
    App.el('stWeekTime').textContent = App.fmtDuration(weekSec);

    App.el('stTotal').textContent = App.totalStars(data);
    App.el('stStreak').textContent = App.streakDays(data.checkins);
    App.el('stYuwen').textContent = data.stars.yuwen || 0;
    App.el('stShuxue').textContent = data.stars.shuxue || 0;
    App.el('stYingyu').textContent = data.stars.yingyu || 0;
    App.el('stKexue').textContent = data.stars.kexue || 0;
    App.el('stGame').textContent = data.stars.game || 0;
    App.el('stRedo').textContent = data.stars.redo || 0;
    App.el('stChef').textContent = data.stars.chef || 0;
    App.el('stJifen').textContent = data.balance || 0;
    App.el('stChances').textContent = data.chances || 0;
    App.el('stGames').textContent = (data.games.won || 0) + ' / ' + (data.games.played || 0);
    App.el('stMcChances').textContent = data.mcChances || 0;
    App.el('stMcPlayed').textContent = data.games.mcPlayed || 0;

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
    renderWrong('wrongYuwen', data.wrong.yuwen, function (w) {
      return w.char + '（' + w.pinyin + '）';
    });
    renderWrong('wrongKexue', data.wrong.kexue, function (w) {
      return w.text + '（' + w.answer + '）';
    });

    renderGoalBtns();
    renderRemind();
  }

  function renderRemind() {
    var s = data.settings || {};
    App.el('remindTime').value = s.remindTime || '19:00';
    var status = App.el('remindStatus');
    var btn = App.el('remindBtn');
    if (!App.remindSupported()) {
      btn.disabled = true;
      btn.textContent = '⚠️ 此设备不支持通知';
      status.textContent = '需要 iPadOS 16.4 及以上，并把 i同步学「添加到主屏幕」后使用。';
      return;
    }
    if (s.remindEnabled) {
      btn.disabled = true;
      btn.textContent = '✅ 已开启 · 每天 ' + (s.remindTime || '19:00') + ' 提醒';
      status.textContent = Notification.permission === 'granted'
        ? '提醒已开启。打开 i同步学时到点会自动弹出通知。'
        : '已开启，但通知权限未授权，请重新点一次开启按钮。';
      return;
    }
    btn.disabled = false;
    btn.textContent = '🔔 开启每日提醒';
    status.textContent = Notification.permission === 'granted'
      ? '通知权限已授权，设置好时间点开启即可。'
      : '点击开启后，iPad 会弹出「允许通知」询问，请选择允许。';
  }

  function renderGoalBtns() {
    var goal = (data.settings && data.settings.dailyGoal) || 0;
    var box = App.el('goalBtns');
    box.innerHTML = '';
    var options = [{ v: 0, label: '关闭' }];
    for (var i = 1; i <= 6; i++) options.push({ v: i, label: i + ' 个' });
    options.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = o.label;
      b.className = 'goal-btn' + (o.v === goal ? ' on' : '');
      b.addEventListener('click', function () {
        if (!data.settings) data.settings = {};
        data.settings.dailyGoal = o.v;
        App.store.save(data);
        renderGoalBtns();
        App.toast(o.v > 0 ? '每日目标设为 ' + o.v + ' 个练习' : '已关闭每日目标');
      });
      box.appendChild(b);
    });
  }

  App.el('remindTime').addEventListener('change', function () {
    if (!data.settings) data.settings = {};
    data.settings.remindTime = App.el('remindTime').value || '19:00';
    App.store.save(data);
    renderRemind();
    App.toast('提醒时间已设为 ' + data.settings.remindTime);
  });

  App.el('remindBtn').addEventListener('click', function () {
    if (!App.remindSupported()) { App.toast('此设备不支持通知'); return; }
    App.requestRemindPermission().then(function (res) {
      if (res === 'granted' || Notification.permission === 'granted') {
        if (!data.settings) data.settings = {};
        data.settings.remindEnabled = true;
        data.settings.remindTime = App.el('remindTime').value || '19:00';
        App.store.save(data);
        renderRemind();
        App.toast('每日提醒已开启！');
      } else {
        App.toast('未获得通知权限，请在设置里允许');
      }
    });
  });

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

  function readRaw(key, backupKey) {
    try {
      return JSON.parse(localStorage.getItem(key) || localStorage.getItem(backupKey));
    } catch (e) { return null; }
  }

  function buildArchive() {
    return JSON.stringify({
      app: 'itongbuxue',
      date: new Date().toISOString(),
      learning: readRaw('xx3_learning_v1', 'xx3_learning_v1_backup'),
      minecraft: readRaw('xx3_mc_world_v1', 'xx3_mc_world_v1_backup')
    }, null, 2);
  }

  App.el('backupBtn').addEventListener('click', function () {
    App.el('backupText').value = buildArchive();
    App.toast('备份存档已生成，请复制保存');
  });

  App.el('copyBackupBtn').addEventListener('click', function () {
    var ta = App.el('backupText');
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    try {
      document.execCommand('copy');
      App.toast('存档已复制，请粘贴到安全的地方');
    } catch (e) {
      App.toast('复制失败，请长按文字手动复制');
    }
  });

  App.el('restoreBtn').addEventListener('click', function () {
    var raw = App.el('restoreText').value.trim();
    var obj;
    try {
      obj = JSON.parse(raw);
    } catch (e) {
      App.toast('存档格式不对，请检查粘贴的内容');
      return;
    }
    if (!obj || !obj.learning) {
      App.toast('这不是有效的备份存档');
      return;
    }
    if (!window.confirm('恢复会用备份覆盖当前数据，确定吗？')) return;
    try {
      var learningJson = JSON.stringify(obj.learning);
      localStorage.setItem('xx3_learning_v1', learningJson);
      localStorage.setItem('xx3_learning_v1_backup', learningJson);
      if (obj.minecraft) {
        var mcJson = JSON.stringify(obj.minecraft);
        localStorage.setItem('xx3_mc_world_v1', mcJson);
        localStorage.setItem('xx3_mc_world_v1_backup', mcJson);
      }
      render();
      App.toast('存档恢复成功！');
    } catch (e) {
      App.toast('恢复失败：' + e.message);
    }
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
