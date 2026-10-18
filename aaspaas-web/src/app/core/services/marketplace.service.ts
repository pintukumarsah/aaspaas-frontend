import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import { Booking, BookingPayload, Listing, ListingPayload, Page } from '../models/api.models';

/** Home services marketplace: public browse, customer bookings, provider panel. */
@Injectable({ providedIn: 'root' })
export class MarketplaceService {
  private readonly api = inject(ApiService);

  /* public */
  search(f: { categoryId?: number | null; city?: string; q?: string; page?: number; size?: number }): Observable<Page<Listing>> {
    return this.api.get<Page<Listing>>('/services', { silent: true, params: { categoryId: f.categoryId, city: f.city, q: f.q, page: f.page ?? 0, size: f.size ?? 12 } });
  }
  listing(id: number): Observable<Listing> {
    return this.api.get<Listing>(`/services/${id}`);
  }

  /* customer */
  book(body: BookingPayload): Observable<Booking> {
    return this.api.post<Booking>('/service-bookings', body);
  }
  myBookings(page = 0): Observable<Page<Booking>> {
    return this.api.get<Page<Booking>>('/service-bookings', { params: { page, size: 20 } });
  }
  cancelBooking(id: number, reason: string): Observable<Booking> {
    return this.api.patch<Booking>(`/service-bookings/${id}/cancel`, { reason });
  }

  /* provider */
  myListings(): Observable<Page<Listing>> {
    return this.api.get<Page<Listing>>('/service-provider/listings', { params: { page: 0, size: 50 } });
  }
  createListing(body: ListingPayload): Observable<Listing> {
    return this.api.post<Listing>('/service-provider/listings', body);
  }
  updateListing(id: number, body: ListingPayload): Observable<Listing> {
    return this.api.put<Listing>(`/service-provider/listings/${id}`, body);
  }
  pauseListing(id: number): Observable<Listing> {
    return this.api.patch<Listing>(`/service-provider/listings/${id}/pause`);
  }
  resumeListing(id: number): Observable<Listing> {
    return this.api.patch<Listing>(`/service-provider/listings/${id}/resume`);
  }
  providerBookings(status?: string): Observable<Page<Booking>> {
    return this.api.get<Page<Booking>>('/service-provider/bookings', { params: { status, page: 0, size: 50 } });
  }
  bookingAction(id: number, action: 'accept' | 'start' | 'complete'): Observable<Booking> {
    return this.api.patch<Booking>(`/service-provider/bookings/${id}/${action}`);
  }
  bookingReason(id: number, action: 'reject' | 'cancel', reason: string): Observable<Booking> {
    return this.api.patch<Booking>(`/service-provider/bookings/${id}/${action}`, { reason });
  }
}
