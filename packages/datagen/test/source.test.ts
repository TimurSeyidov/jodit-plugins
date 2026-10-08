import { beforeEach, describe, expect, it, vi } from 'vitest';

import { imageItems, imageUrl, defaultImageSettings, MAX_IMAGE_SIZE, PALETTE } from '../src/images';
import { TYPES } from '../src/schemas';
import { DatagenError, MESSAGES, clearCache, generate, loadPool, sample } from '../src/source';
import { FIXTURES, sequence, service } from './helpers';

const BASE = 'https://dummyjson.com';
const options = { baseUrl: BASE, timeout: 1000 };

beforeEach(() => clearCache());

describe('loadPool', () => {
	it('asks for the whole collection with the fields of the type', async () => {
		const fetcher = service();

		await expect(loadPool(TYPES.quotes, { ...options, baseUrl: `${BASE}/` }, fetcher)).resolves.toEqual(
			FIXTURES.quotes
		);
		expect(String(fetcher.mock.calls[0][0])).toBe(`${BASE}/quotes?limit=0&select=quote,author`);
	});

	it('asks once and shares the answer', async () => {
		const fetcher = service();

		await Promise.all([loadPool(TYPES.posts, options, fetcher), loadPool(TYPES.posts, options, fetcher)]);
		await loadPool(TYPES.posts, options, fetcher);

		expect(fetcher).toHaveBeenCalledTimes(1);
	});

	it('asks again after a failure', async () => {
		const fetcher = vi.fn(async () => new Response('', { status: 503 }));

		await expect(loadPool(TYPES.todos, options, fetcher)).rejects.toThrow(MESSAGES.unavailable);
		await expect(loadPool(TYPES.todos, options, service())).resolves.toHaveLength(3);
	});

	it('has no collection for images', async () => {
		await expect(loadPool(TYPES.images, options, service())).resolves.toBeNull();
	});

	it('reports an unreachable service', async () => {
		const fetcher = vi.fn(async () => {
			throw new TypeError('Failed to fetch');
		});

		await expect(loadPool(TYPES.quotes, options, fetcher)).rejects.toThrow(
			new DatagenError(MESSAGES.unavailable)
		);
	});

	it('gives up after the timeout', async () => {
		const fetcher = vi.fn(
			(_input: RequestInfo | URL, init?: RequestInit) =>
				new Promise<Response>((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
				})
		);

		await expect(loadPool(TYPES.quotes, { ...options, timeout: 20 }, fetcher)).rejects.toThrow(MESSAGES.timeout);
	});

	it('refuses an answer that is not the collection', async () => {
		for (const body of ['<html>', '{"quotes": 1}', '{"posts": []}', '{"quotes": [1]}', 'null']) {
			clearCache();
			await expect(
				loadPool(TYPES.quotes, options, vi.fn(async () => new Response(body)))
			).rejects.toThrow(MESSAGES.answer);
		}
	});
});

describe('sample', () => {
	it('chooses different items', () => {
		const pool = [1, 2, 3, 4, 5];
		const items = sample(pool, 3, sequence(0.99, 0, 0.5));

		expect(items).toEqual([5, 2, 4]);
		expect(pool).toEqual([1, 2, 3, 4, 5]);
	});

	it('gives the whole pool when it is smaller', () => {
		expect(sample([1, 2], 5).sort()).toEqual([1, 2]);
		expect(sample([1, 2], 0)).toEqual([]);
	});
});

