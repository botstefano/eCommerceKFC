import { create } from "zustand";
import api from "../services/api";
import { Product } from "../types";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  orderType: "DELIVERY" | "PICKUP" | "DINE_IN" | "DRIVE_THRU";
  appliedPromoCode: string | null;
  discount: number;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  setOrderType: (type: CartState["orderType"]) => void;
  applyPromo: (code: string, discount: number) => void;
  clearPromo: () => void;
  totalItems: () => number;
  subtotal: () => number;
  loadFromServer: () => Promise<void>;
  syncToServer: () => Promise<void>;
}

const STORAGE_KEY = "kfc_cart";

function persist(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

function loadInitial(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const useCartStore = create<CartState>((set, get) => ({
  items: loadInitial(),
  orderType: "DELIVERY",
  appliedPromoCode: null,
  discount: 0,

  addItem: (product, quantity = 1) => {
    const items = [...get().items];
    const existing = items.find((i) => i.product.id === product.id);
    if (existing) existing.quantity += quantity;
    else items.push({ product, quantity });
    persist(items);
    set({ items });
  },

  updateQuantity: (productId, quantity) => {
    let items = [...get().items];
    if (quantity <= 0) {
      items = items.filter((i) => i.product.id !== productId);
    } else {
      const item = items.find((i) => i.product.id === productId);
      if (item) item.quantity = quantity;
    }
    persist(items);
    set({ items });
  },

  removeItem: (productId) => {
    const items = get().items.filter((i) => i.product.id !== productId);
    persist(items);
    set({ items });
  },

  clear: () => {
    persist([]);
    set({ items: [], appliedPromoCode: null, discount: 0 });
  },

  setOrderType: (type) => set({ orderType: type }),

  applyPromo: (code, discount) => set({ appliedPromoCode: code, discount }),
  clearPromo: () => set({ appliedPromoCode: null, discount: 0 }),

  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  subtotal: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

  // Pulls the authoritative cart from the server (used right after login)
  loadFromServer: async () => {
    try {
      const { data } = await api.get("/cart");
      const items: CartItem[] = data.items
        .filter((i: any) => i.product)
        .map((i: any) => ({ product: i.product, quantity: i.quantity }));
      persist(items);
      set({ items });
    } catch {
      /* if it fails, keep whatever is local */
    }
  },

  // Pushes the current (likely guest) cart up to the server, merging by productId
  syncToServer: async () => {
    const items = get().items;
    if (items.length === 0) return;
    try {
      const { data } = await api.put("/cart/sync", {
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      });
      const hydrated: CartItem[] = data.items
        .filter((i: any) => i.product)
        .map((i: any) => ({ product: i.product, quantity: i.quantity }));
      persist(hydrated);
      set({ items: hydrated });
    } catch {
      /* non-blocking */
    }
  },
}));
