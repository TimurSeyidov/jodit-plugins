import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['packages/*/test/**/*.test.ts'],
		environment: 'node',
		coverage: {
			provider: 'v8',
			include: ['packages/*/src/**/*.ts'],
			// index.ts: re-exports and the registration call of the ES module
			// entry, which needs a browser
			exclude: ['**/*.d.ts', 'packages/*/src/index.ts'],
			reporter: ['text-summary', 'lcovonly'],
			reportsDirectory: 'coverage/unit'
		}
	}
});
