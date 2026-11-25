import { defineConfig } from '@playwright/test'

import {
  baseURL,
  databaseURL,
  minioBucket,
  minioPassword,
  minioPort,
  minioUser,
  payloadSecret,
  port,
} from './tests/e2e/env'

const slowMo = Number(process.env.PLAYWRIGHT_SLOW_MO ?? '0')

// Set PLAYWRIGHT_BASE_URL to run against an already deployed app (e.g. a Railway e2e
// environment) instead of starting the local Docker stack. The target must have an empty
// database: the suite onboards the first admin and seeding wipes all content. Never use production.
const remoteTarget = Boolean(process.env.PLAYWRIGHT_BASE_URL)

if (remoteTarget && /production/i.test(new URL(baseURL).hostname)) {
  throw new Error(`Refusing to run the e2e suite against ${baseURL}: it seeds and wipes data.`)
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 180000,
  expect: {
    timeout: 15000,
  },
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: slowMo > 0 ? { slowMo } : undefined,
    // Optional installed browser (e.g. PLAYWRIGHT_CHANNEL=chrome) where Playwright ships no Chromium build, such as macOS 13
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  },
  webServer: remoteTarget
    ? undefined
    : {
        command: 'node ./tests/e2e/web-server.mjs',
        url: `${baseURL}/api/health`,
        reuseExistingServer: !process.env.CI,
        stdout: 'pipe',
        stderr: 'pipe',
        env: {
          ...process.env,
          PORT: String(port),
          DATABASE_URL: databaseURL,
          PAYLOAD_SECRET: payloadSecret,
          NEXT_PUBLIC_SERVER_URL: baseURL,
          // Uploads go to the local MinIO bucket, like production's Railway Bucket
          S3_BUCKET: minioBucket,
          S3_ENDPOINT: `http://127.0.0.1:${minioPort}`,
          S3_REGION: 'us-east-1',
          S3_ACCESS_KEY_ID: minioUser,
          S3_SECRET_ACCESS_KEY: minioPassword,
          // MinIO on localhost needs path-style URLs; Railway Buckets use the default virtual-hosted style
          S3_FORCE_PATH_STYLE: 'true',
          // Keep e2e runs local and deterministic: no SMTP, no background job runner
          SMTP_HOST: '',
          DISABLE_JOBS_AUTORUN: 'true',
        },
        timeout: 600000,
      },
})
