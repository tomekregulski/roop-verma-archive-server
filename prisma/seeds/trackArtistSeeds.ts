import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('seeding artist DB...');

const trackArtists = [
  {
    artistId: 4,
    trackId: 14,
  },
  {
    artistId: 4,
    trackId: 15,
  },
  {
    artistId: 4,
    trackId: 16,
  },
  {
    artistId: 6,
    trackId: 14,
  },
  {
    artistId: 6,
    trackId: 15,
  },
  {
    artistId: 6,
    trackId: 16,
  },
  {
    artistId: 7,
    trackId: 17,
  },
  {
    artistId: 7,
    trackId: 18,
  },
  {
    artistId: 8,
    trackId: 17,
  },
  {
    artistId: 8,
    trackId: 18,
  },
  {
    artistId: 9,
    trackId: 17,
  },
  {
    artistId: 9,
    trackId: 18,
  },
  {
    artistId: 10,
    trackId: 25,
  },
  {
    artistId: 10,
    trackId: 26,
  },
  {
    artistId: 3,
    trackId: 30,
  },
  {
    artistId: 3,
    trackId: 31,
  },
  {
    artistId: 3,
    trackId: 32,
  },
  {
    artistId: 3,
    trackId: 33,
  },
  {
    artistId: 7,
    trackId: 39,
  },
  {
    artistId: 7,
    trackId: 40,
  },
  {
    artistId: 3,
    trackId: 41,
  },
  {
    artistId: 3,
    trackId: 42,
  },
  {
    artistId: 7,
    trackId: 43,
  },
  {
    artistId: 1,
    trackId: 44,
  },
  {
    artistId: 7,
    trackId: 45,
  },
  {
    artistId: 7,
    trackId: 46,
  },
  {
    artistId: 7,
    trackId: 62,
  },
  {
    artistId: 7,
    trackId: 63,
  },
  {
    artistId: 4,
    trackId: 66,
  },
  {
    artistId: 4,
    trackId: 67,
  },
  {
    artistId: 11,
    trackId: 73,
  },
  {
    artistId: 11,
    trackId: 74,
  },
  // {
  //   artistId: 4,
  //   trackId: 75,
  // },
  // {
  //   artistId: 4,
  //   trackId: 76,
  // },
  {
    artistId: 4,
    trackId: 73,
  },
  {
    artistId: 4,
    trackId: 74,
  },
  // {
  //   artistId: 8,
  //   trackId: 75,
  // },
  // {
  //   artistId: 8,
  //   trackId: 76,
  // },
  // {
  //   artistId: 8,
  //   trackId: 77,
  // },
  // {
  //   artistId: 9,
  //   trackId: 75,
  // },
  // {
  //   artistId: 9,
  //   trackId: 76,
  // },
  // {
  //   artistId: 9,
  //   trackId: 77,
  // },
  // {
  //   artistId: 7,
  //   trackId: 76,
  // },
  // {
  //   artistId: 7,
  //   trackId: 77,
  // },
  // {
  //   artistId: 7,
  //   trackId: 84,
  // },
  // {
  //   artistId: 7,
  //   trackId: 86,
  // },
  // {
  //   artistId: 1,
  //   trackId: 87,
  // },
  // {
  //   artistId: 12,
  //   trackId: 93,
  // },
  // {
  //   artistId: 12,
  //   trackId: 94,
  // },
];

async function main() {
  trackArtists.forEach(async (trackArtist) => {
    await prisma.trackArtist.create({
      data: trackArtist,
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
