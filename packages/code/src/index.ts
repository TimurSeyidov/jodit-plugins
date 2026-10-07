import { Jodit } from 'jodit';

import { registerCode } from './plugin.js';

registerCode(Jodit);

export { NAME, registerCode } from './plugin.js';
export { readBlock, unlockValue } from './parse.js';
export type { BlockData } from './parse.js';
export { listLanguages, registerLanguage } from './highlight.js';
export type { CodeLanguage } from './highlight.js';
export { renderBlock, renderNative, TOKEN_COLORS } from './render.js';
export type { RenderOptions } from './render.js';
export { defaultOptions } from './options.js';
export type { CodeOptions } from './options.js';
