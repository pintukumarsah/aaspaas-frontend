import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Category, Product } from '../../core/models/api.models';
import { CatalogService } from '../../core/services/catalog.service';
import { ProductCard } from '../../shared/product-card';
import { FormsModule } from '@angular/forms';

const ICON_TONES: { bg: string; fg: string }[] = [
  { bg: '#e8f4e5', fg: '#2e7d32' },
  { bg: '#fde7ea', fg: '#c62839' },
  { bg: '#fff1cc', fg: '#b07000' },
  { bg: '#e3eefb', fg: '#1f5fb4' },
  { bg: '#ede7fa', fg: '#5b3db0' },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ProductCard, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);

  readonly categories = signal<Category[]>([]);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  search = '';

  ngOnInit(): void {
    this.catalog.rootCategories().subscribe((c) => this.categories.set(c.slice(0, 8)));
    this.catalog.browse({ size: 8 }).subscribe({
      next: (r) => {
        this.products.set(r.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  tone(i: number) {
    return ICON_TONES[i % ICON_TONES.length];
  }

  go(): void {
    void this.router.navigate(['/shop'], { queryParams: { q: this.search.trim() || null } });
  }
}
