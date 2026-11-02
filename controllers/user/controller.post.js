const { stripe, operations } = require('../../billing/runtime');
const { registrationInput } = require('../../identity/service');
const { wrap } = require('../../identity/http');
module.exports = {
  newUser: wrap(async (req, res) => {
    const customerId = await operations.register(registrationInput(req.body));
    res.json({ newUserStripeId: customerId });
  }),
  createPortalSession: wrap(async (req, res) => {
    const session = await stripe.billingPortal.sessions.create({
      customer: req.identity.user.stripeId,
      return_url: `${process.env.CLIENT_URL}/manage-account`,
    });
    res.json({ session });
  }),
};

// Factories are selected only by the isolated fixture until explicit cutover.
module.exports.createPurchaseHandlers = (purchase) => ({
  newUser: wrap(async (req, res) => res.status(202).json(await purchase.register(req.body))),
  createPortalSession: wrap(async (req, res) => {
    if (Object.keys(req.body).length)
      throw require('../../identity/service').failure(400, 'Unexpected purchase input');
    res.json(await purchase.portal(req.identity.user.id));
  }),
});
