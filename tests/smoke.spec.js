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


test('EMPTYHELL restores completed transmission progression', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('emptyhell.transmission.v1', 'complete'));
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#world-status')).toContainText('TRANSMISSION');
  await expect(page.locator('#world-status')).toContainText('ENCOUNTER ACTIVE');
});

test('EMPTYHELL restores completed encounter progression', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('emptyhell.encounter.v1', 'complete'));
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#world-status')).toContainText('ENCOUNTER COMPLETE');
});


test('EMPTYHELL restores the physical path unlock', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('emptyhell.door.v1', 'open'));
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#world-status')).toContainText('PATH OPEN');
});


test('EMPTYHELL restores the first post-path fragment state', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('emptyhell.fragment.v1', 'found'));
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#world-status')).toContainText('FRAGMENT FOUND');
});


test('EMPTYHELL restores the signal trail progression', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('emptyhell.trail.v1', 'reached'));
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#world-status')).toContainText('SIGNAL TRAIL COMPLETE');
});


test('EMPTYHELL restores the local power reaction', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('emptyhell.power.v1', 'restored'));
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#world-status')).toContainText('POWER RESTORED');
});
