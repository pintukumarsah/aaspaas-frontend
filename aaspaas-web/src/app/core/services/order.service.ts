import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, asList } from '../http/api.service';
import { CancellationResult, Dispute, Order, Payment, PaymentMethod } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly api = inject(ApiService);

  /** Turns the server cart into an order. The backend REQUIRES an Idempotency-Key header. */
  create(deliveryAddressId: number, idempotencyKey: string): Observable<Order> {
    return this.api.post<Order>('/orders', { deliveryAddressId }, { headers: { 'Idempotency-Key': idempotencyKey } });
  }

  mine(): Observable<Order[]> {
    return this.api.get<Order[]>('/orders').pipe(
      map((list) => asList<Order>(list).sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))),
    );
  }

  get(id: number): Observable<Order> {
    return this.api.get<Order>(`/orders/${id}`);
  }

  cancel(id: number, reason: string): Observable<CancellationResult> {
    return this.api.post<CancellationResult>(`/orders/${id}/cancel`, { reason });
  }

  pay(orderId: number, paymentMethod: PaymentMethod, idempotencyKey: string): Observable<Payment> {
    return this.api.post<Payment>('/payments/create', { orderId, paymentMethod }, { headers: { 'Idempotency-Key': idempotencyKey } });
  }

  raiseDispute(orderId: number, body: { reasonCode: string; description: string; requestedRefundAmount?: number | null }): Observable<Dispute> {
    return this.api.post<Dispute>(`/orders/${orderId}/disputes`, body);
  }
}
