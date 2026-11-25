import { defineRailway, github, group, project, service } from 'railway/iac'

// Replaces railway.json (Config as Code), which Railway stops reading on 2026-12-01.
// Railway does not read this file during deploys: changes take effect with
// `railway config plan` and `railway config apply`, run against each environment in turn.
//
// This repository manages only the Payload-4 service. Postgres and the bucket stay
// outside IaC, so applying this file can never delete them.
//
// Before the first `railway config apply`, replace the GitHub repository and the
// Railway project name below with your own.
export const partial = 'Payload-4'

export default defineRailway((ctx) => {
  // production deploys main; every other environment (e2e) deploys staging
  const branch = ctx.environment === 'production' ? 'main' : 'staging'

  const payload = service('Payload-4', {
    source: github('your-github-user/your-repo', { branch, checkSuites: false }),
    build: { buildCommand: 'pnpm build', buildEnvironment: 'V3', builder: 'RAILPACK' },
    // `pnpm start` runs `payload migrate` before `next start`, so migrations run on every boot
    start: 'pnpm start',
    preDeploy: [],
    healthcheck: '/api/health',
    healthcheckTimeout: 300,
    deploy: { restartPolicyType: 'ON_FAILURE', restartPolicyMaxRetries: 5 },
    replicas: { iad: 1 },
    networking: { privateNetworkEndpoint: 'payload-4' },
  })

  return project('your-railway-project', {
    variables: { managed: false },
    // Keep the service in its existing canvas group on the Railway dashboard
    resources: [group('Payload CMS 4 Website (Beta)', [payload])],
  })
})
