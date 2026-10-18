import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartItem } from '../../core/models/api.models';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { InrPipe } from '../../shared/format';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, InrPipe],
  template: `
    <div class="container page">
      <div class="page-head">
        <div>
          <h1>Aapka cart</h1>
          <p>{{ cart.count() }} item{{ cart.count() === 1 ? '' : 's' }}</p>
        </div>
        @if (!cart.isEmpty()) {
          <button type="button" class="btn btn-ghost" (click)="clear()">Cart khaali karein</button>
        }
      </div>

      @if (cart.isEmpty()) {
        <div class="card center" style="padding: 48px 20px">
          <div style="font-size: 3rem">🛒</div>
          <h3>Cart abhi khaali hai</h3>
          <p class="muted">Apne mohalle ki dukaanon se kuch achha chuniye.</p>
          <a routerLink="/shop" class="btn btn-primary btn-lg mt">Shopping shuru karein</a>
        </div>
      } @else {
        <div class="split">
          <div class="stack">
            @if (cart.mixedBusinesses()) {
              <div class="alert">
                Aapke cart mein alag-alag dukaanon ka saaman hai. Ek order mein sirf ek dukaan ka saaman ho sakta hai, isliye checkout se pehle ek dukaan ke items hi rakhein.
              </div>
            }
            @for (i of cart.items(); track i.id) {
              <div class="card-flat line">
                <div class="grow">
                  <a [routerLink]="['/product', i.productId]" class="strong">{{ i.productName }}</a>
                  <div class="muted small">{{ i.businessName }}</div>
                  <div class="small">{{ i.unitPrice | inr }} each</div>
                </div>
                <div class="qty" role="group" [attr.aria-label]="i.productName + ' quantity'">
                  <button type="button" (click)="change(i, -1)" aria-label="Kam karein">−</button>
                  <span>{{ i.quantity }}</span>
                  <button type="button" (click)="change(i, 1)" aria-label="Badhayein">+</button>
                </div>
                <div class="right" style="min-width: 80px"><strong>{{ i.totalPrice | inr }}</strong></div>
                <button type="button" class="icon-btn" (click)="remove(i)" [attr.aria-label]="i.productName + ' hatayein'">✕</button>
              </div>
            }
          </div>

          <aside class="card summary">
            <h3>Order summary</h3>
            <div class="row-between"><span class="muted">Subtotal</span><strong>{{ cart.subtotal() | inr }}</strong></div>
            <div class="row-between"><span class="muted">Delivery</span><span class="small muted">Checkout ke baad tay hoga</span></div>
            <hr class="divider" />
            <div class="row-between"><strong>Total</strong><span class="price" style="font-size: 1.5rem">{{ cart.subtotal() | inr }}</span></div>
            <a routerLink="/checkout" class="btn btn-primary btn-lg btn-block mt" [class.disabled]="cart.mixedBusinesses()" [attr.aria-disabled]="cart.mixedBusinesses()">Checkout par jaayein</a>
          </aside>
        </div>
      }
    </div>
  `,
  styles: `
    .line {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 14px;
    }
    .qty {
      display: inline-flex;
      align-items: center;
      border: 1.5px solid var(--rose-200);
      border-radius: var(--radius);
      background: #fff;
    }
    .qty button {
      width: 40px;
      height: 44px;
      border: 0;
      background: none;
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--maroon);
    }
    .qty span {
      min-width: 28px;
      text-align: center;
      font-weight: 700;
    }
    .summary {
      position: sticky;
      top: 90px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .disabled {
      opacity: 0.5;
      pointer-events: none;
    }
  `,
})
export class CartPage {
  readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);

  change(item: CartItem, delta: number): void {
    const q = Number(item.quantity) + delta;
    if (q < 1) {
      this.remove(item);
      return;
    }
    this.cart.update(item.id, q).subscribe();
  }

  remove(item: CartItem): void {
    this.cart.remove(item.id).subscribe(() => this.toast.info(`${item.productName} hata diya gaya`));
  }

  clear(): void {
    if (confirm('Poora cart khaali karein?')) this.cart.clear().subscribe();
  }
}
