import type {
	MailtoField,
	MailtoFieldPlacement,
	MailtoOptionalField,
	MailtoOptions
} from './options.js';

const OPTIONAL_FIELDS: MailtoOptionalField[] = ['subject', 'cc', 'bcc', 'body'];

/** Order of the fields on the "Additional" tab */
const ALL_FIELDS: MailtoField[] = ['to', 'cc', 'bcc', 'subject', 'body', 'text'];

/**
 * Fields of the main tab and of the "Additional" tab. The main tab is the short form: To, the fields set to `'main'`
 * and the link text. The "Additional" tab is the full form with every shown field. There is no "Additional" tab
 * when no field is set to `'additional'`. A required field that is hidden goes to the main tab.
 */
export function layout(options: MailtoOptions): {
	main: MailtoField[];
	additional: MailtoField[];
} {
	const placement = (field: MailtoOptionalField): MailtoFieldPlacement => {
		const value = options.fields[field];

		if (value === false && options.required[field]) {
			return 'main';
		}

		return value === 'main' || value === 'additional' ? value : false;
	};

	const main: MailtoField[] = [
		'to',
		...OPTIONAL_FIELDS.filter(field => placement(field) === 'main'),
		'text'
	];

	const hasAdditional = OPTIONAL_FIELDS.some(
		field => placement(field) === 'additional'
	);

	return {
		main,
		additional: hasAdditional
			? ALL_FIELDS.filter(
					field =>
						field === 'to' ||
						field === 'text' ||
						placement(field as MailtoOptionalField) !== false
				)
			: []
	};
}
