import QRCode from 'qrcode';

import type { QrCodeOptions } from './options';

/**
 * Renders `text` as a QR code image and returns it as a `data:` URL
 */
export async function generate(
	text: string,
	options: QrCodeOptions
): Promise<string> {
	const common = {
		errorCorrectionLevel: options.errorCorrectionLevel,
		margin: options.margin,
		width: options.size,
		color: { dark: options.dark, light: options.light }
	};

	if (options.format === 'svg') {
		const svg = await QRCode.toString(text, { ...common, type: 'svg' });
		return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
	}

	return QRCode.toDataURL(text, { ...common, type: 'image/png' });
}
