import { test, expect } from '@playwright/test';
import path from 'node:path';

// ✅ This tells Playwright to use your saved login session
test.use({ storageState: 'e2e/storage/auth.json' });

test('upload image → generate caption → caption appears', async ({ page }) => {
  await page.goto('/upload');

  const filePath = path.resolve(__dirname, 'fixtures', 'test.png');
  const fileInput = page.getByTestId('file-input');
  await fileInput.setInputFiles(filePath);

  const generate = page.getByTestId('generate-btn');
  await expect(generate).toBeEnabled({ timeout: 10_000 });
  await generate.click();

  const output = page.getByTestId('caption-output');
  await expect(output).toHaveText(/[\S]+/, { timeout: 60_000 });

  const text = (await output.textContent())?.trim() ?? '';
  expect(text.length).toBeGreaterThan(5);
});
