import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { orders as ordersApi } from "../api.js";
import Confetti from "../components/Confetti.jsx";
import EmptyState from "../components/EmptyState.jsx";
import OrderCard from "../components/OrderCard.jsx";
import { OrdersSkeleton } from "../components/Skeletons.jsx";

export default function Orders() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const location = useLocation();
  const justPlaced = location.state?.justPlaced;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    ordersApi
      .list()
      .then((data) => !cancelled && setList(data.results || data))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <div className="container orders-page">
      {justPlaced && <Confetti />}
      <header className="page-head">
        <h1>Your orders</h1>
      </header>
      {justPlaced && (
        <p className="success-banner" role="status">
          Order #{justPlaced} placed. Thank you!
        </p>
      )}
      {loading ? (
        <OrdersSkeleton />
      ) : error ? (
        <EmptyState
          icon="alert"
          title="We couldn't load your orders"
          text={error}
          action={{ label: "Try again", onClick: () => setReloadKey((k) => k + 1) }}
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon="orders"
          title="No orders yet"
          text="When you place an order, you can follow it here from checkout to delivery."
          action={{ label: "Start shopping", to: "/" }}
        />
      ) : (
        list.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onChange={(n) => setList((l) => l.map((x) => (x.id === n.id ? n : x)))}
          />
        ))
      )}
    </div>
  );
}
