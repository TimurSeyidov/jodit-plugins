import type { Jodit as JoditType } from 'jodit';

import { registerShortlink } from './plugin.js';

const Jodit = (globalThis as { Jodit?: typeof JoditType }).Jodit;

if (Jodit) {
	registerShortlink(Jodit);
} else {
	console.error('jodit-plugin-shortlink: load jodit.min.js before this script');
}
