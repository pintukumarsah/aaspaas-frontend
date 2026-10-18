import { Component, OnDestroy, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, interval, startWith, switchMap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { newIdempotencyKey } from '../../core/http/api.service';
import {
  DeliveryAssignment,
  DeliveryQuote,
  DeliveryRequest,
  Order,
  PaymentMethod,
  StatusHistory,
  TrackingPoint,
} from '../../core/models/api.models';
import { AddressService } from '../../core/services/address.service';
import { DeliveryService } from '../../core/services/delivery.service';
import { OrderService } from '../../core/services/order.service';
import { SellerService } from '../../core/services/seller.service';
import { SocialService } from '../../core/services/social.service';
import { ToastService } from '../../core/services/toast.service';
import { HumanPipe, InrPipe, WhenPipe, badgeClass } from '../../shared/format';

interface DeliveryLink {
  requestId: number;
  assignmentId?: number;
}

const FINAL_ASSIGNMENT = ['DELIVERED', 'CANCELLED', 'REJECTED', 'FAILED'];

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, InrPipe, WhenPipe, HumanPipe],
  templateUrl: './order-detail.html',
})
export class OrderDetailPage implements OnInit, OnDestroy {
  readonly id = input.required<string>();

  private readonly orders = inject(OrderService);
  private readonly delivery = inject(DeliveryService);
  private readonly addresses = inject(AddressService);
  private readonly seller = inject(SellerService);
  private readonly social = inject(SocialService);
  private readonly toast = inject(ToastService);

  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly cls = badgeClass;

  /* payment */
  readonly payMethod = signal<PaymentMethod>('COD');
  readonly paying = signal(false);

  /* modals */
  readonly modal = signal<'cancel' | 'dispute' | 'rate' | null>(null);
  reason = '';
  disputeCode = 'ITEM_ISSUE';
  disputeText = '';
  refundAmount: number | null = null;
  stars = 5;
  review = '';
  readonly busy = signal(false);

  /* delivery */
  readonly link = signal<DeliveryLink | null>(null);
  readonly request = signal<DeliveryRequest | null>(null);
  readonly quotes = signal<DeliveryQuote[]>([]);
  readonly assignment = signal<DeliveryAssignment | null>(null);
  readonly history = signal<StatusHistory[]>([]);
  readonly position = signal<TrackingPoint | null>(null);
  maxBudget = 50;
  note = '';
  readonly creating = signal(false);
  private poll?: Subscription;

  readonly canPay = computed(() => {
    const o = this.order();
    return !!o && o.orderStatus !== 'CANCELLED' && ['PENDING', 'FAILED', 'INITIATED'].includes(o.paymentStatus);
  });
  readonly canCancel = computed(() => {
    const o = this.order();
    return !!o && !['CANCELLED', 'DELIVERED', 'COMPLETED'].includes(o.orderStatus);
  });
  readonly delivered = computed(() => this.order()?.orderStatus === 'DELIVERED' || this.assignment()?.status === 'DELIVERED');
  readonly trackingActive = computed(() => {
    const a = this.assignment();
    return !!a && !FINAL_ASSIGNMENT.includes(a.status);
  });
  readonly mapLink = computed(() => {
    const p = this.position();
    return p ? `https://www.google.com/maps?q=${p.latitude},${p.longitude}` : '';
  });

  ngOnInit(): void {
    this.refresh();
  }

  ngOnDestroy(): void {
    this.poll?.unsubscribe();
  }

  private storageKey(): string {
    return `aaspaas.delivery.order.${this.id()}`;
  }

  private saveLink(l: DeliveryLink): void {
    this.link.set(l);
    try {
      localStorage.setItem(this.storageKey(), JSON.stringify(l));
    } catch {
      /* ignore */
    }
  }

  refresh(): void {
    this.orders.get(Number(this.id())).subscribe({
      next: (o) => {
        this.order.set(o);
        this.loading.set(false);
        this.loadDelivery();
      },
      error: () => this.loading.set(false),
    });
  }

  /* ----------------------------------------------------------- payment */

  pay(): void {
    const o = this.order();
    if (!o) return;
    this.paying.set(true);
    this.orders.pay(o.id, this.payMethod(), newIdempotencyKey()).subscribe({
      next: () => {
        this.paying.set(false);
        this.toast.success('Payment shuru ho gayi');
        this.refresh();
      },
      error: () => this.paying.set(false),
    });
  }

  /* ----------------------------------------------------- cancel / dispute / rate */

  open(m: 'cancel' | 'dispute' | 'rate'): void {
    this.reason = '';
    this.disputeText = '';
    this.refundAmount = this.order()?.totalAmount ?? null;
    this.modal.set(m);
  }

  closeModal(): void {
    this.modal.set(null);
  }

  doCancel(): void {
    const o = this.order();
    if (!o || this.reason.trim().length < 3) return;
    this.busy.set(true);
    this.orders.cancel(o.id, this.reason.trim()).subscribe({
      next: (r) => {
        this.busy.set(false);
        this.closeModal();
        this.toast.success(r.refundCreated ? 'Order cancel ho gaya. Refund shuru ho gaya.' : 'Order cancel ho gaya.');
        this.refresh();
      },
      error: () => this.busy.set(false),
    });
  }

