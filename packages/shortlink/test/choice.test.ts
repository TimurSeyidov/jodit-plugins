import { describe, expect, it } from 'vitest';

import { chosenService, offeredServices } from '../src/choice';
import { defaultOptions } from '../src/options';
import type { ShortlinkOptions } from '../src/options';

const options = (changes: Partial<ShortlinkOptions> = {}) => ({ ...defaultOptions, ...changes });
const own = async (url: string) => `https://go.example/${url.length}`;

describe('offeredServices', () => {
	it('offers da.gd and clck.ru by default', () => {
		expect(offeredServices(options())).toEqual([
			{ title: 'da.gd', service: 'dagd' },
			{ title: 'clck.ru', service: 'clck' }
		]);
	});

	it('follows the order of the object, skips false and unknown names', () => {
		expect(
			offeredServices(
				options({
					service: 'clck',
					services: { clck: true, nope: true, dagd: false, mine: { title: 'Ours', service: own } }
				})
			)
		).toEqual([
			{ title: 'clck.ru', service: 'clck' },
			{ title: 'Ours', service: own }
		]);
	});

	it('offers nothing when the service is not one of the services', () => {
		expect(offeredServices(options({ service: 'clck', services: { dagd: true } }))).toEqual([]);
		expect(offeredServices(options({ service: own }))).toEqual([]);
	});
});

describe('chosenService', () => {
	it('takes the remembered one, else the service option, else the first', () => {
		expect(chosenService(options(), 'clck.ru')).toEqual({ title: 'clck.ru', service: 'clck' });
		expect(chosenService(options({ service: 'clck' }))).toEqual({
			title: 'clck.ru',
			service: 'clck'
		});
		expect(chosenService(options(), 'gone.example')).toEqual({ title: 'da.gd', service: 'dagd' });
	});

	it('takes the service option when there is no choice', () => {
		expect(chosenService(options({ service: 'clck', services: { dagd: true } }), 'da.gd')).toEqual({
			title: 'clck.ru',
			service: 'clck'
		});
		expect(chosenService(options({ service: own })).service).toBe(own);
	});
});
