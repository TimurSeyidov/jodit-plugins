// Static server for the browser tests, on 127.0.0.1 only.
//
//   /<path>                         file from the repository
//   /bundle/<build>/<file>          node_modules/jodit/<build>/<file>
//   /bundle/<build>/plugins/<name>/ packages/<name>/dist/<build>/plugins/<name>/
//
// /bundle/<build>/ is laid out like a site that hosts Jodit with the plugins
// copied next to it, so `basePath` + `extraPlugins` can be tested.
//
// Usage: node tools/serve.mjs [port]

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv[2] ?? 8097);

const TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.json': 'application/json'
};

function resolvePath(urlPath) {
	const bundle = /^\/bundle\/([\w.]+)\/(?:plugins\/([\w-]+)\/(.+)|(.+))$/.exec(urlPath);

	if (bundle) {
		const [, build, plugin, pluginFile, file] = bundle;
		return plugin
			? join('packages', plugin, 'dist', build, 'plugins', plugin, pluginFile)
			: join('node_modules', 'jodit', build, file);
	}

	return urlPath;
}

createServer((request, response) => {
	const urlPath = decodeURIComponent(new URL(request.url, 'http://x').pathname);
	const file = resolve(root, '.' + sep + normalize(resolvePath(urlPath)));

	if (
		!file.startsWith(root + sep) ||
		!existsSync(file) ||
		!statSync(file).isFile()
	) {
		response.writeHead(404).end('Not found');
		return;
	}

	response.writeHead(200, {
		'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
		'Cache-Control': 'no-store'
	});
	createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
	console.log(`Serving ${root} on http://127.0.0.1:${port}/`);
});
