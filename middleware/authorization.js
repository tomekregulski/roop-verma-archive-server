const jwt = require('jsonwebtoken');

const authorization = (req, res, next) => {
  const token = req.headers.jwt;
  if (!token) {
    return res.sendStatus(403);
  }
  try {
    const data = jwt.verify(token, 'YOUR_SECRET_KEY');
    req.userId = data.id;
    req.userRole = data.role;
    return next();
  } catch (err) {
    console.log(err);
    return res.sendStatus(403);
  }
};

module.exports = authorization;
