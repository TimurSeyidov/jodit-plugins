import { describe, expect, it } from 'vitest';

import { TYPES } from '../src/schemas';
import type { DatagenData } from '../src/schemas';
import { checkTags, checkTemplate, isWarning, render } from '../src/template';
import type { DatagenTemplate } from '../src/template';

const template = (item: string, before = '', after = ''): DatagenTemplate => ({ before, item, after });

const codes = (tpl: DatagenTemplate, type = TYPES.products) =>
	checkTemplate(tpl, type).map(error => `${error.part ?? '-'}:${error.code}:${error.params.join('|')}`);

const data: DatagenData = {
	items: [
		{
			title: 'Mascara <Pro>',
			price: 9.5,
			tags: ['beauty', 'mascara'],
			reviews: [
				{ rating: 3, comment: 'Meh' },
				{ rating: 5, comment: 'Great & cheap' }
			],
			dimensions: { width: 1 }
		},
		{ title: 'Lipstick', price: 12, tags: [], reviews: [] }
	],
	context: { order: { total: 21.5 } }
};

describe('render', () => {
	it('shows Before once, Item for every item and After once', () => {
		expect(render(template('<li>{{index}}/{{count}} {{title}}</li>', '<ul>', '</ul>{{count}}'), data)).toBe(
			'<ul><li>1/2 Mascara &lt;Pro&gt;</li><li>2/2 Lipstick</li></ul>2'
		);
	});

	it('escapes values, also in attributes', () => {
		expect(
			render(template('<img alt="{{title}}">'), {
				items: [{ title: '" onerror="alert(1)' }],
				context: {}
			})
		).toBe('<img alt="&quot; onerror=&quot;alert(1)">');
	});

	it('reads nested fields, items of lists and fields of every item of a list', () => {
		const tpl = template('{{dimensions.width}}|{{tags.1}}|{{reviews.0.comment}}|{{reviews.comment|join:/}}|{{reviews.rating|count}};');

		expect(render(tpl, data)).toBe('1|mascara|Meh|Meh/Great &amp; cheap|2;||||0;');
	});

	it('applies the filters in order', () => {
		expect(render(template('{{tags|default:none|ul}}{{price|fixed:2}};'), data)).toBe(
			'<ul><li>beauty</li><li>mascara</li></ul>9.50;<ul><li>none</li></ul>12.00;'
		);
	});

	it('shows the context in Before and After', () => {
		expect(render(template('', '{{order.total|fixed:2}}', '{{order.total}}'), data)).toBe('21.5021.5');
	});

	it('leaves text without placeholders and unclosed braces as is', () => {
		expect(render(template('a {{title b}} c'), { items: [{}], context: {} })).toBe('a {{title b}} c');
	});

	it('does not read the properties of objects that are not fields', () => {
		expect(render(template('[{{constructor}}][{{title.length}}]'), { items: [{ title: 'ab' }], context: {} })).toBe(
			'[][]'
		);
	});
});

describe('checkTemplate', () => {
	it('accepts fields of the type and the common fields', () => {
		expect(codes(template('{{index}} {{count}} {{title}} {{dimensions.width}} {{reviews.0.comment}} {{images.0}}'))).toEqual([]);
		expect(codes(template('', '{{count}}', '{{order.total}}'), TYPES.order)).toEqual([]);
	});

	it('finds unknown fields, and fields of Item in Before and After', () => {
		expect(codes(template('{{titel}}', '{{title}}', '{{index}}'))).toEqual([
			'before:field:title',
			'item:field:titel',
			'after:field:index'
		]);
	});

	it('asks for a field of an object', () => {
		expect(codes(template('{{reviews}} {{dimensions}}'))).toEqual([
			'item:object:{{reviews}}|reviews.rating, reviews.comment, reviews.date',
			'item:object:{{dimensions}}|dimensions.width, dimensions.height, dimensions.depth'
		]);
	});

	it('finds bad names and unclosed placeholders, with their place', () => {
		const errors = checkTemplate(template('ok {{a b}} {{title'), TYPES.products);

		expect(errors.map(error => [error.code, error.start, error.end])).toEqual([
			['syntax', 3, 10],
			['unclosed', 11, 13]
		]);
	});

	it('checks the filters and their arguments', () => {
		expect(
			codes(
				template(
					'{{tags|lu}} {{tags|ul:x}} {{title|default}} {{title|words:0}} {{title|words:x}} ' +
						'{{price|fixed:11}} {{tags|ul|first}} {{tags|toString}}'
				)
			)
		).toEqual([
			'item:filter:lu',
			'item:no-argument:ul',
			'item:argument:default',
			'item:range:words|1|1000',
			'item:range:words|1|1000',
			'item:range:fixed|0|10',
			'item:last:ul',
			'item:filter:toString'
		]);
		expect(
			codes(template('{{tags|join}}{{tags|join:}}{{views|fixed}}{{views| fixed : 1 }}{{body|words:20}}'), TYPES.posts)
		).toEqual([]);
	});

	it('warns about tags of the whole template', () => {
		const errors = checkTemplate(template('<tr><td>{{title}}</td></tr>', '<table>', '</tabel>'), TYPES.products);

		expect(errors.map(error => [error.code, error.params[0], isWarning(error)])).toEqual([
			['tag-unexpected', 'tabel', true],
			['tag-unclosed', 'table', true]
		]);
	});
});

describe('checkTags', () => {
	const tags = (html: string) => checkTags(html).map(error => `${error.code}:${error.params[0]}`);

	it('accepts balanced HTML, void elements and left out end tags', () => {
		expect(tags('<div><p>a<br><img src="x"><p>b</div><ul><li>a<li>b</ul><hr/><span/>')).toEqual([]);
		expect(tags('<table><tr><td>a<td>b</table><!-- <b> -->')).toEqual([]);
	});

	it('finds unclosed and unexpected tags once', () => {
		expect(tags('<div><b>a</div><b></i></i>')).toEqual(['tag-unclosed:b', 'tag-unexpected:i']);
		expect(tags('<STRONG>a</strong></br>')).toEqual([]);
	});
});
