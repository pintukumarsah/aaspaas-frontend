
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  catchError,
  filter,
  finalize,
  map,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';

import { AuthApiService } from '../../features/auth/services/auth-api.service';
import { TokenStorageService } from './token-storage.service';

type RefreshState = {
  accessToken: string | null;
  failed: boolean;
} | null;

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly authApi = inject(AuthApiService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);

  private refreshInProgress = false;

  private readonly refreshState =
    new BehaviorSubject<RefreshState>(null);

  refreshAccessToken(): Observable<string> {
    const refreshToken = this.tokenStorage.getRefreshToken();

    if (!refreshToken) {
      this.tokenStorage.clearSession();
      return throwError(() => new Error('Refresh token is missing.'));
    }

    if (this.refreshInProgress) {
      return this.refreshState.pipe(
        filter((state) => state !== null),
        take(1),
        switchMap((state) => {
          if (state.failed || !state.accessToken) {
            return throwError(
              () => new Error('Token refresh failed.')
            );
          }

          return [state.accessToken];
        })
      );
    }

    this.refreshInProgress = true;
    this.refreshState.next(null);

    return this.authApi.refresh(refreshToken).pipe(
      tap((response) => {
        if (response.refreshToken) {
          this.tokenStorage.updateSession(
            response.accessToken,
            response.refreshToken
          );
        } else {
          this.tokenStorage.updateAccessToken(
            response.accessToken
          );
        }

        this.refreshState.next({
          accessToken: response.accessToken,
          failed: false,
        });
      }),
      map((response) => response.accessToken),
      catchError((error: unknown) => {
        this.tokenStorage.clearSession();

        this.refreshState.next({
          accessToken: null,
          failed: true,
        });

        return throwError(() => error);
      }),
      finalize(() => {
        this.refreshInProgress = false;
      })
    );
  }

  logout(): void {
    const refreshToken = this.tokenStorage.getRefreshToken();

    if (!refreshToken) {
      this.finishLogout();
      return;
    }

    this.authApi.logout(refreshToken).pipe(
      catchError(() => {
        // Server logout fail ho to bhi local session clear karein.
        return [undefined];
      }),
      finalize(() => this.finishLogout())
    ).subscribe();
  }

  private finishLogout(): void {
    this.tokenStorage.clearSession();
    void this.router.navigateByUrl('/login');
  }
}
