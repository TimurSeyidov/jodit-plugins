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

registerQrCode(Jodit);
registerMailto(Jodit);

// The plugins add their options to the options of Jodit.make()
Jodit.make('#editor', {
	code: { lineNumbers: true, languages: ['python', 'sql'], indent: '  ' },
	qrcode: { size: 300, format: 'svg', errorCorrectionLevel: 'H' },
	mailto: { fields: { bcc: false, body: 'main' }, required: { subject: true } }
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
