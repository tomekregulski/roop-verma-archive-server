const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  delete: async (req, res, next) => {
    try {
      const { id } = req.body;
      const deletedMediaType = await prisma.mediaType.delete({
        where: {
          id,
        },
      });
      res.status(200).json({ data: deletedMediaType });
    } catch (err) {
      next(err);
    }
  },
};
