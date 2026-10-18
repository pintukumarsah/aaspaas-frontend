import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { newIdempotencyKey, errorMessage } from '../../core/http/api.service';
import { Order, PaymentMethod } from '../../core/models/api.models';
import { AddressService } from '../../core/services/address.service';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { AddressForm } from '../../shared/address-form';
import { InrPipe } from '../../shared/format';

const METHODS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: 'COD', label: 'Cash on Delivery', hint: 'Saaman milne par paise dein' },
  { id: 'UPI', label: 'UPI', hint: 'Online payment' },
  { id: 'CARD', label: 'Card', hint: 'Credit / debit card' },
  { id: 'NET_BANKING', label: 'Net banking', hint: 'Bank se seedha' },
];

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [RouterLink, InrPipe, AddressForm],
  template: `
    <div class="container page">
      <div class="page-head"><div><h1>Checkout</h1><p>Address chuniye, payment ka tareeka chuniye aur order kar dijiye.</p></div></div>

      @if (cart.isEmpty() && !placed()) {
        <div class="card center"><h3>Cart khaali hai</h3><a routerLink="/shop" class="btn btn-primary mt">Shop par jaayein</a></div>
      } @else {
        <div class="split">
          <div class="stack">
            <section class="card">
              <h3>1. Delivery address</h3>
              @if (addresses.list().length && !adding()) {
                <div class="stack-sm">
                  @for (a of addresses.list(); track a.id) {
                    <label class="opt" [class.on]="selectedId() === a.id">
                      <input type="radio" name="addr" [checked]="selectedId() === a.id" (change)="selectedId.set(a.id)" />
                      <div><strong>{{ a.label }}</strong><div class="muted small">{{ addresses.format(a) }}</div></div>
                    </label>
                  }
                </div>
                <button type="button" class="btn btn-ghost btn-sm mt" (click)="adding.set(true)">+ Naya address</button>
              } @else {
                <app-address-form (saved)="onSaved($event.id)" (cancelled)="adding.set(false)" />
              }
            </section>

            <section class="card">
              <h3>2. Payment</h3>
              <div class="stack-sm">
                @for (m of methods; track m.id) {
                  <label class="opt" [class.on]="method() === m.id">
                    <input type="radio" name="pay" [checked]="method() === m.id" (change)="method.set(m.id)" />
                    <div><strong>{{ m.label }}</strong><div class="muted small">{{ m.hint }}</div></div>
                  </label>
                }
              </div>
            </section>
          </div>

          <aside class="card sum">
            <h3>Order summary</h3>
            @for (i of cart.items(); track i.id) {
              <div class="row-between small"><span>{{ i.productName }} × {{ i.quantity }}</span><span>{{ i.totalPrice | inr }}</span></div>
            }
            <hr class="divider" />
            <div class="row-between"><strong>Total</strong><span class="price" style="font-size: 1.5rem">{{ cart.subtotal() | inr }}</span></div>
            <p class="tiny muted">Delivery charge delivery partner ke quote se tay hota hai, order ke baad.</p>
            @if (error()) { <div class="alert alert-error" role="alert">{{ error() }}</div> }
            <button type="button" class="btn btn-primary btn-lg btn-block" [disabled]="!canPlace()" (click)="place()">{{ busy() ? 'Order ho raha hai...' : 'Order karein' }}</button>
          </aside>
        </div>
      }
    </div>
  `,
  styles: `
    .opt {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px;
      border: 1.5px solid var(--rose-200);
      border-radius: var(--radius);
      cursor: pointer;
    }
    .opt.on {
      border-color: var(--maroon);
      background: var(--rose-100);
    }
    .opt input {
      width: 20px;
      height: 20px;
      accent-color: var(--maroon);
    }
    .sum {
      display: flex;
      flex-direction: column;
      gap: 10px;
      position: sticky;
      top: 90px;
    }
  `,
})
export class CheckoutPage implements OnInit {
  readonly cart = inject(CartService);
  readonly addresses = inject(AddressService);
  private readonly orders = inject(OrderService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly methods = METHODS;
  readonly selectedId = signal<number | null>(null);
  readonly method = signal<PaymentMethod>('COD');
  readonly adding = signal(false);
  readonly busy = signal(false);
  readonly placed = signal(false);
  readonly error = signal('');
  readonly canPlace = computed(() => !this.busy() && this.selectedId() !== null && !this.cart.isEmpty() && !this.cart.mixedBusinesses());

  /** One key per checkout attempt: a double click or retry can never create two orders. */
  private idempotencyKey = newIdempotencyKey();
  private order: Order | null = null;

  ngOnInit(): void {
    this.addresses.reload();
    this.selectedId.set(this.addresses.default()?.id ?? null);
    this.adding.set(this.addresses.list().length === 0);
    this.cart.refresh().subscribe();
  }

  onSaved(id: number): void {
    this.selectedId.set(id);
    this.adding.set(false);
  }

  place(): void {
    const addressId = this.selectedId();
    if (addressId === null) return;
    this.busy.set(true);
    this.error.set('');

    const createOrder$ = this.order ? null : this.orders.create(addressId, this.idempotencyKey);
    const afterOrder = (order: Order) => {
      this.order = order;
      this.placed.set(true);
      this.cart.reset();
      this.orders.pay(order.id, this.method(), newIdempotencyKey()).subscribe({
        next: () => this.done(order),
        error: (e) => {
          // The order exists; payment can be retried from the order page.
          this.busy.set(false);
          this.toast.error(errorMessage(e, 'Payment shuru nahi ho paaya. Order page se dobara try karein.'));
          void this.router.navigate(['/orders', order.id]);
        },
      });
    };

    if (createOrder$) {
      createOrder$.subscribe({
        next: afterOrder,
        error: (e) => {
          this.busy.set(false);
          this.idempotencyKey = newIdempotencyKey();
          this.error.set(errorMessage(e, 'Order nahi ho paaya.'));
        },
      });
    } else if (this.order) {
      afterOrder(this.order);
    }
  }

  private done(order: Order): void {
    this.busy.set(false);
    this.toast.success(this.method() === 'COD' ? 'Order ho gaya! Saaman milne par paise dein.' : 'Order ho gaya! Payment shuru ho gayi.');
    void this.router.navigate(['/orders', order.id]);
  }
}
