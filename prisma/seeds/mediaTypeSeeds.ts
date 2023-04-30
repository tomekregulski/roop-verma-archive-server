import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('seeding media type DB...');

const mediaTypes = [
  {
    name: 'audio',
  },
  {
    name: 'video',
  },
  {
    name: 'image',
  },
  {
    name: 'text',
  },
];

async function main() {
  mediaTypes.forEach(async (mediaType) => {
    await prisma.mediaType.create({
      data: mediaType,
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
