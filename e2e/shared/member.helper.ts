import { expect, Page } from '@playwright/test';
import { env } from './env';
import { loginAsGymAdmin } from './login.helper';
import { navigateTo } from './navigation.helper';
import { saveMatDialogAndClose } from './dialog.helper';

export async function createMemberViaDialog(
  page: Page,
  input: { name: string; loginIdentifier: string; password: string },
): Promise<void> {
  await loginAsGymAdmin(page);
  await navigateTo(page, env.routes.members);
  await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible();

  await page.getByRole('button', { name: 'Add Member' }).click();
  await expect(page.getByRole('heading', { name: 'Add Member' })).toBeVisible();

  await page.getByLabel('Full Name').fill(input.name);
  await page.getByLabel('Login ID').fill(input.loginIdentifier);
  await page.getByLabel('Password', { exact: true }).fill(input.password);
  await saveMatDialogAndClose(page);

  await page.locator('input[aria-label="Search members"]').fill(input.name);
  await expect(page.getByRole('link', { name: input.name })).toBeVisible({ timeout: 15_000 });
}
