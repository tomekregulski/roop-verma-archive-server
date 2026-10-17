require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { db } = require('../../identity/runtime');
const { emailAddress, failure } = require('../../identity/service');
const { wrap } = require('../../identity/http');
module.exports = {
  newUser: wrap(async (req, res) => {
    const { firstName, lastName } = req.body;
    const email = emailAddress(req.body.email);
    if ([firstName, lastName].some(name => typeof name !== 'string' || !name.trim() || name.length > 100 || /[\x00-\x1f]/.test(name)) ||
        Object.keys(req.body).some(key => !['firstName', 'lastName', 'email'].includes(key))) throw failure(400, 'Invalid registration input');
    const existing = await db.user.findMany({ where: { email: { equals: email, mode: 'insensitive' } }, take: 1 });
    if (existing.length) throw failure(409, 'Registration cannot be completed');
    const customer = await stripe.customers.create({ name: `${firstName.trim()} ${lastName.trim()}`, email });
    if (!customer) throw failure(502, 'Registration cannot be completed');
    res.json({ newUserStripeId: customer.id });
  }),
  createPortalSession: wrap(async (req, res) => {
    const session = await stripe.billingPortal.sessions.create({
      customer: req.identity.user.stripeId,
      return_url: `${process.env.CLIENT_URL}/manage-account`,
    });
    res.json({ session });
  }),
};
