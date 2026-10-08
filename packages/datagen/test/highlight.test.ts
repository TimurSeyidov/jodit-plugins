import { describe, expect, it } from 'vitest';

import { highlight, tokenize } from '../src/highlight';

const kinds = (text: string) => tokenize(text).map(token => `${token.kind}:${text.slice(token.start, token.end)}`);

describe('tokenize', () => {
	it('finds tags, attributes, strings and comments', () => {
		expect(kinds('<!-- x --><img src="a.png" alt=b hidden/></p>')).toEqual([
			'comment:<!-- x -->',
			'tag:<img',
			'attribute:src',
			'string:"a.png"',
			'attribute:alt',
			'string:b',
			'attribute:hidden',
			'tag:/>',
			'tag:</p',
			'tag:>'
		]);
	});

	it('splits placeholders into the field, the filters and their arguments', () => {
		expect(kinds('a {{body|words:20|default:—}} b')).toEqual([
			'brace:{{',
			'field:body',
			'brace:|',
			'filter:words',
			'argument::20',
			'brace:|',
			'filter:default',
			'argument::—',
			'brace:}}'
		]);
	});

	it('finds placeholders in attributes', () => {
		expect(kinds('<img alt="{{title}}!">')).toEqual([
			'tag:<img',
			'attribute:alt',
			'string:"{{title}}!"',
			'brace:{{',
			'field:title',
			'brace:}}',
			'tag:>'
		]);
	});

	it('leaves unclosed placeholders, unclosed tags and text alone', () => {
		expect(kinds('{{title {{a}} < b')).toEqual(['brace:{{', 'field:a', 'brace:}}']);
		expect(kinds('<p class="x')).toEqual(['tag:<p', 'attribute:class', 'string:"x']);
		expect(kinds('plain text')).toEqual([]);
	});
});

describe('highlight', () => {
	it('wraps the parts in spans, one for the neighbours of a kind, and escapes the text', () => {
		expect(highlight('<b>{{a}} & c</b>')).toBe(
			'<span class="jodit-datagen-hl__tag">&lt;b&gt;</span>' +
				'<span class="jodit-datagen-hl__brace">{{</span><span class="jodit-datagen-hl__field">a</span>' +
				'<span class="jodit-datagen-hl__brace">}}</span> &amp; c' +
				'<span class="jodit-datagen-hl__tag">&lt;/b&gt;</span>\n'
		);
	});

	it('marks the problems, errors over warnings', () => {
		expect(highlight('x {{y}}', [{ start: 2, end: 7 }])).toBe(
			'x <mark class="jodit-datagen-hl__error"><span class="jodit-datagen-hl__brace">{{</span>' +
				'<span class="jodit-datagen-hl__field">y</span><span class="jodit-datagen-hl__brace">}}</span></mark>\n'
		);
		expect(highlight('ab', [{ start: 0, end: 2, warning: true }, { start: 1, end: 9 }])).toBe(
			'<mark class="jodit-datagen-hl__warning">a</mark><mark class="jodit-datagen-hl__error">b</mark>\n'
		);
	});

	it('ends with a line break, like a text area', () => {
		expect(highlight('')).toBe('\n');
		expect(highlight('a\n')).toBe('a\n\n');
	});
});
