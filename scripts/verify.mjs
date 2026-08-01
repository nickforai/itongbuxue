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
  assert((await page.textContent('#wrongShuxue')).length > 0, '错题本区域渲染');
  await shot(page, 'parent');
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
