import { APIRequestContext, request } from '@playwright/test';
import { env } from './env';

export interface ApiLoginResult {
  enabledMenuCodes: string[];
}

export class ApiHelper {
  private context: APIRequestContext | null = null;

  async init(): Promise<void> {
    this.context = await request.newContext({
      baseURL: env.apiUrl,
      extraHTTPHeaders: { Accept: 'application/json', 'Content-Type': 'application/json' },
    });
  }

  async dispose(): Promise<void> {
    await this.context?.dispose();
    this.context = null;
  }

  private get ctx(): APIRequestContext {
    if (!this.context) {
      throw new Error('ApiHelper not initialized. Call init() first.');
    }
    return this.context;
  }

  async login(
    loginIdentifier: string,
    password: string,
    gymId?: string,
  ): Promise<ApiLoginResult> {
    const csrfResponse = await this.ctx.get('/api/auth/csrf');
    if (!csrfResponse.ok()) {
      const body = await csrfResponse.text();
      throw new Error(`CSRF fetch failed (${csrfResponse.status()}): ${body}`);
    }

    const response = await this.ctx.post('/api/auth/login', {
      data: { loginIdentifier, password, gymId: gymId ?? null },
    });

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`API login failed (${response.status()}): ${body}`);
    }

    const json = await response.json();
    if (!json.success) {
      throw new Error(`API login response invalid: ${JSON.stringify(json)}`);
    }

    return {
      enabledMenuCodes: (json.data?.enabledMenuCodes ?? []) as string[],
    };
  }

  async loginAsSuperAdmin(): Promise<ApiLoginResult> {
    return this.login(env.superAdmin.loginIdentifier, env.superAdmin.password);
  }

  async loginAsGymAdmin(): Promise<ApiLoginResult> {
    return this.login(env.gymAdmin.loginIdentifier, env.gymAdmin.password, env.gymAdmin.gymId);
  }

  async createMember(input: {
    name: string;
    loginIdentifier: string;
    password: string;
    phone?: string;
  }): Promise<{ id: number; fullName: string }> {
    const response = await this.ctx.post('/api/members', {
      data: {
        name: input.name,
        loginIdentifier: input.loginIdentifier,
        password: input.password,
        phone: input.phone,
        joinDate: new Date().toISOString().slice(0, 10),
      },
    });

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Create member failed (${response.status()}): ${body}`);
    }

    const json = await response.json();
    if (!json.success || !json.data) {
      throw new Error(`Create member response invalid: ${JSON.stringify(json)}`);
    }

    return { id: json.data.id as number, fullName: json.data.fullName as string };
  }

  async getNotificationTemplateTypes(): Promise<string[]> {
    const response = await this.ctx.get('/api/notifications/templates?includeInactive=true');
    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Get notification templates failed (${response.status()}): ${body}`);
    }

    const json = await response.json();
    const templates = (json.data ?? []) as Array<{ notificationType: string }>;
    return templates.map((t) => t.notificationType);
  }

  async getE2eTrainers(): Promise<Array<{ id: number; fullName: string }>> {
    const response = await this.ctx.get(
      '/api/trainers?pageNumber=1&pageSize=100&sortColumn=UserName&sortDirection=asc&includeInactive=true&search=E2E%20Trainer',
    );
    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Get trainers failed (${response.status()}): ${body}`);
    }

    const json = await response.json();
    const items = (json.data?.items ?? []) as Array<{ id: number; fullName: string }>;
    return items;
  }

  async deleteTrainer(id: number): Promise<void> {
    const response = await this.ctx.delete(`/api/trainers/${id}`);
    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Delete trainer failed (${response.status()}): ${body}`);
    }
  }

  async ensureTrainerCapacity(maxE2eTrainersToKeep = 0): Promise<void> {
    const trainers = await this.getE2eTrainers();
    const removable = trainers.slice(maxE2eTrainersToKeep);
    for (const trainer of removable) {
      await this.deleteTrainer(trainer.id);
    }
  }

  async getGymMenus(gymId: string): Promise<Array<{ menuId: number; menuCode: string; isEnabled: boolean }>> {
    const response = await this.ctx.get(`/api/platform/tenant-menus/${gymId}`);

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Get gym menus failed (${response.status()}): ${body}`);
    }

    const json = await response.json();
    return json.data ?? [];
  }

  async setMenuEnabled(gymId: string, menuId: number, enabled: boolean): Promise<void> {
    const action = enabled ? 'enable' : 'disable';
    const response = await this.ctx.put(`/api/platform/tenant-menus/${gymId}/${menuId}/${action}`);

    if (!response.ok()) {
      const body = await response.text();
      throw new Error(`Set menu ${action} failed (${response.status()}): ${body}`);
    }
  }

  async setMenuEnabledByCode(gymId: string, menuCode: string, enabled: boolean): Promise<void> {
    const menus = await this.getGymMenus(gymId);
    const menu = menus.find((m) => m.menuCode.toUpperCase() === menuCode.toUpperCase());
    if (!menu) {
      throw new Error(`Menu code not found: ${menuCode}`);
    }
    await this.setMenuEnabled(gymId, menu.menuId, enabled);
  }

  async ensureMenuEnabled(menuCode: string, gymId = env.gymAdmin.gymId): Promise<void> {
    await this.loginAsSuperAdmin();
    await this.setMenuEnabledByCode(gymId, menuCode, true);
  }
}
