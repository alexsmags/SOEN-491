import { test, expect, Page, Route } from '@playwright/test';
import path from 'node:path';

test.use({ storageState: 'e2e/storage/auth.json' });

async function setupEditorWithFixture(page: Page): Promise<void> {
  const filePath = path.resolve(__dirname, 'fixtures', 'test.png');

  await page.route('**/api/media/m1', (route: Route) =>
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'm1',
        imageUrl: '/fixtures/test.png',
        caption: 'test caption',
        fontFamily: 'Arial',
        fontSize: 24,
        textColor: '#FFFFFF',
        align: 'center',
        showBg: true,
        bgColor: '#3B3F4A',
        bgOpacity: 0.8,
        posX: 100,
        posY: 120,
      }),
    })
  );

  // Serve the actual PNG and pass HEAD checks
  await page.route('**/fixtures/test.png', async (route: Route) => {
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
}

async function installDownloadSpies(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as any).__dlCalls = [];
    (window as any).__lastDownload = null;

    const callsRef: Array<{ method: string; type?: string; quality?: number }> = (window as any).__dlCalls;

    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (type?: string, quality?: any) {
      callsRef.push({ method: 'toDataURL', type, quality });
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
    };

    const origToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (cb: (b: Blob | null) => void, type?: string, quality?: any) {
      callsRef.push({ method: 'toBlob', type, quality });
      const blob = new Blob(['x'], { type: type || 'image/png' });
      cb(blob);
    };

    const origAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      (window as any).__lastDownload = {
        href: this.href,
        download: this.download,
      };
      try {
        return origAnchorClick.call(this);
      } catch {
      }
    };

    const origCreateObjURL = URL.createObjectURL;
    URL.createObjectURL = function (obj: any) {
      try {
        return 'blob:playwright-fake';
      } catch {
        return origCreateObjURL(obj as any);
      }
    };
  });
}

test('editor: download PNG uses PNG export and .png filename', async ({ page }: { page: Page }) => {
  await setupEditorWithFixture(page);
  await installDownloadSpies(page);

  await page.goto('/editor?id=m1');

  const openBtn = page.getByTitle('Download image');
  await expect(openBtn).toBeVisible({ timeout: 10_000 });

  await openBtn.click();

  const modal = page.getByRole('dialog', { name: 'Download options' });
  await expect(modal).toBeVisible();

  await modal.getByPlaceholder('image_with_caption').fill('my_png_post');

  await modal.getByRole('button', { name: /^Download$/ }).click();
  await expect(modal).toHaveCount(0);

  const { calls, last } = await page.evaluate(() => {
    return {
      calls: (window as any).__dlCalls as Array<{ method: string; type?: string; quality?: number }>,
      last: (window as any).__lastDownload as { href: string; download: string } | null,
    };
  });

  expect(calls.length).toBeGreaterThan(0);

  const latest = calls[calls.length - 1];
  expect((latest.type || '').toLowerCase()).toContain('png');

  expect(last).toBeTruthy();
  expect(last!.download.toLowerCase()).toBe('my_png_post.png');
  expect(last!.href.startsWith('blob:') || last!.href.startsWith('data:')).toBeTruthy();
});
