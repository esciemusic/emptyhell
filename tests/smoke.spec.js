import { test, expect } from '@playwright/test';

test('EMPTYHELL boots and exposes the playable shell', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('#loading')).toHaveClass(/hidden/, { timeout: 3000 });
  await expect(page.locator('#hud')).toContainText('WASD MOVE');
  await page.screenshot({ path: 'test-results/emptyhell-spawn.png', fullPage: true });

  await page.keyboard.press('m');
  await expect(page.locator('#map-overlay')).not.toHaveClass(/hidden/);
  await expect(page.locator('#map-overlay')).toContainText('PARC-EXTENSION');
  await page.screenshot({ path: 'test-results/emptyhell-map.png', fullPage: true });

  await page.keyboard.press('Escape');
  await expect(page.locator('#map-overlay')).toHaveClass(/hidden/);

  await page.keyboard.press('Escape');
  await expect(page.locator('#pause')).not.toHaveClass(/hidden/);
  await page.screenshot({ path: 'test-results/emptyhell-pause.png', fullPage: true });
});

test('EMPTYHELL accepts movement input without crashing the render shell', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.locator('canvas').click();
  await page.keyboard.down('w');
  await page.waitForTimeout(500);
  await page.keyboard.up('w');
  await expect(page.locator('canvas')).toBeVisible();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.waitForTimeout(250);
  expect(errors).toEqual([]);
});

test('EMPTYHELL exposes the first discovery state', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await expect(page.locator('#world-status')).toContainText('SIGNALS 0 / 3');
  await expect(page.locator('#world-status')).toContainText('WORLD STATE ACTIVE');
});


test('EMPTYHELL persists the first discovery objective state', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('emptyhell.discovery.v1', JSON.stringify(['north','east','rail'])));
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#world-status')).toContainText('SIGNALS 3 / 3');
  await expect(page.locator('#world-status')).toContainText('ROUTE OPEN');
});
