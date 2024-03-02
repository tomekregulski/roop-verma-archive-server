const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = {
  create: async (req, res, next) => {
    try {
      const { name, alternateSpelling, ...rest } = req.body;

      const alternateSpellings = alternateSpelling.split(',') ?? [];
      const allNames = [name, ...alternateSpellings];
      console.log('allNames: ', allNames);

      const allRagas = await prisma.raga.findMany({});
      const testArr = ['a', 'b'];
      const filtered = testArr.forEach((item) => {
        if (item === 'a') {
          return item;
        }
      });
      console.log(filtered);

      const existingRaga = allRagas.filter((raga) => {
        // console.log(raga);
        const {
          name: ragaPrimaryNameToCompare,
          alternateSpelling: ragaAlternateSpellingsToCompare,
        } = raga;
        // console.log('raga: ', raga);
        // const primaryName = currentRagaName;
        const restNames = ragaAlternateSpellingsToCompare
          ? ragaAlternateSpellingsToCompare.split(',')
          : [];

        const allCurrentNames = [ragaPrimaryNameToCompare, ...restNames];
        // console.log('allCurrentNames: ', allCurrentNames);
        const isExistingRaga = allCurrentNames.filter((name) => {
          if (allNames.includes(name)) {
            console.log('allCurrentNames: ', allCurrentNames);
            console.log('name: ', name);
            console.log(allNames.includes(name));
            return name;
          }
          // allNames.includes(name);
        });

        console.log('isExistingRaga: ', isExistingRaga);
        if (isExistingRaga.length > 0) {
          return isExistingRaga;
        }
      });

      console.log('existingRaga', existingRaga.length);

      // const existingRaga = await prisma.raga.findUnique({
      //   where: { name },
      // });

      if (existingRaga.length > 0) {
        const error = new Error('A raga with that name already exists');
        error.status = 409;
        throw error;
      }

      console.log('raga does not exist in the database');

      const newRaga = await prisma.raga.create({
        data: { name, alternateSpelling, ...rest },
      });

      res.status(200).json({ data: newRaga });
    } catch (err) {
      next(err);
    }
  },
};
