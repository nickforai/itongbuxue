/* 斗地主核心引擎测试：牌型判定、比较、出牌建议、整局模拟 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const DDZ = require('/Users/nick/Documents/三年级（倪子凡）/js/doudizhu-core.js');

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  ✓', msg); }
  else { fail++; console.log('  ✗ FAIL:', msg); }
}

const deck = DDZ.makeDeck();
const byRank = {};
deck.forEach((c) => {
  const key = c.rank + c.suit;
  if (!byRank[key]) byRank[key] = c;
});
function mk(...specs) {
  return specs.map((s) => byRank[s]);
}

function t(a) { return DDZ.analyze(a) ? DDZ.analyze(a).type : null; }
function main(a) { const x = DDZ.analyze(a); return x ? x.main : null; }

console.log('\n[1] 牌型识别');
ok(t(mk('3♠')) === DDZ.TYPE.SINGLE, '单张');
ok(t(mk('3♠', '3♥')) === DDZ.TYPE.PAIR, '对子');
ok(t(mk('S', 'B')) === DDZ.TYPE.ROCKET, '王炸');
ok(t(mk('3♠', '3♥', '3♣')) === DDZ.TYPE.TRIPLE, '三张');
ok(t(mk('3♠', '3♥', '3♣', '4♦')) === DDZ.TYPE.TRIPLE_1, '三带一');
ok(t(mk('3♠', '3♥', '3♣', '4♦', '4♠')) === DDZ.TYPE.TRIPLE_2, '三带二');
ok(t(mk('3♠', '4♥', '5♣', '6♦', '7♠')) === DDZ.TYPE.STRAIGHT, '顺子 5 张');
ok(t(mk('3♠', '4♥', '5♣', '6♦', '7♠', '8♥', '9♣', '10♦', 'J♠', 'Q♥', 'K♣', 'A♦')) === DDZ.TYPE.STRAIGHT, '顺子 12 张（3-A）');
ok(t(mk('3♠', '3♥', '4♣', '4♦', '5♠', '5♥')) === DDZ.TYPE.PAIR_STRAIGHT, '连对 3 对');
ok(t(mk('3♠', '3♥', '3♣', '4♦', '4♠', '4♥')) === DDZ.TYPE.PLANE, '飞机（无翅）');
ok(t(mk('3♠', '3♥', '3♣', '4♦', '4♠', '4♥', '5♣', '6♦')) === DDZ.TYPE.PLANE_1, '飞机带单');
ok(t(mk('3♠', '3♥', '3♣', '4♦', '4♠', '4♥', '5♣', '5♦', '6♠', '6♥')) === DDZ.TYPE.PLANE_2, '飞机带对');
ok(t(mk('3♠', '3♥', '3♣', '3♦', '4♠', '5♥')) === DDZ.TYPE.FOUR_2, '四带二（6 张）');
ok(t(mk('3♠', '3♥', '3♣', '3♦', '4♠', '4♥', '5♣', '5♦')) === DDZ.TYPE.FOUR_22, '四带两对（8 张）');
ok(t(mk('3♠', '3♥', '3♣', '3♦')) === DDZ.TYPE.BOMB, '炸弹');
ok(t(mk('3♠', '4♥', '5♣', '6♦', '7♠', '8♥', '9♣', '10♦', 'J♠', 'Q♥', 'K♣', 'A♦', '2♠', 'S')) === null, '带 2 的 14 张不是顺子');
ok(t(mk('3♠', '4♥', '5♣', '6♦', '7♠', '8♥', '9♣', '10♦', 'J♠', 'Q♥', 'K♣', 'A♦', '2♠', '2♥', 'S', 'B')) === null, '乱牌不是合法牌型');
ok(t(mk('10♠', 'J♥', 'Q♣', 'K♦', 'A♠')) === DDZ.TYPE.STRAIGHT, '10-A 顺子');
ok(t(mk('Q♠', 'K♥', 'A♣', '2♦', 'S')) === null, '带 2 不是顺子');

console.log('\n[2] 牌型比较');
const c = DDZ.compare;
ok(c({ type: DDZ.TYPE.ROCKET }, { type: DDZ.TYPE.BOMB, main: 15 }) > 0, '王炸压炸弹');
ok(c({ type: DDZ.TYPE.BOMB, main: 15 }, { type: DDZ.TYPE.SINGLE, main: 14 }) > 0, '炸弹压单张');
ok(c({ type: DDZ.TYPE.BOMB, main: 7 }, { type: DDZ.TYPE.BOMB, main: 9 }) < 0, '大炸弹压小炸弹');
ok(c({ type: DDZ.TYPE.SINGLE, main: 12 }, { type: DDZ.TYPE.SINGLE, main: 13 }) < 0, '单张大小');
ok(c({ type: DDZ.TYPE.STRAIGHT, main: 9, len: 5 }, { type: DDZ.TYPE.STRAIGHT, main: 8, len: 5 }) > 0, '顺子大小');
ok(c({ type: DDZ.TYPE.SINGLE, main: 14 }, { type: DDZ.TYPE.PAIR, main: 15 }) === 0, '不同类型不可比较');

console.log('\n[3] 出牌建议');
function beatCards(hand, lastSpecs) {
  const last = DDZ.analyze(mk(...lastSpecs));
  const cards = DDZ.findBeat(hand, last);
  return cards ? DDZ.analyze(cards).main : null;
}
ok(beatCards(mk('5♠', '6♥', '7♣', '8♦', '9♠', '2♣', 'S', 'B'), ['3♠', '4♥', '5♣', '6♦', '7♠']) === 9, '顺子压顺子（选最小能压的）');
ok(beatCards(mk('9♠', '9♥', 'J♣', 'K♦'), ['5♠', '5♥']) === 9, '对子压对子');
ok(beatCards(mk('3♠', '4♥', 'K♣', 'Q♦', 'S', 'B'), ['B']) === 17, '对方出大王时只能王炸');
ok(beatCards(mk('3♠', '4♥', 'K♣', 'S', 'B'), ['A♠']) === 16, '小王单张压 A（不浪费王炸）');
ok(beatCards(mk('8♠', '8♥', '8♣', '8♦', '9♠', '3♥'), ['5♠', '5♥', '5♣']) === 8, '炸弹压三张');
ok(DDZ.findBeat(mk('3♠', '4♥', '5♣'), DDZ.analyze(mk('S', 'B'))) === null, '王炸压不住');
ok(beatCards(mk('4♠', '4♥', '4♣', '5♦', '5♠', '9♥'), ['3♠', '3♥', '3♣', '8♦']) === 4, '三带一压三带一');
const lead = DDZ.chooseLead(mk('3♠', '3♥', '4♣', '4♦', '5♠', '5♥', '6♣', '6♦', '7♠', '7♥', '8♣', '8♦', '9♠', '9♥', '10♣', '10♦', 'J♠'));
ok(lead.length === 5, '先手优先出顺子');
const loose = DDZ.chooseLead(mk('3♠', '3♥', '9♦'));
ok(loose.length === 2 && DDZ.analyze(loose).main === 3, '有对子时先出对子');
const onlyPairs = DDZ.chooseLead(mk('3♠', '3♥', '4♣', '4♦'));
ok(onlyPairs.length === 2 && DDZ.analyze(onlyPairs).main === 3, '只有对子时出最小的对子');
ok(DDZ.chooseLead(mk('3♠', '3♥', '3♣', '4♦')).length === 4, '三带一先出');
ok(DDZ.chooseLead(mk('3♠', '3♥', '3♣', '4♦', '4♠')).length === 5, '三带二先出');
ok(DDZ.chooseLead(mk('3♠', '3♥', '3♣', '5♦', '6♠')).length === 4, '三带一（带最小单牌）');
ok(DDZ.chooseLead(mk('3♠', '3♥', '4♣', '4♦', '5♠', '5♥')).length === 6, '连对先出');
ok(DDZ.chooseLead(mk('3♠', '4♥', '5♣', '6♦', '7♠', '8♥')).length === 6, '顺子先出（整手）');

console.log('\n[3b] 出牌决策（pass 策略）');
function aiDecision(hand, lastSpecs, opts) {
  const ctx = {
    lastPlay: lastSpecs ? DDZ.analyze(mk(...lastSpecs)) : null,
    lastPlayer: opts.lastPlayer,
    myIndex: opts.myIndex,
    landlordIndex: opts.landlordIndex,
    counts: opts.counts || [17, 17, 17]
  };
  return DDZ.aiPlay(hand, ctx);
}
ok(
  aiDecision(mk('3♠', '4♥', '5♣', '6♦', '7♠', 'K♣'), ['3♠'], { lastPlayer: 1, myIndex: 0, landlordIndex: 1 }) === null,
  '地主出小单张时农民不硬顶'
);
ok(
  aiDecision(mk('3♠', '4♥', '5♣', '6♦', '7♠', 'A♠'), ['K♣'], { lastPlayer: 1, myIndex: 0, landlordIndex: 1 }) !== null,
  '地主出大单张（K）时农民正常压'
);
ok(
  aiDecision(mk('3♠', '4♥', '5♣', '6♦', '7♠', 'J♣'), ['9♠'], { lastPlayer: 2, myIndex: 0, landlordIndex: 1 }) === null,
  '队友出小单张时不抢'
);
ok(
  aiDecision(mk('10♠'), ['9♠'], { lastPlayer: 1, myIndex: 0, landlordIndex: 1 }) !== null,
  '只剩一张牌时必出'
);

console.log('\n[4] 整局模拟（机器人互打 300 局）');
let done = 0, turnsMax = 0, errors = 0;
for (let game = 0; game < 300; game++) {
  const { hands, bottom } = DDZ.deal();
  let landlord = -1;
  const bidStart = Math.floor(Math.random() * 3);
  for (let i = 0; i < 3; i++) {
    const p = (bidStart + i) % 3;
    if (DDZ.aiBid(hands[p])) landlord = p;
  }
  if (landlord === -1) { game--; continue; } // 无人叫，重发
  hands[landlord] = hands[landlord].concat(bottom).sort((a, b) => a.power - b.power);

  let turn = landlord;
  let lastPlay = null, lastPlayer = -1, passCount = 0;
  let turns = 0;
  let winner = -1, landlordWon = false;
  const counts = hands.map((h) => h.length);

  while (turns < 2000) {
    turns++;
    const ctx = { lastPlay, lastPlayer, myIndex: turn, landlordIndex: landlord, counts };
    const decision = DDZ.aiPlay(hands[turn], ctx);
    if (!decision) {
      passCount++;
      if (passCount >= 2) {
        turn = lastPlayer;
        lastPlay = null;
        passCount = 0;
      } else {
        turn = (turn + 1) % 3;
      }
    } else {
      hands[turn] = hands[turn].filter((c) => !decision.cards.includes(c));
      counts[turn] = hands[turn].length;
      if (hands[turn].length === 0) {
        winner = turn;
        landlordWon = turn === landlord;
        break;
      }
      lastPlay = DDZ.analyze(decision.cards);
      lastPlayer = turn;
      passCount = 0;
      turn = (turn + 1) % 3;
    }
  }
  if (winner === -1) { errors++; console.log('  ✗ 未终局（超轮）'); continue; }
  if (turns > turnsMax) turnsMax = turns;
  done++;
}
ok(done === 300, `300 局全部自然终局`);
ok(errors === 0, `无超轮局`);
console.log('  最长一局轮数：', turnsMax);

console.log(`\n===== 结果：${pass} 通过，${fail} 失败 =====`);
process.exit(fail ? 1 : 0);
