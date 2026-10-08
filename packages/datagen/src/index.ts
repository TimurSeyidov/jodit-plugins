import { Jodit } from 'jodit';

import { registerDatagen } from './plugin.js';

registerDatagen(Jodit);

export { NAME, registerDatagen } from './plugin.js';
export { DatagenError, MESSAGES, clearCache, generate, loadPool, sample } from './source.js';
export type { GenerateOptions, SourceOptions } from './source.js';
export { TEMPLATE_MESSAGES, checkTemplate, checkTags, fieldsOf, isWarning, render } from './template.js';
export type { DatagenTemplate, TemplateError, TemplateErrorCode, TemplatePart } from './template.js';
export { FILTERS, escapeHtml } from './filters.js';
export type { DatagenFilter } from './filters.js';
export { COMMON_FIELDS, ITEM_FIELDS, TYPES, stars } from './schemas.js';
export type {
	DatagenCollection,
	DatagenData,
	DatagenField,
	DatagenRecord,
	DatagenType,
	DatagenTypeName,
	DatagenValue
} from './schemas.js';
export { LAYOUTS } from './layouts.js';
export type { DatagenLayout } from './layouts.js';
export { MAX_IMAGE_SIZE, PALETTE, defaultImageSettings, imageItems, imageUrl } from './images.js';
export type { DatagenImageSettings } from './images.js';
export { defaultOptions } from './options.js';
export type { DatagenLayoutItem, DatagenOptions } from './options.js';
