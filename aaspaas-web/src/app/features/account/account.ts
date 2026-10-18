import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ApiService } from '../../core/http/api.service';
import { UserProfile } from '../../core/models/api.models';
import { AddressService } from '../../core/services/address.service';
import { AddressForm } from '../../shared/address-form';
import { HumanPipe } from '../../shared/format';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [RouterLink, AddressForm, HumanPipe],
  template: `
    <div class="container page" style="max-width: 860px">
      <div class="page-head"><div><h1>Mera account</h1></div><button type="button" class="btn btn-outline" (click)="auth.logout()">Logout</button></div>

      <section class="card">
        <div class="row" style="gap: 16px">
          <span class="av">{{ auth.initial() }}</span>
          <div>
            <h3 style="margin: 0">{{ auth.fullName() }}</h3>
            <div class="muted">{{ auth.session()?.phone }}@if (profile()?.email) { · {{ profile()?.email }} }</div>
            <div class="row" style="margin-top: 8px; gap: 6px">
              @for (r of auth.roles(); track r) { <span class="badge badge-purple">{{ r | human }}</span> }
            </div>
          </div>
        </div>
      </section>

      <section class="card mt">
        <div class="row-between"><h3 style="margin: 0">Mere addresses</h3><button type="button" class="btn btn-primary btn-sm" (click)="adding.set(true)">+ Naya address</button></div>
        @if (adding()) { <div class="mt"><app-address-form (saved)="adding.set(false)" (cancelled)="adding.set(false)" /></div> }
        @if (!addresses.list().length && !adding()) { <p class="muted mt">Abhi koi address nahi. Checkout ke liye ek address jodein.</p> }
        <div class="stack-sm mt">
          @for (a of addresses.list(); track a.id) {
            <div class="card-flat row-between">
              <div><strong>{{ a.label }}</strong>@if (a.isDefault) { <span class="badge badge-green" style="margin-left: 8px">Default</span> }<div class="muted small">{{ addresses.format(a) }}</div></div>
              <div class="row">
                @if (!a.isDefault) { <button type="button" class="btn btn-ghost btn-sm" (click)="addresses.makeDefault(a.id)">Default banayein</button> }
                <button type="button" class="btn btn-ghost btn-sm" (click)="addresses.remove(a.id)">Hatayein</button>
              </div>
            </div>
          }
        </div>
      </section>

      <section class="card mt">
        <h3>Kamayi ke mauke</h3>
        <div class="grid-3">
          <a routerLink="/seller" class="card-flat card-hover"><strong>Dukaandaar banein</strong><p class="muted small">Apni dukaan aur products jodein.</p></a>
          <a routerLink="/delivery" class="card-flat card-hover"><strong>Delivery partner banein</strong><p class="muted small">Har delivery par kamayiye.</p></a>
          <a routerLink="/provider" class="card-flat card-hover"><strong>Service provider</strong><p class="muted small">Ghar ki services offer karein.</p></a>
        </div>
        <p class="tiny muted mt">Seller aur service provider role admin approve karta hai. Delivery partner ke liye panel mein register karein.</p>
      </section>
    </div>
  `,
  styles: `
    .av {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--maroon);
      color: #fff;
      font-size: 1.7rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `,
})
export class AccountPage implements OnInit {
  readonly auth = inject(AuthService);
  readonly addresses = inject(AddressService);
  private readonly api = inject(ApiService);
  readonly adding = signal(false);
  readonly profile = signal<UserProfile | null>(null);

  ngOnInit(): void {
    this.addresses.reload();
    this.auth.refreshRoles().subscribe();
    const id = this.auth.session()?.userId;
    if (id) {
      // /api/users/{id} is open to every logged-in role in SecurityConfig.
      this.api.get<UserProfile>(`/users/${id}`, { silent: true }).subscribe({ next: (p) => this.profile.set(p), error: () => undefined });
    }
  }
}
