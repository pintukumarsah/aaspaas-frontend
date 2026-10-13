import { Routes } from '@angular/router';


import { Login } from './features/auth/pages/login/login';
import { Register } from './features/auth/pages/register/register';
import { ProductList } from './features/catalog/pages/product-list/product-list';
import { Home } from './features/home/pages/home/home';


export const routes: Routes = [
{
  path: 'login',
  component: Login,
},
{
  path: 'register',
  component: Register,
},

{
  path: '',
  component: Home,
},
{
  path: 'businesses/:businessId/products',
  component: ProductList,
},
  
];
