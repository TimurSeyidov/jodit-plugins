import type { DatagenTypeName } from './schemas.js';
import type { DatagenTemplate } from './template.js';

/** A ready template of a type */
export interface DatagenLayout extends DatagenTemplate {
	/** Name in the list of layouts, in English */
	title: string;
}

const table = (headers: string[], cells: string[], footer = ''): Omit<DatagenLayout, 'title'> => ({
	before: `<table><thead><tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr></thead><tbody>`,
	item: `<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`,
	after: `</tbody>${footer}</table>`
});

const list = (tag: 'ul' | 'ol', item: string): Omit<DatagenLayout, 'title'> => ({
	before: `<${tag}>`,
	item: `<li>${item}</li>`,
	after: `</${tag}>`
});

const each = (item: string): Omit<DatagenLayout, 'title'> => ({ before: '', item, after: '' });

/** Built-in layouts of every type; the first one is chosen by default */
export const LAYOUTS: Record<DatagenTypeName, Record<string, DatagenLayout>> = {
	posts: {
		articles: { title: 'Headings and paragraphs', ...each('<h2>{{title}}</h2><p>{{body}}</p>') },
		paragraphs: { title: 'Paragraphs', ...each('<p>{{body}}</p>') },
		list: { title: 'List', ...list('ul', '<strong>{{title}}</strong> — {{body|words:20}}') }
	},

	quotes: {
		blockquotes: {
			title: 'Quotes',
			...each('<blockquote><p>{{quote}}</p><p><cite>— {{author}}</cite></p></blockquote>')
		},
		list: { title: 'List', ...list('ul', '“{{quote}}” — {{author}}') }
	},

	comments: {
		blocks: {
			title: 'Comments',
			...each('<p><strong>{{user.fullName}}</strong> @{{user.username}} · ♥ {{likes}}<br>{{body}}</p>')
		},
		list: { title: 'List', ...list('ul', '<strong>{{user.fullName}}</strong>: {{body}}') }
	},

	todos: {
		checklist: { title: 'Checklist', ...list('ul', '{{check}} {{todo}}') },
		numbered: { title: 'Numbered list', ...list('ol', '{{todo}}') }
	},

	users: {
		table: {
			title: 'Table',
			...table(
				['Name', 'Email', 'Phone', 'Company'],
				['{{fullName}}', '{{email}}', '{{phone}}', '{{company.name}}']
			)
		},
		cards: {
			title: 'Cards',
			...each(
				'<p><img src="{{image}}" alt="{{fullName}}" width="64" height="64"></p>' +
					'<h3>{{fullName}}</h3>' +
					'<p>{{company.title}}, {{company.name}}<br>{{email}} · {{phone}}<br>' +
					'{{address.city}}, {{address.country}}</p>'
			)
		},
		list: { title: 'List', ...list('ul', '{{fullName}} — {{email}}') }
	},

	products: {
		cards: {
			title: 'Cards',
			...each(
				'<h3>{{title}}</h3>' +
					'<p><img src="{{thumbnail}}" alt="{{title}}" width="150"></p>' +
					'<p>{{description}}</p>' +
					'<p><strong>${{finalPrice|fixed:2}}</strong> · {{stars}} {{rating}}</p>'
			)
		},
		reviews: {
			title: 'Cards with reviews',
			...each(
				'<h3>{{title}}</h3>' +
					'<p><img src="{{thumbnail}}" alt="{{title}}" width="150"></p>' +
					'<p>{{description}}</p>' +
					'<p><strong>${{finalPrice|fixed:2}}</strong> · {{stars}} {{rating}}</p>' +
					'{{reviews.comment|ul}}'
			)
		},
		table: {
			title: 'Table',
			...table(
				['Product', 'Brand', 'Category', 'Price', 'Rating'],
				['{{title}}', '{{brand|default:—}}', '{{category}}', '${{price|fixed:2}}', '{{rating}}']
			)
		},
		list: { title: 'List', ...list('ul', '{{title}} — ${{price|fixed:2}}') }
	},

	reviews: {
		blocks: {
			title: 'Reviews',
			...each(
				'<blockquote><p>{{stars}} {{comment}}</p>' +
					'<p><cite>— {{reviewerName}}, about {{product.title}}</cite></p></blockquote>'
			)
		},
		table: {
			title: 'Table',
			...table(
				['Product', 'Rating', 'Review', 'Reviewer'],
				['{{product.title}}', '{{stars}}', '{{comment}}', '{{reviewerName}}']
			)
		}
	},

	recipes: {
		full: {
			title: 'Full recipes',
			...each(
				'<h2>{{name}}</h2>' +
					'<p><img src="{{image}}" alt="{{name}}" width="300"></p>' +
					'<p>{{cuisine}} · {{difficulty}} · {{prepTimeMinutes}} + {{cookTimeMinutes}} min · ' +
					'{{servings}} servings · {{caloriesPerServing}} kcal</p>' +
					'<h3>Ingredients</h3>{{ingredients|ul}}' +
					'<h3>Instructions</h3>{{instructions|ol}}'
			)
		},
		table: {
			title: 'Table',
			...table(
				['Recipe', 'Cuisine', 'Difficulty', 'Time, min', 'Calories'],
				[
					'{{name}}',
					'{{cuisine}}',
					'{{difficulty}}',
					'{{prepTimeMinutes}} + {{cookTimeMinutes}}',
					'{{caloriesPerServing}}'
				]
			)
		},
		list: { title: 'List', ...list('ul', '<strong>{{name}}</strong> — {{cuisine}}, {{difficulty}}') }
	},

	order: {
		table: {
			title: 'Table',
			...table(
				['#', 'Product', 'Price', 'Quantity', 'Total'],
				['{{index}}', '{{title}}', '${{price|fixed:2}}', '{{quantity}}', '${{total|fixed:2}}'],
				'<tfoot><tr><td colspan="3"><strong>Total</strong></td><td>{{order.totalQuantity}}</td>' +
					'<td><strong>${{order.total|fixed:2}}</strong></td></tr></tfoot>'
			)
		},
		list: {
			title: 'List',
			before: '<ul>',
			item: '<li>{{title}} × {{quantity}} = ${{total|fixed:2}}</li>',
			after: '</ul><p><strong>Total: ${{order.total|fixed:2}}</strong></p>'
		}
	},

	images: {
		images: {
			title: 'One per paragraph',
			...each('<p><img src="{{url}}" alt="" width="{{width}}" height="{{height}}"></p>')
		},
		gallery: {
			title: 'In one paragraph',
			before: '<p>',
			item: '<img src="{{url}}" alt="" width="{{width}}" height="{{height}}"> ',
			after: '</p>'
		}
	}
};
