const router = require('express').Router();

router.get('/', (req, res) => {
  console.log('success get');
  res.send('success get');
});

router.post('/', (req, res) => {
  console.log('success post');
  res.send('success post');
});

module.exports = router;
