## Contributing to MyAyAI

Thank you for your interest in contributing! This guide will help you set up your environment, follow our conventions, and get changes merged quickly.

### Getting started
1. Fork the repo and create a feature branch from `main`
2. Work primarily inside `myayai-extension/`
3. Install deps and build:
   - `cd myayai-extension && npm install`
   - `npm run dev` (watch) or `npm run build:chrome`

### Development conventions
- Code style: ESLint (Standard). Run `npm run lint` and `npm run lint:fix`
- Types: favor explicit, readable code; avoid magical naming
- Commit messages: Conventional Commits (e.g., `feat: add platform-aware tuning for Gemini`)
- Tests: add or update Jest tests if applicable (`npm test`)

### Pull requests
- Small, focused PRs are easier to review
- Include a clear description, screenshots (if UI), and test plan
- Update documentation when behavior or APIs change
- Ensure CI/lint passes

### Issue reporting
- Use GitHub Issues with a minimal reproduction, expected/actual behavior, and environment details
- Tag appropriately (bug, enhancement, docs, good first issue)

### Release process (maintainers)
1. Update `CHANGELOG.md`
2. Bump version in `myayai-extension/package.json`
3. Build and pack: `npm run build:chrome && npm run pack:chrome`
4. Submit to the Chrome Web Store and attach release notes

### Code of Conduct
By participating, you agree to uphold a friendly, respectful, and inclusive environment.

### Questions?
Open an issue or email support@myayai.com


