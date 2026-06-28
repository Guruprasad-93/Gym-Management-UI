import { Injectable, inject, computed } from '@angular/core';
import { AuthService } from './auth.service';
import {
  AppMenuItem,
  GYM_ADMIN_MENU,
  MEMBER_MENU,
  SUPER_ADMIN_MENU,
  TRAINER_MENU,
} from '../constants/menu.config';
import { Roles } from '../constants/roles';
import { createFeatureChecker, filterMenuItemsWithFeatures } from '../navigation/menu-navigation.compat';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly auth = inject(AuthService);

  private filter(items: AppMenuItem[]): AppMenuItem[] {
    const user = this.auth.user();
    if (!user) return [];

    return filterMenuItemsWithFeatures(
      items,
      user.roles,
      user.permissions,
      user.enabledFeatureCodes,
      (code) => this.auth.hasFeature(code)
    );
  }

  readonly superAdminMenu = computed(() => this.filter(SUPER_ADMIN_MENU));

  readonly gymAdminMenu = computed(() => this.filter(GYM_ADMIN_MENU));

  readonly trainerMenu = computed(() => this.filter(TRAINER_MENU));

  readonly memberMenu = computed(() => this.filter(MEMBER_MENU));

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
