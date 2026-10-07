// The catalogue's categories, from the class name (the palette carries no usable category).
import {test} from 'node:test';
import assert from 'node:assert/strict';
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
