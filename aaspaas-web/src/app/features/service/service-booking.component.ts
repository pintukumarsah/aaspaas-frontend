import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-service-booking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 24px;">
      <h2>Marketplace Services & Booking</h2>
      <p>Plumbing, electricians, local vendors booking system.</p>
    </div>
  `
})
export class ServiceBookingComponent {}