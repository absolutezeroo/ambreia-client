// Dev-only pre-bundle of vortex-engine.
//
// No shebang here, unlike the CLI tools next to it: Vite inlines this module into the compiled
// vite.config, where a `#!` line is a syntax error.
//
// Vite serves one HTTP request per source module in dev. The engine is ~4,480 files and the
// client statically reaches ~3,970 of them at boot, so every page load — and every hot-reload,
// since the port defines no `import.meta.hot` anywhere and therefore always does a full page
// reload — costs ~4,000 requests. Even with a warm browser cache those are ~3,980 `304`
// revalidations over HTTP/1.1, which caps at 6 parallel connections. Measured on this repo:
// 15.2s first load, 5.9s reload.
//
// This plugin hands the engine to esbuild instead: every `@core`/`@habbo`/`@room`/`@iid`/`@ambreia/*`/
// `vortex-engine` specifier the client imports becomes an esbuild entry point, code-split into
// shared chunks, rebuilt on watch. The browser then fetches ~185 modules instead of ~4,000.
// Measured after: 0.97s first load, 0.18-0.30s reload, ~1-2s for an engine edit (rebuild included).
//
// Client sources are untouched and keep going through Vite normally, so `?raw`,
// `import.meta.glob` and `.scss` — all of which exist only on the client side — still work.
//
// Serve-only: `pnpm build` is completely unaffected.
import {createRequire} from 'node:module';
import {readdirSync, statSync, readFileSync, rmSync} from 'node:fs';
import {readdir} from 'node:fs/promises';
import {join, relative} from 'node:path';

const require = createRequire(import.meta.url);
const esbuild = require('esbuild');

const OUT_DIR_NAME = '.vortex-dev';

// Engine and workspace-package specifiers a client file may import. Any `@ambreia/<name>` matches,
// so a new package needs no edit here; workspaceAliases() finds where it lives.
export const ENGINE_ALIAS_RE = /^(?:@ambreia\/[a-z-]+)(\/|$)/;
const ENGINE_SPEC_RE = /from\s*['"]((?:@ambreia\/[a-z-]+)(?:\/[^'"]*)?|vortex-engine)['"]|import\s*\(\s*['"]((?:@ambreia\/[a-z-]+)(?:\/[^'"]*)?|vortex-engine)['"]\s*\)/g;

// Only externalise what the client imports too, so there is exactly one instance of it at
// runtime. `pako` is engine-only and pnpm does not expose it to resolution from the client
// package, so externalising it yields "Failed to resolve import" and a blank page — it must be
// inlined into the chunks.
const SHARED_EXTERNALS = ['pixi.js', 'eventemitter3'];

const norm = (p) => p.replace(/\\/g, '/');

/**
 * `@ambreia/<name>` → `<packages>/ambreia-<name>/src`, for every such folder on disk. Read rather
 * than listed so a package added at J2–J6 joins the one esbuild graph by itself: a package missing
 * here is served by Vite as source next to its bundled copy, and its singletons exist twice.
 */
export function workspaceAliases(packagesDir)
{
	const root = norm(packagesDir);
	const aliases = {};

	for (const name of readdirSync(root))
	{
		if (!name.startsWith('ambreia-')) continue;

		try
		{
			if (statSync(root + '/' + name + '/src').isDirectory()) aliases['@ambreia/' + name.slice('ambreia-'.length)] = root + '/' + name + '/src';
		}
		catch
		{
			// a package folder without src/ is not a source package
		}
	}

	return aliases;
}

