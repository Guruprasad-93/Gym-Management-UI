import {
  env,
  expect,
  loginAsGymAdmin,
  navigateTo,
  test,
  uniqueBranchName,
} from '../shared';

test.describe.configure({ mode: 'serial' });

test.describe('Multi-Branch', () => {
  const branchName = uniqueBranchName();
  const branchCode = `E2E${Date.now().toString(36).slice(-4).toUpperCase()}`;
  const branchCity = 'E2E City';

  test('Create branch', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.branches);
    await page.locator('label.form-field').filter({ hasText: 'Branch name' }).locator('input').fill(branchName);
    await page.locator('label.form-field').filter({ hasText: 'Code' }).locator('input').fill(branchCode);
    await page.locator('label.form-field').filter({ hasText: 'City' }).locator('input').fill(branchCity);
    await page.getByRole('button', { name: 'Add Branch' }).click();
    await expect(page.getByText(branchName)).toBeVisible({ timeout: 15_000 });
  });

  test('Verify branch details in list', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.branches);
    const row = page.locator('tr.saas-row').filter({ hasText: branchName });
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row.getByText(branchCode)).toBeVisible();
    await expect(row.getByText(branchCity)).toBeVisible();
  });

  test('Branch dashboard', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.branchDashboard);
    await expect(page.getByRole('heading', { name: 'Branch Dashboard' })).toBeVisible();
    await expect(page.locator('.branch-card, .kpi-grid').first()).toBeVisible({ timeout: 15_000 });
  });
});
