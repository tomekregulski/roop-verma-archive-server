function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error);
  const status = error.type === 'entity.parse.failed' ? 400 : error.type === 'entity.too.large' ? 413 : error.status || 500;
  if (status === 429) response.set('Retry-After', '900');
  return response.status(status).json({
    error: { message: status >= 500 ? 'Request could not be completed' :
      error.type === 'entity.parse.failed' ? 'Invalid JSON' :
      error.type === 'entity.too.large' ? 'Request body too large' : error.message || 'Request rejected' },
  });
}
module.exports = errorHandler;
