/* 学习乐园 · 共享工具 */
(function () {
  'use strict';

  var KEY = 'xx3_learning_v1';

  var SUBJECTS = {
    yuwen: { name: '语文', emoji: '📖' },
    shuxue: { name: '数学', emoji: '🔢' },
    yingyu: { name: '英语', emoji: '🔤' },
    kexue: { name: '科学', emoji: '🔬' }
  };

  function defaultData() {
    return {
      stars: { yuwen: 0, shuxue: 0, yingyu: 0, kexue: 0, game: 0 },
      jifen: 0,
      chances: 0,
      mcChances: 0,
      games: { played: 0, won: 0 },
      checkins: [],
      wrong: { shuxue: [], yingyu: [], kexue: [] },
      awarded: { poems: {}, quizzes: {} },
      stats: {}
    };
  }

  var store = {
    load: function () {
      try {
        var raw = localStorage.getItem(KEY);
        if (raw) {
          var base = defaultData();
          var parsed = JSON.parse(raw);
          for (var k in base) {
            if (parsed[k] === undefined) parsed[k] = base[k];
          }
          return parsed;
        }
      } catch (e) { /* ignore */ }
      return defaultData();
    },
    save: function (data) {
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
    },
    reset: function () {
      try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
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
    store.save(data);
  }

  function totalStars(data) {
    var sum = 0;
    for (var k in data.stars) sum += data.stars[k] || 0;
    return sum;
  }

  function addJifen(data, n) {
    data.jifen = (data.jifen || 0) + n;
    store.save(data);
  }

  function redeemChance(data) {
    if ((data.jifen || 0) < 5) return false;
    data.jifen -= 5;
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
    if ((data.jifen || 0) < 10) return false;
    data.jifen -= 10;
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
    document.querySelectorAll('[data-star-key]').forEach(function (node) {
      var k = node.getAttribute('data-star-key');
      if (k === 'total') {
        node.textContent = '⭐ ' + totalStars(data);
      } else {
        node.textContent = '⭐ ' + (data.stars[k] || 0);
      }
    });
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
    addJifen: addJifen,
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
    setStarsUI: setStarsUI
  };
})();
