/* 英语：单词卡 + 小测验 */
(function () {
  'use strict';

  var data = App.store.load();
  var quizN = 10;
  var topic = '全部';

  /* ---- 卡片模式 ---- */
  var cardWords = window.WordBank.all;
  var cardIdx = 0;
  var flipped = false;

  function filteredWords() {
    if (topic === '全部') return window.WordBank.all;
    return window.WordBank.all.filter(function (w) { return w.topic === topic; });
  }

  function renderChips() {
    var box = App.el('topicChips');
    box.innerHTML = '';
    ['全部'].concat(window.WordBank.topics.map(function (t) { return t.name; })).forEach(function (name) {
      var b = document.createElement('button');
      b.textContent = name;
      if (name === topic) b.classList.add('on');
      b.addEventListener('click', function () {
        topic = name;
        cardWords = filteredWords();
        cardIdx = 0;
        flipped = false;
        renderChips();
        renderCard();
      });
      box.appendChild(b);
    });
  }

  function renderCard() {
    var w = cardWords[cardIdx];
    flipped = false;
    var card = App.el('wordCard');
    card.classList.remove('flipped');
    App.el('wcEmoji').textContent = w.emoji;
    App.el('wcMain').textContent = w.zh;
    App.el('wcSub').textContent = w.topicEmoji + ' ' + w.topic;
    App.el('wcHint').textContent = '👆 点卡片看英文';
    App.el('wordCounter').textContent = (cardIdx + 1) + ' / ' + cardWords.length;
  }

  App.el('wordCard').addEventListener('click', function () {
    var w = cardWords[cardIdx];
    if (!flipped) {
      flipped = true;
      App.el('wordCard').classList.add('flipped');
      App.el('wcEmoji').textContent = w.emoji;
      App.el('wcMain').textContent = w.en;
      App.el('wcSub').textContent = w.zh;
      App.el('wcHint').textContent = '👆 点卡片看中文';
    } else {
      flipped = false;
      renderCard();
    }
  });

  App.el('speakWord').addEventListener('click', function () {
    App.speak(cardWords[cardIdx].en, 'en-US', 0.85);
  });

  App.el('prevWord').addEventListener('click', function () {
    cardIdx = (cardIdx - 1 + cardWords.length) % cardWords.length;
    renderCard();
  });

  App.el('nextWord').addEventListener('click', function () {
    cardIdx = (cardIdx + 1) % cardWords.length;
    renderCard();
  });

  /* ---- 小测验 ---- */
  var qz = null;

  function startQuiz() {
    data = App.store.load();
    var words = App.shuffle(window.WordBank.all).slice(0, quizN);
    qz = {
      words: words,
      idx: 0,
      score: 0,
      wrong: [],
      answered: false
    };
    App.el('qzResult').classList.add('hidden');
    App.el('quizScreen').classList.remove('hidden');
    renderQuiz();
  }

  function renderQuiz() {
    var q = qz.words[qz.idx];
    qz.answered = false;
    App.el('qzEmoji').textContent = q.emoji;
    App.el('qzWord').textContent = q.en;
    App.el('quizProgress').textContent = '第 ' + (qz.idx + 1) + ' / ' + qz.words.length + ' 题';
    App.el('quizScore').textContent = '答对 ' + qz.score + ' 题';

    var options = App.shuffle(
      window.WordBank.all.map(function (w) { return w.zh; })
        .filter(function (zh) { return zh !== q.zh; })
        .slice(0, 3).concat([q.zh])
    );

    var box = App.el('qzOptions');
    box.innerHTML = '';
    options.forEach(function (zh) {
      var b = document.createElement('button');
      b.textContent = zh;
      b.addEventListener('click', function () { pickAnswer(b, zh, q); });
      box.appendChild(b);
    });
    App.el('qzNext').classList.add('hidden');
  }

  function pickAnswer(btn, zh, q) {
    if (qz.answered) return;
    qz.answered = true;
    var buttons = App.el('qzOptions').querySelectorAll('button');

    if (zh === q.zh) {
      qz.score++;
      btn.classList.add('correct');
      App.toast('✓ 对啦！');
    } else {
      btn.classList.add('wrongpick');
      qz.wrong.push({ word: q.en, zh: q.zh, yours: zh });
      buttons.forEach(function (b) {
        if (b.textContent === q.zh) b.classList.add('correct');
        else b.classList.add('dim');
      });
      App.toast('✗ 正确答案：' + q.zh);
      App.speak(q.zh + '，' + q.en, 'zh-CN', 0.9);
    }

    App.el('quizScore').textContent = '答对 ' + qz.score + ' 题';
    App.el('qzNext').classList.remove('hidden');
    App.el('qzNext').textContent = (qz.idx === qz.words.length - 1) ? '查看成绩 🏁' : '下一题 ▶';
  }

  App.el('qzSpeak').addEventListener('click', function () {
    App.speak(qz.words[qz.idx].en, 'en-US', 0.85);
  });

  App.el('qzNext').addEventListener('click', function () {
    qz.idx++;
    if (qz.idx >= qz.words.length) {
      showQuizResult();
    } else {
      renderQuiz();
    }
  });

  function showQuizResult() {
    var score = qz.score;
    var reward = score === 10 ? 3 : 2; // 全对 3 星，完成 2 星
    var emoji = score === 10 ? '🏆' : score >= 8 ? '🎉' : score >= 6 ? '👍' : '💪';

    data = App.store.load();
    App.addStars(data, 'yingyu', reward);
    App.logActivity(data, '单词测验 ' + score + '/10');

    qz.wrong.forEach(function (w) {
      data.wrong.yingyu.push(w);
    });
    if (data.wrong.yingyu.length > 30) data.wrong.yingyu = data.wrong.yingyu.slice(-30);
    App.store.save(data);
    App.setStarsUI();

    App.el('quizScreen').classList.add('hidden');
    App.el('qzResultEmoji').textContent = emoji;
    App.el('qzResultScore').textContent = score + ' / 10';
    App.el('qzResultLine').textContent = '星星 +' + reward;

    var wl = App.el('qzWrongList');
    wl.innerHTML = '';
    if (qz.wrong.length) {
      wl.classList.remove('hidden');
      qz.wrong.forEach(function (w) {
        var li = document.createElement('li');
        li.innerHTML = '<span>' + w.word + ' = ' + w.zh + '</span><span class="wr-yours">' + w.yours + '</span>';
        wl.appendChild(li);
      });
    } else {
      wl.classList.add('hidden');
    }
    App.el('qzResult').classList.remove('hidden');
  }

  App.el('qzAgain').addEventListener('click', startQuiz);
  App.el('qzCards').addEventListener('click', function () {
    App.el('qzResult').classList.add('hidden');
    App.el('quizScreen').classList.add('hidden');
    App.el('cardScreen').classList.remove('hidden');
    App.el('tabCard').classList.add('on');
    App.el('tabQuiz').classList.remove('on');
  });

  /* ---- 页签切换 ---- */
  App.el('tabCard').addEventListener('click', function () {
    App.el('tabCard').classList.add('on');
    App.el('tabQuiz').classList.remove('on');
    App.el('cardScreen').classList.remove('hidden');
    App.el('quizScreen').classList.add('hidden');
    App.el('qzResult').classList.add('hidden');
  });

  App.el('tabQuiz').addEventListener('click', function () {
    App.el('tabQuiz').classList.add('on');
    App.el('tabCard').classList.remove('on');
    App.el('cardScreen').classList.add('hidden');
    App.el('qzResult').classList.add('hidden');
    if (!qz) startQuiz();
    else {
      App.el('quizScreen').classList.remove('hidden');
    }
  });

  renderChips();
  renderCard();
  App.setStarsUI();
})();
