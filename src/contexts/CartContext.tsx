import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// Types matching future Supabase schema
export interface CartItem {
  id: string;
  product_id: string;
  size: string;
  description: string;
  vendor: string;
  type: string;
  price: number;
  quantity: number;
  availability: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  preferredContact: "call" | "whatsapp" | "email";
  address?: string;
  city?: string;
  postalCode?: string;
  notes?: string;
}

export type FulfillmentMethod = "pickup" | "installation" | "delivery" | "shipping";

export interface CartState {
  items: CartItem[];
  fulfillment: FulfillmentMethod;
  customerInfo: CustomerInfo | null;
  guestId: string | null;
}

interface CartContextType {
  items: CartItem[];
  fulfillment: FulfillmentMethod;
  customerInfo: CustomerInfo | null;
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setFulfillment: (method: FulfillmentMethod) => void;
  setCustomerInfo: (info: CustomerInfo) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "kore_cart";

// Generate guest ID for anonymous cart tracking
const generateGuestId = () => `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [fulfillment, setFulfillmentState] = useState<FulfillmentMethod>("delivery");
  const [customerInfo, setCustomerInfoState] = useState<CustomerInfo | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);

  // Load cart from localStorage on mount (will sync with Supabase when connected)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed: CartState = JSON.parse(stored);
        setItems(parsed.items || []);
        setFulfillmentState(parsed.fulfillment || "delivery");
        setCustomerInfoState(parsed.customerInfo || null);
        setGuestId(parsed.guestId || generateGuestId());
      } else {
        setGuestId(generateGuestId());
      }
    } catch (e) {
      console.error("Failed to load cart:", e);
      setGuestId(generateGuestId());
    }
  }, []);

  // Persist cart to localStorage (and eventually Supabase)
  useEffect(() => {
    const cartState: CartState = { items, fulfillment, customerInfo, guestId };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartState));
  }, [items, fulfillment, customerInfo, guestId]);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    setItems((prev) => {
      // Check if item already exists
      const existing = prev.find((i) => i.product_id === item.product_id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === item.product_id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, { ...item, id: `cart_${Date.now()}` }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    } else {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
    }
  }, []);

  const setFulfillment = useCallback((method: FulfillmentMethod) => {
    setFulfillmentState(method);
  }, []);

  const setCustomerInfo = useCallback((info: CustomerInfo) => {
    setCustomerInfoState(info);
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCustomerInfoState(null);
    setFulfillmentState("delivery");
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        fulfillment,
        customerInfo,
        itemCount,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        setFulfillment,
        setCustomerInfo,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
