import { escapeHtml } from './filters.js';

/** Kinds of the highlighted parts of a template */
export type TokenKind =
	| 'comment'
	| 'tag'
	| 'attribute'
	| 'string'
	| 'brace'
	| 'field'
	| 'filter'
	| 'argument';

/** A highlighted part of a template, from `start` to `end` */
export interface Token {
	start: number;
	end: number;
	kind: TokenKind;
}

/** A place of a template to mark as a problem */
export interface Mark {
	start: number;
	end: number;
	warning?: boolean;
}

const PREFIX = 'jodit-datagen-hl';

/** The parts of a placeholder `{{field|filter:argument}}` that starts at `start` */
function placeholderTokens(text: string, start: number, end: number): Token[] {
	const tokens: Token[] = [{ start, end: start + 2, kind: 'brace' }];
	const inner = text.slice(start + 2, end - 2);
	let at = start + 2;

	inner.split('|').forEach((part, index) => {
		if (index > 0) {
			tokens.push({ start: at, end: at + 1, kind: 'brace' });
			at += 1;
		}

		const colon = index > 0 ? part.indexOf(':') : -1;

		if (colon === -1) {
			tokens.push({ start: at, end: at + part.length, kind: index ? 'filter' : 'field' });
		} else {
			tokens.push({ start: at, end: at + colon, kind: 'filter' });
			tokens.push({ start: at + colon, end: at + part.length, kind: 'argument' });
		}

		at += part.length;
	});

	tokens.push({ start: end - 2, end, kind: 'brace' });

	return tokens.filter(token => token.end > token.start);
}

/** The end of the placeholder that starts at `start`, or -1 when it is not closed */
function placeholderEnd(text: string, start: number): number {
	const close = text.indexOf('}}', start + 2);
	const open = text.indexOf('{', start + 2);

	return close !== -1 && (open === -1 || open >= close) ? close + 2 : -1;
}

/** The highlighted parts of a template: HTML comments, tags, attributes, strings and placeholders */
export function tokenize(text: string): Token[] {
	const tokens: Token[] = [];
	let at = 0;

	const placeholdersIn = (from: number, to: number) => {
		for (let index = text.indexOf('{{', from); index !== -1 && index < to; index = text.indexOf('{{', index + 2)) {
			const end = placeholderEnd(text, index);

			if (end !== -1 && end <= to) {
				tokens.push(...placeholderTokens(text, index, end));
				index = end - 2;
			}
		}
	};

	while (at < text.length) {
		if (text.startsWith('<!--', at)) {
			const close = text.indexOf('-->', at + 4);
			const end = close === -1 ? text.length : close + 3;
			tokens.push({ start: at, end, kind: 'comment' });
			at = end;
			continue;
		}

		if (text.startsWith('{{', at)) {
			const end = placeholderEnd(text, at);

			if (end !== -1) {
				tokens.push(...placeholderTokens(text, at, end));
				at = end;
				continue;
			}
		}

		const tag = /^<\/?[a-zA-Z][\w-]*/.exec(text.slice(at));

		if (tag) {
			tokens.push({ start: at, end: at + tag[0].length, kind: 'tag' });
			at += tag[0].length;

			// Attributes up to the end of the tag
			while (at < text.length && text[at] !== '>' && !text.startsWith('/>', at) && text[at] !== '<') {
				const rest = text.slice(at);
				const space = /^\s+/.exec(rest);
				const name = /^[^\s=>/"'<]+/.exec(rest);
				const quoted = /^(["'])[\s\S]*?(\1|$)/.exec(rest);

				if (space) {
					at += space[0].length;
				} else if (rest[0] === '=') {
					at += 1;
				} else if (quoted) {
					tokens.push({ start: at, end: at + quoted[0].length, kind: 'string' });
					placeholdersIn(at, at + quoted[0].length);
					at += quoted[0].length;
				} else if (name) {
					const kind = text[at - 1] === '=' ? 'string' : 'attribute';
					tokens.push({ start: at, end: at + name[0].length, kind });
					placeholdersIn(at, at + name[0].length);
					at += name[0].length;
				} else {
					at += 1;
				}
			}

			const close = text.startsWith('/>', at) ? 2 : text[at] === '>' ? 1 : 0;

			if (close) {
				tokens.push({ start: at, end: at + close, kind: 'tag' });
				at += close;
			}

			continue;
		}

		at += 1;
	}

	return tokens;
}

/**
 * HTML of `text` with its parts in `<span class="jodit-datagen-hl__<kind>">` and the problems in
 * `<mark class="jodit-datagen-hl__error">` (or `__warning`), for a layer under a text area that shows the same text.
 */
export function highlight(text: string, marks: Mark[] = []): string {
	// Placeholders inside strings are tokens of their own: the innermost kind wins
	const kinds: Array<TokenKind | null> = new Array(text.length).fill(null);

	for (const token of tokenize(text)) {
		for (let index = token.start; index < token.end; index += 1) {
			kinds[index] = token.kind;
		}
	}

	const marked: Array<'error' | 'warning' | null> = new Array(text.length).fill(null);

	for (const mark of marks) {
		for (let index = Math.max(0, mark.start); index < Math.min(text.length, mark.end); index += 1) {
			marked[index] = marked[index] === 'error' || !mark.warning ? 'error' : 'warning';
		}
	}

	// A run of the same mark holds the runs of the same kind
	const runs = (from: number, to: number, same: (a: number, b: number) => boolean, each: (start: number, end: number) => string) => {
		let html = '';

		for (let start = from; start < to; ) {
			let end = start + 1;

			while (end < to && same(start, end)) {
				end += 1;
			}

			html += each(start, end);
			start = end;
		}

		return html;
	};

	const html = runs(
		0,
		text.length,
		(a, b) => marked[a] === marked[b],
		(start, end) => {
			const inner = runs(
				start,
				end,
				(a, b) => kinds[a] === kinds[b],
				(from, to) => {
					const part = escapeHtml(text.slice(from, to));
					return kinds[from] ? `<span class="${PREFIX}__${kinds[from]}">${part}</span>` : part;
				}
			);

			return marked[start] ? `<mark class="${PREFIX}__${marked[start]}">${inner}</mark>` : inner;
		}
	);

	// A text area shows the line after a last line break; so must the layer
	return `${html}\n`;
}
