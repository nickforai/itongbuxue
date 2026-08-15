/* i同步学 · 共享工具 */
(function () {
  'use strict';

  var KEY = 'xx3_learning_v1';
  var BACKUP_KEY = 'xx3_learning_v1_backup';

  var SUBJECTS = {
    yuwen: { name: '语文', emoji: '📖' },
    shuxue: { name: '数学', emoji: '🔢' },
    yingyu: { name: '英语', emoji: '🔤' },
    kexue: { name: '科学', emoji: '🔬' }
  };

  function defaultData() {
    return {
      stars: { yuwen: 0, shuxue: 0, yingyu: 0, kexue: 0, game: 0, redo: 0, chef: 0 },
      balance: 0,
      chances: 0,
      mcChances: 0,
      feijiChances: 0,
      games: { played: 0, won: 0 },
      learned: {},
      checkins: [],
      wrong: { shuxue: [], yingyu: [], kexue: [], yuwen: [] },
      awarded: { poems: {}, quizzes: {} },
      stats: {},
      tasks: {},
      timelog: {},
      settings: { dailyGoal: 3, remindTime: '19:00', remindEnabled: false, remindDone: {} }
    };
  }

  var store = {
    load: function () {
      try {
        var raw = localStorage.getItem(KEY) || localStorage.getItem(BACKUP_KEY);
        if (raw) {
          var base = defaultData();
          var parsed = JSON.parse(raw);
          for (var k in base) {
            if (parsed[k] === undefined) parsed[k] = base[k];
          }
          // 旧数据迁移：积分并入星星余额（累计星星 + 原积分）
          if ('jifen' in parsed) {
            var sum = 0;
            for (var s in parsed.stars) sum += parsed.stars[s] || 0;
            parsed.balance = sum + (parsed.jifen || 0);
            delete parsed.jifen;
          }
          return parsed;
        }
      } catch (e) { /* ignore */ }
      return defaultData();
    },
    save: function (data) {
      try {
        var json = JSON.stringify(data);
        localStorage.setItem(KEY, json);
        localStorage.setItem(BACKUP_KEY, json); // 自动备份，主数据丢失时可恢复
      } catch (e) { /* ignore */ }
    },
    reset: function () {
      try {
        localStorage.removeItem(KEY);
        localStorage.removeItem(BACKUP_KEY);
      } catch (e) { /* ignore */ }
    }
  };

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function localDateStr(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  var todayStr = function () { return localDateStr(new Date()); };

  function streakDays(checkins) {
    var set = {};
    (checkins || []).forEach(function (d) { set[d] = true; });
    var streak = 0;
    var d = new Date();
    if (!set[localDateStr(d)]) d.setDate(d.getDate() - 1);
    while (set[localDateStr(d)]) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  function addStars(data, subject, n) {
    data.stars[subject] = (data.stars[subject] || 0) + n;
    data.balance = (data.balance || 0) + n;
    store.save(data);
  }

  function totalStars(data) {
    var sum = 0;
    for (var k in data.stars) sum += data.stars[k] || 0;
    return sum;
  }

  function redeemChance(data) {
    if ((data.balance || 0) < 5) return false;
    data.balance -= 5;
    data.chances = (data.chances || 0) + 1;
    store.save(data);
    return true;
  }

  function useChance(data) {
    if ((data.chances || 0) < 1) return false;
    data.chances -= 1;
    data.games.played = (data.games.played || 0) + 1;
    store.save(data);
    return true;
  }

  function redeemMcChance(data) {
    if ((data.balance || 0) < 10) return false;
    data.balance -= 10;
    data.mcChances = (data.mcChances || 0) + 1;
    store.save(data);
    return true;
  }

  function useMcChance(data) {
    if ((data.mcChances || 0) < 1) return false;
    data.mcChances -= 1;
    data.games.mcPlayed = (data.games.mcPlayed || 0) + 1;
    store.save(data);
    return true;
  }

  function redeemFeijiChance(data) {
    if ((data.balance || 0) < 10) return false;
    data.balance -= 10;
    data.feijiChances = (data.feijiChances || 0) + 1;
    store.save(data);
    return true;
  }

  function useFeijiChance(data) {
    if ((data.feijiChances || 0) < 1) return false;
    data.feijiChances -= 1;
    data.games.feijiPlayed = (data.games.feijiPlayed || 0) + 1;
    store.save(data);
    return true;
  }

  function logActivity(data, activity) {
    var t = todayStr();
    if (!data.stats[t]) data.stats[t] = { n: 0, items: [] };
    data.stats[t].n += 1;
    data.stats[t].items.push(activity);
    if (data.stats[t].items.length > 500) data.stats[t].items = data.stats[t].items.slice(-500);
    store.save(data);
  }

  /* 记录「完成 1 个学习练习」，用于首页每日目标进度 */
  function addTask(data) {
    if (!data.tasks) data.tasks = {};
    var t = todayStr();
    data.tasks[t] = (data.tasks[t] || 0) + 1;
    store.save(data);
  }

  /* ---------- 学习时长统计（自动计时，后台不计时） ---------- */
  function fmtDuration(sec) {
    sec = Math.round(sec || 0);
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    if (h > 0) return h + '小时' + (m > 0 ? m + '分' : '');
    if (m > 0) return m + '分钟';
    return sec + '秒';
  }

  /* ---------- 每日学习提醒（iPadOS 16.4+ 添加到主屏幕后支持） ---------- */
  function remindSupported() {
    return typeof Notification !== 'undefined';
  }

  function requestRemindPermission() {
    if (!remindSupported()) return Promise.resolve('unsupported');
    return Notification.requestPermission();
  }

  function maybeNotifyReminder() {
    var data = store.load();
    var s = data.settings || {};
    if (!s.remindEnabled) return;
    if (!remindSupported() || Notification.permission !== 'granted') return;
    if (!s.remindDone) s.remindDone = {};
    var today = todayStr();
    if (s.remindDone[today]) return;

    var now = new Date();
    var hm = pad2(now.getHours()) + ':' + pad2(now.getMinutes());
    var target = s.remindTime || '19:00';
    if (hm < target) return;

    var goal = s.dailyGoal || 0;
    var done = (data.tasks && data.tasks[today]) || 0;
    var body;
    if (goal > 0) {
      body = done >= goal
        ? '今天的练习目标已经完成，真棒！'
        : '今天的练习目标还差 ' + (goal - done) + ' 个，打开 i同步学 完成吧！';
    } else {
      body = '今天也来 i同步学 学一会儿吧！';
    }
    try {
      var n = new Notification('i同步学', { body: body });
      setTimeout(function () { n.close(); }, 15000);
    } catch (e) { /* ignore */ }
    s.remindDone[today] = true;
    data.settings = s;
    store.save(data);
  }

  /* 提醒定时检查：仅页面打开时生效，每分钟一次 */
  setInterval(function () {
    if (!document.hidden) maybeNotifyReminder();
  }, 60000);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) maybeNotifyReminder();
  });

  function startPageTimer(key) {
    if (!key) return;
    var start = Date.now();
    var stopped = document.hidden;
    var flushed = false;
    function acc() {
      if (stopped || flushed) return;
      flushed = true;
      var data = store.load();
      if (!data.timelog) data.timelog = {};
      var t = todayStr();
      data.timelog[t] = (data.timelog[t] || 0) + Math.max(0, Math.round((Date.now() - start) / 1000));
      store.save(data);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { acc(); stopped = true; }
      else { start = Date.now(); stopped = false; flushed = false; }
    });
    window.addEventListener('pagehide', acc);
    window.addEventListener('beforeunload', acc);
  }

  /* 学习页面计时器自动启动：只统计学习/复习/家长页，不统计游戏页 */
  var timerKey = null;
  var path = (location.pathname || '').split('/').pop();
  if (path === '' || path === 'index.html') timerKey = 'home';
  else if (path === 'kousuan.html') timerKey = 'shuxue';
  else if (path === 'yingyu.html') timerKey = 'yingyu';
  else if (path === 'kexue.html') timerKey = 'kexue';
  else if (path === 'yuwen.html' || path === 'yuedu.html' || path === 'shengzi.html') timerKey = 'yuwen';
  else if (path === 'wrongredo.html') timerKey = 'review';
  else if (path === 'parent.html') timerKey = 'parent';
  if (timerKey) {
    window.addEventListener('load', function () { startPageTimer(timerKey); });
  }

  var toastTimer = null;
  function toast(msg) {
    var t = document.querySelector('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }

  function pickVoice(lang) {
    if (!('speechSynthesis' in window)) return null;
    var voices = window.speechSynthesis.getVoices();
    var want = lang.toLowerCase().replace('_', '-');
    for (var i = 0; i < voices.length; i++) {
      if (voices[i].lang.toLowerCase().replace('_', '-').indexOf(want) === 0) return voices[i];
    }
    return null;
  }

  function speak(text, lang, rate) {
    if (!('speechSynthesis' in window)) {
      toast('此设备不支持朗读');
      return;
    }
    window.speechSynthesis.cancel();
    setTimeout(function () {
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang || 'zh-CN';
      u.rate = rate || 0.9;
      var v = pickVoice(u.lang);
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    }, 60);
  }

  function stopSpeak() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function el(id) { return document.getElementById(id); }

  function setStarsUI() {
    var data = store.load();
    var balance = data.balance || 0;
    document.querySelectorAll('[data-star-key]').forEach(function (node) {
      var k = node.getAttribute('data-star-key');
      if (k === 'total') {
        node.textContent = '⭐ ' + balance;
      } else {
        node.textContent = '⭐ ' + (data.stars[k] || 0);
      }
    });
    document.querySelectorAll('[data-balance-key]').forEach(function (node) {
      node.textContent = '⭐ ' + balance + ' 星星';
    });
  }

  /* ---------- 背诵评分：识别文本 vs 原文 ---------- */
  function lcsLen(a, b) {
    var m = a.length, n = b.length;
    if (!m || !n) return 0;
    var prev = new Array(n + 1).fill(0);
    var cur = new Array(n + 1).fill(0);
    for (var i = 1; i <= m; i++) {
      for (var j = 1; j <= n; j++) {
        cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
      }
      var tmp = prev; prev = cur; cur = tmp;
      cur[0] = 0;
    }
    return prev[n];
  }

  function normalizeHan(s) {
    return (s || '').replace(/[^\u4e00-\u9fff]/g, '');
  }

  /* 返回 { accuracy: 百分比(保留1位), match, total, points } */
  function reciteScore(expected, recognized) {
    var e = normalizeHan(expected);
    var r = normalizeHan(recognized);
    if (!e.length) return { accuracy: 0, match: 0, total: 0, points: 0 };
    var match = lcsLen(e, r);
    var accuracy = Math.round(match / e.length * 1000) / 10;
    var points = accuracy >= 90 ? 3 : accuracy >= 80 ? 2 : accuracy >= 60 ? 1 : 0;
    return { accuracy: accuracy, match: match, total: e.length, points: points };
  }

  /* ---------- 游戏限时倒计时 ---------- */
  function formatClock(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ':' + (s < 10 ? '0' + s : '' + s);
  }

  /* 返回停止函数。total=总秒数，warnAt=提前多少秒提醒 */
  function countdown(total, warnAt, callbacks) {
    var end = Date.now() + total * 1000;
    var warned = false;
    var timer = setInterval(function () {
      var left = Math.max(0, Math.round((end - Date.now()) / 1000));
      if (!warned && left <= warnAt) {
        warned = true;
        if (callbacks.onWarn) callbacks.onWarn();
      }
      if (callbacks.onTick) callbacks.onTick(left);
      if (left <= 0) {
        clearInterval(timer);
        if (callbacks.onEnd) callbacks.onEnd();
      }
    }, 1000);
    return function () { clearInterval(timer); };
  }

  // 预热语音列表（Safari 首次可能为空）
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = function () { window.speechSynthesis.getVoices(); };
  }

  // 注册离线缓存（需要 http/https，本地文件方式打开时自动跳过）
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* 忽略 */ });
    });
  }

  window.App = {
    SUBJECTS: SUBJECTS,
    store: store,
    todayStr: todayStr,
    streakDays: streakDays,
    addStars: addStars,
    redeemChance: redeemChance,
    useChance: useChance,
    redeemMcChance: redeemMcChance,
    useMcChance: useMcChance,
    redeemFeijiChance: redeemFeijiChance,
    useFeijiChance: useFeijiChance,
    totalStars: totalStars,
    logActivity: logActivity,
    addTask: addTask,
    fmtDuration: fmtDuration,
    remindSupported: remindSupported,
    requestRemindPermission: requestRemindPermission,
    maybeNotifyReminder: maybeNotifyReminder,
    toast: toast,
    speak: speak,
    stopSpeak: stopSpeak,
    shuffle: shuffle,
    el: el,
    setStarsUI: setStarsUI,
    reciteScore: reciteScore,
    countdown: countdown,
    formatClock: formatClock
  };
})();
