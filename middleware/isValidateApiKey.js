module.exports = (req, _res, next) => {
  if (!process.env.API_KEY || req.params.key !== process.env.API_KEY) {
    return next(Object.assign(new Error('Invalid API key'), { status: 403 }));
  }
  return next();
};
