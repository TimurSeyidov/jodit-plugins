import { FILTERS, toHtml } from './filters.js';
import type { FilterValue } from './filters.js';
import { COMMON_FIELDS, ITEM_FIELDS } from './schemas.js';
import type { DatagenData, DatagenField, DatagenRecord, DatagenType, DatagenValue } from './schemas.js';

/** HTML shown once before the items, for every item, and once after them */
export interface DatagenTemplate {
	before: string;
	item: string;
	after: string;
}

/** A part of a template */
export type TemplatePart = keyof DatagenTemplate;

export const PARTS: TemplatePart[] = ['before', 'item', 'after'];

/** Messages of the template errors, in English, also used as translation keys; `%s` are the `params` */
export const TEMPLATE_MESSAGES = {
	unclosed: '"{{" is not closed with "}}"',
	syntax: '%s is not a field name',
	field: 'Unknown field %s',
	object: '%s has fields, choose one: %s',
	filter: 'Unknown filter %s',
	'no-argument': 'The %s filter takes no argument',
	argument: 'The %s filter needs an argument',
	range: 'The %s filter needs a whole number from %s to %s',
	last: 'The %s filter must be the last one',
	'tag-unclosed': '<%s> is not closed',
	'tag-unexpected': '</%s> closes no tag'
} as const;

export type TemplateErrorCode = keyof typeof TEMPLATE_MESSAGES;

/** A problem of a template */
export interface TemplateError {
	code: TemplateErrorCode;

	/** Values for the `%s` of the message */
	params: string[];

	/** Part of the template, absent for the problems of tags, which are found in the whole template */
	part?: TemplatePart;

	/** Where the placeholder is in its part */
	start?: number;
	end?: number;
}

interface Placeholder {
	start: number;
	end: number;
	path: string[];
	filters: Array<{ name: string; argument?: string }>;
}

const TOKEN = /\{\{([^{}]*)\}\}/g;

/** Matches of the global `pattern` in `text`, like `String.prototype.matchAll` of ES2020 */
function matches(text: string, pattern: RegExp): RegExpExecArray[] {
	const found: RegExpExecArray[] = [];
	const regexp = new RegExp(pattern.source, pattern.flags);

	for (let match = regexp.exec(text); match; match = regexp.exec(text)) {
		found.push(match);
	}

	return found;
}
const PATH = /^[A-Za-z_$][\w$]*(?:\.(?:[A-Za-z_$][\w$]*|\d+))*$/;

/** Placeholders of `text`, and the syntax errors */
function parse(text: string, part: TemplatePart): { placeholders: Placeholder[]; errors: TemplateError[] } {
	const placeholders: Placeholder[] = [];
	const errors: TemplateError[] = [];
	let outside = '';
	let last = 0;

	for (const match of matches(text, TOKEN)) {
		const start = match.index ?? 0;
		const end = start + match[0].length;
		const [path, ...filters] = match[1].split('|');

		outside += text.slice(last, start) + ' '.repeat(match[0].length);
		last = end;

		if (!PATH.test(path.trim())) {
			errors.push({ code: 'syntax', params: [match[0]], part, start, end });
			continue;
		}

		placeholders.push({
			start,
			end,
			path: path.trim().split('.'),
			filters: filters.map(filter => {
				const colon = filter.indexOf(':');

				return colon === -1
					? { name: filter.trim() }
					: { name: filter.slice(0, colon).trim(), argument: filter.slice(colon + 1) };
			})
		});
	}

	outside += text.slice(last);

	for (let at = outside.indexOf('{{'); at !== -1; at = outside.indexOf('{{', at + 2)) {
		errors.push({ code: 'unclosed', params: [], part, start: at, end: at + 2 });
	}

	return { placeholders, errors };
}

/** Fields that `part` of a template of `type` can show */
export function fieldsOf(type: DatagenType, part: TemplatePart): DatagenField[] {
	return part === 'item'
		? [...ITEM_FIELDS, ...type.fields]
		: [...COMMON_FIELDS, ...(type.context ?? [])];
}

function checkPlaceholder(
	placeholder: Placeholder,
	fields: DatagenField[],
	token: string
): Omit<TemplateError, 'part' | 'start' | 'end'> | null {
	// `reviews.0.comment` is a field of `reviews.comment`
	const path = placeholder.path.filter(segment => !/^\d+$/.test(segment)).join('.');

	if (!fields.some(field => field.path === path)) {
		const nested = fields.filter(field => field.path.startsWith(`${path}.`));

		return nested.length
			? {
					code: 'object',
					params: [
						token,
						nested
							.slice(0, 3)
							.map(field => field.path)
							.join(', ')
					]
				}
			: { code: 'field', params: [path] };
	}

	for (const [index, { name, argument }] of placeholder.filters.entries()) {
		const filter = Object.prototype.hasOwnProperty.call(FILTERS, name) ? FILTERS[name] : null;

		if (!filter) {
			return { code: 'filter', params: [name] };
		}

		if (filter.argument === 'none' && argument !== undefined) {
			return { code: 'no-argument', params: [name] };
		}

		if (filter.argument === 'required' && argument === undefined) {
			return { code: 'argument', params: [name] };
		}

		if (filter.range && argument !== undefined) {
			const number = Number(argument);
			const [min, max] = filter.range;

			if (!/^\s*\d+\s*$/.test(argument) || number < min || number > max) {
				return { code: 'range', params: [name, String(min), String(max)] };
			}
		}

		if (filter.last && index < placeholder.filters.length - 1) {
			return { code: 'last', params: [name] };
		}
	}

	return null;
}

