import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, asList } from '../http/api.service';
import { BankAccount, BankAccountPayload, Page, WalletSummary, Withdrawal } from '../models/api.models';

/** Delivery partner earnings, bank accounts and withdrawals (/api/partner-wallet). */
@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly api = inject(ApiService);

  summary(): Observable<WalletSummary> {
    return this.api.get<WalletSummary>('/partner-wallet/summary');
  }
  accounts(): Observable<BankAccount[]> {
    return this.api.get<BankAccount[]>('/partner-wallet/bank-accounts').pipe(map((l) => asList<BankAccount>(l)));
  }
  addAccount(body: BankAccountPayload): Observable<BankAccount> {
    return this.api.post<BankAccount>('/partner-wallet/bank-accounts', body);
  }
  removeAccount(id: number): Observable<void> {
    return this.api.delete<void>(`/partner-wallet/bank-accounts/${id}`);
  }
  withdraw(bankAccountId: number, idempotencyKey: string): Observable<Withdrawal> {
    return this.api.post<Withdrawal>('/partner-wallet/withdrawals', { bankAccountId }, { headers: { 'Idempotency-Key': idempotencyKey } });
  }
  withdrawals(): Observable<Page<Withdrawal>> {
    return this.api.get<Page<Withdrawal>>('/partner-wallet/withdrawals', { params: { page: 0, size: 20 } });
  }
}
