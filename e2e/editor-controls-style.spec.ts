import { test, expect } from '@playwright/test';
import path from 'node:path';

test.use({ storageState: 'e2e/storage/auth.json' });

const SERVER_MEDIA_URL = '**/api/media/m1';
const FIXTURE_IMG_URL = '**/fixtures/test.png';

function seedMedia() {
  return {
    id: 'm1',
    imageUrl: '/fixtures/test.png',
    caption: 'hello world',
    fontFamily: 'Arial',
    fontSize: 24,
    textColor: '#FFFFFF',
    align: 'center' as const,
    showBg: true,
    bgColor: '#3B3F4A',
    bgOpacity: 0.8,
    posX: 100,
    posY: 120,
  };
}

async function mockEditorRoutes(page: import('@playwright/test').Page) {
  const filePath = path.resolve(__dirname, 'fixtures', 'test.png');

  await page.route(SERVER_MEDIA_URL, route =>
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(seedMedia()),
    })
  );

  await page.route(FIXTURE_IMG_URL, async route => {
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

  await page.route(SERVER_MEDIA_URL, route => {
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
}

async function gotoEditor(page: import('@playwright/test').Page) {
  await page.goto('/editor?id=m1');
  await expect(page.getByTestId('editor-frame')).toBeVisible();
  await expect(page.getByTestId('editor-controls')).toBeVisible();
}


test('editor: change font & size → save sends updated typography', async ({ page }) => {
  await mockEditorRoutes(page);
  await gotoEditor(page);

  await page.getByTestId('editor-font-select').selectOption({ label: 'Georgia' });

  const newSize = 36;
  await page.getByTestId('editor-fontsize-range').fill(String(newSize));
  await expect(page.getByTestId('editor-fontsize-value')).toHaveText(String(newSize));

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

  expect(payload.fontFamily).toBe('Georgia');
  expect(payload.fontSize).toBe(newSize);

  await expect(page.getByTestId('editor-toast')).toBeVisible();
});


test('editor: change alignment → save sends updated align', async ({ page }) => {
  await mockEditorRoutes(page);
  await gotoEditor(page);

  await page.getByTitle('Align left', { exact: true }).click();
  await expect(page.getByTestId('editor-align-value')).toHaveText('left');

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

  expect(['left', 'center', 'right']).toContain(payload.align);
  expect(payload.align).toBe('left');

  await expect(page.getByTestId('editor-toast')).toBeVisible();
});


test('editor: toggle background off → save sends showBg=false and hides bg controls', async ({ page }) => {
  await mockEditorRoutes(page);
  await gotoEditor(page);

  const toggle = page.getByTestId('editor-toggle-bg');
  await expect(toggle).toBeChecked();

  await toggle.click();
  await expect(toggle).not.toBeChecked();

  await expect(page.getByTestId('editor-bg-opacity')).toHaveCount(0);
  await expect(page.getByTestId('editor-bg-swatch-list')).toHaveCount(0);

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

  expect(payload.showBg).toBe(false);
  await expect(page.getByTestId('editor-toast')).toBeVisible();
});


test('editor: change background color & opacity → save sends updated bg values', async ({ page }) => {
  await mockEditorRoutes(page);
  await gotoEditor(page);

  const toggle = page.getByTestId('editor-toggle-bg');
  if (!(await toggle.isChecked())) {
    await toggle.click();
    await expect(toggle).toBeChecked();
  }

  const firstBgSwatch = page.locator('[data-testid="editor-bg-swatch"]').first();
  const chosenBgColor = await firstBgSwatch.getAttribute('data-color');
  expect(chosenBgColor).toBeTruthy();
  await firstBgSwatch.click();

  const targetOpacity = '0.35';
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

  expect(payload.bgColor?.toLowerCase()).toBe(String(chosenBgColor).toLowerCase());
  expect(payload.bgOpacity).toBeCloseTo(parseFloat(targetOpacity), 3);
  await expect(page.getByTestId('editor-toast')).toBeVisible();
});


test('editor: edit caption text → save sends updated caption', async ({ page }) => {
  await mockEditorRoutes(page);
  await gotoEditor(page);

  const textarea = page.getByTestId('editor-caption-input');
  await textarea.fill('New caption content 🎉');

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

  expect(payload.caption).toBe('New caption content 🎉');
  await expect(page.getByTestId('editor-toast')).toBeVisible();
});


test('editor: center & nudge position → save sends updated posX/posY', async ({ page }) => {
  await mockEditorRoutes(page);
  await gotoEditor(page);

  await page.getByTitle('Center', { exact: true }).click();

  await page.getByTitle('Up', { exact: true }).click();
  await page.getByTitle('Right', { exact: true }).click();

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

  expect(typeof payload.posX).toBe('number');
  expect(typeof payload.posY).toBe('number');
  expect(payload.posX).not.toBe(100);
  expect(payload.posY).not.toBe(120);

  await expect(page.getByTestId('editor-toast')).toBeVisible();
});


test('editor: copy caption → writes current caption to clipboard (stubbed)', async ({ page, context }) => {
  await mockEditorRoutes(page);

  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  await page.addInitScript(() => {
    // @ts-ignore
    window.__lastCopied = '';
    // @ts-ignore
    const orig = navigator.clipboard?.writeText?.bind(navigator.clipboard);
    // @ts-ignore
    navigator.clipboard.writeText = async (t: string) => {
      // @ts-ignore
      window.__lastCopied = t;
      if (orig) {
        try { await orig(t); } catch { /* ignore */ }
      }
    };
  });

  await gotoEditor(page);

  const newCaption = 'Copied caption';
  await page.getByTestId('editor-caption-input').fill(newCaption);
  await page.getByTestId('editor-copy-btn').click();

  const lastCopied = await page.evaluate(() => (window as any).__lastCopied);
  expect(lastCopied).toBe(newCaption);
});
