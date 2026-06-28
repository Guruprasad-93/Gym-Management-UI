import {

  ApiHelper,

  defaultMemberPassword,

  env,

  expect,

  loginAsGymAdmin,

  navigateTo,

  saveMatDialogAndClose,

  selectMatOption,

  test,

  todayIsoDate,

  uniqueLoginIdentifier,

  uniqueMemberName,

  uniquePlanName,

} from '../shared';



test.describe.configure({ mode: 'serial' });



test.describe('Diet Plans', () => {

  const planName = uniquePlanName('E2E Diet');

  let assignMemberId = 0;



  test.beforeAll(async () => {

    const api = new ApiHelper();

    await api.init();

    await api.loginAsGymAdmin();

    const member = await api.createMember({

      name: uniqueMemberName('E2E Diet Mem'),

      loginIdentifier: uniqueLoginIdentifier('dmem'),

      password: defaultMemberPassword(),

    });

    assignMemberId = member.id;

    await api.dispose();

  });



  test('Create diet plan', async ({ page }) => {

    await loginAsGymAdmin(page);

    await navigateTo(page, env.routes.dietPlansNew);

    await page.getByLabel('Plan name').fill(planName);

    await page.locator('input[formcontrolname="foodName"]').first().fill('Oatmeal');

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page).toHaveURL(/\/gym-admin\/diet-plans/, { timeout: 20_000 });

    await page.locator('input[aria-label="Search diet plans"]').fill(planName);

    await expect(page.getByText(planName)).toBeVisible({ timeout: 15_000 });

  });



  test('Assign to member', async ({ page }) => {

    await loginAsGymAdmin(page);

    await navigateTo(page, `/gym-admin/members/${assignMemberId}/diet`);

    await page.getByRole('button', { name: 'Assign diet plan' }).click();

    await selectMatOption(page, 'Diet plan', planName);

    await page.getByLabel('Start date').fill(todayIsoDate());

    await page.getByRole('button', { name: 'Assign' }).click();

    await expect(page.getByRole('heading', { name: /Assign/i })).toBeHidden({ timeout: 20_000 });

  });



  test('Verify assignment', async ({ page }) => {

    await loginAsGymAdmin(page);

    await navigateTo(page, `/gym-admin/members/${assignMemberId}/diet`);

    await expect(page.getByText(planName)).toBeVisible({ timeout: 15_000 });

  });

});


