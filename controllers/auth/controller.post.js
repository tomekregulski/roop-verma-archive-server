const jwt = require('jsonwebtoken');
const { User } = require('../../models');

module.exports = {
  login: async (req, res, next) => {
    try {
      const userData = await User.findOne({
        where: {
          email: req.body.email,
        },
      });

      if (!userData) {
        const error = new Error('Incorrect username or password');
        error.status = 500;
        throw error;
      }

      const passwordData = await userData.checkPassword(req.body.password);

      if (!passwordData) {
        const error = new Error('Incorrect username or password');
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

  logout: async (_req, res) => {
    return res
      .clearCookie('access_token')
      .status(200)
      .json({ message: 'Successfully logged out' });
  },
};
