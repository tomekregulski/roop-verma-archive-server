import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('seeding category DB...');

const tapes = [
  {
    tapeId: 1,
    eventId: 1,
  },
  {
    tapeId: 2,
    eventId: 2,
  },
  {
    tapeId: 3,
    eventId: 3,
  },
  {
    tapeId: 4,
    eventId: 4,
  },
  {
    tapeId: 5,
    eventId: 5,
  },
  {
    tapeId: 6,
    eventId: 6,
  },
  {
    tapeId: 7,
    eventId: 7,
  },
  {
    tapeId: 8,
    eventId: 8,
  },
  {
    tapeId: 9,
    eventId: 9,
  },
  {
    tapeId: 10,
    eventId: 10,
  },
  {
    tapeId: 11,
    eventId: 11,
  },
  {
    tapeId: 12,
    eventId: 12,
  },
  {
    tapeId: 13,
    eventId: 13,
  },
  {
    tapeId: 14,
    eventId: 14,
  },
  {
    tapeId: 15,
    eventId: 15,
  },
  {
    tapeId: 16,
    eventId: 16,
  },
  {
    tapeId: 17,
    eventId: 17,
  },
  {
    tapeId: 18,
    eventId: 18,
  },
  {
    tapeId: 19,
    eventId: 19,
  },
  {
    tapeId: 20,
    eventId: 20,
  },
  {
    tapeId: 21,
    eventId: 21,
  },
  {
    tapeId: 22,
    eventId: 22,
  },
  {
    tapeId: 23,
    eventId: 23,
  },
  {
    tapeId: 24,
    eventId: 24,
  },
  {
    tapeId: 25,
    eventId: 25,
  },
  {
    tapeId: 26,
    eventId: 26,
  },
  {
    tapeId: 27,
    eventId: 27,
  },
  {
    tapeId: 28,
    eventId: 28,
  },
  {
    tapeId: 29,
    eventId: 29,
  },
  {
    tapeId: 30,
    eventId: 30,
  },
  {
    tapeId: 31,
    eventId: 31,
  },
  {
    tapeId: 32,
    eventId: 32,
  },
  {
    tapeId: 33,
    eventId: 33,
  },
  {
    tapeId: 34,
    eventId: 34,
  },
  {
    tapeId: 35,
    eventId: 35,
  },
  {
    tapeId: 36,
    eventId: 36,
  },
  {
    tapeId: 37,
    eventId: 37,
  },
  {
    tapeId: 38,
    eventId: 38,
  },
  {
    tapeId: 39,
    eventId: 39,
  },
  {
    tapeId: 40,
    eventId: 40,
  },
  {
    tapeId: 41,
    eventId: 41,
  },
  {
    tapeId: 42,
    eventId: 42,
  },
  {
    tapeId: 43,
    eventId: 43,
  },
  {
    tapeId: 44,
    eventId: 44,
  },
  {
    tapeId: 45,
    eventId: 45,
  },
  {
    tapeId: 46,
    eventId: 46,
  },
];

async function main() {
  tapes.forEach(async (tape) => {
    await prisma.tape.create({
      data: tape,
    });
  });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
