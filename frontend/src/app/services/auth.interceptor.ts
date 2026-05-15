import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { LoggerService } from './logger.service';
import { catchError, switchMap, throwError } from 'rxjs';

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Datos inválidos. Revisá los campos e intentá de nuevo.',
  401: 'No autorizado. Iniciá sesión para continuar.',
  403: 'No tenés permisos para esta acción.',
  404: 'Recurso no encontrado.',
  409: 'El recurso ya existe (ej. email o ISBN duplicado).',
  413: 'El archivo es demasiado grande (máx 1MB).',
  415: 'Tipo de contenido no soportado.',
  429: 'Demasiadas peticiones. Esperá un momento.',
};

function getServerError(err: HttpErrorResponse): string | null {
  if (typeof err.error === 'object' && err.error !== null && 'error' in err.error) {
    return err.error.error as string;
  }
  return null;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  const logger = injector.get(LoggerService);

  const cloned = req.clone({ withCredentials: true });

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      const serverMsg = getServerError(err);
      const toast = injector.get(ToastService);

      logger.warn(`[${err.status}] ${err.url || ''} — ${serverMsg || STATUS_MESSAGES[err.status] || 'Error desconocido'}`);

      if (err.status === 401) {
        const authService = injector.get(AuthService);
        if (authService.isLoggedIn()) {
          return authService.refreshSession().pipe(
            switchMap(() => next(cloned)),
            catchError(() => {
              authService.logout();
              injector.get(Router).navigate(['/login']);
              toast.error('Sesión expirada. Iniciá sesión nuevamente.');
              return throwError(() => err);
            }),
          );
        }
        return throwError(() => err);
      }

      if (err.status === 403) {
        toast.error(serverMsg || STATUS_MESSAGES[403]);
      } else if (err.status === 409) {
        toast.error(serverMsg || STATUS_MESSAGES[409]);
      } else if (err.status === 429) {
        toast.error(STATUS_MESSAGES[429]);
      } else if (err.status === 413) {
        toast.error(STATUS_MESSAGES[413]);
      } else if (err.status === 415) {
        toast.error(STATUS_MESSAGES[415]);
      } else if (err.status >= 500) {
        toast.error(serverMsg || 'Error del servidor. Intentá de nuevo más tarde.');
      } else if (err.status >= 400) {
        toast.error(serverMsg || STATUS_MESSAGES[err.status] || 'Error inesperado.');
      }

      return throwError(() => err);
    }),
  );
};
