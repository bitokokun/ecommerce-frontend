import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Cart from "./pages/Cart.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Checkout from "./pages/Checkout.jsx";
import Orders from "./pages/Orders.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
      </Routes>
      <footer>Souk — a portfolio storefront built on a Django REST backend.</footer>
    </>
  );
}
