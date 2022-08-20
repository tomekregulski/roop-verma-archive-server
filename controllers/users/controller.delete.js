const { User } = require('../../models');

module.exports = {
  deleteUser: async (req, res, next) => {
    try {
      const userData = await User.destroy({
        where: {
          id: req.body.id,
        },
      });

      if (!userData) {
        const error = new Error('No user found with that ID');
        error.status = 500;
        throw error;
      }

      res.status(200).json(`Successfully deleted user with ID: ${req.body.id}`);
    } catch (err) {
      next(err);
    }
  },
};
