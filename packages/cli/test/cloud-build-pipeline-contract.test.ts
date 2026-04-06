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
COMMAND="$*"
printf '%s\\n' "$COMMAND" >> "$FAKE_GCLOUD_LOG"
case "$COMMAND" in
  *"fully_qualified_digest"*)
    if [ -n "\${FAKE_GCLOUD_FQD:-}" ]; then
      printf '%s\\n' "$FAKE_GCLOUD_FQD"
      exit 0
    fi
    ;;
  *"image_summary.digest"*)
    if [ -n "\${FAKE_GCLOUD_DIGEST:-}" ]; then
      printf '%s\\n' "$FAKE_GCLOUD_DIGEST"
      exit 0
    fi
    ;;
esac
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

describe('cloud build pipeline contract', () => {
  it('defines fast and release gate scripts in package.json', () => {
    const packageJson = readFileSync(resolve(process.cwd(), 'package.json'), 'utf8');

    expect(packageJson).toContain('"ci:cloudbuild:fast"');
    expect(packageJson).toContain('"ci:cloudbuild:release"');
  });

  it('ships checked-in Cloud Build configs for validation and release publishing', () => {
    const validateConfig = readFileSync(resolve(process.cwd(), 'cloudbuild.validate.yaml'), 'utf8');
    const releaseConfig = readFileSync(resolve(process.cwd(), 'cloudbuild.release.yaml'), 'utf8');

    expect(validateConfig).toContain('npm run ci:cloudbuild:fast');
    expect(releaseConfig).toContain('npm run ci:cloudbuild:release');
    expect(releaseConfig).toContain('deploy/cloudrun/assert-mainline.sh');
    expect(releaseConfig).toContain('docker build');
    expect(releaseConfig).toContain('docker push');
    expect(releaseConfig).toContain('$SHORT_SHA');
    expect(releaseConfig).toContain('docker build -t "$$IMAGE_URI" .');
    expect(releaseConfig).toContain('docker push "$$IMAGE_URI"');
    expect(releaseConfig).toContain('deploy/cloudrun/resolve-image-digest.sh');
    expect(releaseConfig).toContain('deploy/cloudrun/deploy-from-image-ref.sh');
    expect(releaseConfig).toContain('deploy/cloudrun/release-metadata.sh');
  });

  it('rejects release publishing outside the configured mainline ref', () => {
    const rejected = spawnSync('bash', [resolve(process.cwd(), 'deploy/cloudrun/assert-mainline.sh')], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PAPERPARSER_REF_NAME: 'feature/demo',
      },
    });

    expect(rejected.status).not.toBe(0);
    expect(rejected.stderr).toContain('feature/demo');

    const accepted = spawnSync('bash', [resolve(process.cwd(), 'deploy/cloudrun/assert-mainline.sh')], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PAPERPARSER_REF_NAME: 'main',
      },
    });

    expect(accepted.status).toBe(0);
  });

  it('resolves the pushed Artifact Registry digest as the canonical deployment identity', () => {
    const logPath = join(mkdtempSync(join(tmpdir(), 'paperparser-gcloud-log-')), 'digest.log');
    const stdoutPath = join(mkdtempSync(join(tmpdir(), 'paperparser-gcloud-out-')), 'stdout.json');
    writeFileSync(
      stdoutPath,
      JSON.stringify(
        {
          image_summary: {
            digest: 'sha256:abc123',
            fully_qualified_digest:
              'europe-west1-docker.pkg.dev/paperparser-492322/paperparser/paperparser@sha256:abc123',
          },
        },
        null,
        2,
      ),
      'utf8',
    );
    const fakeBinDir = writeFakeGcloud(logPath, stdoutPath);
    const result = spawnSync('bash', [resolve(process.cwd(), 'deploy/cloudrun/resolve-image-digest.sh')], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${fakeBinDir}:${process.env.PATH ?? ''}`,
        FAKE_GCLOUD_DIGEST: 'sha256:abc123',
        FAKE_GCLOUD_FQD:
          'europe-west1-docker.pkg.dev/paperparser-492322/paperparser/paperparser@sha256:abc123',
        FAKE_GCLOUD_LOG: logPath,
        FAKE_GCLOUD_STDOUT: stdoutPath,
        PAPERPARSER_PROJECT: 'paperparser-492322',
        PAPERPARSER_REGION: 'europe-west1',
        PAPERPARSER_ARTIFACT_REPOSITORY: 'paperparser',
        PAPERPARSER_IMAGE_NAME: 'paperparser',
        PAPERPARSER_IMAGE_TAG: 'deadbeef',
      },
    });

    expect(result.status).toBe(0);
    const invocation = readFileSync(logPath, 'utf8');
    expect(invocation).toContain(
      'artifacts docker images describe europe-west1-docker.pkg.dev/paperparser-492322/paperparser/paperparser:deadbeef',
    );
    expect(result.stdout).toContain('"imageDigest": "sha256:abc123"');
    expect(result.stdout).toContain('"imageRef": "europe-west1-docker.pkg.dev/paperparser-492322/paperparser/paperparser@sha256:abc123"');
  });

  it('documents Cloud Build as the release contract and digest handoff path', () => {
    const runbook = readFileSync(resolve(process.cwd(), 'deploy/cloudrun/RUNBOOK.md'), 'utf8');
    const readme = readFileSync(resolve(process.cwd(), 'deploy/cloudrun/README.md'), 'utf8');

    expect(runbook).toContain('cloudbuild.validate.yaml');
    expect(runbook).toContain('cloudbuild.release.yaml');
    expect(runbook).toContain('deploy/cloudrun/connect-github-repo.sh');
    expect(runbook).toContain('deploy/cloudrun/sync-github-trigger.sh');
    expect(runbook).toContain('GitHub');
    expect(runbook).toContain('deploy/cloudrun/resolve-image-digest.sh');
    expect(readme).toContain('cloudbuild.release.yaml');
    expect(readme).toContain('GitHub');
  });

  it('prints the one-time Cloud Build GitHub connect URL for the project', () => {
    const logPath = join(mkdtempSync(join(tmpdir(), 'paperparser-gcloud-log-')), 'connect.log');
    const stdoutPath = join(mkdtempSync(join(tmpdir(), 'paperparser-gcloud-out-')), 'stdout.txt');
    writeFileSync(stdoutPath, '652654562529\n', 'utf8');
    const fakeBinDir = writeFakeGcloud(logPath, stdoutPath);
    const result = spawnSync('bash', [resolve(process.cwd(), 'deploy/cloudrun/connect-github-repo.sh')], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${fakeBinDir}:${process.env.PATH ?? ''}`,
        FAKE_GCLOUD_LOG: logPath,
        FAKE_GCLOUD_STDOUT: stdoutPath,
        PAPERPARSER_PROJECT: 'paperparser-492322',
        PAPERPARSER_TRIGGER_REGION: 'global',
      },
    });

    expect(result.status).toBe(0);
    const invocation = readFileSync(logPath, 'utf8');
    expect(invocation).toContain('projects describe paperparser-492322 --format=value(projectNumber)');
    expect(result.stdout).toContain(
      'https://console.cloud.google.com/cloud-build/triggers;region=global/connect?project=652654562529',
    );
  });

  it('syncs a GitHub mainline trigger under a bounded Cloud Build service account', () => {
    const logPath = join(mkdtempSync(join(tmpdir(), 'paperparser-gcloud-log-')), 'trigger.log');
    const stdoutPath = join(mkdtempSync(join(tmpdir(), 'paperparser-gcloud-out-')), 'stdout.txt');
    const fakeBinDir = writeFakeGcloud(logPath, stdoutPath);
    const result = spawnSync('bash', [resolve(process.cwd(), 'deploy/cloudrun/sync-github-trigger.sh')], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${fakeBinDir}:${process.env.PATH ?? ''}`,
        FAKE_GCLOUD_LOG: logPath,
        FAKE_GCLOUD_STDOUT: stdoutPath,
        PAPERPARSER_PROJECT: 'paperparser-492322',
        PAPERPARSER_TRIGGER_REGION: 'global',
        PAPERPARSER_TRIGGER_NAME: 'paperparser-main',
        PAPERPARSER_GITHUB_OWNER: 'hanzckernel',
        PAPERPARSER_GITHUB_REPO: 'MathPaperParser',
        PAPERPARSER_BUILD_SERVICE_ACCOUNT:
          'paperparser-cloudbuild@paperparser-492322.iam.gserviceaccount.com',
        PAPERPARSER_REGION: 'europe-west1',
        PAPERPARSER_SERVICE: 'paperparser',
        PAPERPARSER_RUNTIME_SERVICE_ACCOUNT:
          'paperparser-runtime@paperparser-492322.iam.gserviceaccount.com',
        PAPERPARSER_STORE_BUCKET: 'paperparser-store-paperparser-492322',
      },
    });

    expect(result.status).toBe(0);
    const invocation = readFileSync(logPath, 'utf8');
    expect(invocation).toContain('builds triggers list --project paperparser-492322 --region global');
    expect(invocation).toContain('builds triggers create github');
    expect(invocation).toContain('--name paperparser-main');
    expect(invocation).toContain('--repo-owner hanzckernel');
    expect(invocation).toContain('--repo-name MathPaperParser');
    expect(invocation).toContain('--branch-pattern ^main$');
    expect(invocation).toContain('--build-config cloudbuild.release.yaml');
    expect(invocation).toContain(
      '--service-account projects/paperparser-492322/serviceAccounts/paperparser-cloudbuild@paperparser-492322.iam.gserviceaccount.com',
    );
  });
});
