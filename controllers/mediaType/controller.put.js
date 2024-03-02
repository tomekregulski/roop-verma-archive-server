const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  update: async (req, res, next) => {
    try {
      const { id, name } = req.body;

      const updatedMediaType = await prisma.location.update({
        where: {
          id,
        },
        data: {
          name,
        },
      });
      res.status(200).json({ data: updatedMediaType });
    } catch (err) {
      next(err);
    }
  },
};
