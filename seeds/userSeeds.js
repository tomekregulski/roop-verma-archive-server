const { User } = require('../models');

const userData = [
  {
    email: 'test@test.com',
    password: 'test',
    first_name: 'test',
    last_name: 'test',
  },
];

const userSeeds = () => User.bulkCreate(userData);

module.exports = userSeeds;
