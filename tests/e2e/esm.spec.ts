import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

import { COVERAGE } from './coverage';
import { expect, test } from './fixtures';
import { insertBoth } from './helpers';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'esm');

test.describe('ES module', () => {
	test.beforeAll(async () => {
		// The packages resolve through node_modules/jodit-plugin-* to their
		// package.json `exports`, so this bundles dist/index.mjs
		await build({
			entryPoints: [join(dir, 'app.ts')],
			outdir: join(dir, 'dist'),
			bundle: true,
			format: 'iife',
			target: 'es2021',
			// With COVERAGE=1 the packages carry inline source maps, which
			// esbuild chains, so the coverage maps to packages/*/src
			sourcemap: COVERAGE ? 'inline' : false,
			logLevel: 'warning'
		});
	});

	test('import registers the plugins in the imported Jodit', async ({
		page
	}) => {
		const errors: string[] = [];
		page.on('pageerror', error => errors.push(error.message));

		await page.goto('/tests/e2e/esm/index.html');
		await page.evaluate(() => {
			const { Jodit } = window.app;
			window.editor = Jodit.make('#editor', {
				language: 'en',
				buttons: ['qrcode', 'mailto']
			});
		});

		await insertBoth(page);
		expect(errors).toEqual([]);
	});

	test('the bundle has one copy of Jodit and registers each plugin once', async ({
		page
	}) => {
		await page.goto('/tests/e2e/esm/index.html');

		const state = await page.evaluate(() => {
			const { Jodit, registerQrCode, registerMailto } = window.app;
			const before = Jodit.defaultOptions.controls.link;

			// Explicit registration, as the docs suggest for setups with
			// several copies of Jodit, is a no-op here
			registerQrCode(Jodit);
			registerMailto(Jodit);

			return {
				qrcode: Boolean(Jodit.plugins.get('qrcode')),
				mailto: Boolean(Jodit.plugins.get('mailto')),
				sameLinkControl: Jodit.defaultOptions.controls.link === before
			};
		});

		expect(state).toEqual({
			qrcode: true,
			mailto: true,
			sameLinkControl: true
		});
	});
});
