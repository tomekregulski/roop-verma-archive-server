import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('seeding artist DB...');

const artists = [
  {
    name: 'Roop Verma',
  },
  {
    name: 'Narendra Verma',
  },
  {
    name: 'Kevin West Milburn',
  },
  {
    name: 'Kamala Vedanthan',
  },
  {
    name: 'Ravi Shankar',
  },
  {
    name: 'T. Steven Crisman',
  },
  {
    name: 'K. Paramjyoti',
  },
  {
    name: 'Meera',
  },
  {
    name: 'Krishna',
  },
  {
    name: 'Doug Werner',
  },
  {
    name: 'Tripta',
  },
  {
    name: 'Bob Becker',
  },
];

export async function main() {
  artists.forEach(async (artist) => {
    await prisma.artist.create({
      data: artist,
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
