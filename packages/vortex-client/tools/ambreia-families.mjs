/**
 * The asset families served as .ambreia directories (spec 2026-10-09-ambreia-everything) and the
 * pure rules that fill them: which source bundle belongs to which family, and which names a family
 * still lacks once built.
 */
import zlib from 'node:zlib';

/** `icons`: the hotel's catalogue icons (`<class>[_<colour>]_icon`), served by the imager to tools. */
export const FAMILIES = ['clothing', 'effects', 'room', 'pets', 'furniture', 'icons'];

/**
 * A hotel icon PNG as a .nitro bundle (a manifest naming it, then the image), so build-ambreia turns
 * it into a piece like any other: lossless WebP when that checks out, encrypted, opaque name.
 */
export function iconBundle(name, png)
{
    const files = [[`${name}.json`, Buffer.from(JSON.stringify({name}))], [`${name}.png`, png]];
    const parts = [Buffer.alloc(2)];

    parts[0].writeInt16BE(files.length);

    for(const [fileName, data] of files)
    {
        const nameBytes = Buffer.from(fileName, 'utf8');
        const packed = zlib.deflateSync(data);
        const head = Buffer.alloc(6 + nameBytes.length);

        head.writeInt16BE(nameBytes.length, 0);
        nameBytes.copy(head, 2);
        head.writeInt32BE(packed.length, 2 + nameBytes.length);
        parts.push(head, packed);
    }

    return Buffer.concat(parts);
}

/** The room's own bundles (RoomContentLoader.getObjectContentPieces): without them nothing renders. */
export const ROOM_BUNDLES = ['HabboRoomContent', 'TileCursor', 'SelectionArrow', 'PlaceHolderFurniture', 'PlaceHolderWallItem', 'PlaceHolderPet'];

/**
 * The figure libraries the avatar renderer waits for before drawing anyone
 * (AvatarAssetDownloadManager._mandatoryLibs): without them no figure draws.
 */
export const MANDATORY_CLOTHING = ['hh_human_body', 'hh_human_item'];

const unique = names => [...new Set(names)];

export const figureMapLibs = xml => unique([...xml.matchAll(/<lib\s+id="([^"]+)"/g)].map(match => match[1]));

export const effectMapLibs = xml => unique([...xml.matchAll(/<effect\s[^>]*\blib="([^"]+)"/g)].map(match => match[1]));

export const petNames = legacyDefaults => String(legacyDefaults['pet.configuration'] ?? '').split(',').map(name => name.trim()).filter(Boolean);

/** Which of gordon's bundles each family takes; a bundle nothing reads stays behind. */
export function gordonSelection({figureLibs, effectLibs, pets, gordonNames})
{
    const has = new Set(gordonNames);
    const pick = names => unique(names).filter(name => has.has(name));

    return {clothing: pick(figureLibs), effects: pick(effectLibs), room: pick(ROOM_BUNDLES), pets: pick(pets)};
}

/**
 * The names each family lacks. A mandatory figure library or a room bundle missing blocks: no figure
 * or no room draws at all without it. Anything else is only listed (known gaps: spec, out of scope).
 */
export function coverage({figureLibs, effectLibs, pets, available})
{
    const lacking = (names, family) => unique(names).filter(name => !available[family].has(name));
    const missing = {clothing: lacking(figureLibs, 'clothing'), effects: lacking(effectLibs, 'effects'), pets: lacking(pets, 'pets'), room: lacking(ROOM_BUNDLES, 'room')};
    const blocking = [...missing.clothing.filter(name => MANDATORY_CLOTHING.includes(name)).map(name => `clothing/${name}`), ...missing.room.map(name => `room/${name}`)];

    return {missing, blocking};
}
