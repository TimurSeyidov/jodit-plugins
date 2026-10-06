/**
 * Settings of the QR code plugin, available as the `qrcode` editor option
 */
export interface QrCodeOptions {
	/** Width and height of the inserted image, in pixels */
	size: number;

	/** Width of the quiet zone around the code, in modules */
	margin: number;

	/** Error correction level: L (7%), M (15%), Q (25%) or H (30%) */
	errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';

	/** Color of the dark modules, `#RRGGBB` or `#RRGGBBAA` */
	dark: string;

	/** Color of the light modules and the background, `#RRGGBB` or `#RRGGBBAA` */
	light: string;

	/** Image format of the inserted `data:` URL */
	format: 'png' | 'svg';

	/** Prefill the dialog with the selected text */
	useSelection: boolean;

	/** CSS class added to the inserted image, empty for none */
	className: string;
}

export const defaultOptions: QrCodeOptions = {
	size: 200,
	margin: 1,
	errorCorrectionLevel: 'M',
	dark: '#000000',
	light: '#ffffff',
	format: 'png',
	useSelection: true,
	className: ''
};

declare module 'jodit/types/config.js' {
	interface Config {
		qrcode: QrCodeOptions;
	}
}
