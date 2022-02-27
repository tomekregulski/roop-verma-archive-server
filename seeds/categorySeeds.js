const { Category } = require('../models');

const categoryData = [
  {
    name: 'concert',
  },
  {
    name: 'lesson',
  },
  {
    name: 'retreat',
  },
  {
    name: 'discussion',
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

const seedCategories = () => Category.bulkCreate(categoryData);

module.exports = seedCategories;
