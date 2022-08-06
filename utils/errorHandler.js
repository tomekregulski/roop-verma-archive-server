export class ErrorResponse extends Error {
  constructor(message, _statusCode) {
    super(message);
    // this.statusCode = statusCode;
  }
}
