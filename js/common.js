/* 学习乐园 · 共享工具 */
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
      stars: { yuwen: 0, shuxue: 0, yingyu: 0, kexue: 0, game: 0 },
      balance: 0,
      chances: 0,
      mcChances: 0,
      games: { played: 0, won: 0 },
      learned: {},
      checkins: [],
      wrong: { shuxue: [], yingyu: [], kexue: [], yuwen: [] },
      awarded: { poems: {}, quizzes: {} },
      stats: {}
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

  function logActivity(data, activity) {
    var t = todayStr();
    if (!data.stats[t]) data.stats[t] = { n: 0, items: [] };
    data.stats[t].n += 1;
    data.stats[t].items.push(activity);
    if (data.stats[t].items.length > 500) data.stats[t].items = data.stats[t].items.slice(-500);
    store.save(data);
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
    totalStars: totalStars,
    logActivity: logActivity,
    toast: toast,
    speak: speak,
    stopSpeak: stopSpeak,
    shuffle: shuffle,
    el: el,
    setStarsUI: setStarsUI,
    reciteScore: reciteScore
  };
})();
