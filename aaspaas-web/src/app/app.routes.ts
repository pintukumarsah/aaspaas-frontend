import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'auth', children: [
    { path: 'login', loadComponent: () => import('./features/auth/pages/login.component').then(m => m.LoginComponent) },
    { path: 'register', loadComponent: () => import('./features/auth/pages/register.component').then(m => m.RegisterComponent) }
  ]},
  { path: 'home', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'product', loadComponent: () => import('./features/product/product-list.component').then(m => m.ProductListComponent) },
  { path: 'cart', loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent) },
  { path: 'order', loadComponent: () => import('./features/order/order.component').then(m => m.OrderComponent) },
  { path: 'service', loadComponent: () => import('./features/service/service-booking.component').then(m => m.ServiceBookingComponent) },
  { path: 'delivery', loadComponent: () => import('./features/delivery/delivery-tracking.component').then(m => m.DeliveryTrackingComponent) },
  { path: '**', redirectTo: 'home' }
];
