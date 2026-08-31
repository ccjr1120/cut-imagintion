<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project UI Requirements

- The public portfolio should remain responsive across desktop and mobile browser viewports.
- The `/admin` content editor is still a web page, but it only needs to support desktop browser widths. Do not spend implementation effort on mobile or tablet layouts for the admin interface unless the user explicitly changes this requirement.
- Unless the user explicitly requests otherwise, do not run tests, lint checks, production builds, browser checks, or other verification commands. Only run the TypeScript type check.
