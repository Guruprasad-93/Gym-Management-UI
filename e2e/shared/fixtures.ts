import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error' || type === 'warning' || process.env.E2E_LOG_ALL_CONSOLE === 'true') {
        console.log(`[browser:${type}] ${msg.text()}`);
      }
    });

    page.on('pageerror', (error) => {
      console.log(`[browser:pageerror] ${error.message}`);
    });

    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/api/') || url.includes('/api')) {
        console.log(`[network:request] ${req.method()} ${url}`);
      }
    });

    page.on('response', (res) => {
      const url = res.url();
      if (url.includes('/api/') || url.includes('/api')) {
        const status = res.status();
        const level = status >= 400 ? 'error' : 'info';
        console.log(`[network:response:${level}] ${status} ${url}`);
      }
    });

    page.on('requestfailed', (req) => {
      const url = req.url();
      if (url.includes('/api/') || url.includes('/api')) {
        console.log(`[network:failed] ${req.method()} ${url} — ${req.failure()?.errorText ?? 'unknown'}`);
      }
    });

    await use(page);

    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach('failure-screenshot', {
        body: screenshot,
        contentType: 'image/png',
      });
    }
  },
});

export { expect };
