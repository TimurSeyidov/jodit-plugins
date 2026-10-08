import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { FILTERS } from '../src/filters';
import { LAYOUTS } from '../src/layouts';
import { ITEM_FIELDS, TYPES } from '../src/schemas';

const page = (name: string): string =>
	readFileSync(new URL(`../docs/${name}`, import.meta.url), 'utf8');

/** The section of `markdown` under the heading with the anchor `id` */
function section(markdown: string, id: string): string {
	const start = markdown.indexOf(`{#${id}}`);
	const end = markdown.indexOf('\n## ', start);

	return start === -1 ? '' : markdown.slice(start, end === -1 ? undefined : end);
}

describe('documentation', () => {
	it('types.md lists every type with its fields, its layouts and nothing else', () => {
		const types = page('types.md');

		for (const [name, type] of Object.entries(TYPES)) {
			const text = section(types, name);
			const documented = [...text.matchAll(/^\| `\{\{([^}]+)\}\}` \|/gm)].map(match => match[1]);

			expect(text, name).not.toBe('');
			expect(documented, name).toEqual([...type.fields, ...(type.context ?? [])].map(field => field.path));

			for (const layout of Object.values(LAYOUTS[name as keyof typeof LAYOUTS])) {
				expect(text, `${name}: ${layout.title}`).toContain(layout.title);
			}
		}

		for (const field of ITEM_FIELDS) {
			expect(types).toContain(`| \`{{${field.path}}}\` | ${field.description} |`);
		}
	});

	it('templates.md describes every filter', () => {
		const templates = page('templates.md');

		for (const name of Object.keys(FILTERS)) {
			expect(templates, name).toContain(`| \`${name}\` |`);
			expect(templates, name).toMatch(new RegExp(`^### (.+, )?${name}(,|$)`, 'm'));
		}
	});
});
