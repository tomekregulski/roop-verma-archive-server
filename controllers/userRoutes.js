const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');

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
      access: true,
      admin: false,
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
        access: req.body.access,
        admin: req.body.admin,
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

router.post('/register', (req, res) => {
  const newUser = {
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    password: req.body.password,
  };
  console.log(newUser);
  const token = jwt.sign({ newUser, access: 'yes' }, 'YOUR_SECRET_KEY');
  console.log(token);
  return res
    .cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })
    .status(200)
    .json({ newUser, message: 'Registered successfully' });
});

router.get('/login', (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };
  const token = jwt.sign(user, 'YOUR_SECRET_KEY');
  console.log(token);
  res.cookie('roop_verma_library', token, {
    domain: 'https://admiring-goldwasser-e0b0fd.netlify.app',
  });
  res.status(200).json({ message: 'Logged in successfully', token });
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
