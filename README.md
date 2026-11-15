# Souk storefront

The React front end for [Souk](https://github.com/bitokokun/ecommerce-project), a multi-vendor marketplace. It talks to the Django API in that repo and is deployed as a static site on Render.

**Live:** https://ecommerce-frontend-7q36.onrender.com

## Running it

```bash
npm install
npm run dev
```

Requests go to `/api` unless you say otherwise. For local work, point the app at your API with a `.env.local` file:

```
VITE_API_URL=http://localhost:8000/api
```

| Variable | What it does |
|---|---|
| `VITE_API_URL` | Base URL of the API. Defaults to `/api` |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key for the signup form. Leave it empty to skip the captcha locally |
| `VITE_COOKIE_AUTH` | Set to `true` only if the API runs with `AUTH_REFRESH_COOKIE=True` and shares a domain with this site |

Other commands:

```bash
npm run build        # production build into dist/
node --test          # unit tests for the API client and variant helpers
```

## Layout

```
src/
  api.js            every request to the API, token handling, error messages
  context/          auth, cart, wishlist and toast providers
  pages/            one file per route
  components/       cards, skeletons, empty states, buttons, order cards
  *.css             styles, in the order main.jsx loads them
```

Pages worth opening first are `Home.jsx` (hero, category tiles, filters, grid), `Cart.jsx` and `Checkout.jsx`, `Account.jsx` (profile, addresses, orders, wishlist, security) and `SellerDashboard.jsx` with the other `Seller*` pages.

## Things that work in a particular way

**Tokens.** The access token is kept in memory only. The refresh token is in local storage by default, or in an httpOnly cookie when cookie mode is on. Refresh tokens rotate, so `api.js` shares one in-flight refresh between parallel requests; if two refreshes raced, the second would use a token that had just been revoked and log the person out. When a refresh is rejected the app clears its state and signs out.

**Checkout.** The page makes one random key per attempt and sends it as `Idempotency-Key`. A double click or a retry after a dropped connection returns the same order instead of creating a second.

**Loading, empty and error states.** Pages use the shared pieces in `components/` instead of one-off markup: `Skeletons.jsx` for placeholders that match each layout, `EmptyState.jsx` for empty and failed lists (always with a button to go somewhere), and `LoadingButton.jsx` for actions that take a moment.

**Toasts.** `const toast = useToast()` gives `toast.success(...)`, `toast.error(...)` and `toast.info(...)`. Identical messages don't stack, errors stay on screen longer, and hovering pauses the timer.

**Styles.** The CSS is a stack of five files that `main.jsx` imports in order, and later files override earlier ones: `styles.css`, `premium.css`, `souk2.css` (palette and variables), `storefront.css` (home and product cards) and `polish.css` (states, spacing, mobile). The colours are sage `#9CAF88`, warm linen `#F7F5EF` and tomato `#E8412C`, defined as variables in `souk2.css`. Folding these into fewer files would be a good cleanup.

## Deploying

On Render this is a static site. The build command is `npm install && npm run build` and the publish directory is `dist`. Set `VITE_API_URL` and `VITE_TURNSTILE_SITE_KEY` in the site's environment before building, because Vite bakes them in.

`.github/workflows/ci.yml` runs the tests and a production build on every push and pull request. If a `RENDER_DEPLOY_HOOK` secret exists, it also triggers a deploy from `main` once those pass.
