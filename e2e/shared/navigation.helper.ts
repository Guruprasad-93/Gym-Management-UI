import { expect, Page } from '@playwright/test';

export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
}

export async function clickSidebarLink(page: Page, label: string): Promise<void> {
  await page
    .locator('nav.sidebar__nav a')
    .filter({ has: page.locator('span', { hasText: new RegExp(`^${label}$`) }) })
    .click();
}

export async function expectSidebarLinkVisible(page: Page, label: string, visible = true): Promise<void> {
  const link = page
    .locator('nav.sidebar__nav a')
    .filter({ has: page.locator('span', { hasText: new RegExp(`^${label}$`) }) });
  if (visible) {
    await expect(link).toBeVisible();
  } else {
    await expect(link).toHaveCount(0);
  }
}

export async function expectOnRoute(page: Page, pathPattern: RegExp | string): Promise<void> {
  await expect(page).toHaveURL(pathPattern);
}
