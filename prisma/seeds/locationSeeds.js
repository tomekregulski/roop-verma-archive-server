import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('seeding location DB...');

const locations = [
  {
    name: 'Unknown',
  },
  {
    name: 'Los Angeles, CA',
  },
  {
    name: 'Fort Collins, CO',
  },
  {
    name: 'Boulder Free School',
  },
  {
    name: 'Ananda Ashram',
  },
  {
    name: 'Boulder, CO',
  },
  {
    name: 'Eckerd College',
  },
  {
    name: 'Kripalu Ashram',
  },
  {
    name: 'Montreal, Canada',
  },
  {
    name: 'Rochester, NY',
  },
  {
    name: 'San Francisco - Brahmananda Ashram',
  },
  {
    name: 'Florida, NY',
  },
  {
    name: 'Victoria Museum',
  },
  {
    name: 'Prema',
  },
  {
    name: 'Watson Homestead',
  },
  {
    name: 'Burlington, VT',
  },
  {
    name: 'Yoga Society of Florida',
  },
];

async function main() {
  locations.forEach(async (location) => {
    await prisma.location.create({
      data: location,
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
