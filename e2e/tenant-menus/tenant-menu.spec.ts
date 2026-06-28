import {
  ApiHelper,
  env,
  expect,
  expectOnRoute,
  expectSidebarLinkVisible,
  loginAsGymAdmin,
  loginAsSuperAdmin,
  logout,
  navigateTo,
  test,
} from '../shared';

test.describe('Tenant Menu Management', () => {
  let api: ApiHelper;

  test.beforeAll(async () => {
    api = new ApiHelper();
    await api.init();
    await api.ensureMenuEnabled(env.menuCodes.members);
  });

  test.afterAll(async () => {
    await api.ensureMenuEnabled(env.menuCodes.members);
    await api.dispose();
  });

  test('Disable menu, verify menu hidden, verify route blocked', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await navigateTo(page, env.routes.tenantMenus);
    await expect(page.getByRole('heading', { name: 'Platform Management' })).toBeVisible();

    await page.getByLabel('Select Gym').click();
    await page.getByRole('option', { name: new RegExp(env.gymAdmin.gymName, 'i') }).click();
    await expect(page.locator('table.menu-table')).toBeVisible();

    const membersRow = page.locator('tr').filter({
      has: page.getByRole('cell').locator('code', { hasText: /^MEMBERS$/ }),
    });
    await expect(membersRow).toBeVisible();

    const disableButton = membersRow.getByRole('button', { name: 'Disable' });
    await expect(disableButton).toBeVisible();
    await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes('/platform/tenant-menus/') &&
          res.url().includes('/disable') &&
          res.status() === 200,
      ),
      disableButton.click(),
    ]);
    await expect(membersRow.locator('.disabled')).toBeVisible();

    await logout(page);

    await loginAsGymAdmin(page);
    await expectSidebarLinkVisible(page, 'Members', false);

    await navigateTo(page, env.routes.members);

    const enabledCodes = await page.evaluate(() => {
      const raw = sessionStorage.getItem('gym_auth_user');
      const user = raw ? JSON.parse(raw) : null;
      return (user?.enabledMenuCodes ?? []) as string[];
    });

    if (enabledCodes.length > 0) {
      await expectOnRoute(page, /\/gym-admin\/dashboard/);
    } else {
      await expectSidebarLinkVisible(page, 'Members', false);
    }
  });
});
