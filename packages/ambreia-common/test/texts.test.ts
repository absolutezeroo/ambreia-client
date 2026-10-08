import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {AssetBundle} from '../src/assets/AssetBundle';
import {readTexts} from '../src/localization/Texts';

const bundle = (files: Record<string, object>): AssetBundle =>
    ({getText: (key: string) => key in files ? JSON.stringify(files[key]) : null}) as unknown as AssetBundle;

const habbo = bundle({
    'localizations/habbo.en.json': {'a': 'A en', 'b': 'B en', 'own': 'Habbo en'},
    'localizations/habbo.fr.json': {'a': 'A fr'}
});
const own = {
    './locales/en/x.json': {'own': 'Own en', 'only.en': 'Only en'},
    './locales/fr/x.json': {'own': 'Own fr'}
};

test('English: the Habbo texts, then Ambreia\'s own over them', () =>
{
    assert.deepEqual(readTexts(habbo, own, 'en'), {'a': 'A en', 'b': 'B en', 'own': 'Own en', 'only.en': 'Only en'});
});

test('French goes over English, so a key French lacks still reads in English', () =>
{
    assert.deepEqual(readTexts(habbo, own, 'fr'), {'a': 'A fr', 'b': 'B en', 'own': 'Own fr', 'only.en': 'Only en'});
});

test('a bundle without the Habbo texts still gives Ambreia\'s own', () =>
{
    assert.deepEqual(readTexts(bundle({}), own, 'fr'), {'own': 'Own fr', 'only.en': 'Only en'});
});
