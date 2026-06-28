import {

  ApiHelper,

  env,

  expect,

  loginAsGymAdmin,

  navigateTo,

  pickUnusedNotificationType,

  saveMatDialogAndClose,

  selectMatOption,

  test,

} from '../shared';



test.describe.configure({ mode: 'serial' });



test.describe('Notifications', () => {

  let api: ApiHelper;

  let templateName: string;

  let notificationType: string;



  test.beforeAll(async () => {

    api = new ApiHelper();

    await api.init();

    await api.loginAsGymAdmin();

    const existingTypes = await api.getNotificationTemplateTypes();

    notificationType = pickUnusedNotificationType(existingTypes);

    templateName = `e2e_tpl_${Date.now()}`;

  });



  test.afterAll(async () => {

    await api.dispose();

  });



  test('Create notification template', async ({ page }) => {

    await loginAsGymAdmin(page);

    await navigateTo(page, env.routes.notificationTemplates);

    await page.getByRole('button', { name: 'Add Template' }).click();

    await selectMatOption(page, 'Type', notificationType);

    await page.getByLabel('WhatsApp template name').fill(templateName);

    await page.getByLabel('Body template').fill('Hello {{1}}');

    await page.getByLabel('Variables JSON').fill('{}');

    await saveMatDialogAndClose(page);

    await expect(page.getByText(templateName)).toBeVisible({ timeout: 15_000 });

  });



  test('Send notification', async ({ page }) => {

    await loginAsGymAdmin(page);

    await navigateTo(page, env.routes.notificationTest);

    await page.getByLabel('Phone number').fill('9876543210');

    await page.getByRole('combobox', { name: 'Notification type' }).click();

    await page.locator('mat-option').first().click();

    await page.getByRole('button', { name: 'Send test' }).click();

    await expect(page.getByText(/sent|queued|success|failed/i).first()).toBeVisible({ timeout: 15_000 });

  });



  test('Verify history', async ({ page }) => {

    await loginAsGymAdmin(page);

    await navigateTo(page, env.routes.notificationHistory);

    await expect(page.getByRole('heading', { name: /Notification History|History/i })).toBeVisible({ timeout: 15_000 });

    await expect(page.locator('table, .table-card, mat-paginator').first()).toBeVisible({ timeout: 15_000 });

  });

});


