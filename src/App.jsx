import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Cart from "./pages/Cart.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Checkout from "./pages/Checkout.jsx";
import Orders from "./pages/Orders.jsx";
import SellerDashboard from "./pages/SellerDashboard.jsx";
import SellerProductForm from "./pages/SellerProductForm.jsx";
import RequireSeller from "./components/RequireSeller.jsx";

export default function App() {
  const location = useLocation();
  return (
    <>
      <Navbar />
      {/* keyed by path so each page fades in when you navigate */}
      <main className="page" key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route
            path="/sell"
            element={
              <RequireSeller>
                <SellerDashboard />
              </RequireSeller>
            }
          />
          <Route
            path="/sell/:id"
            element={
              <RequireSeller>
                <SellerProductForm />
              </RequireSeller>
            }
          />
        </Routes>
      </main>
      <footer>Souk is a portfolio storefront built on a Django REST backend.</footer>
    </>
  );
}
