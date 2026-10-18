import { HttpClient, HttpContext, HttpContextToken, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiError } from '../models/api.models';

/** Set on a request to stop the global error interceptor from showing a toast. */
export const SILENT = new HttpContextToken<boolean>(() => false);

export interface RequestOptions {
  params?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  silent?: boolean;
}

/**
 * Thin wrapper around HttpClient.
 *  - prefixes the API base url
 *  - drops null/undefined query params
 *  - unwraps the backend's `{ success, message, data }` envelope when present,
 *    so callers always receive the payload itself (raw DTOs pass through).
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  readonly base = environment.apiUrl;

  get<T>(path: string, opts: RequestOptions = {}): Observable<T> {
    return this.http.get<unknown>(this.url(path), this.options(opts)).pipe(map((r) => unwrap<T>(r)));
  }

  post<T>(path: string, body: unknown = {}, opts: RequestOptions = {}): Observable<T> {
    return this.http.post<unknown>(this.url(path), body, this.options(opts)).pipe(map((r) => unwrap<T>(r)));
  }

  put<T>(path: string, body: unknown = {}, opts: RequestOptions = {}): Observable<T> {
    return this.http.put<unknown>(this.url(path), body, this.options(opts)).pipe(map((r) => unwrap<T>(r)));
  }

  patch<T>(path: string, body: unknown = {}, opts: RequestOptions = {}): Observable<T> {
    return this.http.patch<unknown>(this.url(path), body, this.options(opts)).pipe(map((r) => unwrap<T>(r)));
  }

  delete<T>(path: string, opts: RequestOptions = {}): Observable<T> {
    return this.http.delete<unknown>(this.url(path), this.options(opts)).pipe(map((r) => unwrap<T>(r)));
  }

  private url(path: string): string {
    return `${this.base}${path.startsWith('/') ? path : '/' + path}`;
  }

  private options(opts: RequestOptions) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(opts.params ?? {})) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }
    const context = new HttpContext().set(SILENT, !!opts.silent);
    return { params, headers: opts.headers, context };
  }
}

function isEnvelope(value: unknown): value is { success: boolean; data: unknown } {
  return typeof value === 'object' && value !== null && 'success' in value && 'data' in value;
}

export function unwrap<T>(value: unknown): T {
  return (isEnvelope(value) ? value.data : value) as T;
}

/** Best human-readable message from any failed request. */
export function errorMessage(err: unknown, fallback = 'Kuch gadbad ho gayi. Dobara try karein.'): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Server se connect nahi ho paa raha. Backend chal raha hai? (localhost:9090)';
    }
    const body = err.error as ApiError | string | null;
    if (body && typeof body === 'object') {
      const fields = body.validationErrors ? Object.values(body.validationErrors) : [];
      if (fields.length) return fields.join(' · ');
      if (body.message) return body.message;
    }
    if (typeof body === 'string' && body.trim()) return body;
    if (err.status === 401) return 'Session khatam ho gaya. Dobara login karein.';
    if (err.status === 403) return 'Aapko is kaam ki permission nahi hai.';
    if (err.status === 404) return 'Yeh cheez nahi mili.';
    if (err.status === 429) return 'Bahut zyada requests. Thodi der baad try karein.';
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** Page helper: a backend list endpoint may return a bare array or a Page. */
export function asList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as { content?: unknown }).content)) {
    return (value as { content: T[] }).content;
  }
  return [];
}

export function newIdempotencyKey(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
