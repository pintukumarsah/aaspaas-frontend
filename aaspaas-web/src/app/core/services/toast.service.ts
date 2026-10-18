import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  readonly toasts = signal<Toast[]>([]);

  success(message: string): void {
    this.push('success', message, 3200);
  }

  error(message: string): void {
    this.push('error', message, 5200);
  }

  info(message: string): void {
    this.push('info', message, 3600);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: ToastKind, message: string, ms: number): void {
    // Do not stack identical messages.
    if (this.toasts().some((t) => t.message === message && t.kind === kind)) return;
    const id = ++this.seq;
    this.toasts.update((list) => [...list.slice(-3), { id, kind, message }]);
    setTimeout(() => this.dismiss(id), ms);
  }
}
