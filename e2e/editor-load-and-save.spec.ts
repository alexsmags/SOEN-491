import { test, expect } from '@playwright/test';
import path from 'node:path';

test.use({ storageState: 'e2e/storage/auth.json' });

test('editor: load existing media → edit → save', async ({ page }) => {
  const filePath = path.resolve(__dirname, 'fixtures', 'test.png');

  await page.route('**/api/media/m1', route =>
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'm1',
        imageUrl: '/fixtures/test.png',
        caption: 'initial cap',
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

  const captionInput = page.getByTestId('editor-caption-input');
  await captionInput.fill('edited cap');

  const fsRange = page.getByTestId('editor-fontsize-range');
  await fsRange.fill('28');
  await expect(page.getByTestId('editor-fontsize-value')).toHaveText('28');

  await page.getByTitle('Align right').click();

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
  expect(payload.caption).toBe('edited cap');
  expect(payload.fontSize).toBe(28);
  expect(['left', 'center', 'right']).toContain(payload.align);

  await expect(page.getByTestId('editor-toast')).toBeVisible();
});
