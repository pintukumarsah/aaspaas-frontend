import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Category, Listing } from '../../core/models/api.models';
import { CatalogService } from '../../core/services/catalog.service';
import { MarketplaceService } from '../../core/services/marketplace.service';
import { InrPipe } from '../../shared/format';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [FormsModule, RouterLink, InrPipe],
  template: `
    <div class="container page">
      <div class="page-head">
        <div><h1>Ghar ki services</h1><p>Plumber, electrician, cleaning aur bahut kuch, verified providers se.</p></div>
      </div>

      <form class="row" style="margin-bottom: 20px" (ngSubmit)="search(0)">
        <input class="input" style="flex: 2 1 220px" name="q" [(ngModel)]="q" placeholder="Kaunsi service chahiye?" aria-label="Search services" />
        <input class="input" style="flex: 1 1 140px" name="city" [(ngModel)]="city" placeholder="Sheher" aria-label="City" />
        <select class="select" style="flex: 1 1 160px" name="cat" [(ngModel)]="categoryId" aria-label="Category">
          <option [ngValue]="null">Saari categories</option>
          @for (c of categories(); track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
        </select>
        <button class="btn btn-primary" type="submit">Dhoondhein</button>
      </form>

      @if (loading()) {
        <div class="grid-3">@for (n of [1, 2, 3]; track n) { <div class="skeleton" style="height: 200px"></div> }</div>
      } @else if (!items().length) {
        <div class="card center"><h3>Abhi koi service nahi mili</h3><p class="muted">Filter badal kar dekhein.</p></div>
      } @else {
        <div class="grid-3">
          @for (l of items(); track l.id) {
            <a [routerLink]="['/services', l.id]" class="card card-hover stack-sm">
              <span class="badge badge-purple" style="align-self: flex-start">{{ l.categoryName }}</span>
              <h3 style="margin: 0">{{ l.title }}</h3>
              <p class="muted small clamp">{{ l.description }}</p>
              <div class="muted small">📍 {{ l.locality ? l.locality + ', ' : '' }}{{ l.city }}</div>
              <div class="row-between">
                <span class="muted small">{{ l.providerName }}</span>
                <span class="price">{{ l.basePrice | inr }}<span class="muted tiny"> {{ l.pricingType === 'HOURLY' ? '/ ghanta' : 'fixed' }}</span></span>
              </div>
            </a>
          }
        </div>
        @if (totalPages() > 1) {
          <div class="row" style="justify-content: center; margin-top: 24px">
            <button type="button" class="btn btn-outline btn-sm" [disabled]="page() === 0" (click)="search(page() - 1)">Peeche</button>
            <span class="muted small">Page {{ page() + 1 }} / {{ totalPages() }}</span>
            <button type="button" class="btn btn-outline btn-sm" [disabled]="page() + 1 >= totalPages()" (click)="search(page() + 1)">Aage</button>
          </div>
        }
      }
    </div>
  `,
  styles: `
    .clamp {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `,
})
export class ServicesPage implements OnInit {
  private readonly market = inject(MarketplaceService);
  private readonly catalog = inject(CatalogService);

  readonly items = signal<Listing[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly page = signal(0);
  readonly totalPages = signal(1);
  q = '';
  city = '';
  categoryId: number | null = null;

  ngOnInit(): void {
    this.catalog.categories().subscribe((c) => this.categories.set(c.filter((x) => !x.type || x.type.toUpperCase().includes('SERVICE') || true)));
    this.search(0);
  }

  search(page: number): void {
    this.loading.set(true);
    this.page.set(page);
    this.market.search({ q: this.q.trim() || undefined, city: this.city.trim() || undefined, categoryId: this.categoryId, page }).subscribe({
      next: (r) => {
        this.items.set(r.content ?? []);
        this.totalPages.set(Math.max(1, r.totalPages ?? 1));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
