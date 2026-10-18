import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, forkJoin, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { ApiService } from '../http/api.service';
import { LoginResponse, RegisterRequest, RegisterResponse, Role, Session } from '../models/api.models';
import { TokenStorage } from './token-storage.service';

const KNOWN_ROLES: Role[] = ['CUSTOMER', 'SELLER', 'DELIVERY_PARTNER', 'SERVICE_PROVIDER', 'ADMIN'];

/**
 * Session + role management.
 *
 * The backend login response carries no roles and the JWT only holds userId +
 * phone, so roles are discovered by calling role-protected endpoints
 * (403 = not that role). If you apply backend-patch/ (roles added to
 * LoginResponse) the probe is skipped automatically.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly storage = inject(TokenStorage);
  private readonly router = inject(Router);

  private readonly _session = signal<Session | null>(this.storage.read());
  private refreshInFlight$: Observable<string> | null = null;

  readonly session = this._session.asReadonly();
  readonly isLoggedIn = computed(() => this._session() !== null);
  readonly roles = computed<Role[]>(() => this._session()?.roles ?? []);
  readonly fullName = computed(() => this._session()?.fullName ?? '');
  readonly initial = computed(() => (this._session()?.fullName?.trim().charAt(0) || 'A').toUpperCase());

  /** The panel a user should land on first. */
  readonly homeRoute = computed(() => {
    const roles = this.roles();
    if (roles.includes('ADMIN')) return '/admin';
    if (roles.includes('SELLER')) return '/seller';
    if (roles.includes('DELIVERY_PARTNER')) return '/delivery';
    if (roles.includes('SERVICE_PROVIDER')) return '/provider';
    return '/';
  });

  accessToken(): string | null {
    return this._session()?.accessToken ?? null;
  }

  refreshToken(): string | null {
    return this._session()?.refreshToken ?? null;
  }

  hasAnyRole(...roles: Role[]): boolean {
    const mine = this.roles();
    return roles.some((r) => mine.includes(r));
  }

  register(body: RegisterRequest): Observable<RegisterResponse> {
    const payload: RegisterRequest = { ...body, email: body.email?.trim() ? body.email.trim() : undefined };
    return this.api.post<RegisterResponse>('/auth/register', payload, { silent: true });
  }

  login(phone: string, password: string): Observable<Session> {
    return this.api.post<LoginResponse>('/auth/login', { phone, password }, { silent: true }).pipe(
      map((res) => this.toSession(res, phone)),
      tap((session) => this.setSession(session)),
      switchMap((session) => this.detectRoles(session).pipe(
        tap((roles) => this.updateRoles(roles)),
        map(() => this._session() as Session),
      )),
    );
  }

  /** Re-checks roles (e.g. after an admin granted a new role). */
  refreshRoles(): Observable<Role[]> {
    const session = this._session();
    if (!session) return of([]);
    return this.detectRoles(session).pipe(tap((roles) => this.updateRoles(roles)));
  }

  /**
   * Self-service role (SELLER / SERVICE_PROVIDER / DELIVERY_PARTNER).
   * Needs backend-patch/RoleSelfServiceController.java - the original backend
   * has no way to obtain these roles except editing user_roles in the database.
   */
  becomeRole(role: Exclude<Role, 'ADMIN' | 'CUSTOMER'>): Observable<Role[]> {
    return this.api.post<unknown>('/users/me/roles', { role }, { silent: true }).pipe(
      switchMap(() => this.detectRoles({ ...(this._session() as Session), roles: ['CUSTOMER'] })),
      tap((roles) => this.updateRoles(roles)),
    );
  }

  /** Exchanges the refresh token for a new access token. Concurrent callers share one request. */
  refreshAccessToken(): Observable<string> {
    if (this.refreshInFlight$) return this.refreshInFlight$;
    const refreshToken = this.refreshToken();
    if (!refreshToken) return new Observable<string>((s) => s.error(new Error('No refresh token')));

    this.refreshInFlight$ = this.api
      .post<LoginResponse>('/auth/refresh', { refreshToken }, { silent: true })
      .pipe(
        tap((res) => {
          const current = this._session();
          if (current) this.setSession({ ...current, accessToken: res.accessToken, refreshToken: res.refreshToken || current.refreshToken });
        }),
        map((res) => res.accessToken),
        finalize(() => (this.refreshInFlight$ = null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.refreshInFlight$;
  }

  logout(redirect = true): void {
    const refreshToken = this.refreshToken();
    if (refreshToken) {
      this.api.post<void>('/auth/logout', { refreshToken }, { silent: true }).pipe(catchError(() => of(null))).subscribe();
    }
    this.clear();
    if (redirect) void this.router.navigate(['/login']);
  }

  /** Drops the local session without calling the server (used when the refresh token is dead). */
  clear(): void {
    this.storage.clear();
    this._session.set(null);
  }

  /* ----------------------------------------------------------- internals */

  private toSession(res: LoginResponse, phone: string): Session {
    const fromServer = (res.roles ?? []).map((r) => r.replace(/^ROLE_/, '').toUpperCase()).filter((r): r is Role => KNOWN_ROLES.includes(r as Role));
    return {
      userId: res.userId,
      fullName: res.fullName,
      phone,
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      roles: fromServer.length ? fromServer : ['CUSTOMER'],
    };
  }

  private setSession(session: Session): void {
    this.storage.write(session);
    this._session.set(session);
  }

  private updateRoles(roles: Role[]): void {
    const current = this._session();
    if (!current) return;
    this.setSession({ ...current, roles });
  }

  private detectRoles(session: Session): Observable<Role[]> {
    // Roles came with the login response (backend patch applied).
    if (session.roles.length > 1 || session.roles.some((r) => r !== 'CUSTOMER')) {
      return of(session.roles);
    }
    const probe = (path: string) =>
      this.api.get<unknown>(path, { silent: true, params: { size: 1 } }).pipe(
        map(() => true),
        // 403/401 = the role is missing. Any other error (e.g. 404 "no profile yet") still proves the role passed the security check.
        catchError((e: unknown) => of(!(e instanceof HttpErrorResponse && [0, 401, 403].includes(e.status)))),
      );

    return forkJoin({
      admin: probe('/admin/dashboard'),
      seller: probe('/businesses/my'),
      provider: probe('/service-provider/listings'),
      partner: probe('/partner-wallet/summary'),
    }).pipe(
      map(({ admin, seller, provider, partner }) => {
        const roles: Role[] = ['CUSTOMER'];
        if (admin) roles.push('ADMIN');
        if (seller && !admin) roles.push('SELLER');
        if (provider && !admin) roles.push('SERVICE_PROVIDER');
        if (partner) roles.push('DELIVERY_PARTNER');
        return roles;
      }),
    );
  }
}
