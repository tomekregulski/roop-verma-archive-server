// Fixed operation labels only. Never serialize errors, request bodies or provider payloads.
function logFailure(operation, error, requestId) {
  console.error(
    JSON.stringify({
      operation,
      errorType: [
        'Error',
        'TypeError',
        'RangeError',
        'PrismaClientKnownRequestError',
        'PrismaClientUnknownRequestError',
      ].includes(error?.name)
        ? error.name
        : 'Error',
      code: /^(?:(?:ACCESS|PURCHASE)_[A-Z_]{1,60}|P[0-9]{4})$/.test(
        error?.code || ''
      )
        ? error.code
        : 'UNEXPECTED_FAILURE',
      ...(requestId ? { requestId } : {}),
    })
  );
}
module.exports = { logFailure };
