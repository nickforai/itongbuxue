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
  assert((await page.locator('.mc-block').count()) === 12, '12 种方块可切换（含门/工作台/木板/床）');
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
  await page.evaluate(() => { window.__mc.setTime(0.75); });
  let hostileCount = 0;
  for (let i = 0; i < 16 && hostileCount < 1; i++) {
    await sleep(500);
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
