const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  update: async (req, res, next) => {
    try {
      const { id, type, submittedBy, content } = req.body;

      const updatedTribute = await prisma.tribute.update({
        where: {
          id,
        },
        data: { type, submittedBy, content },
      });

      console.log(updatedTribute);
      res.status(200).json({ data: updatedTribute });
    } catch (err) {
      next(err);
    }
  },
};
