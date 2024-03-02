const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  delete: async (req, res, next) => {
    try {
      const { id } = req.body;
      const deletedNetworkError = await prisma.networkError.delete({
        where: {
          id,
        },
      });
      res.status(200).json({ data: deletedNetworkError });
    } catch (err) {
      next(err);
    }
  },
};
