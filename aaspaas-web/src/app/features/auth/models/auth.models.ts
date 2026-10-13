
export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email?: string;
  phone: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: number;
  fullName: string;
}

export interface RegisterResponse {
  userId: number;
  fullName: string;
  phone: string;
  message: string;
}

export interface ApiErrorResponse {
  timestamp?: string;
  status?: number;
  error?: string;
  code?: string;
  message?: string;
  path?: string;
  correlationId?: string;
  validationErrors?: Record<string, string>;
}
