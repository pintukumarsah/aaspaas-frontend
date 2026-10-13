
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../../core/http/api-endpoints';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryApiService {
  private readonly http = inject(HttpClient);

  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(
      API_ENDPOINTS.categories
    );
  }

  getRootCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(
      `${API_ENDPOINTS.categories}/root`
    );
  }

  getChildCategories(categoryId: number): Observable<Category[]> {
    return this.http.get<Category[]>(
      `${API_ENDPOINTS.categories}/${categoryId}/children`
    );
  }

  getCategoryById(categoryId: number): Observable<Category> {
    return this.http.get<Category>(
      `${API_ENDPOINTS.categories}/${categoryId}`
    );
  }
}
