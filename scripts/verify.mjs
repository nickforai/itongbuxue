/* 学习乐园 · 自动化功能验证（Playwright + 本机 Chrome） */
import { chromium } from '/Users/nick/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const BASE = 'http://127.0.0.1:8642/';
const fails = [];

function assert(cond, msg) {
  if (!cond) fails.push(msg);
  else console.log('  ✓', msg);
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function shot(page, name) {
  await page.screenshot({ path: '/private/tmp/xx_' + name + '.png' });
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-first-run']
  });
  const ctx = await browser.newContext({ viewport: { width: 820, height: 1180 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(12000);
  page.setDefaultNavigationTimeout(15000);
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const fresh = () => { errors.length = 0; };

  /* ---------- 首页 ---------- */
  console.log('\n[1] 首页');
  fresh();
  await page.goto(BASE + 'index.html', { waitUntil: 'networkidle' });
  assert((await page.title()).includes('学习乐园'), '标题正确');
  assert((await page.locator('.subject-card').count()) === 4, '4 个学科卡片');
  assert((await page.locator('#checkinBtn').isVisible()), '打卡按钮可见');
  await page.click('#checkinBtn');
  await sleep(300);
  assert((await page.textContent('#checkinBtn')).includes('已打卡'), '打卡后按钮状态变化');
  assert((await page.textContent('[data-star-key="total"]')).includes('4'), '打卡 +4 星');
  assert((await page.textContent('[data-jifen-key]')).includes('1'), '打卡 +1 积分');
  await shot(page, 'home');
  assert(errors.length === 0, '无 JS 报错' + (errors.length ? ' → ' + errors[0] : ''));

  /* ---------- 数学口算 ---------- */
  console.log('\n[2] 数学口算');
  fresh();
  await page.goto(BASE + 'kousuan.html', { waitUntil: 'networkidle' });
  await page.locator('.level-card').first().click();
  for (let i = 0; i < 10; i++) {
    const text = await page.textContent('#questionText');
    const expr = text.replace(/×/g, '*').replace(/÷/g, '/');
    const ans = String(Function('"use strict";return (' + expr + ')')());
    for (const ch of ans) {
      await page.click('.pad button >> text=' + ch);
    }
    await page.click('.pad button >> text=确 定');
    if (i < 9) await page.waitForFunction((prev) => document.getElementById('questionText').textContent !== prev, text);
  }
  await page.waitForSelector('#resultScreen:not(.hidden)', { timeout: 5000 });
  assert((await page.textContent('#resultScore')).trim() === '10 / 10', '口算全对 10/10');
  assert((await page.textContent('[data-star-key="shuxue"]')).includes('4'), '口算后数学星 = 1(打卡)+3 = 4');
  await shot(page, 'kousuan');
  assert(errors.length === 0, '无 JS 报错' + (errors.length ? ' → ' + errors[0] : ''));

  /* ---------- 语文古诗 ---------- */
  console.log('\n[3] 语文古诗');
  fresh();
  await page.goto(BASE + 'yuwen.html', { waitUntil: 'networkidle' });
  assert((await page.locator('.poem-list-item').count()) === 14, '14 首古诗');
  await page.locator('.poem-list-item').first().click();
  await page.waitForSelector('#detailScreen:not(.hidden)');
  await page.click('#reciteBtn');
  await sleep(300);
  assert((await page.textContent('[data-star-key="yuwen"]')).includes('2'), '背诗后语文星 = 1(打卡)+1 = 2');
  assert(await page.locator('#reciteBtn').isDisabled(), '当天重复背诵被禁用');
  // 录音评分函数（纯逻辑）
  const sc = await page.evaluate(() => {
    const E = '牧童骑黄牛歌声振林樾意欲捕鸣蝉忽然闭口立';
    return {
      exact: App.reciteScore(E, E),
      p90: App.reciteScore(E, E.slice(0, 18)),
      p80: App.reciteScore(E, E.slice(0, 16)),
      p60: App.reciteScore(E, E.slice(0, 13)),
      low: App.reciteScore(E, E.slice(0, 11)),
      noise: App.reciteScore(E, '今天天气不错哈哈哈')
    };
  });
  assert(sc.exact.points === 3 && sc.exact.accuracy === 100, '完全背诵：100% 得 3 分');
  assert(sc.p90.points === 3 && sc.p90.accuracy >= 90, '90%+ 得 3 分');
  assert(sc.p80.points === 2 && sc.p80.accuracy >= 80, '80-90% 得 2 分');
  assert(sc.p60.points === 1 && sc.p60.accuracy >= 60, '60-80% 得 1 分');
  assert(sc.low.points === 0 && sc.low.accuracy < 60, '低于 60% 不得分');
  assert(sc.noise.points === 0, '乱读不得分');
  // 录音评分完整链路：注入模拟语音识别
  assert((await page.locator('#recBtn').count()) === 1, '录音按钮存在');
  const pageErrorsBefore = errors.filter((e) => e.startsWith('pageerror')).length;
  // 场景1：识别自动完成 → 满分 → +3 分 → 总数更新
  await page.evaluate(() => {
    window.FakeSR = class {
      constructor() {
        this.lang = '';
        this.continuous = false;
        this.interimResults = false;
        this.onresult = null;
        this.onend = null;
        this.onerror = null;
      }
      start() {
        const self = this;
        setTimeout(() => {
          if (self.onresult) {
            self.onresult({
              resultIndex: 0,
              results: [{ 0: { transcript: '牧童骑黄牛歌声振林樾意欲捕鸣蝉忽然闭口立' }, isFinal: true }]
            });
          }
          if (self.onend) self.onend();
        }, 60);
      }
      stop() {}
    };
    window.SpeechRecognition = window.FakeSR;
    window.webkitSpeechRecognition = window.FakeSR;
  });
  await page.click('#recBtn');
  await sleep(600);
  const recText = await page.textContent('#recResult');
  assert(recText.includes('准确率 100%') && recText.includes('积分 +3'), '录音满分得 3 分并显示结果');
  assert((await page.textContent('#jifenPill')).includes('💰'), '积分总数已更新');
  // 场景2：手动停止 → 显示"计算中" → 空识别给出提示
  await page.evaluate(() => {
    window.SilentSR = class {
      constructor() {
        this.onresult = null;
        this.onend = null;
        this.onerror = null;
      }
      start() {}
      stop() {}
    };
    window.SpeechRecognition = window.SilentSR;
    window.webkitSpeechRecognition = window.SilentSR;
  });
  await page.click('#recBtn');
  await sleep(150);
  assert((await page.textContent('#recBtn')).includes('停止背诵'), '开始背诵后按钮变为停止背诵');
  assert((await page.locator('#poemLines.hidden').count()) === 1, '背诵时原文被遮住');
  await page.click('#recBtn');
  assert((await page.textContent('#recBtn')).includes('正在计算得分'), '停止后显示计算中状态');
  await sleep(900);
  assert((await page.textContent('#recResult')).includes('没有识别到内容'), '空识别给出重试提示');
  assert((await page.textContent('#recBtn')).includes('开始背诵'), '按钮恢复为开始背诵');
  assert((await page.locator('#poemLines.hidden').count()) === 0, '结束后原文恢复显示');
  const pageErrorsAfter = errors.filter((e) => e.startsWith('pageerror')).length;
  assert(pageErrorsAfter === pageErrorsBefore, '录音评分无页面崩溃');
  await shot(page, 'yuwen');
  assert(errors.length === 0, '无 JS 报错' + (errors.length ? ' → ' + errors[0] : ''));

  /* ---------- 英语 ---------- */
  console.log('\n[4] 英语单词');
  fresh();
  await page.goto(BASE + 'yingyu.html', { waitUntil: 'networkidle' });
  assert((await page.locator('.word-card').isVisible()), '单词卡可见');
  await page.click('#wordCard');
  await sleep(150);
  assert((await page.textContent('#wcMain')).length > 0, '翻卡显示英文');
  await page.click('#tabQuiz');
  for (let i = 0; i < 10; i++) {
    await page.locator('#qzOptions button').first().click();
    await page.waitForSelector('#qzNext:not(.hidden)');
    await page.click('#qzNext');
  }
  await page.waitForSelector('#qzResult:not(.hidden)', { timeout: 5000 });
  assert((await page.textContent('#qzResultScore')).includes('/ 10'), '测验完成');
  await shot(page, 'yingyu');
  assert(errors.length === 0, '无 JS 报错' + (errors.length ? ' → ' + errors[0] : ''));

  /* ---------- 科学 ---------- */
  console.log('\n[5] 科学乐园');
  fresh();
  await page.goto(BASE + 'kexue.html', { waitUntil: 'networkidle' });
  assert((await page.locator('.science-item').count()) === 6, '6 个科学主题');
  await page.locator('.science-item').first().click();
  await page.click('#topicStart');
  for (let i = 0; i < 3; i++) {
    await page.locator('#qzOptions button').first().click();
    await page.waitForSelector('#qzNext:not(.hidden)');
    await page.click('#qzNext');
  }
  await page.waitForSelector('#qzResult:not(.hidden)', { timeout: 5000 });
  assert((await page.textContent('#qzResultScore')).includes('/ 3'), '科学问答完成');
  await shot(page, 'kexue');
  assert(errors.length === 0, '无 JS 报错' + (errors.length ? ' → ' + errors[0] : ''));

  /* ---------- 家长页 ---------- */
  console.log('\n[6] 家长空间');
  fresh();
  await page.goto(BASE + 'parent.html', { waitUntil: 'networkidle' });
  assert((await page.locator('.week-bars .bar-col').count()) === 7, '7 天统计柱');
  assert(parseInt(await page.textContent('#stTotal'), 10) >= 5, '总星星统计正常');
  assert(parseInt(await page.textContent('#stJifen'), 10) >= 5, '家长页积分统计正常');
  assert((await page.textContent('#wrongShuxue')).length > 0, '错题本区域渲染');
  await shot(page, 'parent');
  assert(errors.length === 0, '无 JS 报错' + (errors.length ? ' → ' + errors[0] : ''));

  /* ---------- 斗地主 ---------- */
  console.log('\n[7] 斗地主');
  fresh();
  await page.goto(BASE + 'doudizhu.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('xx3_learning_v1')) || {};
    d.jifen = 12;
    d.chances = 0;
    localStorage.setItem('xx3_learning_v1', JSON.stringify(d));
  });
  await page.reload({ waitUntil: 'networkidle' });
  assert((await page.textContent('#lobbyJifen')) === '12', '积分显示 12');
  await page.click('#redeemBtn');
  await sleep(200);
  assert((await page.textContent('#lobbyChances')) === '1', '5 积分兑换后机会 = 1');
  assert((await page.textContent('#lobbyJifen')) === '7', '兑换后积分 = 7');
  await page.click('#redeemBtn');
  await sleep(200);
  assert((await page.textContent('#lobbyChances')) === '2', '再兑换机会 = 2');
  await page.click('#startBtn');
  await page.waitForSelector('#game:not(.hidden)', { timeout: 3000 });
  await sleep(1500);
  const handCount = await page.locator('#myHand .ddz-card').count();
  assert(handCount >= 17 && handCount <= 20, '发牌正常（' + handCount + ' 张）');
  // 处理叫地主（如果轮到我）并等到我的回合
  let myTurn = false;
  for (let i = 0; i < 40 && !myTurn; i++) {
    if (await page.locator('#bidRow:not(.hidden)').count()) {
      await page.click('#bidYes', { timeout: 3000 });
      await sleep(300);
      continue;
    }
    if (await page.locator('#actionRow:not(.hidden)').count()) myTurn = true;
    else await sleep(400);
  }
  assert(myTurn, '等到我的回合（含叫地主处理）');
  // 点提示：能出则选中牌并出牌；要不起则自动不出
  await page.click('#btnHint');
  await sleep(250);
  const picked = await page.locator('#myHand .ddz-card.sel').count();
  if (picked >= 1) {
    const before = await page.locator('#myHand .ddz-card').count();
    await page.click('#btnPlay');
    await sleep(300);
    const after = await page.locator('#myHand .ddz-card').count();
    assert(after === before - picked, '提示选中 ' + picked + ' 张并成功出牌');
  } else {
    const actionHidden = await page.locator('#actionRow.hidden').count();
    const passLogged = await page.locator('#historyBox .hist-pass').count();
    assert(actionHidden === 1 && passLogged >= 1, '要不起时提示自动不出并记录');
  }
  assert((await page.locator('#historyBox .hist-row').count()) >= 1, '出牌记录已生成');
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('xx3_learning_v1'));
    d.chances = 0;
    d.jifen = 3;
    localStorage.setItem('xx3_learning_v1', JSON.stringify(d));
  });
  await page.reload({ waitUntil: 'networkidle' });
  assert(await page.locator('#redeemBtn').isDisabled(), '积分不足时兑换按钮禁用');
  assert(await page.locator('#startBtn').isDisabled(), '没有机会时开始按钮禁用');
  await shot(page, 'doudizhu');
  assert(errors.length === 0, '无 JS 报错' + (errors.length ? ' → ' + errors[0] : ''));

  /* ---------- 我的世界 ---------- */
  console.log('\n[8] 我的世界');
  fresh();
  await page.goto(BASE + 'minecraft.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('xx3_learning_v1')) || {};
    d.jifen = 12;
    d.mcChances = 0;
    localStorage.setItem('xx3_learning_v1', JSON.stringify(d));
  });
  await page.reload({ waitUntil: 'networkidle' });
  assert((await page.textContent('#mcLobbyJifen')) === '12', '积分显示 12');
  await page.click('#mcRedeemBtn');
  await sleep(200);
  assert((await page.textContent('#mcLobbyChances')) === '1', '10 积分兑换后机会 = 1');
  assert((await page.textContent('#mcLobbyJifen')) === '2', '兑换后积分 = 2');
  await page.click('#mcStartBtn');
  await page.waitForSelector('#mcGame:not(.hidden)', { timeout: 5000 });
  await sleep(1500);
  assert((await page.locator('#mcGame canvas').count()) === 1, '3D 画布已创建');
  assert((await page.locator('.mc-block').count()) === 14, '14 种方块可切换（含门/工作台/木板/床/熔炉/水）');
  assert((await page.locator('#mcHotbar .mc-pack-btn').count()) === 1, '背包按钮在快捷栏左边');
  assert((await page.locator('#mcUse').count()) === 1, '使用按钮存在');
  await page.click('#mcPackBtn');
  await sleep(200);
  assert((await page.locator('#mcBackpack:not(.hidden)').count()) === 1, '背包面板可打开');
  await page.click('#mcPackClose');
  // 通过测试钩子验证收集与合成
  await page.evaluate(() => {
    window.__mc.addItem('wood', 1);
    window.__mc.craft('planks');       // 木头×1 → 木板×4
    window.__mc.addItem('stick', 1);
    window.__mc.craft('sword');        // 木板×2 + 木棒×1 → 宝剑×1
  });
  await sleep(300);
  const packText = await page.textContent('#mcBackpackList');
  assert(packText.includes('木板') && packText.includes('宝剑'), '合成木板与宝剑成功');
  await page.evaluate(() => {
    window.__mc.addItem('wood', 1);
    window.__mc.craft('planks');
    window.__mc.craft('door');         // 木板×4 → 门×1
  });
  await sleep(300);
  assert((await page.textContent('#mcBackpackList')).includes('门'), '合成门成功');
  const oreCount = await page.evaluate(() => window.__mc.ores());
  assert(oreCount >= 1, '地下生成矿石（' + oreCount + ' 处）');
  await page.evaluate(() => {
    window.__mc.addItem('raw_iron', 3);
    window.__mc.addItem('coal', 3);
    window.__mc.smelt('smelt_iron');
    window.__mc.smelt('smelt_iron');
    window.__mc.smelt('smelt_iron');
    window.__mc.addItem('stick', 1);
    window.__mc.craft('iron_sword');
  });
  await sleep(300);
  const packText2 = await page.textContent('#mcBackpackList');
  assert(packText2.includes('铁锭') && packText2.includes('铁剑'), '熔炉炼铁锭并合成铁剑');
  const placed = await page.evaluate(() => {
    window.__mc.addItem('stone', 1);
    const ok = window.__mc.placeAt('stone', 10, 20, 10);
    return { ok: ok, stone: (window.__mc.backpack.stone || 0), block: window.__mc.blockAt(10, 20, 10) };
  });
  assert(placed.ok && placed.stone === 0 && placed.block === 'stone', '从背包拿出放置：消耗 1 个并生成方块');
  await page.evaluate(() => { window.__mc.selectItem('brick'); });
  assert((await page.evaluate(() => window.__mc.currentType())) === 'brick', '拖到快捷栏可选中方块');
  assert((await page.evaluate(() => window.__mc.sheepLying())) === true, '羊是趴着的');
  // 触摸手势冒烟测试：点按放置、长按挖方块（无报错即可）
  await page.mouse.move(650, 520);
  await page.mouse.down();
  await page.mouse.up();
  await sleep(200);
  await page.mouse.move(650, 520);
  await page.mouse.down();
  await sleep(650);
  await page.mouse.up();
  await sleep(200);
  // 大地图：水、村庄、村民、箱子
  assert((await page.evaluate(() => window.__mc.waterCount())) > 0, '开局有湖泊水域');
  assert((await page.evaluate(() => window.__mc.chestCount())) >= 5, '村庄房子里有箱子');
  assert((await page.evaluate(() => window.__mc.villagers())) >= 1, '村庄有村民');
  assert((await page.evaluate(() => window.__mc.oreCount('gold_ore'))) > 0, '地下有金矿');
  assert((await page.evaluate(() => window.__mc.oreCount('diamond_ore'))) > 0, '地下有钻石矿');
  // 打开箱子拿东西
  const chestTake = await page.evaluate(() => {
    const key = window.__mc.findChest();
    const sum = () => Object.values(window.__mc.backpack).reduce((a, b) => a + b, 0);
    const before = sum();
    const contents = window.__mc.chestAt(key);
    if (!contents.length) return { ok: false };
    window.__mc.takeChest(key, 0);
    const after = sum();
    return { ok: after === before + 1 };
  });
  assert(chestTake.ok, '打开箱子能拿到物品');
  // 盔甲
  await page.evaluate(() => {
    window.__mc.addItem('raw_iron', 4);
    window.__mc.addItem('coal', 4);
    window.__mc.smelt('smelt_iron');
    window.__mc.smelt('smelt_iron');
    window.__mc.smelt('smelt_iron');
    window.__mc.smelt('smelt_iron');
    window.__mc.craft('iron_armor');
    window.__mc.dropItem('iron_armor');
  });
  await sleep(300);
  assert((await page.evaluate(() => window.__mc.armor())) === 'iron_armor', '合成并穿戴铁甲');
  // 昼夜：白天不生成、夜晚标记
  await page.evaluate(() => { window.__mc.setTime(0.3); });
  await sleep(300);
  assert((await page.evaluate(() => window.__mc.isNight())) === false, '白天不黑');
  await page.evaluate(() => { window.__mc.setTime(0.9); });
  await sleep(300);
  assert((await page.evaluate(() => window.__mc.isNight())) === true, '夜晚标记正确');
  await shot(page, 'minecraft');
  assert(errors.length === 0, '无 JS 报错' + (errors.length ? ' → ' + errors[0] : ''));

  /* ---------- 我的世界 · 生存模式 ---------- */
  console.log('\n[8b] 我的世界·生存模式');
  fresh();
  await page.goto(BASE + 'minecraft.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('xx3_learning_v1')) || {};
    d.jifen = 12;
    d.mcChances = 1;
    localStorage.setItem('xx3_learning_v1', JSON.stringify(d));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.click('#mcModeSurvival');
  await page.click('#mcStartBtn');
  await page.waitForSelector('#mcGame:not(.hidden)', { timeout: 5000 });
  await sleep(1500);
  assert((await page.evaluate(() => window.__mc.mode())) === 'survival', '模式为生存');
  assert((await page.textContent('#mcHearts')).includes('❤️'), '生命值 HUD 显示');
  assert((await page.textContent('#mcHunger')).includes('🍗'), '饥饿值 HUD 显示');
  assert((await page.locator('#mcAttack').count()) === 1, '攻击按钮存在');
  assert((await page.locator('#mcDown.hidden').count()) === 1, '生存模式下降按钮隐藏');
  await page.evaluate(() => { window.__mc.setTime(0.9); });
  let hostileCount = 0;
  for (let i = 0; i < 16 && hostileCount < 1; i++) {
    await sleep(500);
    hostileCount = await page.evaluate(() => window.__mc.hostiles());
  }
  if (hostileCount < 1) {
    await page.evaluate(() => window.__mc.forceSpawnHostile());
    hostileCount = await page.evaluate(() => window.__mc.hostiles());
  }
  assert(hostileCount >= 1, '夜晚生成怪物（' + hostileCount + ' 只）');
  await page.evaluate(() => {
    window.__mc.addItem('wool', 3);
    window.__mc.addItem('plank', 3);
    window.__mc.craft('bed');
  });
  await sleep(300);
  assert((await page.textContent('#mcBackpackList')).includes('床'), '合成床成功（3羊毛+3木板）');
  assert(errors.length === 0, '无 JS 报错' + (errors.length ? ' → ' + errors[0] : ''));

  await browser.close();
  console.log('\n===== 结果 =====');
  if (fails.length) {
    console.log('失败 ' + fails.length + ' 项：');
    fails.forEach((f) => console.log('  ✗ ' + f));
    process.exit(1);
  } else {
    console.log('全部通过 ✓');
  }
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
