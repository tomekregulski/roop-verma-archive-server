const { User } = require('../../models');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  delete: async (req, res, next) => {
    try {
      const { id } = req.body;
      console.log('delete');
      console.log(id);

      const deletedTribute = await prisma.tribute.delete({
        where: {
          id,
        },
      });
      console.log(deletedTribute);
      res.status(200).json({ data: deletedTribute });
    } catch (err) {
      next(err);
    }
  },
};
