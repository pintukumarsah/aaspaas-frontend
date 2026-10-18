import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Booking } from '../../core/models/api.models';
import { MarketplaceService } from '../../core/services/marketplace.service';
import { ToastService } from '../../core/services/toast.service';
import { HumanPipe, InrPipe, WhenPipe, badgeClass } from '../../shared/format';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [FormsModule, RouterLink, InrPipe, WhenPipe, HumanPipe],
  template: `
    <div class="container page">
      <div class="page-head"><div><h1>Meri bookings</h1><p>Aapki service requests aur unka status.</p></div><a routerLink="/services" class="btn btn-primary">Nayi service</a></div>
      @if (loading()) {
        <div class="stack">@for (n of [1, 2]; track n) { <div class="skeleton" style="height: 110px"></div> }</div>
      } @else if (!items().length) {
        <div class="card center" style="padding: 40px 20px"><h3>Abhi koi booking nahi</h3><a routerLink="/services" class="btn btn-outline mt">Services dekhein</a></div>
      } @else {
        <div class="stack">
          @for (b of items(); track b.id) {
            <div class="card">
              <div class="row-between">
                <div><strong>{{ b.listingTitle }}</strong><div class="muted small">#{{ b.bookingNumber }} · {{ b.providerName }}</div></div>
                <span class="badge" [class]="'badge ' + cls(b.status)">{{ b.status | human }}</span>
              </div>
              <div class="small mt">📅 {{ b.scheduledAt | when }} · 📍 {{ b.addressText }}</div>
              <div class="row-between mt">
                <span class="price">{{ b.totalAmount | inr }}</span>
                @if (b.status === 'REQUESTED' || b.status === 'ACCEPTED') {
                  <button type="button" class="btn btn-outline btn-sm" (click)="askCancel(b)">Cancel karein</button>
                }
              </div>
              @if (b.statusReason) { <div class="muted small mt">Wajah: {{ b.statusReason }}</div> }
            </div>
          }
        </div>
      }

      @if (target(); as t) {
        <div class="modal-backdrop" (click)="target.set(null)">
          <div class="modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
            <h3>Booking cancel karein</h3>
            <div class="field"><label for="why">Wajah</label><textarea id="why" class="textarea" [(ngModel)]="reason" name="why" maxlength="500"></textarea></div>
            <div class="row"><button type="button" class="btn btn-danger" [disabled]="!reason.trim() || busy()" (click)="cancel(t)">Cancel karein</button><button type="button" class="btn btn-ghost" (click)="target.set(null)">Wapas</button></div>
          </div>
        </div>
      }
    </div>
  `,
})
export class MyBookingsPage implements OnInit {
  private readonly market = inject(MarketplaceService);
  private readonly toast = inject(ToastService);
  readonly items = signal<Booking[]>([]);
  readonly loading = signal(true);
  readonly target = signal<Booking | null>(null);
  readonly busy = signal(false);
  reason = '';
  cls = badgeClass;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.market.myBookings().subscribe({
      next: (p) => {
        this.items.set(p.content ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  askCancel(b: Booking): void {
    this.reason = '';
    this.target.set(b);
  }

  cancel(b: Booking): void {
    this.busy.set(true);
    this.market.cancelBooking(b.id, this.reason.trim()).subscribe({
      next: () => {
        this.busy.set(false);
        this.target.set(null);
        this.toast.success('Booking cancel ho gayi');
        this.load();
      },
      error: () => this.busy.set(false),
    });
  }
}
