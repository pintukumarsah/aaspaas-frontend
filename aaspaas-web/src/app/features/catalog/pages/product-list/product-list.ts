
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ProductApiService } from '../../services/product-api.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productApi = inject(ProductApiService);

  products: Product[] = [];
  businessId: number | null = null;

  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const rawId = params.get('businessId');
      const parsedId = Number(rawId);

      if (!rawId || !Number.isSafeInteger(parsedId) || parsedId <= 0) {
        this.businessId = null;
        this.products = [];
        this.errorMessage = 'Invalid business ID in the URL.';
        return;
      }

      this.businessId = parsedId;
      this.loadProducts(parsedId);
    });
  }

  loadProducts(businessId: number): void {
    this.loading = true;
    this.errorMessage = '';
    this.products = [];

    this.productApi.getBusinessProducts(businessId).subscribe({
      next: (products) => {
        this.products = products.filter(
          (product) =>
            product.status === 'ACTIVE' && product.available
        );
        this.loading = false;
      },
      error: (error: unknown) => {
        console.error('Failed to load business products', error);
        this.errorMessage =
          'Products load nahi ho paaye. Please try again.';
        this.loading = false;
      },
    });
  }

  retry(): void {
    if (this.businessId !== null) {
      this.loadProducts(this.businessId);
    }
  }
}
