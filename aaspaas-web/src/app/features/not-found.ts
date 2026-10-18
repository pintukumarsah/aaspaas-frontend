import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container page center" style="padding-top: 80px">
      <div style="font-size: 5rem; font-weight: 800; color: var(--maroon); letter-spacing: -0.06em">404</div>
      <h2>Yeh page nahi mila</h2>
      <p class="muted" style="margin: 10px 0 22px">Link galat hai ya page hata diya gaya hai.</p>
      <a routerLink="/" class="btn btn-primary btn-lg">Home par jaayein</a>
    </div>
  `,
})
export class NotFoundPage {}
