// A simple error handler that renders error messages in a neat format to allow for easy reading
function errorHandler(error, request, response, next) {
  return response.status(error.status || 500).json({
    error: {
      message: error.message || 'Something went wrong.',
    },
  });
}

module.exports = errorHandler;
