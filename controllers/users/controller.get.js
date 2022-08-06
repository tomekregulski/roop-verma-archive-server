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
