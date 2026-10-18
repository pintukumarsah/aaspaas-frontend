import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/http/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styleUrl: './auth.scss',
  template: `
    <div class="auth-wrap">
      <section class="auth-art" aria-hidden="true">
        <h2>Wapas aaye? Aapke aaspaas sab ready hai.</h2>
        <p>Order, booking aur delivery, sab ek login se.</p>
      </section>
      <section class="auth-card">
        <h1>Login</h1>
        <p class="muted">Apne phone number aur password se andar aayein.</p>

        @if (error()) {
          <div class="alert alert-error mt" role="alert">{{ error() }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" class="mt" novalidate>
          <div class="field">
            <label for="phone">Phone number</label>
            <input id="phone" class="input" type="tel" inputmode="tel" autocomplete="username" formControlName="phone" placeholder="9876543210" [class.invalid]="bad('phone')" />
            @if (bad('phone')) { <span class="error-text">Phone number daalein</span> }
          </div>
          <div class="field">
            <label for="password">Password</label>
            <div class="pw">
              <input id="password" class="input" [type]="show() ? 'text' : 'password'" autocomplete="current-password" formControlName="password" [class.invalid]="bad('password')" />
              <button type="button" class="btn btn-ghost btn-sm" (click)="show.set(!show())" [attr.aria-label]="show() ? 'Password chhupayein' : 'Password dikhayein'">{{ show() ? 'Chhupayein' : 'Dikhayein' }}</button>
            </div>
            @if (bad('password')) { <span class="error-text">Password daalein</span> }
          </div>
          <button class="btn btn-primary btn-lg btn-block" type="submit" [disabled]="busy()">{{ busy() ? 'Login ho raha hai...' : 'Login' }}</button>
        </form>

        <p class="center muted mt">Naye hain? <a routerLink="/register" class="link">Account banayein</a></p>
      </section>
    </div>
  `,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly busy = signal(false);
  readonly show = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    phone: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  bad(name: 'phone' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  submit(): void {
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    const { phone, password } = this.form.getRawValue();
    this.auth.login(phone.trim(), password).subscribe({
      next: (s) => {
        this.busy.set(false);
        this.toast.success(`Swagat hai, ${s.fullName}!`);
        const redirect = this.route.snapshot.queryParamMap.get('redirect');
        void this.router.navigateByUrl(redirect && redirect.startsWith('/') ? redirect : this.auth.homeRoute());
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(errorMessage(e, 'Login nahi ho paaya.'));
      },
    });
  }
}
