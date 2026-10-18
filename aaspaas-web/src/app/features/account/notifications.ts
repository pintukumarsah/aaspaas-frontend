import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppNotification } from '../../core/models/api.models';
import { SocialService } from '../../core/services/social.service';
import { WhenPipe } from '../../shared/format';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [WhenPipe],
  template: `
    <div class="container page" style="max-width: 760px">
      <div class="page-head">
        <div><h1>Notifications</h1><p>Aapke orders, bookings aur deliveries ki khabar.</p></div>
        @if (items().length) { <button type="button" class="btn btn-outline btn-sm" (click)="readAll()">Sab padh liye</button> }
      </div>
      @if (loading()) {
        <div class="stack">@for (n of [1, 2, 3]; track n) { <div class="skeleton" style="height: 70px"></div> }</div>
      } @else if (!items().length) {
        <div class="card center" style="padding: 40px 20px"><div style="font-size: 2.6rem">🔔</div><h3>Abhi koi notification nahi</h3></div>
      } @else {
        <div class="stack-sm">
          @for (n of items(); track n.id) {
            <button type="button" class="card-flat nrow" [class.unread]="!n.isRead" (click)="open(n)">
              <div class="strong">{{ n.title }}</div>
              <div class="muted small">{{ n.message }}</div>
              <div class="tiny muted" style="margin-top: 4px">{{ n.createdAt | when }}</div>
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .nrow {
      width: 100%;
      text-align: left;
      display: block;
    }
    .unread {
      border-color: var(--maroon);
      background: var(--rose-100);
    }
  `,
})
export class NotificationsPage implements OnInit {
  private readonly social = inject(SocialService);
  private readonly router = inject(Router);
  readonly items = signal<AppNotification[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.social.notifications().subscribe({
      next: (l) => {
        this.items.set(l);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  open(n: AppNotification): void {
    if (!n.isRead) {
      this.social.markRead(n.id).subscribe(() => this.items.update((l) => l.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))));
    }
    const t = (n.referenceType ?? '').toUpperCase();
    if (t === 'ORDER' && n.referenceId) void this.router.navigate(['/orders', n.referenceId]);
    else if (t.includes('BOOKING')) void this.router.navigate(['/bookings']);
  }

  readAll(): void {
    this.social.markAllRead().subscribe(() => this.items.update((l) => l.map((x) => ({ ...x, isRead: true }))));
  }
}
