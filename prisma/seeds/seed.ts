import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('seeding DB...');
async function main() {
  const testUser = await prisma.user.upsert({
    where: { email: 'alice@prisma.io' },
    update: {},
    create: {
      email: 'test.user@gmail.com',
      firstName: 'Test',
      lastName: 'User',
      subscriptionActive: true,
      stripeId: 'asdf2345',
      isAdmin: true,
    },
  });
  console.log({ testUser });
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
