import { request } from '@playwright/test';
import { env } from './env';

export default async function globalSetup(): Promise<void> {
  const healthUrl = `${env.apiUrl.replace(/\/$/, '')}/health`;
  const ctx = await request.newContext();

  try {
    const response = await ctx.get(healthUrl, { timeout: 10_000 });
    if (!response.ok()) {
      console.warn(
        `[e2e setup] API health check returned ${response.status()} at ${healthUrl}. ` +
          'Start the backend API before running full E2E tests (dotnet run --project Backend/Gym.API).',
      );
    } else {
      console.log(`[e2e setup] API reachable at ${healthUrl}`);
    }
  } catch {
    console.warn(
      `[e2e setup] API not reachable at ${healthUrl}. ` +
        'UI login and data tests require the backend on port 5088 (see proxy.conf.json).',
    );
  } finally {
    await ctx.dispose();
  }
}
