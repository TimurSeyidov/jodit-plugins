import { describe, expect, it } from 'vitest';

import { generate } from '../src/generate';
import { defaultOptions } from '../src/options';

describe('generate', () => {
	it('renders a PNG data URL by default', async () => {
		const url = await generate('https://example.com/', defaultOptions);

		expect(url).toMatch(/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/);
	});

	it('renders an SVG data URL with the configured colors and size', async () => {
		const url = await generate('https://example.com/', {
			...defaultOptions,
			format: 'svg',
			size: 160,
			dark: '#1a237e',
			light: '#ffffff00'
		});

		expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);

		const svg = decodeURIComponent(url.slice(url.indexOf(',') + 1));
		expect(svg).toContain('width="160"');
		expect(svg).toContain('#1a237e');
	});

	it('changes the image with the content and the error correction level', async () => {
		const a = await generate('a', defaultOptions);
		const b = await generate('b', defaultOptions);
		const high = await generate('a', {
			...defaultOptions,
			errorCorrectionLevel: 'H'
		});

		expect(a).not.toBe(b);
		expect(a).not.toBe(high);
	});

	it('rejects a text that does not fit into a QR code', async () => {
		await expect(
			generate('x'.repeat(5000), defaultOptions)
		).rejects.toThrow();
	});
});
