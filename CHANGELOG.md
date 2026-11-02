# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-11-02

Step 1 of the API integration (API `v0.1.0` features, types from the API's `v1.0.1` spec).

### Added

- API mode: set `NEXT_PUBLIC_API_URL` to connect to the DevFlow API; leave it empty for the unchanged demo mode.
- Committed `.env.example` documenting the variable (every other env file stays ignored).
- TypeScript types generated from the API's OpenAPI 3.1 spec with `openapi-typescript` (`npm run api:types`, pinned to the `v1.0.1` tag).
- `apiFetch()` API client: JSON, `credentials: "include"`, `ApiError` for problem+json responses (code, request id, field errors, `Retry-After`) and `NetworkError` when the server can't be reached.
- A user-facing message for every code in the API's error catalogue, plus per-field validation messages.
- Sign-in and sign-up show only the OAuth providers `GET /config` enables, with an accessible same-size placeholder while it loads; both are hidden when the API is unreachable, and email sign-in always stays available.
- README section "Connecting to the API".

## [1.0.0] - 2026-11-01

### Added

- Public landing page with a live board preview, feature highlights and a "How it works" walkthrough of the sprint process.
- Footer with social links and a "Get in touch" contact form delivered by email via FormSubmit.
- Privacy, Terms and Security pages, an illustrative system status page and a custom 404 page.
- DevFlow logo and app icons.
- Project README.

### Removed

- `create-next-app` placeholder page, favicon and assets.

## [0.3.0] - 2026-11-01

### Added

- Responsive app shell with sidebar navigation (desktop rail, mobile drawer) listing every project.
- Projects overview with active-sprint progress and a "New project" dialog.
- Profile page: personal settings form and personal access tokens (generate, copy once, revoke).
- Workspace settings: team members, role changes, invites with undo, and demo data reset.
- Sign-in and sign-up flows with validation, password strength meter and simulated OAuth, landing on the projects overview.

## [0.2.0] - 2026-11-01

### Added

- Domain model for projects, categorised workflow statuses, sprints and issues, with seed data generated relative to the current date.
- Client store persisted to `localStorage`, with actions for issues, sprint lifecycle (create, start, complete with carry-over) and workflow editing.
- Project routes under `/projects/[key]` with a shared shell, ⌘K jump-to-issue, issue detail sheet and create-issue dialog.
- Sprint board showing the active sprint in the project's workflow columns: drag-and-drop, filters, grouping, display options, quick add, column rename/reorder/delete and "Add column".
- Backlog and sprint planning with drag-and-drop ranking, start/edit/delete sprint.
- Reports: burndown, velocity and sprint history.
- Project settings: general details, workflow editor and project deletion.

## [0.1.0] - 2026-11-01

### Added

- Dark design tokens (zinc canvas, layered surfaces, hairline borders, violet accent) and global styles with reduced-motion support.
- UI primitives: button variants, form fields with accessible hints/errors, settings sections, dropdown menu, native `<dialog>` modal and sheet, avatar with presence ring, copy button, logo and brand icons.
- `cn()` class merging and hydration-safe date helpers.
- Team member model.

[1.1.0]: https://github.com/JohnReySeguma/dev-flow/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/JohnReySeguma/dev-flow/compare/v0.3.0...v1.0.0
[0.3.0]: https://github.com/JohnReySeguma/dev-flow/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/JohnReySeguma/dev-flow/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/JohnReySeguma/dev-flow/releases/tag/v0.1.0
