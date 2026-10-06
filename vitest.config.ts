import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['packages/*/test/**/*.test.ts'],
		environment: 'node',
		coverage: {
			provider: 'v8',
			include: ['packages/*/src/**/*.ts'],
			exclude: ['**/*.d.ts'],
			reporter: ['text-summary', 'lcovonly'],
			reportsDirectory: 'coverage/unit'
		}
	}
});
