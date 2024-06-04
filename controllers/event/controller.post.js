const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  create: async (req, res, next) => {
    try {
      const { eventName, date, locationId, categoryId, notes } = req.body;

      // const existingEvents = await prisma.event.findMany({
      //   // TODO: can this be more specific i.e. date and location?
      //   where: { date },
      // });

      // console.log(existingEvents);
      // const existingEventIds = existingEvents.map((event) => event.id);
      // console.log(existingEventIds);

      // if (existingEventIds) {
      //   const error = new Error(
      //     `This event seems to already exist, see event id(s): ${existingEventIds.join(
      //       ', '
      //     )}`
      //   );
      //   error.status = 401;
      //   throw error;
      // }

      const newEvenet = await prisma.event.create({
        data: { eventName, date, locationId, categoryId, notes },
      });

      res.status(200).json({ data: newEvenet });
    } catch (err) {
      next(err);
    }
  },
};
