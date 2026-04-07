import { chmodSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

function writeFakeGcloud(logPath: string, stdoutPath: string): string {
  const binDir = mkdtempSync(join(tmpdir(), 'paperparser-gcloud-bin-'));
  const fakePath = join(binDir, 'gcloud');
  writeFileSync(
    fakePath,
    `#!/bin/sh
set -eu
COMMAND="$*"
IFS=';'
for pattern in \${FAKE_GCLOUD_FAIL_ON:-}; do
  if [ -n "$pattern" ]; then
    case "$COMMAND" in
      *"$pattern"*)
        exit 1
        ;;
    esac
  fi
done
printf '%s\\n' "$COMMAND" >> "$FAKE_GCLOUD_LOG"
if [ -n "\${FAKE_GCLOUD_STDOUT:-}" ] && [ -f "$FAKE_GCLOUD_STDOUT" ]; then
  cat "$FAKE_GCLOUD_STDOUT"
fi
`,
    'utf8',
  );
  chmodSync(fakePath, 0o755);
  if (!existsSync(stdoutPath)) {
    writeFileSync(stdoutPath, '', 'utf8');
  }
  return binDir;
}

describe('cloud run bootstrap and live deploy contract', () => {
  it('ships a gcloudignore that excludes local caches and generated runtime state from Cloud Build uploads', () => {
    const ignoreFile = readFileSync(resolve(process.cwd(), '.gcloudignore'), 'utf8');

    expect(ignoreFile).toContain('.git');
    expect(ignoreFile).toContain('.gcloud/');
    expect(ignoreFile).toContain('.npm-cache/');
    expect(ignoreFile).toContain('.paperparser-data/');
    expect(ignoreFile).toContain('.playwright-cli/');
    expect(ignoreFile).toContain('output/');
    expect(ignoreFile).toContain('packages/web/public/');
  });

  it('bootstrap helper enables core APIs and provisions missing registry, bucket, runtime service account, and bounded Cloud Build service account', () => {
    const logPath = join(mkdtempSync(join(tmpdir(), 'paperparser-gcloud-log-')), 'bootstrap.log');
    const stdoutPath = join(mkdtempSync(join(tmpdir(), 'paperparser-gcloud-out-')), 'stdout.txt');
    const fakeBinDir = writeFakeGcloud(logPath, stdoutPath);
    const result = spawnSync('bash', [resolve(process.cwd(), 'deploy/cloudrun/bootstrap.sh')], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${fakeBinDir}:${process.env.PATH ?? ''}`,
        FAKE_GCLOUD_LOG: logPath,
        FAKE_GCLOUD_STDOUT: stdoutPath,
        FAKE_GCLOUD_FAIL_ON:
          'artifacts repositories describe;iam service-accounts describe;storage buckets describe',
        PAPERPARSER_PROJECT: 'paperparser-492322',
        PAPERPARSER_REGION: 'europe-west1',
        PAPERPARSER_ARTIFACT_REPOSITORY: 'paperparser',
        PAPERPARSER_BUILD_SERVICE_ACCOUNT:
          'paperparser-cloudbuild@paperparser-492322.iam.gserviceaccount.com',
        PAPERPARSER_RUNTIME_SERVICE_ACCOUNT:
          'paperparser-runtime@paperparser-492322.iam.gserviceaccount.com',
        PAPERPARSER_STORE_BUCKET: 'paperparser-store-paperparser-492322',
      },
    });

    expect(result.status).toBe(0);
    const invocation = readFileSync(logPath, 'utf8');
    expect(invocation).toContain(
      'services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com storage.googleapis.com',
    );
    expect(invocation).toContain(
      'artifacts repositories create paperparser --project=paperparser-492322 --repository-format=docker --location=europe-west1',
    );
    expect(invocation).toContain('iam service-accounts create paperparser-cloudbuild');
    expect(invocation).toContain('iam service-accounts create paperparser-runtime');
    expect(invocation).toContain(
      'projects add-iam-policy-binding paperparser-492322 --member=serviceAccount:paperparser-cloudbuild@paperparser-492322.iam.gserviceaccount.com --role=roles/artifactregistry.writer',
    );
    expect(invocation).toContain(
      'projects add-iam-policy-binding paperparser-492322 --member=serviceAccount:paperparser-cloudbuild@paperparser-492322.iam.gserviceaccount.com --role=roles/run.admin',
    );
    expect(invocation).toContain(
      'projects add-iam-policy-binding paperparser-492322 --member=serviceAccount:paperparser-cloudbuild@paperparser-492322.iam.gserviceaccount.com --role=roles/logging.logWriter',
    );
    expect(invocation).toContain(
      'iam service-accounts add-iam-policy-binding paperparser-runtime@paperparser-492322.iam.gserviceaccount.com --project=paperparser-492322 --member=serviceAccount:paperparser-cloudbuild@paperparser-492322.iam.gserviceaccount.com --role=roles/iam.serviceAccountUser',
    );
    expect(invocation).toContain(
      'iam service-accounts add-iam-policy-binding paperparser-cloudbuild@paperparser-492322.iam.gserviceaccount.com --project=paperparser-492322 --member=serviceAccount:paperparser-cloudbuild@paperparser-492322.iam.gserviceaccount.com --role=roles/iam.serviceAccountOpenIdTokenCreator',
    );
    expect(invocation).toContain(
      'storage buckets create gs://paperparser-store-paperparser-492322 --project=paperparser-492322 --location=europe-west1 --uniform-bucket-level-access',
    );
    expect(invocation).toContain(
      'storage buckets add-iam-policy-binding gs://paperparser-store-paperparser-492322 --member=serviceAccount:paperparser-runtime@paperparser-492322.iam.gserviceaccount.com --role=roles/storage.objectUser',
    );
    expect(result.stdout).toContain('PAPERPARSER_PROJECT=paperparser-492322');
    expect(result.stdout).toContain(
      'PAPERPARSER_BUILD_SERVICE_ACCOUNT=paperparser-cloudbuild@paperparser-492322.iam.gserviceaccount.com',
    );
    expect(result.stdout).toContain(
      'PAPERPARSER_IMAGE=europe-west1-docker.pkg.dev/paperparser-492322/paperparser/paperparser:',
    );
  });

  it('build-image helper submits the repo to Cloud Build with an immutable Artifact Registry tag', () => {
    const logPath = join(mkdtempSync(join(tmpdir(), 'paperparser-gcloud-log-')), 'build.log');
    const stdoutPath = join(mkdtempSync(join(tmpdir(), 'paperparser-gcloud-out-')), 'stdout.txt');
    const fakeBinDir = writeFakeGcloud(logPath, stdoutPath);
    const result = spawnSync('bash', [resolve(process.cwd(), 'deploy/cloudrun/build-image.sh')], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${fakeBinDir}:${process.env.PATH ?? ''}`,
        FAKE_GCLOUD_LOG: logPath,
        FAKE_GCLOUD_STDOUT: stdoutPath,
        PAPERPARSER_PROJECT: 'paperparser-492322',
        PAPERPARSER_REGION: 'europe-west1',
        PAPERPARSER_ARTIFACT_REPOSITORY: 'paperparser',
        PAPERPARSER_IMAGE_TAG: 'test-sha',
      },
    });

    expect(result.status).toBe(0);
    const invocation = readFileSync(logPath, 'utf8');
    expect(invocation).toContain(
      'builds submit --project=paperparser-492322 --tag=europe-west1-docker.pkg.dev/paperparser-492322/paperparser/paperparser:test-sha .',
    );
    expect(result.stdout.trim()).toContain(
      'europe-west1-docker.pkg.dev/paperparser-492322/paperparser/paperparser:test-sha',
    );
  });

  it('service-metadata helper reads the deployed service URL and latest ready revision from Cloud Run', () => {
    const logPath = join(mkdtempSync(join(tmpdir(), 'paperparser-gcloud-log-')), 'metadata.log');
    const stdoutPath = join(mkdtempSync(join(tmpdir(), 'paperparser-gcloud-out-')), 'stdout.txt');
    writeFileSync(
      stdoutPath,
      JSON.stringify(
        {
          metadata: { name: 'paperparser' },
          status: {
            url: 'https://paperparser-abc-ew.a.run.app',
            latestReadyRevisionName: 'paperparser-00042-xyz',
          },
        },
        null,
        2,
      ),
      'utf8',
    );
    const fakeBinDir = writeFakeGcloud(logPath, stdoutPath);
    const result = spawnSync('bash', [resolve(process.cwd(), 'deploy/cloudrun/service-metadata.sh')], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${fakeBinDir}:${process.env.PATH ?? ''}`,
        FAKE_GCLOUD_LOG: logPath,
        FAKE_GCLOUD_STDOUT: stdoutPath,
        PAPERPARSER_PROJECT: 'paperparser-492322',
        PAPERPARSER_REGION: 'europe-west1',
        PAPERPARSER_SERVICE: 'paperparser',
      },
    });

    expect(result.status).toBe(0);
    const invocation = readFileSync(logPath, 'utf8');
    expect(invocation).toContain(
      'run services describe paperparser --project=paperparser-492322 --region=europe-west1',
    );
    expect(result.stdout).toContain('paperparser-00042-xyz');
    expect(result.stdout).toContain('https://paperparser-abc-ew.a.run.app');
  });

  it('deploy-from-image-ref helper deploys the exact digest-backed image identity', () => {
    const logPath = join(mkdtempSync(join(tmpdir(), 'paperparser-gcloud-log-')), 'deploy-from-ref.log');
    const stdoutPath = join(mkdtempSync(join(tmpdir(), 'paperparser-gcloud-out-')), 'stdout.txt');
    const fakeBinDir = writeFakeGcloud(logPath, stdoutPath);
    const jsonPath = join(mkdtempSync(join(tmpdir(), 'paperparser-image-json-')), 'cloudrun-image.json');
    writeFileSync(
      jsonPath,
      JSON.stringify(
        {
          imageTag: 'europe-west1-docker.pkg.dev/paperparser-492322/paperparser/paperparser:deadbeef',
          imageDigest: 'sha256:abc123',
          imageRef:
            'europe-west1-docker.pkg.dev/paperparser-492322/paperparser/paperparser@sha256:abc123',
        },
        null,
        2,
      ),
      'utf8',
    );

    const result = spawnSync('bash', [resolve(process.cwd(), 'deploy/cloudrun/deploy-from-image-ref.sh')], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${fakeBinDir}:${process.env.PATH ?? ''}`,
        FAKE_GCLOUD_LOG: logPath,
        FAKE_GCLOUD_STDOUT: stdoutPath,
        PAPERPARSER_IMAGE_JSON: jsonPath,
        PAPERPARSER_PROJECT: 'paperparser-492322',
        PAPERPARSER_REGION: 'europe-west1',
        PAPERPARSER_SERVICE: 'paperparser',
        PAPERPARSER_RUNTIME_SERVICE_ACCOUNT:
          'paperparser-runtime@paperparser-492322.iam.gserviceaccount.com',
        PAPERPARSER_STORE_BUCKET: 'paperparser-store-paperparser-492322',
      },
    });

    expect(result.status).toBe(0);
    const invocation = readFileSync(logPath, 'utf8');
    expect(invocation).toContain(
      'run deploy paperparser --project paperparser-492322 --image europe-west1-docker.pkg.dev/paperparser-492322/paperparser/paperparser@sha256:abc123 --region europe-west1',
    );
  });
});
