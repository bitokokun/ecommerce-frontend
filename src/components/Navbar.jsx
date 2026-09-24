import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          Souk<span>.</span>
        </Link>
        <div className="nav-links">
          <Link to="/">Shop</Link>
          {user && <Link to="/orders">Orders</Link>}
          <Link to="/cart" className="cart-badge">
            Cart · {cart.item_count || 0}
          </Link>
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
            <Link to="/login">Log in</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
