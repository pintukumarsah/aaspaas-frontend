import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AdminUser, BankAccount, Business, Dispute, Listing, PartnerProfile, Withdrawal } from '../../core/models/api.models';
import { AdminService } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';
import { HumanPipe, InrPipe, WhenPipe, badgeClass } from '../../shared/format';

type Tab = 'overview' | 'businesses' | 'partners' | 'services' | 'users' | 'disputes' | 'banks' | 'withdrawals';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'businesses', label: 'Dukaanein' },
  { id: 'partners', label: 'Delivery partners' },
  { id: 'services', label: 'Services' },
  { id: 'users', label: 'Users' },
  { id: 'disputes', label: 'Disputes' },
  { id: 'banks', label: 'Bank accounts' },
  { id: 'withdrawals', label: 'Withdrawals' },
];

interface Pending {
  title: string;
  placeholder: string;
  needsAmount?: boolean;
  run: (text: string, amount: number | null) => Observable<unknown>;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, InrPipe, WhenPipe, HumanPipe],
  template: `
    <div class="container page">
      <div class="page-head"><div><h1>Admin panel</h1><p>Approvals, users, disputes aur payouts, sab yahin se.</p></div></div>

      <div class="row tabs" role="tablist">
        @for (t of tabs; track t.id) {
          <button type="button" role="tab" class="chip" [class.active]="tab() === t.id" [attr.aria-selected]="tab() === t.id" (click)="select(t.id)">{{ t.label }}</button>
        }
      </div>

      @if (tab() !== 'overview' && tab() !== 'users') {
        <div class="row" style="margin-bottom: 14px">
          <label class="label" for="st">Status filter</label>
          <input id="st" class="input" style="max-width: 220px" [(ngModel)]="status" name="st" placeholder="jaise PENDING" (keyup.enter)="load()" />
          <button type="button" class="btn btn-outline btn-sm" (click)="load()">Lagayein</button>
        </div>
      }

      @if (loading()) { <div class="skeleton" style="height: 200px"></div> }

      @switch (tab()) {
        @case ('overview') {
          @if (!loading()) {
            <div class="grid-3">
              @for (k of reportKeys(); track k) {
                <div class="stat"><div class="num">{{ fmt(report()[k]) }}</div><div class="lbl">{{ k | human }}</div></div>
              } @empty { <div class="card">Report mein abhi data nahi hai.</div> }
            </div>
          }
        }

        @case ('businesses') {
          @if (!loading()) {
            <div class="table-wrap"><table class="table"><thead><tr><th>Dukaan</th><th>Type</th><th>Status</th><th></th></tr></thead><tbody>
              @for (b of businesses(); track b.id) {
                <tr><td><strong>{{ b.name }}</strong><div class="tiny muted">ID {{ b.id }} · owner {{ b.ownerId }}</div></td><td>{{ b.businessType | human }}</td>
                  <td><span class="badge" [class]="'badge ' + cls(b.status)">{{ b.status | human }}</span></td>
                  <td class="right">
                    <button type="button" class="btn btn-success btn-sm" (click)="go(admin.businessAction(b.id, 'approve'))">Approve</button>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="go(admin.businessAction(b.id, 'reject'))">Reject</button>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="go(admin.businessAction(b.id, 'suspend'))">Suspend</button>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="go(admin.businessAction(b.id, 'reactivate'))">Reactivate</button>
                  </td></tr>
              } @empty { <tr><td colspan="4" class="center muted" style="padding: 24px">Kuch nahi mila</td></tr> }
            </tbody></table></div>
          }
        }

        @case ('partners') {
          @if (!loading()) {
            <div class="table-wrap"><table class="table"><thead><tr><th>Partner</th><th>Gaadi</th><th>Verification</th><th>Availability</th><th></th></tr></thead><tbody>
              @for (p of partners(); track p.id) {
                <tr><td><strong>#{{ p.id }}</strong><div class="tiny muted">user {{ p.userId }}</div></td><td>{{ p.vehicleType | human }} {{ p.vehicleNumber }}</td>
                  <td><span class="badge" [class]="'badge ' + cls(p.verificationStatus)">{{ p.verificationStatus | human }}</span></td><td>{{ p.availabilityStatus | human }}</td>
                  <td class="right">
                    <button type="button" class="btn btn-success btn-sm" (click)="go(admin.partnerAction(p.id, 'approve'))">Approve</button>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="go(admin.partnerAction(p.id, 'reject'))">Reject</button>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="go(admin.partnerAction(p.id, 'suspend'))">Suspend</button>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="go(admin.partnerAction(p.id, 'reactivate'))">Reactivate</button>
                  </td></tr>
              } @empty { <tr><td colspan="5" class="center muted" style="padding: 24px">Kuch nahi mila</td></tr> }
            </tbody></table></div>
          }
        }

        @case ('services') {
          @if (!loading()) {
            <div class="table-wrap"><table class="table"><thead><tr><th>Service</th><th>Provider</th><th>Price</th><th>Status</th><th></th></tr></thead><tbody>
              @for (l of services(); track l.id) {
                <tr><td><strong>{{ l.title }}</strong><div class="tiny muted">{{ l.categoryName }} · {{ l.city }}</div></td><td>{{ l.providerName }}</td><td>{{ l.basePrice | inr }}</td>
                  <td><span class="badge" [class]="'badge ' + cls(l.status)">{{ l.status | human }}</span></td>
                  <td class="right">
                    <button type="button" class="btn btn-success btn-sm" (click)="go(admin.serviceAction(l.id, 'approve'))">Approve</button>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="go(admin.serviceAction(l.id, 'suspend'))">Suspend</button>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="go(admin.serviceAction(l.id, 'reactivate'))">Reactivate</button>
                  </td></tr>
              } @empty { <tr><td colspan="5" class="center muted" style="padding: 24px">Kuch nahi mila</td></tr> }
            </tbody></table></div>
          }
        }

        @case ('users') {
          <form class="row" style="margin-bottom: 14px" (ngSubmit)="load()">
            <input class="input" style="max-width: 260px" name="s" [(ngModel)]="search" placeholder="Naam, phone ya email" aria-label="Search users" />
            <select class="select" style="max-width: 190px" name="r" [(ngModel)]="role" aria-label="Role">
              <option value="">Saare roles</option><option value="CUSTOMER">Customer</option><option value="SELLER">Seller</option><option value="DELIVERY_PARTNER">Delivery partner</option><option value="SERVICE_PROVIDER">Service provider</option><option value="ADMIN">Admin</option>
            </select>
            <select class="select" style="max-width: 160px" name="u" [(ngModel)]="status" aria-label="Status"><option value="">Saare status</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option></select>
            <button class="btn btn-primary" type="submit">Dhoondhein</button>
          </form>
          @if (!loading()) {
            <div class="table-wrap"><table class="table"><thead><tr><th>User</th><th>Roles</th><th>Status</th><th></th></tr></thead><tbody>
              @for (u of users(); track u.id) {
                <tr><td><strong>{{ u.fullName }}</strong><div class="tiny muted">{{ u.phone }}@if (u.email) { · {{ u.email }} }</div></td>
                  <td>@for (r of u.roles; track r) { <span class="badge badge-purple" style="margin-right: 4px">{{ r | human }}</span> }</td>
                  <td><span class="badge" [class]="'badge ' + cls(u.status)">{{ u.status | human }}</span></td>
                  <td class="right">
                    @if (u.status === 'ACTIVE') { <button type="button" class="btn btn-ghost btn-sm" (click)="askUser(u, 'suspend')">Suspend</button> }
                    @else { <button type="button" class="btn btn-ghost btn-sm" (click)="askUser(u, 'reactivate')">Reactivate</button> }
                  </td></tr>
              } @empty { <tr><td colspan="4" class="center muted" style="padding: 24px">Kuch nahi mila</td></tr> }
            </tbody></table></div>
          }
        }

        @case ('disputes') {
          @if (!loading()) {
            <div class="stack">
              @for (d of disputes(); track d.id) {
                <div class="card">
                  <div class="row-between"><div><strong>Dispute #{{ d.id }} · Order {{ d.orderNumber }}</strong><div class="muted small">{{ d.reasonCode | human }} · {{ d.createdAt | when }}</div></div><span class="badge" [class]="'badge ' + cls(d.status)">{{ d.status | human }}</span></div>
                  <p class="mt">{{ d.description }}</p>
                  <div class="muted small">Refund maanga: {{ d.requestedRefundAmount | inr }}@if (d.approvedRefundAmount) { · Approved: {{ d.approvedRefundAmount | inr }} }</div>
                  @if (d.resolutionNotes) { <div class="small mt">Faisla: {{ d.resolutionNotes }}</div> }
                  <div class="row mt">
                    <button type="button" class="btn btn-outline btn-sm" (click)="go(admin.reviewDispute(d.id))">Review shuru karein</button>
                    <button type="button" class="btn btn-success btn-sm" (click)="askDispute(d, 'resolve')">Resolve</button>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="askDispute(d, 'reject')">Reject</button>
                    <button type="button" class="btn btn-primary btn-sm" (click)="go(admin.executeRefund(d.id))">Refund bhejein</button>
                  </div>
                </div>
              } @empty { <div class="card center muted">Koi dispute nahi</div> }
            </div>
          }
        }

        @case ('banks') {
          @if (!loading()) {
            <div class="table-wrap"><table class="table"><thead><tr><th>Account</th><th>Bank</th><th>Status</th><th></th></tr></thead><tbody>
              @for (b of banks(); track b.id) {
                <tr><td><strong>{{ b.accountHolderName }}</strong><div class="tiny muted">{{ b.maskedAccountNumber }} · partner {{ b.partnerId }}</div></td><td>{{ b.bankName }} · {{ b.ifscCode }}</td>
                  <td><span class="badge" [class]="'badge ' + cls(b.verificationStatus)">{{ b.verificationStatus | human }}</span></td>
                  <td class="right"><button type="button" class="btn btn-success btn-sm" (click)="go(admin.bankAction(b.id, 'verify'))">Verify</button> <button type="button" class="btn btn-ghost btn-sm" (click)="go(admin.bankAction(b.id, 'reject'))">Reject</button></td></tr>
              } @empty { <tr><td colspan="4" class="center muted" style="padding: 24px">Kuch nahi mila</td></tr> }
            </tbody></table></div>
          }
        }

        @case ('withdrawals') {
          @if (!loading()) {
            <div class="table-wrap"><table class="table"><thead><tr><th>Kab</th><th>Partner</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>
              @for (w of withdrawals(); track w.id) {
                <tr><td>{{ w.createdAt | when }}</td><td>#{{ w.partnerId }} · {{ w.maskedAccountNumber }}</td><td>{{ w.amount | inr }}</td>
                  <td><span class="badge" [class]="'badge ' + cls(w.status)">{{ w.status | human }}</span>@if (w.failureReason) { <div class="tiny muted">{{ w.failureReason }}</div> }</td>
                  <td class="right">
                    <button type="button" class="btn btn-success btn-sm" (click)="go(admin.withdrawalAction(w.id, 'approve'))">Approve</button>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="go(admin.withdrawalAction(w.id, 'retry'))">Retry</button>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="askWithdrawal(w, 'reject')">Reject</button>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="askWithdrawal(w, 'cancel')">Cancel</button>
                  </td></tr>
              } @empty { <tr><td colspan="5" class="center muted" style="padding: 24px">Kuch nahi mila</td></tr> }
            </tbody></table></div>
          }
        }
      }

      @if (pending(); as p) {
        <div class="modal-backdrop" (click)="pending.set(null)">
          <div class="modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
            <h3>{{ p.title }}</h3>
            <div class="field"><textarea class="textarea" name="why" [(ngModel)]="text" [placeholder]="p.placeholder" maxlength="2000" aria-label="Detail"></textarea></div>
            @if (p.needsAmount) { <div class="field"><label for="am">Approved refund (₹)</label><input id="am" type="number" min="0" class="input" name="am" [(ngModel)]="amount" /></div> }
            <div class="row"><button type="button" class="btn btn-primary" [disabled]="text.trim().length < 3" (click)="confirm(p)">Confirm</button><button type="button" class="btn btn-ghost" (click)="pending.set(null)">Wapas</button></div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .tabs {
      overflow-x: auto;
      flex-wrap: nowrap;
      margin-bottom: 18px;
      padding-bottom: 4px;
    }
    .tabs .chip {
      flex: none;
    }
  `,
})
export class AdminPage implements OnInit {
  readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  readonly tabs = TABS;
  readonly tab = signal<Tab>('overview');
  readonly loading = signal(false);
  readonly report = signal<Record<string, unknown>>({});
  readonly businesses = signal<Business[]>([]);
  readonly partners = signal<PartnerProfile[]>([]);
  readonly services = signal<Listing[]>([]);
  readonly users = signal<AdminUser[]>([]);
  readonly disputes = signal<Dispute[]>([]);
  readonly banks = signal<BankAccount[]>([]);
  readonly withdrawals = signal<Withdrawal[]>([]);
  readonly pending = signal<Pending | null>(null);
  status = '';
  search = '';
  role = '';
  text = '';
  amount: number | null = null;
  cls = badgeClass;

