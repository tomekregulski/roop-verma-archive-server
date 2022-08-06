const { User } = require('../../models');
const bcrypt = require('bcrypt');

module.exports = {
  updatePassword: async (req, res, next) => {
    console.log('attempting update password');
    console.log(req.body.password);
    try {
      if (!req.body.password) {
        const error = new Error('No password was provided');
        error.status = 500;
        throw error;
      }
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      console.log(hashedPassword);
      await User.update(
        {
          password: hashedPassword,
        },
        {
          where: {
            id: req.body.userId,
          },
        }
      );
      console.log('updated');
      res.status(200).json({ message: 'Password successfully updated' });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },
};
