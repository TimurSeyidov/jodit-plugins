/** A service that makes the short link of `url`; `signal` aborts the request when it takes too long */
export type ShortlinkProvider = (url: string, signal: AbortSignal) => Promise<string>;

/** A built-in service */
export type ShortlinkServiceName = 'dagd' | 'clck';

/** Options of a request, see `ShortlinkOptions` */
export interface ShortenOptions {
	service: ShortlinkServiceName | ShortlinkProvider;
	timeout: number;
}

/** A failure with a message for the user, in English: the plugin translates the known ones */
export class ShortlinkError extends Error {
	override name = 'ShortlinkError';
}

/** Messages of the plugin's own failures, also used as translation keys */
export const MESSAGES = {
	invalid: 'Only http:// and https:// links can be shortened',
	unavailable: 'The link shortening service is not available',
	timeout: 'The link shortening service did not answer in time',
	answer: 'The link shortening service gave an unexpected answer'
} as const;

/** Hosts of the short links of the built-in services */
export const SHORT_HOSTS = ['da.gd', 'clck.ru'];

type Fetch = typeof fetch;

/** The answer of a service that returns the short link as plain text, and an error as text with a 4xx/5xx status */
async function plainText(response: Response): Promise<string> {
	const text = (await response.text()).trim();

	if (!response.ok) {
		throw new ShortlinkError(text || MESSAGES.unavailable);
	}

	return text;
}

const SERVICES: Record<ShortlinkServiceName, (fetcher: Fetch) => ShortlinkProvider> = {
	dagd: fetcher => async (url, signal) =>
		plainText(await fetcher(`https://da.gd/s?url=${encodeURIComponent(url)}`, { signal })),

	clck: fetcher => async (url, signal) =>
		plainText(await fetcher(`https://clck.ru/--?url=${encodeURIComponent(url)}`, { signal }))
};

/** `url` is an absolute http:// or https:// link */
export function isHttpUrl(url: string): boolean {
	try {
		const { protocol } = new URL(url);
		return protocol === 'http:' || protocol === 'https:';
	} catch {
		return false;
	}
}

/** `url` is already a short link of a built-in service */
export function isShortUrl(url: string): boolean {
	try {
		return SHORT_HOSTS.includes(new URL(url).hostname);
	} catch {
		return false;
	}
}

/**
 * Makes the short link of `url` with the service of `options`.
 *
 * Throws a {@link ShortlinkError} with a message for the user: the text of the service's error, or one of
 * {@link MESSAGES} when the link is not http(s), the service cannot be reached (also when the browser blocks the
 * answer for lack of CORS headers), does not answer within `timeout` milliseconds or answers with something that is
 * not a link.
 */
export async function shorten(
	url: string,
	options: ShortenOptions,
	fetcher: Fetch = (...args) => fetch(...args)
): Promise<string> {
	const long = url.trim();

	if (!isHttpUrl(long)) {
		throw new ShortlinkError(MESSAGES.invalid);
	}

	const provider =
		typeof options.service === 'function'
			? options.service
			: SERVICES[options.service]?.(fetcher);

	if (!provider) {
		throw new ShortlinkError(MESSAGES.unavailable);
	}

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), options.timeout);

	try {
		const short = (await provider(long, controller.signal)).trim();

		if (!isHttpUrl(short)) {
			throw new ShortlinkError(MESSAGES.answer);
		}

		return short;
	} catch (error) {
		if (error instanceof ShortlinkError) {
			throw error;
		}

		// A function of the browser build cannot import the class
		if (error instanceof Error && error.name === 'ShortlinkError') {
			throw new ShortlinkError(error.message);
		}

		throw new ShortlinkError(
			controller.signal.aborted ? MESSAGES.timeout : MESSAGES.unavailable
		);
	} finally {
		clearTimeout(timer);
	}
}
