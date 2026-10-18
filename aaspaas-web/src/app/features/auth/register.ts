import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/http/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styleUrl: './auth.scss',
  template: `
    <div class="auth-wrap">
      <section class="auth-art" aria-hidden="true">
        <h2>Apne mohalle se judiye.</h2>
        <p>Account banayein aur local dukaanon se minutes mein saaman mangwayein.</p>
      </section>
      <section class="auth-card">
        <h1>Account banayein</h1>
        <p class="muted">Free hai, sirf 1 minute lagega.</p>

        @if (error()) {
          <div class="alert alert-error mt" role="alert">{{ error() }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" class="mt" novalidate>
          <div class="field">
            <label for="fullName">Poora naam</label>
            <input id="fullName" class="input" autocomplete="name" formControlName="fullName" [class.invalid]="bad('fullName')" />
            @if (bad('fullName')) { <span class="error-text">Naam 2 se 100 akshar ka hona chahiye</span> }
          </div>
          <div class="field">
            <label for="phone">Phone number</label>
            <input id="phone" class="input" type="tel" inputmode="tel" autocomplete="tel" formControlName="phone" placeholder="9876543210" [class.invalid]="bad('phone')" />
            @if (bad('phone')) { <span class="error-text">Sahi phone number daalein (10-20 digits)</span> }
          </div>
          <div class="field">
            <label for="email">Email <span class="muted">(optional)</span></label>
            <input id="email" class="input" type="email" autocomplete="email" formControlName="email" [class.invalid]="bad('email')" />
            @if (bad('email')) { <span class="error-text">Sahi email daalein</span> }
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input id="password" class="input" type="password" autocomplete="new-password" formControlName="password" [class.invalid]="bad('password')" />
            <span class="hint">Kam se kam 8 akshar</span>
            @if (bad('password')) { <span class="error-text">Password kam se kam 8 akshar ka ho</span> }
          </div>
          <button class="btn btn-primary btn-lg btn-block" type="submit" [disabled]="busy()">{{ busy() ? 'Account ban raha hai...' : 'Account banayein' }}</button>
        </form>

        <p class="center muted mt">Pehle se account hai? <a routerLink="/login" class="link">Login karein</a></p>
      </section>
    </div>
  `,
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly busy = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    phone: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(20)]],
    email: ['', [Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
  });

  bad(name: 'fullName' | 'phone' | 'email' | 'password'): boolean {
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
    const v = this.form.getRawValue();
    this.auth.register({ fullName: v.fullName.trim(), phone: v.phone.trim(), email: v.email, password: v.password }).subscribe({
      next: () => {
        // The register endpoint returns no tokens, so log the user straight in.
        this.auth.login(v.phone.trim(), v.password).subscribe({
          next: () => {
            this.busy.set(false);
            this.toast.success('Account ban gaya. Swagat hai!');
            void this.router.navigateByUrl('/');
          },
          error: () => {
            this.busy.set(false);
            this.toast.success('Account ban gaya. Ab login karein.');
            void this.router.navigateByUrl('/login');
          },
        });
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(errorMessage(e, 'Account nahi ban paaya.'));
      },
    });
  }
}
