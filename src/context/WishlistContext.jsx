import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { wishlist as wishApi } from "../api.js";
import { useAuth } from "./AuthContext.jsx";
import { useToast } from "./ToastContext.jsx";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [ids, setIds] = useState(() => new Set());

  useEffect(() => {
    if (!user) {
      setIds(new Set());
      return;
    }
    let cancelled = false;
    wishApi
      .ids()
      .then((list) => !cancelled && setIds(new Set(list)))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const toggle = useCallback(
    async (productId) => {
      if (!user) return false;
      const had = ids.has(productId);
      setIds((s) => {
        const n = new Set(s);
        had ? n.delete(productId) : n.add(productId);
        return n;
      });
      try {
        await (had ? wishApi.remove(productId) : wishApi.add(productId));
        toast(had ? "Removed from wishlist" : "Saved to wishlist");
      } catch (e) {
        setIds((s) => {
          const n = new Set(s);
          had ? n.add(productId) : n.delete(productId);
          return n;
        });
        toast(e.message, "error");
      }
      return true;
    },
    [user, ids, toast]
  );

  return (
    <WishlistContext.Provider value={{ ids, toggle }}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
