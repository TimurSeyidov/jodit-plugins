import { describe, expect, it } from 'vitest';

import { layout } from '../src/layout';
import { defaultOptions } from '../src/options';
import type { MailtoOptions } from '../src/options';

const options = (
	fields: Partial<MailtoOptions['fields']> = {},
	required: Partial<MailtoOptions['required']> = {}
): MailtoOptions => ({
	...defaultOptions,
	fields: { ...defaultOptions.fields, ...fields },
	required: { ...defaultOptions.required, ...required }
});

describe('layout', () => {
	it('puts the short form on the main tab and every field on "Additional"', () => {
		expect(layout(options())).toEqual({
			main: ['to', 'subject', 'text'],
			additional: ['to', 'cc', 'bcc', 'subject', 'body', 'text']
		});
	});

	it('hides fields set to false', () => {
		expect(layout(options({ bcc: false }))).toEqual({
			main: ['to', 'subject', 'text'],
			additional: ['to', 'cc', 'subject', 'body', 'text']
		});
	});

	it('moves fields to the main tab', () => {
		expect(layout(options({ body: 'main' })).main).toEqual([
			'to',
			'subject',
			'body',
			'text'
		]);
	});

	it('has no "Additional" tab when no field is only there', () => {
		expect(
			layout(options({ cc: false, bcc: false, body: 'main' }))
		).toEqual({
			main: ['to', 'subject', 'body', 'text'],
			additional: []
		});
	});

	it('shows a required hidden field on the main tab', () => {
		expect(
			layout(options({ subject: false }, { subject: true })).main
		).toEqual(['to', 'subject', 'text']);
	});

	it('keeps To and the link text on both tabs whatever the options', () => {
		const { main, additional } = layout(
			options({ subject: 'additional' }, { to: false })
		);

		expect(main).toEqual(['to', 'text']);
		expect(additional[0]).toBe('to');
		expect(additional[additional.length - 1]).toBe('text');
	});
});
