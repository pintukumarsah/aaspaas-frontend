import { Injectable } from '@angular/core';
import { Session } from '../models/api.models';

const KEY = 'aaspaas.session.v1';

/** Persists the logged-in session (tokens + roles) in localStorage. */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  read(): Session | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Session;
      return parsed && parsed.accessToken && parsed.refreshToken ? parsed : null;
    } catch {
      return null;
    }
  }

  write(session: Session): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(session));
    } catch {
      /* storage may be blocked (private mode) - session then lives in memory only */
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }
}
