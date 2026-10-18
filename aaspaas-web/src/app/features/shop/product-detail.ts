import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Product, ProductImage, RatingSummary } from '../../core/models/api.models';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/services/cart.service';
import { CatalogService } from '../../core/services/catalog.service';
import { SocialService } from '../../core/services/social.service';
import { ToastService } from '../../core/services/toast.service';
import { InrPipe, tileFor } from '../../shared/format';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, InrPipe],
  template: `
    <div class="container page">
      <a routerLink="/shop" class="muted small">← Shop par wapas</a>
      @if (loading()) {
        <div class="skeleton" style="height: 380px; margin-top: 16px"></div>
      } @else if (product(); as p) {
        <div class="grid-2 mt" style="align-items: start">
          <div>
            <div class="media" [style.background]="tile().bg">
              @if (images().length) {
                <img [src]="images()[active()].imageUrl" [alt]="p.name" />
              } @else {
                <span class="blob" [style.background]="tile().fg"></span>
                <span class="initial">{{ p.name.charAt(0).toUpperCase() }}</span>
              }
            </div>
            @if (images().length > 1) {
              <div class="row" style="margin-top: 10px">
                @for (im of images(); track im.id; let i = $index) {
                  <button type="button" class="thumb" [class.on]="i === active()" (click)="active.set(i)" [attr.aria-label]="'Image ' + (i + 1)">
                    <img [src]="im.imageUrl" alt="" />
                  </button>
                }
              </div>
            }
          </div>

          <div class="stack">
            <span class="badge badge-blue">{{ p.categoryName }}</span>
            <h1>{{ p.name }}</h1>
            <div class="muted">Dukaan: <strong>{{ p.businessName }}</strong>
              @if (summary(); as s) {
                @if (s.totalRatings > 0) {
                  · ⭐ {{ s.averageRating.toFixed(1) }} ({{ s.totalRatings }})
                }
              }
            </div>
            <div>
              <span class="price" style="font-size: 2rem">{{ p.price | inr }}</span>
              @if (p.unit) {
                <span class="muted"> / {{ p.unit }}</span>
              }
            </div>
            @if (p.description) {
              <p class="muted">{{ p.description }}</p>
            }
            <div>
              @if (inStock()) {
                <span class="badge badge-green">Stock mein hai ({{ p.stockQuantity }} {{ p.unit || '' }})</span>
              } @else {
                <span class="badge badge-red">Abhi available nahi</span>
              }
            </div>

            <div class="row">
              <div class="qty" role="group" aria-label="Quantity">
                <button type="button" (click)="step(-1)" [disabled]="qty() <= 1" aria-label="Kam karein">−</button>
                <span>{{ qty() }}</span>
                <button type="button" (click)="step(1)" aria-label="Badhayein">+</button>
              </div>
              <button type="button" class="btn btn-primary btn-lg grow" [disabled]="!inStock() || adding()" (click)="add(false)">Cart mein daalein</button>
            </div>
            <button type="button" class="btn btn-gold btn-lg" [disabled]="!inStock() || adding()" (click)="add(true)">Abhi kharidein</button>
          </div>
        </div>
      } @else {
        <div class="card center mt"><h3>Product nahi mila</h3><a routerLink="/shop" class="btn btn-outline mt">Shop dekhein</a></div>
      }
    </div>
  `,
  styles: `
    .media {
      position: relative;
      aspect-ratio: 1 / 0.85;
      border-radius: var(--radius-lg);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .blob {
      width: 180px;
      height: 180px;
      border-radius: 50%;
      opacity: 0.85;
    }
    .initial {
      position: absolute;
      font-size: 4rem;
      font-weight: 800;
      color: #fff;
    }
    .thumb {
      width: 64px;
      height: 64px;
      padding: 0;
      border-radius: 12px;
      overflow: hidden;
      border: 2px solid var(--line);
      background: #fff;
    }
    .thumb.on {
      border-color: var(--maroon);
    }
    .thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .qty {
      display: inline-flex;
      align-items: center;
      border: 1.5px solid var(--rose-200);
      border-radius: var(--radius);
      background: #fff;
    }
    .qty button {
      width: 44px;
      height: 52px;
      border: 0;
      background: none;
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--maroon);
    }
    .qty span {
      min-width: 32px;
      text-align: center;
      font-weight: 700;
    }
  `,
})
export class ProductDetailPage implements OnInit {
  readonly id = input.required<string>();
  private readonly catalog = inject(CatalogService);
  private readonly cart = inject(CartService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly social = inject(SocialService);

  readonly product = signal<Product | null>(null);
  readonly images = signal<ProductImage[]>([]);
  readonly summary = signal<RatingSummary | null>(null);
  readonly loading = signal(true);
  readonly adding = signal(false);
  readonly qty = signal(1);
  readonly active = signal(0);
  readonly tile = computed(() => tileFor(this.product()?.id ?? 0));
  readonly inStock = computed(() => {
    const p = this.product();
    return !!p && p.available !== false && Number(p.stockQuantity) > 0;
  });

  ngOnInit(): void {
    const pid = Number(this.id());
    this.catalog.product(pid).subscribe({
      next: (p) => {
        this.product.set(p);
        this.loading.set(false);
        this.social.businessSummary(p.businessId).subscribe({ next: (s) => this.summary.set(s), error: () => undefined });
      },
      error: () => this.loading.set(false),
    });
    this.catalog.images(pid).subscribe((i) => this.images.set(i));
  }

  step(d: number): void {
    const max = Math.max(1, Math.floor(Number(this.product()?.stockQuantity ?? 1)));
    this.qty.set(Math.min(max, Math.max(1, this.qty() + d)));
  }

  add(buyNow: boolean): void {
    const p = this.product();
    if (!p) return;
    if (!this.auth.isLoggedIn()) {
      this.toast.info('Pehle login karein.');
      void this.router.navigate(['/login'], { queryParams: { redirect: this.router.url } });
      return;
    }
    this.adding.set(true);
    this.cart.add(p.id, this.qty()).subscribe({
      next: () => {
        this.adding.set(false);
        this.toast.success(`${p.name} cart mein add ho gaya`);
        if (buyNow) void this.router.navigate(['/cart']);
      },
      error: () => this.adding.set(false),
    });
  }
}
