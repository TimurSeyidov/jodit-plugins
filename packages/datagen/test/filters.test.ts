import { describe, expect, it } from 'vitest';

import { FILTERS, Html, escapeHtml, toHtml, toText } from '../src/filters';

const apply = (name: string, value: Parameters<typeof toHtml>[0], argument?: string) =>
	toHtml(FILTERS[name].apply(value, argument));

describe('values', () => {
	it('escapes the characters of HTML', () => {
		expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
			'&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;'
		);
	});

	it('shows lists with commas and nothing for empty values and objects', () => {
		expect(toText(['a', 1, true])).toBe('a, 1, true');
		expect(toText(null)).toBe('');
		expect(toText(undefined)).toBe('');
		expect(toText({ a: 1 })).toBe('');
		expect(toText(0)).toBe('0');
		expect(toHtml(['<b>', 'c'])).toBe('&lt;b&gt;, c');
		expect(toHtml(new Html('<b>'))).toBe('<b>');
	});
});

describe('filters', () => {
	it('ul and ol make lists with escaped items', () => {
		expect(apply('ul', ['a', '<b>'])).toBe('<ul><li>a</li><li>&lt;b&gt;</li></ul>');
		expect(apply('ol', ['a'])).toBe('<ol><li>a</li></ol>');
		expect(apply('ul', 'one')).toBe('<ul><li>one</li></ul>');
		expect(apply('ul', [])).toBe('');
		expect(apply('ol', undefined)).toBe('');
	});

	it('first takes the first item', () => {
		expect(apply('first', ['a', 'b'])).toBe('a');
		expect(apply('first', 'a')).toBe('a');
		expect(apply('first', [])).toBe('');
	});

	it('join uses the argument as written, a comma without it', () => {
		expect(apply('join', ['a', 'b'], ' · ')).toBe('a · b');
		expect(apply('join', ['a', 'b'])).toBe('a, b');
		expect(apply('join', ['a', 'b'], '')).toBe('ab');
		expect(apply('join', 'a', '/')).toBe('a');
	});

	it('count counts the items', () => {
		expect(apply('count', ['a', 'b', 'c'])).toBe('3');
		expect(apply('count', 'a')).toBe('1');
		expect(apply('count', '')).toBe('0');
		expect(apply('count', undefined)).toBe('0');
	});

	it('words cuts the text', () => {
		expect(apply('words', 'one two  three four', '2')).toBe('one two…');
		expect(apply('words', 'one two', '2')).toBe('one two');
		expect(apply('words', ['a b c', 'd'], '1')).toBe('a…, d');
	});

	it('fixed rounds numbers and leaves the rest', () => {
		expect(apply('fixed', 9.999)).toBe('10.00');
		expect(apply('fixed', 3, '0')).toBe('3');
		expect(apply('fixed', '2.5', '1')).toBe('2.5');
		expect(apply('fixed', [1, 2.345], '1')).toBe('1.0, 2.3');
		expect(apply('fixed', 'n/a')).toBe('n/a');
		expect(apply('fixed', undefined)).toBe('');
	});

	it('default replaces empty values only', () => {
		expect(apply('default', undefined, '—')).toBe('—');
		expect(apply('default', '', '—')).toBe('—');
		expect(apply('default', [], '—')).toBe('—');
		expect(apply('default', 0, '—')).toBe('0');
		expect(apply('default', 'x', '—')).toBe('x');
		expect(apply('default', null, '<i>')).toBe('&lt;i&gt;');
	});

	it('every filter has a description and an example', () => {
		for (const [name, filter] of Object.entries(FILTERS)) {
			expect(filter.description, name).not.toBe('');
			expect(filter.example, name).toContain(`|${name}`);
		}
	});
});
