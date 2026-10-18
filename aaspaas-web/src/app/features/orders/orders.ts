import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Order } from '../../core/models/api.models';
import { OrderService } from '../../core/services/order.service';
import { HumanPipe, InrPipe, WhenPipe, badgeClass } from '../../shared/format';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [RouterLink, InrPipe, WhenPipe, HumanPipe],
  template: `
    <div class="container page">
      <div class="page-head"><div><h1>Meri orders</h1><p>Saari purani aur chal rahi orders.</p></div></div>
      @if (loading()) {
        <div class="stack">@for (n of [1, 2, 3]; track n) { <div class="skeleton" style="height: 96px"></div> }</div>
      } @else if (!orders().length) {
        <div class="card center" style="padding: 48px 20px">
          <div style="font-size: 3rem">📦</div>
          <h3>Abhi koi order nahi</h3>
          <a routerLink="/shop" class="btn btn-primary btn-lg mt">Pehla order karein</a>
        </div>
      } @else {
        <div class="stack">
          @for (o of orders(); track o.id) {
            <a [routerLink]="['/orders', o.id]" class="card card-hover row-between">
              <div>
                <div class="strong">{{ o.businessName }}</div>
                <div class="muted small">#{{ o.orderNumber }} · {{ o.createdAt | when }}</div>
                <div class="small" style="margin-top: 4px">{{ o.items.length }} item{{ o.items.length === 1 ? '' : 's' }}</div>
              </div>
              <div class="right">
                <div class="price" style="font-size: 1.2rem">{{ o.totalAmount | inr }}</div>
                <span class="badge" [class]="'badge ' + cls(o.orderStatus)">{{ o.orderStatus | human }}</span>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class OrdersPage implements OnInit {
  private readonly svc = inject(OrderService);
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  cls = badgeClass;

  ngOnInit(): void {
    this.svc.mine().subscribe({
      next: (o) => {
        this.orders.set(o);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
