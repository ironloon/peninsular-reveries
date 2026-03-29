import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

test.describe('INFRA-01: Build script', () => {
  test('npx tsx build.ts exits 0', () => {
    const result = execSync('npx tsx build.ts', { encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'production' } });
    expect(result).toContain('✓');
  });

  const expectedFiles = [
    'dist/index.html',
    'dist/super-word/index.html',
    'dist/404.html',
    'dist/styles/main.css',
    'dist/shared/shell.js',
    'dist/pages/home.js',
    'dist/super-word/main.js',
    'dist/pages/404.js',
    'dist/favicon.svg',
  ];

  for (const file of expectedFiles) {
    test(`build produces ${file}`, () => {
      expect(existsSync(file)).toBe(true);
    });
  }
});
