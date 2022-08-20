require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const jwt = require('jsonwebtoken');
const { User } = require('../../models');

module.exports = {
  charge: async (req, res, next) => {
    const { amount, id } = req.body;
    try {
      const payment = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'USD',
        description: 'Your Company Description',
        payment_method: id,
        confirm: true,
      });
      res.status(200).json({
        message: 'Payment Successful',
        success: true,
      });
    } catch (error) {
      next(error);
    }
  },

  subscribe: async (req, res, next) => {
    const { id, email, first_name, last_name, payment_method, stripe_id } =
      req.body;
    let customer;

    try {
      if (stripe_id) {
        const customersList = await stripe.customers.list();
        customer = customersList.filter((entry) => entry.id === stripe_id);
      }

      if (!stripe_id) {
        customer = await stripe.customers.create({
          name: `${first_name} ${last_name}`,
          email: email,
          payment_method: payment_method,
          invoice_settings: {
            default_payment_method: payment_method,
          },
        });
      }

      if (!customer) {
        const error = new Error('Server Error: Could not create customer.');
        error.status = 500;
        next(error);
      }

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ plan: 'price_1KJRMLBlr8UFcXJyfuwrkYVC' }],
        expand: ['latest_invoice.payment_intent'],
      });

      const status = subscription['latest_invoice']['payment_intent']['status'];
      const client_secret =
        subscription['latest_invoice']['payment_intent']['client_secret'];

      await User.update(
        {
          stripe_id: customer.id,
          subscription_id: subscription.id,
          subscription_active: true,
        },
        {
          where: {
            email: email,
          },
        }
      );

      const userData = {
        id,
        first_name,
        last_name,
        email,
        stripe_id: customer.id,
        subscription_id: subscription.id,
        subscription_active: true,
        is_admin: false,
      };

      const token = jwt.sign(userData, 'YOUR_SECRET_KEY', {
        expiresIn: '100h',
      });

      res.status(200).json({
        message: 'Logged in successfully',
        token,
        client_secret,
        status,
        userData,
      });
    } catch (error) {
      next(error);
    }
  },

  cancelSubscription: async (req, res, next) => {
    const customer_id = req.body.customer_id;

    let subscriptions = await stripe.subscriptions.list();

    subscriptions = subscriptions.data;

    const targetSubscription = subscriptions.filter(
      (subscription) => subscription.customer === customer_id
    );

    const deleted = await stripe.subscriptions.del(targetSubscription[0].id);

    const userData = await User.update(
      {
        subscription_active: false,
        subscription_id: '',
      },
      {
        where: {
          stripe_id: customer_id,
        },
      }
    );
    res.status(200).json({ message: 'Successfully cancelled subscription' });
  },
};
