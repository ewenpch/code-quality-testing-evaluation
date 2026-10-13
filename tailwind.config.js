/**
 * ESLint-only shim for `eslint-plugin-tailwindcss`.
 *
 * The plugin resolves `settings.tailwindcss.config` -- and, when that is
 * absent, its config discovery -- relative to `process.cwd()`. ESLint is
 * invoked from two different directories in this repository:
 *
 *   - `npm run lint --workspace=frontend` runs with CWD = packages/frontend
 *   - `lint-staged` (see .lintstagedrc.json) runs `eslint --fix` from the root
 *
 * Neither a relative path in `settings` nor discovery alone is correct from
 * both locations. Re-exporting the frontend config from the repository root
 * gives the plugin a config to find no matter which directory ESLint is
 * invoked from.
 *
 * The real configuration lives in packages/frontend/tailwind.config.js, which
 * is what the PostCSS build uses. This file must not become a second source of
 * truth: it only ever re-exports the frontend one.
 */
module.exports = require('./packages/frontend/tailwind.config.js');