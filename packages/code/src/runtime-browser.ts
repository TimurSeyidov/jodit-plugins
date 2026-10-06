// <script> build of the runtime: enhances the blocks once the page is parsed
// and exposes `window.JoditCodeRuntime.enhance` for blocks added later.

import { enhance } from './runtime.js';

(globalThis as { JoditCodeRuntime?: { enhance: typeof enhance } }).JoditCodeRuntime = {
	enhance
};

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => enhance());
} else {
	enhance();
}
