import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div style="padding: 24px;">
      <h2>Orders & Checkout</h2>
      <p>Aapke orders yahan list honge.</p>
      <a routerLink="/delivery" style="padding: 8px 16px; background: #ffc107; color: #212529; text-decoration: none; border-radius: 4px;">Track Delivery</a>
    </div>
  `
})
export class OrderComponent {}