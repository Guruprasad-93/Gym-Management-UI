import { Injectable, inject, computed, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { TenantMenuService } from './tenant-menu.service';
import {
  AppMenuItem,
  GYM_ADMIN_MENU,
  MEMBER_MENU,
  SUPER_ADMIN_MENU,
  TRAINER_MENU,
  filterMenuItems,
} from '../constants/menu.config';
import { Roles } from '../constants/roles';
import { MenuDto } from '../models/menu.models';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly auth = inject(AuthService);
  private readonly tenantMenuApi = inject(TenantMenuService);

  private readonly apiMenusSignal = signal<MenuDto[] | null>(null);

  readonly superAdminMenu = computed(() =>
    filterMenuItems(
      SUPER_ADMIN_MENU,
      this.auth.user()?.roles ?? [],
      this.auth.user()?.permissions ?? []
    )
  );

  readonly gymAdminMenu = computed(() => {
    const user = this.auth.user();
    const apiMenus = this.apiMenusSignal();
    if (apiMenus?.length) {
      return apiMenus
        .filter((m) => m.route)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((m) => ({
          label: m.menuName,
          icon: m.icon ?? 'circle',
          route: m.route!,
        }));
    }

    return filterMenuItems(
      GYM_ADMIN_MENU,
      user?.roles ?? [],
      user?.permissions ?? [],
      user?.enabledMenuCodes
    );
  });

  readonly trainerMenu = computed(() =>
    filterMenuItems(
      TRAINER_MENU,
      this.auth.user()?.roles ?? [],
      this.auth.user()?.permissions ?? [],
      this.auth.user()?.enabledMenuCodes
    )
  );

  readonly memberMenu = computed(() =>
    filterMenuItems(
      MEMBER_MENU,
      this.auth.user()?.roles ?? [],
      this.auth.user()?.permissions ?? [],
      this.auth.user()?.enabledMenuCodes
    )
  );

  loadTenantMenus(): void {
    const user = this.auth.user();
    if (!user?.gymId || user.roles.includes(Roles.SuperAdmin)) {
      return;
    }

    this.tenantMenuApi.getMyMenus().subscribe({
      next: (response) => {
        if (response.success && response.data?.menus?.length) {
          this.apiMenusSignal.set(response.data.menus);
        }
      },
    });
  }

  clearTenantMenus(): void {
    this.apiMenusSignal.set(null);
  }

  getMenuForCurrentUser(): AppMenuItem[] {
    const user = this.auth.user();
    if (!user) return [];
    if (user.roles.includes(Roles.SuperAdmin)) return this.superAdminMenu();
    if (user.roles.includes(Roles.GymAdmin)) return this.gymAdminMenu();
    if (user.roles.includes(Roles.Trainer)) return this.trainerMenu();
    if (user.roles.includes(Roles.Member)) return this.memberMenu();
    return [];
  }
}
