import type { ShortlinkOptions, ShortlinkServiceItem } from './options.js';
import type { ShortlinkServiceName } from './services.js';

/** Names of the built-in services in the list */
export const TITLES: Record<ShortlinkServiceName, string> = {
	dagd: 'da.gd',
	clck: 'clck.ru'
};

type ChoiceOptions = Pick<ShortlinkOptions, 'service' | 'services'>;

/**
 * The services to choose from: those of the `services` option with their titles, in its order, without repeated
 * titles. None when the `service` option is not one of them: then it is the only service.
 */
export function offeredServices(options: ChoiceOptions): ShortlinkServiceItem[] {
	const items: ShortlinkServiceItem[] = [];

	for (const [key, value] of Object.entries(options.services ?? {})) {
		const item =
			value === true
				? key in TITLES
					? { title: TITLES[key as ShortlinkServiceName], service: key as ShortlinkServiceName }
					: null
				: value && typeof value === 'object' && typeof value.title === 'string' && value.service
					? value
					: null;

		if (item && !items.some(({ title }) => title === item.title)) {
			items.push(item);
		}
	}

	return items.some(({ service }) => service === options.service) ? items : [];
}

/**
 * The service to use: the offered one with the `remembered` title, else the offered one that is the `service`
 * option, else the first offered one. When none is offered, the `service` option.
 */
export function chosenService(options: ChoiceOptions, remembered?: string): ShortlinkServiceItem {
	const items = offeredServices(options);

	return (
		items.find(({ title }) => title === remembered) ??
		items.find(({ service }) => service === options.service) ??
		items[0] ?? {
			title: typeof options.service === 'string' ? TITLES[options.service] ?? '' : '',
			service: options.service
		}
	);
}
