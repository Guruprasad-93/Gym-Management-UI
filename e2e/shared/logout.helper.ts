import { expect, Page } from '@playwright/test';
import { env } from './env';

export async function logout(page: Page): Promise<void> {
  await page.locator('.header__profile').click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();
  await expect(page).toHaveURL(new RegExp(`${env.routes.login.replace('/', '\\/')}$`));
}
