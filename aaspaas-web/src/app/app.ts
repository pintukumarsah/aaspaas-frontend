import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/auth/auth.service';
import { CartService } from './core/services/cart.service';
import { LoadingService } from './core/services/loading.service';
import { SocialService } from './core/services/social.service';
import { ToastService } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  readonly social = inject(SocialService);
  readonly toast = inject(ToastService);
  readonly loading = inject(LoadingService);
  private readonly router = inject(Router);

  readonly menuOpen = signal(false);
  readonly userMenu = signal(false);
  readonly year = new Date().getFullYear();

  readonly panels = computed(() => {
    const links: { path: string; label: string }[] = [];
    if (this.auth.hasAnyRole('ADMIN')) links.push({ path: '/admin', label: 'Admin panel' });
    if (this.auth.hasAnyRole('SELLER')) links.push({ path: '/seller', label: 'Meri dukaan' });
    if (this.auth.hasAnyRole('SERVICE_PROVIDER')) links.push({ path: '/provider', label: 'Meri services' });
    if (this.auth.hasAnyRole('DELIVERY_PARTNER')) links.push({ path: '/delivery', label: 'Delivery panel' });
    return links;
  });

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.menuOpen.set(false);
      this.userMenu.set(false);
    });
  }

  @HostListener('document:keydown.escape')
  closeMenus(): void {
    this.menuOpen.set(false);
    this.userMenu.set(false);
  }

  logout(): void {
    this.userMenu.set(false);
    this.auth.logout();
  }
}
