/**
 * Keeps rendered PNGs on disk, so a restart does not re-render the hotel.
 *
 * Only the routes whose URL fully describes their pixels get one: a figure string, a badge code
 * and a furni's class plus its parameters are the whole input, so the same key can only ever
 * produce the same bytes. A room is the opposite — `room/7.png` names a room whose contents
 * change whenever someone moves a chair — and it stays memory-only with a short TTL.
 *
 * The one thing that *can* change an otherwise-immutable image is the hotel updating its assets:
 * the same figure renders differently once the clothing bundles are rebuilt. So the build is
 * part of the path (`<dir>/<build>/…`), taken from `flash.client.url`, which carries the asset
 * folder's name. A new build writes into a new directory and the old one simply stops being
 * read; deleting it is the whole of cache invalidation.
 */
import {createHash} from 'node:crypto';
import {mkdir, readFile, rename, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {Logger} from '@ambreia/common/utils/Logger';

const log = Logger.getLogger('imager.cache.DiskCache');

export class DiskCache
{
    private _root: string;

    /** Directories already created this run, so a hit does not stat the filesystem twice. */
    private _known: Set<string> = new Set();

    private _writes: number = 0;

    constructor(directory: string, build: string)
    {
        this._root = join(directory, sanitize(build));
    }

    get root(): string
    {
        return this._root;
    }

    get writes(): number
    {
        return this._writes;
    }

    async read(key: string): Promise<Buffer | null>
    {
        try
        {
            return await readFile(this.pathFor(key));
        }
        catch
        {
            // Missing is the normal case, and an unreadable cache is not an error worth
            // failing a request over — the renderer is still there.
            return null;
        }
    }

    /**
	 * Writes through a temporary file and renames it into place.
	 *
	 * `rename` is atomic within a filesystem, so a crash or a concurrent read can only ever see
	 * the complete file or none of it. A half-written PNG would otherwise be served as a broken
	 * image for as long as the directory lives, which is exactly the kind of failure a cache
	 * must not invent.
	 */
    async write(key: string, buffer: Buffer): Promise<void>
    {
        const target = this.pathFor(key);
        const directory = dirname(target);

        try
        {
            if(!this._known.has(directory))
            {
                await mkdir(directory, {recursive: true});
                this._known.add(directory);
            }

            const temporary = `${target}.${process.pid}.tmp`;

            await writeFile(temporary, buffer);
            await rename(temporary, target);

            this._writes++;
        }
        catch (error)
        {
            log.warn(`Could not cache ${key} to disk: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
	 * `<root>/<first two hex chars>/<hash>.png`.
	 *
	 * Hashed because a key holds a figure string, which is far longer than a filename may be and
	 * contains characters Windows refuses; sharded because a hotel's worth of avatars in one
	 * directory makes every lookup on it slower.
	 */
    private pathFor(key: string): string
    {
        const hash = createHash('sha1').update(key).digest('hex');

        return join(this._root, hash.slice(0, 2), `${hash}.png`);
    }
}

/**
 * Turns `flash.client.url` into a directory name.
 *
 * It is a URL — `http://…/gordon/vortex-assets-PRODUCTION-202601121522-867048149/` — and its
 * last segment is the build, which is the only part that identifies anything. Keeping the whole
 * thing would put the host and the path in every cache directory's name for no gain.
 */
function sanitize(build: string): string
{
    const segment = build.replace(/[/\\]+$/, '').split(/[/\\]/).pop() ?? '';
    const cleaned = segment.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');

    return cleaned.length > 0 ? cleaned.slice(0, 120) : 'unknown-build';
}
