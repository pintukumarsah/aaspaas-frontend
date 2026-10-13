import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from './product.service';
import { Product } from '../../core/models/models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="padding: 24px;">
      <h2>Product Catalog & Management</h2>

      <div style="margin-bottom: 24px; border: 1px solid #ccc; padding: 16px; border-radius: 8px;">
        <h3>Add New Product</h3>
        <input [(ngModel)]="newProduct.title" placeholder="Title" style="margin-right: 8px;" />
        <input [(ngModel)]="newProduct.price" type="number" placeholder="Price" style="margin-right: 8px;" />
        <input [(ngModel)]="newProduct.stockQuantity" type="number" placeholder="Stock" style="margin-right: 8px;" />
        <button (click)="addProduct()" style="cursor: pointer;">Save Product</button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px;">
        <div *ngFor="let p of products" style="border: 1px solid #ddd; padding: 16px; border-radius: 8px;">
          <h4>{{ p.title }}</h4>
          <p>₹ {{ p.price }}</p>
          <p>Available: {{ p.stockQuantity }}</p>
        </div>
      </div>
    </div>
  `
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  products: Product[] = [];

  newProduct: Product = {
    title: '',
    description: 'Fresh inventory',
    price: 0,
    stockQuantity: 10,
    businessId: 1,
    categoryId: 1
  };

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getAll().subscribe({
      next: (res) => (this.products = res.data || []),
      error: (err) => console.error('Fetch error:', err)
    });
  }

  addProduct(): void {
    this.productService.create(this.newProduct).subscribe({
      next: () => {
        this.loadProducts();
        this.newProduct.title = '';
        this.newProduct.price = 0;
      },
      error: (err) => console.error('Product save failed:', err)
    });
  }
}