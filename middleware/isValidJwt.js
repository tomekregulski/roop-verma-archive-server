const jwt = require('jsonwebtoken');

const isValidJwt = (req, res, next) => {
  const token = req.headers.jwt;
  if (!token) {
    const error = new Error('Not authorized - could not find a token');
    error.status = 403;
    next(error);
  }
  try {
    const data = jwt.verify(token, 'YOUR_SECRET_KEY');
    req.userId = data.id;
    req.userRole = data.role;
    return next();
  } catch (err) {
    next(err);
  }
};

module.exports = isValidJwt;
