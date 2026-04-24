export type ApiErrorCode =
  | 'INVALID_URL'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'UNPROCESSABLE'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'DECODING_ERROR'
  | 'NETWORK_ERROR'
  | 'TOKEN_MISSING';

export class ApiError extends Error {
  code: ApiErrorCode;
  statusCode?: number;
  detail?: string;

  constructor(code: ApiErrorCode, message: string, statusCode?: number, detail?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.detail = detail;
  }

  static fromResponse(status: number, body: unknown): ApiError {
    const detail =
      body && typeof body === 'object' && 'detail' in body
        ? String((body as { detail: unknown }).detail)
        : undefined;

    switch (status) {
      case 401:
        return new ApiError('UNAUTHORIZED', detail ?? 'Authentication required.', status, detail);
      case 403:
        return new ApiError('FORBIDDEN', detail ?? 'Access denied.', status, detail);
      case 404:
        return new ApiError('NOT_FOUND', detail ?? 'Resource not found.', status, detail);
      case 422:
        return new ApiError('UNPROCESSABLE', detail ?? 'Invalid request data.', status, detail);
      case 429:
        return new ApiError('RATE_LIMITED', 'Too many requests. Please wait and try again.', status, detail);
      default:
        return new ApiError('SERVER_ERROR', detail ?? 'An unexpected error occurred.', status, detail);
    }
  }

  get userMessage(): string {
    return this.detail ?? this.message;
  }
}
