import { test, expect } from '@playwright/test';
import path from 'node:path';

test.use({ storageState: 'e2e/storage/auth.json' });

test('editor: change text & background colors → save sends updated colors', async ({ page }) => {
  const filePath = path.resolve(__dirname, 'fixtures', 'test.png');

  await page.route('**/api/media/m1', route =>
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'm1',
        imageUrl: '/fixtures/test.png',
        caption: 'color test',
        fontFamily: 'Arial',
        fontSize: 24,
        textColor: '#FFFFFF',
        align: 'center',
        showBg: true,
        bgColor: '#3B3F4A',
        bgOpacity: 0.8,
        posX: 100,
        posY: 120
      }),
    })
  );

  await page.route('**/fixtures/test.png', async route => {
    const method = route.request().method();
    if (method === 'HEAD') {
      return route.fulfill({ status: 200, headers: { 'cache-control': 'no-cache' }, body: '' });
    }
    return route.fulfill({
      status: 200,
      headers: { 'content-type': 'image/png', 'cache-control': 'no-cache' },
      path: filePath,
    });
  });

  await page.route('**/api/media/m1', route => {
    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON() as any;
      return route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ item: { id: 'm1', imageUrl: '/fixtures/test.png', ...body } }),
      });
    }
    return route.fallback();
  });

  await page.goto('/editor?id=m1');

  await expect(page.getByTestId('editor-frame')).toBeVisible();
  await expect(page.getByTestId('editor-controls')).toBeVisible();

  const firstTextSwatch = page.locator('[data-testid="editor-color-swatch"]').first();
  const chosenTextColor = await firstTextSwatch.getAttribute('data-color');
  expect(chosenTextColor).toBeTruthy();
  await firstTextSwatch.click();

  const firstBgSwatch = page.locator('[data-testid="editor-bg-swatch"]').first()
  const chosenBgColor = await firstBgSwatch.getAttribute('data-color');
  expect(chosenBgColor).toBeTruthy();
  await firstBgSwatch.click();

  const targetOpacity = '0.4';
  await page.getByTestId('editor-bg-opacity').fill(targetOpacity);

  const putPromise = page.waitForRequest(req => {
    try {
      const u = new URL(req.url());
      return req.method() === 'PUT' && u.pathname === '/api/media/m1';
    } catch {
      return false;
    }
  });

  await page.getByTestId('editor-save-btn').click();

  const putReq = await putPromise;
  const payload = putReq.postDataJSON() as any;

  expect(payload.textColor?.toLowerCase()).toBe(String(chosenTextColor).toLowerCase());

  expect(payload.bgColor?.toLowerCase()).toBe(String(chosenBgColor).toLowerCase());
  expect(payload.bgOpacity).toBeCloseTo(parseFloat(targetOpacity), 3);

  expect(payload.fontSize).toBeDefined();
  expect(['left','center','right']).toContain(payload.align);

  await expect(page.getByTestId('editor-toast')).toBeVisible();
});
