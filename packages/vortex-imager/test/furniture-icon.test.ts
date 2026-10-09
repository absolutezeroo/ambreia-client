// The hotel's own catalogue icon, read from the icons .ambreia directory (spec 2026-10-09-ambreia-everything,
// icons revision): a furni's scale-1 render differs from it for about four in ten.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AmbreiaDirectory} from '@ambreia/common/assets/pack/AmbreiaDirectory';
import type {FetchBytes} from '@ambreia/common/assets/pack/AmbreiaDirectory';
import {compressManifest, encodePiece} from '@ambreia/common/assets/pack/AmbreiaPiece';
import {plainLayout} from '@ambreia/common/assets/pack/AmbreiaLayout';
import {hotelIconName, readHotelIcon} from '../src/room/FurnitureIcon';

const DIR = 'http://assets/ambreia/icons/';
const DICTIONARY = new TextEncoder().encode('{"name":"');
const DICTIONARY_ID = '0123456789abcdef';
const WEBP = new Uint8Array([82, 73, 70, 70, 9]);

/** An icons directory holding `pieces`, each a manifest and one WebP image. */
async function icons(pieces: string[]): Promise<AmbreiaDirectory>
{
    const layout = plainLayout();
    const files = new Map<string, Uint8Array>();

    files.set(`${DIR}ambreia.json`, new TextEncoder().encode(JSON.stringify({v: 1, kind: 'icons', dictionary: DICTIONARY_ID, encrypted: false, keyId: null})));
    files.set(DIR + await layout.path({kind: 'dictionary', id: DICTIONARY_ID}), DICTIONARY);

    for(const name of pieces)
    {
        files.set(DIR + await layout.path({kind: 'piece', name}), encodePiece({dictionaryId: DICTIONARY_ID, manifest: compressManifest({name}, DICTIONARY), images: [{entryName: `${name}.png`, format: 'webp', bytes: WEBP}]}, name));
    }

    const fetch: FetchBytes = async url => files.get(url) ?? null;

    return new AmbreiaDirectory(DIR, fetch);
}

test('a class names its icon as the hotel did: the colour index after an underscore', () =>
{
    assert.equal(hotelIconName('sofa_silo*2'), 'sofa_silo_2_icon');
    assert.equal(hotelIconName('throne'), 'throne_icon');
});

test('the icon comes back as its image bytes, typed by the format the build kept', async () =>
{
    const icon = await readHotelIcon(await icons(['sofa_silo_2_icon']), 'sofa_silo*2');

    assert.deepEqual(icon && [...icon.bytes], [...WEBP]);
    assert.equal(icon?.contentType, 'image/webp');
});

test('a class without a hotel icon answers null, so the caller renders the furni instead', async () =>
{
    assert.equal(await readHotelIcon(await icons(['throne_icon']), 'chair_polyfon'), null);
});
