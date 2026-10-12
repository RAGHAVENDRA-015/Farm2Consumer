export type Role = 'CUSTOMER' | 'FARMER' | 'ADMIN';

export type ProductUnit = 'KG' | 'GRAM' | 'PIECE' | 'DOZEN' | 'BUNCH' | 'LITRE';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type PaymentProvider = 'RAZORPAY' | 'CASH_ON_DELIVERY';

export interface User {
  id: string;
  firebaseUid: string;
  email: string | null;
  phone: string | null;
  name: string;
  role: Role;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  farmerProfile?: FarmerProfile | null;
  addresses?: Address[];
}

export interface FarmerProfile {
  id: string;
  userId: string;
  farmName: string;
  bio: string | null;
  address: string | null;
  city: string;
  state: string;
  pincode: string;
  farmLatitude: number | null;
  farmLongitude: number | null;
  isApproved: boolean;
  totalSales: number;
  rating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  user?: Partial<User>;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  cloudinaryPublicId: string | null;
  displayOrder: number;
}

export interface Product {
  id: string;
  farmerId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  unit: ProductUnit;
  stockQuantity: number;
  minOrderQuantity: number;
  harvestDate: string | null;
  isOrganic: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  images: ProductImage[];
  farmer?: {
    id: string;
    farmName: string;
    city: string;
    state: string;
    rating: number;
    ratingCount: number;
    isApproved: boolean;
    user?: {
      name: string;
      email: string | null;
      avatarUrl: string | null;
    };
  };
  reviews?: Review[];
  _count?: {
    reviews: number;
  };
}

export interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export interface OrderItem {
  id: string;
  sellerOrderId?: string;
  productId: string;
  productName?: string;
  quantity: number;
  price?: number;
  priceAtOrder?: number;
  unit?: string;
  subtotal: number;
  product?: Product;
}

export interface SellerOrder {
  id: string;
  orderId: string;
  farmerId: string;
  subtotal: number;
  commission?: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  orderItems?: OrderItem[];
  farmer?: FarmerProfile;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  provider: PaymentProvider;
  status: PaymentStatus;
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  addressId: string;
  totalAmount: number;
  deliveryCharge: number;
  status: OrderStatus;
  deliveryAddress: any;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Partial<User>;
  sellerOrders: SellerOrder[];
  payments?: Payment[];
  address?: Address;
}

export interface Review {
  id: string;
  userId?: string;
  customerId?: string;
  productId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id?: string;
    name: string;
  };
  user?: {
    name: string;
    avatarUrl: string | null;
  };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  error?: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
}

export interface RazorpayOrderResponse {
  razorpayOrderId: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  keyId: string;
  receipt?: string;
}

export interface RazorpayVerificationPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  addressId?: string;
  deliveryAddress?: any;
  notes?: string;
  paymentMethod?: string;
}

export interface CreateCodOrderPayload {
  addressId?: string;
  deliveryAddress?: any;
  notes?: string;
  paymentProvider?: PaymentProvider;
}
