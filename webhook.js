// webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('./models/User');

module.exports = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.mode === 'subscription') {
      const user = await User.findById(session.metadata.userId);
      if (user) {
        const plan = session.amount_total === 999 ? 'basic' : 'premium'; // 9.99 → 999 cents
        user.subscription = {
          plan,
          status: 'active',
          stripeSubscriptionId: session.subscription,
          stripeCustomerId: session.customer
        };
        await user.save();
        console.log(`Subscription activated: ${user.email} → ${plan}`);
      }
    }
  }

  res.json({received: true});
};