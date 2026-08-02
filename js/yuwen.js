/* 语文：古诗点读背诵 */
(function () {
  'use strict';

  var data = App.store.load();
  var idx = 0;
  var today = App.todayStr();

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
  }

  App.el('readBtn').addEventListener('click', function () {
    App.speak(window.poemText(window.Poems[idx]), 'zh-CN', 0.85);
  });

  App.el('reciteBtn').addEventListener('click', function () {
    var p = window.Poems[idx];
    if (doneToday(p.id)) return;
    data.awarded.poems[p.id] = today;
    App.addStars(data, 'yuwen', 1);
    App.addJifen(data, 2);
    App.logActivity(data, '背诗《' + p.title + '》');
    App.setStarsUI();
    renderDetail();
    renderList();
    App.toast('《' + p.title + '》背得真棒，+1⭐ +2积分！');
  });

  App.el('prevBtn').addEventListener('click', function () {
    idx = (idx - 1 + window.Poems.length) % window.Poems.length;
    data = App.store.load();
    renderDetail();
  });

  App.el('nextBtn').addEventListener('click', function () {
    idx = (idx + 1) % window.Poems.length;
    data = App.store.load();
    renderDetail();
  });

  renderList();
  App.setStarsUI();
})();
