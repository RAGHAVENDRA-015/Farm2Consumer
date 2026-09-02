export class ApiError extends Error {
  public statusCode: number;
  public errorCode: string;
  public fields?: Record<string, string[]>;

  constructor(
    statusCode: number,
    message: string,
    errorCode: string = 'INTERNAL_SERVER_ERROR',
    fields?: Record<string, string[]>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.fields = fields;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string = 'Bad request', errorCode: string = 'VALIDATION_ERROR', fields?: Record<string, string[]>) {
    return new ApiError(400, message, errorCode, fields);
  }

  static unauthorized(message: string = 'Unauthorized', errorCode: string = 'UNAUTHORIZED') {
    return new ApiError(401, message, errorCode);
  }

  static forbidden(message: string = 'Forbidden access', errorCode: string = 'FORBIDDEN') {
    return new ApiError(403, message, errorCode);
  }

  static notFound(message: string = 'Resource not found', errorCode: string = 'NOT_FOUND') {
    return new ApiError(404, message, errorCode);
  }

  static conflict(message: string = 'Resource conflict', errorCode: string = 'CONFLICT') {
    return new ApiError(409, message, errorCode);
  }

  static internal(message: string = 'Internal server error', errorCode: string = 'INTERNAL_SERVER_ERROR') {
    return new ApiError(500, message, errorCode);
  }
}
