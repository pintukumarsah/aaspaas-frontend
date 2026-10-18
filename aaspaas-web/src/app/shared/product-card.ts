import { AsyncPipe } from '@angular/common';
import { Component, OnInit, computed, inject, input } from '@angular/core';
import { Observable } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { Product } from '../core/models/api.models';
import { CartService } from '../core/services/cart.service';
import { CatalogService } from '../core/services/catalog.service';
import { InrPipe, tileFor } from './format';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, AsyncPipe, InrPipe],
  template: `
    <article class="pc card-hover">
      <a [routerLink]="['/product', product().id]" class="media" [style.background]="tile().bg" [attr.aria-label]="product().name">
        @if (image$ | async; as src) {
          <img [src]="src" [alt]="product().name" loading="lazy" />
        } @else {
          <span class="blob" [style.background]="tile().fg"></span>
          <span class="initial">{{ product().name.charAt(0).toUpperCase() }}</span>
        }
        @if (!inStock()) {
          <span class="sold">Khatam</span>
        }
      </a>
      <div class="body">
        <a [routerLink]="['/product', product().id]" class="name">{{ product().name }}</a>
        <div class="shop">{{ product().businessName }}</div>
        <div class="foot">
          <div>
            <span class="price big">{{ product().price | inr }}</span>
            @if (product().unit) {
              <span class="muted tiny"> / {{ product().unit }}</span>
            }
          </div>
          <button type="button" class="btn btn-primary btn-sm" [disabled]="!inStock() || busy" (click)="add()">Add</button>
        </div>
      </div>
    </article>
  `,
  styles: `
    .pc {
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      overflow: hidden;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .media {
      position: relative;
      height: 168px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .blob {
      width: 92px;
      height: 92px;
      border-radius: 50%;
      opacity: 0.85;
    }
    .initial {
      position: absolute;
      font-size: 2.2rem;
      font-weight: 800;
      color: #fff;
    }
    .sold {
      position: absolute;
      top: 10px;
      left: 10px;
      background: var(--ink);
      color: #fff;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
    }
    .body {
      padding: 14px 16px 16px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
    }
    .name {
      font-weight: 700;
      font-size: 1.02rem;
    }
    .name:hover {
      color: var(--maroon);
    }
    .shop {
      color: var(--ink-3);
      font-size: 0.84rem;
    }
    .foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: auto;
      padding-top: 12px;
    }
    .big {
      font-size: 1.3rem;
    }
  `,
})
export class ProductCard implements OnInit {
  readonly product = input.required<Product>();
  private readonly cart = inject(CartService);
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogService);

  busy = false;
  readonly tile = computed(() => tileFor(this.product().id));
  readonly inStock = computed(() => this.product().available !== false && Number(this.product().stockQuantity) > 0);
  image$!: Observable<string | null>;

  ngOnInit(): void {
    this.image$ = this.catalog.firstImage(this.product().id);
  }

  add(): void {
    this.cart.quickAdd(this.product().id, this.product().name, () => void this.router.navigate(['/login'], { queryParams: { redirect: this.router.url } }));
  }
}
