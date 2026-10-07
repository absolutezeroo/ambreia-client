import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AssetLibrary} from '../src/assets/AssetLibrary';
import {AssetLibraryCollection} from '../src/assets/AssetLibraryCollection';

test('an asset library is built without a DI context and disposes cleanly', () =>
{
    const library = new AssetLibrary('test');
    const collection = new AssetLibraryCollection('test-collection');

    assert.equal(library.disposed, false);
    library.dispose();
    collection.dispose();
    assert.equal(library.disposed, true);
});
