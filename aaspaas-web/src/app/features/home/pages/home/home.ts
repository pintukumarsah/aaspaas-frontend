
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';

import { CategoryApiService } from '../../../categories/services/category-api.service';
import { Category } from '../../../categories/models/category.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private readonly categoryApi = inject(CategoryApiService);

  categories: Category[] = [];
  loadingCategories = false;
  categoryError = '';

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.categoryError = '';

    this.categoryApi.getRootCategories().subscribe({
      next: (categories) => {
        this.categories = categories.filter(
          (category) => category.status === 'ACTIVE'
        );
        this.loadingCategories = false;
      },
      error: (error: unknown) => {
        console.error('Failed to load categories', error);
        this.categoryError =
          'Categories load nahi ho paayi. Please try again.';
        this.loadingCategories = false;
      },
    });
  }

  retryCategories(): void {
    this.loadCategories();
  }
}
