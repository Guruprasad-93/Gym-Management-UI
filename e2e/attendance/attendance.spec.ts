import {
  env,
  expect,
  loginAsGymAdmin,
  navigateTo,
  selectFirstNativeOption,
  test,
} from '../shared';

test.describe.configure({ mode: 'serial' });

test.describe('Attendance', () => {
  test('Member check-in', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.attendanceCheckIn);
    await expect(page.getByRole('heading', { name: 'Member Check-In' })).toBeVisible();
    const select = page.locator('label.form-field').filter({ hasText: 'Member' }).locator('select');
    const count = await select.locator('option:not([disabled])').count();
    if (count <= 1) {
      test.skip(true, 'No members available for check-in');
      return;
    }
    await selectFirstNativeOption(page, 'Member');
    await page.getByRole('button', { name: 'Check In' }).click();
    await expect(page).toHaveURL(/\/gym-admin\/attendance/, { timeout: 20_000 });
  });

  test('Member check-out', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.attendanceCheckOut);
    await expect(page.getByRole('heading', { name: 'Member Check-Out' })).toBeVisible();
    const memberSelect = page.locator('label.form-field').filter({ hasText: 'Member (checked in)' }).locator('select');
    const optionCount = await memberSelect.locator('option:not([disabled])').count();
    if (optionCount > 1) {
      await selectFirstNativeOption(page, 'Member (checked in)');
      await page.getByRole('button', { name: 'Check Out' }).click();
      await expect(page.getByText(/checked out|success/i).first()).toBeVisible({ timeout: 15_000 }).catch(async () => {
        await expect(page).toHaveURL(/\/gym-admin\/attendance/);
      });
    } else {
      await expect(page.getByText(/No members are currently checked in/i)).toBeVisible();
    }
  });

  test('Attendance report', async ({ page }) => {
    await loginAsGymAdmin(page);
    await navigateTo(page, env.routes.attendanceReports);
    await expect(page.getByRole('heading', { name: 'Attendance Reports' })).toBeVisible();
    await page.getByRole('button', { name: 'Preview' }).click();
    await expect(page.locator('.report-filters, .table-shell, .panel-shell').first()).toBeVisible({ timeout: 15_000 });
  });
});
