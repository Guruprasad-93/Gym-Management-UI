import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import {
  GYM_ADMIN_RENEWAL_ROUTES,
  SubscriptionAccessModes,
} from '../constants/subscription-access';
import { Roles } from '../constants/roles';

export const subscriptionAccessGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const mode = auth.subscriptionAccessMode();

  if (
    mode === SubscriptionAccessModes.Active ||
    mode === SubscriptionAccessModes.GracePeriod
  ) {
    return true;
  }

  if (mode === SubscriptionAccessModes.ExpiredAdminRenewal) {
    if (GYM_ADMIN_RENEWAL_ROUTES.some((path) => state.url.startsWith(path))) {
      return true;
    }
    return router.createUrlTree(['/gym-admin/renew-subscription']);
  }

  if (mode === SubscriptionAccessModes.ExpiredLocked) {
    if (state.url.startsWith('/subscription-expired')) {
      return true;
    }
    return router.createUrlTree(['/subscription-expired']);
  }

  return true;
};

export const subscriptionExpiredPageGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const mode = auth.subscriptionAccessMode();

  if (mode !== SubscriptionAccessModes.ExpiredLocked) {
    if (auth.hasRole(Roles.GymAdmin)) {
      return router.createUrlTree(['/gym-admin/renew-subscription']);
    }
    if (auth.hasRole(Roles.SuperAdmin)) {
      return router.createUrlTree(['/super-admin']);
    }
    return router.createUrlTree([auth.getDefaultRoute()]);
  }

  if (auth.hasRole(Roles.Trainer) || auth.hasRole(Roles.Member)) {
    return true;
  }

  return router.createUrlTree([auth.getDefaultRoute()]);
};
