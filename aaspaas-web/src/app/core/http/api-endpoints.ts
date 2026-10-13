
import { environment } from '../../../environments/environment';

const API = environment.apiBaseUrl;

export const API_ENDPOINTS = {
  auth: {
    register: `${API}/auth/register`,
    login: `${API}/auth/login`,
    refresh: `${API}/auth/refresh`,
    logout: `${API}/auth/logout`,
  },

  users: `${API}/users`,
  businesses: `${API}/businesses`,
  categories: `${API}/categories`,
  products: `${API}/products`,
  cart: `${API}/cart`,
  orders: `${API}/orders`,
  payments: `${API}/payments`,

  delivery: {
    requests: `${API}/delivery/requests`,
    assignments: `${API}/delivery/assignments`,
    partners: `${API}/delivery/partners`,
  },

  services: `${API}/services`,
  serviceBookings: `${API}/service-bookings`,
  notifications: `${API}/notifications`,
  ratings: `${API}/ratings`,
};
