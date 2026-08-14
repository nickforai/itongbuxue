/* 首页：日期、打卡、星星 */
(function () {
  'use strict';

  var data = App.store.load();
  var week = ['日', '一', '二', '三', '四', '五', '六'];
  var d = new Date();

  App.el('todayLabel').textContent = (d.getMonth() + 1) + '月' + d.getDate() + '日 · 星期' + week[d.getDay()];
  App.el('streakBadge').textContent = '🔥 连续 ' + App.streakDays(data.checkins) + ' 天';
  App.setStarsUI();

  /* 今日学习目标进度 */
  var today = App.todayStr();
  var goal = (data.settings && data.settings.dailyGoal) || 0;
  var done = (data.tasks && data.tasks[today]) || 0;
  var studySec = (data.timelog && data.timelog[today]) || 0;
  var fill = App.el('taskProgress');
  var count = App.el('taskCount');
  var note = App.el('taskNote');
  if (goal > 0) {
    count.textContent = done + ' / ' + goal + ' 个';
    fill.style.width = Math.min(100, Math.round(done / goal * 100)) + '%';
    note.textContent = done >= goal
      ? '🎉 今天的练习目标完成啦！太棒了！'
      : '再完成 ' + (goal - done) + ' 个练习就达标啦，加油！';
  } else {
    count.textContent = done + ' 个';
    fill.style.width = Math.min(100, done > 0 ? 100 : 0) + '%';
    note.textContent = '家长可在「家长空间」设置每日学习目标';
  }
  if (studySec > 0) {
    note.textContent += ' · ⏱ 今天已学 ' + App.fmtDuration(studySec);
  }

  document.querySelectorAll('[data-chances-key]').forEach(function (node) {
    node.textContent = '🎮 机会 ' + data.chances;
  });
  document.querySelectorAll('[data-mc-chances-key]').forEach(function (node) {
    node.textContent = '⛏️ 机会 ' + (data.mcChances || 0);
  });
  document.querySelectorAll('[data-feiji-chances-key]').forEach(function (node) {
    node.textContent = '✈️ 机会 ' + (data.feijiChances || 0);
  });

  var btn = App.el('checkinBtn');
  var today = App.todayStr();

  if (data.checkins.indexOf(today) !== -1) {
    btn.textContent = '✅ 今天已打卡';
    btn.classList.add('done');
    btn.disabled = true;
  }

  btn.addEventListener('click', function () {
    data.checkins.push(today);
    if (data.checkins.length > 400) data.checkins = data.checkins.slice(-400);
    App.addStars(data, 'yuwen', 1);
    App.addStars(data, 'shuxue', 1);
    App.addStars(data, 'yingyu', 1);
    App.addStars(data, 'kexue', 1);
    App.logActivity(data, '打卡');

    btn.textContent = '✅ 今天已打卡';
    btn.classList.add('done');
    btn.disabled = true;
    App.el('streakBadge').textContent = '🔥 连续 ' + App.streakDays(data.checkins) + ' 天';
    App.setStarsUI();
    App.toast('打卡成功，+4⭐！');
  });
})();
