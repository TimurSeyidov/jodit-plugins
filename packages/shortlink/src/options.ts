import type { ShortlinkProvider, ShortlinkServiceName } from './services.js';

/** A service offered to choose from, with its name in the list */
export interface ShortlinkServiceItem {
	title: string;
	service: ShortlinkServiceName | ShortlinkProvider;
}

/**
 * Settings of the link shortener plugin, available as the `shortlink` editor option
 */
export interface ShortlinkOptions {
	/**
	 * Service that makes the short links: `'dagd'` (da.gd), `'clck'` (clck.ru), `'cleanuri'` (cleanuri.com, needs
	 * `proxy`), or a function that returns the short link of a URL. With several `services`, the one chosen first.
	 */
	service: ShortlinkServiceName | ShortlinkProvider;

	/**
	 * Services the user chooses from, in the link form and in the link toolbar, in this order: `true` offers a
	 * built-in service (`dagd`, `clck`, `cleanuri`), `false` hides it, `{ title, service }` adds your own under any
	 * key. An object rather than a list, so that one key can be changed without repeating the others. The choice is
	 * offered when there are two services or more and `service` is one of them.
	 */
	services: Record<string, boolean | ShortlinkServiceItem>;

	/** Remember the chosen service in the browser for the next time */
	remember: boolean;

	/** Address on your site that forwards the request of the `'cleanuri'` service, which browsers cannot call directly */
	proxy: string;

	/** Time to wait for the service, in milliseconds */
	timeout: number;

	/** When the text of the link is its URL, put the short link into the text too */
	replaceText: boolean;
}

export const defaultOptions: ShortlinkOptions = {
	service: 'dagd',
	services: { dagd: true, clck: true, cleanuri: false },
	remember: true,
	proxy: '',
	timeout: 10000,
	replaceText: true
};

declare module 'jodit/types/config.js' {
	interface Config {
		shortlink: ShortlinkOptions;
	}
}
