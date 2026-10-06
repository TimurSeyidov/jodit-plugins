import { Jodit } from 'jodit';

import { registerQrCode } from './plugin.js';

registerQrCode(Jodit);

export { ATTRIBUTE, NAME, registerQrCode } from './plugin.js';
export { defaultOptions } from './options.js';
export type { QrCodeOptions } from './options.js';
