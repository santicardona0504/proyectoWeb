import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  return router.parseUrl('/login');
};

export const roleGuard = (allowedRoles: string[]) => () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.parseUrl('/login');
  }

  const user = auth.currentUser();
  if (user && allowedRoles.includes(user.rol)) {
    return true;
  }

  return router.parseUrl('/books');
};
