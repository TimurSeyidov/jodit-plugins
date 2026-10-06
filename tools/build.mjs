// Builds every package in packages/*:
//   dist/index.mjs                      ES module for bundlers, registers itself in the imported Jodit
//   dist/types/                         TypeScript declarations
//   dist/<target>/plugins/<name>/<name>(.min).js
//                                       script for a <script> tag or `extraPlugins`, uses window.Jodit;
//                                       one per target, the same folders as the Jodit builds
//
// With COVERAGE=1 every bundle gets an inline source map, so the coverage of
// the browser tests can be mapped back to src/. Do not publish such a build.
//
// Usage: node tools/build.mjs [package-dir-name...]

import { execFileSync } from 'node:child_process';
import {
	existsSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packagesDir = join(root, 'packages');
const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');

// Browser builds, named like the folders of the jodit package (jodit/es2021/...)
const TARGETS = ['es2015', 'es2018', 'es2021'];

const coverage = Boolean(process.env.COVERAGE);

const only = process.argv.slice(2);
const packages = readdirSync(packagesDir).filter(
	dir =>
		existsSync(join(packagesDir, dir, 'package.json')) &&
		(!only.length || only.includes(dir))
);

for (const dir of packages) {
	await buildPackage(join(packagesDir, dir));
}

async function buildPackage(pkgDir) {
	const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
	const name = pkg.name.replace(/^jodit-plugin-/, '');
	const banner = `/*! ${pkg.name} v${pkg.version} | ${pkg.license} License | ${pkg.homepage} */`;
	const dist = join(pkgDir, 'dist');

	rmSync(dist, { recursive: true, force: true });

	const common = {
		bundle: true,
		loader: { '.svg': 'text' },
		banner: { js: banner },
		sourcemap: coverage ? 'inline' : false,
		logLevel: 'warning'
	};

	await build({
		...common,
		entryPoints: [join(pkgDir, 'src/index.ts')],
		outfile: join(dist, 'index.mjs'),
		format: 'esm',
		platform: 'neutral',
		target: 'es2021',
		external: [
			...Object.keys(pkg.peerDependencies ?? {}),
			...Object.keys(pkg.dependencies ?? {})
		]
	});

	for (const target of TARGETS) {
		for (const minify of [false, true]) {
			await build({
				...common,
				entryPoints: [join(pkgDir, 'src/browser.ts')],
				outfile: join(
					dist,
					target,
					'plugins',
					name,
					`${name}${minify ? '.min' : ''}.js`
				),
				format: 'iife',
				platform: 'browser',
				target,
				external: Object.keys(pkg.peerDependencies ?? {}),
				minify
			});
		}
	}

	execFileSync(process.execPath, [tsc, '-p', join(pkgDir, 'tsconfig.json')], {
		stdio: 'inherit'
	});

	if (coverage) {
		absoluteSourceMaps(dist);
	}

	console.log(`built ${pkg.name}@${pkg.version}`);
}

/**
 * Makes the paths in the inline source maps of `dir` absolute. The browser
 * tests load the bundles from other URLs than their place in dist/, where the
 * relative paths would point nowhere.
 */
function absoluteSourceMaps(dir) {
	const prefix = '//# sourceMappingURL=data:application/json;base64,';

	for (const entry of readdirSync(dir, { recursive: true })) {
		const file = join(dir, entry);

		if (!/\.m?js$/.test(file)) {
			continue;
		}

		const code = readFileSync(file, 'utf8');
		const index = code.lastIndexOf(prefix);

		if (index === -1) {
			continue;
		}

		const map = JSON.parse(
			Buffer.from(code.slice(index + prefix.length), 'base64').toString()
		);
		map.sources = map.sources.map(source => resolve(dirname(file), source));

		writeFileSync(
			file,
			code.slice(0, index) +
				prefix +
				Buffer.from(JSON.stringify(map)).toString('base64') +
				'\n'
		);
	}
}
