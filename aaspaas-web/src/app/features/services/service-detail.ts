import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Listing } from '../../core/models/api.models';
import { AddressService } from '../../core/services/address.service';
import { MarketplaceService } from '../../core/services/marketplace.service';
import { ToastService } from '../../core/services/toast.service';
import { InrPipe } from '../../shared/format';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, InrPipe],
  template: `
    <div class="container page">
      <a routerLink="/services" class="muted small">← Services</a>
      @if (loading()) {
        <div class="skeleton" style="height: 320px; margin-top: 16px"></div>
      } @else if (l(); as s) {
        <div class="split mt">
          <div class="stack">
            <span class="badge badge-purple" style="align-self: flex-start">{{ s.categoryName }}</span>
            <h1>{{ s.title }}</h1>
            <div class="muted">{{ s.providerName }} · 📍 {{ s.locality ? s.locality + ', ' : '' }}{{ s.city }}</div>
            <p style="white-space: pre-line">{{ s.description }}</p>
          </div>

          <aside class="card stack">
            <div><span class="price" style="font-size: 2rem">{{ s.basePrice | inr }}</span><span class="muted"> {{ s.pricingType === 'HOURLY' ? 'per ghanta' : 'fixed' }}</span></div>
            <h3 style="margin: 0">Booking request</h3>
            <div class="field"><label for="when">Kab chahiye?</label><input id="when" type="datetime-local" class="input" [(ngModel)]="when" name="when" [min]="minDate" /></div>
            @if (s.pricingType === 'HOURLY') {
              <div class="field"><label for="hrs">Kitne ghante (1-24)</label><input id="hrs" type="number" min="1" max="24" class="input" [(ngModel)]="hours" name="hrs" /></div>
            }
            <div class="field">
              <label for="addr">Address</label>
              @if (addresses.list().length) {
                <select class="select" style="margin-bottom: 8px" (change)="pickAddress($any($event.target).value)" aria-label="Saved address">
                  <option value="">Saved address chuniye</option>
                  @for (a of addresses.list(); track a.id) { <option [value]="a.id">{{ a.label }}: {{ addresses.format(a) }}</option> }
                </select>
              }
              <textarea id="addr" class="textarea" [(ngModel)]="address" name="addr" maxlength="500" placeholder="Poora address (kam se kam 10 akshar)"></textarea>
            </div>
            <div class="field"><label for="notes">Note (optional)</label><textarea id="notes" class="textarea" style="min-height: 64px" [(ngModel)]="notes" name="notes" maxlength="1000"></textarea></div>
            @if (estimate() > 0) {
              <div class="row-between"><span class="muted">Anumaanit total</span><strong>{{ estimate() | inr }}</strong></div>
            }
            <button type="button" class="btn btn-primary btn-lg btn-block" [disabled]="busy() || !valid()" (click)="book()">{{ busy() ? 'Bhej rahe hain...' : 'Booking request bhejein' }}</button>
            <p class="tiny muted">Provider accept karega tab booking confirm hogi.</p>
          </aside>
        </div>
      } @else {
        <div class="card center mt"><h3>Service nahi mili</h3></div>
      }
    </div>
  `,
})
export class ServiceDetailPage implements OnInit {
  readonly id = input.required<string>();
  private readonly market = inject(MarketplaceService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly addresses = inject(AddressService);

  readonly l = signal<Listing | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  when = '';
  hours = 1;
  address = '';
  notes = '';
  readonly minDate = new Date(Date.now() + 3600_000).toISOString().slice(0, 16);

  readonly estimate = computed(() => {
    const s = this.l();
    if (!s) return 0;
    return s.pricingType === 'HOURLY' ? Number(s.basePrice) * (Number(this.hours) || 1) : Number(s.basePrice);
  });

  ngOnInit(): void {
    this.addresses.reload();
    this.market.listing(Number(this.id())).subscribe({
      next: (s) => {
        this.l.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  pickAddress(id: string): void {
    const a = this.addresses.list().find((x) => x.id === Number(id));
    if (a) this.address = this.addresses.format(a);
  }

  valid(): boolean {
    return !!this.when && this.address.trim().length >= 10 && (this.l()?.pricingType !== 'HOURLY' || (this.hours >= 1 && this.hours <= 24));
  }

  book(): void {
    const s = this.l();
    if (!s) return;
    if (!this.auth.isLoggedIn()) {
      this.toast.info('Booking ke liye pehle login karein.');
      void this.router.navigate(['/login'], { queryParams: { redirect: this.router.url } });
      return;
    }
    this.busy.set(true);
    this.market
      .book({
        listingId: s.id,
        scheduledAt: new Date(this.when).toISOString(),
        addressText: this.address.trim(),
        notes: this.notes.trim() || undefined,
        estimatedHours: s.pricingType === 'HOURLY' ? Number(this.hours) : null,
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.toast.success('Booking request bhej di gayi!');
          void this.router.navigate(['/bookings']);
        },
        error: () => this.busy.set(false),
      });
  }
}
