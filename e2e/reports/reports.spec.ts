import {
  env,
  expect,
  loginAsGymAdmin,
  navigateTo,
  test,
} from '../shared';

test.describe('Reports', () => {
  test('Revenue report', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.revenue);
    await expect(page.getByRole('heading', { name: 'Revenue Dashboard' })).toBeVisible();
    await expect(page.getByText('Total Revenue').first()).toBeVisible({ timeout: 15_000 });
  });

  test('Attendance report', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.attendanceReports);
    await expect(page.getByRole('heading', { name: 'Attendance Reports' })).toBeVisible();
    await page.getByRole('button', { name: 'Preview' }).click();
    await expect(page.locator('.table-shell, .report-filters').first()).toBeVisible({ timeout: 15_000 });
  });

  test('Membership report', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.analyticsMembers);
    await expect(page.getByRole('heading', { name: 'Member Analytics' })).toBeVisible();
    await expect(page.getByText('Active Members').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Active Memberships').first()).toBeVisible();
  });
});
