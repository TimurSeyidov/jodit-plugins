import { readFileSync } from 'node:fs';

import { vi } from 'vitest';

import type { DatagenRecord } from '../src/schemas';

/** A few real records of every collection of dummyjson.com, with the fields the plugin asks for */
export const FIXTURES: Record<string, DatagenRecord[]> = JSON.parse(
	readFileSync(new URL('./fixtures.json', import.meta.url), 'utf8')
);

/** A fetch that answers like dummyjson.com with the fixtures, and records its calls */
export function service() {
	return vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
		const resource = new URL(String(input)).pathname.split('/').pop() ?? '';

		return resource in FIXTURES
			? Response.json({ [resource]: FIXTURES[resource], total: FIXTURES[resource].length })
			: new Response('Not found', { status: 404 });
	});
}

/** Random numbers that repeat `values` */
export function sequence(...values: number[]): () => number {
	let index = 0;
	return () => values[index++ % values.length];
}
