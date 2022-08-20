const { User } = require('../../models');

module.exports = {
  allUsers: async (_req, res, next) => {
    try {
      const allUsers = await User.findAll();
      const userData = allUsers.map((user) => user.get({ plain: true }));
      res.status(200).json(userData);
    } catch (err) {
      next(err);
    }
  },

  getUserById: async (req, res, next) => {
    try {
      const userData = await User.findOne({
        where: {
          id: req.params.id,
        },
      });
      if (!userData) {
        const error = new Error('No user with that ID exists.');
        error.status = 400;
        throw error;
      }

      const returnedUserData = {
        id: userData.dataValues.id,
        email: userData.dataValues.email,
        first_name: userData.dataValues.first_name,
        subscription_active: userData.dataValues.subscription_active,
        subscription_id: userData.dataValues.subscription_id,
        stripe_id: userData.dataValues.stripe_id,
      };

      res.status(200).json(returnedUserData);
    } catch (err) {
      next(err);
    }
  },

  checkExistingUser: async (req, res, next) => {
    try {
      const existingUser = await User.findOne({
        where: {
          email: req.body.email,
        },
      });

      if (existingUser) {
        const error = new Error('An account with this email already exists.');
        error.status = 400;
        throw error;
      }
      res.status(200).json(existingUser);
    } catch (err) {
      next(err);
    }
  },
};
