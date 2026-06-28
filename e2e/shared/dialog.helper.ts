import { expect, Page } from '@playwright/test';

function dialogScope(page: Page) {
  return page.getByRole('dialog');
}

async function findCombobox(page: Page, label: string) {
  const scopes = [dialogScope(page), page.locator('.convert-card'), page];
  for (const scope of scopes) {
    const combo = scope.getByRole('combobox', { name: label, exact: true });
    if ((await combo.count()) > 0) {
      return combo.first();
    }
  }
  return page.getByRole('combobox', { name: label, exact: true }).first();
}

async function clickMatOption(page: Page, optionText: string | RegExp): Promise<void> {
  const overlay = page.locator('.cdk-overlay-container');
  const options = overlay.locator('mat-option:not(.mat-mdc-option-disabled)');
  await options.first().waitFor({ state: 'visible', timeout: 15_000 });

  if (typeof optionText === 'string') {
    await overlay.getByRole('option', { name: optionText, exact: true }).click();
    return;
  }

  await overlay.getByRole('option', { name: optionText }).first().click();
}

export async function saveMatDialog(page: Page, buttonName = 'Save'): Promise<void> {
  const dialog = dialogScope(page);
  const button = dialog.getByRole('button', { name: buttonName });
  await expect(button).toBeEnabled({ timeout: 10_000 });
  await button.click();
}

export async function saveMatDialogAndClose(page: Page, buttonName = 'Save', timeout = 20_000): Promise<void> {
  const dialog = dialogScope(page);
  const title = dialog.locator('[mat-dialog-title], h2').first();
  await saveMatDialog(page, buttonName);
  await expect(title).toBeHidden({ timeout });
}

export async function selectMatOption(page: Page, label: string, optionText: string | RegExp): Promise<void> {
  const combo = await findCombobox(page, label);
  await combo.click();
  await clickMatOption(page, optionText);
}

export async function selectFirstMatOption(page: Page, label: string): Promise<void> {
  await selectMatOption(page, label, /.+/);
}

export async function selectNativeOption(page: Page, label: string, optionLabel: string): Promise<void> {
  await page.locator('label.form-field').filter({ hasText: label }).locator('select').selectOption({ label: optionLabel });
}

export async function selectFirstNativeOption(page: Page, label: string): Promise<void> {
  const select = page.locator('label.form-field').filter({ hasText: label }).locator('select');
  await expect(select).toBeVisible({ timeout: 15_000 });
  const count = await select.locator('option:not([disabled])').count();
  if (count <= 1) {
    throw new Error(`No selectable options for "${label}"`);
  }
  await select.selectOption({ index: 1 });
}

export async function waitForDialogData(page: Page, urlPart?: string): Promise<void> {
  if (urlPart) {
    const pending = page.waitForResponse(
      (res) => res.url().includes(urlPart) && res.status() < 400,
      { timeout: 15_000 },
    );
    const alreadyLoaded = await page
      .waitForResponse((res) => res.url().includes(urlPart) && res.status() < 400, { timeout: 1_000 })
      .then(() => true)
      .catch(() => false);
    if (!alreadyLoaded) {
      await pending;
    }
    return;
  }
  await page.waitForLoadState('networkidle');
}

export async function openDialogAndWaitForData(
  page: Page,
  openAction: () => Promise<void>,
  urlPart: string,
): Promise<void> {
  await Promise.all([
    page.waitForResponse((res) => res.url().includes(urlPart) && res.status() < 400, { timeout: 15_000 }),
    openAction(),
  ]);
}
