// Coverage of the browser tests, collected when COVERAGE=1 (see
// playwright.config.ts). Every test adds the V8 coverage of the plugin
// bundles; the bundles carry inline source maps (`COVERAGE=1 npm run build`),
// so the report is made for packages/*/src.

import { CoverageReport } from 'monocart-coverage-reports';
import type { CoverageReportOptions } from 'monocart-coverage-reports';

export const COVERAGE = Boolean(process.env.COVERAGE);

export const coverageOptions: CoverageReportOptions = {
	name: 'Browser tests',
	outputDir: 'coverage/e2e',
	reports: ['lcovonly', 'console-summary'],
	entryFilter: entry =>
		/\/plugins\/[\w-]+\/[\w-]+(\.min)?\.js$/.test(entry.url),
	sourceFilter: sourcePath =>
		/(^|\/)packages\/[\w-]+\/src\/.+\.ts$/.test(sourcePath),
	sourcePath: sourcePath =>
		sourcePath.replace(/^.*?(packages\/[\w-]+\/src\/)/, '$1')
};

export async function globalSetup(): Promise<void> {
	if (COVERAGE) {
		await new CoverageReport(coverageOptions).cleanCache();
	}
}

export async function globalTeardown(): Promise<void> {
	if (COVERAGE) {
		await new CoverageReport(coverageOptions).generate();
	}
}
