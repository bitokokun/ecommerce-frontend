import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { CartSkeleton } from "../components/Skeletons.jsx";

const MAX_QUANTITY = 99;

export default function Cart() {
  const { cart, loading, updateItem, removeItem } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState(null);

  async function changeQuantity(item, next) {
    if (next < 1 || next > MAX_QUANTITY || busyId) return;
    setBusyId(item.id);
    try {
      await updateItem(item.id, next);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(item) {
    if (busyId) return;
    setBusyId(item.id);
    try {
      await removeItem(item.id);
      toast.info(`${item.product_name} removed from your cart.`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading && !cart.items?.length) {
    return (
      <div className="container cart-page">
        <CartSkeleton />
      </div>
    );
  }

  if (!cart.items?.length) {
    return (
      <div className="container cart-page">
        <EmptyState
          icon="cart"
          title="Your cart is empty"
          text="Browse the shop and add something you like. It will wait for you here."
          action={{ label: "Continue shopping", to: "/" }}
        />
      </div>
    );
  }

  const lineCount = cart.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="container cart-page">
      <header className="page-head">
        <h1>Your cart</h1>
        <p className="muted">
          {lineCount} {lineCount === 1 ? "item" : "items"}
        </p>
      </header>

      <div className="cart-layout">
        <ul className="cart-list">
          {cart.items.map((item) => (
            <li className={`cart-item${busyId === item.id ? " is-busy" : ""}`} key={item.id}>
              <div className="cart-item-main">
                <strong>{item.product_name}</strong>
                <span className="sku-line">{item.sku}</span>
                <span className="cart-item-unit">${item.unit_price} each</span>
              </div>
              <div className="stepper" role="group" aria-label={`Quantity of ${item.product_name}`}>
                <button
                  type="button"
                  aria-label={`Decrease quantity of ${item.product_name}`}
                  disabled={item.quantity <= 1 || busyId === item.id}
                  onClick={() => changeQuantity(item, item.quantity - 1)}
                >
                  −
                </button>
                <span className="stepper-value" aria-live="polite">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  aria-label={`Increase quantity of ${item.product_name}`}
                  disabled={item.quantity >= MAX_QUANTITY || busyId === item.id}
                  onClick={() => changeQuantity(item, item.quantity + 1)}
                >
                  +
                </button>
              </div>
              <div className="cart-item-total">
                <span className="mono">${item.subtotal}</span>
                <button type="button" className="btn-danger-link" disabled={busyId === item.id} onClick={() => remove(item)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>

        <aside className="cart-aside">
          <div className="cart-summary">
            <span>Total</span>
            <span>${cart.total}</span>
          </div>
          <button
            type="button"
            className="btn btn-saffron btn-block"
            onClick={() => navigate(user ? "/checkout" : "/login?next=/checkout")}
          >
            {user ? "Proceed to checkout" : "Log in to check out"}
          </button>
          <Link to="/" className="cart-continue">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
