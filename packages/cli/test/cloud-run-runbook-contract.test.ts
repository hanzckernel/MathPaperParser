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

function writeFakeCommand(binDir: string, name: string, body: string): void {
  const fakePath = join(binDir, name);
  writeFileSync(fakePath, body, 'utf8');
  chmodSync(fakePath, 0o755);
}

describe('cloud run persistence and runbook contract', () => {
  it('documents Cloud Run-safe health and readiness probe paths', () => {
    const runbook = readFileSync(resolve(process.cwd(), 'deploy/cloudrun/RUNBOOK.md'), 'utf8');
    const smoke = readFileSync(resolve(process.cwd(), 'deploy/cloudrun/SMOKE.md'), 'utf8');

    expect(runbook).toContain('deploy/cloudrun/gcloud.sh builds submit --config=cloudbuild.validate.yaml .');
    expect(runbook).toContain('deploy/cloudrun/gcloud.sh auth print-identity-token');
    expect(runbook).toContain('"$SERVICE_URL/health"');
    expect(runbook).toContain('"$SERVICE_URL/ready"');
    expect(runbook).toContain('deploy/cloudrun/live-smoke.sh');
    expect(runbook).toContain('cloudrun-smoke.json');
    expect(runbook).toContain('Failure Recovery');
    expect(runbook).not.toContain('"$SERVICE_URL/healthz"');
    expect(runbook).not.toContain('"$SERVICE_URL/readyz"');
    expect(smoke).toContain('verify `/health` and `/ready`');
    expect(smoke).toContain('deploy/cloudrun/live-smoke.sh');
    expect(smoke).toContain('cloudrun-smoke.json');
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

  it('deploy helper can grant the Cloud Build deploy service account invoker access for blocking smoke', () => {
    const logPath = join(mkdtempSync(join(tmpdir(), 'paperparser-gcloud-log-')), 'deploy.log');
    const fakeBinDir = writeFakeGcloud(logPath);
    const result = spawnSync('bash', [resolve(process.cwd(), 'deploy/cloudrun/deploy.sh')], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${fakeBinDir}:${process.env.PATH ?? ''}`,
        FAKE_GCLOUD_LOG: logPath,
        PAPERPARSER_PROJECT: 'paperparser-492322',
        PAPERPARSER_SERVICE: 'paperparser',
        PAPERPARSER_IMAGE: 'us-central1-docker.pkg.dev/demo/paperparser:latest',
        PAPERPARSER_REGION: 'europe-west1',
        PAPERPARSER_RUNTIME_SERVICE_ACCOUNT: 'paperparser-runner@example.iam.gserviceaccount.com',
        PAPERPARSER_STORE_BUCKET: 'paperparser-store',
        PAPERPARSER_BUILD_SERVICE_ACCOUNT:
          'paperparser-cloudbuild@paperparser-492322.iam.gserviceaccount.com',
      },
    });

    expect(result.status).toBe(0);
    const invocation = readFileSync(logPath, 'utf8');
    expect(invocation).toContain('add-iam-policy-binding');
    expect(invocation).toContain('paperparser');
    expect(invocation).toContain('--member');
    expect(invocation).toContain('serviceAccount:paperparser-cloudbuild@paperparser-492322.iam.gserviceaccount.com');
    expect(invocation).toContain('--role');
    expect(invocation).toContain('roles/run.invoker');
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

  it('runs authenticated live smoke and emits rollback guidance for the previous revision', () => {
    const smokeScript = readFileSync(resolve(process.cwd(), 'deploy/cloudrun/live-smoke.sh'), 'utf8');
    expect(smokeScript).not.toContain('python3');

    const fakeBinDir = mkdtempSync(join(tmpdir(), 'paperparser-smoke-bin-'));
    const gcloudLogPath = join(mkdtempSync(join(tmpdir(), 'paperparser-gcloud-log-')), 'smoke-gcloud.log');
    const curlLogPath = join(mkdtempSync(join(tmpdir(), 'paperparser-curl-log-')), 'smoke-curl.log');
    const imageJsonPath = join(mkdtempSync(join(tmpdir(), 'paperparser-smoke-json-')), 'cloudrun-image.json');

    writeFakeCommand(
      fakeBinDir,
      'gcloud',
      `#!/bin/sh
printf '%s\n' "$*" >> "$FAKE_GCLOUD_LOG"
case "$*" in
  *"run services describe paperparser"*)
    printf '%s,%s\n' "https://paperparser.example.run.app" "paperparser-00008-new"
    ;;
  *"auth print-identity-token"*)
    printf '%s\n' "fake-token"
    ;;
  *"run revisions list"*)
    printf '%s\n' "paperparser-00008-new"
    printf '%s\n' "paperparser-00007-old"
    ;;
  *)
    exit 0
    ;;
esac
`,
    );
    writeFakeCommand(
      fakeBinDir,
      'curl',
      `#!/bin/sh
printf '%s\n' "$*" >> "$FAKE_CURL_LOG"
case "$*" in
  *"/health"*)
    printf '%s\n' '{"ok":true}'
    ;;
  *"/ready"*)
    printf '%s\n' '{"ok":true,"runtimeMode":"deployed"}'
    ;;
  *"/api/papers"*)
    printf '%s\n' '{"papers":[]}'
    ;;
  *)
    printf '%s\n' '{"error":"unexpected"}' >&2
    exit 1
    ;;
