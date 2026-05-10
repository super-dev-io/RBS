export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR", details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(message, 400, "BAD_REQUEST", details);
  }
  static unauthorized(message = "Unauthorized") {
    return new AppError(message, 401, "UNAUTHORIZED");
  }
  static forbidden(message = "Forbidden") {
    return new AppError(message, 403, "FORBIDDEN");
  }
  static notFound(message = "Not found") {
    return new AppError(message, 404, "NOT_FOUND");
  }
  static conflict(message: string) {
    return new AppError(message, 409, "CONFLICT");
  }
}
