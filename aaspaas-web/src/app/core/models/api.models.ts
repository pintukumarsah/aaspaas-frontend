/**
 * Every type below mirrors a DTO of the Spring Boot backend
 * (com.aaspaas.aaspaas_backend.*). Money/quantity fields are BigDecimal on the
 * server and plain JSON numbers here.
 */

/* ------------------------------------------------------------------ common */

export type Role = 'CUSTOMER' | 'SELLER' | 'DELIVERY_PARTNER' | 'SERVICE_PROVIDER' | 'ADMIN';

/** Wrapper used by Cart, Order, Payment, Delivery, Marketplace, Rating, Wallet, Admin endpoints. */
export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

/** Spring Data Page<T>. */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first?: boolean;
  last?: boolean;
}

/** GlobalExceptionHandler -> ApiErrorResponse. */
export interface ApiError {
  timestamp?: string;
  status?: number;
  error?: string;
  code?: string;
  message?: string;
  path?: string;
  correlationId?: string;
  validationErrors?: Record<string, string>;
}

/* -------------------------------------------------------------------- auth */

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: number;
  fullName: string;
  /** Present only if the backend patch (see backend-patch/) is applied. */
  roles?: string[];
}

export interface RegisterRequest {
  fullName: string;
  email?: string;
  phone: string;
  password: string;
}

export interface RegisterResponse {
  userId: number;
  fullName: string;
  phone: string;
  message: string;
}

export interface Session {
  userId: number;
  fullName: string;
  phone: string;
  accessToken: string;
  refreshToken: string;
  roles: Role[];
}

export interface UserProfile {
  id: number;
  fullName: string;
  email?: string;
  phone: string;
  status: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  createdAt?: string;
}

/* ---------------------------------------------------------------- catalog */

export interface Category {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  description?: string;
  type?: string;
  status?: string;
}

export interface Product {
  id: number;
  businessId: number;
  businessName: string;
  categoryId: number;
  categoryName: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  stockQuantity: number;
  unit?: string;
  status: string;
  available: boolean;
}

export interface ProductPayload {
  businessId: number;
  categoryId: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  stockQuantity: number;
  unit?: string;
  available: boolean;
}

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  displayOrder: number;
  createdAt?: string;
}

export interface ProductQuery {
  q?: string;
  categoryId?: number | null;
  businessId?: number | null;
  page?: number;
  size?: number;
}

export interface Business {
  id: number;
  ownerId: number;
  name: string;
  description?: string;
  businessType: string;
  phone?: string;
  addressId?: number;
  latitude?: number;
  longitude?: number;
  status: string;
}

export interface BusinessPayload {
  name: string;
  description?: string;
  businessType: string;
  phone?: string;
  addressId?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

/* ------------------------------------------------------------------ cart */

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  businessId: number;
  businessName: string;
}

export interface Cart {
  cartId: number;
  userId: number;
  items: CartItem[];
  subtotal: number;
  totalItems: number;
}

/* ---------------------------------------------------------------- orders */

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  businessId: number;
  businessName: string;
  deliveryAddressId: number;
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface CancellationResult {
  orderId: number;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  deliveryCancelled: boolean;
  refundCreated: boolean;
  refundAmount?: number;
  refundStatus?: string;
  cancelledByType?: string;
  reason?: string;
  cancelledAt?: string;
}

export type PaymentMethod = 'COD' | 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET';

export interface Payment {
  paymentId: number;
  orderId: number;
  orderNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: string;
  transactionReference?: string;
  gatewayPaymentId?: string;
  gatewayOrderId?: string;
  failureReason?: string;
  paidAt?: string;
  createdAt?: string;
}

export interface Dispute {
  id: number;
  orderId: number;
  orderNumber: string;
  raisedByUserId: number;
  reasonCode: string;
  description: string;
  requestedRefundAmount?: number;
  approvedRefundAmount?: number;
  currency?: string;
  status: string;
  resolutionCode?: string;
  resolutionNotes?: string;
  reviewedAt?: string;
  resolvedAt?: string;
  createdAt: string;
}

/* -------------------------------------------------------------- delivery */

export interface DeliveryRequestPayload {
  orderId: number;
  pickupAddressId: number;
  deliveryAddressId: number;
  maxBudget: number;
  deliveryMode?: string;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  searchRadiusKm?: number;
  customerNote?: string;
}

