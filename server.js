// server.js
// A small backend server that talks to Stripe.
// It serves your website (the "public" folder) and creates Stripe Checkout Sessions.

require('dotenv').config();
const express = require('express');
const path = require('path');

// Make sure the secret key is set before we even start.
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ Missing STRIPE_SECRET_KEY in your .env file. See .env.example.');
  process.exit(1);
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 4242;

// ------------------------------------------------------------------
// 1. YOUR PRODUCTS
// ------------------------------------------------------------------
// Edit this list to match what you're selling.
// IMPORTANT: prices are defined here on the server (not trusted from
// the browser) so nobody can tamper with prices in the checkout.
// "price" is in the smallest currency unit (cents for USD).
const PRODUCTS = [
  {
    id: 'coconutlatte',
    name: 'coconut latte',
    description: 'House espresso, steamed coconut milk, light and creamy.',
    price: 1000, // RM 10.00
    currency: 'myr',
    image: 'https://i.imgur.com/6uNDZBc.png',
    category: 'beverage',
    available: true,
  },
  {
    id: 'CalamansiJuice',
    name: 'Calamansi Juice',
    description: 'Tart calamansi, soda, a little honey, plenty of ice.',
    price: 400, // RM 4.00
    currency: 'myr',
    image: 'https://i.imgur.com/RkDQ7Ce.jpeg',
    category: 'beverage',
    available: true,
  },
  {
    id: 'CoconutJuice',
    name: 'Coconut Juice',
    description: 'Young coconut water, served straight from the shell.',
    price: 500, // RM 5.00
    currency: 'myr',
    image: 'https://i.imgur.com/VuafO4g.jpeg',
    category: 'beverage',
    available: true,
  },
  {
    id: 'matcha',
    name: 'Matcha Latte',
    description: 'Ceremonial-grade matcha, whisked and steamed with milk.',
    price: 1000, // RM 10.00
    currency: 'myr',
    image: 'https://i.imgur.com/T2PH1NR.jpeg',
    category: 'beverage',
    available: true,
  },
 {
    id: 'Americano',
    name: 'Americano',
    description: 'Rich, double-shot espresso diluted with hot water for a smooth, bold coffee experience with a clean finish.',
    price: 500, // RM 5.00
    currency: 'myr',
    image: 'https://i.imgur.com/4p0PkwY.png',
    category: 'beverage',
    available: true,
  },
 {
    id: 'Capucino',
    name: 'Capucino',
    description: 'Dark, full-bodied espresso topped with equal parts steamed milk and a thick, velvety layer of warm foam.',
    price: 900, // RM 9.00
    currency: 'myr',
    image: 'https://i.imgur.com/0EhrVAW.png',
    category: 'beverage',
    available: true,
  },

{
    id: 'CheeseCake',
    name: 'Cheese Cake',
    description: 'Creamy, velvety-smooth cheesecake built on a buttery graham cracker crust with a rich, balanced flavor.',
    price: 1000, // RM 10.00
    currency: 'myr',
    image: 'https://i.imgur.com/PqIPnj7.png',
    category: 'food',
    available: true,
  },
{
    id: 'saladroll',
    name: 'Salad roll',
    description: 'Crisp seasonal vegetables and fresh herbs wrapped in translucent rice paper, served with a savory dipping sauce.',
    price: 1500, // RM 15.00
    currency: 'myr',
    image: 'https://i.imgur.com/kkM8o9H.png',
    category: 'food',
    available: false,
  },
  {
    id: 'mookata',
    name: 'Set Mookata',
    description: 'Enjoy Mookata with exclusive view',
    price: 4000, // RM 40.00
    currency: 'myr',
    image: 'https://i.imgur.com/xP0nvgF.jpeg',
    category: 'food',
    available: true,
  },
  {
    id: 'shop-rental',
    name: 'Shop Space Rental',
    description: 'Monthly rental for shop space at our location.',
    price: 50000, // RM 500.00/month in your currency's smallest unit (e.g. RM 500/month)
    currency: 'myr',
    image: 'https://i.imgur.com/9IaLi5v.jpeg',
    recurring: { interval: 'month' }, // <-- this is what makes it a subscription
    available: true,
  },
];


