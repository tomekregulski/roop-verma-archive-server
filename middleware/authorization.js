const jwt = require('jsonwebtoken');

const authorization = (req, res, next) => {
  const token = req.cookies.access_token;
  console.log(token);
  if (!token) {
    console.log('FORBIDDEN');
    return res.sendStatus(403);
  }
  try {
    const data = jwt.verify(token, 'YOUR_SECRET_KEY');
    req.userId = data.id;
    req.userRole = data.role;
    console.log('DATA');
    console.log(data);
    return next();
  } catch {
    console.log('CATCH');
    return res.sendStatus(403);
  }
};

module.exports = authorization;
