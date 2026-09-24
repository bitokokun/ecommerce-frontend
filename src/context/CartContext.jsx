import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { cart as cartApi } from "../api.js";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], total: "0.00", item_count: 0 });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await cartApi.get();
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addItem(variantId, quantity = 1) {
    const data = await cartApi.addItem(variantId, quantity);
    setCart(data);
  }

  async function updateItem(itemId, quantity) {
    const data = await cartApi.updateItem(itemId, quantity);
    setCart(data);
  }

  async function removeItem(itemId) {
    const data = await cartApi.removeItem(itemId);
    setCart(data);
  }

  return (
    <CartContext.Provider value={{ cart, loading, addItem, updateItem, removeItem, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
