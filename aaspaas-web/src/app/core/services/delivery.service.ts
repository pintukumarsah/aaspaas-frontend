import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, asList } from '../http/api.service';
import {
  DeliveryAssignment,
  DeliveryPrice,
  DeliveryQuote,
  DeliveryQuoteSelection,
  DeliveryRequest,
  DeliveryRequestPayload,
  OtpResult,
  PartnerProfile,
  PartnerRoutePayload,
  StatusHistory,
  TrackingPoint,
} from '../models/api.models';

/** Customer-side and partner-side delivery APIs (/api/delivery/**). */
@Injectable({ providedIn: 'root' })
export class DeliveryService {
  private readonly api = inject(ApiService);

  /* ------------------------------------------------------------ customer */

  createRequest(body: DeliveryRequestPayload): Observable<DeliveryRequest> {
    return this.api.post<DeliveryRequest>('/delivery/requests', body);
  }

  myRequests(): Observable<DeliveryRequest[]> {
    return this.api.get<DeliveryRequest[]>('/delivery/requests').pipe(map((l) => asList<DeliveryRequest>(l)));
  }

  request(id: number): Observable<DeliveryRequest> {
    return this.api.get<DeliveryRequest>(`/delivery/requests/${id}`);
  }

  cancelRequest(id: number): Observable<void> {
    return this.api.delete<void>(`/delivery/requests/${id}`);
  }

  quotes(requestId: number): Observable<DeliveryQuote[]> {
    return this.api.get<DeliveryQuote[]>(`/delivery/quotes/request/${requestId}`).pipe(map((l) => asList<DeliveryQuote>(l)));
  }

  selectQuote(quoteId: number): Observable<DeliveryQuoteSelection> {
    return this.api.post<DeliveryQuoteSelection>(`/delivery/quotes/${quoteId}/select`);
  }

  price(params: { pickupLatitude: number; pickupLongitude: number; deliveryLatitude: number; deliveryLongitude: number }): Observable<DeliveryPrice> {
    return this.api.get<DeliveryPrice>('/delivery/pricing/calculate', { params, silent: true });
  }

  assignment(id: number): Observable<DeliveryAssignment> {
    return this.api.get<DeliveryAssignment>(`/delivery/assignments/${id}`);
  }

  latestLocation(assignmentId: number, silent = true): Observable<TrackingPoint> {
    return this.api.get<TrackingPoint>(`/delivery/assignments/${assignmentId}/tracking/latest`, { silent });
  }

  trackingHistory(assignmentId: number): Observable<TrackingPoint[]> {
    return this.api.get<TrackingPoint[]>(`/delivery/assignments/${assignmentId}/tracking`, { silent: true }).pipe(map((l) => asList<TrackingPoint>(l)));
  }

  statusHistory(assignmentId: number): Observable<StatusHistory[]> {
    return this.api.get<StatusHistory[]>(`/delivery/assignments/${assignmentId}/history`, { silent: true }).pipe(map((l) => asList<StatusHistory>(l)));
  }

  /* ------------------------------------------------------------- partner */

  register(body: { vehicleType: string; vehicleNumber: string }): Observable<PartnerProfile> {
    return this.api.post<PartnerProfile>('/delivery/partners/register', body);
  }

  profile(silent = false): Observable<PartnerProfile> {
    return this.api.get<PartnerProfile>('/delivery/partners/me', { silent });
  }

  setAvailability(status: string): Observable<PartnerProfile> {
    return this.api.put<PartnerProfile>('/delivery/partners/availability', {}, { params: { status } });
  }

  updateRoute(body: PartnerRoutePayload): Observable<string> {
    return this.api.put<string>('/delivery/partners/route', body);
  }

  myAssignment(): Observable<DeliveryAssignment | null> {
    return this.api.get<DeliveryAssignment | null>('/delivery/assignments/my', { silent: true });
  }

  accept(id: number): Observable<DeliveryAssignment> {
    return this.api.post<DeliveryAssignment>(`/delivery/assignments/${id}/accept`);
  }

  reject(id: number, reason: string): Observable<DeliveryAssignment> {
    return this.api.post<DeliveryAssignment>(`/delivery/assignments/${id}/reject`, { reason });
  }

  cancelAssignment(id: number): Observable<DeliveryAssignment> {
    return this.api.post<DeliveryAssignment>(`/delivery/assignments/${id}/cancel`);
  }

  pickupOtp(id: number): Observable<OtpResult> {
    return this.api.post<OtpResult>(`/delivery/assignments/${id}/pickup-otp`);
  }

  verifyPickup(id: number, otp: string): Observable<DeliveryAssignment> {
    return this.api.post<DeliveryAssignment>(`/delivery/assignments/${id}/pickup-otp/verify`, { otp });
  }

  startDelivery(id: number): Observable<DeliveryAssignment> {
    return this.api.post<DeliveryAssignment>(`/delivery/assignments/${id}/out-for-delivery`);
  }

  deliveryOtp(id: number): Observable<OtpResult> {
    return this.api.post<OtpResult>(`/delivery/assignments/${id}/delivery-otp`);
  }

  verifyDelivery(id: number, otp: string): Observable<DeliveryAssignment> {
    return this.api.post<DeliveryAssignment>(`/delivery/assignments/${id}/delivery-otp/verify`, { otp });
  }

  pushLocation(id: number, latitude: number, longitude: number, accuracyMeters?: number): Observable<TrackingPoint> {
    return this.api.post<TrackingPoint>(`/delivery/assignments/${id}/live-location`, { latitude, longitude, accuracyMeters }, { silent: true });
  }
}
