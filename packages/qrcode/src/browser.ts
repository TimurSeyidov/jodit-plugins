import type { Jodit as JoditType } from 'jodit';

import { registerQrCode } from './plugin';

const Jodit = (globalThis as { Jodit?: typeof JoditType }).Jodit;

if (Jodit) {
	registerQrCode(Jodit);
} else {
	console.error('jodit-plugin-qrcode: load jodit.min.js before this script');
}
