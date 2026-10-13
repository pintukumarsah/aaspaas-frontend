export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface User {
  id: number;
  email: string;
  roles: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: User;
}

export interface Product {
  id?: number;
  title: string;
  description: string;
  price: number;
  stockQuantity: number;
  businessId: number;
  categoryId: number;
  imageUrls?: string[];
}

export interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
}

export interface Order {
  id?: number;
  totalAmount: number;
  status: string;
  items: OrderItem[];
  deliveryAddress?: string;
}

export interface ServiceBooking {
  id?: number;
  serviceId: number;
  scheduledTime: string;
  status: string;
}