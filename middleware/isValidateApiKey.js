const isValidApiKey = (req, res, next) => {
  const { key } = req.params;

  if (key !== process.env.API_KEY) {
    const error = new Error('Server Error: Incorrect API key');
    error.status = 500;
    next(error);
  }

  return next();
};

module.exports = isValidApiKey;
