import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ApiService } from '../http/api.service';
import { Cart } from '../models/api.models';
import { ToastService } from './toast.service';

/** Server-side cart (GET/POST/PUT/DELETE /api/cart...). Requires login. */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  private readonly _cart = signal<Cart | null>(null);
  readonly cart = this._cart.asReadonly();
  readonly items = computed(() => this._cart()?.items ?? []);
  readonly count = computed(() => this.items().reduce((sum, i) => sum + Number(i.quantity), 0));
  readonly subtotal = computed(() => Number(this._cart()?.subtotal ?? 0));
  readonly isEmpty = computed(() => this.items().length === 0);
  /** The backend creates one order per business, so a mixed cart cannot be checked out. */
  readonly businessIds = computed(() => [...new Set(this.items().map((i) => i.businessId))]);
  readonly mixedBusinesses = computed(() => this.businessIds().length > 1);

  constructor() {
    // Load the cart on login (and after a page reload), clear it on logout.
    effect(() => {
      const loggedIn = this.auth.isLoggedIn();
      untracked(() => {
        if (loggedIn) this.refresh().subscribe();
        else this._cart.set(null);
      });
    });
  }

  refresh(): Observable<Cart | null> {
    return this.api.get<Cart>('/cart', { silent: true }).pipe(
      tap((cart) => this._cart.set(cart)),
      catchError(() => of(null)),
    );
  }

  add(productId: number, quantity = 1): Observable<Cart> {
    return this.api.post<Cart>('/cart/items', { productId, quantity }).pipe(tap((cart) => this._cart.set(cart)));
  }

  update(itemId: number, quantity: number): Observable<Cart> {
    return this.api.put<Cart>(`/cart/items/${itemId}`, { quantity }).pipe(tap((cart) => this._cart.set(cart)));
  }

  remove(itemId: number): Observable<unknown> {
    return this.api.delete<void>(`/cart/items/${itemId}`).pipe(tap(() => this.refresh().subscribe()));
  }

  clear(): Observable<unknown> {
    return this.api.delete<void>('/cart').pipe(tap(() => this._cart.set(null)));
  }

  /** Called after an order is created: the server already emptied the cart. */
  reset(): void {
    this._cart.set(null);
  }

  /** Add-to-cart used by product cards; handles the "not logged in" case with a toast. */
  quickAdd(productId: number, name: string, onNeedLogin: () => void): void {
    if (!this.auth.isLoggedIn()) {
      this.toast.info('Cart mein daalne ke liye pehle login karein.');
      onNeedLogin();
      return;
    }
    this.add(productId, 1).subscribe({ next: () => this.toast.success(`${name} cart mein add ho gaya`) });
  }
}
