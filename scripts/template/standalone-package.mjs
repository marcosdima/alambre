// Rewrites the monorepo apps/base-template package.json into the standalone
// template form: generic name, pnpm packageManager and the published `alambre`
// version pinned exactly (the pre-baseline contract allows breaking changes,
// so the template must not drift on a range).
//
// Usage: node scripts/template/standalone-package.mjs <monorepo-root> <stage-dir>

import fs from 'node:fs';
import path from 'node:path';

const [monorepoRoot, stageDir] = process.argv.slice(2);
if (!monorepoRoot || !stageDir) {
  console.error('usage: standalone-package.mjs <monorepo-root> <stage-dir>');
  process.exit(1);
}

const alambreVersion = JSON.parse(
  fs.readFileSync(path.join(monorepoRoot, 'packages/alambre/package.json'), 'utf8'),
).version;

const uiVersion = JSON.parse(
  fs.readFileSync(path.join(monorepoRoot, 'packages/ui/package.json'), 'utf8'),
).version;

if (!alambreVersion) {
  console.error('could not read alambre version from packages/alambre/package.json');
  process.exit(1);
}

if (!uiVersion) {
  console.error('could not read @some-alambre/ui version from packages/ui/package.json');
  process.exit(1);
}

const pkgPath = path.join(stageDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

pkg.name = 'base-template';
pkg.description = 'Generic React Native app skeleton on top of alambre (Expo SDK 57).';
pkg.private = true;
pkg.packageManager = 'pnpm@12.4.1';

pkg.dependencies = pkg.dependencies ?? {};
pkg.dependencies.alambre = alambreVersion;
pkg.dependencies['@some-alambre/ui'] = uiVersion;
delete pkg.dependencies['@alambre/ui'];
pkg.dependencies['@tanstack/react-query'] = '^5.0.0';

pkg.overrides = pkg.overrides ?? {};
pkg.overrides['@react-native/metro-config'] = '~0.86.3';

pkg.resolutions = pkg.resolutions ?? {};
pkg.resolutions['@react-native/metro-config'] = '~0.86.3';

fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log(`package.json rewritten for standalone: alambre pinned to ${alambreVersion}, @some-alambre/ui pinned to ${uiVersion}`);
