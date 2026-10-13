
import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { API_ENDPOINTS } from '../http/api-endpoints';
import { TokenStorageService } from '../auth/token-storage.service';
import { AuthSessionService } from '../auth/auth-session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  const authUrls = [
    API_ENDPOINTS.auth.login,
    API_ENDPOINTS.auth.register,
    API_ENDPOINTS.auth.refresh,
    API_ENDPOINTS.auth.logout,
  ];

  const isAuthRequest = authUrls.some((url) =>
    req.url.startsWith(url)
  );

  const accessToken = tokenStorage.getAccessToken();

  const requestToSend =
    accessToken && !isAuthRequest
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      : req;

  return next(requestToSend).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        isAuthRequest
      ) {
        return throwError(() => error);
      }

      return authSession.refreshAccessToken().pipe(
        switchMap((newAccessToken) => {
          const retryRequest = req.clone({
            setHeaders: {
              Authorization: `Bearer ${newAccessToken}`,
            },
          });

          return next(retryRequest);
        }),
        catchError((refreshError: unknown) => {
          tokenStorage.clearSession();
          void router.navigateByUrl('/login');

          return throwError(() => refreshError);
        })
      );
    })
  );
};
