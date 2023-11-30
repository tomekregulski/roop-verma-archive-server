const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  update: async (req, res, next) => {
    try {
      const { id, name } = req.body;

      const updatedLocation = await prisma.location.update({
        where: {
          id,
        },
        data: {
          name,
        },
      });
      console.log(updatedLocation);
      res.status(200).json({ data: updatedLocation });
    } catch (err) {
      next(err);
    }
  },
};
