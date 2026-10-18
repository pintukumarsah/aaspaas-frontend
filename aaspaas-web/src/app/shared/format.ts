import { Pipe, PipeTransform } from '@angular/core';

/** ₹1,234.50 (hides .00). */
@Pipe({ name: 'inr', standalone: true })
export class InrPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    const n = Number(value ?? 0);
    if (!isFinite(n)) return '₹0';
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
}

/** 17 Oct, 4:40 pm */
@Pipe({ name: 'when', standalone: true })
export class WhenPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
  }
}

/** PICKUP_OTP_SENT -> Pickup otp sent */
@Pipe({ name: 'human', standalone: true })
export class HumanPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    const s = value.replace(/_/g, ' ').toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

/** Colour class for a status string. */
export function badgeClass(status: string | null | undefined): string {
  const s = (status ?? '').toUpperCase();
  if (['ACTIVE', 'APPROVED', 'VERIFIED', 'SUCCESS', 'PAID', 'DELIVERED', 'COMPLETED', 'ACCEPTED', 'AVAILABLE', 'ONLINE', 'RESOLVED', 'CONFIRMED'].includes(s)) return 'badge-green';
  if (['REJECTED', 'FAILED', 'CANCELLED', 'SUSPENDED', 'EXPIRED', 'REFUNDED'].includes(s)) return 'badge-red';
  if (['PENDING', 'PENDING_APPROVAL', 'REQUESTED', 'INITIATED', 'REFUND_PENDING', 'OPEN', 'COD', 'UNDER_REVIEW', 'OFFLINE'].includes(s)) return 'badge-amber';
  if (['IN_PROGRESS', 'OUT_FOR_DELIVERY', 'PICKED_UP', 'PROCESSING', 'ASSIGNED', 'BUSY', 'PAUSED', 'PICKUP_OTP_SENT', 'DELIVERY_OTP_SENT'].includes(s)) return 'badge-blue';
  return '';
}

/** A soft pastel pair for product tiles that have no photo. */
const TILES: [string, string][] = [
  ['#fff1cc', '#f0b429'],
  ['#e3eefb', '#5b9be8'],
  ['#fde7ea', '#e8667a'],
  ['#e8f4e5', '#5bae62'],
  ['#ede7fa', '#8b6fd6'],
];
export function tileFor(id: number): { bg: string; fg: string } {
  const [bg, fg] = TILES[Math.abs(id) % TILES.length];
  return { bg, fg };
}
