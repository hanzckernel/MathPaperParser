import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
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

describe('cloud run persistence and runbook contract', () => {
  it('documents Cloud Run-safe health and readiness probe paths', () => {
    const runbook = readFileSync(resolve(process.cwd(), 'deploy/cloudrun/RUNBOOK.md'), 'utf8');
    const smoke = readFileSync(resolve(process.cwd(), 'deploy/cloudrun/SMOKE.md'), 'utf8');

    expect(runbook).toContain('"$SERVICE_URL/health"');
    expect(runbook).toContain('"$SERVICE_URL/ready"');
    expect(runbook).not.toContain('"$SERVICE_URL/healthz"');
    expect(runbook).not.toContain('"$SERVICE_URL/readyz"');
    expect(smoke).toContain('verify `/health` and `/ready`');
    expect(smoke).not.toContain('verify `/healthz` and `/readyz`');
  });

  it('deploy helper mounts the configured Cloud Storage bucket at the store path', () => {
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
        PAPERPARSER_STORE_BUCKET: 'paperparser-store',
      },
    });

    expect(result.status).toBe(0);
    const invocation = readFileSync(logPath, 'utf8');
    expect(invocation).toContain('type=cloud-storage,bucket=paperparser-store');
    expect(invocation).toContain('mount-path=/var/paperparser/store');
  });

  it('rollback helper uses deterministic revision traffic routing', () => {
    const logPath = join(mkdtempSync(join(tmpdir(), 'paperparser-gcloud-log-')), 'rollback.log');
    const fakeBinDir = writeFakeGcloud(logPath);
    const result = spawnSync('bash', [resolve(process.cwd(), 'deploy/cloudrun/rollback.sh')], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${fakeBinDir}:${process.env.PATH ?? ''}`,
        FAKE_GCLOUD_LOG: logPath,
        PAPERPARSER_SERVICE: 'paperparser',
        PAPERPARSER_REGION: 'europe-west1',
        PAPERPARSER_REVISION: 'paperparser-00012-abc',
      },
    });

    expect(result.status).toBe(0);
    const invocation = readFileSync(logPath, 'utf8');
    expect(invocation).toContain('update-traffic');
    expect(invocation).toContain('--to-revisions=paperparser-00012-abc=100');
  });
});
