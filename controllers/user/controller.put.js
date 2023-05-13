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
      const user = await User.findOne({
        where: {
          id: req.body.userId,
        },
      });

      const passwordsMatch = await bcrypt.compare(
        req.body.currentPassword,
        user.password
      );
      console.log(passwordsMatch);
      if (!passwordsMatch) {
        const error = new Error('Incorrect current password');
        error.status = 500;
        throw error;
      }

      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      console.log('hashedPassword: ', hashedPassword);
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
      console.log('password updated');
      res.status(200).json({ message: 'Password successfully updated' });
    } catch (err) {
      next(err);
    }
  },
};
