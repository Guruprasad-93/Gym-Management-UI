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



test.describe('Workout Plans', () => {

  const planName = uniquePlanName('E2E Workout');

  const exerciseName = uniquePlanName('E2E Exercise');

  let assignMemberId = 0;



  test.beforeAll(async () => {

    const api = new ApiHelper();

    await api.init();

    await api.loginAsGymAdmin();

    const member = await api.createMember({

      name: uniqueMemberName('E2E Wkt Mem'),

      loginIdentifier: uniqueLoginIdentifier('wmem'),

      password: defaultMemberPassword(),

    });

    assignMemberId = member.id;

    await api.dispose();

  });



  test('Create workout plan', async ({ page }) => {

    await loginAsGymAdmin(page);

    await navigateTo(page, env.routes.workoutExercises);

    await page.getByRole('button', { name: 'Add Exercise' }).click();

    await page.getByLabel('Name').fill(exerciseName);

    await saveMatDialogAndClose(page);



    await navigateTo(page, env.routes.workoutPlansNew);

    await page.getByLabel('Plan name').fill(planName);

    await page.getByLabel('Exercise').click();

    await page.getByRole('option', { name: exerciseName }).click();

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page).toHaveURL(/\/gym-admin\/workout-plans/, { timeout: 20_000 });

    await page.locator('input[aria-label="Search plans"]').fill(planName);

    await expect(page.getByRole('link', { name: planName })).toBeVisible({ timeout: 15_000 });

  });



  test('Assign to member', async ({ page }) => {

    await loginAsGymAdmin(page);

    await navigateTo(page, `/gym-admin/members/${assignMemberId}/workout`);

    await page.getByRole('button', { name: 'Assign plan' }).click();

    await selectMatOption(page, 'Plan', planName);

    await page.getByLabel('Start').fill(todayIsoDate());

    await page.getByRole('button', { name: 'Assign' }).click();

    await expect(page.getByRole('heading', { name: /Assign/i })).toBeHidden({ timeout: 20_000 });

  });



  test('Verify assignment', async ({ page }) => {

    await loginAsGymAdmin(page);

    await navigateTo(page, `/gym-admin/members/${assignMemberId}/workout`);

    await expect(page.getByText(planName)).toBeVisible({ timeout: 15_000 });

  });

});


