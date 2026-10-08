import type { Jodit as JoditType } from 'jodit';

import { registerDatagen } from './plugin.js';

const Jodit = (globalThis as { Jodit?: typeof JoditType }).Jodit;

if (Jodit) {
	registerDatagen(Jodit);
} else {
	console.error('jodit-plugin-datagen: load jodit.min.js before this script');
}
