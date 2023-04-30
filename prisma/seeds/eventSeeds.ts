import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('seeding event DB...');

const events = [
  {
    eventName: 'n/a',
    date: '4/4/78',
    locationId: 1,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'Two Evening Ragas',
    date: 'Sep-78',
    locationId: 1,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '5/9/79',
    locationId: 2,
    categoryId: 2,
    notes: 'Lesson with Pandit Ravi Shankar',
  },
  {
    eventName: 'n/a',
    date: '4/4/78',
    locationId: 3,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '10/30/78',
    locationId: 1,
    categoryId: 1,
    notes: 'Kevin West Milburn - Tabla\r\nKamala Vedanthan - Tanpura',
  },
  {
    eventName: 'n/a',
    date: '10/28/78',
    locationId: 4,
    categoryId: 1,
    notes: 'Kevin West Milburn - tabla\r\nT. Steven Crisman - tanpura',
  },
  {
    eventName: 'n/a',
    date: '12/30/78',
    locationId: 5,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '09/--/80',
    locationId: 6,
    categoryId: 8,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: 'Oct-77',
    locationId: 5,
    categoryId: 8,
    notes: 'performed on Swar Mandala',
  },
  {
    eventName: 'n/a',
    date: '4/8/78',
    locationId: 1,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '10/30/77',
    locationId: 7,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '4/--/78',
    locationId: 3,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '--/--/1977',
    locationId: 8,
    categoryId: 8,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '10/6/79',
    locationId: 9,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: 'n/a',
    locationId: 5,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '--/--/1977',
    locationId: 5,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '5/26/79',
    locationId: 1,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '6/2/79',
    locationId: 5,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '1/27/79',
    locationId: 10,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: 'n/a',
    locationId: 1,
    categoryId: 8,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '0/13/77',
    locationId: 5,
    categoryId: 8,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: 'n/a',
    locationId: 5,
    categoryId: 6,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '2/25/78',
    locationId: 11,
    categoryId: 8,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '10/20/79',
    locationId: 12,
    categoryId: 6,
    notes: 'n/a',
  },
  {
    eventName: '"Meditation on Sound" Distributed by Ananda Ashram',
    date: '10/20/79',
    locationId: 5,
    categoryId: 6,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '5/26/78',
    locationId: 5,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '08/--/78',
    locationId: 5,
    categoryId: 3,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '11/15/75',
    locationId: 13,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: 'n/a',
    locationId: 1,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'Music Festival of India',
    date: '11/8/78',
    locationId: 14,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '9/2/79',
    locationId: 1,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '6/28/79',
    locationId: 15,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: '1st concert (perhaps re: Tripta?)',
    date: '7/30/78',
    locationId: 16,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '12/30/78',
    locationId: 1,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '2/25/78',
    locationId: 11,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '12/--/77',
    locationId: 5,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '10/20/78',
    locationId: 5,
    categoryId: 4,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '01/--/79',
    locationId: 10,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '10/6/79',
    locationId: 9,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '4/8/78',
    locationId: 3,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'Meditation on Sound',
    date: 'n/a',
    locationId: 1,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '6/21/78',
    locationId: 10,
    categoryId: 3,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '1/6/78',
    locationId: 1,
    categoryId: 3,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '1/27/78',
    locationId: 1,
    categoryId: 3,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '01/--/78',
    locationId: 1,
    categoryId: 3,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '10/28/77',
    locationId: 17,
    categoryId: 1,
    notes: 'n/a',
  },
];

async function main() {
  events.forEach(async (event) => {
    await prisma.event.create({
      data: event,
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
