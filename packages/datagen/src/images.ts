import type { DatagenRecord } from './schemas.js';

/** Settings of the placeholder images */
export interface DatagenImageSettings {
	/** Width, px, from 1 to {@link MAX_IMAGE_SIZE} */
	width: number;

	/** Height, px, from 1 to {@link MAX_IMAGE_SIZE} */
	height: number;

	/** Background colour as 6 hex digits, or `'random'` for a different calm colour of every image */
	background: string;

	/** Text colour as 6 hex digits */
	color: string;

	/** Text on the image; empty shows the size */
	text: string;
}

export const MAX_IMAGE_SIZE = 4000;

export const defaultImageSettings: DatagenImageSettings = {
	width: 600,
	height: 400,
	background: 'random',
	color: 'ffffff',
	text: ''
};

/** Background colours of `background: 'random'` that white text reads well on */
export const PALETTE = [
	'5b8def',
	'4caf93',
	'e0805a',
	'9c6ade',
	'd4a72c',
	'e06c8a',
	'3fa7c4',
	'7a8b99'
];

const HEX = /^[0-9a-f]{6}$/i;

/** `value` without `#` when it is a colour of 6 hex digits, otherwise `fallback` */
const color = (value: string, fallback: string): string => {
	const hex = value.trim().replace(/^#/, '');
	return HEX.test(hex) ? hex.toLowerCase() : fallback;
};

const size = (value: number, fallback: number): number =>
	Number.isFinite(value) ? Math.min(MAX_IMAGE_SIZE, Math.max(1, Math.round(value))) : fallback;

/** URL of a placeholder image of the data service at `baseUrl` */
export function imageUrl(baseUrl: string, settings: DatagenImageSettings): string {
	const width = size(settings.width, defaultImageSettings.width);
	const height = size(settings.height, defaultImageSettings.height);
	const background = color(settings.background, PALETTE[0]);
	const text = settings.text.trim();

	return (
		`${baseUrl.replace(/\/+$/, '')}/image/${width}x${height}/${background}/${color(settings.color, 'ffffff')}` +
		(text ? `?text=${encodeURIComponent(text)}` : '')
	);
}

/** Records of `count` placeholder images */
export function imageItems(
	count: number,
	settings: DatagenImageSettings,
	baseUrl: string,
	random: () => number = Math.random
): DatagenRecord[] {
	const width = size(settings.width, defaultImageSettings.width);
	const height = size(settings.height, defaultImageSettings.height);
	const start = Math.floor(random() * PALETTE.length);

	return Array.from({ length: count }, (_, index) => {
		const background =
			settings.background === 'random'
				? PALETTE[(start + index) % PALETTE.length]
				: color(settings.background, PALETTE[0]);
		const textColor = color(settings.color, 'ffffff');

		return {
			url: imageUrl(baseUrl, { ...settings, width, height, background, color: textColor }),
			width,
			height,
			background,
			color: textColor
		};
	});
}
