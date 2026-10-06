import { defineConfig, devices } from '@playwright/test';

// Browser tests in tests/e2e/. The plugins are loaded from packages/*/dist, so
// run `npm run build` first (`npm run test:e2e` does it).
//
// PLAYWRIGHT_CHANNEL=chrome runs the installed Google Chrome instead of the
// Chromium downloaded by `npx playwright install chromium`.

const PORT = 8097;

export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['list']] : 'list',
	use: {
		baseURL: `http://127.0.0.1:${PORT}`,
		locale: 'en-US',
		trace: 'retain-on-failure'
	},
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				channel: process.env.PLAYWRIGHT_CHANNEL || undefined
			}
		}
	],
	webServer: {
		command: `node tools/serve.mjs ${PORT}`,
		url: `http://127.0.0.1:${PORT}/tests/e2e/page.html`,
		reuseExistingServer: !process.env.CI
	}
});
