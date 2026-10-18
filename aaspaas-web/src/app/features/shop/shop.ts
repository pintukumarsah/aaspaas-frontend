import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Category, Product } from '../../core/models/api.models';
import { CatalogService } from '../../core/services/catalog.service';
import { ProductCard } from '../../shared/product-card';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [FormsModule, ProductCard],
  template: `
    <div class="container page">
      <div class="page-head">
        <div>
          <h1>Shop</h1>
          <p>Apne area ki dukaanon ka saaman, ek hi jagah.</p>
        </div>
        <form class="row" (ngSubmit)="applySearch()">
          <input class="input" style="min-width: 240px" name="q" [(ngModel)]="q" placeholder="Product ya dukaan search karein" aria-label="Search products" />
          <button class="btn btn-primary" type="submit">Search</button>
        </form>
      </div>

      <div class="row" style="margin-bottom: 22px; overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px">
        <button type="button" class="chip" [class.active]="!categoryId" (click)="pick(null)">Sab</button>
        @for (c of categories(); track c.id) {
          <button type="button" class="chip" [class.active]="categoryId === c.id" (click)="pick(c.id)">{{ c.name }}</button>
        }
      </div>

      @if (loading()) {
        <div class="grid-4">
          @for (n of [1, 2, 3, 4, 5, 6, 7, 8]; track n) {
            <div class="skeleton" style="height: 290px"></div>
          }
        </div>
      } @else if (error()) {
        <div class="alert alert-error">
          {{ error() }}
          <button type="button" class="btn btn-sm btn-outline" style="margin-left: 12px" (click)="load()">Dobara try karein</button>
        </div>
      } @else if (!products().length) {
        <div class="card center">
          <h3>Koi product nahi mila</h3>
          <p class="muted">Search ya category badal kar dekhein.</p>
        </div>
      } @else {
        <div class="grid-4">
          @for (p of products(); track p.id) {
            <app-product-card [product]="p" />
          }
        </div>
        @if (totalPages() > 1) {
          <div class="row" style="justify-content: center; margin-top: 28px">
            <button type="button" class="btn btn-outline btn-sm" [disabled]="page() === 0" (click)="go(page() - 1)">Peeche</button>
            <span class="muted small">Page {{ page() + 1 }} / {{ totalPages() }}</span>
            <button type="button" class="btn btn-outline btn-sm" [disabled]="page() + 1 >= totalPages()" (click)="go(page() + 1)">Aage</button>
          </div>
        }
      }
    </div>
  `,
})
export class ShopPage implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly categories = signal<Category[]>([]);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly page = signal(0);
  readonly totalPages = signal(1);

  q = '';
  categoryId: number | null = null;

  ngOnInit(): void {
    this.catalog.categories().subscribe((c) => this.categories.set(c));
    this.route.queryParamMap.subscribe((p) => {
      this.q = p.get('q') ?? '';
      this.categoryId = p.get('categoryId') ? Number(p.get('categoryId')) : null;
      this.page.set(0);
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.catalog.browse({ q: this.q, categoryId: this.categoryId, page: this.page(), size: 12 }).subscribe({
      next: (r) => {
        this.products.set(r.items);
        this.totalPages.set(r.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Products load nahi ho paaye. Backend mein GET /api/products hona chahiye (backend-patch dekhein).');
        this.loading.set(false);
      },
    });
  }

  applySearch(): void {
    void this.router.navigate([], { queryParams: { q: this.q.trim() || null, categoryId: this.categoryId }, queryParamsHandling: 'merge' });
  }

  pick(id: number | null): void {
    void this.router.navigate([], { queryParams: { categoryId: id }, queryParamsHandling: 'merge' });
  }

  go(p: number): void {
    this.page.set(p);
    this.load();
  }
}
