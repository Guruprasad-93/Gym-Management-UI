import {
  env,
  expect,
  loginAsGymAdmin,
  navigateTo,
  test,
} from '../shared';

test.describe('Analytics', () => {
  test('Dashboard loads', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.gymAdminDashboard);
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    await expect(page.getByText('Revenue Today').first()).toBeVisible({ timeout: 15_000 });
  });

  test('Revenue analytics', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.analyticsRevenue);
    await expect(page.getByRole('heading', { name: 'Revenue Analytics' })).toBeVisible();
    await expect(page.getByText('Today').first()).toBeVisible({ timeout: 15_000 });
  });

  test('Member analytics', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.analyticsMembers);
    await expect(page.getByRole('heading', { name: 'Member Analytics' })).toBeVisible();
    await expect(page.getByText('Active Members').first()).toBeVisible({ timeout: 15_000 });
  });
});