  doDispute(): void {
    const o = this.order();
    if (!o || this.disputeText.trim().length < 10) return;
    this.busy.set(true);
    this.orders
      .raiseDispute(o.id, { reasonCode: this.disputeCode, description: this.disputeText.trim(), requestedRefundAmount: this.refundAmount && this.refundAmount > 0 ? this.refundAmount : null })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.closeModal();
          this.toast.success('Shikayat darj ho gayi. Team jaldi dekhegi.');
        },
        error: () => this.busy.set(false),
      });
  }

  doRate(): void {
    const o = this.order();
    if (!o) return;
    this.busy.set(true);
    this.social.rate({ targetType: 'BUSINESS', businessId: o.businessId, orderId: o.id, rating: this.stars, review: this.review.trim() || undefined }).subscribe({
      next: () => {
        this.busy.set(false);
        this.closeModal();
        this.toast.success('Rating dene ke liye shukriya!');
      },
      error: () => this.busy.set(false),
    });
  }

  /* ---------------------------------------------------------- delivery */

  private loadDelivery(): void {
    let stored: DeliveryLink | null = null;
    try {
      const raw = localStorage.getItem(this.storageKey());
      stored = raw ? (JSON.parse(raw) as DeliveryLink) : null;
    } catch {
      stored = null;
    }
    if (stored) {
      this.link.set(stored);
      this.loadRequest(stored);
      return;
    }
    // Look up an existing delivery request for this order (e.g. created on another device).
    this.delivery.myRequests().subscribe({
      next: (list) => {
        const found = list.find((r) => r.orderId === Number(this.id()) && r.status !== 'CANCELLED');
        if (found) {
          this.saveLink({ requestId: found.id });
          this.loadRequest({ requestId: found.id });
        }
      },
      error: () => undefined,
    });
  }

  private loadRequest(l: DeliveryLink): void {
    this.delivery.request(l.requestId).subscribe({
      next: (r) => {
        this.request.set(r);
        if (l.assignmentId) this.startTracking(l.assignmentId);
        else this.loadQuotes();
      },
      error: () => undefined,
    });
  }

  arrangeDelivery(): void {
    const o = this.order();
    if (!o) return;
    const drop = this.addresses.list().find((a) => a.id === o.deliveryAddressId) ?? this.addresses.default();
    this.creating.set(true);
    this.seller.business(o.businessId).subscribe({
      next: (b) => this.createRequest(o, b.addressId ?? o.deliveryAddressId, b.latitude ?? null, b.longitude ?? null, drop?.latitude ?? null, drop?.longitude ?? null),
      error: () => this.createRequest(o, o.deliveryAddressId, null, null, drop?.latitude ?? null, drop?.longitude ?? null),
    });
  }

  private createRequest(o: Order, pickupAddressId: number, pLat: number | null, pLng: number | null, dLat: number | null, dLng: number | null): void {
    this.delivery
      .createRequest({
        orderId: o.id,
        pickupAddressId,
        deliveryAddressId: o.deliveryAddressId,
        maxBudget: Number(this.maxBudget) || 0,
        deliveryMode: 'DIRECT',
        pickupLatitude: pLat,
        pickupLongitude: pLng,
        deliveryLatitude: dLat,
        deliveryLongitude: dLng,
        customerNote: this.note.trim() || undefined,
      })
      .subscribe({
        next: (r) => {
          this.creating.set(false);
          this.request.set(r);
          this.saveLink({ requestId: r.id });
          this.toast.success('Delivery request bhej di gayi. Partners ke quotes aayenge.');
          this.loadQuotes();
        },
        error: () => this.creating.set(false),
      });
  }

  loadQuotes(): void {
    const l = this.link();
    if (!l) return;
    this.delivery.quotes(l.requestId).subscribe({ next: (q) => this.quotes.set(q.filter((x) => x.status === 'PENDING')), error: () => undefined });
  }

  selectQuote(q: DeliveryQuote): void {
    this.busy.set(true);
    this.delivery.selectQuote(q.id).subscribe({
      next: (res) => {
        this.busy.set(false);
        const l = this.link();
        if (l) this.saveLink({ ...l, assignmentId: res.assignmentId });
        this.toast.success('Delivery partner chun liya gaya!');
        this.startTracking(res.assignmentId);
      },
      error: () => this.busy.set(false),
    });
  }

  cancelRequest(): void {
    const l = this.link();
    if (!l || !confirm('Delivery request cancel karein?')) return;
    this.delivery.cancelRequest(l.requestId).subscribe(() => {
      try {
        localStorage.removeItem(this.storageKey());
      } catch {
        /* ignore */
      }
      this.link.set(null);
      this.request.set(null);
      this.quotes.set([]);
      this.toast.info('Delivery request cancel ho gayi');
    });
  }

  private startTracking(assignmentId: number): void {
    this.poll?.unsubscribe();
    this.poll = interval(environment.trackingPollMs)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.delivery.assignment(assignmentId).pipe(
            catchError(() => of(null)),
          ),
        ),
      )
      .subscribe((a) => {
        if (!a) return;
        this.assignment.set(a);
        this.delivery.statusHistory(assignmentId).subscribe((h) => this.history.set(h));
        if (!FINAL_ASSIGNMENT.includes(a.status)) {
          this.delivery.latestLocation(assignmentId).subscribe({ next: (p) => this.position.set(p), error: () => undefined });
        } else {
          this.poll?.unsubscribe();
          this.refresh();
        }
      });
  }
}
