import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, interval } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { newIdempotencyKey } from '../../core/http/api.service';
import { BankAccount, DeliveryAssignment, OtpResult, PartnerProfile, WalletSummary, Withdrawal } from '../../core/models/api.models';
import { DeliveryService } from '../../core/services/delivery.service';
import { ToastService } from '../../core/services/toast.service';
import { WalletService } from '../../core/services/wallet.service';
import { HumanPipe, InrPipe, WhenPipe, badgeClass } from '../../shared/format';

const LIVE = ['ACCEPTED', 'PICKUP_OTP_SENT', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERY_OTP_SENT'];

@Component({
  selector: 'app-partner',
  standalone: true,
  imports: [FormsModule, InrPipe, WhenPipe, HumanPipe],
  template: `
    <div class="container page">
      <div class="page-head"><div><h1>Delivery partner</h1><p>Delivery lijiye, kamayiye, aur paise seedha bank mein mangwaiye.</p></div></div>

      @if (loading()) {
        <div class="skeleton" style="height: 220px"></div>
      } @else if (!profile()) {
        <section class="card" style="max-width: 560px; margin: 0 auto">
          <div class="center" style="font-size: 3rem">🛵</div>
          <h2 class="center">Delivery partner banein</h2>
          <p class="muted center" style="margin: 8px 0 18px">Apni gaadi ki jaankari dein. Admin approve karega, phir aap delivery le sakte hain.</p>
          <div class="field"><label for="vt">Gaadi ka type</label>
            <select id="vt" class="select" name="vt" [(ngModel)]="vehicleType">
              <option value="BIKE">Bike</option><option value="SCOOTER">Scooter</option><option value="CYCLE">Cycle</option><option value="CAR">Car</option><option value="ON_FOOT">Paidal</option>
            </select></div>
          <div class="field"><label for="vn">Gaadi number</label><input id="vn" class="input" name="vn" [(ngModel)]="vehicleNumber" placeholder="UP32 AB 1234" /></div>
          <button type="button" class="btn btn-primary btn-lg btn-block" [disabled]="busy() || !vehicleNumber.trim()" (click)="register()">{{ busy() ? 'Ho raha hai...' : 'Register karein' }}</button>
        </section>
      } @else if (profile(); as p) {
        <section class="card">
          <div class="row-between">
            <div>
              <h3 style="margin: 0">Mera profile</h3>
              <div class="muted small">{{ p.vehicleType | human }} · {{ p.vehicleNumber }} · ⭐ {{ p.rating ?? '—' }} · {{ p.totalDeliveries ?? 0 }} deliveries</div>
            </div>
            <span class="badge" [class]="'badge ' + cls(p.verificationStatus)">{{ p.verificationStatus | human }}</span>
          </div>

          @if (p.verificationStatus !== 'APPROVED') {
            <div class="alert mt">Aapka account abhi {{ p.verificationStatus | human }} hai. Admin approve karega tab aap delivery le paayenge.</div>
          } @else {
            <div class="row mt">
              <span class="label">Status:</span>
              @for (s of statuses; track s.value) {
                <button type="button" class="chip" [class.active]="p.availabilityStatus === s.value" [disabled]="!!assignment() && s.value === 'OFFLINE'" (click)="setStatus(s.value)">{{ s.label }}</button>
              }
            </div>
          }
        </section>

        @if (p.verificationStatus === 'APPROVED') {
          <section class="card mt">
            <h3>Meri route (optional)</h3>
            <p class="muted small">Agar aap kahin ja rahe hain to destination batayein. Aapke raaste ke orders aapko pehle milenge.</p>
            <div class="form-grid mt">
              <div class="field"><label for="dn">Kahan ja rahe hain?</label><input id="dn" class="input" name="dn" [(ngModel)]="dest.name" placeholder="Jaise: Gomti Nagar" /></div>
              <div class="field"><label for="dla">Destination latitude</label><input id="dla" type="number" step="any" class="input" name="dla" [(ngModel)]="dest.lat" /></div>
              <div class="field"><label for="dlo">Destination longitude</label><input id="dlo" type="number" step="any" class="input" name="dlo" [(ngModel)]="dest.lng" /></div>
            </div>
            <button type="button" class="btn btn-outline" [disabled]="busy() || !dest.name.trim() || dest.lat === null || dest.lng === null" (click)="saveRoute()">Route save karein</button>
          </section>

          <section class="card mt">
            <div class="row-between"><h3 style="margin: 0">Meri delivery</h3><button type="button" class="btn btn-ghost btn-sm" (click)="loadAssignment()">Refresh</button></div>
            @if (assignment(); as a) {
              <div class="row-between mt">
                <div><div class="strong">Assignment #{{ a.id }} · Request #{{ a.deliveryRequestId }}</div><div class="muted small">Aapki kamayi: {{ (a.partnerEarning ?? a.agreedDeliveryFee ?? 0) | inr }}@if (a.assignedAt) { · {{ a.assignedAt | when }} }</div></div>
                <span class="badge" [class]="'badge ' + cls(a.status)">{{ a.status | human }}</span>
              </div>

              @if (otp(); as o) {
                <div class="alert alert-info mt">
                  {{ o.type | human }} OTP bhej diya gaya{{ o.expiresAt ? ' (' + (o.expiresAt | when) + ' tak)' : '' }}.
                  @if (o.developmentOtp) { <strong>Dev OTP: {{ o.developmentOtp }}</strong> }
                </div>
              }

              <div class="stack-sm mt">
                @switch (a.status) {
                  @case ('ASSIGNED') {
                    <div class="row">
                      <button type="button" class="btn btn-success" [disabled]="busy()" (click)="act('accept')">Delivery accept karein</button>
                      <input class="input" style="max-width: 240px" name="rr" [(ngModel)]="rejectReason" placeholder="Reject ki wajah" />
                      <button type="button" class="btn btn-outline" [disabled]="busy() || rejectReason.trim().length < 3" (click)="act('reject')">Reject</button>
                    </div>
                  }
                  @case ('ACCEPTED') {
                    <button type="button" class="btn btn-primary" [disabled]="busy()" (click)="act('pickupOtp')">Dukaan se saaman lene ka OTP banayein</button>
                  }
                  @case ('PICKUP_OTP_SENT') {
                    <div class="row"><input class="input" style="max-width: 200px" name="po" [(ngModel)]="code" inputmode="numeric" maxlength="8" placeholder="Pickup OTP" /><button type="button" class="btn btn-primary" [disabled]="busy() || !code.trim()" (click)="act('verifyPickup')">Pickup verify karein</button></div>
                  }
                  @case ('PICKED_UP') {
                    <button type="button" class="btn btn-primary" [disabled]="busy()" (click)="act('start')">Delivery ke liye nikla</button>
                  }
                  @case ('OUT_FOR_DELIVERY') {
                    <button type="button" class="btn btn-primary" [disabled]="busy()" (click)="act('deliveryOtp')">Customer ko delivery OTP bhejein</button>
                  }
                  @case ('DELIVERY_OTP_SENT') {
                    <div class="row"><input class="input" style="max-width: 200px" name="do" [(ngModel)]="code" inputmode="numeric" maxlength="8" placeholder="Customer ka OTP" /><button type="button" class="btn btn-success" [disabled]="busy() || !code.trim()" (click)="act('verifyDelivery')">Delivery poori karein</button></div>
                  }
                  @case ('DELIVERED') { <div class="alert alert-success">Delivery poori ho gayi. Kamayi aapke wallet mein jud gayi.</div> }
                }
                @if (live()) {
                  <button type="button" class="btn btn-ghost btn-sm" style="align-self: flex-start" [disabled]="busy()" (click)="act('cancel')">Delivery cancel karein</button>
                  <div class="tiny muted">📡 Live location har {{ pushSec }} second mein customer ko bheji ja rahi hai{{ lastPush() ? ' (last: ' + lastPush() + ')' : '' }}.</div>
                }
              </div>
            } @else {
              <p class="muted mt">Abhi koi delivery assign nahi hai. Status "Available" rakhein, nayi delivery aate hi yahan dikhegi.</p>
            }
          </section>
        }

        <section class="card mt">
          <h3>Wallet</h3>
          @if (wallet(); as w) {
            <div class="grid-3">
              <div class="stat"><div class="num">{{ w.availableBalance | inr }}</div><div class="lbl">Nikalne layak</div></div>
              <div class="stat"><div class="num">{{ w.inProcessAmount | inr }}</div><div class="lbl">Process mein</div></div>
              <div class="stat"><div class="num">{{ w.totalPaid | inr }}</div><div class="lbl">Ab tak mile</div></div>
            </div>
            <p class="tiny muted mt">Minimum withdrawal {{ w.minimumWithdrawalAmount | inr }}</p>
          } @else if (walletError()) {
            <div class="alert">{{ walletError() }}</div>
          }

          <h3 class="mt">Bank accounts</h3>
          <div class="stack-sm">
            @for (b of accounts(); track b.id) {
              <div class="card-flat row-between">
                <div><strong>{{ b.accountHolderName }}</strong><div class="muted small">{{ b.bankName }} · {{ b.maskedAccountNumber }} · {{ b.ifscCode }}</div></div>
                <div class="row">
                  <span class="badge" [class]="'badge ' + cls(b.verificationStatus)">{{ b.verificationStatus | human }}</span>
                  @if (b.verificationStatus === 'VERIFIED') { <button type="button" class="btn btn-primary btn-sm" [disabled]="busy()" (click)="withdraw(b)">Paise nikalein</button> }
                  <button type="button" class="btn btn-ghost btn-sm" (click)="removeAccount(b)">Hatayein</button>
                </div>
              </div>
            } @empty { <p class="muted small">Abhi koi bank account nahi.</p> }
          </div>
          <button type="button" class="btn btn-outline btn-sm mt" (click)="showBank.set(!showBank())">{{ showBank() ? 'Band karein' : '+ Bank account jodein' }}</button>
          @if (showBank()) {
            <form class="mt" (ngSubmit)="addAccount()" #bf="ngForm">
              <div class="form-grid">
                <div class="field"><label for="bh">Account holder</label><input id="bh" class="input" name="bh" [(ngModel)]="bank.accountHolderName" required /></div>
                <div class="field"><label for="ba">Account number (9-18 digit)</label><input id="ba" class="input" name="ba" [(ngModel)]="bank.accountNumber" required pattern="[0-9]{9,18}" /></div>
                <div class="field"><label for="bi">IFSC</label><input id="bi" class="input" name="bi" [(ngModel)]="bank.ifscCode" required pattern="[A-Za-z]{4}0[A-Za-z0-9]{6}" /></div>
                <div class="field"><label for="bk">Bank ka naam</label><input id="bk" class="input" name="bk" [(ngModel)]="bank.bankName" /></div>
              </div>
              <button class="btn btn-primary" type="submit" [disabled]="busy() || bf.invalid">Account jodein</button>
              <p class="tiny muted mt">Admin verify karega, uske baad hi paise nikal paayenge.</p>
            </form>
          }

          @if (withdrawals().length) {
            <h3 class="mt">Withdrawals</h3>
            <div class="table-wrap"><table class="table"><thead><tr><th>Kab</th><th>Amount</th><th>Account</th><th>Status</th></tr></thead><tbody>
              @for (w of withdrawals(); track w.id) {
                <tr><td>{{ w.createdAt | when }}</td><td>{{ w.amount | inr }}</td><td>{{ w.maskedAccountNumber }}</td><td><span class="badge" [class]="'badge ' + cls(w.status)">{{ w.status | human }}</span>@if (w.failureReason) { <div class="tiny muted">{{ w.failureReason }}</div> }</td></tr>
              }
            </tbody></table></div>
          }
        </section>
      }
    </div>
  `,
})
export class PartnerPage implements OnInit, OnDestroy {
  private readonly delivery = inject(DeliveryService);
  private readonly walletSvc = inject(WalletService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly statuses = [
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'ONLINE', label: 'Online' },
    { value: 'BUSY', label: 'Busy' },
    { value: 'OFFLINE', label: 'Offline' },
  ];
  readonly profile = signal<PartnerProfile | null>(null);
  readonly assignment = signal<DeliveryAssignment | null>(null);
  readonly otp = signal<OtpResult | null>(null);
  readonly wallet = signal<WalletSummary | null>(null);
  readonly accounts = signal<BankAccount[]>([]);
  readonly withdrawals = signal<Withdrawal[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly showBank = signal(false);
  readonly walletError = signal('');
  readonly lastPush = signal('');
  readonly live = computed(() => !!this.assignment() && LIVE.includes(this.assignment()!.status));
  readonly pushSec = Math.round(environment.locationPushMs / 1000);
  cls = badgeClass;

  vehicleType = 'BIKE';
  vehicleNumber = '';
  rejectReason = '';
  code = '';
  dest: { name: string; lat: number | null; lng: number | null } = { name: '', lat: null, lng: null };
  bank = { accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '' };

  private pushSub?: Subscription;
  private pollSub?: Subscription;

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.pushSub?.unsubscribe();
    this.pollSub?.unsubscribe();
  }

  loadProfile(): void {
    this.delivery.profile(true).subscribe({
      next: (p) => {
        this.profile.set(p);
        this.loading.set(false);
        this.afterProfile(p);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        if (!(e instanceof HttpErrorResponse) || e.status >= 500) this.toast.error('Profile load nahi ho paaya.');
      },
    });
  }

  private afterProfile(p: PartnerProfile): void {
    this.loadWallet();
    if (p.verificationStatus === 'APPROVED') {
      this.loadAssignment();
      this.pollSub?.unsubscribe();
      this.pollSub = interval(15000).subscribe(() => this.loadAssignment(true));
    }
  }

  register(): void {
    this.busy.set(true);
    this.delivery.register({ vehicleType: this.vehicleType, vehicleNumber: this.vehicleNumber.trim() }).subscribe({
      next: (p) => {
        this.profile.set(p);
        this.toast.success('Register ho gaye! Admin ke approval ka intezaar karein.');
        // Wallet endpoints need the DELIVERY_PARTNER role (backend patch). Best effort.
        this.auth.becomeRole('DELIVERY_PARTNER').subscribe({ next: () => { this.busy.set(false); this.loadWallet(); }, error: () => this.busy.set(false) });
      },
      error: () => this.busy.set(false),
    });
  }

  setStatus(status: string): void {
    this.delivery.setAvailability(status).subscribe((p) => {
      this.profile.set(p);
      this.toast.success(`Status: ${status.toLowerCase()}`);
    });
  }

  saveRoute(): void {
    if (this.dest.lat === null || this.dest.lng === null) return;
    const finish = (lat: number, lng: number) =>
      this.delivery
        .updateRoute({ currentLatitude: lat, currentLongitude: lng, destinationLatitude: Number(this.dest.lat), destinationLongitude: Number(this.dest.lng), destinationName: this.dest.name.trim(), routeAvailable: true })
        .subscribe({
          next: () => { this.busy.set(false); this.toast.success('Route save ho gayi'); },
          error: () => this.busy.set(false),
        });
    this.busy.set(true);
    if (!navigator.geolocation) {
      this.busy.set(false);
      this.toast.error('Browser location support nahi karta.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => finish(pos.coords.latitude, pos.coords.longitude),
      () => { this.busy.set(false); this.toast.error('Aapki current location chahiye. Browser mein permission dein.'); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  /* ------------------------------------------------------------ assignment */

  loadAssignment(silent = false): void {
    this.delivery.myAssignment().subscribe({
      next: (a) => {
        this.assignment.set(a && a.id ? a : null);
        this.syncLocationPush();
      },
      error: () => {
        this.assignment.set(null);
        this.syncLocationPush();
        if (!silent) this.toast.info('Abhi koi delivery nahi hai.');
      },
    });
  }

  act(kind: 'accept' | 'reject' | 'pickupOtp' | 'verifyPickup' | 'start' | 'deliveryOtp' | 'verifyDelivery' | 'cancel'): void {
    const a = this.assignment();
    if (!a) return;
    this.busy.set(true);
    const done = (res?: DeliveryAssignment | OtpResult, otp?: OtpResult) => {
      this.busy.set(false);
      this.code = '';
      if (otp) this.otp.set(otp);
      else if (kind !== 'pickupOtp' && kind !== 'deliveryOtp') this.otp.set(null);
      if (res && 'status' in res) this.assignment.set(res as DeliveryAssignment);
      this.loadAssignment(true);
      if (kind === 'verifyDelivery') {
        this.toast.success('Delivery poori! Kamayi wallet mein jud gayi.');
        this.loadWallet();
      }
    };
    const fail = () => this.busy.set(false);

    switch (kind) {
      case 'accept': this.delivery.accept(a.id).subscribe({ next: (r) => done(r), error: fail }); break;
      case 'reject': this.delivery.reject(a.id, this.rejectReason.trim()).subscribe({ next: (r) => { done(r); this.assignment.set(null); }, error: fail }); break;
      case 'pickupOtp': this.delivery.pickupOtp(a.id).subscribe({ next: (o) => done(undefined, o), error: fail }); break;
      case 'verifyPickup': this.delivery.verifyPickup(a.id, this.code.trim()).subscribe({ next: (r) => done(r), error: fail }); break;
      case 'start': this.delivery.startDelivery(a.id).subscribe({ next: (r) => done(r), error: fail }); break;
      case 'deliveryOtp': this.delivery.deliveryOtp(a.id).subscribe({ next: (o) => done(undefined, o), error: fail }); break;
      case 'verifyDelivery': this.delivery.verifyDelivery(a.id, this.code.trim()).subscribe({ next: (r) => done(r), error: fail }); break;
      case 'cancel':
        if (!confirm('Delivery cancel karein?')) { this.busy.set(false); return; }
        this.delivery.cancelAssignment(a.id).subscribe({ next: (r) => { done(r); this.assignment.set(null); }, error: fail });
        break;
    }
  }

  /** While a delivery is live, push this device's GPS position so the customer can follow along. */
  private syncLocationPush(): void {
    const needs = this.live();
    if (!needs) {
      this.pushSub?.unsubscribe();
      this.pushSub = undefined;
      return;
    }
    if (this.pushSub) return;
    const push = () => {
      const a = this.assignment();
      if (!a || !navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          this.delivery.pushLocation(a.id, pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy).subscribe({
            next: () => this.lastPush.set(new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })),
            error: () => undefined,
          }),
        () => undefined,
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 },
      );
    };
    push();
    this.pushSub = interval(environment.locationPushMs).subscribe(push);
  }

  /* ---------------------------------------------------------------- wallet */

  loadWallet(): void {
    this.walletSvc.summary().subscribe({
      next: (w) => { this.wallet.set(w); this.walletError.set(''); },
      error: () => this.walletError.set('Wallet abhi available nahi (DELIVERY_PARTNER role chahiye).'),
    });
    this.walletSvc.accounts().subscribe({ next: (a) => this.accounts.set(a), error: () => undefined });
    this.walletSvc.withdrawals().subscribe({ next: (p) => this.withdrawals.set(p.content ?? []), error: () => undefined });
  }

  addAccount(): void {
    this.busy.set(true);
    this.walletSvc.addAccount({ ...this.bank, ifscCode: this.bank.ifscCode.toUpperCase(), bankName: this.bank.bankName || undefined }).subscribe({
      next: () => {
        this.busy.set(false);
        this.showBank.set(false);
        this.bank = { accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '' };
        this.toast.success('Bank account jud gaya. Verification ka intezaar karein.');
        this.loadWallet();
      },
      error: () => this.busy.set(false),
    });
  }

  removeAccount(b: BankAccount): void {
    if (!confirm('Is bank account ko hata dein?')) return;
    this.walletSvc.removeAccount(b.id).subscribe(() => this.loadWallet());
  }

  withdraw(b: BankAccount): void {
    this.busy.set(true);
    this.walletSvc.withdraw(b.id, newIdempotencyKey()).subscribe({
      next: () => {
        this.busy.set(false);
        this.toast.success('Withdrawal request bhej di gayi.');
        this.loadWallet();
      },
      error: () => this.busy.set(false),
    });
  }
}
