const router = require('express').Router();
const testRoute = require('./test');

router.use('/api/test', testRoute);

module.exports = router;
