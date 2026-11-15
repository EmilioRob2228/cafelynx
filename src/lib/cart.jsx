import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const KEY = "cl_cart";

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
};

export const lineKey = (itemId, label) => `${itemId}|${label || ""}`;

export function CartProvider({ children }) {
  const [lines, setLines] = useState(read);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [lines]);

  const value = useMemo(() => {
    const add = (item, option) =>
      setLines((prev) => {
        const key = lineKey(item.id, option.label);
        const found = prev.find((l) => l.key === key);
        if (found) return prev.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + 1) } : l));
        return [...prev, { key, itemId: item.id, name: item.name, label: option.label || "", price: option.price, qty: 1 }];
      });
    const setQty = (key, qty) =>
      setLines((prev) => (qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty: Math.min(20, qty) } : l))));
    const clear = () => setLines([]);
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
    return { lines, add, setQty, clear, count, total };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
