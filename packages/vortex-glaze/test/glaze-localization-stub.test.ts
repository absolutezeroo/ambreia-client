import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GlazeLocalizationStub} from '../src/boot/GlazeLocalizationStub';

/** A `text` element as the window manager sees it: it only receives `localization`. */
const label = (): {localization: string; received: string[]} =>
{
    const received: string[] = [];

    return {received, set localization(value: string) { received.push(value); }, get localization() { return received.at(-1) ?? ''; }};
};

test('Localise pushes the texts to the ${key} labels, at registration and on later changes', () =>
{
    const stub = new GlazeLocalizationStub();
    const early = label();

    GlazeLocalizationStub.setTexts(null);
    stub.registerLocalizationListener('vortex.ui.active', early);
    assert.deepEqual(early.received, [], 'without texts a label is left raw, as Glaze shows untranslated captions');
    assert.equal(stub.getResolvedLocalization('vortex.ui.active'), null);

    GlazeLocalizationStub.setTexts(new Map([['vortex.ui.active', 'Actif']]));
    assert.deepEqual(early.received, ['Actif'], 'a label registered before Localise gets the text when it lands');
    assert.equal(stub.getResolvedLocalization('vortex.ui.active'), 'Actif');

    const late = label();

    stub.registerLocalizationListener('vortex.ui.active', late);
    assert.deepEqual(late.received, ['Actif'], 'a label built after Localise gets the text at once');

    stub.removeLocalizationListener('vortex.ui.active', early);
    GlazeLocalizationStub.setTexts(null);
    assert.deepEqual(early.received, ['Actif'], 'a removed listener hears nothing more');
    assert.deepEqual(late.received, ['Actif', '${vortex.ui.active}'], 'toggling Localise off puts the raw key back');
});
