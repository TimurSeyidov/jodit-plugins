import { test as base } from '@playwright/test';
import { CoverageReport } from 'monocart-coverage-reports';

import { COVERAGE, coverageOptions } from './coverage';

export { expect } from '@playwright/test';

const MAP_PREFIX = '//# sourceMappingURL=data:application/json;base64,';

/**
 * The inline source map of a bundle. Read here rather than by the coverage
 * reporter, whose comment parser can lose the map comment after a regular
 * expression with a quote in it.
 */
function inlineSourceMap(source = ''): object | undefined {
	const index = source.lastIndexOf(MAP_PREFIX);

	return index === -1
		? undefined
		: JSON.parse(
				Buffer.from(
					source.slice(index + MAP_PREFIX.length).trim(),
					'base64'
				).toString()
			);
}

/** `test` that records the JavaScript coverage of every test when COVERAGE=1 */
export const test = base.extend<{ coverage: void }>({
	coverage: [
		async ({ page }, use) => {
			if (!COVERAGE) {
				await use();
				return;
			}

			await page.coverage.startJSCoverage({ resetOnNavigation: false });
			await use();

			const coverage = (await page.coverage.stopJSCoverage()).map(entry => ({
				...entry,
				sourceMap: inlineSourceMap(entry.source)
			}));
			await new CoverageReport(coverageOptions).add(coverage);
		},
		{ auto: true }
	]
});
