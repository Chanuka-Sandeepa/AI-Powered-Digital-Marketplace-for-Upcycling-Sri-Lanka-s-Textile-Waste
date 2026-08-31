import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface CartItem {
  materialId: string;
  title: string;
  imageUrl?: string;
  pricePerKg: number;
  availableKg: number; // max quantity available on the listing, for input clamping
  sellerName: string;
  quantityKg: number; // how much the buyer wants to purchase
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantityKg'>, quantityKg?: number) => void;
  removeItem: (materialId: string) => void;
  updateQuantity: (materialId: string, quantityKg: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = 'texcycle_buyer_cart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, 'quantityKg'>, quantityKg = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.materialId === item.materialId);
      if (existing) {
        const newQty = Math.min(existing.quantityKg + quantityKg, item.availableKg);
        return prev.map((i) => (i.materialId === item.materialId ? { ...i, quantityKg: newQty } : i));
      }
      return [...prev, { ...item, quantityKg: Math.min(quantityKg, item.availableKg) }];
    });
  }, []);

  const removeItem = useCallback((materialId: string) => {
    setItems((prev) => prev.filter((i) => i.materialId !== materialId));
  }, []);

  const updateQuantity = useCallback((materialId: string, quantityKg: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.materialId === materialId
          ? { ...i, quantityKg: Math.max(0.1, Math.min(quantityKg, i.availableKg)) }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.length;
  const totalAmount = items.reduce((sum, i) => sum + i.pricePerKg * i.quantityKg, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
