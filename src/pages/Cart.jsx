import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Cart() {
  const { cart, updateItem, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!cart.items?.length) {
    return (
      <div className="container cart-page">
        <div className="empty-state">
          Your cart is empty. <Link to="/">Go find something.</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <h1 style={{ fontFamily: "var(--display)" }}>Your cart</h1>

      {cart.items.map((item) => (
        <div className="cart-row" key={item.id}>
          <div>
            <strong>{item.product_name}</strong>
            <div className="sku-line">{item.sku}</div>
          </div>
          <div className="sku-line">${item.unit_price}</div>
          <input
            className="qty-input"
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => updateItem(item.id, Number(e.target.value))}
          />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--mono)", marginBottom: 6 }}>${item.subtotal}</div>
            <button className="btn-danger-link" onClick={() => removeItem(item.id)}>
              Remove
            </button>
          </div>
        </div>
      ))}

      <div className="cart-summary">
        <span>Total</span>
        <span>${cart.total}</span>
      </div>

      <div style={{ marginTop: 28 }}>
        {user ? (
          <button className="btn btn-saffron" onClick={() => navigate("/checkout")}>
            Proceed to checkout
          </button>
        ) : (
          <button className="btn btn-saffron" onClick={() => navigate("/login?next=/checkout")}>
            Log in to check out
          </button>
        )}
      </div>
    </div>
  );
}
