import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, AuthResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  login(credentials: { email: string; password: string }): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => this.saveSession(res?.data))
    );
  }

  register(data: { name: string; fullName: string; email: string; password: string }): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, data).pipe(
      tap(res => { if (res?.data?.accessToken) this.saveSession(res.data); })
    );
  }

  private saveSession(data?: AuthResponse): void {
    if (!data?.accessToken) return;
    localStorage.setItem('access_token', data.accessToken);
    if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken);
    if (data.user) localStorage.setItem('current_user', JSON.stringify(data.user));
  }

  getToken(): string | null { return localStorage.getItem('access_token'); }

  logout(): void {
    const refreshToken = localStorage.getItem('refresh_token');
    // Best-effort server-side invalidation; local session is always cleared.
    if (refreshToken) this.http.post(`${this.apiUrl}/logout`, { refreshToken }).subscribe({ error: () => undefined });
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
  }

  isLoggedIn(): boolean { return !!this.getToken(); }
}
