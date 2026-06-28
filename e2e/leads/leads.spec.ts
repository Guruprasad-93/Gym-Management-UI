import {
  env,
  expect,
  loginAsGymAdmin,
  navigateTo,
  saveMatDialog,
  selectFirstMatOption,
  test,
  todayIsoDate,
  uniqueLeadName,
  uniquePhone,
} from '../shared';

test.describe.configure({ mode: 'serial' });

test.describe('CRM & Leads', () => {
  const leadName = uniqueLeadName();
  const leadPhone = uniquePhone();
  let leadDetailUrl = '';

  test('Create lead', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.leadsCreate);
    await page.getByLabel('Full name').fill(leadName);
    await page.getByLabel('Mobile').fill(leadPhone);
    await page.getByLabel('Lead source').click();
    await page.getByRole('option', { name: 'WalkIn' }).click();
    await page.getByRole('button', { name: 'Create lead' }).click();
    await expect(page).toHaveURL(/\/gym-admin\/leads/, { timeout: 20_000 });
  });

  test('Lead search', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.leads);
    await page.locator('input[aria-label="Search leads"]').fill(leadName);
    await expect(page.getByRole('link', { name: leadName })).toBeVisible({ timeout: 15_000 });
  });

  test('Edit lead', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.leads);
    await page.locator('input[aria-label="Search leads"]').fill(leadName);
    await page.getByRole('link', { name: leadName }).click();
    leadDetailUrl = page.url();
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByLabel('Notes').fill('E2E updated notes');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page).toHaveURL(/\/gym-admin\/leads/, { timeout: 20_000 });
  });

  test('Convert lead to member', async ({ page }) => {
    const convertName = uniqueLeadName('Convert');
    const convertPhone = uniquePhone();

    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.leadsCreate);
    await page.getByLabel('Full name').fill(convertName);
    await page.getByLabel('Mobile').fill(convertPhone);
    await page.getByLabel('Lead source').click();
    await page.getByRole('option', { name: 'WalkIn' }).click();
    await page.getByRole('button', { name: 'Create lead' }).click();
    await expect(page).toHaveURL(/\/gym-admin\/leads/, { timeout: 20_000 });

    await page.locator('input[aria-label="Search leads"]').fill(convertName);
    await page.getByRole('link', { name: convertName }).click();
    await expect(page.getByRole('button', { name: 'Convert to member' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Convert to member' }).click();
    await selectFirstMatOption(page, 'Membership plan');
    await page.getByLabel('Start date').fill(todayIsoDate());
    await page.getByRole('button', { name: 'Convert', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Convert to member' })).toBeHidden({ timeout: 20_000 });
  });
});
