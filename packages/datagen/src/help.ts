import type { IJodit } from 'jodit/types/types/index.js';

import { FILTERS, escapeHtml } from './filters.js';
import { format } from './i18n.js';

/** Page of the documentation about the templates */
export const DOCS_URL = 'https://timurseyidov.github.io/jodit-plugins/plugins/datagen/templates/';

const code = (text: string): string => `<code>${escapeHtml(text)}</code>`;

/** Short reference of the templates, in the language of the editor */
export function helpHtml(editor: IJodit): string {
	const t = (text: string, ...params: string[]): string =>
		format(escapeHtml(editor.i18n(text)), params.map(code));
	const tEscaped = (text: string): string => escapeHtml(editor.i18n(text));

	const filters = Object.entries(FILTERS)
		.map(([name, filter]) => {
			const [example, result] = filter.example.split(' → ');
			return (
				`<tr><td>${code(name)}</td><td>${tEscaped(filter.description)}</td>` +
				`<td>${code(example)} → ${code(result)}</td></tr>`
			);
		})
		.join('');

	return (
		`<h4>${tEscaped('Template')}</h4>` +
		`<p>${tEscaped('Before is shown once, Item once for every generated item, After once at the end.')}</p>` +
		`<h4>${tEscaped('Placeholders')}</h4><ul>` +
		`<li>${t('%s — a field; the list on the Template tab shows the fields of the type', '{{title}}')}</li>` +
		`<li>${t('%s — a field of a field', '{{company.name}}')}</li>` +
		`<li>${t('%s — an item of a list, from 0', '{{images.0}}')}</li>` +
		`<li>${t('%s — a field of every item of a list', '{{reviews.comment}}')}</li>` +
		`<li>${t('%s and %s — the number of the item and the number of items', '{{index}}', '{{count}}')}</li>` +
		`<li>${t('%s — filters, applied from left to right', '{{body|words:20|default:—}}')}</li>` +
		`</ul>` +
		`<h4>${tEscaped('Filters')}</h4>` +
		`<table><tbody>${filters}</tbody></table>` +
		`<h4>${tEscaped('Rules')}</h4><ul>` +
		`<li>${tEscaped('Values are escaped: the data cannot change the HTML of the template.')}</li>` +
		`<li>${tEscaped('A list without a filter is shown with commas.')}</li>` +
		`<li>${tEscaped('An empty field shows nothing; an unknown field or filter stops the insertion.')}</li>` +
		`<li>${tEscaped('Tags that are not closed are only a warning: check the preview.')}</li>` +
		`</ul>` +
		`<p><a href="${DOCS_URL}" target="_blank" rel="noopener">${tEscaped('Full documentation')} →</a></p>`
	);
}
