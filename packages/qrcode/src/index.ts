import { Jodit } from 'jodit';

import { registerQrCode } from './plugin';

registerQrCode(Jodit);

export { ATTRIBUTE, NAME, registerQrCode } from './plugin';
export { defaultOptions } from './options';
export type { QrCodeOptions } from './options';
