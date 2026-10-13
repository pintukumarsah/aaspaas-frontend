
import { Injectable } from '@angular/core';

import { LoginResponse } from '../../features/auth/models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  private readonly ACCESS_TOKEN_KEY = 'aaspaas_access_token';
  private readonly REFRESH_TOKEN_KEY = 'aaspaas_refresh_token';

  saveSession(response: LoginResponse): void {
    sessionStorage.setItem(
      this.ACCESS_TOKEN_KEY,
      response.accessToken
    );

    sessionStorage.setItem(
      this.REFRESH_TOKEN_KEY,
      response.refreshToken
    );
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  clearSession(): void {
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  
updateAccessToken(accessToken: string): void {
  sessionStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
}

updateSession(accessToken: string, refreshToken: string): void {
  sessionStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
  sessionStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
}

}
