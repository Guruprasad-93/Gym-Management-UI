import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const featureGuard = (featureCode: string): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() && auth.hasFeature(featureCode)) {
    return true;
  }

  return router.createUrlTree(['/gym-admin/dashboard']);
};
