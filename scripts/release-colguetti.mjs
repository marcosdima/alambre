#!/usr/bin/env node
/**
 * Centralized release routine for @alambre/colguetti (Google Play via EAS Build).
 *
 * Usage (from repository root):
 *   node scripts/release-colguetti.mjs [--version X.Y.Z] [--no-build] [--dry-run]
 *
 *   --version X.Y.Z  Set the release version explicitly (semver). Defaults to a
 *                    patch bump of the current app.json "version".
 *   --no-build       Bump version + run checks only; do not trigger EAS build.
 *   --dry-run        Print what would be done without changing anything.
 *
 * The routine:
 *   1. Verifies the git working tree is clean.
 *   2. Reads apps/colguetti/app.json, sets "version" and increments
 *      "android.versionCode" (monotonic integer required by Google Play).
 *   3. Runs typecheck + lint + test for the app.
 *   4. Triggers `eas build -p android --profile production` (signed AAB) unless
 *      --no-build.
 *   5. Prints the upload/next steps.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP_DIR = path.join(ROOT, 'apps', 'colguetti');
const APP_JSON_PATH = path.join(APP_DIR, 'app.json');

const SEMVER_RE = /^\d+\.\d+\.\d+$/;

function fail(message) {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

function usage() {
  console.log(`
Uso:
  node scripts/release-colguetti.mjs [--version X.Y.Z] [--no-build] [--dry-run]

  --version X.Y.Z   Versión explícita (semver). Default: patch bump de la actual.
  --no-build        Solo bump + checks (no dispara el build de EAS).
  --dry-run         Muestra qué haría sin tocar nada.
`);
}

function parseArgs() {
  const args = { version: null, build: true, dryRun: false };
  for (const arg of process.argv.slice(2)) {
    // pnpm/npm forward the "--" separator as a literal argument; ignore it.
    if (arg === '--') continue;
    if (arg === '--no-build') args.build = false;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg.startsWith('--version=')) args.version = arg.slice('--version='.length);
    else if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    } else fail(`Argumento desconocido: ${arg}`);
  }
  return args;
}

function run(desc, cmd, args, cwd) {
  console.log(`\n▶ ${desc}`);
  const res = spawnSync(cmd, args, { cwd, stdio: 'inherit' });
  if (res.status !== 0) {
    fail(`${desc} falló (exit ${res.status ?? 'signal'}).`);
  }
}

function bumpPatch(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

function main() {
  const args = parseArgs();

  // 1. Working tree limpio (no aplica en dry-run).
  const status = spawnSync('git', ['status', '--porcelain'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (status.status !== 0) fail('No se pudo consultar git status.');
  const changes = status.stdout.trim();
  if (changes && !args.dryRun) {
    fail('El working tree no está limpio. Hacé commit o stash antes de liberar.');
  }
  if (changes && args.dryRun) {
    console.log(`\n⚠ El working tree tiene cambios (${changes.split('\n').length} archivo/s); en un run real se aborta.`);
  }

  // 2. Leer y calcular versión / versionCode.
  const appJson = JSON.parse(readFileSync(APP_JSON_PATH, 'utf8'));
  const current = appJson.expo?.version;
  const versionCode = appJson.expo?.android?.versionCode;
  if (!current || !SEMVER_RE.test(current)) fail(`app.json "version" inválido: ${current}`);
  if (!Number.isInteger(versionCode) || versionCode < 1) {
    fail(`app.json "android.versionCode" debe ser un entero >= 1 (actual: ${versionCode}).`);
  }

  const nextVersion = args.version ?? bumpPatch(current);
  if (!SEMVER_RE.test(nextVersion)) fail(`Versión inválida: ${nextVersion}`);
  const nextVersionCode = versionCode + 1;

  console.log(`\nRelease de @alambre/colguetti`);
  console.log(`  actual : ${current} (versionCode ${versionCode})`);
  console.log(`  nueva  : ${nextVersion} (versionCode ${nextVersionCode})`);

  // 3. Aplicar cambios a app.json (salvo dry-run).
  if (args.dryRun) {
    console.log('  (dry-run: no se modifica nada)');
  } else {
    appJson.expo.version = nextVersion;
    appJson.expo.android.versionCode = nextVersionCode;
    writeFileSync(APP_JSON_PATH, `${JSON.stringify(appJson, null, 2)}\n`);
    console.log('  app.json actualizado ✓');
  }

  if (args.dryRun) {
    console.log('  (dry-run: se omiten typecheck/lint/test y el build)');
    console.log('\n✔ Dry-run completo.');
    return;
  }

  // 4. Checks.
  run('Typecheck @alambre/colguetti', 'pnpm', ['--filter', '@alambre/colguetti', 'typecheck'], ROOT);
  run('Lint @alambre/colguetti', 'pnpm', ['--filter', '@alambre/colguetti', 'lint'], ROOT);
  run('Tests @alambre/colguetti', 'pnpm', ['--filter', '@alambre/colguetti', 'test'], ROOT);

  // 5. Build del AAB vía EAS (interactivo: credenciales/keystore se resuelven acá).
  if (args.build) {
    run('EAS Build — AAB production para Play', 'pnpm', [
      'exec',
      'eas',
      'build',
      '-p',
      'android',
      '--profile',
      'production',
    ], APP_DIR);
  } else {
    console.log('\n(skip: --no-build, no se dispara el build de EAS)');
  }

  console.log('\n✔ Rutina de release completada.');
  console.log('\nPróximos pasos:');
  console.log('  1. Subir el AAB a Google Play:  pnpm eas:submit');
  console.log('     (o manualmente en Play Console → Release → Production)');
  console.log('  2. Completar los formularios de Play Console si es el primer release.');
}

main();