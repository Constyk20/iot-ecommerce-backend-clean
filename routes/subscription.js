// routes/subscription.js  ← FINAL VERSION (Test Mode Ready)
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const auth = require('../middleware/auth');

// Protect all routes
router.use(auth);

// Create Checkout Session (Easiest & Recommended for students)
router.post('/create-checkout', async (req, res) => {
  try {
    const { plan } = req.body; // 'basic' or 'premium'
    const user = await User.findById(req.user.id);

    const priceId = plan === 'basic'
      ? process.env.STRIPE_PRICE_BASIC
      : process.env.STRIPE_PRICE_PREMIUM;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: 'https://your-flutter-app-success.com?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://your-flutter-app-cancel.com',
      metadata: { userId: user._id.toString() }
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current subscription
router.get('/status', async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({
    plan: user.subscription.plan || 'none',
    status: user.subscription.status || 'none'
  });
});

module.exports = router;