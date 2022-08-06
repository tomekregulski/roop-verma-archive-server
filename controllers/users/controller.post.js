const { User } = require('../../models');

module.exports = {
  newUser: async (req, res, next) => {
    try {
      const existingUser = await User.findOne({
        where: {
          email: req.body.email,
        },
      });

      if (existingUser) {
        const error = new Error('A user with that email already exists');
        error.status = 401;
        throw error;
      }

      const userData = await User.create({
        email: req.body.email,
        password: req.body.password,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        subscription_active: req.body.subscription_active || false,
        subscription_id: "''",
        stripe_id: "''",
        is_admin: req.body.is_admin || false,
      });

      res.status(200).json({ message: 'successfully created new user' });
    } catch (err) {
      next(err);
    }
  },
};
