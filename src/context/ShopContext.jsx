import { createContext, useContext, useMemo, useState } from "react";

const ShopContext = createContext(null);

function ShopProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerView, setDrawerView] = useState("cart");

  const addToCart = (item) => {
    if (!item?.key) return false;
    let added = false;
    setCartItems((prev) => {
      if (prev.some((entry) => entry.key === item.key)) return prev;
      added = true;
      return [...prev, item];
    });
    return added;
  };

  const removeFromCart = (key) => {
    if (!key) return;
    setCartItems((prev) => prev.filter((item) => item.key !== key));
  };

  const toggleWishlist = (item) => {
    if (!item?.key) return "none";
    let status = "none";
    setWishlist((prev) => {
      if (prev.some((entry) => entry.key === item.key)) {
        status = "removed";
        return prev.filter((entry) => entry.key !== item.key);
      }
      status = "added";
      return [...prev, item];
    });
    return status;
  };

  const removeFromWishlist = (key) => {
    if (!key) return;
    setWishlist((prev) => prev.filter((item) => item.key !== key));
  };

  const openDrawer = (view = "cart") => {
    setDrawerView(view === "wishlist" ? "wishlist" : "cart");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const value = useMemo(
    () => ({
      cartItems,
      wishlist,
      addToCart,
      removeFromCart,
      toggleWishlist,
      removeFromWishlist,
      drawerOpen,
      drawerView,
      openDrawer,
      closeDrawer,
    }),
    [cartItems, wishlist, drawerOpen, drawerView]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
}

export { ShopProvider, useShop };
