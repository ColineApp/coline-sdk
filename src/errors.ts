export type ColineApiErrorType = "api" | "oauth" | "network";

export class ColineApiError extends Error {
  readonly type: ColineApiErrorType;
  readonly status: number;
  readonly code: string | null;

  constructor(params: {
    message: string;
    type: ColineApiErrorType;
    status: number;
    code?: string | null;
  }) {
    super(params.message);
    this.name = "ColineApiError";
    this.type = params.type;
    this.status = params.status;
    this.code = params.code ?? null;
  }

  /** Whether this error is safe to retry (rate limit or server error). */
  get isRetryable(): boolean {
    return this.status === 429 || this.status >= 500;
  }
}

export function isColineApiError(value: unknown): value is ColineApiError {
  return value instanceof ColineApiError;
}
