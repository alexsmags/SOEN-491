import { test, expect } from '@playwright/test';
import path from 'node:path';

test.use({ storageState: 'e2e/storage/auth.json' });

test('save to workspace → shows saved card', async ({ page }) => {
  await page.route('**/api/media', async route => {
    const req = route.request();
    const url = new URL(req.url());

    if (req.method() === 'POST' && url.pathname === '/api/media') {
      return route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: 'm1' }),
      });
    }

    return route.fallback();
  });

  await page.route('**/api/media?page=1&pageSize=12', async route => {
    return route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        items: [
          {
            id: 'm1',
            caption: 'test_caption',
            imageUrl: '/img/1.png',
            createdAt: new Date().toISOString(),
          },
        ],
        hasNext: false,
      }),
    });
  });

  await page.goto('/upload');

  const filePath = path.resolve(__dirname, 'fixtures', 'test.png');
  await page.getByTestId('file-input').setInputFiles(filePath);

  const generate = page.getByTestId('generate-btn');
  await expect(generate).toBeEnabled({ timeout: 10_000 });
  await generate.click();

  const output = page.getByTestId('caption-output');
  await expect(output).toBeVisible({ timeout: 60_000 });

  const saveRespPromise = page.waitForResponse(resp => {
    try {
      const url = new URL(resp.url());
      return resp.request().method() === 'POST' && url.pathname === '/api/media' && resp.status() === 200;
    } catch {
      return false;
    }
  });
  await page.getByRole('button', { name: /save/i }).click();
  await saveRespPromise;

  await page.goto('/workspace');

  await page.waitForSelector('[data-testid="skeleton-grid"]', { state: 'detached', timeout: 10_000 });

  const grid = page.getByTestId('workspace-grid');
  await expect(grid).toBeVisible();

  const card = grid.locator('[data-testid="workspace-card"][data-media-id="m1"]');
  await expect(card).toBeVisible();

  await expect(card.getByTestId('workspace-caption')).toHaveText('test_caption');


  await expect(card.locator('[data-testid="workspace-card-image"]')).toBeVisible();
});
