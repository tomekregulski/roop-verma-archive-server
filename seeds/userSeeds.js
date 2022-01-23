const { User } = require('../models');

const userData = [
  {
    email: 'tomek@test.com',
    password: 'password',
    first_name: 'Tomek',
    last_name: 'Regulski',
    subscription_id: '',
    stripe_id: '',
    is_admin: true,
    subscription_active: true,
  },
];

const userSeeds = () => User.bulkCreate(userData);

module.exports = userSeeds;