// ------------------------------------------------------------------
// 2. SERVE THE WEBSITE
// ------------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));

// ------------------------------------------------------------------
// WEBHOOK — Stripe notifies us here when a payment succeeds or fails.
// IMPORTANT: this route must come BEFORE express.json() below, and use
// express.raw() instead, because Stripe needs the exact raw request
// body (unparsed) to verify the signature and confirm it's really Stripe.
// ------------------------------------------------------------------
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
 
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`⚠️  Webhook signature check failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
 
  if (event.type === 'charge.succeeded') {
    const charge = event.data.object;
    const amount = (charge.amount / 100).toFixed(2);
    console.log(`✅ CHARGE SUCCEEDED — ${amount} ${charge.currency.toUpperCase()} from ${charge.billing_details?.email || 'unknown email'}`);
  } else if (event.type === 'charge.failed') {
    const charge = event.data.object;
    console.log(`❌ CHARGE FAILED — Reason: ${charge.failure_message || 'unknown reason'}`);
  }
 
  res.json({ received: true });
});

app.use(express.json());

// Give the browser the product list (without needing to hardcode it twice)
app.get('/api/products', (req, res) => {
  res.json(PRODUCTS.filter((p) => !p.recurring));
});

// Rental/subscription items only
app.get('/api/rental', (req, res) => {
  res.json(PRODUCTS.filter((p) => p.recurring));
});


// ------------------------------------------------------------------
// 3. CREATE A CHECKOUT SESSION
// ------------------------------------------------------------------
// The browser sends us which product IDs + quantities were selected.
// We look up the REAL price on the server and build the Stripe session.
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { items } = req.body; // items = [{ id: 'tshirt', quantity: 2 }, ...]

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items were selected.' });
    }

    const line_items = items.map((item) => {
      const product = PRODUCTS.find((p) => p.id === item.id);
      if (!product) {
        throw new Error(`Unknown product id: ${item.id}`);
      }
      if (product.available === false) {
        throw new Error(`${product.name} is sold out and can't be ordered right now.`);
      }
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

      // Stripe needs an image URL that's publicly reachable on the internet.
      // Local image paths (like /images/tshirt.jpg) only work on your own
      // computer, so we only pass them to Stripe if they're a real http(s) link.
      const isPublicImage = product.image && product.image.startsWith('http');

      return {
        price_data: {
          currency: product.currency,
          product_data: {
            name: product.name,
            description: product.description,
            ...(isPublicImage ? { images: [product.image] } : {}),
          },
          unit_amount: product.price,
          // If this product has a "recurring" field, mark this price as
          // recurring too (e.g. { interval: 'month' }) — this is what
          // turns it into a subscription charge instead of a one-time one.
          ...(product.recurring ? { recurring: product.recurring } : {}),
        },
        quantity,
      };
    });

   // A Checkout Session must be told upfront whether it's a one-time
    // "payment" or a repeating "subscription". If ANY item in the cart
    // is a subscription product, the whole session must run in
    // subscription mode (Stripe still allows mixing in one-time items
    // alongside it, so this is safe even with a mixed cart).
    const hasSubscriptionItem = items.some((item) => {
      const product = PRODUCTS.find((p) => p.id === item.id);
      return product && product.recurring;
    });
    const mode = hasSubscriptionItem ? 'subscription' : 'payment';

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items,
      success_url: `${req.protocol}://${req.get('host')}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/cancel.html`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creating checkout session:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------
// 4. (OPTIONAL) LOOK UP A COMPLETED SESSION FOR THE SUCCESS PAGE
// ------------------------------------------------------------------
app.get('/api/session-status', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
    res.json({
      status: session.payment_status,
      customer_email: session.customer_details ? session.customer_details.email : null,
      amount_total: session.amount_total,
      currency: session.currency,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running! Open http://localhost:${PORT} in your browser.`);
});
