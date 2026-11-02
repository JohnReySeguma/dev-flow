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

type Message = string | ((error: ApiError) => string);

function minutesUntil(seconds: number | null) {
  const minutes = Math.max(1, Math.ceil((seconds ?? 60) / 60));
  return minutes === 1 ? "a minute" : `${minutes} minutes`;
}

/**
 * One user-facing message per error code — the whole catalogue in the API's INTEGRATION.md §4, including codes
 * the frontend should never see. Typed as a Record so a new code in the spec fails the build until it has a message.
 */
const MESSAGES: Record<ErrorCode, Message> = {
  BAD_REQUEST: "The request couldn't be read. Refresh the page and try again.",
  RESET_TOKEN_INVALID: "This reset link is invalid or has expired. Request a new one.",
  INVITE_INVALID: "This invite link is invalid, was replaced by a newer one, or has expired. Ask an admin to resend it.",
  UNAUTHENTICATED: "Your session has ended. Sign in again.",
  TOKEN_EXPIRED: "Your session expired. Sign in again.",
  INVALID_CREDENTIALS: "Wrong email or password.",
  WEBHOOK_SIGNATURE_INVALID: "The GitHub webhook signature was rejected.",
  FORBIDDEN: "You don't have permission to do that.",
  CANNOT_CHANGE_OWN_ROLE: "You can't change your own role.",
  CANNOT_REMOVE_SELF: "You can't remove yourself from the workspace.",
  NOT_FOUND: "That couldn't be found. It may have been deleted.",
  EMAIL_TAKEN: "An account with this email already exists. Sign in instead.",
  PROJECT_KEY_TAKEN: "That project key is already in use. Pick another one.",
  SPRINT_ALREADY_ACTIVE: "Another sprint is already active. Complete it first.",
  SPRINT_NOT_PLANNED: "Only planned sprints can be started or deleted.",
  SPRINT_NOT_ACTIVE: "Only the active sprint can be completed.",
  // The API explains which guard applied, so its detail is the most useful message here.
  STATUS_DELETE_BLOCKED: (e) => e.detail || "This column can't be deleted.",
  STATUS_UPDATE_BLOCKED: (e) => e.detail || "This change would leave the workflow without a to-do or a done column.",
  LAST_ADMIN: "The workspace needs at least one admin.",
  ALREADY_MEMBER: "This email is already a member or has a pending invite.",
  CONFLICT_STALE: "Someone else changed this in the meantime. Reload to see the latest version.",
  PAYLOAD_TOO_LARGE: "That's too much content to save at once.",
  VALIDATION_FAILED: "Some fields need attention.",
  RATE_LIMITED: (e) => `Too many attempts. Try again in ${minutesUntil(e.retryAfter)}.`,
  INTERNAL_ERROR: (e) =>
    e.requestId
      ? `Something went wrong on our side. If it keeps happening, report reference ${e.requestId}.`
      : "Something went wrong on our side. Please try again.",
  EMAIL_DELIVERY_FAILED: "The email couldn't be sent. The invite was saved, so try Resend.",
};

/** The message to show for any error thrown by `apiFetch` (or anything else). */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const message = MESSAGES[error.code];
    return typeof message === "function" ? message(error) : message;
  }
  if (error instanceof NetworkError) return "Can't reach the server. Check your connection and try again.";
  return "Something went wrong. Please try again.";
}

/** `422 VALIDATION_FAILED` messages keyed by field name, ready to show next to each input. */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || error.code !== "VALIDATION_FAILED") return {};
  return Object.fromEntries(error.errors.map(({ field, message }) => [field, message]));
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
