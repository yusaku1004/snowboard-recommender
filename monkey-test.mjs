import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const results = { pass: [], fail: [] };

function log(msg) { console.log(msg); }
function pass(name) { results.pass.push(name); log(`  ✅ ${name}`); }
function fail(name, err) { results.fail.push({ name, err: String(err) }); log(`  ❌ ${name}: ${err}`); }

async function waitForNav(page) {
  await page.waitForTimeout(400);
}

async function closeBottomSheet(page) {
  const isOpen = await page.locator('.fixed.inset-0.z-50').isVisible().catch(() => false);
  if (!isOpen) return;
  await page.evaluate(() => {
    const backdrop = document.querySelector('.fixed.inset-0.z-50 .absolute.inset-0.bg-black\\/70');
    if (backdrop) backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(600);
  // 念のため2回試みる
  const stillOpen = await page.locator('.fixed.inset-0.z-50').isVisible().catch(() => false);
  if (stillOpen) {
    await page.evaluate(() => {
      const backdrop = document.querySelector('.fixed.inset-0.z-50 .absolute.inset-0');
      if (backdrop) backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    await page.waitForTimeout(500);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture JS errors
  const jsErrors = [];
  page.on('pageerror', err => jsErrors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') jsErrors.push(msg.text());
  });

  log('\n=== スノーボード診断 モンキーテスト ===\n');

  // ─── STEP 1: ページ読み込み ───
  log('【STEP 1: ページ読み込み】');
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('h1', { timeout: 5000 });
    const title = await page.textContent('h1');
    if (title.includes('スノーボード')) pass('ページタイトル表示');
    else fail('ページタイトル表示', `予期しないタイトル: ${title}`);
  } catch (e) { fail('ページ読み込み', e); }

  // ─── STEP 1: 体格入力 ───
  log('\n【STEP 1: 体格入力】');
  try {
    const heightVal = await page.inputValue('input[type=range]');
    if (heightVal) pass('身長スライダー表示');
  } catch (e) { fail('身長スライダー表示', e); }

  // タイプ切替
  try {
    const genderBtns = await page.locator('button').filter({ hasText: 'レディース' });
    await genderBtns.click();
    await waitForNav(page);
    pass('レディース選択');
    const mensBtns = await page.locator('button').filter({ hasText: 'メンズ' });
    await mensBtns.click();
    await waitForNav(page);
    pass('メンズ選択');
  } catch (e) { fail('ジェンダー切替', e); }

  // 身長を端値に変更
  try {
    await page.locator('input[type=range]').first().fill('200');
    await waitForNav(page);
    const display = await page.locator('text=200cm').first();
    if (await display.isVisible()) pass('身長最大値 200cm 表示');
    else fail('身長最大値表示', '200cm が見つからない');
  } catch (e) { fail('身長スライダー操作', e); }

  // 次へ
  try {
    await page.locator('button', { hasText: '次へ' }).click();
    await waitForNav(page);
    await page.waitForSelector('text=スタイルを入力', { timeout: 3000 });
    pass('STEP1→STEP2 遷移');
  } catch (e) { fail('STEP1→STEP2 遷移', e); }

  // ─── STEP 2: スタイル入力 ───
  log('\n【STEP 2: スタイル入力】');

  // プリセット適用
  try {
    await page.locator('button', { hasText: 'グラトリ' }).first().click();
    await waitForNav(page);
    pass('グラトリプリセット適用');
  } catch (e) { fail('プリセット適用', e); }

  // レーダーチャート表示確認
  try {
    const radar = page.locator('.recharts-wrapper').first();
    if (await radar.isVisible()) pass('スタイル画面レーダーチャート表示');
    else fail('スタイル画面レーダーチャート表示', '表示されていない');
  } catch (e) { fail('スタイル画面レーダーチャート', e); }

  // スライダー操作
  try {
    const sliders = await page.locator('input[type=range]').all();
    if (sliders.length >= 5) {
      for (const s of sliders) await s.fill('5');
      pass(`スタイルスライダー全操作 (${sliders.length}個)`);
    }
  } catch (e) { fail('スタイルスライダー操作', e); }

  // 戻るボタン
  try {
    await page.locator('button', { hasText: '戻る' }).click();
    await waitForNav(page);
    await page.waitForSelector('text=体格を入力', { timeout: 3000 });
    pass('STEP2→STEP1 戻る');
    await page.locator('button', { hasText: '次へ' }).click();
    await waitForNav(page);
    await page.locator('button', { hasText: '次へ' }).click();
    await waitForNav(page);
  } catch (e) { fail('戻るボタン', e); }

  // ─── STEP 3: 予算入力 ───
  log('\n【STEP 3: 予算入力】');
  try {
    await page.waitForSelector('text=予算', { timeout: 3000 });
    pass('予算ステップ表示');
  } catch (e) { fail('予算ステップ表示', e); }

  try {
    const slider = page.locator('input[type=range]').first();
    await slider.fill('150000');
    await waitForNav(page);
    pass('予算スライダー操作');
  } catch (e) { fail('予算スライダー操作', e); }

  try {
    await page.locator('button', { hasText: '次へ' }).click();
    await waitForNav(page);
    await page.waitForSelector('text=こだわり', { timeout: 3000 });
    pass('STEP3→STEP4 遷移');
  } catch (e) { fail('STEP3→STEP4 遷移', e); }

  // ─── STEP 4: こだわり条件 ───
  log('\n【STEP 4: こだわり条件】');

  // 形状フィルター
  try {
    await page.locator('button', { hasText: 'キャンバー' }).first().click();
    await waitForNav(page);
    pass('形状フィルター切替');
  } catch (e) { fail('形状フィルター切替', e); }

  // メーカー全解除
  try {
    const clearBtn = page.locator('button', { hasText: '全解除' }).first();
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await waitForNav(page);
      pass('メーカー全解除');
    } else {
      pass('メーカー全解除ボタン確認 (全選択状態)');
    }
  } catch (e) { fail('メーカー全解除', e); }

  // すべて選択
  try {
    const allBtn = page.locator('button', { hasText: 'すべて選択' }).first();
    if (await allBtn.isVisible()) {
      await allBtn.click();
      await waitForNav(page);
      pass('メーカーすべて選択');
    }
  } catch (e) { fail('メーカーすべて選択', e); }

  // スキップ
  try {
    await page.locator('button', { hasText: 'スキップ' }).click();
    await waitForNav(page);
    pass('こだわりスキップ');
  } catch (e) { fail('こだわりスキップ', e); }

  // ─── STEP 5: 結果表示 ───
  log('\n【STEP 5: 結果表示】');
  try {
    await page.waitForSelector('text=マッチ度', { timeout: 8000 });
    pass('結果画面表示');
  } catch (e) { fail('結果画面表示', e); }

  // ボードカード表示
  try {
    const cards = await page.locator('.fade-in-up').all();
    if (cards.length > 0) pass(`ボードカード表示 (${cards.length}件)`);
    else fail('ボードカード表示', 'カードが0件');
  } catch (e) { fail('ボードカード表示', e); }

  // カード展開
  try {
    await page.locator('.fade-in-up').first().click();
    await waitForNav(page);
    const radar = page.locator('.recharts-wrapper').first();
    if (await radar.isVisible()) pass('カード展開・レーダーチャート表示');
    else fail('カード展開レーダーチャート', '表示されていない');
  } catch (e) { fail('カード展開', e); }

  // 「似たボードを探す」ボタン
  try {
    const similarBtn = page.locator('button', { hasText: '似たボードを探す' }).first();
    if (await similarBtn.isVisible()) {
      await similarBtn.click();
      await waitForNav(page);
      await page.waitForSelector('text=に似たボード', { timeout: 3000 });
      pass('類似ボード BottomSheet 表示');
      await closeBottomSheet(page);
    }
  } catch (e) { fail('類似ボード検索', e); }

  // 「〇〇で絞り込む」ボタン
  try {
    const filterBtn = page.locator('button').filter({ hasText: 'で絞り込む' }).first();
    if (await filterBtn.isVisible()) {
      const brandName = (await filterBtn.textContent()).replace('で絞り込む', '');
      await filterBtn.click();
      await waitForNav(page);
      pass(`ブランド絞り込み: ${brandName}`);
    }
  } catch (e) { fail('ブランド絞り込み', e); }

  // ソート
  try {
    const sortBtns = ['価格が安い順', '価格が高い順', 'flex 柔→硬', 'flex 硬→柔', 'マッチ度'];
    for (const label of sortBtns) {
      const btn = page.locator('button', { hasText: label }).first();
      if (await btn.isVisible()) {
        await btn.click();
        await waitForNav(page);
      }
    }
    pass('全ソートボタン切替');
  } catch (e) { fail('ソート切替', e); }

  // スタイルチップ
  try {
    const chips = ['グラトリ', 'パーク', 'カービング', 'ラントリ', 'パウダー', '総合'];
    for (const label of chips) {
      const btn = page.locator('button', { hasText: label }).first();
      if (await btn.isVisible()) await btn.click();
      await waitForNav(page);
    }
    pass('スタイルチップ全切替');
  } catch (e) { fail('スタイルチップ切替', e); }

  // 比較バーを閉じる (× ボタンをPlaywrightのネイティブクリックで押す)
  try {
    const compareBar = page.locator('.fixed.bottom-6').first();
    if (await compareBar.isVisible().catch(() => false)) {
      // 「比較する」を含まないボタン = × ボタン
      const closeBtns = compareBar.locator('button').filter({ hasNotText: '比較する' });
      const count = await closeBtns.count();
      if (count > 0) {
        await closeBtns.first().click({ force: true });
        await waitForNav(page);
      }
    }
  } catch (_) {}

  // 絞り込みシート
  try {
    const filterSheetBtn = page.locator('button').filter({ hasText: /絞り込/ }).first();
    await filterSheetBtn.click();
    await waitForNav(page);
    await page.waitForSelector('text=形状', { timeout: 3000 });
    pass('絞り込みシート開閉');

    // 全解除
    const clearAll = page.locator('button', { hasText: '全解除' }).first();
    if (await clearAll.isVisible()) {
      await clearAll.click();
      await waitForNav(page);
      pass('絞り込みシート メーカー全解除');
    }

    await page.locator('button', { hasText: '適用する' }).click();
    await waitForNav(page);
    pass('絞り込みシート適用');
  } catch (e) { fail('絞り込みシート', e); }

  // 比較ボタン (2枚選択)
  try {
    const compareBtns = await page.locator('button[aria-label="比較に追加"]').all();
    if (compareBtns.length >= 2) {
      await compareBtns[0].click();
      await waitForNav(page);
      await compareBtns[1].click();
      await waitForNav(page);
      const compareBar = page.locator('button', { hasText: '比較する' });
      if (await compareBar.isVisible()) {
        await compareBar.click();
        await waitForNav(page);
        await page.waitForSelector('text=ボード比較', { timeout: 3000 });
        pass('ボード比較 BottomSheet 表示');
        await closeBottomSheet(page);
      }
    } else {
      pass('比較ボタン確認 (カードが展開されていない)');
    }
  } catch (e) { fail('ボード比較', e); }

  // お気に入りタブ
  try {
    const favTab = page.locator('button', { hasText: 'お気に入り' }).first();
    if (await favTab.isVisible()) {
      await favTab.click();
      await waitForNav(page);
      pass('お気に入りタブ切替');
      const resultsTab = page.locator('button', { hasText: '結果' }).first();
      await resultsTab.click();
      await waitForNav(page);
    }
  } catch (e) { fail('お気に入りタブ', e); }

  // シェアボタン
  try {
    const shareBtn = page.locator('button', { hasText: 'URLをコピー' }).first();
    if (await shareBtn.isVisible()) {
      await shareBtn.click();
      await waitForNav(page);
      pass('URLコピーボタン');
    }
  } catch (e) { fail('URLコピー', e); }

  // もう一度診断
  try {
    const restartBtn = page.locator('button', { hasText: 'もう一度診断' }).first();
    if (await restartBtn.isVisible()) {
      await restartBtn.click();
      await waitForNav(page);
      await page.waitForSelector('text=体格を入力', { timeout: 3000 });
      pass('もう一度診断ボタン');
    }
  } catch (e) { fail('もう一度診断', e); }

  // ─── JS エラー確認 ───
  log('\n【JS エラー確認】');
  const filteredErrors = jsErrors.filter(e =>
    !e.includes('Fast Refresh') &&
    !e.includes('Warning:') &&
    !e.includes('Download the React DevTools')
  );
  if (filteredErrors.length === 0) {
    pass('JS ランタイムエラーなし');
  } else {
    filteredErrors.forEach(e => fail('JS エラー', e.substring(0, 120)));
  }

  await browser.close();

  // ─── 結果サマリー ───
  log('\n============================');
  log(`✅ PASS: ${results.pass.length}`);
  log(`❌ FAIL: ${results.fail.length}`);
  if (results.fail.length > 0) {
    log('\n失敗した項目:');
    results.fail.forEach(f => log(`  - ${f.name}: ${f.err.substring(0, 100)}`));
  }
  log('============================\n');

  process.exit(results.fail.length > 0 ? 1 : 0);
})();
