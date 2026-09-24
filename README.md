# Souk — Storefront (React frontend)

React storefront talking to the Django backend.

## Local setup
```bash
npm install
npm run dev
```
Runs at http://localhost:5173, proxying `/api` to `http://localhost:8000`
(your local Docker backend needs to be running).

## Production deploy (Render Static Site)
This is the one piece that was mid-setup when we last left off: create a
**Static Site** on Render pointed at this repo, with:
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Environment Variable**: `VITE_API_URL` = `https://ecommerce-backend-quog.onrender.com/api`
  (swap in your actual live backend URL — check the backend service's page
  on Render if unsure)

`src/api.js` reads `VITE_API_URL` at build time and falls back to the local
dev proxy path (`/api`) when it's unset, so the same code works in both
places without edits.

## What's wired up
- Product browsing + search (Home)
- Product detail with variant/quantity picker
- Cart (guest sessions AND logged-in users both work)
- Register / Login (JWT, stored in localStorage, auto-refreshed on 401)
- Checkout: pick or add a shipping address, place order
- Order history

## Known simplifications
- No cart-merging if a guest logs in mid-session
- No payment step yet — checkout creates a "pending" order
- No image upload UI — product images come from the Django admin