esac
`,
    );
    writeFileSync(imageJsonPath, JSON.stringify({ imageRef: 'repo@sha256:abc123' }), 'utf8');

    const result = spawnSync('bash', [resolve(process.cwd(), 'deploy/cloudrun/live-smoke.sh')], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${fakeBinDir}:${process.env.PATH ?? ''}`,
        FAKE_GCLOUD_LOG: gcloudLogPath,
        FAKE_CURL_LOG: curlLogPath,
        PAPERPARSER_PROJECT: 'paperparser-492322',
        PAPERPARSER_REGION: 'europe-west1',
        PAPERPARSER_SERVICE: 'paperparser',
        PAPERPARSER_IMAGE_JSON: imageJsonPath,
      },
    });

    expect(result.status).toBe(0);
    const gcloudInvocation = readFileSync(gcloudLogPath, 'utf8');
    expect(gcloudInvocation).toContain('run services describe paperparser');
    expect(gcloudInvocation).toContain('auth print-identity-token');
    expect(gcloudInvocation).toContain('run revisions list --project paperparser-492322 --service paperparser --region europe-west1');

    const curlInvocation = readFileSync(curlLogPath, 'utf8');
    expect(curlInvocation).toContain('Authorization: Bearer fake-token');
    expect(curlInvocation).toContain('https://paperparser.example.run.app/health');
    expect(curlInvocation).toContain('https://paperparser.example.run.app/ready');
    expect(curlInvocation).toContain('https://paperparser.example.run.app/api/papers');

    expect(result.stdout).toContain('"serviceUrl": "https://paperparser.example.run.app"');
    expect(result.stdout).toContain('"currentRevision": "paperparser-00008-new"');
    expect(result.stdout).toContain('"previousRevision": "paperparser-00007-old"');
    expect(result.stdout).toContain('"imageRef": "repo@sha256:abc123"');
    expect(result.stdout).toContain("PAPERPARSER_REVISION='paperparser-00007-old' deploy/cloudrun/rollback.sh");
  });

  it('falls back to metadata identity tokens when gcloud cannot mint one in hosted smoke', () => {
    const fakeBinDir = mkdtempSync(join(tmpdir(), 'paperparser-smoke-bin-'));
    const gcloudLogPath = join(mkdtempSync(join(tmpdir(), 'paperparser-gcloud-log-')), 'smoke-gcloud.log');
    const curlLogPath = join(mkdtempSync(join(tmpdir(), 'paperparser-curl-log-')), 'smoke-curl.log');
    const imageJsonPath = join(mkdtempSync(join(tmpdir(), 'paperparser-smoke-json-')), 'cloudrun-image.json');

    writeFakeCommand(
      fakeBinDir,
      'gcloud',
      `#!/bin/sh
printf '%s\n' "$*" >> "$FAKE_GCLOUD_LOG"
case "$*" in
  *"run services describe paperparser"*)
    printf '%s,%s\n' "https://paperparser.example.run.app" "paperparser-00009-new"
    ;;
  *"auth print-identity-token"*)
    printf '%s\n' "ERROR: no identity token from gcloud" >&2
    exit 1
    ;;
  *"run revisions list"*)
    printf '%s\n' "paperparser-00009-new"
    printf '%s\n' "paperparser-00008-old"
    ;;
  *)
    exit 0
    ;;
esac
`,
    );
    writeFakeCommand(
      fakeBinDir,
      'curl',
      `#!/bin/sh
printf '%s\n' "$*" >> "$FAKE_CURL_LOG"
case "$*" in
  *"http://metadata/computeMetadata/v1/instance/service-accounts/default/identity"*)
    printf '%s\n' "metadata-token"
    ;;
  *"metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity"*)
    printf '%s\n' "metadata-token"
    ;;
  *"/health"*)
    printf '%s\n' '{"ok":true}'
    ;;
  *"/ready"*)
    printf '%s\n' '{"ok":true,"runtimeMode":"deployed"}'
    ;;
  *"/api/papers"*)
    printf '%s\n' '{"papers":[]}'
    ;;
  *)
    printf '%s\n' '{"error":"unexpected"}' >&2
    exit 1
    ;;
esac
`,
    );
    writeFileSync(imageJsonPath, JSON.stringify({ imageRef: 'repo@sha256:def456' }), 'utf8');

    const result = spawnSync('bash', [resolve(process.cwd(), 'deploy/cloudrun/live-smoke.sh')], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${fakeBinDir}:${process.env.PATH ?? ''}`,
        FAKE_GCLOUD_LOG: gcloudLogPath,
        FAKE_CURL_LOG: curlLogPath,
        PAPERPARSER_PROJECT: 'paperparser-492322',
        PAPERPARSER_REGION: 'europe-west1',
        PAPERPARSER_SERVICE: 'paperparser',
        PAPERPARSER_IMAGE_JSON: imageJsonPath,
      },
    });

    expect(result.status).toBe(0);
    const curlInvocation = readFileSync(curlLogPath, 'utf8');
    expect(curlInvocation).toContain('http://metadata/computeMetadata/v1/instance/service-accounts/default/identity');
    expect(curlInvocation).toContain('Authorization: Bearer metadata-token');
    expect(result.stdout).toContain('"currentRevision": "paperparser-00009-new"');
    expect(result.stdout).toContain('"previousRevision": "paperparser-00008-old"');
  });

  it('accepts pretty-printed health and ready JSON in hosted smoke responses', () => {
    const fakeBinDir = mkdtempSync(join(tmpdir(), 'paperparser-smoke-bin-'));
    const gcloudLogPath = join(mkdtempSync(join(tmpdir(), 'paperparser-gcloud-log-')), 'smoke-gcloud.log');
    const curlLogPath = join(mkdtempSync(join(tmpdir(), 'paperparser-curl-log-')), 'smoke-curl.log');
    const imageJsonPath = join(mkdtempSync(join(tmpdir(), 'paperparser-smoke-json-')), 'cloudrun-image.json');

    writeFakeCommand(
      fakeBinDir,
      'gcloud',
      `#!/bin/sh
printf '%s\n' "$*" >> "$FAKE_GCLOUD_LOG"
case "$*" in
  *"run services describe paperparser"*)
    printf '%s,%s\n' "https://paperparser.example.run.app" "paperparser-00010-new"
    ;;
  *"auth print-identity-token"*)
    printf '%s\n' "fake-token"
    ;;
  *"run revisions list"*)
    printf '%s\n' "paperparser-00010-new"
    printf '%s\n' "paperparser-00009-old"
    ;;
  *)
    exit 0
    ;;
