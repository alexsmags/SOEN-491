import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/storage/auth.json' });

test('workspace → delete removes card', async ({ page }) => {
  let deleted = false;

  await page.route('**/api/media?page=1&pageSize=12', async route => {
    const body = deleted
      ? { items: [], hasNext: false }
      : {
          items: [
            {
              id: 'm1',
              caption: 'test_caption',
              imageUrl: '/img/1.png',
              createdAt: new Date().toISOString(),
            },
          ],
          hasNext: false,
        };
    return route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  });

  await page.route('**/api/media?*', async route => {
    if (route.request().method() !== 'GET') return route.fallback();
    const body = deleted
      ? { items: [], hasNext: false }
      : {
          items: [
            {
              id: 'm1',
              caption: 'test_caption',
              imageUrl: '/img/1.png',
              createdAt: new Date().toISOString(),
            },
          ],
          hasNext: false,
        };
    return route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  });

  await page.route('**/api/media/m1', async route => {
    if (route.request().method() === 'DELETE') {
      deleted = true;
      return route.fulfill({ status: 204, body: '' });
    }
    return route.fallback();
  });

  await page.route('**/*', route => {
    if (route.request().method() === 'HEAD') {
      return route.fulfill({
        status: 200,
        headers: { 'cache-control': 'no-cache' },
        body: '',
      });
    }
    return route.fallback();
  });

  const onePxPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
    'base64'
  );
  await page.route('**/*', route => {
    const req = route.request();
    if (req.method() === 'GET' && req.resourceType() === 'image') {
      return route.fulfill({
        status: 200,
        headers: { 'content-type': 'image/png', 'cache-control': 'no-cache' },
        body: onePxPng,
      });
    }
    return route.fallback();
  });

  const listRespPromise = page.waitForResponse(resp => {
    try {
      const url = new URL(resp.url());
      return resp.request().method() === 'GET' && url.pathname === '/api/media' && resp.status() === 200;
    } catch {
      return false;
    }
  });
  await page.goto('/workspace');
  await listRespPromise;

  await page.waitForSelector('[data-testid="workspace-grid"]', { timeout: 10000 });
  await page.waitForSelector('[data-testid="skeleton-grid"]', { state: 'detached', timeout: 10000 }).catch(() => {});

  const grid = page.getByTestId('workspace-grid');
  const card = grid.locator('[data-testid="workspace-card"][data-media-id="m1"]');
  await expect(card).toBeVisible({ timeout: 10000 });

  await card.getByTestId('workspace-card-more').click({ force: true });
  await page.getByTestId('workspace-card-delete').click();

  await expect(page.getByTestId('confirm-modal')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('confirm-modal-confirm').click();

  await expect(card).toHaveCount(0);
});
