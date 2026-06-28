import {
  env,
  expect,
  loginAsGymAdmin,
  navigateTo,
  test,
} from '../shared';

test.describe.configure({ mode: 'serial' });

test.describe('White Label', () => {
  const brandName = `E2E Brand ${Date.now()}`;

  test('Update branding', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.whiteLabel);
    await expect(page.getByRole('heading', { name: /Branding|White Label/i })).toBeVisible();
    await page.locator('label.form-field').filter({ hasText: 'Brand name' }).locator('input').fill(brandName);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(/saved|success|updated/i).first()).toBeVisible({ timeout: 15_000 }).catch(async () => {
      await page.reload();
      await expect(page.locator('label.form-field').filter({ hasText: 'Brand name' }).locator('input')).toHaveValue(brandName);
    });
  });

  test('Verify branding preview', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.whiteLabelPreview);
    await expect(page.getByRole('heading', { name: 'White Label Preview' })).toBeVisible();
    await expect(page.getByText('Login page').first()).toBeVisible();
    await expect(page.getByText('Website').first()).toBeVisible();
    await expect(page.getByText(/Sign in to your account/i)).toBeVisible();
  });
});
