import { defaultImageSettings, imageItems } from './images.js';
import type { DatagenImageSettings } from './images.js';
import { TYPES } from './schemas.js';
import type { DatagenData, DatagenRecord, DatagenType, DatagenTypeName } from './schemas.js';

/** A failure with a message for the user, in English: the plugin translates it */
export class DatagenError extends Error {
	override name = 'DatagenError';
}

/** Messages of the failures, also used as translation keys */
export const MESSAGES = {
	unavailable: 'The data service is not available',
	timeout: 'The data service did not answer in time',
	answer: 'The data service gave an unexpected answer'
} as const;

/** Where the data comes from and how long to wait for it */
export interface SourceOptions {
	/** Address of the data service, a dummyjson.com compatible API */
	baseUrl: string;

	/** Time to wait for the service, in milliseconds */
	timeout: number;
}

/** What to generate, besides the type */
export interface GenerateOptions extends SourceOptions {
	/** Number of items; less when the collection is smaller */
	count: number;

	/** Settings of the `images` type */
	image?: DatagenImageSettings;

	/** Random numbers from 0 to 1, `Math.random` by default */
	random?: () => number;
}

type Fetch = typeof fetch;

// Records of the collections, shared by all editors: the data of the service is the same for everybody
const cache = new Map<string, Promise<DatagenRecord[]>>();

/** Forgets the loaded collections */
export function clearCache(): void {
	cache.clear();
}

async function request(url: string, resource: string, timeout: number, fetcher: Fetch): Promise<DatagenRecord[]> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeout);
	let response: Response;

	try {
		response = await fetcher(url, { signal: controller.signal });
	} catch {
		throw new DatagenError(controller.signal.aborted ? MESSAGES.timeout : MESSAGES.unavailable);
	}

	try {
		if (!response.ok) {
			throw new DatagenError(MESSAGES.unavailable);
		}

		let body: unknown;

		try {
			body = await response.json();
		} catch {
			throw new DatagenError(controller.signal.aborted ? MESSAGES.timeout : MESSAGES.answer);
		}

		const records = (body as Record<string, unknown> | null)?.[resource];

		if (!Array.isArray(records) || records.some(record => !record || typeof record !== 'object')) {
			throw new DatagenError(MESSAGES.answer);
		}

		return records as DatagenRecord[];
	} finally {
		clearTimeout(timer);
	}
}

/**
 * Records of `type` that the items are chosen from: the whole collection, asked once with only the fields of the
 * type and kept for the next calls. `null` for a type without a collection.
 *
 * Throws a {@link DatagenError} with one of {@link MESSAGES} when the service cannot be reached, does not answer
 * within `timeout` milliseconds or answers with something else than the collection.
 */
export async function loadPool(
	type: DatagenType,
	options: SourceOptions,
	fetcher: Fetch = (...args) => fetch(...args)
): Promise<DatagenRecord[] | null> {
	const { collection } = type;

	if (!collection) {
		return null;
	}

	const url =
		`${options.baseUrl.replace(/\/+$/, '')}/${collection.resource}` +
		`?limit=0&select=${collection.select.join(',')}`;

	let records = cache.get(url);

	if (!records) {
		records = request(url, collection.resource, options.timeout, fetcher);
		cache.set(url, records);
		records.catch(() => cache.delete(url));
	}

	const loaded = await records;

	return collection.toItems ? loaded.flatMap(collection.toItems) : loaded;
}

/** `count` different items of `pool` in random order; all of them when there are fewer */
export function sample<T>(pool: T[], count: number, random: () => number = Math.random): T[] {
	const items = pool.slice();
	const length = Math.min(Math.max(0, count), items.length);

	for (let index = 0; index < length; index += 1) {
		const other = index + Math.floor(random() * (items.length - index));
		[items[index], items[other]] = [items[other], items[index]];
	}

	return items.slice(0, length);
}

/**
 * Generates data of the built-in type `name`: `count` different random records of its collection, or `count`
 * placeholder images. Throws a {@link DatagenError} like {@link loadPool}.
 */
export async function generate(
	name: DatagenTypeName,
	options: GenerateOptions,
	fetcher?: Fetch
): Promise<DatagenData> {
	const type = TYPES[name];
	const random = options.random ?? Math.random;
	const count = Math.max(1, Math.floor(options.count));
	const pool = await loadPool(type, options, fetcher);
	const items = pool
		? sample(pool, count, random)
		: imageItems(count, options.image ?? defaultImageSettings, options.baseUrl, random);

	return type.finish ? type.finish(items, random) : { items, context: {} };
}
