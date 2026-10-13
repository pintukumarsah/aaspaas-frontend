
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
import { RegisterRequest } from '../../models/auth.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  loading = false;
  errorMessage = '';
  successMessage = '';

  registerForm = this.fb.nonNullable.group({
    fullName: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    email: ['', [Validators.email]],
    phone: [
      '',
      [Validators.required, Validators.minLength(10), Validators.maxLength(20)],
    ],
    password: [
      '',
      [Validators.required, Validators.minLength(8), Validators.maxLength(100)],
    ],
  });

  submitRegister(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const formValue = this.registerForm.getRawValue();

    const request: RegisterRequest = {
      fullName: formValue.fullName.trim(),
      phone: formValue.phone.trim(),
      password: formValue.password,
      email: formValue.email.trim() || undefined,
    };

    this.authApi.register(request).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage =
          response.message || 'Registration successful. Please log in.';

        void this.router.navigate(['/login'], {
          state: { registrationMessage: this.successMessage },
        });
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage =
          error.error?.message ??
          'Registration failed. Please check your details and try again.';
      },
    });
  }
}