export interface DeliveryRequest {
  id: number;
  orderId: number;
  orderNumber: string;
  customerId: number;
  pickupAddressId: number;
  deliveryAddressId: number;
  maxBudget: number;
  status: string;
  deliveryMode: string;
  searchRadiusKm?: number;
  customerNote?: string;
  requestedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

/** DeliveryQuoteController returns the raw entity; every field is optional on purpose. */
export interface DeliveryQuote {
  id: number;
  quotedAmount: number;
  estimatedMinutes?: number;
  message?: string;
  status: string;
  createdAt?: string;
  partner?: {
    id?: number;
    rating?: number;
    vehicleType?: string;
    totalDeliveries?: number;
    user?: { fullName?: string };
  };
}

export interface DeliveryQuoteSelection {
  deliveryRequestId: number;
  quoteId: number;
  assignmentId: number;
  partnerId: number;
  agreedDeliveryFee: number;
  platformCommission: number;
  partnerEarning: number;
  currency: string;
  assignmentStatus: string;
}

export interface DeliveryAssignment {
  id: number;
  deliveryRequestId: number;
  quoteId?: number;
  partnerId: number;
  partnerUserId?: number;
  partnerName?: string;
  agreedDeliveryFee?: number;
  platformCommission?: number;
  partnerEarning?: number;
  deliveryAmount?: number;
  estimatedMinutes?: number;
  currency?: string;
  status: string;
  assignedAt?: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
}

export interface TrackingPoint {
  id: number;
  assignmentId: number;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  recordedAt: string;
}

export interface StatusHistory {
  id: number;
  assignmentId: number;
  status: string;
  latitude?: number;
  longitude?: number;
  remarks?: string;
  createdAt: string;
}

export interface OtpResult {
  assignmentId: number;
  type: string;
  expiresAt?: string;
  developmentOtp?: string;
}

export interface PartnerProfile {
  id: number;
  userId: number;
  vehicleType?: string;
  vehicleNumber?: string;
  verificationStatus: string;
  availabilityStatus: string;
  rating?: number;
  totalDeliveries?: number;
}

export interface PartnerRoutePayload {
  currentLatitude: number;
  currentLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  destinationName: string;
  routeAvailable: boolean;
}

export interface DeliveryPrice {
  roadDistanceKm: number;
  suggestedDeliveryFee: number;
  minimumDeliveryFee: number;
  maximumDeliveryFee: number;
  currency: string;
}

/* ---------------------------------------------------------- partner wallet */

export interface WalletSummary {
  availableBalance: number;
  inProcessAmount: number;
  totalPaid: number;
  minimumWithdrawalAmount: number;
}

export interface BankAccount {
  id: number;
  partnerId: number;
  accountHolderName: string;
  maskedAccountNumber: string;
  ifscCode: string;
  bankName?: string;
  verificationStatus: string;
  primary: boolean;
  active: boolean;
  createdAt?: string;
}

export interface BankAccountPayload {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName?: string;
}

export interface Withdrawal {
  id: number;
  partnerId: number;
  bankAccountId: number;
  maskedAccountNumber?: string;
  amount: number;
  status: string;
  retryCount: number;
  failureReason?: string;
  createdAt: string;
  reviewedAt?: string;
  processedAt?: string;
}

/* ---------------------------------------------------------------- services */

export type PricingType = 'FIXED' | 'HOURLY';

export interface Listing {
  id: number;
  providerId: number;
  providerName: string;
  categoryId: number;
  categoryName: string;
  title: string;
  description: string;
  pricingType: PricingType;
  basePrice: number;
  city: string;
  locality?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  createdAt: string;
}

export interface ListingPayload {
  categoryId: number;
  title: string;
  description: string;
  pricingType: PricingType;
  basePrice: number;
  city: string;
  locality?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Booking {
  id: number;
  bookingNumber: string;
  listingId: number;
  listingTitle: string;
  customerId: number;
  customerName: string;
  providerId: number;
  providerName: string;
  scheduledAt: string;
  addressText: string;
  notes?: string;
  pricingType: PricingType;
  unitPrice: number;
  estimatedHours?: number;
  totalAmount: number;
  commissionPercent?: number;
  commissionAmount?: number;
  providerEarning?: number;
  status: string;
  statusReason?: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface BookingPayload {
  listingId: number;
  scheduledAt: string;
  addressText: string;
  notes?: string;
  estimatedHours?: number | null;
}

/* ----------------------------------------------------- ratings / notifications */

export interface Rating {
  id: number;
  reviewerId: number;
  reviewerName: string;
  orderId: number;
  targetType: 'BUSINESS' | 'DELIVERY_PARTNER';
  businessId?: number;
  businessName?: string;
  deliveryPartnerId?: number;
  rating: number;
  review?: string;
  status: string;
  createdAt: string;
}

export interface RatingSummary {
  targetId: number;
  targetType: string;
  averageRating: number;
  totalRatings: number;
  oneStar: number;
  twoStar: number;
  threeStar: number;
  fourStar: number;
  fiveStar: number;
}

export interface RatingPayload {
  targetType: 'BUSINESS' | 'DELIVERY_PARTNER';
  businessId?: number;
  deliveryPartnerId?: number;
  orderId: number;
  deliveryAssignmentId?: number;
  rating: number;
  review?: string;
}

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type?: string;
  referenceType?: string;
  referenceId?: number;
  isRead: boolean;
  createdAt: string;
}

/* ------------------------------------------------------------------ admin */

export interface AdminUser {
  id: number;
  fullName: string;
  email?: string;
  phone: string;
  status: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  roles: string[];
  createdAt?: string;
}

/* ------------------------------------------------------------ address book */

export interface Address {
  id: number;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
}

export type AddressPayload = Omit<Address, 'id'>;
