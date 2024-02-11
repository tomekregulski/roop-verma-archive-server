const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  delete: async (req, res, next) => {
    try {
      const { id } = req.body;

      const deletedTape = await prisma.tape.delete({
        where: {
          id,
        },
      });
      res.status(200).json({ data: deletedTape });
    } catch (err) {
      next(err);
    }
  },
};
