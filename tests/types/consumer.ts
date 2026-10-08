// Compiled by `npm run test:types` against the built packages (dist/types),
// as a project that installed them from npm would see them.

import { Jodit } from 'jodit';
import 'jodit-plugin-qrcode';
import { registerLanguage, renderBlock, type CodeOptions } from 'jodit-plugin-code';
import { enhance } from 'jodit-plugin-code/runtime';
import {
	buildMailto,
	parseMailto,
	registerMailto,
	type MailtoOptions
} from 'jodit-plugin-mailto';
import { registerQrCode, type QrCodeOptions } from 'jodit-plugin-qrcode';
import {
	checkTemplate,
	generate,
	registerDatagen,
	render,
	TYPES,
	type DatagenOptions,
	type DatagenTemplate
} from 'jodit-plugin-datagen';
import {
	registerShortlink,
	shorten,
	ShortlinkError,
	type ShortlinkOptions
} from 'jodit-plugin-shortlink';

registerQrCode(Jodit);
registerMailto(Jodit);
registerShortlink(Jodit);
registerDatagen(Jodit);

// The plugins add their options to the options of Jodit.make()
Jodit.make('#editor', {
	code: { lineNumbers: true, languages: ['python', 'sql'], indent: '  ' },
	qrcode: { size: 300, format: 'svg', errorCorrectionLevel: 'H' },
	mailto: { fields: { bcc: false, body: 'main' }, required: { subject: true } },
	shortlink: { service: 'clck', timeout: 5000 },
	datagen: {
		types: { posts: false },
		maxCount: 50,
		layouts: {
			cards: { type: 'users', title: 'Cards', before: '', item: '<p>{{fullName}}</p>', after: '' }
		}
	}
});

// @ts-expect-error: unknown type of data
Jodit.make('#editor', { datagen: { types: { planets: false } } });

// A function as the service
Jodit.make('#editor', {
	shortlink: {
		service: async (url: string, signal: AbortSignal) => {
			const response = await fetch(`/shorten?url=${encodeURIComponent(url)}`, { signal });
			if (!response.ok) {
				throw new ShortlinkError('Our shortener is down');
			}
			return response.text();
		}
	}
});

// @ts-expect-error: unknown image format
Jodit.make('#editor', { qrcode: { format: 'gif' } });

// @ts-expect-error: unknown error correction level
Jodit.make('#editor', { qrcode: { errorCorrectionLevel: 'X' } });

// @ts-expect-error: lineNumbers is a boolean
Jodit.make('#editor', { code: { lineNumbers: 'yes' } });

// @ts-expect-error: unknown field placement
Jodit.make('#editor', { mailto: { fields: { cc: 'sidebar' } } });

// @ts-expect-error: `required` takes booleans
Jodit.make('#editor', { mailto: { required: { to: 'yes' } } });

const qrcode: QrCodeOptions = Jodit.defaultOptions.qrcode;
const mailto: MailtoOptions = Jodit.defaultOptions.mailto;

const href: string = buildMailto({
	to: ['a@example.com'],
	cc: [],
	bcc: [],
	subject: mailto.required.subject ? 'Hi' : '',
	body: '',
	headers: []
});

export const parsed = parseMailto(href)?.to ?? [qrcode.dark];

const code: CodeOptions = Jodit.defaultOptions.code;
export const block: string = renderBlock('x = 1', 'python', {
	lineNumbers: code.lineNumbers
}).html;
export const enhanced: number = enhance(document, { label: 'Copy' });
export { registerLanguage };

const shortlink: ShortlinkOptions = Jodit.defaultOptions.shortlink;
export const short: Promise<string> = shorten('https://example.com/', shortlink);

const datagen: DatagenOptions = Jodit.defaultOptions.datagen;
const template: DatagenTemplate = { before: '<ul>', item: '<li>{{title}}</li>', after: '</ul>' };
export const problems: number = checkTemplate(template, TYPES.products).length;
export const html: Promise<string> = generate('products', { ...datagen, count: 3 }).then(data =>
	render(template, data)
);
