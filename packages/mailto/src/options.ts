/** A field of the email link dialog */
export type MailtoField = 'to' | 'cc' | 'bcc' | 'subject' | 'body' | 'text';

/** A field that can be moved between the tabs of the dialog or hidden */
export type MailtoOptionalField = 'cc' | 'bcc' | 'subject' | 'body';

/** Where a field is shown: on the main tab, on the "Additional" tab, or nowhere */
export type MailtoFieldPlacement = 'main' | 'additional' | false;

/**
 * Settings of the email link plugin, available as the `mailto` editor option.
 * `fields` and `required` are objects, so a single key can be changed without repeating the others.
 */
export interface MailtoOptions {
	/**
	 * Where each optional field is shown. To and the link text are always on the main tab.
	 * When no field is on the "Additional" tab, the dialog has no tabs.
	 */
	fields: Record<MailtoOptionalField, MailtoFieldPlacement>;

	/** Fields that must be filled in before the link can be inserted. A required hidden field is shown on the main tab. */
	required: Record<MailtoField, boolean>;

	/** Allow several addresses in `to`, `cc` and `bcc` */
	multiple: boolean;

	/** Check that every address looks like `name@domain.tld` */
	validate: boolean;

	/** Prefill the link text with the selected text, and `to` with a selected address */
	useSelection: boolean;

	/** CSS class added to inserted links, empty for none */
	className: string;
}

export const defaultOptions: MailtoOptions = {
	fields: {
		subject: 'main',
		cc: 'additional',
		bcc: 'additional',
		body: 'additional'
	},
	required: {
		to: true,
		cc: false,
		bcc: false,
		subject: false,
		body: false,
		text: false
	},
	multiple: true,
	validate: true,
	useSelection: true,
	className: ''
};

declare module 'jodit/types/config' {
	interface Config {
		mailto: MailtoOptions;
	}
}
