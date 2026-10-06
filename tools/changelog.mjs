// Prints the section of a version from packages/<dir>/CHANGELOG.md, without
// its heading: the notes of the GitHub release. Fails when there is none.
//
// Usage: node tools/changelog.mjs <dir> <version>

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [dir, version] = process.argv.slice(2);

const lines = readFileSync(
	join(root, 'packages', dir, 'CHANGELOG.md'),
	'utf8'
).split('\n');

const start = lines.findIndex(line => line.startsWith(`## [${version}]`));

if (start === -1) {
	console.error(`packages/${dir}/CHANGELOG.md has no section for ${version}`);
	process.exit(1);
}

const end = lines.findIndex(
	(line, index) =>
		index > start && (line.startsWith('## ') || /^\[[^\]]+\]: /.test(line))
);

const notes = lines
	.slice(start + 1, end === -1 ? undefined : end)
	.join('\n')
	.trim();

if (!notes) {
	console.error(`The ${version} section of packages/${dir}/CHANGELOG.md is empty`);
	process.exit(1);
}

console.log(notes);
