// tests/bootstrap/guard.spec.ts
import { execSync } from 'node:child_process';
import { describe, it, expect } from 'vitest';

describe('Guard Script', () => {
  it('exits with code 0 when no prohibited files are tracked in git index', () => {
    const output = execSync('bash scripts/guard.sh', { encoding: 'utf-8' });
    expect(output).toContain('Guard passed: no sensitive files tracked.');
  });
});
