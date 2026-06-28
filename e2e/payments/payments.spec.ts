import {
  env,
  expect,
  loginAsGymAdmin,
  navigateTo,
  selectFirstMatOption,
  saveMatDialog,
  selectMatOption,
  test,
} from '../shared';

test.describe.configure({ mode: 'serial' });

test.describe('Payments', () => {
  test('Record payment', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.payments);
    await page.getByRole('button', { name: 'Record Payment' }).click();
    await selectFirstMatOption(page, 'Membership');
    await selectMatOption(page, 'Method', 'Cash');
    await saveMatDialog(page);
    await expect(page.getByRole('heading', { name: 'Record Payment' })).toBeHidden({ timeout: 20_000 });
  });

  test('Verify payment history', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.payments);
    await expect(page.getByRole('heading', { name: 'Payments' })).toBeVisible();
    await expect(page.locator('table.saas-table tbody tr.saas-row').first()).toBeVisible({ timeout: 15_000 });
    await page.locator('input[aria-label="Search payments"]').fill('member');
    await expect(page.locator('table.saas-table tbody tr').first()).toBeVisible({ timeout: 15_000 });
  });

  test('Verify revenue totals', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.revenue);
    await expect(page.getByRole('heading', { name: 'Revenue Dashboard' })).toBeVisible();
    await expect(page.getByText('Total Revenue').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Monthly Revenue').first()).toBeVisible();
  });
});
