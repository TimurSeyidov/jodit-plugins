import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { FILTERS } from '../src/filters';
import { format } from '../src/i18n';
import { langs } from '../src/langs/index';
import { LAYOUTS } from '../src/layouts';
import { ITEM_FIELDS, TYPES } from '../src/schemas';
import { MESSAGES } from '../src/source';
import { TEMPLATE_MESSAGES } from '../src/template';

// Translated by Jodit itself
const JODIT = ['Cancel', 'Insert', 'Width', 'Height', 'Title', 'Text', 'Background'];

/** Texts of the interface: arguments of t(), tEscaped() and group(), labels, titles and tooltips in the sources */
function interfaceTexts(): string[] {
	const texts: string[] = [];

	for (const file of ['dialog.ts', 'help.ts', 'plugin.ts']) {
		const source = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');

		for (const [, text] of source.matchAll(/\b(?:t|tEscaped|group)\(\s*'((?:[^'\\]|\\.)+)'/g)) {
			texts.push(text.replace(/\\'/g, "'"));
		}

		for (const [, text] of source.matchAll(/\b(?:label|text|title|tooltip): '([^']+)'/g)) {
			texts.push(text);
		}
	}

	return texts;
}

function allTexts(): string[] {
	const texts = new Set<string>(interfaceTexts());

	for (const type of Object.values(TYPES)) {
		texts.add(type.title);
		texts.add(type.description);
		[...type.fields, ...(type.context ?? [])].forEach(field => texts.add(field.description));
	}

	ITEM_FIELDS.forEach(field => texts.add(field.description));
	Object.values(LAYOUTS).forEach(layouts => Object.values(layouts).forEach(layout => texts.add(layout.title)));
	Object.values(FILTERS).forEach(filter => texts.add(filter.description));
	Object.values(TEMPLATE_MESSAGES).forEach(text => texts.add(text));
	Object.values(MESSAGES).forEach(text => texts.add(text));
	['Before', 'Item', 'After'].forEach(text => texts.add(text));

	return [...texts].filter(text => !JODIT.includes(text));
}

describe('translations', () => {
	it('finds the texts of the interface', () => {
		expect(interfaceTexts()).toEqual(expect.arrayContaining(['Generate data', 'Shuffle', 'Own template', '1 to %s']));
	});

	for (const [code, dictionary] of Object.entries(langs)) {
		it(`${code} has every text, with the same placeholders`, () => {
			const texts = allTexts();

			expect(texts.filter(text => !(text in dictionary))).toEqual([]);

			for (const text of texts) {
				expect(dictionary[text].split('%s').length, `${code}: ${text}`).toBe(text.split('%s').length);
			}
		});

		it(`${code} has no unused texts and leaves the texts of Jodit alone`, () => {
			const texts = allTexts();

			expect(Object.keys(dictionary).filter(key => !texts.includes(key))).toEqual([]);
		});
	}
});

describe('format', () => {
	it('puts the params in place of %s in order and keeps $ as is', () => {
		expect(format('%s and %s', ['$&', 'b'])).toBe('$& and b');
		expect(format('%s of %s', [1])).toBe('1 of %s');
		expect(format('none', ['x'])).toBe('none');
	});
});
