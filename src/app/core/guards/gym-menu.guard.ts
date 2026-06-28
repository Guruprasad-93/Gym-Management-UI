import { inject } from '@angular/core';

import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

import { resolveMenuCodeForRoute } from '../constants/route-menu-codes';

import { Roles } from '../constants/roles';



/** Blocks navigation when the tenant module is disabled for the current gym. */

export const gymMenuGuard: CanActivateFn = (_route, state) => {

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



  const path = state.url.split('?')[0];

  const menuCode = resolveMenuCodeForRoute(path);

  if (!menuCode) {

    return true;

  }



  if (enabled.some((code) => code.toUpperCase() === menuCode.toUpperCase())) {

    return true;

  }



  return router.createUrlTree(['/gym-admin/dashboard']);

};

