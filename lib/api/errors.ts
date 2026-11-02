import type { ErrorCode, FieldError, ProblemDetails } from "./types";

/** A non-2xx API response, parsed from its `application/problem+json` body. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly title: string;
  readonly detail: string;
  /** Repeats the `X-Request-Id` header; quote it when reporting a problem. */
  readonly requestId: string | null;
  /** Invalid fields, on `422 VALIDATION_FAILED` only. */
  readonly errors: FieldError[];
  /** Seconds from `Retry-After`, on `429 RATE_LIMITED`. */
  readonly retryAfter: number | null;

  constructor(problem: ProblemDetails, retryAfter: number | null) {
    super(problem.detail || problem.title);
    this.name = "ApiError";
    this.status = problem.status;
    this.code = problem.code;
    this.title = problem.title;
    this.detail = problem.detail;
    this.requestId = problem.requestId || null;
    this.errors = problem.errors ?? [];
    this.retryAfter = retryAfter;
  }
}

/** The request never got an answer: the API is down, unreachable, or blocked by CORS. */
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super("Can't reach the DevFlow server.", { cause });
    this.name = "NetworkError";
  }
}

function isProblem(value: unknown): value is ProblemDetails {
  return typeof value === "object" && value !== null && "code" in value && "status" in value;
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);
  const date = Date.parse(header);
  return Number.isNaN(date) ? null : Math.max(0, Math.round((date - Date.now()) / 1000));
}

/**
 * Builds an ApiError from a failed response. The contract says every error is problem+json; anything else
 * (e.g. an HTML page from a proxy) is reported as INTERNAL_ERROR so callers still get one error type.
 */
export async function toApiError(response: Response): Promise<ApiError> {
  const requestId = response.headers.get("X-Request-Id");
  const retryAfter = parseRetryAfter(response.headers.get("Retry-After"));
  const body: unknown = await response.json().catch(() => null);

  if (isProblem(body)) return new ApiError({ ...body, requestId: body.requestId || requestId || "" }, retryAfter);

  return new ApiError(
    {
      type: "urn:devflow:error:INTERNAL_ERROR",
      title: response.statusText || "Unexpected response",
      status: response.status,
      detail: `The server answered ${response.status} without a problem+json body.`,
      instance: new URL(response.url || "http://invalid").pathname,
      code: "INTERNAL_ERROR",
      requestId: requestId ?? "",
    },
    retryAfter,
  );
}
