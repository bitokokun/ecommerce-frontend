import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { cart as cartApi } from "../api.js";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], total: "0.00", item_count: 0 });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await cartApi.get();
      setCart(data);
    } catch {
      /* keep whatever we had */
    } finally {
      setLoading(false);
    }
  }, []);

  // reload the cart whenever someone logs in or out, so the badge always
  // shows the cart that belongs to the person currently signed in
  useEffect(() => {
    refresh();
  }, [refresh, user?.id]);

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
