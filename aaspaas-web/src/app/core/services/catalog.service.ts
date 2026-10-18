import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { ApiService, asList } from '../http/api.service';
import { Category, Page, Product, ProductImage, ProductQuery } from '../models/api.models';

export interface PagedResult<T> {
  items: T[];
  total: number;
  totalPages: number;
  page: number;
}

/**
 * Public catalogue: categories, products and product images.
 *
 * NOTE: the original backend has no "list all products" endpoint (only
 * /products/{id}, /products/business/{id} and /products/my). browse() calls
 * GET /api/products - add it with backend-patch/ProductController.patch.md.
 */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly api = inject(ApiService);
  private readonly imageCache = new Map<number, Observable<string | null>>();
  private categories$: Observable<Category[]> | null = null;

  categories(): Observable<Category[]> {
    if (!this.categories$) {
      this.categories$ = this.api.get<Category[]>('/categories', { silent: true }).pipe(
        map((list) => asList<Category>(list)),
        catchError(() => of([] as Category[])),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.categories$;
  }

  rootCategories(): Observable<Category[]> {
    return this.categories().pipe(map((list) => list.filter((c) => c.parentId === null || c.parentId === undefined)));
  }

  browse(query: ProductQuery = {}): Observable<PagedResult<Product>> {
    const page = query.page ?? 0;
    const size = query.size ?? 12;
    return this.api
      .get<Page<Product> | Product[]>('/products', {
        silent: true,
        params: { q: query.q, categoryId: query.categoryId, businessId: query.businessId, page, size },
      })
      .pipe(
        map((res) => {
          if (Array.isArray(res)) {
            // Backend returned a plain list: filter + paginate on the client.
            const needle = (query.q ?? '').trim().toLowerCase();
            let list = res.filter((p) => p.available !== false);
            if (query.categoryId) list = list.filter((p) => p.categoryId === query.categoryId);
            if (query.businessId) list = list.filter((p) => p.businessId === query.businessId);
            if (needle) list = list.filter((p) => `${p.name} ${p.businessName} ${p.categoryName}`.toLowerCase().includes(needle));
            const totalPages = Math.max(1, Math.ceil(list.length / size));
            return { items: list.slice(page * size, page * size + size), total: list.length, totalPages, page };
          }
          return { items: res.content ?? [], total: res.totalElements ?? 0, totalPages: Math.max(1, res.totalPages ?? 1), page: res.number ?? page };
        }),
      );
  }

  product(id: number): Observable<Product> {
    return this.api.get<Product>(`/products/${id}`);
  }

  businessProducts(businessId: number): Observable<Product[]> {
    return this.api.get<Product[]>(`/products/business/${businessId}`, { silent: true }).pipe(map((l) => asList<Product>(l)));
  }

  images(productId: number): Observable<ProductImage[]> {
    return this.api.get<ProductImage[]>(`/products/${productId}/images`, { silent: true }).pipe(
      map((l) => asList<ProductImage>(l).sort((a, b) => a.displayOrder - b.displayOrder)),
      catchError(() => of([] as ProductImage[])),
    );
  }

  /** First image url of a product (cached - product cards call this). */
  firstImage(productId: number): Observable<string | null> {
    let cached = this.imageCache.get(productId);
    if (!cached) {
      cached = this.images(productId).pipe(
        map((imgs) => imgs[0]?.imageUrl ?? null),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
      this.imageCache.set(productId, cached);
    }
    return cached;
  }

  clearImageCache(productId?: number): void {
    if (productId) this.imageCache.delete(productId);
    else this.imageCache.clear();
  }
}
