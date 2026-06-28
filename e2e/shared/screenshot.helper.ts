import { Page, TestInfo } from '@playwright/test';
import path from 'path';

export async function captureScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string,
): Promise<void> {
  const safeName = name.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
  const filePath = path.join(testInfo.outputDir, `${safeName}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  await testInfo.attach(safeName, { path: filePath, contentType: 'image/png' });
}
