// An application that installs the plugins from npm and bundles them, the way
// the "With a bundler" section of the documentation describes. Built by
// esm.spec.ts with esbuild into tests/e2e/esm/dist/.

import { Jodit } from 'jodit';
import 'jodit/es2021/jodit.min.css';
import 'jodit-plugin-qrcode';
import 'jodit-plugin-mailto';
import 'jodit-plugin-code';
import 'jodit-plugin-shortlink';
import 'jodit-plugin-datagen';
import { registerMailto } from 'jodit-plugin-mailto';
import { registerQrCode } from 'jodit-plugin-qrcode';

declare global {
	interface Window {
		app: {
			Jodit: typeof Jodit;
			registerQrCode: typeof registerQrCode;
			registerMailto: typeof registerMailto;
		};
	}
}

window.app = { Jodit, registerQrCode, registerMailto };
