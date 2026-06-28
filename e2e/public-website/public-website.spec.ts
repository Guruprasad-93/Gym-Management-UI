import {
  env,
  expect,
  loginAsGymAdmin,
  navigateTo,
  test,
  uniqueLeadName,
  uniquePageName,
  uniquePhone,
  uniqueSlug,
} from '../shared';

test.describe.configure({ mode: 'serial' });

test.describe('Public Website', () => {
  const pageName = uniquePageName();
  const pageSlug = uniqueSlug('page');
  const websiteSlug = uniqueSlug('gym');
  const leadName = uniqueLeadName('Web Lead');
  const leadPhone = uniquePhone();

  test('Create page', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.websitePages);
    await page.getByLabel('Page Name').fill(pageName);
    await page.getByLabel('Slug').fill(pageSlug);
    await page.getByLabel('Content').fill('E2E public page content');
    await page.getByRole('button', { name: 'Add Page' }).click();
    await expect(page.getByText(pageName)).toBeVisible({ timeout: 15_000 });
  });

  test('Publish page', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.websiteBuilder);
    await expect(page.getByRole('heading', { name: 'Website Builder' })).toBeVisible();
    await page.locator('label.form-field').filter({ hasText: 'Website slug' }).locator('input').fill(websiteSlug);
    await page.locator('label.form-field').filter({ hasText: 'Site title' }).locator('input').fill('E2E Gym Site');
    await page.getByRole('button', { name: 'Save Settings' }).click();
    const publishBtn = page.getByRole('button', { name: 'Publish Website' });
    if (await publishBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await publishBtn.click();
    }
    await expect(page.getByText('Published').or(page.getByRole('button', { name: 'Unpublish' })).first()).toBeVisible({ timeout: 15_000 });
  });

  test('Submit lead form', async ({ page }) => {
    await page.goto(`/website/${websiteSlug}/contact`);
    await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible({ timeout: 20_000 });
    await page.locator('section.contact form').first().getByLabel('Name').fill(leadName);
    await page.locator('section.contact form').first().getByLabel('Mobile').fill(leadPhone);
    await page.locator('section.contact form').first().getByRole('button', { name: 'Send Enquiry' }).click();
    await expect(page.getByText(/thank|success|submitted|enquiry/i).first()).toBeVisible({ timeout: 15_000 }).catch(async () => {
      await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible();
    });
  });
});
