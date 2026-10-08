import type { DatagenValue } from './schemas.js';

/** HTML made by a filter; plain values are escaped when they are shown, this is shown as is */
export class Html {
	constructor(readonly html: string) {}
}

/** A value between the filters of a placeholder */
export type FilterValue = DatagenValue | Html;

/** A filter of the placeholders: `{{field|name}}` or `{{field|name:argument}}` */
export interface DatagenFilter {
	/** What the filter does, in English: the plugin shows it in the help */
	description: string;

	/** An example of the filter with its result */
	example: string;

	/** The filter takes no argument, may take one, or needs one */
	argument: 'none' | 'optional' | 'required';

	/** The argument is a whole number from `range[0]` to `range[1]` */
	range?: [number, number];

	/** The filter makes HTML and must be the last one */
	last?: boolean;

	apply(value: FilterValue, argument: string | undefined): FilterValue;
}

/** Characters that change the meaning of HTML, as entities */
export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/** `value` as text: a list joined with commas, nothing for null and undefined */
export function toText(value: FilterValue): string {
	if (value instanceof Html) {
		return value.html;
	}

	if (Array.isArray(value)) {
		return value.map(toText).join(', ');
	}

	if (value === null || value === undefined) {
		return '';
	}

	if (typeof value === 'object') {
		return '';
	}

	return String(value);
}

/** `value` shown in HTML: escaped, unless a filter made it HTML */
export function toHtml(value: FilterValue): string {
	return value instanceof Html ? value.html : escapeHtml(toText(value));
}

const isEmpty = (value: FilterValue): boolean =>
	value === null ||
	value === undefined ||
	value === '' ||
	(Array.isArray(value) && value.length === 0) ||
	(value instanceof Html && value.html === '');

const asList = (value: FilterValue): FilterValue[] =>
	Array.isArray(value) ? value : isEmpty(value) ? [] : [value];

/** Applies `fn` to every item of a list, or to the value */
const each = (value: FilterValue, fn: (item: DatagenValue) => DatagenValue): FilterValue =>
	value instanceof Html ? value : Array.isArray(value) ? value.map(fn) : fn(value);

const htmlList = (tag: 'ul' | 'ol') => (value: FilterValue): FilterValue => {
	const items = asList(value);

	return new Html(
		items.length
			? `<${tag}>${items.map(item => `<li>${toHtml(item)}</li>`).join('')}</${tag}>`
			: ''
	);
};

export const FILTERS: Record<string, DatagenFilter> = {
	ul: {
		description: 'A bulleted list of the items',
		example: '{{tags|ul}} → <ul><li>beauty</li><li>mascara</li></ul>',
		argument: 'none',
		last: true,
		apply: htmlList('ul')
	},

	ol: {
		description: 'A numbered list of the items',
		example: '{{instructions|ol}} → <ol><li>Preheat…</li><li>Bake…</li></ol>',
		argument: 'none',
		last: true,
		apply: htmlList('ol')
	},

	first: {
		description: 'The first item of a list',
		example: '{{images|first}} → https://…/1.webp',
		argument: 'none',
		apply: value => (Array.isArray(value) ? value[0] : value)
	},

	join: {
		description: 'The items joined with the argument, as written; a comma without it',
		example: '{{tags|join: · }} → beauty · mascara',
		argument: 'optional',
		apply: (value, separator = ', ') =>
			Array.isArray(value) ? value.map(toText).join(separator) : value
	},

	count: {
		description: 'The number of items',
		example: '{{reviews.comment|count}} → 3',
		argument: 'none',
		apply: value => asList(value).length
	},

	words: {
		description: 'The first words of the text, with … when there are more',
		example: '{{body|words:5}} → His mother had always taught…',
		argument: 'required',
		range: [1, 1000],
		apply: (value, argument) =>
			each(value, item => {
				const text = toText(item).trim();
				const words = text.split(/\s+/);
				const limit = Number(argument);

				return words.length > limit ? `${words.slice(0, limit).join(' ')}…` : text;
			})
	},

	fixed: {
		description: 'A number with the given number of decimals, 2 without the argument',
		example: '{{price|fixed:2}} → 120.00',
		argument: 'optional',
		range: [0, 10],
		apply: (value, argument = '2') =>
			each(value, item => {
				const number = typeof item === 'number' ? item : Number(toText(item));
				return toText(item) !== '' && Number.isFinite(number)
					? number.toFixed(Number(argument))
					: item;
			})
	},

	default: {
		description: 'The argument instead of an empty value',
		example: '{{brand|default:—}} → —',
		argument: 'required',
		apply: (value, argument = '') => (isEmpty(value) ? argument : value)
	}
};
