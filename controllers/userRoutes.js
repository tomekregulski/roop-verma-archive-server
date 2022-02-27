const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const bcrypt = require('bcrypt');

// const authorization = require('../middleware/authorization');

router.get('/', async (req, res) => {
  try {
    const allUsers = await User.findAll();
    const userData = allUsers.map((user) => user.get({ plain: true }));
    res.status(200).json(userData);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

router.post('/', async (req, res) => {
  try {
    const userData = await User.create({
      email: req.body.email,
      password: req.body.password,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      subscription_active: req.body.subscription_active || false,
      subscription_id: "''",
      stripe_id: "''",
      is_admin: req.body.is_admin || false,
    });

    res.status(200).json(userData);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});

router.put('/:id', async (req, res) => {
  try {
    const userData = await User.update(
      {
        email: req.body.email,
        password: req.body.password,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        subscription_active: req.body.subscription_active,
        subscription_id: "''",
        stripe_id: "''",
        is_admin: req.body.is_admin,
      },
      {
        where: {
          id: req.params.id,
        },
        individualHooks: true,
      }
    );
    res.status(200).json(userData);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const userData = await User.destroy({
      where: {
        id: req.params.id,
      },
    });

    if (!userData) {
      res.status(404).json({ message: `No such user found!` });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post('/register', async (req, res) => {
  try {
    // graceful handle of email validation failure
    // var validRegex =
    //   /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

    // if (!req.body.email.match(validRegex)) {
    //   res.status(500).json({ message: 'invalid email' });
    //   return;
    // }

    const existingUser = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (existingUser) {
      res
        .status(400)
        .json({ message: 'An account with this email already exists.' });
      return;
    }

    const userData = await User.create({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      password: req.body.password,
      subscription_active: false,
      subscription_id: '',
      stripe_id: '',
      is_admin: false,
    });

    res.status(200).json(userData);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});

router.post('/login', async (req, res) => {
  try {
    const userData = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (!userData) {
      res.status(400).json('Incorrect username or password...');
      return;
    }

    // if (userData.subscription_active != true) {
    //   res.status(400).json('Your subscription is not active. Please contact support to re');
    //   return;
    // }

    console.log(userData);

    const passwordData = await userData.checkPassword(req.body.password);

    console.log(passwordData);

    if (!passwordData) {
      res.status(400).json({ message: 'Incorrect username or password...' });
      return;
    }

    const tokenData = {
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      password: userData.password,
      subscription_active: userData.subscription_active,
      subscription_id: userData.subscription_id,
      stripe_id: userData.stripe_id,
      is_admin: userData.is_admin,
    };

    const token = jwt.sign(tokenData, 'YOUR_SECRET_KEY', {
      expiresIn: '100h',
    });

    res.status(200).json({
      userData,
      token,
    });
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});

router.get('/protected', (req, res) => {
  return res.json({ user: { id: req.userId, role: req.userRole } });
});

router.get('/logout', (req, res) => {
  return res
    .clearCookie('access_token')
    .status(200)
    .json({ message: 'Successfully logged out' });
});

module.exports = router;
