import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { resolveMenuCodeForRoute } from '../constants/route-menu-codes';
import { Roles } from '../constants/roles';

/** Blocks navigation when the tenant module is disabled for the current gym. */
export const gymMenuGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user();

  if (!user?.gymId || user.roles.includes(Roles.SuperAdmin)) {
    return true;
  }

  const enabled = user.enabledMenuCodes ?? [];
  if (enabled.length === 0) {
    return true;
  }

  const path = '/' + (route.routeConfig?.path ?? '');
  const fullPath = route.parent?.routeConfig?.path
    ? `/${route.parent.routeConfig.path}/${route.routeConfig?.path ?? ''}`.replace('//', '/')
    : path;

  const menuCode = resolveMenuCodeForRoute(fullPath) ?? resolveMenuCodeForRoute('/' + route.url.map((s) => s.path).join('/'));
  if (!menuCode) {
    return true;
  }

  if (enabled.some((code) => code.toUpperCase() === menuCode.toUpperCase())) {
    return true;
  }

  return router.createUrlTree(['/gym-admin/dashboard']);
};