export function engineBundle(options)
{
	const CLIENT_ROOT = norm(options.clientRoot);
	const ENGINE_ROOT = norm(options.engineRoot);
	const ENGINE_SRC = ENGINE_ROOT + '/src';
	const OUT_DIR = CLIENT_ROOT + '/' + OUT_DIR_NAME;

	// One esbuild graph for the engine AND the workspace packages it is being split into
	// (spec §12 n° 2): one graph is one instance of Logger, FrameTimings and the other singletons.
	const PACKAGES = norm(join(options.engineRoot, '..'));

	const ALIAS_TARGETS =
		{
			...workspaceAliases(PACKAGES)
		};
	const SOURCE_ROOTS = [ENGINE_SRC, ...Object.values(workspaceAliases(PACKAGES))];

	function firstExistingFile(base)
	{
		for (const candidate of [base + '.ts', base + '/index.ts', base])
		{
			try
			{
				if (statSync(candidate).isFile()) return norm(candidate);
			}
			catch
			{
				// try the next candidate
			}
		}

		return null;
	}

	function resolveEngineSpec(spec)
	{
		if (spec === 'vortex-engine') return firstExistingFile(ENGINE_SRC + '/index');
		if (!ENGINE_ALIAS_RE.test(spec)) return null;

		const key = Object.keys(ALIAS_TARGETS).find((k) => spec === k || spec.startsWith(k + '/'));
		if (!key) return null;

		return firstExistingFile(ALIAS_TARGETS[key] + spec.slice(key.length));
	}

	// Every engine specifier reachable from a client source file becomes an entry point.
	async function scanClientSpecs()
	{
		const specs = new Set();

		const walk = async (dir) =>
		{
			for (const entry of await readdir(dir, {withFileTypes: true}))
			{
				const full = join(dir, entry.name);

				if (entry.isDirectory())
				{
					// `assets/` holds the XML/PNG dump, never TypeScript.
					if (entry.name === 'assets' || entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
					await walk(full);
					continue;
				}

				if (!entry.name.endsWith('.ts')) continue;

				const source = readFileSync(full, 'utf8');
				let match;
				ENGINE_SPEC_RE.lastIndex = 0;

				while ((match = ENGINE_SPEC_RE.exec(source)) !== null) specs.add(match[1] ?? match[2]);
			}
		};

		await walk(join(CLIENT_ROOT, 'src'));

		return specs;
	}

	const aliasPlugin =
		{
			name: 'vortex-engine-alias',
			setup(build)
			{
				build.onResolve({filter: ENGINE_ALIAS_RE}, (args) =>
				{
					const file = resolveEngineSpec(args.path);

					return file ? {path: file} : null;
				});

				build.onResolve({filter: /^vortex-engine$/}, () => ({path: firstExistingFile(ENGINE_SRC + '/index')}));
			}
		};

	let context = null;
	let ready = null;
	let server = null;
	let logger = console;
	const knownSpecs = new Set();
	const outputForSpec = new Map();

	function reportPlugin(onFirstBuild)
	{
		return {
			name: 'vortex-engine-report',
			setup(build)
			{
				let startedAt = 0;
				let isFirstBuild = true;

				build.onStart(() =>
				{
					startedAt = Date.now();
				});

				build.onEnd((result) =>
				{
					if (result.errors.length)
					{
						logger.error?.(`[engine-bundle] rebuild failed with ${result.errors.length} error(s)`);
						for (const error of result.errors.slice(0, 5)) logger.error?.(`  ${error.text} (${error.location?.file ?? '?'})`);
					}
					else
					{
						logger.info?.(`[engine-bundle] engine rebuilt in ${Date.now() - startedAt}ms`);

						// Nothing is connected yet on the first build, and reloading then would
						// race the page that triggered it.
						if (!isFirstBuild) server?.ws.send({type: 'full-reload'});
					}

					isFirstBuild = false;
					onFirstBuild();
				});
			}
		};
	}

	async function rebuildContext()
	{
		const entryPoints = [];
		// Built aside and swapped in only once the output files are actually on disk. Clearing
		// the live map up front would leave a window where resolveId sees no mapping and Vite
		// 404s on a chunk that is still being written.
		const nextOutputs = new Map();

		for (const spec of knownSpecs)
		{
			const file = resolveEngineSpec(spec);

			if (!file)
			{
				logger.warn?.(`[engine-bundle] cannot resolve engine specifier: ${spec}`);
				continue;
			}

			entryPoints.push(file);
			nextOutputs.set(spec, OUT_DIR + '/' + norm(relative(PACKAGES, file)).replace(/\.ts$/, '.js'));
		}

		if (context) await context.dispose();

		let markBuilt;
		const firstBuild = new Promise((resolve) =>
		{
			markBuilt = resolve;
		});

		context = await esbuild.context({
			entryPoints,
			outbase: PACKAGES,
			outdir: OUT_DIR,
			entryNames: '[dir]/[name]',
			chunkNames: 'chunks/[name]-[hash]',
			bundle: true,
			splitting: true,
			format: 'esm',
			platform: 'browser',
			// Mirrors what Vite's own dev transform applies today: target esnext (which makes
			// esbuild default `useDefineForClassFields` to true, matching the current field
			// initialisation order) plus experimentalDecorators. Changing either would change
			// runtime semantics, not just speed.
			target: 'esnext',
			tsconfigRaw: {compilerOptions: {experimentalDecorators: true}},
			// Inline: measured no slower than linked `.map` files, and costs no extra request.
			sourcemap: 'inline',
			external: SHARED_EXTERNALS,
			plugins: [aliasPlugin, reportPlugin(() => markBuilt())],
			logLevel: 'silent'
		});

		// watch() already runs a build of its own, so calling rebuild() first would bundle the
		// whole engine twice on every startup.
		await context.watch();
		await firstBuild;

		outputForSpec.clear();
		for (const [spec, output] of nextOutputs) outputForSpec.set(spec, output);
	}

	// A client file may import an engine module that was not in the initial scan. Rebuilding with
	// the new entry point is the only safe answer: falling back to serving the engine source
	// directly would give that module a second identity alongside the one esbuild inlined into a
	// chunk, and `instanceof`/DI lookups against it would silently fail.
	function addSpec(spec)
	{
		if (knownSpecs.has(spec)) return ready;

		logger.info?.(`[engine-bundle] new engine entry point "${spec}", rebuilding`);
		knownSpecs.add(spec);
		ready = ready.then(() => rebuildContext());

		return ready;
	}

	return {
		name: 'vortex:engine-bundle',
		enforce: 'pre',
		apply: 'serve',

		// Awaited on purpose: it delays the "ready" line by the length of one engine bundle, but
		// letting the server accept requests first means Vite's static middleware can answer a
		// chunk request before esbuild has written that chunk, which 404s and leaves a blank page.
		async configResolved(config)
		{
			logger = config.logger ?? console;

			try
			{
				rmSync(OUT_DIR, {recursive: true, force: true});
			}
			catch
			{
				// nothing to clean
			}

			ready = scanClientSpecs().then((specs) =>
			{
				for (const spec of specs) knownSpecs.add(spec);

				return rebuildContext();
			});

			await ready;
		},

		configureServer(devServer)
		{
			server = devServer;

			devServer.httpServer?.once('close', () =>
			{
				context?.dispose();
				context = null;
			});
		},

		async resolveId(source, importer)
		{
			if (source !== 'vortex-engine' && !ENGINE_ALIAS_RE.test(source)) return null;

			// Engine-internal imports are already inlined by esbuild; only client files get here.
			if (importer && SOURCE_ROOTS.some((root) => norm(importer).startsWith(root))) return null;

			await ready;

			if (!outputForSpec.has(source)) await addSpec(source);

			return outputForSpec.get(source) ?? null;
		}
	};
}
