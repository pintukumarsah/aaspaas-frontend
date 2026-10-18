import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService, asList } from '../http/api.service';
import { Business, BusinessPayload, Product, ProductImage, ProductPayload } from '../models/api.models';

/** Seller panel: own businesses and products. */
@Injectable({ providedIn: 'root' })
export class SellerService {
  private readonly api = inject(ApiService);

  myBusinesses(silent = false): Observable<Business[]> {
    return this.api.get<Business[]>('/businesses/my', { silent }).pipe(map((l) => asList<Business>(l)));
  }
  business(id: number): Observable<Business> {
    return this.api.get<Business>(`/businesses/${id}`, { silent: true });
  }
  createBusiness(body: BusinessPayload): Observable<Business> {
    return this.api.post<Business>('/businesses', body);
  }

  myProducts(): Observable<Product[]> {
    return this.api.get<Product[]>('/products/my').pipe(map((l) => asList<Product>(l)));
  }
  createProduct(body: ProductPayload): Observable<Product> {
    return this.api.post<Product>('/products', body);
  }
  updateProduct(id: number, body: ProductPayload): Observable<Product> {
    return this.api.put<Product>(`/products/${id}`, body);
  }
  deleteProduct(id: number): Observable<void> {
    return this.api.delete<void>(`/products/${id}`);
  }
  addImage(productId: number, imageUrl: string, displayOrder = 0): Observable<ProductImage> {
    return this.api.post<ProductImage>(`/products/${productId}/images`, { imageUrl, displayOrder });
  }
  deleteImage(productId: number, imageId: number): Observable<void> {
    return this.api.delete<void>(`/products/${productId}/images/${imageId}`);
  }
}
