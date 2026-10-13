import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div style="padding: 24px;">
      <h2>My Cart</h2>
      <p>Cart me items add karne ke liye products catalog browse karein.</p>
      <a routerLink="/order" style="padding: 8px 16px; background: #28a745; color: white; text-decoration: none; border-radius: 4px;">Proceed to Checkout</a>
    </div>
  `
})
export class CartComponent {}