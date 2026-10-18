import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./features/home/home').then((m) => m.HomePage), title: 'Aaspaas | Aapke aaspaas, aapki apni dukaan' },

  /* ---------------- public ---------------- */
  { path: 'shop', loadComponent: () => import('./features/shop/shop').then((m) => m.ShopPage), title: 'Shop | Aaspaas' },
  { path: 'product/:id', loadComponent: () => import('./features/shop/product-detail').then((m) => m.ProductDetailPage), title: 'Product | Aaspaas' },
  { path: 'services', loadComponent: () => import('./features/services/services').then((m) => m.ServicesPage), title: 'Services | Aaspaas' },
  { path: 'services/:id', loadComponent: () => import('./features/services/service-detail').then((m) => m.ServiceDetailPage), title: 'Service | Aaspaas' },
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./features/auth/login').then((m) => m.LoginPage), title: 'Login | Aaspaas' },
  { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./features/auth/register').then((m) => m.RegisterPage), title: 'Register | Aaspaas' },

  /* ---------------- any logged-in user ---------------- */
  { path: 'cart', canActivate: [authGuard], loadComponent: () => import('./features/cart/cart').then((m) => m.CartPage), title: 'Cart | Aaspaas' },
  { path: 'checkout', canActivate: [authGuard], loadComponent: () => import('./features/checkout/checkout').then((m) => m.CheckoutPage), title: 'Checkout | Aaspaas' },
  { path: 'orders', canActivate: [authGuard], loadComponent: () => import('./features/orders/orders').then((m) => m.OrdersPage), title: 'Meri orders | Aaspaas' },
  { path: 'orders/:id', canActivate: [authGuard], loadComponent: () => import('./features/orders/order-detail').then((m) => m.OrderDetailPage), title: 'Order | Aaspaas' },
  { path: 'bookings', canActivate: [authGuard], loadComponent: () => import('./features/services/my-bookings').then((m) => m.MyBookingsPage), title: 'Meri bookings | Aaspaas' },
  { path: 'notifications', canActivate: [authGuard], loadComponent: () => import('./features/account/notifications').then((m) => m.NotificationsPage), title: 'Notifications | Aaspaas' },
  { path: 'account', canActivate: [authGuard], loadComponent: () => import('./features/account/account').then((m) => m.AccountPage), title: 'Mera account | Aaspaas' },

  /* ---------------- seller ---------------- */
  { path: 'seller', canActivate: [authGuard], loadComponent: () => import('./features/seller/seller').then((m) => m.SellerPage), title: 'Seller | Aaspaas' },

  /* ---------------- delivery partner ---------------- */
  { path: 'delivery', canActivate: [authGuard], loadComponent: () => import('./features/delivery/partner').then((m) => m.PartnerPage), title: 'Delivery partner | Aaspaas' },

  /* ---------------- service provider ---------------- */
  { path: 'provider', canActivate: [authGuard], loadComponent: () => import('./features/provider/provider').then((m) => m.ProviderPage), title: 'Service provider | Aaspaas' },

  /* ---------------- admin ---------------- */
  { path: 'admin', canActivate: [roleGuard('ADMIN')], loadComponent: () => import('./features/admin/admin').then((m) => m.AdminPage), title: 'Admin | Aaspaas' },

  { path: '**', loadComponent: () => import('./features/not-found').then((m) => m.NotFoundPage), title: 'Page nahi mila | Aaspaas' },
];
