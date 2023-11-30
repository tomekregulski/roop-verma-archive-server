const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  delete: async (req, res, next) => {
    try {
      const { id } = req.body;
      console.log('delete');
      console.log(id);

      const deletedLocation = await prisma.location.delete({
        where: {
          id,
        },
      });
      console.log(deletedLocation);
      res.status(200).json({ data: deletedLocation });
    } catch (err) {
      next(err);
    }
  },
};
