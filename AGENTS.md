# Project formatting

- Always use the project-local Prettier configuration for supported source, configuration and documentation files.
- Run `npm.cmd run format` after edits, then `npm.cmd run format:check` before finishing a task. Use `npm run` on non-Windows shells.
- Keep generated build files, runtime databases, credentials and dependency files excluded according to `.prettierignore`.
