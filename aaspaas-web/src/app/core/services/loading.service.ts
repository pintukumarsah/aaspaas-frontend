import { Injectable, computed, signal } from '@angular/core';

/** Counts in-flight HTTP requests; drives the slim progress bar under the header. */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly count = signal(0);
  readonly busy = computed(() => this.count() > 0);

  start(): void {
    this.count.update((n) => n + 1);
  }

  stop(): void {
    this.count.update((n) => Math.max(0, n - 1));
  }
}
