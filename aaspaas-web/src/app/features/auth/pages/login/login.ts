
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

import { AuthApiService } from '../../services/auth-api.service';
import { LoginRequest } from '../../models/auth.models';
import { TokenStorageService } from '../../../../core/auth/token-storage.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);

  loading = false;
  errorMessage = '';

  loginForm = this.fb.nonNullable.group({
    phone: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(20)]],
    password: ['', [Validators.required]],
  });

  submitLogin(): void {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const request: LoginRequest = {
      phone: this.loginForm.controls.phone.value.trim(),
      password: this.loginForm.controls.password.value,
    };

    this.authApi.login(request).subscribe({
      next: (response) => {
        this.tokenStorage.saveSession(response);
        this.loading = false;

        // Login ke baad home route par navigate karein.
        void this.router.navigateByUrl('/');
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage =
          error.error?.message ??
          'Login failed. Please check your details and try again.';
      },
    });
  }
}
