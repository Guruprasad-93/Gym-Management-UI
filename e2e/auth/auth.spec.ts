import {
  expect,
  loginAsGymAdmin,
  loginAsSuperAdmin,
  logout,
  test,
} from '../shared';

test.describe('Authentication', () => {
  test('Super Admin login', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await expect(page.getByRole('heading', { name: /Welcome back/i }).first()).toBeVisible();
  });

  test('Gym Admin login', async ({ page }) => {
    await loginAsGymAdmin(page);
    await expect(page).toHaveURL(/\/gym-admin\/dashboard/);
    await expect(page.getByRole('heading', { name: /Welcome back/i }).first()).toBeVisible();
  });

  test('Logout', async ({ page }) => {
    await loginAsGymAdmin(page);
    await logout(page);
    await expect(page.locator('#loginIdentifier')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });
});
