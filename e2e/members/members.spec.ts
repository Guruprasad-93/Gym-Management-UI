import {
  ApiHelper,
  defaultMemberPassword,
  env,
  expect,
  loginAsGymAdmin,
  navigateTo,
  test,
  uniqueLoginIdentifier,
  uniqueMemberName,
} from '../shared';

test.describe('Members', () => {
  let api: ApiHelper;

  test.beforeAll(async () => {
    api = new ApiHelper();
    await api.init();
    await api.ensureMenuEnabled(env.menuCodes.members);
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  test('Create member', async ({ page }) => {
    const memberName = uniqueMemberName();
    const loginId = uniqueLoginIdentifier('mem');
    const password = defaultMemberPassword();

    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.members);
    await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible();

    await page.getByRole('button', { name: 'Add Member' }).click();
    await expect(page.getByRole('heading', { name: 'Add Member' })).toBeVisible();

    await page.getByLabel('Full Name').fill(memberName);
    await page.getByLabel('Login ID').fill(loginId);
    await page.getByLabel('Password', { exact: true }).fill(password);

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('heading', { name: 'Add Member' })).toBeHidden({ timeout: 20_000 });

    await page.locator('input[aria-label="Search members"]').fill(memberName);
    await expect(page.getByRole('link', { name: memberName })).toBeVisible({ timeout: 15_000 });
  });

  test('Search member', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.members);
    await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible();

    const searchBox = page.locator('input[aria-label="Search members"]');
    await searchBox.fill('member');
    await expect(page.locator('table.saas-table tbody tr.saas-row').first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
