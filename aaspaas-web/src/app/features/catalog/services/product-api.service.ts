
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../../core/http/api-endpoints';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductApiService {
  private readonly http = inject(HttpClient);

  getBusinessProducts(businessId: number): Observable<Product[]> {
    return this.http.get<Product[]>(
      `${API_ENDPOINTS.products}/business/${businessId}`
    );
  }

  getProductById(productId: number): Observable<Product> {
    return this.http.get<Product>(
      `${API_ENDPOINTS.products}/${productId}`
    );
  }
}
