// The creation wizard's parts (features/character/create/): its steps, the starter wardrobe.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {IFigureData} from '@ambreia/avatar/structure/IFigureData';
import {StarterWardrobe} from '../src/features/character/create/StarterWardrobe';
import {WizardSteps} from '../src/features/character/create/WizardSteps';

const draft = (values: Partial<{classId: string; name: string}>) => ({playerId: 0, name: '', figure: '', gender: 'M' as const, classId: '', ...values});

test('the wizard goes class, look, name, summary; a starter character only class then summary', () =>
{
    const steps = new WizardSteps(false);

    assert.equal(steps.neighbour(1), 'appearance');
    steps.current = 'name';
    assert.equal(steps.neighbour(1), 'confirm');
    assert.equal(steps.neighbour(-1), 'appearance');

    const starter = new WizardSteps(true);

    assert.equal(starter.neighbour(1), 'confirm');
    assert.equal(starter.neighbour(-1), 'class');
});

test('a step is done with a class chosen, a valid name not taken', () =>
{
    const steps = new WizardSteps(false);

    assert.equal(steps.done(draft({}), false), false);
    assert.equal(steps.done(draft({classId: 'mage'}), false), true);

    steps.current = 'name';
    assert.equal(steps.done(draft({name: 'Arwen'}), false), true);
    assert.equal(steps.done(draft({name: 'Arwen'}), true), false);
    assert.equal(steps.done(draft({name: 'A b'}), false), false);
});

test('the wardrobe offers the free selectable sets of a gender, and whole looks for both', () =>
{
    const set = (id: number, gender: string, selectable = true, sellable = false) => [id, {id, gender, isSelectable: selectable, isSellable: sellable}] as const;
    const color = (id: number, selectable = true) => [id, {id, isSelectable: selectable, rgb: id}] as const;
    const figureData = {
        getSetType: (type: string) => ({paletteID: 1, partSets: new Map(type === 'hr' ? [set(10, 'M'), set(11, 'F'), set(12, 'U'), set(13, 'M', false), set(14, 'M', true, true)] : [set(1, 'U')])}),
        getPalette: () => ({colors: new Map([color(7), color(8, false), color(9)]), getColor: (id: number) => ({rgb: id})})
    } as unknown as IFigureData;
    const wardrobe = new StarterWardrobe(figureData);

    assert.deepEqual(wardrobe.partSets('hr', 'M'), [10, 12]);
    assert.deepEqual(wardrobe.colors('hr'), [7, 9]);
    assert.equal(wardrobe.presets().length, 12);
    assert.deepEqual(wardrobe.presets()[0], {gender: 'M', figure: 'hd-1-7.hr-10-7.ch-1-7.lg-1-7'});
    assert.deepEqual(new StarterWardrobe(null).presets(), []);
});
