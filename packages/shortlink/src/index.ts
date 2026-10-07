import { Jodit } from 'jodit';

import { registerShortlink } from './plugin.js';

registerShortlink(Jodit);

export { NAME, registerShortlink } from './plugin.js';
export {
	isHttpUrl,
	isShortUrl,
	shorten,
	ShortlinkError,
	MESSAGES,
	SHORT_HOSTS
} from './services.js';
export type {
	ShortenOptions,
	ShortlinkProvider,
	ShortlinkServiceName
} from './services.js';
export { defaultOptions } from './options.js';
export type { ShortlinkOptions, ShortlinkServiceItem } from './options.js';
