import {
  defaultMemberPassword,
  env,
  expect,
  loginAsGymAdmin,
  navigateTo,
  openDialogAndWaitForData,
  saveMatDialogAndClose,
  selectMatOption,
  test,
  todayIsoDate,
  uniqueLoginIdentifier,
  uniqueMemberName,
  uniquePlanName,
} from '../shared';

test.describe.configure({ mode: 'serial' });

test.describe('Memberships', () => {
  const planName = uniquePlanName();
  const memberName = uniqueMemberName('E2E MemShip');
  const memberLoginId = uniqueLoginIdentifier('mem');

  test('Create membership plan', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.membershipPlans);
    await page.getByRole('button', { name: 'Add Plan' }).click();
    await page.getByLabel('Plan Name').fill(planName);
    await page.getByLabel('Duration (months)').fill('1');
    await page.getByLabel('Price').fill('999');
    await saveMatDialogAndClose(page);
    await expect(page.getByText(planName)).toBeVisible({ timeout: 15_000 });
  });

  test('Assign membership', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.members);
    await page.getByRole('button', { name: 'Add Member' }).click();
    await page.getByLabel('Full Name').fill(memberName);
    await page.locator('input[formcontrolname="loginIdentifier"]').fill(memberLoginId);
    await page.getByLabel('Password', { exact: true }).fill(defaultMemberPassword());
    await saveMatDialogAndClose(page);

    await navigateTo(page, env.routes.memberships);
    await openDialogAndWaitForData(
      page,
      () => page.getByRole('button', { name: 'Assign Membership' }).click(),
      '/api/members',
    );
    await selectMatOption(page, 'Member', memberName);
    await selectMatOption(page, 'Plan', new RegExp(planName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    await page.getByLabel('Start Date').fill(todayIsoDate());
    await saveMatDialogAndClose(page);
    await expect(page.locator('table.saas-table tbody tr.saas-row').filter({ hasText: memberName }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('Renew membership', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.memberships);
    await page.locator('input[aria-label="Search memberships"]').fill(memberName);
    const row = page.locator('tr.saas-row').filter({ hasText: memberName }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    await row.getByRole('button', { name: 'Renew' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Renew Membership' })).toBeVisible({ timeout: 10_000 });
    await dialog.getByRole('button', { name: 'Renew' }).click();
    await expect(dialog).toBeHidden({ timeout: 15_000 });
  });
});
