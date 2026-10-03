import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const prevCount = useRef(cart.item_count || 0);

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
