import { describe, expect, it } from 'vitest';

import {
	buildMailto,
	invalidAddresses,
	parseMailto,
	splitAddresses
} from '../src/mailto';
import type { MailtoFields } from '../src/mailto';

const empty: MailtoFields = {
	to: [],
	cc: [],
	bcc: [],
	subject: '',
	body: '',
	headers: []
};

describe('buildMailto', () => {
	it('builds a link with only recipients', () => {
		expect(buildMailto({ ...empty, to: ['a@x.com', 'b@y.org'] })).toBe(
			'mailto:a@x.com,b@y.org'
		);
	});

	it('builds a link without recipients', () => {
		expect(buildMailto({ ...empty, subject: 'Hi' })).toBe(
			'mailto:?subject=Hi'
		);
	});

	it('percent-encodes values as RFC 6068 requires', () => {
		expect(
			buildMailto({
				...empty,
				to: ['a@x.com'],
				cc: ['c@z.io'],
				bcc: ['d@w.net'],
				subject: 'Order #12 & more?',
				body: 'Line 1\nLine 2 = 100% + tax'
			})
		).toBe(
			'mailto:a@x.com?cc=c@z.io&bcc=d@w.net' +
				'&subject=Order%20%2312%20%26%20more%3F' +
				'&body=Line%201%0D%0ALine%202%20%3D%20100%25%20%2B%20tax'
		);
	});

	it('encodes special characters of addresses but keeps @', () => {
		expect(buildMailto({ ...empty, to: ['b+tag@y.org'] })).toBe(
			'mailto:b%2Btag@y.org'
		);
	});

	it('keeps other header fields', () => {
		expect(
			buildMailto({
				...empty,
				to: ['a@x.com'],
				headers: [['In-Reply-To', '<id@example.com>']]
			})
		).toBe('mailto:a@x.com?In-Reply-To=%3Cid%40example.com%3E');
	});
});

describe('parseMailto', () => {
	it('returns null for other links', () => {
		expect(parseMailto('https://example.com/')).toBeNull();
		expect(parseMailto('')).toBeNull();
	});

	it('round-trips every field', () => {
		const fields: MailtoFields = {
			to: ['a@x.com', 'b+tag@y.org'],
			cc: ['c@z.io'],
			bcc: ['d@w.net'],
			subject: 'Hello & welcome?',
			body: 'Line 1\nLine 2 = ok + 100%',
			headers: [['In-Reply-To', '<id@example.com>']]
		};

		expect(parseMailto(buildMailto(fields))).toEqual(fields);
	});

	it('is case-insensitive for the scheme and field names', () => {
		expect(parseMailto('MAILTO:a@x.com?SUBJECT=Hi&Cc=c@z.io')).toMatchObject({
			to: ['a@x.com'],
			cc: ['c@z.io'],
			subject: 'Hi'
		});
	});

	it('merges repeated address fields and the address part', () => {
		expect(parseMailto('mailto:a@x.com?to=b@y.com&to=c@z.com')?.to).toEqual([
			'a@x.com',
			'b@y.com',
			'c@z.com'
		]);
	});

	it('keeps + as a plus sign and turns CRLF into a line break', () => {
		expect(parseMailto('mailto:?subject=1+1&body=a%0D%0Ab')).toMatchObject({
			subject: '1+1',
			body: 'a\nb'
		});
	});

	it('decodes an encoded @ in the address', () => {
		expect(parseMailto('mailto:user%40example.com')?.to).toEqual([
			'user@example.com'
		]);
	});

	it('keeps malformed percent-encoding as it is', () => {
		expect(parseMailto('mailto:bad%E0')?.to).toEqual(['bad%E0']);
	});

	it('ignores the fragment', () => {
		expect(parseMailto('mailto:a@x.com?subject=Hi#top')?.subject).toBe('Hi');
	});
});

describe('splitAddresses', () => {
	it('splits by commas, semicolons, spaces and line breaks', () => {
		expect(splitAddresses(' a@x.com; b@y.com ,c@z.io\nd@w.com  ')).toEqual([
			'a@x.com',
			'b@y.com',
			'c@z.io',
			'd@w.com'
		]);
	});

	it('returns an empty list for an empty value', () => {
		expect(splitAddresses('  , ; ')).toEqual([]);
	});
});

describe('invalidAddresses', () => {
	it('accepts usual addresses', () => {
		expect(
			invalidAddresses([
				'a@x.com',
				'first.last+tag@sub.example.co.uk',
				'x_y-z@example.museum'
			])
		).toEqual([]);
	});

	it('rejects addresses without a domain, a dot or with spaces', () => {
		expect(
			invalidAddresses(['nope', 'x@y', '@x.com', 'a@b.c', 'a b@c.com'])
		).toEqual(['nope', 'x@y', '@x.com', 'a@b.c', 'a b@c.com']);
	});
});
