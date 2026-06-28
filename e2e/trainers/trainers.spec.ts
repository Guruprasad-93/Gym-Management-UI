import {

  defaultTrainerPassword,

  env,

  expect,

  loginAsGymAdmin,

  loginAsTrainer,

  navigateTo,

  saveMatDialog,

  saveMatDialogAndClose,

  test,

  uniqueLoginIdentifier,

  uniqueTrainerName,

} from '../shared';



test.describe.configure({ mode: 'serial' });



test.describe('Trainers', () => {

  const trainerName = uniqueTrainerName();

  const trainerLoginId = uniqueLoginIdentifier('trn');

  const trainerPassword = defaultTrainerPassword();

  const updatedSpec = 'E2E Strength';

  let createdNewTrainer = false;



  test('Create trainer', async ({ page }) => {

    await loginAsGymAdmin(page);

    await navigateTo(page, env.routes.trainers);

    await expect(page.getByRole('heading', { name: 'Trainers' })).toBeVisible();



    await page.getByRole('button', { name: 'Add Trainer' }).click();

    await page.getByLabel('Full Name').fill(trainerName);

    await page.locator('input[formcontrolname="loginIdentifier"]').fill(trainerLoginId);

    await page.getByLabel('Password', { exact: true }).fill(trainerPassword);

    await page.getByLabel('Specialization').fill('General Fitness');



    const createResponse = page.waitForResponse(

      (res) => res.url().includes('/api/trainers') && res.request().method() === 'POST',

    );

    await saveMatDialog(page);

    const response = await createResponse;



    if (response.status() === 409) {

      await expect(page.getByText(/trainer limit reached|upgrade your subscription/i)).toBeVisible({ timeout: 10_000 });

      await page.getByRole('button', { name: 'Cancel' }).click();

      return;

    }



    expect(response.status()).toBe(201);

    createdNewTrainer = true;

    await expect(page.getByRole('heading', { name: 'Add Trainer' })).toBeHidden({ timeout: 20_000 });

    await page.locator('input[aria-label="Search trainers"]').fill(trainerName);

    await expect(page.getByRole('link', { name: trainerName })).toBeVisible({ timeout: 15_000 });

  });



  test('Search trainer', async ({ page }) => {

    const searchTerm = createdNewTrainer ? trainerName : 'Alex';

    await loginAsGymAdmin(page);

    await navigateTo(page, env.routes.trainers);

    await page.locator('input[aria-label="Search trainers"]').fill(searchTerm);

    await expect(page.locator('tr.saas-row').filter({ hasText: searchTerm }).first()).toBeVisible({ timeout: 15_000 });

  });



  test('Edit trainer', async ({ page }) => {

    test.skip(!createdNewTrainer, 'Trainer subscription limit prevented create; skipping edit on demo data.');

    await loginAsGymAdmin(page);

    await navigateTo(page, env.routes.trainers);

    await page.locator('input[aria-label="Search trainers"]').fill(trainerName);

    const row = page.locator('tr.saas-row').filter({ hasText: trainerName });

    await row.getByRole('button', { name: 'Edit' }).click();

    await page.getByLabel('Specialization').fill(updatedSpec);

    await saveMatDialogAndClose(page, 'Save', 15_000);

    await expect(row.filter({ hasText: updatedSpec })).toBeVisible({ timeout: 15_000 });

  });



  test('Trainer login', async ({ page }) => {

    if (createdNewTrainer) {

      await loginAsTrainer(page, { loginIdentifier: trainerLoginId, password: trainerPassword });

    } else {

      await loginAsTrainer(page);

    }

    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();

    await expect(page).toHaveURL(/\/trainer/);

  });

});