/**
 * Finds the problems of a template of `type`: unclosed placeholders, unknown fields and filters, wrong arguments
 * and tags that are not closed or close nothing. The template is shown only without problems of placeholders; the
 * problems of tags are warnings, the browser fixes such HTML anyway.
 */
export function checkTemplate(template: DatagenTemplate, type: DatagenType): TemplateError[] {
	const errors: TemplateError[] = [];

	for (const part of PARTS) {
		const text = template[part];
		const parsed = parse(text, part);
		const fields = fieldsOf(type, part);

		errors.push(...parsed.errors);

		for (const placeholder of parsed.placeholders) {
			const token = text.slice(placeholder.start, placeholder.end);
			const error = checkPlaceholder(placeholder, fields, token);

			if (error) {
				errors.push({ ...error, part, start: placeholder.start, end: placeholder.end });
			}
		}
	}

	errors.push(...checkTags(template.before + template.item + template.after));

	return errors.sort((a, b) => PARTS.indexOf(a.part ?? 'after') - PARTS.indexOf(b.part ?? 'after'));
}

/** The error is a warning about tags; it does not stop the template from being shown */
export const isWarning = (error: TemplateError): boolean => error.code.startsWith('tag-');

// Elements without content, and elements whose end tag may be left out
const VOID = new Set('area base br col embed hr img input link meta source track wbr'.split(' '));
const OPTIONAL_END = new Set(
	'li p td th tr thead tbody tfoot dt dd option optgroup colgroup caption rb rt rp'.split(' ')
);

/** Tags of `html` that are not closed or close no open tag */
export function checkTags(html: string): TemplateError[] {
	const errors: TemplateError[] = [];
	const open: string[] = [];
	const report = (code: 'tag-unclosed' | 'tag-unexpected', tag: string) => {
		if (!errors.some(error => error.code === code && error.params[0] === tag)) {
			errors.push({ code, params: [tag] });
		}
	};
	const unclosed = (tags: string[]) =>
		tags.filter(tag => !OPTIONAL_END.has(tag)).forEach(tag => report('tag-unclosed', tag));

	const tags = matches(html.replace(/<!--[\s\S]*?-->/g, ''), /<(\/?)([a-zA-Z][\w-]*)\b[^>]*?(\/?)>/g);

	for (const [, closing, rawName, selfClosing] of tags) {
		const name = rawName.toLowerCase();

		if (!closing) {
			if (!VOID.has(name) && !selfClosing) {
				open.push(name);
			}
			continue;
		}

		const at = open.lastIndexOf(name);

		if (at === -1) {
			if (!VOID.has(name)) {
				report('tag-unexpected', name);
			}
			continue;
		}

		unclosed(open.splice(at).slice(1));
	}

	unclosed(open);

	return errors;
}

/** The value at `path`: through a list, a number takes its item and a name takes the field of every item */
function resolve(record: DatagenRecord, path: string[]): DatagenValue {
	let value: DatagenValue = record;

	for (const segment of path) {
		if (Array.isArray(value)) {
			value = /^\d+$/.test(segment)
				? value[Number(segment)]
				: ([] as DatagenValue[]).concat(
						...value.map(item => {
							const field = item && typeof item === 'object' && !Array.isArray(item) ? item[segment] : undefined;
							return Array.isArray(field) ? field : [field];
						})
					);
		} else if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, segment)) {
			value = value[segment];
		} else {
			return undefined;
		}
	}

	return value;
}

/** `text` with its placeholders replaced by the values of `record`; unknown filters are skipped */
function renderPart(text: string, record: DatagenRecord, part: TemplatePart): string {
	const { placeholders } = parse(text, part);
	let html = '';
	let last = 0;

	for (const placeholder of placeholders) {
		let value: FilterValue = resolve(record, placeholder.path);

		for (const { name, argument } of placeholder.filters) {
			if (Object.prototype.hasOwnProperty.call(FILTERS, name)) {
				value = FILTERS[name].apply(value, argument);
			}
		}

		html += text.slice(last, placeholder.start) + toHtml(value);
		last = placeholder.end;
	}

	return html + text.slice(last);
}

/**
 * HTML of `template` with `data`: Before once, Item for every item, After once. Values are escaped; check the
 * template with {@link checkTemplate} first, unknown fields are shown as nothing.
 */
export function render(template: DatagenTemplate, data: DatagenData): string {
	const count = data.items.length;
	const context = { ...data.context, count };

	return (
		renderPart(template.before, context, 'before') +
		data.items
			.map((item, index) => renderPart(template.item, { ...item, index: index + 1, count }, 'item'))
			.join('') +
		renderPart(template.after, context, 'after')
	);
}
