// The catalogue's categories, from the class name (the palette carries no usable category).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {catalogPlaces} from '../src/palette/catalogPlaces';
import {furnitureCategory} from '../src/palette/furnitureCategory';

test('class names sort into the catalogue categories', () =>
{
    const cases: [string, string][] = [
        ['chair_norja', 'seats'], ['sofa_silo', 'seats'], ['throne', 'seats'], ['bench_lego', 'seats'],
        ['table_norja_med', 'tables'], ['plant_big_cactus', 'plants'], ['aeki_23_plant_01', 'plants'],
        ['lamp_basic', 'lights'], ['hween_torch', 'lights'], ['rare_dragonlamp', 'rares'],
        ['floor_tiles', 'floors'], ['doormat_love', 'floors'], ['shelves_norja', 'decor'], ['qwertyuiop', 'misc']
    ];

    for(const [name, category] of cases) assert.equal(furnitureCategory(name), category, name);
});

test('class names sort into seasons with their year, rares, collections and types', () =>
{
    // 30 base classes make `habbox` a collection; its colours count once.
    const habbox = Array.from({length: 30}, (_, i) => `habbox_thing${i}`);
    const places = catalogPlaces([
        ...habbox, 'habbox_thing0*2', 'xmas12_nutcracker', 'xmas_c20_tree*3', 'xmas_tree', 'hween14_bat', 'val_c19_heart',
        'ny2015_fireworks', 'rare_r20_crate', 'rare_dragonlamp*4', 'chair_plasto', 'throne', 'clothing_hat', 'nft_ape',
        'kasja_lamp'
    ]);
    const cases: [string, string | undefined][] = [
        ['xmas12_nutcracker', 'seasons/Noël:2012'], ['xmas_c20_tree*3', 'seasons/Noël:2020'], ['xmas_tree', 'seasons/Noël'],
        ['hween14_bat', 'seasons/Halloween:2014'], ['val_c19_heart', 'seasons/Saint-Valentin:2019'], ['ny2015_fireworks', 'seasons/Nouvel an:2015'],
        ['rare_r20_crate', 'rares/Rares:2020'], ['rare_dragonlamp*4', 'rares/Rares'], ['habbox_thing7', 'collections/habbox'],
        ['habbox_thing0*2', 'collections/habbox'], ['chair_plasto', 'types/seats'], ['throne', 'types/seats'],
        ['kasja_lamp', 'types/lights'], ['clothing_hat', undefined], ['nft_ape', undefined]
    ];

    for(const [name, where] of cases)
    {
        const place = places.get(name);

        assert.equal(place && `${place.section}/${place.group}`, where, name);
    }
});
