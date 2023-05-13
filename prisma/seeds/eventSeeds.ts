import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('seeding event DB...');

const events = [
  {
    eventName: 'n/a',
    date: '04/04/1978',
    locationId: 1,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'Two Evening Ragas',
    date: '09/--/1978',
    locationId: 1,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '05/09/1979',
    locationId: 2,
    categoryId: 2,
    notes: 'Lesson with Pandit Ravi Shankar',
  },
  {
    eventName: 'n/a',
    date: '04/04/1978',
    locationId: 3,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '10/30/1978',
    locationId: 1,
    categoryId: 1,
    notes: 'Kevin West Milburn - Tabla\r\nKamala Vedanthan - Tanpura',
  },
  {
    eventName: 'n/a',
    date: '10/28/1978',
    locationId: 4,
    categoryId: 1,
    notes: 'Kevin West Milburn - tabla\r\nT. Steven Crisman - tanpura',
  },
  {
    eventName: 'n/a',
    date: '12/30/1978',
    locationId: 5,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '09/--/1980',
    locationId: 6,
    categoryId: 8,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '10/--/1977',
    locationId: 5,
    categoryId: 8,
    notes: 'performed on Swar Mandala',
  },
  {
    eventName: 'n/a',
    date: '04/08/1978',
    locationId: 1,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '10/30/1977',
    locationId: 7,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '04/--/1978',
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
    date: '10/06/1979',
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
    date: '05/26/1979',
    locationId: 1,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '06/02/1979',
    locationId: 5,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '01/27/1979',
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
    date: '0/13/1977',
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
    date: '02/25/1978',
    locationId: 11,
    categoryId: 8,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '10/20/1979',
    locationId: 12,
    categoryId: 6,
    notes: 'n/a',
  },
  {
    eventName: '"Meditation on Sound" Distributed by Ananda Ashram',
    date: '10/20/1979',
    locationId: 5,
    categoryId: 6,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '05/26/1978',
    locationId: 5,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '08/--/1978',
    locationId: 5,
    categoryId: 3,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '11/15/1975',
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
    date: '11/08/1978',
    locationId: 14,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '09/02/79',
    locationId: 1,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '06/28/1979',
    locationId: 15,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: '1st concert (perhaps re: Tripta?)',
    date: '07/30/1978',
    locationId: 16,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '12/30/1978',
    locationId: 1,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '02/25/1978',
    locationId: 11,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '12/--/1977',
    locationId: 5,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '10/20/1978',
    locationId: 5,
    categoryId: 4,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '01/--/1979',
    locationId: 10,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '10/06/1979',
    locationId: 9,
    categoryId: 1,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '04/08/1978',
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
    date: '06/21/1978',
    locationId: 10,
    categoryId: 3,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '01/06/1978',
    locationId: 1,
    categoryId: 3,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '01/27/78',
    locationId: 1,
    categoryId: 3,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '01/--/1978',
    locationId: 1,
    categoryId: 3,
    notes: 'n/a',
  },
  {
    eventName: 'n/a',
    date: '10/28/1977',
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
