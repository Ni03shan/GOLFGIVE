const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

let stripe;
try {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} catch (e) {
  console.warn('Stripe not configured:', e.message);
}

const PLANS = {
  monthly: { priceId: process.env.STRIPE_MONTHLY_PRICE_ID, name: 'Monthly Plan', amount: 999 },
  yearly: { priceId: process.env.STRIPE_YEARLY_PRICE_ID, name: 'Yearly Plan', amount: 8999 }
};

router.post('/create-checkout', protect, async (req, res) => {
  if (!stripe) return res.status(503).json({ success: false, message: 'Payment system not configured.' });

  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ success: false, message: 'Invalid plan.' });

    const user = req.user;
    let customerId = user.subscription.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName,
        metadata: { userId: user._id.toString() }
      });
      customerId = customer.id;
      user.subscription.stripeCustomerId = customerId;
      await user.save({ validateBeforeSave: false });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.CLIENT_URL}/subscribe?cancelled=true`,
      metadata: { userId: user._id.toString(), plan }
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payments/webhook — Stripe webhook handler
router.post('/webhook', async (req, res) => {
  if (!stripe) return res.status(503).send('Payment system not configured.');

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, plan } = session.metadata;
        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        await User.findByIdAndUpdate(userId, {
          'subscription.status': 'active',
          'subscription.plan': plan,
          'subscription.stripeSubscriptionId': subscription.id,
          'subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000),
          'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
          'subscription.cancelAtPeriodEnd': false
        });
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription);
          await User.findOneAndUpdate(
            { 'subscription.stripeSubscriptionId': invoice.subscription },
            {
              'subscription.status': 'active',
              'subscription.currentPeriodStart': new Date(sub.current_period_start * 1000),
              'subscription.currentPeriodEnd': new Date(sub.current_period_end * 1000)
            }
          );
        }
        break;
      }
      case 'customer.subscription.deleted': {
        await User.findOneAndUpdate(
          { 'subscription.stripeSubscriptionId': event.data.object.id },
          { 'subscription.status': 'cancelled', 'subscription.stripeSubscriptionId': null }
        );
        break;
      }
      case 'invoice.payment_failed': {
        await User.findOneAndUpdate(
          { 'subscription.stripeSubscriptionId': event.data.object.subscription },
          { 'subscription.status': 'lapsed' }
        );
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/cancel — cancel subscription
router.post('/cancel', protect, async (req, res) => {
  if (!stripe) return res.status(503).json({ success: false, message: 'Payment system not configured.' });

  try {
    const user = req.user;
    if (!user.subscription.stripeSubscriptionId) {
      return res.status(400).json({ success: false, message: 'No active subscription found.' });
    }

    await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    user.subscription.cancelAtPeriodEnd = true;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Subscription will cancel at end of billing period.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
