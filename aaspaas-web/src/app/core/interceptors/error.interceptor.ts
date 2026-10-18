import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SILENT, errorMessage } from '../http/api.service';
import { ToastService } from '../services/toast.service';

/**
 * Shows a toast for failed API calls unless the caller opted out with
 * `{ silent: true }` (used for role probes, login forms etc.).
 * 401 is left to the auth interceptor (token refresh / redirect to login).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status !== 401 && !req.context.get(SILENT)) {
        toast.error(errorMessage(err));
      }
      return throwError(() => err);
    }),
  );
};
