const { User } = require('../../models');

module.exports = {
  newToken: async (req, res, next) => {
    try {
      const userData = await User.findOne({
        where: {
          id: req.body.id,
        },
      });

      if (!userData) {
        const error = new Error('No user found with that ID');
        error.status = 500;
        throw error;
      }

      const tokenData = {
        id: userData.id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        subscription_active: userData.subscription_active,
        // subscription_id: userData.subscription_id,
        // stripe_id: userData.stripe_id,
        is_admin: userData.is_admin,
      };

      const token = jwt.sign(tokenData, 'YOUR_SECRET_KEY', {
        expiresIn: '24h',
      });

      // res.cookie('roop-verma-library', token);

      res.status(200).json({
        userData,
        token,
      });
    } catch (err) {
      next(err);
    }
  },
};
