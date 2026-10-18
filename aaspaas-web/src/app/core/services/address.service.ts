import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Address, AddressPayload } from '../models/api.models';

/**
 * Address book.
 *
 * The backend has NO address table/endpoint: orders and delivery requests only
 * carry a plain `deliveryAddressId` number (no foreign key). Until you add an
 * Address module on the server, addresses are kept in this browser
 * (localStorage, per user) and their numeric id is what the API receives.
 * Swap the 4 methods below for HttpClient calls when the backend gets one.
 */
@Injectable({ providedIn: 'root' })
export class AddressService {
  private readonly auth = inject(AuthService);
  private readonly _list = signal<Address[]>(this.load());
  readonly list = this._list.asReadonly();

  private key(): string {
    return `aaspaas.addresses.${this.auth.session()?.userId ?? 'guest'}`;
  }

  private load(): Address[] {
    try {
      const raw = localStorage.getItem(this.key());
      return raw ? (JSON.parse(raw) as Address[]) : [];
    } catch {
      return [];
    }
  }

  private persist(list: Address[]): void {
    this._list.set(list);
    try {
      localStorage.setItem(this.key(), JSON.stringify(list));
    } catch {
      /* ignore */
    }
  }

  reload(): void {
    this._list.set(this.load());
  }

  default(): Address | null {
    const list = this._list();
    return list.find((a) => a.isDefault) ?? list[0] ?? null;
  }

  add(payload: AddressPayload): Address {
    const list = this._list();
    // Ids must be unique across users because the server stores the bare number.
    const id = Date.now() % 1_000_000_000;
    const created: Address = { ...payload, id, isDefault: payload.isDefault || list.length === 0 };
    const next = created.isDefault ? list.map((a) => ({ ...a, isDefault: false })) : [...list];
    this.persist([...next, created]);
    return created;
  }

  remove(id: number): void {
    const rest = this._list().filter((a) => a.id !== id);
    if (rest.length && !rest.some((a) => a.isDefault)) rest[0] = { ...rest[0], isDefault: true };
    this.persist(rest);
  }

  makeDefault(id: number): void {
    this.persist(this._list().map((a) => ({ ...a, isDefault: a.id === id })));
  }

  format(a: Address): string {
    return [a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ');
  }
}
