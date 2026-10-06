import type { Jodit as JoditType } from 'jodit';

import { registerMailto } from './plugin.js';

const Jodit = (globalThis as { Jodit?: typeof JoditType }).Jodit;

if (Jodit) {
	registerMailto(Jodit);
} else {
	console.error('jodit-plugin-mailto: load jodit.min.js before this script');
}
