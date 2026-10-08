// No shebang: Vite inlines this module into the compiled vite.config (see vite-plugin-engine-bundle.mjs).
//
// Production build only. Replaces every `Incoming.X` / `Outgoing.X` with the id of a release revision
// and serves Headers.generated as just its REVISION, so the bundle carries numbers and no message
// name: a bot has to recognise each message by its shape, as with Habbo's obfuscated client.
// Spec: docs/superpowers/specs/2026-10-08-random-header-revisions-design.md §4.4.
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {emulatorCandidates, latestReleaseFile, parseRelease} from '../../vortex-engine/tools/lib/headers.mjs';

const MEMBER_RE = /\b(Incoming|Outgoing)\.([A-Za-z_]\w*)/g;
const HEADERS_IMPORT_RE = /(^|[\\/])Headers\.generated(\.ts)?$/;
const VIRTUAL_ID = '\0ambreia-release-headers';

export function inlineHeaders(code, release, file)
{
    return code.replace(MEMBER_RE, (match, side, name) =>
    {
        const id = (side === 'Incoming' ? release.incoming : release.outgoing).get(name);

        if(id === undefined) throw new Error(`${file}: ${side}.${name} is not in release ${release.revision}`);

        return String(id);
    });
}

/** Incoming/Outgoing stay exported (their imports must resolve) but empty: every use was inlined. */
export function releaseModule(release)
{
    return `export const REVISION = ${JSON.stringify(release.revision)};\nexport const Incoming = {};\nexport const Outgoing = {};\n`;
}

/** AMBREIA_RELEASE, else the newest table of the emulator gen-headers would read (VORTEX_EMULATOR_DIR or the sibling checkout). */
export function findReleaseFile({env, repoRoot})
{
    if(env.AMBREIA_RELEASE) return env.AMBREIA_RELEASE;

    const emulators = env.VORTEX_EMULATOR_DIR ? [env.VORTEX_EMULATOR_DIR] : emulatorCandidates(repoRoot, null);

    for(const emulator of emulators)
    {
        const file = latestReleaseFile(join(emulator, 'Vortex.Revisions', 'Releases'));

        if(file) return file;
    }

    throw new Error('No release revision: set AMBREIA_RELEASE to its JSON, or draw one with '
        + '`node scripts/revision-new.mjs` in vortex-rpg-emulator.');
}

export function release({repoRoot})
{
    let table = null;

    return [
        {
            name: 'ambreia:release-headers',
            apply: 'build',
            enforce: 'pre',
            buildStart()
            {
                const file = findReleaseFile({env: process.env, repoRoot});

                table = parseRelease(readFileSync(file, 'utf8'));
                this.info(`release ${table.revision} (${file})`);
            },
            resolveId(source)
            {
                return HEADERS_IMPORT_RE.test(source) ? VIRTUAL_ID : null;
            },
            load(id)
            {
                return id === VIRTUAL_ID ? releaseModule(table) : null;
            }
        },
        {
            // After esbuild: TypeScript is gone and so are comments, which name `Incoming.X` in prose.
            name: 'ambreia:release-inline',
            apply: 'build',
            enforce: 'post',
            transform(code, id)
            {
                if(id.includes('node_modules') || !/\b(?:Incoming|Outgoing)\./.test(code)) return null;

                return {code: inlineHeaders(code, table, id), map: null};
            }
        }
    ];
}
