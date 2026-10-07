import { describe, expect, it, vi } from 'vitest';

import {
	MESSAGES,
	ShortlinkError,
	isHttpUrl,
	isShortUrl,
	shorten
} from '../src/services';
import type { ShortenOptions } from '../src/services';

const LONG = 'https://example.com/a/very/long/path?with=query&and=more';

const options = (changes: Partial<ShortenOptions> = {}): ShortenOptions => ({
	service: 'dagd',
	timeout: 1000,
	...changes
});

/** A fetch that answers with `body` and `status`, and records its calls */
function answer(body: string, status = 200) {
	return vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
		new Response(body, { status })
	);
}

describe('shorten', () => {
	it('asks da.gd and returns its plain text answer', async () => {
		const fetcher = answer('https://da.gd/abc\n');

		await expect(shorten(LONG, options(), fetcher)).resolves.toBe('https://da.gd/abc');
		expect(String(fetcher.mock.calls[0][0])).toBe(
			`https://da.gd/s?url=${encodeURIComponent(LONG)}`
		);
	});

	it('asks clck.ru', async () => {
		const fetcher = answer('https://clck.ru/9Z93u');

		await expect(shorten(LONG, options({ service: 'clck' }), fetcher)).resolves.toBe(
			'https://clck.ru/9Z93u'
		);
		expect(String(fetcher.mock.calls[0][0])).toBe(
			`https://clck.ru/--?url=${encodeURIComponent(LONG)}`
		);
	});

	it('passes on the error text of a service', async () => {
		await expect(
			shorten(LONG, options(), answer('Long URL must have http:// or https:// scheme.', 400))
		).rejects.toThrow(new ShortlinkError('Long URL must have http:// or https:// scheme.'));

		await expect(
			shorten(LONG, options({ service: 'clck' }), answer('Domain should be at least of length 2', 400))
		).rejects.toThrow('Domain should be at least of length 2');
	});

	it('uses a function as the service', async () => {
		const service = vi.fn(async (url: string) => `https://s.example/${url.length}`);

		await expect(shorten(LONG, options({ service }))).resolves.toBe(
			`https://s.example/${LONG.length}`
		);
		expect(service).toHaveBeenCalledWith(LONG, expect.any(AbortSignal));
	});

	it('shows the message of a ShortlinkError from a function, and hides other errors', async () => {
		const own = async () => {
			throw new ShortlinkError('Turned off');
		};
		const named = async () => {
			throw Object.assign(new Error('Turned off too'), { name: 'ShortlinkError' });
		};
		const other = async () => {
			throw new Error('secret stack details');
		};

		await expect(shorten(LONG, options({ service: own }))).rejects.toThrow('Turned off');
		await expect(shorten(LONG, options({ service: named }))).rejects.toThrow(
			new ShortlinkError('Turned off too')
		);
		await expect(shorten(LONG, options({ service: other }))).rejects.toThrow(
			MESSAGES.unavailable
		);
	});

	it('refuses links that are not http(s) without asking the service', async () => {
		const fetcher = answer('https://da.gd/x');

		for (const url of ['', 'example.com', 'mailto:a@b.c', 'javascript:alert(1)']) {
			await expect(shorten(url, options(), fetcher)).rejects.toThrow(MESSAGES.invalid);
		}
		expect(fetcher).not.toHaveBeenCalled();
	});

	it('reports an unreachable service', async () => {
		const fetcher = vi.fn(async () => {
			throw new TypeError('Failed to fetch');
		});

		await expect(shorten(LONG, options(), fetcher)).rejects.toThrow(MESSAGES.unavailable);
		await expect(shorten(LONG, options(), answer('', 502))).rejects.toThrow(
			MESSAGES.unavailable
		);
	});

	it('gives up after the timeout', async () => {
		const fetcher = vi.fn(
			(_input: RequestInfo | URL, init?: RequestInit) =>
				new Promise<Response>((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () =>
						reject(new DOMException('Aborted', 'AbortError'))
					);
				})
		);

		await expect(shorten(LONG, options({ timeout: 20 }), fetcher)).rejects.toThrow(
			MESSAGES.timeout
		);
	});

	it('refuses an answer that is not a link', async () => {
		await expect(shorten(LONG, options(), answer('<html>Busy</html>'))).rejects.toThrow(
			MESSAGES.answer
		);
	});
});

describe('isHttpUrl and isShortUrl', () => {
	it('tells http(s) links and short links', () => {
		expect(isHttpUrl('https://example.com')).toBe(true);
		expect(isHttpUrl('ftp://example.com')).toBe(false);
		expect(isShortUrl('https://da.gd/abc')).toBe(true);
		expect(isShortUrl('https://clck.ru/abc')).toBe(true);
		expect(isShortUrl(LONG)).toBe(false);
		expect(isShortUrl('not a url')).toBe(false);
	});
});
