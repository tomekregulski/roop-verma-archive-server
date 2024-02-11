const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
module.exports = {
  create: async (req, res, next) => {
    try {
      const { errorCode, errorMessage, isRegisteredUser, userId } = req.body;

      const newNetworkError = await prisma.networkError.create({
        data: { errorCode, errorMessage, isRegisteredUser, userId },
      });

      res.status(200).json({ data: newNetworkError });
    } catch (err) {
      next(err);
    }
  },
};
