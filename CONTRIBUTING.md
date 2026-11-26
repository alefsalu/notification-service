# Contributing to notification-service

Thank you for your interest in contributing!

## Development Guidelines

1. **Commit Messages**: Follow Conventional Commits format:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `test:` for adding or updating tests
   - `chore:` for tooling, dependencies, or configuration changes
   - `docs:` for documentation updates
   - `refactor:` for code restructuring without behavior changes
2. **Architecture Boundaries**: Respect Hexagonal architecture layers. Run `npm run test:arch` to ensure no dependency rule violations occur.
3. **Sensitive Files Guardrail**: Never commit `.env`, `_PESSOAL/`, `.superpowers/`, or RSA private keys (`*.pem`, `keys/`). Ensure `bash scripts/guard.sh` passes before opening a pull request.
4. **Code Style & Formatting**: Run `npm run format` and `npm run lint` before committing.
5. **Testing**: All new features must include unit or integration tests with >= 80% line coverage in domain and application layers (`npm run test:cov`).
