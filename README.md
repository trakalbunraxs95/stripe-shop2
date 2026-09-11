# My Simple Shop (Stripe Checkout)

A tiny website that sells a few products and takes payment through **Stripe Checkout**
(Stripe's own secure, hosted payment page — you never have to handle card numbers yourself).

No prior web-dev experience needed. Just follow the steps below in order.

---

## What's inside

```
stripe-shop/
├── server.js          ← the backend (talks to Stripe)
├── package.json       ← list of code libraries the project needs
├── .env.example       ← template for your secret key
└── public/
    ├── index.html      ← the shop page people see
    ├── success.html    ← shown after a successful payment
    └── cancel.html     ← shown if someone cancels checkout
```

---

## Step 1 — Install Node.js

This project runs on **Node.js** (a way to run JavaScript outside a browser).

1. Go to https://nodejs.org
2. Download and install the **LTS** version for your operating system.
3. To check it worked, open a terminal (Mac: "Terminal" app, Windows: "Command Prompt")
   and type:
   ```
   node --version
   ```
   You should see something like `v20.x.x`.

## Step 2 — Get your Stripe keys

1. Create a free account at https://dashboard.stripe.com/register
2. Once logged in, make sure you're in **Test mode** (toggle in the top right of the dashboard).
   Test mode lets you try everything with fake card numbers — no real money moves.
3. Go to https://dashboard.stripe.com/test/apikeys
4. Copy the **Secret key** (starts with `sk_test_...`). Keep it private — never share it publicly.

## Step 3 — Set up the project

1. Open a terminal and go into the project folder:
   ```
   cd path/to/stripe-shop
   ```
2. Install the required libraries:
   ```
   npm install
   ```
3. Create your own `.env` file from the template:
   ```
   cp .env.example .env
   ```
   (On Windows, just make a copy of `.env.example`, rename it to `.env`.)
4. Open `.env` in any text editor and paste your Stripe secret key:
   ```
   STRIPE_SECRET_KEY=sk_test_your_real_key_here
   ```

## Step 4 — Run it!

```
npm start
```

You should see:
```
✅ Server running! Open http://localhost:4242 in your browser.
```

Open that link in your browser. You'll see your shop with product cards.

## Step 5 — Test a payment

1. Pick a quantity for one or more products and click **Checkout**.
2. You'll be taken to Stripe's real checkout page (still in test mode).
3. Use one of Stripe's test cards:
   - Card number: `4242 4242 4242 4242`
   - Expiry: any future date (e.g. `12/34`)
   - CVC: any 3 digits (e.g. `123`)
   - ZIP: any 5 digits
4. Complete the payment — you'll be redirected to your success page.
5. Check your Stripe Dashboard → **Payments** to see the test transaction appear.

---

## Customizing your products

Open `server.js` and edit the `PRODUCTS` list near the top:

```js
const PRODUCTS = [
  {
    id: 'tshirt',
    name: 'Classic T-Shirt',
    description: 'Soft cotton t-shirt, unisex fit.',
    price: 2500, // this is in CENTS, so 2500 = $25.00
    currency: 'usd',
    image: 'https://your-image-url.com/tshirt.jpg',
  },
  // add more products here...
];
```

Prices are defined only on the server so nobody can tamper with them in the browser — that part is already handled for you.

---

## Going live (accepting real payments)

1. In the Stripe Dashboard, complete your business details and activate your account
   (Settings → Activate your account).
2. Switch to **Live mode** and grab your **live** secret key (starts with `sk_live_...`).
3. Replace the key in your `.env` file — but do this only on your real server, not on your
   personal computer, and never commit `.env` to any public code repository.
4. Deploy the project to a hosting service that runs Node.js, for example:
   - Render (https://render.com) — free tier, beginner-friendly
   - Railway (https://railway.app)
   - Fly.io (https://fly.io)

   In all of these, you'll set `STRIPE_SECRET_KEY` as an environment variable in their
   dashboard (instead of a `.env` file) and set the start command to `npm start`.

## Optional next steps

- Add a Stripe **webhook** to reliably know when a payment succeeds (useful once you want
  to trigger things like sending a confirmation email or updating inventory). Stripe's docs:
  https://docs.stripe.com/webhooks
- Add real product photos instead of the placeholder images.
- Add shipping address collection: in `server.js`, add
  `shipping_address_collection: { allowed_countries: ['US', 'CA'] }` to the
  `stripe.checkout.sessions.create()` call.

---

## Troubleshooting

- **"Missing STRIPE_SECRET_KEY" error on startup** → you haven't created `.env` or it's empty. Recheck Step 3.
- **Checkout button does nothing** → open your browser's console (right-click → Inspect → Console tab) to see the error message.
- **Port already in use** → change `PORT=4242` in `.env` to another number, like `5000`.
