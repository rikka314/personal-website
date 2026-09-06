import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = dirname(__dirname)

const serverHost = process.env.WRITE_SERVER_HOST || 'stratagy'
const serverIp = process.env.WRITE_SERVER_IP || '115.191.68.122'
const letsencryptEmail = process.env.LETSENCRYPT_EMAIL || ''

const githubClientId = requireEnv('GITHUB_CLIENT_ID')
const githubClientSecret = requireEnv('GITHUB_CLIENT_SECRET')
const githubAllowedLogins = resolveGithubAllowedLogins()

const remoteWriteRoot = '/www/wwwroot/write.gfm156.com'
const remoteConfigFile = `${remoteWriteRoot}/api/config.php`
const remoteNginxDir = '/www/server/panel/vhost/nginx'
const remoteWriteConf = `${remoteNginxDir}/write.gfm156.com.conf`
const remotePublicConf = `${remoteNginxDir}/www.gfm156.com.conf`
const remoteWriteExtensionDir = `${remoteNginxDir}/extension/write.gfm156.com`
const remoteWriteWellKnownDir = `${remoteNginxDir}/well-known`
const remoteWriteWellKnownFile = `${remoteWriteWellKnownDir}/write.gfm156.com.conf`

const bootstrapWriteConf = join(repoRoot, 'nginx', 'write.gfm156.com.bootstrap.conf')
const finalWriteConf = join(repoRoot, 'nginx', 'write.gfm156.com.conf')
const finalPublicConf = join(repoRoot, 'nginx', 'www.gfm156.com.after-write-cutover.conf')

const tempDir = mkdtempSync(join(tmpdir(), 'write-subdomain-'))
const tempConfigFile = join(tempDir, 'config.php')

try {
  logStep('1/6', 'Checking public DNS for write.gfm156.com')
  const resolvedIps = runCapture('ssh', [
    serverHost,
    "dig +short write.gfm156.com @223.5.5.5 | tr '\\n' ' '",
  ])
    .split(/\s+/)
    .filter(Boolean)

  if (!resolvedIps.includes(serverIp)) {
    fail(
      [
        `write.gfm156.com is not pointing to ${serverIp}.`,
        `Server-side DNS sees: ${resolvedIps.length ? resolvedIps.join(', ') : 'no records / NXDOMAIN'}.`,
        'Create the A record first, then rerun this script.',
      ].join(' '),
    )
  }

  logStep('2/6', 'Preparing nginx bootstrap files for the write subdomain')
  run('ssh', [
    serverHost,
    `mkdir -p ${shellQuote(remoteWriteExtensionDir)} ${shellQuote(remoteWriteWellKnownDir)} && touch ${shellQuote(remoteWriteWellKnownFile)}`,
  ])
  run('scp', [bootstrapWriteConf, `${serverHost}:${remoteWriteConf}`])
  reloadNginx()

  logStep('3/6', 'Requesting the write.gfm156.com certificate with certbot')
  const certbotCommand = [
    'certbot certonly',
    '--webroot',
    `-w ${shellQuote(remoteWriteRoot)}`,
    '-d write.gfm156.com',
    '--cert-name write.gfm156.com',
    '--non-interactive',
    '--agree-tos',
    '--keep-until-expiring',
    letsencryptEmail
      ? `-m ${shellQuote(letsencryptEmail)}`
      : '--register-unsafely-without-email',
  ].join(' ')
  run('ssh', [serverHost, certbotCommand])

  logStep('4/6', 'Writing the production admin config with GitHub OAuth')
  writeFileSync(
    tempConfigFile,
    `<?php

return [
    'app_base_url' => 'https://write.gfm156.com',
    'admin_password_hash' => '',
    'asset_public_base' => '/blog-assets',
    'build_script' => dirname(__DIR__, 2) . '/runtime-builder/scripts/build-blog-runtime.mjs',
    'github_allowed_logins' => ${phpArray(githubAllowedLogins)},
    'github_client_id' => ${phpString(githubClientId)},
    'github_client_secret' => ${phpString(githubClientSecret)},
    'node_binary' => 'node',
    'public_root' => '/www/wwwdata/blog-runtime',
    'seed_runtime_root' => dirname(__DIR__, 2) . '/seeds/blog-runtime',
    'storage_root' => '/www/wwwdata/blog-source',
];
`,
  )
  run('scp', [tempConfigFile, `${serverHost}:${remoteConfigFile}`])

  logStep('5/6', 'Switching nginx to the final subdomain + redirect config')
  run('scp', [finalWriteConf, `${serverHost}:${remoteWriteConf}`])
  run('scp', [finalPublicConf, `${serverHost}:${remotePublicConf}`])
  reloadNginx()

  logStep('6/6', 'Running smoke checks against the local nginx instance')
  run('ssh', [
    serverHost,
    "curl -k -s --resolve write.gfm156.com:443:127.0.0.1 https://write.gfm156.com/api/session",
  ])
  run('ssh', [
    serverHost,
    "curl -k -sI --resolve gfm156.com:443:127.0.0.1 https://gfm156.com/write/ | grep -E 'HTTP/|Location:'",
  ])

  console.log('')
  console.log('write.gfm156.com activation finished.')
  console.log('DNS, TLS, OAuth config, and /write redirect have been applied on the server.')
} finally {
  rmSync(tempDir, { force: true, recursive: true })
}

function requireEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) {
    fail(`Missing required environment variable: ${name}`)
  }

  return value
}

function resolveGithubAllowedLogins() {
  const explicitList = process.env.GITHUB_ALLOWED_LOGINS
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (explicitList?.length) {
    return explicitList
  }

  const legacySingleLogin = process.env.GITHUB_ALLOWED_LOGIN?.trim()
  return legacySingleLogin ? [legacySingleLogin] : []
}

function logStep(step, message) {
  console.log('')
  console.log(`[${step}] ${message}`)
}

function fail(message) {
  console.error('')
  console.error(message)
  process.exit(1)
}

function reloadNginx() {
  run('ssh', [serverHost, '/www/server/nginx/sbin/nginx -t && /www/server/nginx/sbin/nginx -s reload'])
}

function phpString(value) {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function phpArray(values) {
  if (!values.length) {
    return '[]'
  }

  return `[${values.map((value) => phpString(value)).join(', ')}]`
}

function shellQuote(value) {
  return `'${value.replace(/'/g, "'\\''")}'`
}

function runCapture(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'inherit'],
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }

  return result.stdout.trim()
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
