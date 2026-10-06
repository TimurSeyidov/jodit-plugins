import { Jodit } from 'jodit';

import { registerMailto } from './plugin.js';

registerMailto(Jodit);

export { NAME, registerMailto } from './plugin.js';
export { buildMailto, parseMailto } from './mailto.js';
export type { MailtoFields } from './mailto.js';
export { defaultOptions } from './options.js';
export type {
	MailtoField,
	MailtoFieldPlacement,
	MailtoOptionalField,
	MailtoOptions
} from './options.js';
