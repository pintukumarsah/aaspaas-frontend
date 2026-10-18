import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../services/toast.service';

const AUTH_PATH = /\/auth\/(login|register|refresh|logout)(\?|$)/;

function withBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

/**
 * Adds `Authorization: Bearer <accessToken>` to API calls. The backend access
 * token lives only 15 minutes (expiresIn = 900), so on a 401 the interceptor
 * silently calls POST /auth/refresh once and replays the original request.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const isApi = req.url.startsWith(environment.apiUrl);
  const isAuthCall = AUTH_PATH.test(req.url);
  if (!isApi || isAuthCall) return next(req);

  const token = auth.accessToken();
  const outgoing = token ? withBearer(req, token) : req;

  return next(outgoing).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401 || !auth.refreshToken()) {
        return throwError(() => err);
      }
      return auth.refreshAccessToken().pipe(
        switchMap((fresh) => next(withBearer(req, fresh))),
        catchError((refreshErr: unknown) => {
          if (auth.isLoggedIn()) {
            auth.clear();
            toast.info('Session khatam ho gaya. Dobara login karein.');
            void router.navigate(['/login'], { queryParams: { redirect: router.url } });
          }
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
