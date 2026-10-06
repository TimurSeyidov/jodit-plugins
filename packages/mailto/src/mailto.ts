/**
 * Fields of a `mailto:` link (RFC 6068). Address lists hold bare addresses
 * such as `name@example.com`.
 */
export interface MailtoFields {
	to: string[];
	cc: string[];
	bcc: string[];
	subject: string;
	body: string;

	/** Other header fields, kept as they are when a link is edited */
	headers: Array<[string, string]>;
}

const KNOWN = new Set(['to', 'cc', 'bcc', 'subject', 'body']);

const ADDRESS = /^[^\s@,;<>()"]+@[^\s@,;<>()"]+\.[^\s@,;<>()".]{2,}$/;

/**
 * Splits a user-typed list of addresses separated by commas, semicolons or spaces
 */
export function splitAddresses(value: string): string[] {
	return value
		.split(/[\s,;]+/)
		.map(address => address.trim())
		.filter(Boolean);
}

/**
 * Returns the addresses of the list that do not look like `name@domain.tld`
 */
export function invalidAddresses(addresses: string[]): string[] {
	return addresses.filter(address => !ADDRESS.test(address));
}

function encode(value: string): string {
	return encodeURIComponent(value);
}

function encodeAddress(address: string): string {
	return encode(address).replace(/%40/g, '@');
}

function decode(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

/**
 * Builds the `href` of a `mailto:` link. Line breaks in the body are sent as CRLF, as the RFC requires.
 */
export function buildMailto(fields: MailtoFields): string {
	const query: string[] = [];

	if (fields.cc.length) {
		query.push('cc=' + fields.cc.map(encodeAddress).join(','));
	}

	if (fields.bcc.length) {
		query.push('bcc=' + fields.bcc.map(encodeAddress).join(','));
	}

	if (fields.subject) {
		query.push('subject=' + encode(fields.subject));
	}

	if (fields.body) {
		query.push('body=' + encode(fields.body.replace(/\r?\n/g, '\r\n')));
	}

	fields.headers.forEach(([name, value]) => {
		query.push(encode(name) + '=' + encode(value));
	});

	return (
		'mailto:' +
		fields.to.map(encodeAddress).join(',') +
		(query.length ? '?' + query.join('&') : '')
	);
}

/**
 * Parses the `href` of a `mailto:` link. Returns null for other links.
 * Repeated `to`, `cc` and `bcc` fields are merged, `+` is kept as a plus sign.
 */
export function parseMailto(href: string): MailtoFields | null {
	const match = /^mailto:([^?#]*)(?:\?([^#]*))?/i.exec(href.trim());

	if (!match) {
		return null;
	}

	const fields: MailtoFields = {
		to: splitAddresses(decode(match[1])),
		cc: [],
		bcc: [],
		subject: '',
		body: '',
		headers: []
	};

	(match[2] ?? '')
		.split('&')
		.filter(Boolean)
		.forEach(pair => {
			const index = pair.indexOf('=');
			const name = decode(index < 0 ? pair : pair.slice(0, index));
			const value = decode(index < 0 ? '' : pair.slice(index + 1));
			const key = name.toLowerCase();

			if (key === 'to' || key === 'cc' || key === 'bcc') {
				fields[key].push(...splitAddresses(value));
			} else if (key === 'subject' || key === 'body') {
				fields[key] = value.replace(/\r\n/g, '\n');
			} else if (!KNOWN.has(key)) {
				fields.headers.push([name, value]);
			}
		});

	return fields;
}
