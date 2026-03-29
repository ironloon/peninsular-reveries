import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test.describe('INFRA-02: GitHub Actions deployment', () => {
  let workflow: string;

  test.beforeAll(() => {
    workflow = readFileSync('.github/workflows/deploy.yml', 'utf-8');
  });

  test('triggers on push to main', () => {
    expect(workflow).toContain('push:');
    expect(workflow).toContain('branches: [main]');
  });

  test('has build job with tsx build step', () => {
    expect(workflow).toContain('npx tsx build.ts');
  });

  test('uploads pages artifact', () => {
    expect(workflow).toContain('actions/upload-pages-artifact');
  });

  test('has deploy job that needs build', () => {
    expect(workflow).toContain('actions/deploy-pages');
    // deploy needs build (and possibly test)
    expect(workflow).toMatch(/deploy:[\s\S]*?needs:/);
  });

  test('has test job gating deployment', () => {
    expect(workflow).toContain('npx playwright test');
    // deploy must depend on test
    expect(workflow).toMatch(/needs:.*test/);
  });
});
