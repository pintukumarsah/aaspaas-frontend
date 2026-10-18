import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, catchError, interval, of, startWith, switchMap, tap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ApiService, asList } from '../http/api.service';
import { AppNotification, Page, Rating, RatingPayload, RatingSummary } from '../models/api.models';

/** Notifications (with unread badge polling) and ratings. */
@Injectable({ providedIn: 'root' })
export class SocialService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  private readonly _unread = signal(0);
  readonly unread = computed(() => this._unread());
  private pollSub: { unsubscribe(): void } | null = null;

  constructor() {
    effect(() => {
      const loggedIn = this.auth.isLoggedIn();
      untracked(() => {
        this.pollSub?.unsubscribe();
        this.pollSub = null;
        if (!loggedIn) {
          this._unread.set(0);
          return;
        }
        this.pollSub = interval(45000)
          .pipe(
            startWith(0),
            switchMap(() => this.api.get<number>('/notifications/unread-count', { silent: true }).pipe(catchError(() => of(0)))),
          )
          .subscribe((n) => this._unread.set(Number(n) || 0));
      });
    });
  }

  notifications(): Observable<AppNotification[]> {
    return this.api.get<AppNotification[]>('/notifications', { params: { page: 0, size: 50 } }).pipe(
      switchMap((l) => of(asList<AppNotification>(l))),
    );
  }
  markRead(id: number): Observable<void> {
    return this.api.put<void>(`/notifications/${id}/read`).pipe(tap(() => this._unread.update((n) => Math.max(0, n - 1))));
  }
  markAllRead(): Observable<void> {
    return this.api.put<void>('/notifications/read-all').pipe(tap(() => this._unread.set(0)));
  }

  rate(body: RatingPayload): Observable<Rating> {
    return this.api.post<Rating>('/ratings', body);
  }
  businessSummary(id: number): Observable<RatingSummary> {
    return this.api.get<RatingSummary>(`/ratings/business/${id}/summary`, { silent: true });
  }
  businessRatings(id: number): Observable<Page<Rating>> {
    return this.api.get<Page<Rating>>(`/ratings/business/${id}`, { silent: true, params: { page: 0, size: 10 } });
  }
}
