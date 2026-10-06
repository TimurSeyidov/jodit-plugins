import type { Jodit as JoditType } from 'jodit';

import { registerCode } from './plugin.js';

const Jodit = (globalThis as { Jodit?: typeof JoditType }).Jodit;

if (Jodit) {
	registerCode(Jodit);
} else {
	console.error('jodit-plugin-code: load jodit.min.js before this script');
}
