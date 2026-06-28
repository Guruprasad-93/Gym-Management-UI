import { expect, Page } from '@playwright/test';
import { env } from './env';

export interface LoginOptions {
  loginIdentifier: string;
  password: string;
  gymId?: string;
  expectUrl?: RegExp | string;
}

export async function login(page: Page, options: LoginOptions): Promise<void> {
  const loginPath = options.gymId
    ? `${env.routes.login}?gymId=${options.gymId}`
    : env.routes.login;

  await page.goto(loginPath);
  await page.locator('#loginIdentifier').fill(options.loginIdentifier);
  await page.locator('#password').fill(options.password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  if (options.expectUrl) {
    await expect(page).toHaveURL(options.expectUrl);
  } else {
    await expect(page).not.toHaveURL(/\/auth\/login/);
  }
}

export async function loginAsSuperAdmin(page: Page): Promise<void> {
  await login(page, {
    loginIdentifier: env.superAdmin.loginIdentifier,
    password: env.superAdmin.password,
    expectUrl: /\/super-admin/,
  });
}

export async function loginAsGymAdmin(page: Page): Promise<void> {
  await login(page, {
    loginIdentifier: env.gymAdmin.loginIdentifier,
    password: env.gymAdmin.password,
    gymId: env.gymAdmin.gymId,
    expectUrl: /\/gym-admin/,
  });
}

export async function loginAsTrainer(page: Page, credentials?: { loginIdentifier: string; password: string }): Promise<void> {
  await login(page, {
    loginIdentifier: credentials?.loginIdentifier ?? env.trainer.loginIdentifier,
    password: credentials?.password ?? env.trainer.password,
    gymId: env.trainer.gymId,
    expectUrl: /\/trainer/,
  });
}
