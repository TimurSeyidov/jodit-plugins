import { describe, expect, it } from 'vitest';

import { LAYOUTS } from '../src/layouts';
import { TYPES } from '../src/schemas';
import type { DatagenTypeName } from '../src/schemas';
import { clearCache, generate } from '../src/source';
import { checkTemplate, render } from '../src/template';
import { service } from './helpers';

describe('layouts', () => {
	it('every type has layouts', () => {
		expect(Object.keys(LAYOUTS).sort()).toEqual(Object.keys(TYPES).sort());

		for (const layouts of Object.values(LAYOUTS)) {
			expect(Object.keys(layouts).length).toBeGreaterThan(0);
		}
	});

	for (const [name, layouts] of Object.entries(LAYOUTS)) {
		for (const [id, layout] of Object.entries(layouts)) {
			it(`${name}.${id} has no problems and shows every placeholder`, async () => {
				clearCache();

				const type = TYPES[name as DatagenTypeName];
				const data = await generate(
					name as DatagenTypeName,
					{ baseUrl: 'https://dummyjson.com', timeout: 1000, count: 2 },
					service()
				);
				const html = render(layout, data);

				expect(checkTemplate(layout, type)).toEqual([]);
				expect(html).not.toContain('{{');
				expect(html).not.toMatch(/<(td|li|p|h2|h3|cite)>\s*<\/\1>/);
			});
		}
	}
});
