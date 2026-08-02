/* 科学：科普阅读 + 小问答 */
(function () {
  'use strict';

  var data = App.store.load();
  var topics = window.Science.topics;
  var current = null; // {topic, idx, score, wrong, answered}

  function doneAll(topic) {
    return data.awarded.quizzes[topic.id] === true;
  }

  function renderTopics() {
    var box = App.el('topicListBox');
    box.innerHTML = '';
    topics.forEach(function (t) {
      var item = document.createElement('button');
      item.className = 'science-item';
      item.innerHTML =
        '<div class="si-emoji">' + t.emoji + '</div>' +
        '<div class="si-title">' + t.title + '</div>' +
        (doneAll(t) ? '<div class="si-done">✅</div>' : '');
      item.addEventListener('click', function () { openTopic(t); });
      box.appendChild(item);
    });
  }

  function openTopic(t) {
    data = App.store.load();
    current = null;
    App.el('topicList').classList.add('hidden');
    App.el('quizScreen').classList.add('hidden');
    App.el('qzResult').classList.add('hidden');
    App.el('topicDetail').classList.remove('hidden');
    App.el('topicEmoji').textContent = t.emoji;
    App.el('topicTitle').textContent = t.title;
    App.el('topicContent').textContent = t.content;
    var btn = App.el('topicStart');
    btn.textContent = doneAll(t) ? '✅ 今天学过了，再复习一次' : '🚀 开始答题 +2⭐';
    window.scrollTo(0, 0);
  }

  App.el('topicRead').addEventListener('click', function () {
    var t = topics.find(function (x) { return x.title === App.el('topicTitle').textContent; });
    if (t) App.speak(t.content, 'zh-CN', 0.95);
  });

  App.el('topicStart').addEventListener('click', function () {
    var t = topics.find(function (x) { return x.title === App.el('topicTitle').textContent; });
    if (!t) return;
    current = { topic: t, idx: 0, score: 0, wrong: [], answered: false };
    App.el('topicDetail').classList.add('hidden');
    App.el('qzResult').classList.add('hidden');
    App.el('quizScreen').classList.remove('hidden');
    renderQuestion();
  });

  function renderQuestion() {
    var q = current.topic.questions[current.idx];
    current.answered = false;
    App.el('qzQuestion').textContent = q.q;
    App.el('qzProgress').textContent = '第 ' + (current.idx + 1) + ' / ' + current.topic.questions.length + ' 题';
    App.el('qzScore').textContent = '答对 ' + current.score + ' 题';

    var box = App.el('qzOptions');
    box.innerHTML = '';
    q.options.forEach(function (opt, i) {
      var b = document.createElement('button');
      b.textContent = opt;
      b.addEventListener('click', function () { pick(b, i, q); });
      box.appendChild(b);
    });
    App.el('qzNext').classList.add('hidden');
  }

  function pick(btn, i, q) {
    if (current.answered) return;
    current.answered = true;
    var buttons = App.el('qzOptions').querySelectorAll('button');

    if (i === q.answer) {
      current.score++;
      btn.classList.add('correct');
      App.toast('✓ 对啦！');
    } else {
      btn.classList.add('wrongpick');
      current.wrong.push({ text: q.q, answer: q.options[q.answer], yours: q.options[i] });
      buttons.forEach(function (b, bi) {
        if (bi === q.answer) b.classList.add('correct');
        else b.classList.add('dim');
      });
      App.toast('正确答案：' + q.options[q.answer]);
    }

    App.el('qzScore').textContent = '答对 ' + current.score + ' 题';
    App.el('qzNext').classList.remove('hidden');
    App.el('qzNext').textContent = (current.idx === current.topic.questions.length - 1) ? '查看成绩 🏁' : '下一题 ▶';
  }

  App.el('qzNext').addEventListener('click', function () {
    current.idx++;
    if (current.idx >= current.topic.questions.length) {
      showResult();
    } else {
      renderQuestion();
    }
  });

  function showResult() {
    var total = current.topic.questions.length;
    var stars = current.score === total ? 2 : current.score >= total - 1 ? 1 : 0;
    var emoji = current.score === total ? '🌟' : current.score >= total - 1 ? '👍' : '💪';

    data = App.store.load();
    App.addStars(data, 'kexue', stars);
    var jifen = current.score === total ? 3 : 2;
    App.addJifen(data, jifen);
    App.logActivity(data, '科学《' + current.topic.title + '》 ' + current.score + '/' + total);
    if (current.score === total) {
      data.awarded.quizzes[current.topic.id] = true;
      App.store.save(data);
    }
    current.wrong.forEach(function (w) { data.wrong.kexue.push(w); });
    if (data.wrong.kexue.length > 30) data.wrong.kexue = data.wrong.kexue.slice(-30);
    App.store.save(data);
    App.setStarsUI();

    App.el('quizScreen').classList.add('hidden');
    App.el('qzResultEmoji').textContent = emoji;
    App.el('qzResultScore').textContent = current.score + ' / ' + total;
    App.el('qzResultLine').textContent = '获得 ' + stars + ' ⭐ · 积分 +' + jifen;

    var wl = App.el('qzWrongList');
    wl.innerHTML = '';
    if (current.wrong.length) {
      wl.classList.remove('hidden');
      current.wrong.forEach(function (w) {
        var li = document.createElement('li');
        li.innerHTML = '<span>' + w.text + '</span><span class="wr-ans">' + w.answer + '</span>';
        wl.appendChild(li);
      });
    } else {
      wl.classList.add('hidden');
    }
    App.el('qzResult').classList.remove('hidden');
  }

  App.el('qzAgain').addEventListener('click', function () {
    App.el('qzResult').classList.add('hidden');
    current.idx = 0;
    current.score = 0;
    current.wrong = [];
    App.el('quizScreen').classList.remove('hidden');
    renderQuestion();
  });

  App.el('qzBack').addEventListener('click', function () {
    App.el('qzResult').classList.add('hidden');
    App.el('quizScreen').classList.add('hidden');
    App.el('topicDetail').classList.add('hidden');
    App.el('topicList').classList.remove('hidden');
    data = App.store.load();
    renderTopics();
  });

  renderTopics();
  App.setStarsUI();
})();
