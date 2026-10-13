
// import { Injectable, inject } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';

// import { API_ENDPOINTS } from '../../../core/http/api-endpoints';

// import {
//   LoginRequest,
//   LoginResponse,
//   RegisterRequest,
//   RegisterResponse,
// } from '../models/auth.models';

// @Injectable({
//   providedIn: 'root',
// })
// export class AuthApiService {
//   private readonly http = inject(HttpClient);

//   login(request: LoginRequest): Observable<LoginResponse> {
//     return this.http.post<LoginResponse>(
//       API_ENDPOINTS.auth.login,
//       request
//     );
//   }

//   register(request: RegisterRequest): Observable<RegisterResponse> {
//     return this.http.post<RegisterResponse>(
//       API_ENDPOINTS.auth.register,
//       request
//     );
//   }
// }


import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../../core/http/api-endpoints';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '../models/auth.models';

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly http = inject(HttpClient);

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      API_ENDPOINTS.auth.login,
      request
    );
  }

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(
      API_ENDPOINTS.auth.register,
      request
    );
  }

  refresh(refreshToken: string): Observable<RefreshTokenResponse> {
    const request: RefreshTokenRequest = { refreshToken };

    return this.http.post<RefreshTokenResponse>(
      API_ENDPOINTS.auth.refresh,
      request
    );
  }

  logout(refreshToken: string): Observable<void> {
    return this.http.post<void>(
      API_ENDPOINTS.auth.logout,
      { refreshToken }
    );
  }
}
