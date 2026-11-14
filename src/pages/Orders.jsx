import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { orders as ordersApi } from "../api.js";
import Confetti from "../components/Confetti.jsx";
import OrderCard from "../components/OrderCard.jsx";

export default function Orders() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();
  const justPlaced = location.state?.justPlaced;

  useEffect(() => {
    ordersApi
      .list()
      .then((data) => setList(data.results || data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container" style={{ padding: "40px 20px" }}>Loading…</div>;

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      {justPlaced && <Confetti />}
      <h1 style={{ fontFamily: "var(--display)", marginTop: 40 }}>Your orders</h1>
      {justPlaced && (
        <p className="success-banner" style={{ marginBottom: 20 }}>
          Order #{justPlaced} placed. Thank you!
        </p>
      )}
      {error && <p className="error-banner">{error}</p>}
      {!error && list.length === 0 ? (
        <div className="empty-state">
          No orders yet. <Link to="/">Pick something from the shop.</Link>
        </div>
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
