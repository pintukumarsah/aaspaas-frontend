import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/http/api.service';
import { Booking, Category, Listing, PricingType } from '../../core/models/api.models';
import { CatalogService } from '../../core/services/catalog.service';
import { MarketplaceService } from '../../core/services/marketplace.service';
import { ToastService } from '../../core/services/toast.service';
import { HumanPipe, InrPipe, WhenPipe, badgeClass } from '../../shared/format';

interface ListingForm {
  id: number | null;
  categoryId: number | null;
  title: string;
  description: string;
  pricingType: PricingType;
  basePrice: number | null;
  city: string;
  locality: string;
}

@Component({
  selector: 'app-provider',
  standalone: true,
  imports: [FormsModule, InrPipe, WhenPipe, HumanPipe],
  template: `
    <div class="container page">
      <div class="page-head"><div><h1>Meri services</h1><p>Apni services list karein aur bookings sambhalein.</p></div></div>

      @if (!isProvider()) {
        <section class="card center" style="padding: 44px 20px; max-width: 620px; margin: 0 auto">
          <div style="font-size: 3rem">🛠️</div>
          <h2>Service provider banein</h2>
          <p class="muted" style="margin: 10px 0 20px">Plumber, electrician, cleaning ya koi bhi skill. Apni service list karein, bookings payein.</p>
          @if (roleError()) { <div class="alert alert-error" style="margin-bottom: 14px">{{ roleError() }}</div> }
          <button type="button" class="btn btn-primary btn-lg" [disabled]="busy()" (click)="become()">{{ busy() ? 'Ho raha hai...' : 'Provider banein' }}</button>
        </section>
      } @else {
        <section class="card">
          <div class="row-between">
            <h3 style="margin: 0">Meri listings</h3>
            <button type="button" class="btn btn-primary btn-sm" (click)="newListing()">+ Nayi service</button>
          </div>

          @if (form(); as f) {
            <form class="mt" (ngSubmit)="saveListing()" #lf="ngForm">
              <div class="form-grid">
                <div class="field"><label for="lc">Category</label>
                  <select id="lc" class="select" name="lc" [(ngModel)]="f.categoryId" required>
                    <option [ngValue]="null" disabled>Chuniye</option>
                    @for (c of categories(); track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
                  </select></div>
                <div class="field"><label for="lt">Title (5+ akshar)</label><input id="lt" class="input" name="lt" [(ngModel)]="f.title" required minlength="5" maxlength="150" /></div>
                <div class="field"><label for="lp">Pricing</label>
                  <select id="lp" class="select" name="lp" [(ngModel)]="f.pricingType"><option value="FIXED">Fixed price</option><option value="HOURLY">Per ghanta</option></select></div>
                <div class="field"><label for="lb">Price (₹)</label><input id="lb" type="number" min="1" class="input" name="lb" [(ngModel)]="f.basePrice" required /></div>
                <div class="field"><label for="ly">Sheher</label><input id="ly" class="input" name="ly" [(ngModel)]="f.city" required maxlength="100" /></div>
                <div class="field"><label for="ll">Area / mohalla</label><input id="ll" class="input" name="ll" [(ngModel)]="f.locality" maxlength="150" /></div>
              </div>
              <div class="field"><label for="ld">Description (20+ akshar)</label><textarea id="ld" class="textarea" name="ld" [(ngModel)]="f.description" required minlength="20" maxlength="4000"></textarea></div>
              <div class="row"><button class="btn btn-primary" type="submit" [disabled]="busy() || lf.invalid">Save karein</button><button type="button" class="btn btn-ghost" (click)="form.set(null)">Cancel</button></div>
              <p class="tiny muted mt">Nayi ya badli hui service admin ke approval ke baad hi sabko dikhegi.</p>
            </form>
          }

          <div class="stack-sm mt">
            @for (l of listings(); track l.id) {
              <div class="card-flat row-between">
                <div><strong>{{ l.title }}</strong><div class="muted small">{{ l.categoryName }} · {{ l.city }} · {{ l.basePrice | inr }} {{ l.pricingType === 'HOURLY' ? '/ ghanta' : '' }}</div></div>
                <div class="row">
                  <span class="badge" [class]="'badge ' + cls(l.status)">{{ l.status | human }}</span>
                  <button type="button" class="btn btn-ghost btn-sm" (click)="edit(l)">Edit</button>
                  @if (l.status === 'ACTIVE') { <button type="button" class="btn btn-ghost btn-sm" (click)="toggle(l, 'pause')">Pause</button> }
                  @if (l.status === 'PAUSED') { <button type="button" class="btn btn-ghost btn-sm" (click)="toggle(l, 'resume')">Resume</button> }
                </div>
              </div>
            } @empty { <p class="muted">Abhi koi service list nahi hai.</p> }
          </div>
        </section>

        <section class="card mt">
          <div class="row-between"><h3 style="margin: 0">Bookings</h3>
            <select class="select" style="max-width: 200px" [ngModel]="filter()" (ngModelChange)="filter.set($event); loadBookings()" name="flt" aria-label="Status filter">
              <option value="">Saari</option><option value="REQUESTED">Nayi requests</option><option value="ACCEPTED">Accepted</option><option value="IN_PROGRESS">Chal rahi</option><option value="COMPLETED">Poori</option>
            </select></div>
          <div class="stack-sm mt">
            @for (b of bookings(); track b.id) {
              <div class="card-flat">
                <div class="row-between">
                  <div><strong>{{ b.listingTitle }}</strong><div class="muted small">#{{ b.bookingNumber }} · {{ b.customerName }}</div></div>
                  <span class="badge" [class]="'badge ' + cls(b.status)">{{ b.status | human }}</span>
                </div>
                <div class="small mt">📅 {{ b.scheduledAt | when }} · 📍 {{ b.addressText }}</div>
                @if (b.notes) { <div class="muted small">📝 {{ b.notes }}</div> }
                <div class="row-between mt">
                  <span>Aapki kamayi: <strong class="price">{{ (b.providerEarning ?? b.totalAmount) | inr }}</strong></span>
                  <div class="row">
                    @if (b.status === 'REQUESTED') {
                      <button type="button" class="btn btn-success btn-sm" (click)="action(b, 'accept')">Accept</button>
                      <button type="button" class="btn btn-outline btn-sm" (click)="askReason(b, 'reject')">Reject</button>
                    }
                    @if (b.status === 'ACCEPTED') {
                      <button type="button" class="btn btn-primary btn-sm" (click)="action(b, 'start')">Kaam shuru</button>
                      <button type="button" class="btn btn-outline btn-sm" (click)="askReason(b, 'cancel')">Cancel</button>
                    }
                    @if (b.status === 'IN_PROGRESS') { <button type="button" class="btn btn-success btn-sm" (click)="action(b, 'complete')">Kaam poora</button> }
                  </div>
                </div>
              </div>
            } @empty { <p class="muted">Koi booking nahi.</p> }
          </div>
        </section>

        @if (reasonFor(); as r) {
          <div class="modal-backdrop" (click)="reasonFor.set(null)">
            <div class="modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
              <h3>{{ r.kind === 'reject' ? 'Booking reject karein' : 'Booking cancel karein' }}</h3>
              <div class="field"><label for="rs">Wajah</label><textarea id="rs" class="textarea" name="rs" [(ngModel)]="reason" maxlength="500"></textarea></div>
              <div class="row"><button type="button" class="btn btn-danger" [disabled]="!reason.trim() || busy()" (click)="sendReason(r.b, r.kind)">Confirm</button><button type="button" class="btn btn-ghost" (click)="reasonFor.set(null)">Wapas</button></div>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class ProviderPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly market = inject(MarketplaceService);
  private readonly catalog = inject(CatalogService);
  private readonly toast = inject(ToastService);

  readonly isProvider = computed(() => this.auth.hasAnyRole('SERVICE_PROVIDER', 'ADMIN'));
  readonly listings = signal<Listing[]>([]);
  readonly bookings = signal<Booking[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly form = signal<ListingForm | null>(null);
  readonly filter = signal('');
  readonly busy = signal(false);
  readonly roleError = signal('');
  readonly reasonFor = signal<{ b: Booking; kind: 'reject' | 'cancel' } | null>(null);
  reason = '';
  cls = badgeClass;

  ngOnInit(): void {
    this.catalog.categories().subscribe((c) => this.categories.set(c));
    if (this.isProvider()) this.load();
  }

  load(): void {
    this.market.myListings().subscribe((p) => this.listings.set(p.content ?? []));
    this.loadBookings();
  }

  loadBookings(): void {
    this.market.providerBookings(this.filter() || undefined).subscribe((p) => this.bookings.set(p.content ?? []));
  }

  become(): void {
    this.busy.set(true);
    this.roleError.set('');
    this.auth.becomeRole('SERVICE_PROVIDER').subscribe({
      next: () => {
        this.busy.set(false);
        if (this.isProvider()) { this.toast.success('Ab aap service provider hain!'); this.load(); }
        else this.roleError.set('Role nahi mila. Backend mein RoleSelfServiceController (backend-patch) jodein.');
      },
      error: (e) => {
        this.busy.set(false);
        this.roleError.set(errorMessage(e, 'Role nahi mil paaya.') + ' (backend-patch/RoleSelfServiceController.java apply karein)');
      },
    });
  }

  newListing(): void {
    this.form.set({ id: null, categoryId: null, title: '', description: '', pricingType: 'FIXED', basePrice: null, city: '', locality: '' });
  }

  edit(l: Listing): void {
    this.form.set({ id: l.id, categoryId: l.categoryId, title: l.title, description: l.description, pricingType: l.pricingType, basePrice: l.basePrice, city: l.city, locality: l.locality ?? '' });
  }

  saveListing(): void {
    const f = this.form();
    if (!f || f.categoryId === null || f.basePrice === null) return;
    const body = { categoryId: f.categoryId, title: f.title.trim(), description: f.description.trim(), pricingType: f.pricingType, basePrice: Number(f.basePrice), city: f.city.trim(), locality: f.locality.trim() || undefined };
    this.busy.set(true);
    (f.id ? this.market.updateListing(f.id, body) : this.market.createListing(body)).subscribe({
      next: () => { this.busy.set(false); this.form.set(null); this.toast.success('Service save ho gayi'); this.load(); },
      error: () => this.busy.set(false),
    });
  }

  toggle(l: Listing, what: 'pause' | 'resume'): void {
    (what === 'pause' ? this.market.pauseListing(l.id) : this.market.resumeListing(l.id)).subscribe(() => this.load());
  }

  action(b: Booking, a: 'accept' | 'start' | 'complete'): void {
    this.market.bookingAction(b.id, a).subscribe(() => { this.toast.success('Booking update ho gayi'); this.loadBookings(); });
  }

  askReason(b: Booking, kind: 'reject' | 'cancel'): void {
    this.reason = '';
    this.reasonFor.set({ b, kind });
  }

  sendReason(b: Booking, kind: 'reject' | 'cancel'): void {
    this.busy.set(true);
    this.market.bookingReason(b.id, kind, this.reason.trim()).subscribe({
      next: () => { this.busy.set(false); this.reasonFor.set(null); this.loadBookings(); },
      error: () => this.busy.set(false),
    });
  }
}
