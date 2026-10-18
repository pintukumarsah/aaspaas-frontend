import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import { AdminUser, BankAccount, Business, Dispute, Listing, Page, PartnerProfile, Withdrawal } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly api = inject(ApiService);

  /* businesses */
  businesses(status?: string): Observable<Page<Business>> {
    return this.api.get<Page<Business>>('/admin/businesses', { params: { status, page: 0, size: 50 } });
  }
  businessAction(id: number, action: 'approve' | 'reject' | 'suspend' | 'reactivate'): Observable<Business> {
    return this.api.patch<Business>(`/admin/businesses/${id}/${action}`);
  }

  /* delivery partners */
  partners(status?: string): Observable<Page<PartnerProfile>> {
    return this.api.get<Page<PartnerProfile>>('/admin/delivery-partners', { params: { status, page: 0, size: 50 } });
  }
  partnerAction(id: number, action: 'approve' | 'reject' | 'suspend' | 'reactivate'): Observable<PartnerProfile> {
    return this.api.patch<PartnerProfile>(`/admin/delivery-partners/${id}/${action}`);
  }

  /* services */
  services(status?: string): Observable<Page<Listing>> {
    return this.api.get<Page<Listing>>('/admin/services', { params: { status, page: 0, size: 50 } });
  }
  serviceAction(id: number, action: 'approve' | 'suspend' | 'reactivate'): Observable<Listing> {
    return this.api.patch<Listing>(`/admin/services/${id}/${action}`);
  }

  /* users */
  users(f: { search?: string; status?: string; role?: string }): Observable<Page<AdminUser>> {
    return this.api.get<Page<AdminUser>>('/admin/users', { params: { ...f, page: 0, size: 50 } });
  }
  userAction(id: number, action: 'suspend' | 'reactivate', reason: string): Observable<AdminUser> {
    return this.api.patch<AdminUser>(`/admin/users/${id}/${action}`, { reason });
  }

  /* disputes */
  disputes(status?: string): Observable<Page<Dispute>> {
    return this.api.get<Page<Dispute>>('/admin/disputes', { params: { status, page: 0, size: 50 } });
  }
  reviewDispute(id: number): Observable<Dispute> {
    return this.api.patch<Dispute>(`/admin/disputes/${id}/review`);
  }
  resolveDispute(id: number, body: { resolutionCode: string; resolutionNotes: string; approvedRefundAmount?: number | null }): Observable<Dispute> {
    return this.api.patch<Dispute>(`/admin/disputes/${id}/resolve`, body);
  }
  rejectDispute(id: number, notes: string): Observable<Dispute> {
    return this.api.patch<Dispute>(`/admin/disputes/${id}/reject`, { notes });
  }
  executeRefund(id: number): Observable<unknown> {
    return this.api.post<unknown>(`/admin/disputes/${id}/execute-refund`);
  }

  /* wallet */
  bankAccounts(status?: string): Observable<Page<BankAccount>> {
    return this.api.get<Page<BankAccount>>('/admin/bank-accounts', { params: { status, page: 0, size: 50 } });
  }
  bankAction(id: number, action: 'verify' | 'reject'): Observable<BankAccount> {
    return this.api.patch<BankAccount>(`/admin/bank-accounts/${id}/${action}`);
  }
  withdrawals(status?: string): Observable<Page<Withdrawal>> {
    return this.api.get<Page<Withdrawal>>('/admin/withdrawals', { params: { status, page: 0, size: 50 } });
  }
  withdrawalAction(id: number, action: 'approve' | 'retry'): Observable<Withdrawal> {
    return this.api.post<Withdrawal>(`/admin/withdrawals/${id}/${action}`);
  }
  withdrawalReason(id: number, action: 'reject' | 'cancel', reason: string): Observable<Withdrawal> {
    return this.api.post<Withdrawal>(`/admin/withdrawals/${id}/${action}`, { reason });
  }

  /* reports */
  report(kind: 'overview' | 'orders' | 'deliveries' | 'payouts'): Observable<Record<string, unknown>> {
    return this.api.get<Record<string, unknown>>(`/admin/reports/${kind}`);
  }
}
