# Souk — storefront (React)

The React front end for **Souk**, a multi-vendor e-commerce marketplace.
The full project description, design decisions and API overview are in the
backend repo: https://github.com/bitokokun/ecommerce-project

**Live demo:** https://ecommerce-frontend-7q36.onrender.com
(free hosting: the first load after a quiet period can take up to a minute)

## What's in here

- Shop with search, category filter chips, and product pages with variant and quantity picker
- Cart, checkout with a country dropdown, order history
- Register / log in with JWT (auto-refresh on expiry) and a Cloudflare Turnstile captcha
- Seller dashboard: listings, product form with variants and photo upload, orders received
- Animated, responsive design (mobile menu, 2-column grid on phones); animations switch off for people who prefer reduced motion

## Run it locally

```bash
npm install
npm run dev
```

Opens at http://localhost:5173 and sends `/api` requests to `http://localhost:8000`
(start the backend first, see the backend repo).

## Deploy (Render static site)

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment variables:
  - `VITE_API_URL` — the backend, ending in `/api`
  - `VITE_TURNSTILE_SITE_KEY` — public Turnstile site key (optional)

## Structure

```
src/
  api.js          all calls to the backend, with token refresh
  context/        auth, cart and toast state
  pages/          Home, ProductDetail, Cart, Checkout, Orders, Login, Register, Seller*
  components/     Navbar, ProductCard, Turnstile, Confetti, RequireSeller
```