describe('generate', () => {
	it('makes the records of every type with a collection', async () => {
		for (const [name, type] of Object.entries(TYPES)) {
			if (!type.collection) {
				continue;
			}

			const data = await generate(name as keyof typeof TYPES, { ...options, count: 100 }, service());

			expect(data.items.length, name).toBeGreaterThan(0);

			// Every field of the schema is in the data of the service, a misspelled path would be empty everywhere
			for (const field of type.fields) {
				const path = field.path.split('.');
				const values = data.items.flatMap(item => {
					let value: unknown = item;

					for (const segment of path) {
						value = Array.isArray(value)
							? value.map(entry => (entry as Record<string, unknown>)[segment])
							: (value as Record<string, unknown> | undefined)?.[segment];
					}

					return Array.isArray(value) ? value : [value];
				});

				expect(values.some(value => value !== undefined && value !== null), `${name}: ${field.path}`).toBe(true);
			}
		}
	});

	it('asks the service for no private data of users', () => {
		const select = TYPES.users.collection?.select ?? [];

		for (const field of ['password', 'ssn', 'ein', 'ip', 'macAddress', 'userAgent', 'bank', 'crypto']) {
			expect(select).not.toContain(field);
		}
	});

	it('adds the computed fields', async () => {
		const [user] = (await generate('users', { ...options, count: 1, random: () => 0 }, service())).items;
		expect(user.fullName).toBe(`${FIXTURES.users[0].firstName} ${FIXTURES.users[0].lastName}`);

		const [todo] = (await generate('todos', { ...options, count: 1, random: () => 0 }, service())).items;
		expect(todo.check).toBe(FIXTURES.todos[0].completed ? '☑' : '☐');

		const [product] = (await generate('products', { ...options, count: 1, random: () => 0 }, service())).items;
		expect(product.stars).toMatch(/^[★☆]{5}$/);
		expect(product.finalPrice).toBeLessThanOrEqual(product.price as number);
	});

	it('makes reviews of all products, without the email of the reviewer', async () => {
		const { items } = await generate('reviews', { ...options, count: 100 }, service());
		const all = FIXTURES.products.flatMap(product => product.reviews as unknown[]);

		expect(items).toHaveLength(all.length);
		expect(items[0]).toHaveProperty('product.title');
		expect(items[0]).not.toHaveProperty('reviewerEmail');
	});

	it('makes an order with quantities and totals', async () => {
		const { items, context } = await generate(
			'order',
			{ ...options, count: 2, random: sequence(0, 0, 0, 0.99) },
			service()
		);

		expect(items.map(item => item.quantity)).toEqual([1, 5]);
		expect(items[1].total).toBe(Math.round((items[1].price as number) * 5 * 100) / 100);
		expect(context).toEqual({
			order: {
				total: Math.round(((items[0].total as number) + (items[1].total as number)) * 100) / 100,
				totalQuantity: 6
			}
		});
	});

	it('makes images without asking the service', async () => {
		const fetcher = service();
		const { items } = await generate('images', { ...options, count: 3, random: () => 0 }, fetcher);

		expect(fetcher).not.toHaveBeenCalled();
		expect(items.map(item => item.background)).toEqual(PALETTE.slice(0, 3));
		expect(items[0].url).toBe(`${BASE}/image/600x400/${PALETTE[0]}/ffffff`);
	});

	it('makes at least one item', async () => {
		expect((await generate('quotes', { ...options, count: 0 }, service())).items).toHaveLength(1);
	});
});

describe('images', () => {
	it('makes the URL of a placeholder image', () => {
		expect(
			imageUrl(`${BASE}/`, { width: 300.4, height: 99999, background: '#00AA11', color: 'zzz', text: ' Hi & bye ' })
		).toBe(`${BASE}/image/300x${MAX_IMAGE_SIZE}/00aa11/ffffff?text=Hi%20%26%20bye`);
	});

	it('uses one colour or the palette', () => {
		const one = imageItems(2, { ...defaultImageSettings, background: '123456' }, BASE);
		expect(one.map(item => item.background)).toEqual(['123456', '123456']);

		const many = imageItems(PALETTE.length + 1, defaultImageSettings, BASE, () => 0.99);
		expect(many[0].background).toBe(PALETTE[PALETTE.length - 1]);
		expect(many[1].background).toBe(PALETTE[0]);
	});
});