esac
`,
    );
    writeFakeCommand(
      fakeBinDir,
      'curl',
      `#!/bin/sh
printf '%s\n' "$*" >> "$FAKE_CURL_LOG"
case "$*" in
  *"/health"*)
    printf '%s\n' '{'
    printf '%s\n' '  "ok": true'
    printf '%s\n' '}'
    ;;
  *"/ready"*)
    printf '%s\n' '{'
    printf '%s\n' '  "ok": true,'
    printf '%s\n' '  "runtimeMode": "deployed"'
    printf '%s\n' '}'
    ;;
  *"/api/papers"*)
    printf '%s\n' '{'
    printf '%s\n' '  "papers": []'
    printf '%s\n' '}'
    ;;
  *)
    printf '%s\n' '{"error":"unexpected"}' >&2
    exit 1
    ;;
esac
`,
    );
    writeFileSync(imageJsonPath, JSON.stringify({ imageRef: 'repo@sha256:jkl012' }), 'utf8');

    const result = spawnSync('bash', [resolve(process.cwd(), 'deploy/cloudrun/live-smoke.sh')], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${fakeBinDir}:${process.env.PATH ?? ''}`,
        FAKE_GCLOUD_LOG: gcloudLogPath,
        FAKE_CURL_LOG: curlLogPath,
        PAPERPARSER_PROJECT: 'paperparser-492322',
        PAPERPARSER_REGION: 'europe-west1',
        PAPERPARSER_SERVICE: 'paperparser',
        PAPERPARSER_IMAGE_JSON: imageJsonPath,
      },
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('"currentRevision": "paperparser-00010-new"');
    expect(result.stdout).toContain('"previousRevision": "paperparser-00009-old"');
  });
});
