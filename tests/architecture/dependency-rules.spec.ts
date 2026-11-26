// tests/architecture/dependency-rules.spec.ts
import { execSync } from 'node:child_process';
import { describe, it, expect } from 'vitest';

describe('Architecture Dependency Boundaries', () => {
  it('enforces that domain has zero framework dependencies and application has no infrastructure', () => {
    try {
      const result = execSync('npx depcruise src --config .dependency-cruiser.js', {
        encoding: 'utf-8',
      });
      expect(result).not.toContain('error');
    } catch (err: unknown) {
      const output = err && typeof err === 'object' && 'stdout' in err ? String(err.stdout) : '';
      expect(output).not.toContain('error');
    }
  });
});
