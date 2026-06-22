export type Role = "CUSTOMER" | "ADMIN";
export type LoyaltyLevel = "SILVER" | "GOLD" | "PLATINUM";
export type OrderType = "DELIVERY" | "PICKUP" | "DINE_IN" | "DRIVE_THRU";
export type OrderStatus = "PENDING" | "PREPARING" | "READY" | "ON_THE_WAY" | "DELIVERED" | "CANCELLED" | "REFUNDED";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: Role;
  loyaltyPoints: number;
  loyaltyLevel: LoyaltyLevel;
  preferences?: { spicyPreference?: "spicy" | "no_spicy" };
  addresses?: Address[];
}

export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  reference?: string;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  dayPart?: "morning" | "lunch" | "afternoon" | "night";
  groupSize?: "individual" | "pareja" | "familia" | "grupo_grande";
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  nutritionalInfo: NutritionalInfo;
  spicyLevel: number;
  allergens: string[];
  preparationTime: number;
  isCombo?: boolean;
}

export interface CartLineItem {
  productId: string;
  quantity: number;
  product?: Product;
}

export interface Order {
  id: string;
  userId: string;
  items: { productId: string; name: string; price: number; quantity: number }[];
  total: number;
  status: OrderStatus;
  type: OrderType;
  address?: any;
  scheduledTime?: string;
  specialInstructions?: string;
  paymentMethod?: string;
  pointsEarned?: number;
  createdAt: string;
}

export interface Promotion {
  id: string;
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  validUntil: string;
  usageLimit: number;
  usedCount: number;
  active: boolean;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  openTime: string;
  closeTime: string;
  phone?: string;
  distanceKm?: number;
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user?: { name: string };
}

export interface Recommendation {
  product: Product;
  score: number;
  reasons: string[];
}
