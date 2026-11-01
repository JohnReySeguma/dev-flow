# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.3.0]: https://github.com/JohnReySeguma/dev-flow/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/JohnReySeguma/dev-flow/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/JohnReySeguma/dev-flow/releases/tag/v0.1.0