  ngOnInit(): void {
    this.load();
  }

  select(t: Tab): void {
    this.tab.set(t);
    this.status = '';
    this.load();
  }

  reportKeys(): string[] {
    return Object.keys(this.report()).filter((k) => ['number', 'string'].includes(typeof this.report()[k]));
  }

  fmt(v: unknown): string {
    if (typeof v === 'number') return Number.isInteger(v) ? v.toLocaleString('en-IN') : v.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    return String(v ?? '');
  }

  load(): void {
    const s = this.status.trim().toUpperCase() || undefined;
    this.loading.set(true);
    const done = () => this.loading.set(false);
    switch (this.tab()) {
      case 'overview': this.admin.report('overview').subscribe({ next: (r) => { this.report.set(r ?? {}); done(); }, error: done }); break;
      case 'businesses': this.admin.businesses(s).subscribe({ next: (p) => { this.businesses.set(p.content ?? []); done(); }, error: done }); break;
      case 'partners': this.admin.partners(s).subscribe({ next: (p) => { this.partners.set(p.content ?? []); done(); }, error: done }); break;
      case 'services': this.admin.services(s).subscribe({ next: (p) => { this.services.set(p.content ?? []); done(); }, error: done }); break;
      case 'users': this.admin.users({ search: this.search.trim() || undefined, status: s, role: this.role || undefined }).subscribe({ next: (p) => { this.users.set(p.content ?? []); done(); }, error: done }); break;
      case 'disputes': this.admin.disputes(s).subscribe({ next: (p) => { this.disputes.set(p.content ?? []); done(); }, error: done }); break;
      case 'banks': this.admin.bankAccounts(s).subscribe({ next: (p) => { this.banks.set(p.content ?? []); done(); }, error: done }); break;
      case 'withdrawals': this.admin.withdrawals(s).subscribe({ next: (p) => { this.withdrawals.set(p.content ?? []); done(); }, error: done }); break;
    }
  }

