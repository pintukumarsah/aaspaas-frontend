import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Role } from '../models/api.models';
import { ToastService } from '../services/toast.service';

/** Only logged-in users. Sends everyone else to /login and remembers where they were going. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
};

/** Only guests (login / register pages). Logged-in users are bounced to their panel. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? router.createUrlTree([auth.homeRoute()]) : true;
};

/** Logged in AND holding at least one of the given roles (mirrors SecurityConfig on the server). */
export const roleGuard =
  (...roles: Role[]): CanActivateFn =>
  (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const toast = inject(ToastService);
    if (!auth.isLoggedIn()) {
      return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
    }
    if (auth.hasAnyRole(...roles)) return true;
    toast.error('Is section ke liye aapke account ko permission nahi hai.');
    return router.createUrlTree(['/']);
  };
