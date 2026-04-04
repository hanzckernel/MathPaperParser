import { chmodSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

function writeFakeGcloud(logPath: string): string {
  const binDir = mkdtempSync(join(tmpdir(), 'paperparser-gcloud-bin-'));
  const fakePath = join(binDir, 'gcloud');
  writeFileSync(
    fakePath,
    `#!/bin/sh
printf '%s\n' "$@" > "$FAKE_GCLOUD_LOG"
`,
    'utf8',
  );
  chmodSync(fakePath, 0o755);
  return binDir;
}

describe('cloud run shared deployment security contract', () => {
  it('deploy helper keeps Cloud Run IAM authentication enabled', () => {
    const logPath = join(mkdtempSync(join(tmpdir(), 'paperparser-gcloud-log-')), 'deploy.log');
    const fakeBinDir = writeFakeGcloud(logPath);
    const result = spawnSync('bash', [resolve(process.cwd(), 'deploy/cloudrun/deploy.sh')], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${fakeBinDir}:${process.env.PATH ?? ''}`,
        FAKE_GCLOUD_LOG: logPath,
        PAPERPARSER_SERVICE: 'paperparser',
        PAPERPARSER_IMAGE: 'us-central1-docker.pkg.dev/demo/paperparser:latest',
        PAPERPARSER_REGION: 'europe-west1',
        PAPERPARSER_RUNTIME_SERVICE_ACCOUNT: 'paperparser-runner@example.iam.gserviceaccount.com',
      },
    });

    expect(result.status).toBe(0);
    const invocation = readFileSync(logPath, 'utf8');
    expect(invocation).toContain('--invoker-iam-check');
    expect(invocation).not.toContain('--no-invoker-iam-check');
  });

  it('invoker helper grants roles/run.invoker to named principals only', () => {
    const logPath = join(mkdtempSync(join(tmpdir(), 'paperparser-gcloud-log-')), 'grant.log');
    const fakeBinDir = writeFakeGcloud(logPath);
    const result = spawnSync('bash', [resolve(process.cwd(), 'deploy/cloudrun/grant-invoker.sh')], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${fakeBinDir}:${process.env.PATH ?? ''}`,
        FAKE_GCLOUD_LOG: logPath,
        PAPERPARSER_SERVICE: 'paperparser',
        PAPERPARSER_REGION: 'europe-west1',
        PAPERPARSER_MEMBER: 'user:alice@example.com',
      },
    });

    expect(result.status).toBe(0);
    const invocation = readFileSync(logPath, 'utf8');
    expect(invocation).toContain('add-iam-policy-binding');
    expect(invocation).toContain('roles/run.invoker');
    expect(invocation).toContain('user:alice@example.com');
  });

  it('invoker helper rejects unsupported public principals', () => {
    const logPath = join(mkdtempSync(join(tmpdir(), 'paperparser-gcloud-log-')), 'grant.log');
    const fakeBinDir = writeFakeGcloud(logPath);
    const result = spawnSync('bash', [resolve(process.cwd(), 'deploy/cloudrun/grant-invoker.sh')], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${fakeBinDir}:${process.env.PATH ?? ''}`,
        FAKE_GCLOUD_LOG: logPath,
        PAPERPARSER_SERVICE: 'paperparser',
        PAPERPARSER_REGION: 'europe-west1',
        PAPERPARSER_MEMBER: 'allUsers',
      },
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('allUsers');
    expect(existsSync(logPath)).toBe(false);
  });
});