  /** Runs an admin action then reloads the current list. */
  go(call: Observable<unknown>): void {
    call.subscribe(() => {
      this.toast.success('Ho gaya');
      this.load();
    });
  }

  askUser(u: AdminUser, kind: 'suspend' | 'reactivate'): void {
    this.ask({ title: `${u.fullName} ko ${kind === 'suspend' ? 'suspend' : 'reactivate'} karein`, placeholder: 'Wajah (kam se kam 5 akshar)', run: (t) => this.admin.userAction(u.id, kind, t) });
  }

  askDispute(d: Dispute, kind: 'resolve' | 'reject'): void {
    if (kind === 'resolve') {
      this.ask({
        title: 'Dispute resolve karein',
        placeholder: 'Faisle ka note (10+ akshar)',
        needsAmount: true,
        run: (t, a) => this.admin.resolveDispute(d.id, { resolutionCode: 'REFUND_APPROVED', resolutionNotes: t, approvedRefundAmount: a }),
      });
    } else {
      this.ask({ title: 'Dispute reject karein', placeholder: 'Wajah', run: (t) => this.admin.rejectDispute(d.id, t) });
    }
  }

  askWithdrawal(w: Withdrawal, kind: 'reject' | 'cancel'): void {
    this.ask({ title: `Withdrawal ${kind === 'reject' ? 'reject' : 'cancel'} karein`, placeholder: 'Wajah', run: (t) => this.admin.withdrawalReason(w.id, kind, t) });
  }

  ask(p: Pending): void {
    this.text = '';
    this.amount = null;
    this.pending.set(p);
  }

  confirm(p: Pending): void {
    p.run(this.text.trim(), this.amount).subscribe(() => {
      this.pending.set(null);
      this.toast.success('Ho gaya');
      this.load();
    });
  }
}
