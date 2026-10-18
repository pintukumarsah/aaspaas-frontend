import { Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Address } from '../core/models/api.models';
import { AddressService } from '../core/services/address.service';

/** Small form that saves an address to the local address book (see AddressService). */
@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <div class="form-grid">
        <div class="field">
          <label for="a-label">Naam (Ghar / Office)</label>
          <input id="a-label" class="input" formControlName="label" />
        </div>
        <div class="field">
          <label for="a-pin">Pincode</label>
          <input id="a-pin" class="input" inputmode="numeric" maxlength="6" formControlName="pincode" [class.invalid]="bad('pincode')" />
          @if (bad('pincode')) { <span class="error-text">6 digit pincode</span> }
        </div>
      </div>
      <div class="field">
        <label for="a-l1">Address line 1</label>
        <input id="a-l1" class="input" formControlName="line1" placeholder="Flat / makaan no., gali, mohalla" [class.invalid]="bad('line1')" />
        @if (bad('line1')) { <span class="error-text">Address likhna zaroori hai</span> }
      </div>
      <div class="field">
        <label for="a-l2">Landmark <span class="muted">(optional)</span></label>
        <input id="a-l2" class="input" formControlName="line2" />
      </div>
      <div class="form-grid">
        <div class="field">
          <label for="a-city">Sheher</label>
          <input id="a-city" class="input" formControlName="city" [class.invalid]="bad('city')" />
        </div>
        <div class="field">
          <label for="a-state">State</label>
          <input id="a-state" class="input" formControlName="state" />
        </div>
      </div>
      <div class="row" style="margin-bottom: 14px">
        <button type="button" class="btn btn-outline btn-sm" (click)="locate()" [disabled]="locating()">{{ locating() ? 'Location mil rahi hai...' : '📍 Meri location lagayein' }}</button>
        @if (form.value.latitude) { <span class="badge badge-green">Location saved</span> }
      </div>
      <div class="row">
        <button type="submit" class="btn btn-primary">Address save karein</button>
        <button type="button" class="btn btn-ghost" (click)="cancelled.emit()">Cancel</button>
      </div>
    </form>
  `,
})
export class AddressForm {
  private readonly fb = inject(FormBuilder);
  private readonly addresses = inject(AddressService);
  readonly saved = output<Address>();
  readonly cancelled = output<void>();
  readonly locating = signal(false);

  readonly form = this.fb.group({
    label: ['Ghar', Validators.required],
    line1: ['', Validators.required],
    line2: [''],
    city: ['', Validators.required],
    state: [''],
    pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    latitude: [null as number | null],
    longitude: [null as number | null],
  });

  bad(name: 'line1' | 'city' | 'pincode'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  locate(): void {
    if (!('geolocation' in navigator)) return;
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.form.patchValue({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        this.locating.set(false);
      },
      () => this.locating.set(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const created = this.addresses.add({
      label: v.label || 'Ghar',
      line1: v.line1 || '',
      line2: v.line2 || undefined,
      city: v.city || '',
      state: v.state || undefined,
      pincode: v.pincode || '',
      latitude: v.latitude,
      longitude: v.longitude,
      isDefault: false,
    });
    this.saved.emit(created);
  }
}
