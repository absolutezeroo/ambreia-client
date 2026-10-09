// Which gordon bundles go to which family, and which names the families still lack.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import {ROOM_BUNDLES, coverage, effectMapLibs, figureMapLibs, gordonSelection, iconBundle, petNames} from './ambreia-families.mjs';

test('a hotel icon is wrapped as a bundle of a minimal manifest and the PNG, so build-ambreia reads it like any other', () =>
{
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
    const bytes = iconBundle('sofa_silo_2_icon', png);
    const files = [];
    let offset = 2;

    for(let count = bytes.readInt16BE(0); count > 0; count--)
    {
        const nameLength = bytes.readInt16BE(offset);
        const name = bytes.toString('utf8', offset + 2, offset + 2 + nameLength);
        const dataLength = bytes.readInt32BE(offset + 2 + nameLength);
        const start = offset + 6 + nameLength;

        files.push({name, data: zlib.inflateSync(bytes.subarray(start, start + dataLength))});
        offset = start + dataLength;
    }

    assert.deepEqual(files.map(file => file.name), ['sofa_silo_2_icon.json', 'sofa_silo_2_icon.png']);
    assert.deepEqual(JSON.parse(files[0].data.toString()), {name: 'sofa_silo_2_icon'});
    assert.deepEqual([...files[1].data], [...png]);
    assert.equal(offset, bytes.length);
});

test('the figure map and the effect map give their library names, once each', () =>
{
    assert.deepEqual(figureMapLibs('<map><lib id="hh_human_body" revision="1"><part/></lib><lib id="shirt_a"/><lib id="hh_human_body"/></map>'), ['hh_human_body', 'shirt_a']);
    assert.deepEqual(effectMapLibs('<map><effect id="dance.1" lib="Dance1" type="dance"/><effect id="fx.2" lib="Afk"/></map>'), ['Dance1', 'Afk']);
});

test('the pets are the comma list of pet.configuration', () =>
{
    assert.deepEqual(petNames({'pet.configuration': 'dog, cat,croco'}), ['dog', 'cat', 'croco']);
});

test('gordon is split by what reads each bundle; unused old clothes are left behind', () =>
{
    const picked = gordonSelection({
        figureLibs: ['hh_human_body', 'shirt_new'],
        effectLibs: ['Dance1'],
        pets: ['dog'],
        gordonNames: ['hh_human_body', 'acc_old_unused', 'Dance1', 'dog', 'HabboRoomContent', 'TileCursor']
    });

    assert.deepEqual(picked.clothing, ['hh_human_body']);
    assert.deepEqual(picked.effects, ['Dance1']);
    assert.deepEqual(picked.pets, ['dog']);
    assert.deepEqual(picked.room, ['HabboRoomContent', 'TileCursor']);
});

test('a missing mandatory library or room bundle blocks; any other missing piece is only listed', () =>
{
    const result = coverage({
        figureLibs: ['hh_human_body', 'hh_human_item', 'hh_human_face', 'hh_pets', 'shirt_lost'],
        effectLibs: ['Dance1', 'Cat'],
        pets: ['dog'],
        available: {clothing: new Set(['hh_human_body']), effects: new Set(['Dance1']), pets: new Set(['dog']), room: new Set(ROOM_BUNDLES.filter(name => name !== 'TileCursor')), furniture: new Set()}
    });

    assert.deepEqual(result.missing.clothing, ['hh_human_item', 'hh_human_face', 'hh_pets', 'shirt_lost']);
    assert.deepEqual(result.missing.effects, ['Cat']);
    assert.deepEqual(result.missing.room, ['TileCursor']);
    // hh_pets is known absent from every source (KNOWN_ABSENT_BASE); every other hh_* lib blocks.
    assert.deepEqual(result.blocking, ['clothing/hh_human_item', 'clothing/hh_human_face', 'room/TileCursor']);
});
