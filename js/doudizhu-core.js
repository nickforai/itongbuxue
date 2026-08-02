/* 斗地主核心引擎（纯逻辑，可在浏览器与 Node 中运行） */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.DDZ = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
  var SUITS = ['♠', '♥', '♣', '♦'];

  // 权力值：数字越大牌越大
  var POWER = {
    '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15, 'S': 16, 'B': 17
  };

  var TYPE = {
    SINGLE: 1, PAIR: 2, TRIPLE: 3, TRIPLE_1: 4, TRIPLE_2: 5,
    STRAIGHT: 6, PAIR_STRAIGHT: 7,
    PLANE: 8, PLANE_1: 9, PLANE_2: 10,
    FOUR_2: 11, FOUR_22: 12, BOMB: 13, ROCKET: 14
  };

  var TYPE_NAME = {};
  TYPE_NAME[TYPE.SINGLE] = '单张'; TYPE_NAME[TYPE.PAIR] = '对子'; TYPE_NAME[TYPE.TRIPLE] = '三张';
  TYPE_NAME[TYPE.TRIPLE_1] = '三带一'; TYPE_NAME[TYPE.TRIPLE_2] = '三带二';
  TYPE_NAME[TYPE.STRAIGHT] = '顺子'; TYPE_NAME[TYPE.PAIR_STRAIGHT] = '连对';
  TYPE_NAME[TYPE.PLANE] = '飞机'; TYPE_NAME[TYPE.PLANE_1] = '飞机带单'; TYPE_NAME[TYPE.PLANE_2] = '飞机带对';
  TYPE_NAME[TYPE.FOUR_2] = '四带二'; TYPE_NAME[TYPE.FOUR_22] = '四带两对'; TYPE_NAME[TYPE.BOMB] = '炸弹'; TYPE_NAME[TYPE.ROCKET] = '王炸';

  var POWER_RANK = {};
  Object.keys(POWER).forEach(function (r) { POWER_RANK[POWER[r]] = r; });

  function makeDeck() {
    var deck = [];
    var id = 0;
    RANKS.forEach(function (rank) {
      SUITS.forEach(function (suit) {
        deck.push({ id: id++, rank: rank, suit: suit, power: POWER[rank] });
      });
    });
    deck.push({ id: id++, rank: 'S', suit: '', power: 16 }); // 小王
    deck.push({ id: id++, rank: 'B', suit: '', power: 17 }); // 大王
    return deck;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function deal() {
    var deck = shuffle(makeDeck());
    var hands = [
      deck.slice(0, 17).sort(byPower),
      deck.slice(17, 34).sort(byPower),
      deck.slice(34, 51).sort(byPower)
    ];
    var bottom = deck.slice(51, 54).sort(byPower);
    return { hands: hands, bottom: bottom };
  }

  function byPower(a, b) { return a.power - b.power; }

  function groupsOf(cards) {
    var map = {};
    cards.forEach(function (c) {
      if (!map[c.power]) map[c.power] = { power: c.power, count: 0, cards: [] };
      map[c.power].count++;
      map[c.power].cards.push(c);
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return a.power - b.power; });
  }

  function isConsecutive(powers) {
    for (var i = 1; i < powers.length; i++) {
      if (powers[i] !== powers[i - 1] + 1) return false;
    }
    return true;
  }

  /* 找连续顺子窗口：powers 中按序找 length 长度的连续段（每段需要 need 张），返回 {start,len} 或 null */
  function findRun(groups, need, minLen, maxLen, lo, hi) {
    var avail = {};
    groups.forEach(function (g) {
      if (g.power >= lo && g.power <= hi && g.count >= need) avail[g.power] = true;
    });
    var start = lo;
    while (start + minLen - 1 <= hi) {
      var len = minLen;
      while (len <= maxLen && start + len - 1 <= hi) {
        var ok = true;
        for (var p = start; p < start + len; p++) {
          if (!avail[p]) { ok = false; break; }
        }
        if (ok) return { start: start, len: len };
        len++;
      }
      start++;
    }
    return null;
  }

  function takeRun(groups, start, len, need) {
    var cards = [];
    for (var p = start; p < start + len; p++) {
      var g = groups.find(function (x) { return x.power === p; });
      cards = cards.concat(g.cards.slice(0, need));
    }
    return cards;
  }

  /* 从剩余牌（减去 used）里找 n 张单牌（各牌不同） */
  function pickSingles(groups, used, n) {
    var cards = [];
    var seen = {};
    for (var i = 0; i < groups.length && cards.length < n; i++) {
      var g = groups[i];
      if (used[g.power]) continue;
      for (var j = 0; j < g.cards.length && cards.length < n; j++) {
        if (!seen[g.power]) {
          cards.push(g.cards[j]);
          seen[g.power] = true;
        }
      }
    }
    return cards.length === n ? cards : null;
  }

  /* 从剩余牌里找 n 对 */
  function pickPairs(groups, used, n) {
    var cards = [];
    for (var i = 0; i < groups.length && cards.length < n * 2; i++) {
      var g = groups[i];
      if (used[g.power]) continue;
      if (g.count >= 2) cards = cards.concat(g.cards.slice(0, 2));
    }
    return cards.length === n * 2 ? cards : null;
  }

  function analyze(cards) {
    var n = cards.length;
    if (n === 0) return null;
    var g = groupsOf(cards);
    var powers = g.map(function (x) { return x.power; });

    if (n === 1) return { type: TYPE.SINGLE, main: g[0].power, len: 1, cards: cards };

    if (n === 2) {
      if (g.length === 2 && powers[0] === 16 && powers[1] === 17) return { type: TYPE.ROCKET, main: 17, len: 2, cards: cards };
      if (g.length === 1 && g[0].count === 2) return { type: TYPE.PAIR, main: powers[0], len: 2, cards: cards };
      return null;
    }

    if (n === 3) {
      if (g.length === 1 && g[0].count === 3) return { type: TYPE.TRIPLE, main: powers[0], len: 3, cards: cards };
      return null;
    }

    if (n === 4) {
      if (g.length === 1 && g[0].count === 4) return { type: TYPE.BOMB, main: powers[0], len: 4, cards: cards };
      if (g.length === 2 && (g[0].count === 3 || g[1].count === 3)) {
        // 三带一：{3,1} 或 {1,3}
        var triplePower = g.find(function (x) { return x.count === 3; });
        if (triplePower) return { type: TYPE.TRIPLE_1, main: triplePower.power, len: 4, cards: cards };
      }
      return null;
    }

    // 顺子
    if (n >= 5 && isConsecutive(powers) && powers[0] >= 3 && powers[powers.length - 1] <= 14) {
      var allSingle = g.every(function (x) { return x.count === 1; });
      if (allSingle) return { type: TYPE.STRAIGHT, main: powers[powers.length - 1], len: n, cards: cards };
    }

    // 连对
    if (n >= 6 && n % 2 === 0 && isConsecutive(powers) && powers[0] >= 3 && powers[powers.length - 1] <= 14) {
      var allPair = g.every(function (x) { return x.count === 2; });
      if (allPair) return { type: TYPE.PAIR_STRAIGHT, main: powers[powers.length - 1], len: n, cards: cards };
    }

    // 三顺（飞机）
    var triples = g.filter(function (x) { return x.count >= 3; });
    if (triples.length >= 2) {
      // 找最长的连续三顺段
      var run = findRun(triples, 3, 2, 12, 3, 14);
      if (run) {
        var runLen = run.len;
        var used = {};
        var planeCards = takeRun(groupsOf(cards), run.start, runLen, 3);
        for (var p = run.start; p < run.start + runLen; p++) used[p] = true;
        var remain = n - planeCards.length;
        if (remain === 0) return { type: TYPE.PLANE, main: run.start + runLen - 1, len: n, cards: cards };
        if (remain === runLen) {
          var wings = pickSingles(g, used, runLen);
          if (wings) return { type: TYPE.PLANE_1, main: run.start + runLen - 1, len: n, cards: cards };
        }
        if (remain === runLen * 2) {
          var wingsP = pickPairs(g, used, runLen);
          if (wingsP) return { type: TYPE.PLANE_2, main: run.start + runLen - 1, len: n, cards: cards };
        }
      }
    }

    // 四带二 / 四带两对
    var quads = g.filter(function (x) { return x.count === 4; });
    if (quads.length === 1) {
      var quad = quads[0];
      var used2 = {};
      used2[quad.power] = true;
      if (n === 6) {
        var two = pickSingles(g, used2, 2);
        if (two) return { type: TYPE.FOUR_2, main: quad.power, len: 6, cards: cards };
      }
      if (n === 8) {
        var twoPairs = pickPairs(g, used2, 2);
        if (twoPairs) return { type: TYPE.FOUR_22, main: quad.power, len: 8, cards: cards };
      }
    }

    // 三带二（5 张：{3,2}）
    if (n === 5) {
      var trip = g.find(function (x) { return x.count === 3; });
      var pair = g.find(function (x) { return x.count === 2; });
      if (trip && pair) return { type: TYPE.TRIPLE_2, main: trip.power, len: 5, cards: cards };
    }

    return null;
  }

  function compare(a, b) {
    if (a.type === TYPE.ROCKET) return b.type === TYPE.ROCKET ? 0 : 1;
    if (b.type === TYPE.ROCKET) return -1;
    if (a.type === TYPE.BOMB && b.type !== TYPE.BOMB) return 1;
    if (b.type === TYPE.BOMB && a.type !== TYPE.BOMB) return -1;
    if (a.type === TYPE.BOMB && b.type === TYPE.BOMB) return a.main > b.main ? 1 : a.main < b.main ? -1 : 0;
    if (a.type !== b.type || a.len !== b.len) return 0;
    return a.main > b.main ? 1 : a.main < b.main ? -1 : 0;
  }

  function beats(a, b) { return compare(a, b) > 0; }

  function firstGroupByCount(groups, count) {
    return groups.find(function (x) { return x.count >= count; });
  }

  /* 找出能压过 last 的最小出法；压不过返回 null */
  function findBeat(hand, last) {
    var g = groupsOf(hand);

    function out(cards) {
      return cards ? analyze(cards) : null;
    }

    var result = null;

    function tryMin(pred) {
      if (result) return;
      var cards = pred();
      if (cards) result = { cards: cards };
    }

    if (last.type === TYPE.SINGLE) {
      tryMin(function () {
        // 优先用"散牌"，其次拆对子，最后才拆三张/炸弹
        var c = g.find(function (x) { return x.count === 1 && x.power > last.main; });
        if (!c) c = g.find(function (x) { return x.count === 2 && x.power > last.main; });
        if (!c) c = g.find(function (x) { return x.count >= 3 && x.power > last.main; });
        return c ? [c.cards[0]] : null;
      });
    } else if (last.type === TYPE.PAIR) {
      tryMin(function () {
        var c = g.find(function (x) { return x.count >= 2 && x.power > last.main; });
        return c ? c.cards.slice(0, 2) : null;
      });
    } else if (last.type === TYPE.TRIPLE) {
      tryMin(function () {
        var c = g.find(function (x) { return x.count >= 3 && x.power > last.main; });
        return c ? c.cards.slice(0, 3) : null;
      });
    } else if (last.type === TYPE.TRIPLE_1 || last.type === TYPE.TRIPLE_2) {
      tryMin(function () {
        var need = last.type === TYPE.TRIPLE_1 ? 1 : 2;
        for (var i = 0; i < g.length; i++) {
          if (g[i].count >= 3 && g[i].power > last.main) {
            var used = {}; used[g[i].power] = true;
            var wings = need === 1 ? pickSingles(g, used, 1) : pickPairs(g, used, 1);
            if (wings) return g[i].cards.slice(0, 3).concat(wings);
          }
        }
        return null;
      });
    } else if (last.type === TYPE.STRAIGHT) {
      tryMin(function () {
        var run = findRun(g, 1, last.len, last.len, 3, 14);
        if (!run || run.start <= last.main - run.len + 1) return null;
        return takeRun(g, run.start, run.len, 1);
      });
    } else if (last.type === TYPE.PAIR_STRAIGHT) {
      tryMin(function () {
        var pairLen = last.len / 2;
        var run = findRun(g, 2, pairLen, pairLen, 3, 14);
        if (!run || run.start <= last.main - run.len + 1) return null;
        return takeRun(g, run.start, run.len, 2);
      });
    } else if (last.type === TYPE.PLANE || last.type === TYPE.PLANE_1 || last.type === TYPE.PLANE_2) {
      tryMin(function () {
        var n = last.type === TYPE.PLANE ? last.len / 3 : last.type === TYPE.PLANE_1 ? last.len / 4 : last.len / 5;
        var run = findRun(g, 3, n, n, 3, 14);
        if (!run || run.start <= last.main - run.len + 1) return null;
        var cards = takeRun(g, run.start, run.len, 3);
        var used = {};
        for (var p = run.start; p < run.start + run.len; p++) used[p] = true;
        if (last.type === TYPE.PLANE) return cards;
        if (last.type === TYPE.PLANE_1) {
          var w = pickSingles(g, used, n);
          return w ? cards.concat(w) : null;
        }
        var w2 = pickPairs(g, used, n);
        return w2 ? cards.concat(w2) : null;
      });
    } else if (last.type === TYPE.FOUR_2 || last.type === TYPE.FOUR_22) {
      tryMin(function () {
        var q = g.find(function (x) { return x.count >= 4 && x.power > last.main; });
        if (!q) return null;
        var used = {}; used[q.power] = true;
        if (last.type === TYPE.FOUR_2) {
          var w = pickSingles(g, used, 2);
          return w ? q.cards.slice(0, 4).concat(w) : null;
        }
        var w2 = pickPairs(g, used, 2);
        return w2 ? q.cards.slice(0, 4).concat(w2) : null;
      });
    } else if (last.type === TYPE.BOMB) {
      tryMin(function () {
        var q = g.find(function (x) { return x.count >= 4 && x.power > last.main; });
        return q ? q.cards.slice(0, 4) : null;
      });
    }

    // 出牌方案存在 → 直接返回（尽量不浪费炸弹）
    if (result) return result.cards;

    // 用炸弹压
    if (last.type !== TYPE.BOMB && last.type !== TYPE.ROCKET) {
      var bomb = g.find(function (x) { return x.count >= 4; });
      if (bomb) return bomb.cards.slice(0, 4);
    }

    // 王炸
    var hasS = hand.some(function (c) { return c.power === 16; });
    var hasB = hand.some(function (c) { return c.power === 17; });
    if (hasS && hasB && last.type !== TYPE.ROCKET) {
      return hand.filter(function (c) { return c.power >= 16; });
    }

    return null;
  }

  /* 出牌方（先手）的推荐出法 */
  function chooseLead(hand) {
    var g = groupsOf(hand);

    if (hand.length === 1) return hand;
    if (hand.length === 2 && hand[0].power === hand[1].power) return hand;
    if (hand.length === 2 && hand[0].power === 16 && hand[1].power === 17) return hand;

    // 整手牌能一次出完（顺子/连对/飞机/三带/四带二/炸弹等）就直接出
    if (analyze(hand)) return hand;

    // 有顺子先出顺子
    if (hand.length >= 5) {
      var run = findRun(g, 1, 5, 12, 3, 14);
      if (run) return takeRun(g, run.start, run.len, 1);
    }

    // 连对（3 对起）
    if (hand.length >= 6) {
      var pr = findRun(g, 2, 3, 12, 3, 14);
      if (pr) return takeRun(g, pr.start, pr.len, 2);
    }

    // 三顺（飞机）
    if (hand.length >= 6) {
      var triRun = findRun(g, 3, 2, 12, 3, 14);
      if (triRun) return takeRun(g, triRun.start, triRun.len, 3);
    }

    // 三张：能带就带（先带对、再带单）
    var triple = g.find(function (x) { return x.count === 3; });
    if (triple) {
      var used = {};
      used[triple.power] = true;
      var w2 = pickPairs(g, used, 1);
      if (w2) return triple.cards.slice(0, 3).concat(w2);
      var w1 = pickSingles(g, used, 1);
      if (w1) return triple.cards.slice(0, 3).concat(w1);
      return triple.cards.slice(0, 3);
    }

    // 最小的对子（不拆三张/炸弹）
    var pair = g.find(function (x) { return x.count === 2; });
    if (pair) return pair.cards.slice(0, 2);

    // 最小的"散牌"单张（不成对的，先不用 2 和王）
    var single = g.find(function (x) { return x.count === 1 && x.power <= 14; });
    if (single) return [single.cards[0]];

    // 只剩炸弹/2/王时，先出最小的炸弹
    var quad = g.find(function (x) { return x.count === 4 && x.power <= 14; });
    if (quad) return quad.cards.slice(0, 4);

    // 兜底：最小的单张（包括 2 和王）
    var any = g.find(function (x) { return x.count >= 1; });
    if (any) return [any.cards[0]];
    return hand.slice(0, 1);
  }

  /* 机器人叫地主 */
  function aiBid(hand) {
    var strength = 0;
    groupsOf(hand).forEach(function (g) {
      if (g.power >= 16) strength += 3;
      if (g.count === 4) strength += 2;
      if (g.power === 15) strength += 0.6 * g.count;
      if (g.power === 14) strength += 0.4 * g.count;
    });
    return strength + Math.random() * 2 >= 4.2;
  }

  /* 机器人出牌：返回 {cards} 或 null（不出） */
  function aiPlay(hand, ctx) {
    var last = ctx.lastPlay;
    if (!last) return { cards: chooseLead(hand) };

    var beat = findBeat(hand, last);
    if (!beat) return null;

    var mine = ctx.myIndex;
    var landlord = ctx.landlordIndex;
    var teammate = -1;
    if (mine !== landlord) {
      teammate = 3 - mine - landlord; // 另一个农民
    }

    // 队友出的小单张/小对子不抢，让队友多出
    if (ctx.lastPlayer === teammate && hand.length - beat.length > 0) {
      var tb = analyze(beat);
      var smallish = (tb.type === TYPE.SINGLE && tb.main <= 12) || (tb.type === TYPE.PAIR && tb.main <= 10);
      if (smallish) return null;
    }

    // 自己能一把走完就出
    if (hand.length - beat.length === 0) return { cards: beat };

    // 地主出小单张时，农民不急着顶，避免单张互顶
    if (mine !== landlord && ctx.lastPlayer === landlord) {
      var b = analyze(beat);
      if (b.type === TYPE.SINGLE && b.main <= 10 && hand.length > 2) return null;
    }

    // 队友先手且自己能接上时，不浪费炸弹
    if (ctx.lastPlayer === teammate && hand.length - beat.length > 0) {
      var b2 = analyze(beat);
      if (b2.type === TYPE.BOMB || b2.type === TYPE.ROCKET) return null;
    }

    return { cards: beat };
  }

  return {
    TYPE: TYPE,
    TYPE_NAME: TYPE_NAME,
    makeDeck: makeDeck,
    shuffle: shuffle,
    deal: deal,
    groupsOf: groupsOf,
    analyze: analyze,
    compare: compare,
    beats: beats,
    findBeat: findBeat,
    chooseLead: chooseLead,
    aiBid: aiBid,
    aiPlay: aiPlay,
    POWER_RANK: POWER_RANK
  };
});
