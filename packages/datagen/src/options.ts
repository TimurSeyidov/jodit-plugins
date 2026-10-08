import type { DatagenLayout } from './layouts.js';
import type { DatagenTypeName } from './schemas.js';

/** A layout of the site, offered in the list of layouts of its type */
export interface DatagenLayoutItem extends DatagenLayout {
	/** Type of data the template shows */
	type: DatagenTypeName;
}

/**
 * Settings of the data generation plugin, available as the `datagen` editor option
 */
export interface DatagenOptions {
	/** Address of the data service: dummyjson.com or your own copy of it (DummyJSON is open source) */
	baseUrl: string;

	/**
	 * Types of data offered in the dialog: `false` hides a built-in type. An object rather than a list, so that one
	 * type can be hidden without repeating the others.
	 */
	types: Partial<Record<DatagenTypeName, boolean>>;

	/** Layouts of the site, offered after the built-in ones of their type, under any key */
	layouts: Record<string, DatagenLayoutItem>;

	/** Most items generated at once */
	maxCount: number;

	/** Number of items offered the first time */
	defaultCount: number;

	/** Remember the type, the number, the layouts and the own templates in the browser for the next time */
	remember: boolean;

	/** Time to wait for the data service, in milliseconds */
	timeout: number;
}

export const defaultOptions: DatagenOptions = {
	baseUrl: 'https://dummyjson.com',
	types: {},
	layouts: {},
	maxCount: 100,
	defaultCount: 5,
	remember: true,
	timeout: 10000
};

declare module 'jodit/types/config.js' {
	interface Config {
		datagen: DatagenOptions;
	}
}
