import { Jodit } from 'jodit';

import { registerMailto } from './plugin';

registerMailto(Jodit);

export { NAME, registerMailto } from './plugin';
export { buildMailto, parseMailto } from './mailto';
export type { MailtoFields } from './mailto';
export { defaultOptions } from './options';
export type {
	MailtoField,
	MailtoFieldPlacement,
	MailtoOptionalField,
	MailtoOptions
} from './options';
