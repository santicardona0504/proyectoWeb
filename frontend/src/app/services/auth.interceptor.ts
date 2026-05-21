import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

const PUBLIC_URLS = ['/auth/login', '/auth/register'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  if (PUBLIC_URLS.some(url => req.url.includes(url))) {
    return next(req);
  }

  const clonedReq = req.clone({ withCredentials: true });

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && authService.isLoggedIn()) {
        return authService.refreshSession().pipe(
          switchMap(() => next(clonedReq)),
          catchError((err) => {
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => err);
          })
        );
      }

      if (error.status === 403) {
        toastService.error('No tenés permisos para esta acción.');
        authService.logout();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      if (error.status === 429) {
        toastService.error('Demasiadas peticiones. Esperá un momento.');
        return throwError(() => error);
      }

      if (error.error?.error) {
        toastService.error(error.error.error);
      } else if (error.status >= 500) {
        toastService.error('Error del servidor. Intentá de nuevo más tarde.');
      }

      return throwError(() => error);
    })
  );
};
