const { Category } = require('../models');

const categoryData = [
  {
    name: 'concert',
  },
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

const seedCategories = () => Category.bulkCreate(categoryData);

module.exports = seedCategories;
