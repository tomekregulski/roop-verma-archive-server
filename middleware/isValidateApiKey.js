import ErrorResponse from '../utils/errorResponse';

export const isValidApiKey = async (req, res, next) => {
  const { key } = req.params;

  if (key !== process.env.API_KEY)
    return next(new ErrorResponse('API KEY FAILED', 400));

  return next();
};
