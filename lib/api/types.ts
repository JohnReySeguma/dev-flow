import type { components } from "./schema";

/*
 * Readable names for the generated OpenAPI types (lib/api/schema.d.ts, from the API's v1.0.1 spec).
 * Regenerate with `npm run api:types`; never edit schema.d.ts by hand.
 */

type Schemas = components["schemas"];

/** `GET /config`: which optional features the server has enabled. */
export type PublicConfig = Schemas["PublicConfig"];

/** RFC 9457 problem+json body returned by every non-2xx response. */
export type ProblemDetails = Schemas["ProblemDetails"];

/** Stable error codes; switch on these, never on `title` or `detail`. */
export type ErrorCode = ProblemDetails["code"];

/** One invalid field of a `422 VALIDATION_FAILED` response. */
export type FieldError = NonNullable<ProblemDetails["errors"]>[number];
