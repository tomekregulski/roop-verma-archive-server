import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('seeding category DB...');

const categories = [
  {
    name: 'lesson',
  },
  {
    name: 'nada yoga intensive',
  },
  {
    name: 'retreat',
  },
  {
    name: 'sharing',
  },
  {
    name: 'meditation',
  },
  {
    name: 'guided meditation',
  },
  {
    name: 'unknown',
  },
  {
    name: 'interview',
  },
  {
    name: 'lecture',
  },
  {
    name: 'seminar',
  },
  {
    name: 'course',
  },
  {
    name: 'demo',
  },
  {
    name: 'class',
  },
];

async function main() {
  categories.forEach(async (category) => {
    await prisma.category.create({
      data: category,
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
