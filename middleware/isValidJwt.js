const jwt = require('jsonwebtoken');

const isValidJwt = (req, res, next) => {
  console.log('validating jwt...');
  const token = req.headers.jwt;
  // next();
  if (!token) {
    const error = new Error('Not authorized - could not find a token');
    error.status = 403;
    next(error);
  }
  try {
    jwt.verify(token, 'YOUR_SECRET_KEY');
    console.log('jwt verification successful');
    return next();
  } catch (err) {
    next(err);
  }
};

module.exports = isValidJwt;
