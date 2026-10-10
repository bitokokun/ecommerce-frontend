import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { seller } from "../api.js";
import { getSeen } from "../salesSeen.js";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const prevCount = useRef(cart.item_count || 0);
  const toast = useToast();
  const [newOrders, setNewOrders] = useState(0);
  const lastOrderCount = useRef(null);
  const isSeller = !!user && (user.role === "seller" || user.role === "admin");

  // close the mobile menu whenever the page changes
  useEffect(() => setOpen(false), [location.pathname]);

  // wiggle the cart badge when the number goes up
  useEffect(() => {
    const now = cart.item_count || 0;
    if (now > prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 550);
      prevCount.current = now;
      return () => clearTimeout(t);
    }
    prevCount.current = now;
  }, [cart.item_count]);

  // Sellers: ask the server how many orders arrived since they last looked.
  // Runs when the page changes (not on a timer, so the free server can sleep).
  useEffect(() => {
    if (!isSeller) {
      setNewOrders(0);
      lastOrderCount.current = null;
      return;
    }
    let cancelled = false;
    seller
      .receivedCount(getSeen(user.id))
      .then(({ count }) => {
        if (cancelled) return;
        if (lastOrderCount.current !== null && count > lastOrderCount.current) {
          toast(
            count - lastOrderCount.current === 1
              ? "You have a new order!"
              : `You have ${count - lastOrderCount.current} new orders!`
          );
        }
        lastOrderCount.current = count;
        setNewOrders(count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isSeller, user?.id, location.pathname]);

  // the Orders received page tells us when everything has been seen
  useEffect(() => {
    const clear = () => {
      setNewOrders(0);
      lastOrderCount.current = 0;
    };
    window.addEventListener("souk:orders-seen", clear);
    return () => window.removeEventListener("souk:orders-seen", clear);
  }, []);

  const linkClass = ({ isActive }) => (isActive ? "active" : "");

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          Souk<span>.</span>
        </Link>

        <button
          className={`menu-toggle ${open ? "open" : ""}`}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-links ${open ? "open" : ""}`}>
          <NavLink to="/" end className={linkClass}>
            Shop
          </NavLink>
          {user && (
            <NavLink to="/orders" className={linkClass}>
              Orders
            </NavLink>
          )}
          {user && (user.role === "seller" || user.role === "admin") && (
            <NavLink to="/sell" className={linkClass}>
              Sell
              {newOrders > 0 && (
                <span className="nav-dot" aria-label={`${newOrders} new orders`}>
                  {newOrders > 9 ? "9+" : newOrders}
                </span>
              )}
            </NavLink>
          )}
          {user ? (
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Log out ({user.username})
            </button>
          ) : (
            <NavLink to="/login" className={linkClass}>
              Log in
            </NavLink>
          )}
          <Link to="/cart" className={`cart-badge ${bump ? "bump" : ""}`}>
            Cart <span className="count">{cart.item_count || 0}</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
