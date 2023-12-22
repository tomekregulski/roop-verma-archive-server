const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
module.exports = {
  create: async (req, res, next) => {
    try {
      const { id, submittedBy, type, content } = req.body;

      const newTribute = await prisma.tribute.create({
        data: { id, submittedBy, type, content },
      });

      res.status(200).json({ data: newTribute });
    } catch (err) {
      next(err);
    }
  },
};
